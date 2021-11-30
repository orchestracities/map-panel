import { FieldMatcher, getFieldMatcher, FieldMatcherID, DataFrame, Field, getFieldDisplayName } from '@grafana/data';
import { Geometry, Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { getGazetteer, Gazetteer } from '../gazetteer/gazetteer';
import { decodeGeohash } from './geohash';
import GeoJSON from 'ol/format/GeoJSON';
import { ExtendFrameGeometrySource, ExtendFrameGeometrySourceMode } from '../extension';

export type FieldFinder = (frame: DataFrame) => Field | undefined;

function getFieldFinder(matcher: FieldMatcher): FieldFinder {
  return (frame: DataFrame) => {
    for (const field of frame.fields) {
      if (matcher(field, frame, [])) {
        return field;
      }
    }
    return undefined;
  };
}

function matchLowerNames(names: Set<string>): FieldFinder {
  return (frame: DataFrame) => {
    for (const field of frame.fields) {
      if (names.has(field.name.toLowerCase())) {
        return field;
      }
      const disp = getFieldDisplayName(field, frame);
      if (names.has(disp)) {
        return field;
      }
    }
    return undefined;
  };
}

export interface LocationFieldMatchers {
  mode: ExtendFrameGeometrySourceMode;

  // Field mappings
  geojson: FieldFinder;
  geohash: FieldFinder;
  latitude: FieldFinder;
  longitude: FieldFinder;
  h3: FieldFinder;
  wkt: FieldFinder;
  lookup: FieldFinder;
  gazetteer?: Gazetteer;
}

const defaultMatchers: LocationFieldMatchers = {
  mode: ExtendFrameGeometrySourceMode.Auto,
  geojson: matchLowerNames(new Set(['location', 'geojson'])),
  geohash: matchLowerNames(new Set(['geohash'])),
  latitude: matchLowerNames(new Set(['latitude', 'lat'])),
  longitude: matchLowerNames(new Set(['longitude', 'lon', 'lng'])),
  h3: matchLowerNames(new Set(['h3'])),
  wkt: matchLowerNames(new Set(['wkt'])),
  lookup: matchLowerNames(new Set(['lookup'])),
};

export async function getLocationMatchers(src?: ExtendFrameGeometrySource): Promise<LocationFieldMatchers> {
  const info: LocationFieldMatchers = {
    ...defaultMatchers,
    mode: src?.mode ?? ExtendFrameGeometrySourceMode.Auto,
  };
  switch (info.mode) {
    case ExtendFrameGeometrySourceMode.Geohash:
      if (src?.geohash) {
        info.geohash = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geohash }));
      }
      break;
    case ExtendFrameGeometrySourceMode.Lookup:
      if (src?.lookup) {
        info.lookup = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.lookup }));
      }
      info.gazetteer = await getGazetteer(src?.gazetteer);
      break;
    case ExtendFrameGeometrySourceMode.Coords:
      if (src?.latitude) {
        info.latitude = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.latitude }));
      }
      if (src?.longitude) {
        info.longitude = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.longitude }));
      }
      break;
    case ExtendFrameGeometrySourceMode.Geojson:
      if (src?.geojson) {
        info.geojson = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geojson }));
      }
      break;
  }
  return info;
}
export interface LocationFields {
  mode: ExtendFrameGeometrySourceMode;

  // Field mappings
  geojson?: Field;
  geohash?: Field;
  latitude?: Field;
  longitude?: Field;
  h3?: Field;
  wkt?: Field;
  lookup?: Field;
}

export function getLocationFields(frame: DataFrame, location: LocationFieldMatchers): LocationFields {
  const fields: LocationFields = {
    mode: location.mode ?? ExtendFrameGeometrySourceMode.Auto,
  };

  // Find the best option
  if (fields.mode === ExtendFrameGeometrySourceMode.Auto) {
    fields.geojson = location.geojson(frame);
    if (fields.geojson) {
      fields.mode = ExtendFrameGeometrySourceMode.Geojson;
      return fields;
    }
    fields.latitude = location.latitude(frame);
    fields.longitude = location.longitude(frame);
    if (fields.latitude && fields.longitude) {
      fields.mode = ExtendFrameGeometrySourceMode.Coords;
      return fields;
    }
    fields.geohash = location.geohash(frame);
    if (fields.geohash) {
      fields.mode = ExtendFrameGeometrySourceMode.Geohash;
      return fields;
    }
    fields.lookup = location.geohash(frame);
    if (fields.lookup) {
      fields.mode = ExtendFrameGeometrySourceMode.Lookup;
      return fields;
    }
  }

  switch (fields.mode) {
    case ExtendFrameGeometrySourceMode.Geojson:
      fields.geojson = location.geojson(frame);
      break;
    case ExtendFrameGeometrySourceMode.Coords:
      fields.latitude = location.latitude(frame);
      fields.longitude = location.longitude(frame);
      break;
    case ExtendFrameGeometrySourceMode.Geohash:
      fields.geohash = location.geohash(frame);
      break;
    case ExtendFrameGeometrySourceMode.Lookup:
      fields.lookup = location.lookup(frame);
      break;
  }

  return fields;
}

export interface LocationInfo {
  warning?: string;
  points: Geometry[];
}

export function dataFrameToPoints(frame: DataFrame, location: LocationFieldMatchers): LocationInfo {
  const info: LocationInfo = {
    points: [],
  };
  if (!frame?.length) {
    return info;
  }
  const fields = getLocationFields(frame, location);
  switch (fields.mode) {
    case ExtendFrameGeometrySourceMode.Geojson:
      if (fields.geojson) {
        info.points = getGeometryFromGeoJSON(fields.geojson);
      } else {
        info.warning = 'Missing latitude/longitude fields';
      }
      break;
    case ExtendFrameGeometrySourceMode.Coords:
      if (fields.latitude && fields.longitude) {
        info.points = getPointsFromLonLat(fields.longitude, fields.latitude);
      } else {
        info.warning = 'Missing latitude/longitude fields';
      }
      break;

    case ExtendFrameGeometrySourceMode.Geohash:
      if (fields.geohash) {
        info.points = getPointsFromGeohash(fields.geohash);
      } else {
        info.warning = 'Missing geohash field';
      }
      break;

    case ExtendFrameGeometrySourceMode.Lookup:
      if (fields.lookup) {
        if (location.gazetteer) {
          info.points = getPointsFromGazetteer(location.gazetteer, fields.lookup);
        } else {
          info.warning = 'Gazetteer not found';
        }
      } else {
        info.warning = 'Missing lookup field';
      }
      break;

    case ExtendFrameGeometrySourceMode.Auto:
      info.warning = 'Unable to find location fields';
  }

  return info;
}

function getGeometryFromGeoJSON(geojson: Field<String>): Geometry[] {
  const count = geojson.values.length;
  const points = new Array<Geometry>(count);
  for (let i = 0; i < geojson.values.length; i++) {
    points[i] = geojson.values.get(i)
      ? new GeoJSON().readGeometry(geojson.values.get(i), { featureProjection: 'EPSG:3857' })
      : new Geometry();
  }
  return points;
}

function getPointsFromLonLat(lon: Field<number>, lat: Field<number>): Point[] {
  const count = lat.values.length;
  const points = new Array<Point>(count);
  for (let i = 0; i < count; i++) {
    points[i] = new Point(fromLonLat([lon.values.get(i), lat.values.get(i)]));
  }
  return points;
}

function getPointsFromGeohash(field: Field<string>): Point[] {
  const count = field.values.length;
  const points = new Array<Point>(count);
  for (let i = 0; i < count; i++) {
    const coords = decodeGeohash(field.values.get(i));
    if (coords) {
      points[i] = new Point(fromLonLat(coords));
    }
  }
  return points;
}

function getPointsFromGazetteer(gaz: Gazetteer, field: Field<string>): Point[] {
  const count = field.values.length;
  const points = new Array<Point>(count);
  for (let i = 0; i < count; i++) {
    const info = gaz.find(field.values.get(i));
    if (info?.coords) {
      points[i] = new Point(fromLonLat(info.coords));
    }
  }
  return points;
}
