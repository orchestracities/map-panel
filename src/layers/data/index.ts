import { markersLayer } from './markersLayer';
import { geojsonMapper } from './geojsonMapper';
import { heatmapLayer } from './heatMap';
import { lastPointTracker } from './lastPointTracker';
import { idwmapLayer } from './idwMap';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
  markersLayer,
  heatmapLayer,
  idwmapLayer,
  lastPointTracker,
  geojsonMapper, // dummy for now
];
