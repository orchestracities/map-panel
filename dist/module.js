'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PanelCtrl = undefined;

var _sdk = require('app/plugins/sdk');

var _worldmap_ctrl = require('./worldmap_ctrl');

var _worldmap_ctrl2 = _interopRequireDefault(_worldmap_ctrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint import/no-extraneous-dependencies: 0 */
(0, _sdk.loadPluginCss)({
  dark: 'plugins/grafana-traffic-env-panel/css/worldmap.dark.css',
  light: 'plugins/grafana-traffic-env-panel/css/worldmap.light.css'
});

/* eslint import/prefer-default-export: 0 */
exports.PanelCtrl = _worldmap_ctrl2.default;
//# sourceMappingURL=module.js.map
