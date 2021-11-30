import {
  GrafanaTheme2,
  MapLayerHandler,
  RegistryItemWithOptions,
  //  FrameGeometrySource,
  FrameGeometrySourceMode,
  PanelOptionsEditorBuilder,
} from '@grafana/data';
import Map from 'ol/Map';

export enum GeojsonFrameGeometrySourceMode {
  Geojson = 'geojson',
  Auto = 'auto',
  Geohash = 'geohash',
  Coords = 'coords',
  Lookup = 'lookup',
}

export interface ExtendFrameGeometrySource {
  mode: ExtendFrameGeometrySourceMode;
  geohash?: string;
  latitude?: string;
  longitude?: string;
  h3?: string;
  wkt?: string;
  lookup?: string;
  gazetteer?: string;
  geojson?: string;
}

// eslint-disable-next-line
export const ExtendFrameGeometrySourceMode = {
  ...GeojsonFrameGeometrySourceMode,
};
// eslint-disable-next-line
export type ExtendFrameGeometrySourceMode = FrameGeometrySourceMode | GeojsonFrameGeometrySourceMode;

export interface ExtendMapLayerOptions<TConfig = any> {
  type: string;
  name?: string;
  config?: TConfig;
  location?: ExtendFrameGeometrySource;
  opacity?: number;
  query?: string;
  displayProperties?: string[];
  titleField?: string;
  timeField?: string;
  apiKey?: string;
}

export interface ExtendMapLayerRegistryItem<TConfig = ExtendMapLayerOptions> extends RegistryItemWithOptions {
  /**
   * This layer can be used as a background
   */
  isBaseMap?: boolean;
  /**
   * Show location controls
   */
  showLocation?: boolean;
  /**
   * Show transparency controls in UI (for non-basemaps)
   */
  showOpacity?: boolean;
  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: ExtendMapLayerOptions<TConfig>, theme: GrafanaTheme2) => Promise<MapLayerHandler>;
  /**
   * Show custom elements in the panel edit UI
   */
  registerOptionsUI?: (builder: PanelOptionsEditorBuilder<ExtendMapLayerOptions<TConfig>>) => void;
}
