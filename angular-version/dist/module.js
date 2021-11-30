"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "PanelCtrl", {
  enumerable: true,
  get: function get() {
    return _worldmap_ctrl["default"];
  }
});

var _sdk = require("app/plugins/sdk");

var _worldmap_ctrl = _interopRequireDefault(require("./worldmap_ctrl"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint import/no-extraneous-dependencies: 0 */
(0, _sdk.loadPluginCss)({
  dark: 'plugins/grafana-traffic-env-panel/css/worldmap.dark.css',
  light: 'plugins/grafana-traffic-env-panel/css/worldmap.light.css'
});
/* eslint import/prefer-default-export: 0 */
//# sourceMappingURL=module.js.map
