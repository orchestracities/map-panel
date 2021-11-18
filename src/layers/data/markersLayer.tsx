import React, { ReactNode } from 'react';
import { PanelData, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import { Geometry, Point } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import { Fill, Stroke, Style } from 'ol/style';
import { BaseLayerOptions } from 'ol-layerswitcher';
//import { FontSymbol } from 'ol-ext';

import {} from 'ol';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
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

// Configuration options for Circle overlays
export interface MarkersConfig {
  size: ScaleDimensionConfig;
  color: ColorDimensionConfig;
  fillOpacity: number;
  shape?: string;
  showLegend?: boolean;
  showPin?: boolean;
  pinShape?: string;
  cluster?: boolean;
  clusterDistance?: number;
  clusterMinDistance?: number;
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
  pinShape: 'marker',
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
    const vectorLayer = new layer.Vector({ title: options.name } as BaseLayerOptions);
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

            const showPin = options.config?.showPin ?? defaultOptions.showLegend;

            // Map each data value into new points
            for (let i = 0; i < frame.length; i++) {
              // Get the circle color for a specific data value depending on color scheme
              const color = colorDim.get(i);
              // Set the opacity determined from user configuration
              const fillColor = tinycolor(color).setAlpha(opacity).toRgbString();
              // Get circle size from user configuration
              const radius = sizeDim.get(i);

              // Create a new Feature for each point returned from dataFrameToPoints
              const dot = new Feature(info.points[i]);
              if (info.points[i].getType() === GeometryType.POINT) {
                dot.setStyle(shape!.make(color, fillColor, radius));
              } else {
                dot.setStyle(
                  new Style({
                    stroke: new Stroke({
                      color: color,
                      width: 3,
                    }),
                    fill: new Fill({
                      color: fillColor,
                    }),
                  })
                );
              }
              if (showPin) {
                const center = getCenter(info.points[i].getExtent());
                const pin = new Feature(new Point(center));
                pin.setStyle(
                  new Style({
                    /* image: new FontSymbol({
                      form: options.config?.pinShape, //"hexagone",
                      //gradient: $("#gradient").prop('checked'),
                      //glyph: theGlyph,
                      //text: theText,    // text to use if no glyph is defined
                      font: 'sans-serif',
                      //fontSize: Number($("#fontsize").val()),
                      //fontStyle: $("#style").val(),
                      //radius: Number($("#radius").val()),
                      //offsetX: -15,
                      //rotation: Number($("#rotation").val())*Math.PI/180,
                      //rotateWithView: $("#rwview").prop('checked'),
                      //offsetY: $("#offset").prop('checked') ? -Number($("#radius").val()):0 ,
                      color: color,
                      fill: new Fill({
                        color: fillColor,
                      }),
                      stroke: new Stroke({
                        color: color,
                        width: 1,
                      }),
                    }),
                    stroke: new Stroke({
                      color: color,
                      width: 1,
                    }),
                    fill: new Fill({
                      color: [255, 136, 0, 0.6],
                    }),  */
                  })
                );
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
        const vectorSource = new source.Vector({ features });
        vectorLayer.setSource(vectorSource);
      },
    };
  },
  // Marker overlay options
  registerOptionsUI: (builder) => {
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
            //TODO complete
          ],
        },
        defaultValue: pinshape.marker,
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
