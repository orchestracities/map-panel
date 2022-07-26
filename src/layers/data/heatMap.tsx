import { FieldType, getFieldColorModeForField, getScaleCalculator, GrafanaTheme2, PanelData } from '@grafana/data';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import * as layer from 'ol/layer';
import { getLocationMatchers } from '../../utils/location';
import { FrameVectorSource } from '../../utils/frameVectorSource';
import { ScaleDimensionConfig, getScaledDimension } from '../../dimensions';
import { ScaleDimensionEditor } from '../../dimensions/editors';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions } from 'extension';
import { isNumber } from 'lodash';

// Configuration options for Heatmap overlays
export interface HeatmapConfig {
  weight: ScaleDimensionConfig;
  blur: number;
  radius: number;
}

const defaultOptions: HeatmapConfig = {
  weight: {
    fixed: 1,
    min: 0,
    max: 1,
  },
  blur: 15,
  radius: 5,
};

/**
 * Map layer configuration for heatmap overlay
 */
export const heatmapLayer: ExtendMapLayerRegistryItem<HeatmapConfig> = {
  id: 'heatmap',
  name: 'Heatmap',
  description: 'visualizes a heatmap of the data',
  isBaseMap: false,
  showLocation: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: Map, options: ExtendMapLayerOptions<HeatmapConfig>, theme: GrafanaTheme2) => {
    const config = { ...defaultOptions, ...options.config };
    const matchers = await getLocationMatchers(options.location);
    const source = new FrameVectorSource<Point>(matchers);
    const WEIGHT_KEY = '_weight';

    // Create a new Heatmap layer
    // Weight function takes a feature as attribute and returns a normalized weight value
    const vectorLayer = new layer.Heatmap({
      source: source,
      blur: config.blur,
      radius: config.radius,
      weight: function (feature) {
        return feature.get(WEIGHT_KEY);
      },
    });

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
            f.set(WEIGHT_KEY, weightDim.get(idx));
          }
        });

        // Set heatmap gradient colors
        let colors = ['#00f', '#0ff', '#0f0', '#ff0', '#f00'];

        // Either the configured field or the first numeric field value
        const field = weightDim.field ?? frame.fields.find((field) => field.type === FieldType.number);
        if (field) {
          const colorMode = getFieldColorModeForField(field);
          if (colorMode.isContinuous && colorMode.getColors) {
            // getColors return an array of color string from the color scheme chosen
            colors = colorMode.getColors(theme);
          }
          if (colorMode.isByValue) {
            const scale = getScaleCalculator(field, theme);
            colors = [];
            let min = field.config.min;
            let max = field.config.max;
            if (!isNumber(min)) {
              min = 0;
            }
            if (!isNumber(max)) {
              max = 100;
            }
            let delta = max! - min!;
            let steps = 10;
            for (let i = 0; i < steps; i++) {
              let value = i * (delta / steps);
              let color = scale(value).color;
              colors.push(color);
            }
          }
        }
        vectorLayer.setGradient(colors);
      },
    };
  },
  // Heatmap overlay options
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
          max: 1,
          hideRange: true, // Don't show the scale factor
        },
        defaultValue: {
          // Configured values
          fixed: 1,
          min: 0,
          max: 1,
        },
      })
      .addSliderInput({
        path: 'config.radius',
        description: 'configures the size of clusters',
        name: 'Radius',
        defaultValue: defaultOptions.radius,
        settings: {
          min: 1,
          max: 50,
          step: 1,
        },
      })
      .addSliderInput({
        path: 'config.blur',
        description: 'configures the amount of blur of clusters',
        name: 'Blur',
        defaultValue: defaultOptions.blur,
        settings: {
          min: 1,
          max: 50,
          step: 1,
        },
      });
  },
  // fill in the default values
  defaultOptions,
};
