import Map from 'ol/Map';
import TopoJSON from 'ol/format/TopoJSON';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Fill, Stroke, Style } from 'ol/style';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import RenderFeature from 'ol/render/Feature';

function createOLStyle() {
  var fill = new Fill({ color: '' });
  var stroke = new Stroke({ color: '', width: 1 });
  var polygon = new Style({ fill: fill, stroke: stroke });
  var line = new Style({ stroke: stroke });

  let styles: Style[] = [];
  return function (feature: Feature<Geometry> | RenderFeature, resolution: number) {
    //console.log('=============>>> feature', feature,resolution);
    var length = 0;
    var layer = feature.get('layer');
    var kind = feature.get('kind');
    var geometry = feature.getGeometry();
    if (geometry) {
      let geometryType = geometry.getType();

      //console.log(layer, kind, geom);

      //water
      if (
        (layer === 'water' && kind === 'water-layer') ||
        (layer === 'water' && kind === 'river') ||
        (layer === 'water' && kind === 'stream') ||
        (layer === 'water' && kind === 'canal')
      ) {
        stroke.setColor('#9DD9D2');
        stroke.setWidth(1.5);
        styles[length++] = line;
      } else if (layer === 'water' && kind === 'riverbank') {
        fill.setColor('#9DD9D2');
        stroke.setWidth(1.5);
        styles[length++] = polygon;
      } else if (
        (layer === 'water' && kind === 'water_boundary') ||
        (layer === 'water' && kind === 'ocean_boundary') ||
        (layer === 'water' && kind === 'riverbank_boundary')
      ) {
        stroke.setColor('#93cbc4');
        stroke.setWidth(0.5);
        styles[length++] = line;
      } else if (layer === 'water' || layer === 'ocean' || layer === 'lake') {
        fill.setColor('#9DD9D2');
        styles[length++] = polygon;
      } else if (layer === 'aeroway' && geometryType === 'Polygon') {
        fill.setColor('#9DD9D2');
        styles[length++] = polygon;
      } else if (layer === 'aeroway' && geometryType === 'LineString' && resolution <= 76.43702828517625) {
        stroke.setColor('#f0ede9');
        stroke.setWidth(1);
        styles[length++] = line;
      }

      //parks
      else if (
        (layer === 'landuse' && kind === 'park') ||
        (layer === 'landuse' && kind === 'national_park') ||
        (layer === 'landuse' && kind === 'nature_reserve') ||
        (layer === 'landuse' && kind === 'wood') ||
        (layer === 'landuse' && kind === 'park') ||
        (layer === 'landuse' && kind === 'grass') ||
        (layer === 'landuse' && kind === 'protected_land')
      ) {
        fill.setColor('#88D18A');
        styles[length++] = polygon;
      }

      //boundaries
      else if (layer === 'boundaries' && kind === 'country') {
        stroke.setColor('#ffffff');
        stroke.setWidth(1.5);
        styles[length++] = line;
      } else if (layer === 'boundaries' && (kind === 'region' || kind === 'macroregion')) {
        stroke.setColor('#aaaaaa');
        stroke.setWidth(0.5);
        styles[length++] = line;
      }

      //roads
      else if (layer === 'roads' && kind === 'highway') {
        stroke.setColor('#FA4A48');
        stroke.setWidth(4);
        styles[length++] = line;
      } else if (layer === 'roads' && kind === 'major_road') {
        stroke.setColor('#999');
        stroke.setWidth(2);
        styles[length++] = line;
      } else if (layer === 'roads' && kind === 'minor_road') {
        stroke.setColor('#ccc');
        stroke.setWidth(1);
        styles[length++] = line;
      } else if (layer === 'roads') {
        stroke.setColor('#fff');
        stroke.setWidth(0.5);
        styles[length++] = line;

        // transit
      } else if (layer === 'transit' && kind === 'train') {
        stroke.setColor('#ffffcc');
        stroke.setWidth(1);
        styles[length++] = line;
      }

      //building
      else if (resolution < 10 && layer === 'places') {
        fill.setColor('#cccccc');
        stroke.setWidth(2);
        stroke.setColor('#ffffff');
        styles[length++] = polygon;
      }
      //building
      else if (resolution < 10 && layer === 'buildings') {
        fill.setColor('#ffffff');
        stroke.setWidth(2);
        stroke.setColor('#f2f2f2');
        styles[length++] = polygon;
      }

      styles.length = length;
      return styles;
    }
    return new Style();
  };
}

export const nexten: ExtendMapLayerRegistryItem = {
  id: 'nextzen',
  name: 'Next Zen map',
  isBaseMap: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: Map, options: ExtendMapLayerOptions) => ({
    init: () => {
      return new VectorTileLayer({
        source: new VectorTileSource({
          attributions:
            '&copy; OpenStreetMap contributors, Who’s On First, ' + 'Natural Earth, and openstreetmapdata.com',
          format: new TopoJSON({
            layerName: 'layer',
            layers: ['water', 'transit', 'buildings', 'places', 'pois', 'roads', 'landuse', 'boundaries'],
          }),
          maxZoom: 16,
          url: 'https://tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=' + options.apiKey,
        }),
        style: createOLStyle(),
      });
    },
  }),
};

export const nextenLayers = [nexten];
