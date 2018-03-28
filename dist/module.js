'use strict';

System.register(['app/plugins/sdk', './worldmap_ctrl'], function (_export, _context) {
  "use strict";

  var loadPluginCss, WorldmapCtrl;
  return {
    setters: [function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }, function (_worldmap_ctrl) {
      WorldmapCtrl = _worldmap_ctrl.default;
    }],
    execute: function () {
      /* eslint import/no-extraneous-dependencies: 0 */
      loadPluginCss({
        dark: 'plugins/grafana-traffic-env-panel/css/worldmap.dark.css',
        light: 'plugins/grafana-traffic-env-panel/css/worldmap.light.css'
      });

      /* eslint import/prefer-default-export: 0 */

      _export('PanelCtrl', WorldmapCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
