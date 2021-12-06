import { DataFrame, Field, getFieldColorModeForField, getScaleCalculator, GrafanaTheme2 } from '@grafana/data';
import { ScaleCalculator } from '@grafana/data/field/scale';
import { ColorDimensionConfig, DimensionSupplier } from './types';
import { findField, getLastNotNullFieldValue } from './utils';

//---------------------------------------------------------
// Color dimension
//---------------------------------------------------------

export function getColorDimension(
  frame: DataFrame | undefined,
  config: ColorDimensionConfig,
  theme: GrafanaTheme2
): DimensionSupplier<string> {
  return getColorDimensionForField(findField(frame, config.field), config, theme);
}

export function getColorDimensionForField(
  field: Field | undefined,
  config: ColorDimensionConfig,
  theme: GrafanaTheme2
): DimensionSupplier<string> {
  if (!field) {
    const v = theme.visualization.getColorByName(config.fixed) ?? 'grey';
    return {
      isAssumed: Boolean(config.field?.length) || !config.fixed,
      fixed: v,
      value: () => v,
      get: (i) => v,
    };
  }
  const mode = getFieldColorModeForField(field);
  if (!mode.isByValue) {
    const fixed = mode.getCalculator(field, theme)(0, 0);
    return {
      fixed,
      value: () => fixed,
      get: (i) => fixed,
      field,
    };
  }
  const scale = getScaleCalculator(field, theme);
  return {
    get: (i) => {
      const val = field.values.get(i);
      return computeColor(scale, field.config?.mappings, val, theme);
    },
    field,
    value: () => scale(getLastNotNullFieldValue(field)).color,
  };
}

function computeColor(scale: ScaleCalculator, mapping: any, value: any, theme: GrafanaTheme2) {
  let color = scale(value).color;
  mapping.forEach((map: any) => {
    if (map.type === 'value') {
      Object.keys(map.options).forEach((key) => {
        if (key === value && map.options[key].color) {
          let colorName = map.options[key].color ?? 'grey';
          color = theme.visualization.getColorByName(colorName);
        }
      });
    }
  });
  return color;
}
