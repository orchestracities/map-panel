import { FieldType, getFieldColorModeForField, getScaleCalculator, GrafanaTheme2, PanelData } from '@grafana/data';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import IDW from 'ol-ext/source/IDW';
import * as layer from 'ol/layer';
import { getLocationMatchers } from '../../utils/location';
import { FrameVectorSource } from '../../utils/frameVectorSource';
import { ScaleDimensionConfig, getScaledDimension } from '../../dimensions';
import { ScaleDimensionEditor } from '../../dimensions/editors';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions } from 'extension';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';
import { Stroke, Style, Text } from 'ol/style';

// Configuration options for Heatmap overlays
export interface IdwMapConfig {
  weight: ScaleDimensionConfig;
  scale: number;
  showData?: boolean;
  showPopup?: boolean;
}

const defaultOptions: IdwMapConfig = {
  weight: {
    fixed: 1,
    min: 0,
    max: Infinity,
  },
  showData: false,
  showPopup: false,
  scale: 4,
};

/**
 * Map layer configuration for heatmap overlay
 */
export const idwmapLayer: ExtendMapLayerRegistryItem<IdwMapConfig> = {
  id: 'idwmap',
  name: 'IDW Interpolation',
  description: 'visualizes a Inverse Distance Weighted Interpolation',
  isBaseMap: false,
  showLocation: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: Map, options: ExtendMapLayerOptions<IdwMapConfig>, theme: GrafanaTheme2) => {
    const config = { ...defaultOptions, ...options.config };
    const matchers = await getLocationMatchers(options.location);
    const source = new FrameVectorSource<Point>(matchers);
    const WEIGHT_KEY = '_weight';

    // Create a new IDW source
    // Weight function takes a feature as attribute and returns a normalized weight value
    var idw = new IDW({
      // Source that contains the data
      source: source,
      scale: config.scale,
      // Use val as weight property
      weight: function (feature) {
        return feature.get(WEIGHT_KEY);
      },
    });

    // Create a new Image layer
    const imageLayer = new layer.Image({
      source: idw,
      opacity: .5
    });

    let dataLayer = new layer.Vector();

    if(config.showData){
      dataLayer = new layer.Vector({
        title: options.name,
        displayProperties: options.displayProperties,
//        icon: options.config?.selectIcon,
        titleField: options.titleField,
        timeField: options.timeField,
        source: idw.getSource(),
        style: function(f: any) {
          return new Style({
            // image: new ol.style.Circle({ radius: 2, fill: new ol.style.Fill({ color: '#000' }) }),
            text: new Text({
              text: f.get(WEIGHT_KEY).toString(),
              stroke: new Stroke({ color: [255,255,255,128], width: 1.25 }),
            })
          });
        },
      } as BaseLayerOptions);
    }

    const vectorLayer = new layer.Group({
      layers: [imageLayer, dataLayer],
      title: options.name,
      combine: true,
    } as GroupLayerOptions);

    return {
      init: () => vectorLayer,
      update: (data: PanelData) => {
        const frame = data.series[0];
        if (!frame) {
          return;
        }
        source.update(frame);
        
        const weightDim = getScaledDimension(frame, config.weight);
        source.forEachFeature((f) => {
          const idx = f.get('rowIndex') as number;
          if (idx != null) {
            let value = weightDim.get(idx)
            f.set(WEIGHT_KEY, value);
          }
        });

        // Either the configured field or the first numeric field value
        const field = weightDim.field ?? frame.fields.find((field) => field.type === FieldType.number);
        if (field) {
          const colorMode = getFieldColorModeForField(field);
          if (colorMode.isByValue) {
            const scale = getScaleCalculator(field, theme);
            idw.getColor = function(v) {
              console.log(v);
              let color = scale(v).color;
              return [
                parseInt(color.slice(1, 3), 16), 
                parseInt(color.slice(3, 5), 16),
                parseInt(color.slice(5, 7), 16),
                255
              ]
            };
          }
        }
      },
    };
  },
  // IDW overlay options
  registerOptionsUI: (builder) => {
    builder
      .addCustomEditor({
        id: 'config.weight',
        path: 'config.weight',
        name: 'Weight values',
        description: 'Scale the distribution for each row',
        editor: ScaleDimensionEditor,
        settings: {
          min: 0, // no contribution
          max: Infinity,
          //hideRange: true, // Don't show the scale factor
        },
        defaultValue: {
          // Configured values
          fixed: 1,
          min: 0,
          max: Infinity,
        },
      })
      .addSliderInput({
        path: 'config.scale',
        description: 'configures the precision of the interpolation',
        name: 'Scale',
        defaultValue: defaultOptions.scale,
        settings: {
          min: 0,
          max: 100,
          step: 1,
        },
      }).addBooleanSwitch({
        path: 'config.showData',
        name: 'Show data',
        description: 'Show data',
        defaultValue: defaultOptions.showData,
      }).addBooleanSwitch({
        path: 'config.showPopup',
        name: 'Show pop up',
        description: 'Show pop up',
        defaultValue: defaultOptions.showPopup,
      });
  },
  // fill in the default values
  defaultOptions,
};
