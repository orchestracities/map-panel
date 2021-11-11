/* eslint import/no-extraneous-dependencies: 0 */
import { loadPluginCss } from 'app/plugins/sdk';
import WorldmapCtrl from './worldmap_ctrl';

loadPluginCss({
  dark: 'plugins/grafana-traffic-env-panel/css/worldmap.dark.css',
  light: 'plugins/grafana-traffic-env-panel/css/worldmap.light.css'
});

/* eslint import/prefer-default-export: 0 */
export {
  WorldmapCtrl as PanelCtrl
};
