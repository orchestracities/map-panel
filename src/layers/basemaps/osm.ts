import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';

export const standard: ExtendMapLayerRegistryItem = {
  id: 'osm-standard',
  name: 'Open Street Map',
  isBaseMap: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: Map, options: ExtendMapLayerOptions) => ({
    init: () => {
      return new TileLayer({
        source: new OSM(),
      });
    },
  }),
};

export const osmLayers = [standard];
