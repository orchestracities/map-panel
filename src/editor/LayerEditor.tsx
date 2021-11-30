import React, { FC, useMemo } from 'react';
import { Select } from '@grafana/ui';
import {
  DataFrame,
  PanelOptionsEditorBuilder,
  StandardEditorContext,
  FieldOverrideContext,
  getFieldDisplayName,
  FieldType,
  Field,
} from '@grafana/data';
import { DEFAULT_BASEMAP_CONFIG, geomapLayerRegistry } from '../layers/registry';
import { OptionsPaneCategoryDescriptor } from './PanelEditor/OptionsPaneCategoryDescriptor';
import { setOptionImmutably } from './PanelEditor/utils';
import { fillOptionsPaneItems } from './PanelEditor/getVizualizationOptions';
import { GazetteerPathEditor } from './GazetteerPathEditor';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions, ExtendFrameGeometrySourceMode } from '../extension';
import { QuerySelector } from './PanelEditor/QuerySelector';

export interface LayerEditorProps<TConfig = any> {
  options?: ExtendMapLayerOptions<TConfig>;
  data: DataFrame[]; // All results
  onChange: (options: ExtendMapLayerOptions<TConfig>) => void;
  filter: (item: ExtendMapLayerRegistryItem) => boolean;
}

export const LayerEditor: FC<LayerEditorProps> = ({ options, onChange, data, filter }) => {
  // all basemaps
  const layerTypes = useMemo(() => {
    return geomapLayerRegistry.selectOptions(
      options?.type // the selected value
        ? [options.type] // as an array
        : [DEFAULT_BASEMAP_CONFIG.type],
      filter
    );
  }, [options?.type, filter]);

  // The options change with each layer type
  const optionsEditorBuilder = useMemo(() => {
    const layer = geomapLayerRegistry.getIfExists(options?.type);
    if (!layer || !(layer.registerOptionsUI || layer.showLocation || layer.showOpacity || layer.id === 'nextzen')) {
      return null;
    }

    const builder = new PanelOptionsEditorBuilder<ExtendMapLayerOptions>();
    if (layer.id === 'nextzen') {
      builder.addTextInput({
        path: 'apiKey',
        name: 'API key',
        description: 'API key for nextzen',
        settings: {},
      });
    }

    if (layer.showLocation) {
      builder
        .addTextInput({
          path: 'name',
          name: 'Name',
          description: 'Layer name',
          settings: {},
        })
        .addCustomEditor({
          id: 'query',
          path: 'query',
          name: 'Query',
          editor: QuerySelector,
          settings: {},
        })
        .addRadio({
          path: 'location.mode',
          name: 'Location',
          description: '',
          defaultValue: ExtendFrameGeometrySourceMode.Auto,
          settings: {
            options: [
              { value: ExtendFrameGeometrySourceMode.Auto, label: 'Auto' },
              { value: ExtendFrameGeometrySourceMode.Coords, label: 'Coords' },
              { value: ExtendFrameGeometrySourceMode.Geohash, label: 'Geohash' },
              { value: ExtendFrameGeometrySourceMode.Lookup, label: 'Lookup' },
              { value: ExtendFrameGeometrySourceMode.Geojson, label: 'Geojson' },
            ],
          },
        })
        .addFieldNamePicker({
          path: 'location.geojson',
          name: 'Geojson field',
          // settings: {
          //   filter: (f: Field) => f.type === FieldType.other,
          //   noFieldsMessage: 'No strings fields found',
          // },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Geojson,
        })
        .addFieldNamePicker({
          path: 'location.latitude',
          name: 'Latitude field',
          settings: {
            filter: (f: Field) => f.type === FieldType.number,
            noFieldsMessage: 'No numeric fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Coords,
        })
        .addFieldNamePicker({
          path: 'location.longitude',
          name: 'Longitude field',
          settings: {
            filter: (f: Field) => f.type === FieldType.number,
            noFieldsMessage: 'No numeric fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Coords,
        })
        .addFieldNamePicker({
          path: 'location.geohash',
          name: 'Geohash field',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No strings fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Geohash,
          // eslint-disable-next-line react/display-name
          // info: (props) => <div>HELLO</div>,
        })
        .addFieldNamePicker({
          path: 'location.lookup',
          name: 'Lookup field',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No strings fields found',
          },
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Lookup,
        })
        .addCustomEditor({
          id: 'gazetteer',
          path: 'location.gazetteer',
          name: 'Gazetteer',
          editor: GazetteerPathEditor,
          showIf: (opts) => opts.location?.mode === ExtendFrameGeometrySourceMode.Lookup,
        })
        .addFieldNamePicker({
          path: 'titleField',
          name: 'Pop up title',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No string fields found',
          },
        })
        .addFieldNamePicker({
          path: 'timeField',
          name: 'Pop up Time',
          settings: {
            filter: (f: Field) => f.type === FieldType.time,
            noFieldsMessage: 'No time fields found',
          },
        })
        .addMultiSelect({
          path: 'displayProperties',
          name: 'Properties',
          description: 'Select properties to be displayed',
          settings: {
            allowCustomValue: false,
            options: [],
            placeholder: 'All Properties',
            getOptions: async (context: FieldOverrideContext) => {
              const options = [];
              if (context && context.data && context.data.length > 0 && context.options && context.options.query) {
                const frames = context.data;
                for (let i = 0; i < frames.length; i++) {
                  if (frames[i].refId && frames[i].refId === context.options.query) {
                    const frame = context.data[i];
                    for (const field of frame.fields) {
                      const name = getFieldDisplayName(field, frame, context.data);
                      const value = field.name;
                      options.push({ value, label: name } as any);
                    }
                  }
                }
              }
              return options;
            },
          },
          showIf: (opts) => typeof opts.query !== 'undefined',
          defaultValue: '',
        });
    }
    if (layer.registerOptionsUI) {
      layer.registerOptionsUI(builder);
    }
    if (layer.showOpacity) {
      // TODO -- add opacity check
    }
    return builder;
  }, [options?.type]);

  // The react componnets
  const layerOptions = useMemo(() => {
    const layer = geomapLayerRegistry.getIfExists(options?.type);
    if (!optionsEditorBuilder || !layer) {
      return null;
    }

    const category = new OptionsPaneCategoryDescriptor({
      id: 'Layer config',
      title: 'Layer config',
    });

    const context: StandardEditorContext<any> = {
      data,
      options: options,
    };

    const currentOptions = { ...options, type: layer.id, config: { ...layer.defaultOptions, ...options?.config } };

    // Update the panel options if not set
    if (!options || (layer.defaultOptions && !options.config)) {
      onChange(currentOptions as any);
    }

    const reg = optionsEditorBuilder.getRegistry();

    // Load the options into categories
    fillOptionsPaneItems(
      reg.list(),

      // Always use the same category
      (categoryNames) => category,

      // Custom upate function
      (path: string, value: any) => {
        onChange(setOptionImmutably(currentOptions, path, value) as any);
      },
      context
    );

    return (
      <>
        <br />
        {category.items.map((item) => item.render())}
      </>
    );
  }, [optionsEditorBuilder, onChange, data, options]);

  return (
    <div>
      <Select
        menuShouldPortal
        options={layerTypes.options}
        value={layerTypes.current}
        onChange={(v) => {
          const layer = geomapLayerRegistry.getIfExists(v.value);
          if (!layer) {
            console.warn('layer does not exist', v);
            return;
          }

          onChange({
            ...options, // keep current options
            type: layer.id,
            config: { ...layer.defaultOptions }, // clone?
          });
        }}
      />

      {layerOptions}
    </div>
  );
};
