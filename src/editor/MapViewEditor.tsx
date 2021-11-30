import React, { FC, useMemo, useCallback } from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { Button, InlineField, InlineFieldRow, Select, VerticalGroup } from '@grafana/ui';
import { GeomapPanelOptions, MapViewConfig } from '../types';
import { centerPointRegistry, MapCenterID } from '../view';
import { NumberInput } from '../dimensions/editors/NumberInput';
import { lastGeomapPanelInstance } from '../GeomapPanel';
import { toLonLat } from 'ol/proj';
import { createEmpty, extend, getCenter } from 'ol/extent';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import LayerGroup from 'ol/layer/Group';
import { isEqual } from 'lodash';

export const MapViewEditor: FC<StandardEditorProps<MapViewConfig, any, GeomapPanelOptions>> = ({
  value,
  onChange,
  context,
}) => {
  const labelWidth = 10;

  const views = useMemo(() => {
    const ids: string[] = [];
    if (value?.id) {
      ids.push(value.id);
    } else {
      ids.push(centerPointRegistry.list()[0].id);
    }
    return centerPointRegistry.selectOptions(ids);
  }, [value?.id]);

  const onSetCurrentView = useCallback(() => {
    const map = lastGeomapPanelInstance?.map;
    if (map) {
      const view = map.getView();
      const coords = view.getCenter();
      if (coords) {
        const center = toLonLat(coords, view.getProjection());
        onChange({
          ...value,
          id: MapCenterID.Coordinates,
          lon: +center[0].toFixed(6),
          lat: +center[1].toFixed(6),
          zoom: +view.getZoom()!.toFixed(2),
        });
      }
    }
  }, [value, onChange]);

  const computeExtent: any = (layer: any, extent: number[]) => {
    if (layer instanceof VectorLayer) {
      let source = layer.getSource();
      if (source !== undefined && source instanceof Vector) {
        let features = source.getFeatures();
        for (var feature of features) {
          let geo = feature.getGeometry();
          if (geo) {
            extend(extent, geo.getExtent());
          }
        }
      }
    }
  };

  const onSelectView = useCallback(
    (selection: SelectableValue<string>) => {
      const v = centerPointRegistry.getIfExists(selection.value);
      if (v && v.id !== MapCenterID.Auto) {
        onChange({
          ...value,
          id: v.id,
          lat: v.lat ?? value?.lat,
          lon: v.lon ?? value?.lon,
          zoom: v.zoom ?? value?.zoom,
        });
      } else if (v && v.id === MapCenterID.Auto) {
        const map = lastGeomapPanelInstance?.map;
        if (map) {
          let extent = createEmpty();
          const layers = map.getLayers().getArray();
          for (var layer of layers) {
            computeExtent(layer, extent);
            if (layer instanceof LayerGroup) {
              const groupLayers = layer.getLayersArray();
              for (var l of groupLayers) {
                computeExtent(l, extent);
              }
            }
          }
          if (!isEqual(extent, createEmpty())) {
            let view = map.getView();
            let coords = view.getCenter();
            coords = getCenter(extent);
            view.fit(extent);
            let zoom = view.getZoom();
            if (coords && zoom) {
              const center = toLonLat(coords, view.getProjection());
              onChange({
                ...value,
                id: v.id,
                lon: +center[0].toFixed(6),
                lat: +center[1].toFixed(6),
                zoom: +zoom.toFixed(0),
              });
            }
          }
        }
      }
    },
    [value, onChange]
  );

  return (
    <>
      <InlineFieldRow>
        <InlineField label="View" labelWidth={labelWidth} grow={true}>
          <Select menuShouldPortal options={views.options} value={views.current} onChange={onSelectView} />
        </InlineField>
      </InlineFieldRow>
      {value?.id === MapCenterID.Coordinates && (
        <>
          <InlineFieldRow>
            <InlineField label="Latitude" labelWidth={labelWidth} grow={true}>
              <NumberInput
                value={value.lat}
                min={-90}
                max={90}
                step={0.001}
                onChange={(v) => {
                  onChange({ ...value, lat: v });
                }}
              />
            </InlineField>
          </InlineFieldRow>
          <InlineFieldRow>
            <InlineField label="Longitude" labelWidth={labelWidth} grow={true}>
              <NumberInput
                value={value.lon}
                min={-180}
                max={180}
                step={0.001}
                onChange={(v) => {
                  onChange({ ...value, lon: v });
                }}
              />
            </InlineField>
          </InlineFieldRow>
        </>
      )}

      <InlineFieldRow>
        <InlineField label="Zoom" labelWidth={labelWidth} grow={true}>
          <NumberInput
            value={value?.zoom ?? 1}
            min={1}
            max={18}
            step={0.01}
            onChange={(v) => {
              onChange({ ...value, zoom: v });
            }}
          />
        </InlineField>
      </InlineFieldRow>

      <VerticalGroup>
        <Button variant="secondary" size="sm" fullWidth onClick={onSetCurrentView}>
          <span>Use current map settings</span>
        </Button>
      </VerticalGroup>
    </>
  );
};
