import { cartoLayers } from './carto';
import { esriLayers } from './esri';
import { nextenLayers } from './nextzen';
import { genericLayers } from './generic';
import { osmLayers } from './osm';

/**
 * Registry for layer handlers
 */
export const basemapLayers = [
  ...osmLayers,
  ...cartoLayers,
  ...esriLayers, // keep formatting
  ...nextenLayers,
  ...genericLayers,
];
