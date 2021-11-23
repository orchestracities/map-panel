import React, { ReactNode } from 'react';
import { PanelData, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import { Geometry, Point } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import FontSymbol from 'ol-ext/style/FontSymbol';
import Shadow from 'ol-ext/style/Shadow';
import 'ol-ext/style/FontAwesomeDef.js';
import 'ol-ext/style/FontMaki2Def.js';
import 'ol-ext/style/FontMakiDef.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Cluster, Vector as VectorSource } from 'ol/source.js';

import { getCenter } from 'ol/extent';

import tinycolor from 'tinycolor2';
import { dataFrameToPoints, getLocationMatchers } from '../../utils/location';
import { ExtendMapLayerRegistryItem, ExtendFrameGeometrySourceMode, ExtendMapLayerOptions } from '../../extension';
import { ColorDimensionConfig, ScaleDimensionConfig, getScaledDimension, getColorDimension } from '../../dimensions';
import { ScaleDimensionEditor, ColorDimensionEditor } from '../../dimensions/editors';
import { ObservablePropsWrapper } from '../../components/ObservablePropsWrapper';
import { MarkersLegend, MarkersLegendProps } from './MarkersLegend';
import { circleMarker, markerMakers } from '../../utils/regularShapes';
import { ReplaySubject } from 'rxjs';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style.js';

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
  iconSize: 20,
  cluster: false,
  clusterDistance: 20,
  clusterMinDistance: 0,
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
  create: async (map: Map, options: ExtendMapLayerOptions<MarkersConfig>, theme: GrafanaTheme2) => {
    const matchers = await getLocationMatchers(options.location);
    const styleCache: any = {};

    const vectorLayer = new VectorLayer({
      style: function (feature) {
        let size = feature.get('features').length;
        let newStyle = styleDecider(size, feature);
        return newStyle;
      },
    });

    const styleDecider = (size: number, elements: any) => {
      let style = styleCache[size];
      if (size <= 3) {
        let features = elements.get('features');
        for (let feature of features) {
          return feature.get('customStyle');
        }
      } else {
        style = new Style({
          image: new CircleStyle({
            radius: 10,
            stroke: new Stroke({
              color: '#fff',
            }),
            fill: new Fill({
              color: '#3399CC',
            }),
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({
              color: '#fff',
            }),
          }),
        });
        styleCache[size] = style;
        return style;
      }
    };
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

        const features: Array<Feature<Geometry>> = [];

        for (const frame of data.series) {
          if (options.query === frame.refId) {
            const info = dataFrameToPoints(frame, matchers);
            if (info.warning) {
              console.log('Could not find locations', info.warning);
              continue; // ???
            }

            const colorDim = getColorDimension(frame, config.color, theme);
            const sizeDim = getScaledDimension(frame, config.size);
            const opacity = options.config?.fillOpacity ?? defaultOptions.fillOpacity;

            const showPin = options.config?.showPin ?? defaultOptions.showPin;
            const enableShadow = options.config?.enableShadow ?? defaultOptions.enableShadow;
            const enableGradient = options.config?.enableGradient ?? defaultOptions.enableGradient;

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
                const dot = new Feature(info.points[i]);
                if (geoType === GeometryType.POINT) {
                  dot.set('customStyle', shape!.make(color, fillColor, radius));
                } else {
                  dot.set(
                    'customStyle',
                    new Style({
                      image: new CircleStyle({
                        radius: 20,
                        stroke: new Stroke({
                          color: color,
                          width: 3,
                        }),
                        fill: new Fill({
                          color: fillColor,
                        }),
                      }),
                    })
                  );
                }
                if (showPin) {
                  const center = getCenter(info.points[i].getExtent());
                  const pin = new Feature(new Point(center));
                  const styles: Style[] = [];
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
                        offsetY: enableShadow ? -Number(config.iconSize) : 0,
                        gradient: enableGradient,
                        fill: new Fill({ color: color }),
                        stroke: new Stroke({ color: '#fff', width: 1 }),
                      }),
                    })
                  );
                  pin.set('customStyle', styles);
                  pin.setProperties({
                    frame,
                    rowIndex: i,
                  });
                  features.push(pin);
                } else {
                  dot.setProperties({
                    frame,
                    rowIndex: i,
                  });
                }
                features.push(dot);
              } catch (error) {
                console.log('empty geometry passed from the db');
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
        const source = new VectorSource({
          features: features,
        });
        const clusterSource = new Cluster({
          distance: 40,
          source: source,
          geometryFunction: function (feature) {
            let geom = feature.getGeometry();
            let individualStyle = feature.getStyle();
            if (geom.getType() === 'Point') {
              geom.individualStyle = individualStyle;
              return geom;
            } else if (geom.getType() === 'Polygon') {
              geom = geom.getInteriorPoint();
              geom.individualStyle = individualStyle;
              return geom;
            } else if (geom.getType() === 'LineString') {
              return null;
            }
            return null;
          },
        });

        vectorLayer.setSource(clusterSource);
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
      });
  },

  // fill in the default values
  defaultOptions,
};
