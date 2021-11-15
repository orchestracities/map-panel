import {
  DataFrame,
  PanelData,
  Field,
  FieldType,
  NumericRange,
  getFieldDisplayName,
  reduceField,
  ReducerID,
} from '@grafana/data';
import {
  getColorDimension,
  getScaledDimension,
  getTextDimension,
  getResourceDimension,
  ColorDimensionConfig,
  DimensionSupplier,
  ResourceDimensionConfig,
  ScaleDimensionConfig,
  TextDimensionConfig,
} from '.';
import { config } from '@grafana/runtime';
import { isNumber } from 'lodash';

export function getMinMaxAndDelta(field: Field): NumericRange {
  if (field.type !== FieldType.number) {
    return { min: 0, max: 100, delta: 100 };
  }

  // Calculate min/max if required
  let min = field.config.min;
  let max = field.config.max;

  if (!isNumber(min) || !isNumber(max)) {
    if (field.values && field.values.length) {
      const stats = reduceField({ field, reducers: [ReducerID.min, ReducerID.max] });
      if (!isNumber(min)) {
        min = stats[ReducerID.min];
      }
      if (!isNumber(max)) {
        max = stats[ReducerID.max];
      }
    } else {
      min = 0;
      max = 100;
    }
  }

  return {
    min,
    max,
    delta: max! - min!,
  };
}

export function getColorDimensionFromData(
  data: PanelData | undefined,
  cfg: ColorDimensionConfig
): DimensionSupplier<string> {
  if (data?.series && cfg.field) {
    for (const frame of data.series) {
      const d = getColorDimension(frame, cfg, config.theme2);
      if (!d.isAssumed || data.series.length === 1) {
        return d;
      }
    }
  }
  return getColorDimension(undefined, cfg, config.theme2);
}

export function getScaleDimensionFromData(
  data: PanelData | undefined,
  cfg: ScaleDimensionConfig
): DimensionSupplier<number> {
  if (data?.series && cfg.field) {
    for (const frame of data.series) {
      const d = getScaledDimension(frame, cfg);
      if (!d.isAssumed || data.series.length === 1) {
        return d;
      }
    }
  }
  return getScaledDimension(undefined, cfg);
}

export function getResourceDimensionFromData(
  data: PanelData | undefined,
  cfg: ResourceDimensionConfig
): DimensionSupplier<string> {
  if (data?.series && cfg.field) {
    for (const frame of data.series) {
      const d = getResourceDimension(frame, cfg);
      if (!d.isAssumed || data.series.length === 1) {
        return d;
      }
    }
  }
  return getResourceDimension(undefined, cfg);
}

export function getTextDimensionFromData(
  data: PanelData | undefined,
  cfg: TextDimensionConfig
): DimensionSupplier<string> {
  if (data?.series && cfg.field) {
    for (const frame of data.series) {
      const d = getTextDimension(frame, cfg);
      if (!d.isAssumed || data.series.length === 1) {
        return d;
      }
    }
  }
  return getTextDimension(undefined, cfg);
}

export function findField(frame?: DataFrame, name?: string): Field | undefined {
  if (!frame || !name?.length) {
    return undefined;
  }

  for (const field of frame.fields) {
    if (name === field.name) {
      return field;
    }
    const disp = getFieldDisplayName(field, frame);
    if (name === disp) {
      return field;
    }
  }
  return undefined;
}

export function findFieldIndex(frame?: DataFrame, name?: string): number | undefined {
  if (!frame || !name?.length) {
    return undefined;
  }

  for (let i = 0; i < frame.fields.length; i++) {
    const field = frame.fields[i];
    if (name === field.name) {
      return i;
    }
    const disp = getFieldDisplayName(field, frame);
    if (name === disp) {
      return i;
    }
  }
  return undefined;
}

export function getLastNotNullFieldValue<T>(field: Field): T {
  const calcs = field.state?.calcs;
  if (calcs) {
    const v = calcs[ReducerID.lastNotNull];
    if (v != null) {
      return v as T;
    }
  }

  const data = field.values;
  let idx = data.length - 1;
  while (idx >= 0) {
    const v = data.get(idx--);
    if (v != null) {
      return v;
    }
  }
  return undefined as any;
}
