import React, { ReactNode } from 'react';
import {
  PanelData,
  GrafanaTheme2,
  formattedValueToString,
  getScaleCalculator,
  getFieldColorModeForField,
} from '@grafana/data';
import GeoMap from 'ol/Map';
import Feature from 'ol/Feature';
import { Geometry, Point } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import FontSymbol from 'ol-ext/style/FontSymbol';
import Shadow from 'ol-ext/style/Shadow';
import 'ol-ext/style/FontAwesomeDef.js';
import 'ol-ext/style/FontMaki2Def.js';
import 'ol-ext/style/FontMakiDef.js';
import { Cluster } from 'ol/source.js';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';

import { getCenter } from 'ol/extent';

import tinycolor from 'tinycolor2';
import { dataFrameToPoints, getLocationMatchers } from '../../utils/location';
import { ExtendMapLayerRegistryItem, ExtendFrameGeometrySourceMode, ExtendMapLayerOptions } from '../../extension';
import {
  ColorDimensionConfig,
  ScaleDimensionConfig,
  getScaledDimension,
  getColorDimension,
  findField,
} from '../../dimensions';
import { ScaleDimensionEditor, ColorDimensionEditor } from '../../dimensions/editors';
import { ObservablePropsWrapper } from '../../components/ObservablePropsWrapper';
import { MarkersLegend, MarkersLegendProps } from './MarkersLegend';
import { circleMarker, markerMakers } from '../../utils/regularShapes';
import { ReplaySubject } from 'rxjs';
import { Fill, Image, Stroke, Style, Text } from 'ol/style';
import RenderFeature from 'ol/render/Feature';
import 'static/css/fontmaki2.css';
import 'static/css/fontmaki.css';

// Configuration options for Circle overlays
export interface MarkersConfig {
  size: ScaleDimensionConfig;
  color: ColorDimensionConfig;
  fillOpacity: number;
  shape?: string;
  showLegend?: boolean;
  showPin?: boolean;
  iconSize?: number;
  enableGradient?: boolean;
  enableShadow?: boolean;
  pinShape?: any;
  cluster?: boolean;
  clusterDistance?: number;
  clusterMinDistance?: number;
  clusterValue?: string;
  selectIcon?: any;
}

const defaultOptions: MarkersConfig = {
  size: {
    fixed: 5,
    min: 2,
    max: 15,
  },
  color: {
    fixed: 'dark-green', // picked from theme
  },
  fillOpacity: 0.4,
  shape: 'circle',
  showLegend: true,
  showPin: false,
  enableGradient: false,
  enableShadow: false,
  pinShape: 'marker',
  iconSize: 9,
  cluster: false,
  clusterDistance: 20,
  clusterMinDistance: 0,
  clusterValue: 'size',
};

export const MARKERS_LAYER_ID = 'markers';

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto,
  },
};

enum pinshape {
  circle = 'circle',
  poi = 'poi',
  bubble = 'bubble',
  marker = 'marker',
  coma = 'coma',
  shield = 'shield',
  blazon = 'blazon',
  bookmark = 'bookmark',
  hexagon = 'hexagon',
  diamond = 'diamond',
  triangle = 'triangle',
  sign = 'sign',
  ban = 'ban',
  lozenge = 'lozenge',
  square = 'square',
}

/**
 * Map layer configuration for circle overlay
 */
export const markersLayer: ExtendMapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Markers',
  description: 'use markers to render each data point',
  isBaseMap: false,
  showLocation: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: GeoMap, options: ExtendMapLayerOptions<MarkersConfig>, theme: GrafanaTheme2) => {
    const matchers = await getLocationMatchers(options.location);

    const geometryLayer = new layer.Vector({
      title: options.name,
      displayProperties: options.displayProperties,
      icon: options.config?.selectIcon,
      titleField: options.titleField,
      timeField: options.timeField,
    } as BaseLayerOptions);

    function clusterStyle(customStyle: any, customValue: string) {
      let pin = options.config?.showPin ?? defaultOptions.showPin;
      let style = new Style({
        image: new FontSymbol({
          radius: 20,
          fontSize: 0.3,
          form: 'circle',
          color: '#fff',
          glyph: pin ? config.selectIcon : '',
          fill: new Fill({
            color: tinycolor(customStyle).setAlpha(0.4).toRgbString(),
          }),
          offsetY: -8,
        }),
        text: new Text({
          font: '12px Verdana-Bold',
          fill: new Fill({
            color: '#fff',
          }),
          offsetY: 6,
        }),
      });

      style.getText().setText(customValue);
      return style;
    }

    function computeSum(features: Array<Feature<Geometry>>) {
      let sum = 0;
      const configSize = config.size;
      features.forEach(function (f: Feature<Geometry>) {
        if (configSize.field) {
          const properties = f.getProperties();
          const fields = properties.frame.fields;
          const rowIndex = properties.rowIndex;
          if (Array.isArray(fields)) {
            fields.forEach(function (field) {
              if (field.name === configSize.field) {
                sum += field.values.buffer[rowIndex];
              }
            });
          }
        }
      });
      return sum;
    }

    function computeColor(field: any, config: any, value: any) {
      if (!field) {
        return theme.visualization.getColorByName(config.fixed) ?? 'grey';
      }
      const mode = getFieldColorModeForField(field);
      if (!mode.isByValue) {
        return mode.getCalculator(field, theme)(0, 0);
      }
      const scale = getScaleCalculator(field, theme);
      return scale(value).color;
    }

    function computeClusterValue(features: Array<Feature<Geometry>>) {
      switch (options.config?.clusterValue) {
        case 'size':
          return features.length;
        case 'sum':
          return computeSum(features);
        case 'average':
          return (computeSum(features) / features.length).toFixed(2);
        default:
          return NaN;
      }
    }

    function formatClusterValue(features: Array<Feature<Geometry>>, value: any) {
      switch (options.config?.clusterValue) {
        case 'size':
          return String(value);
        case 'sum':
          return String(formatValue(features, value));
        case 'average':
          return String(formatValue(features, value));
        default:
          return '';
      }
    }

    function formatValue(features: Array<Feature<Geometry>>, value: any) {
      const configSize = config.size;
      let output = value;
      features.forEach(function (f: Feature<Geometry>) {
        if (configSize.field) {
          const properties = f.getProperties();
          const fields = properties.frame.fields;
          if (Array.isArray(fields)) {
            fields.forEach(function (field) {
              if (field.name === configSize.field && field.display) {
                output = formattedValueToString(field.display(value));
              }
            });
          }
        }
      });
      return output;
    }

    function markerStyle(customStyle: any) {
      const enableShadow = options.config?.enableShadow ?? defaultOptions.enableShadow;
      const enableGradient = options.config?.enableGradient ?? defaultOptions.enableGradient;
      let styles: Style[] = [];
      if (enableShadow) {
        styles.push(
          new Style({
            image: new Shadow({
              radius: 10,
              blur: 5,
              offsetX: 0,
              offsetY: 0,
              fill: new Fill({
                color: 'rgba(255,255,255,0.4)',
              }),
            }),
          })
        );
      }
      styles.push(
        new Style({
          image: new FontSymbol({
            form: config.pinShape,
            fontSize: 0.5,
            color: '#fff',
            radius: config.iconSize,
            glyph: config.selectIcon,
            offsetY: enableShadow ? -(Number(config.iconSize) + 1) : -Number(config.iconSize),
            gradient: enableGradient,
            fill: new Fill({ color: customStyle.color }),
          }),
        })
      );
      let image: Image = new FontSymbol({});
      if (enableShadow) {
        image = styles[1].getImage();
      } else {
        image = styles[0].getImage();
      }
      if (image && image instanceof FontSymbol) {
        image.getFill().setColor(customStyle.color);
      }
      return styles;
    }

    const addOnLayer = options.config?.cluster
      ? new layer.Vector({
          displayProperties: options.displayProperties,
          icon: options.config?.selectIcon,
          titleField: options.titleField,
          timeField: options.timeField,
          style: function (feature: RenderFeature | Feature<Geometry>) {
            let size = feature.get('features').length;
            if (size > 1) {
              let config: any = feature.get('features')[0].get('config');
              let value = computeClusterValue(feature.get('features'));
              return clusterStyle(
                computeColor(findField(config.frame, config.config), config.config, value),
                formatClusterValue(feature.get('features'), value)
              );
            } else if (size === 1) {
              let customStyle = feature.get('features')[0].get('style');
              return markerStyle(customStyle);
            }
            return null;
          },
        } as BaseLayerOptions)
      : new layer.Vector({
          displayProperties: options.displayProperties,
          icon: options.config?.selectIcon,
          titleField: options.titleField,
          timeField: options.timeField,
        } as BaseLayerOptions);

    const vectorLayer = new layer.Group({
      layers: [geometryLayer, addOnLayer],
      title: options.name,
      combine: true,
    } as GroupLayerOptions);

    // Assert default values
    const config = {
      ...defaultOptions,
      ...options?.config,
    };

    const legendProps = new ReplaySubject<MarkersLegendProps>(1);

    let legend: ReactNode = null;
    if (config.showLegend) {
      legend = <ObservablePropsWrapper watch={legendProps} initialSubProps={{}} child={MarkersLegend} />;
    }
    const shape = markerMakers.getIfExists(config.shape) ?? circleMarker;

    return {
      init: () => vectorLayer,
      legend: legend,
      update: (data: PanelData) => {
        if (!data.series?.length) {
          return; // ignore empty
        }

        const geometryFeatures: Array<Feature<Geometry>> = [];
        const pinFeatures: Array<Feature<Point>> = [];
        const opacity = options.config?.fillOpacity ?? defaultOptions.fillOpacity;

        const showPin = options.config?.showPin ?? defaultOptions.showPin;
        const cluster = options.config?.cluster ?? defaultOptions.cluster;

        for (const frame of data.series) {
          if (options.query === frame.refId) {
            const info = dataFrameToPoints(frame, matchers);
            if (info.warning) {
              console.log('Could not find locations', info.warning);
              continue; // ???
            }

            const colorDim = getColorDimension(frame, config.color, theme);
            const sizeDim = getScaledDimension(frame, config.size);

            // Map each data value into new points
            for (let i = 0; i < frame.length; i++) {
              // Get the circle color for a specific data value depending on color scheme
              const color = colorDim.get(i);
              // Set the opacity determined from user configuration
              const fillColor = tinycolor(color).setAlpha(opacity).toRgbString();
              // Get circle size from user configuration
              const radius = sizeDim.get(i);

              // Create a new Feature for each point returned from dataFrameToPoints
              try {
                const geoType = info.points[i].getType();
                const geometry = new Feature(info.points[i]);
                if (geoType === GeometryType.POINT) {
                  geometry.setStyle(shape!.make(color, fillColor, radius));
                } else {
                  let style = new Style({
                    stroke: new Stroke({
                      color: color,
                      width: 5,
                    }),
                    fill: new Fill({
                      color: fillColor,
                    }),
                  });
                  geometry.setStyle(style);
                }
                geometryFeatures.push(geometry);
                if (showPin || cluster) {
                  const center = getCenter(info.points[i].getExtent());
                  const pin = new Feature(new Point(center));
                  pin.setStyle(markerStyle({ color: color }));
                  pin.set('style', { color: color, fillColor: fillColor });
                  if (cluster) {
                    pin.set('config', { frame: frame, config: config.color });
                  }
                  pin.setProperties({
                    frame,
                    rowIndex: i,
                  });
                  pinFeatures.push(pin);
                } else {
                  geometry.setProperties({
                    frame,
                    rowIndex: i,
                  });
                }
              } catch (error) {
                console.log(error);
              }
            }
            // Post updates to the legend component
            if (legend) {
              legendProps.next({
                color: colorDim,
                size: sizeDim,
              });
            }
            break; // Only the first frame for now!
          }
        }

        // Source reads the data and provides a set of features to visualize
        const geometrySource = new source.Vector({
          features: geometryFeatures,
        });
        geometryLayer.setSource(geometrySource);

        if (showPin || cluster) {
          const pinSource = new source.Vector({
            features: pinFeatures,
          });

          if (cluster) {
            const clusterSource = new Cluster({
              distance: options.config?.clusterDistance ?? defaultOptions.clusterDistance,
              minDistance: options.config?.clusterMinDistance ?? defaultOptions.clusterMinDistance,
              source: pinSource,
            });
            addOnLayer.setSource(clusterSource);
          } else {
            addOnLayer.setSource(pinSource);
          }
        }
      },
    };
  },
  // Marker overlay options
  registerOptionsUI: (builder) => {
    const iconType = Object.getOwnPropertyNames(FontSymbol.prototype.defs.glyphs);
    let iconValues: any = [];
    iconValues.push({ value: '', label: 'none' });
    iconType.map((n) => iconValues.push({ value: n, label: n.replace('fa-', '') }));

    builder
      .addCustomEditor({
        id: 'config.color',
        path: 'config.color',
        name: 'Marker Color',
        editor: ColorDimensionEditor,
        settings: {},
        defaultValue: {
          // Configured values
          fixed: 'grey',
        },
      })
      .addCustomEditor({
        id: 'config.size',
        path: 'config.size',
        name: 'Marker Size',
        editor: ScaleDimensionEditor,
        settings: {
          min: 1,
          max: 100, // possible in the UI
        },
        defaultValue: {
          // Configured values
          fixed: 5,
          min: 1,
          max: 20,
        },
      })
      .addSelect({
        path: 'config.shape',
        name: 'Marker Shape',
        settings: {
          options: markerMakers.selectOptions().options,
        },
        defaultValue: 'circle',
      })
      .addSliderInput({
        path: 'config.fillOpacity',
        name: 'Fill opacity',
        defaultValue: defaultOptions.fillOpacity,
        settings: {
          min: 0,
          max: 1,
          step: 0.1,
        },
        showIf: (cfg) => markerMakers.getIfExists((cfg as any).config?.shape)?.hasFill,
      })
      .addBooleanSwitch({
        path: 'config.showPin',
        name: 'Show pin',
        description: 'Show pin',
        defaultValue: defaultOptions.showPin,
      })
      .addSelect({
        path: 'config.pinShape',
        name: 'Pin Shape',
        settings: {
          options: [
            { value: pinshape.bubble, label: 'bubble' },
            { value: pinshape.circle, label: 'circle' },
            { value: pinshape.coma, label: 'coma' },
            { value: pinshape.diamond, label: 'diamond' },
            { value: pinshape.hexagon, label: 'hexagon' },
            { value: pinshape.lozenge, label: 'lozenge' },
            { value: pinshape.marker, label: 'marker' },
            { value: pinshape.poi, label: 'poi' },
            { value: pinshape.square, label: 'square' },
            { value: pinshape.triangle, label: 'triangle' },
            { value: pinshape.shield, label: 'shield' },
            { value: pinshape.sign, label: 'sign' },
          ],
        },
        defaultValue: pinshape.marker,
        showIf: (cfg) => cfg.config?.showPin === true,
      })
      .addNumberInput({
        path: 'config.iconSize',
        name: 'Pin size',
        defaultValue: defaultOptions.iconSize,
        showIf: (cfg) => cfg.config?.showPin === true,
      })
      .addSelect({
        path: 'config.selectIcon',
        name: 'Select icon for the pin',
        settings: {
          options: iconValues,
        },
        defaultValue: 'none',
        showIf: (cfg) => cfg.config?.showPin === true,
      })
      .addBooleanSwitch({
        path: 'config.enableShadow',
        name: 'Enable shadow for the pin',
        defaultValue: false,
        showIf: (cfg) => cfg.config?.showPin === true,
      })
      .addBooleanSwitch({
        path: 'config.enableGradient',
        name: 'Enable gradient for the pin',
        defaultValue: false,
        showIf: (cfg) => cfg.config?.showPin === true,
      })
      .addBooleanSwitch({
        path: 'config.showLegend',
        name: 'Show legend',
        description: 'Show legend',
        defaultValue: defaultOptions.showLegend,
      })
      .addBooleanSwitch({
        path: 'config.cluster',
        name: 'Cluster geometries',
        description: 'Cluster geometries',
        defaultValue: defaultOptions.cluster,
      })
      .addSliderInput({
        path: 'config.clusterDistance',
        name: 'Distance',
        description: 'Distance in pixels within which features will be clustered together.',
        defaultValue: defaultOptions.clusterDistance,
        settings: {
          min: 0,
          max: 100,
          step: 1,
        },
        showIf: (cfg) => cfg.config?.cluster === true,
      })
      .addSliderInput({
        path: 'config.clusterMinDistance',
        name: 'Min distance',
        description: 'Minimum distance in pixels between clusters.',
        defaultValue: defaultOptions.clusterMinDistance,
        settings: {
          min: 0,
          max: 50,
          step: 1,
        },
        showIf: (cfg) => cfg.config?.cluster === true,
      })
      .addSelect({
        path: 'config.clusterValue',
        name: 'Value to display',
        description: 'Value to display in the cluster',
        defaultValue: defaultOptions.clusterValue,
        settings: {
          options: [
            { value: 'none', label: 'none' },
            { value: 'size', label: 'size' },
            { value: 'average', label: 'average' },
            { value: 'sum', label: 'sum' },
          ],
        },
        showIf: (cfg) => cfg.config?.cluster === true,
      });
  },

  // fill in the default values
  defaultOptions,
};
