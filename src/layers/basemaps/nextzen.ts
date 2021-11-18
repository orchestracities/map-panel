import Map from 'ol/Map';
import TopoJSON from 'ol/format/TopoJSON';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import { Fill, Stroke, Style } from 'ol/style';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from 'extension';

const buildingStyle = new Style({
  fill: new Fill({
    color: '#666',
  }),
  stroke: new Stroke({
    color: '#444',
    width: 1,
  }),
});

export const nexten: ExtendMapLayerRegistryItem = {
  id: 'nextzen',
  name: 'Next Zen map',
  isBaseMap: true,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: async (map: Map, options: ExtendMapLayerOptions) => ({
    init: () => {
      return new VectorTileLayer({
        source: new VectorTileSource({
          attributions:
            '&copy; OpenStreetMap contributors, Who’s On First, ' + 'Natural Earth, and openstreetmapdata.com',
          format: new TopoJSON({
            layerName: 'layer',
            layers: ['all'],
          }),
          maxZoom: 19,
          url: 'https://tile.nextzen.org/tilezen/vector/v1/all/{z}/{x}/{y}.topojson?api_key=78Wr43RzRzGpf16xWKGWhw', //+
          //options.apiKey,
        }),
        style: function (feature, resolution) {
          switch (feature.get('layer')) {
            case 'buildings':
              return resolution < 10 ? buildingStyle : new Style({});
            default:
              return new Style({});
          }
        },
      });
    },
  }),
};

export const nextenLayers = [nexten];
