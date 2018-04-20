'use strict';

System.register(['./worldmap', './utils/map_utils'], function (_export, _context) {
  "use strict";

  var WorldMap, hideAllByMapSize;
  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.map-container');

    ctrl.events.on('render', function () {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) return;

      if (!ctrl.map) {
        ctrl.map = new WorldMap(ctrl, mapContainer[0]);
      }

      ctrl.map.resize();

      if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

      // if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

      hideAllByMapSize();

      ctrl.map.clearCircles();

      //for each target drawpoints  
      // ctrl.panel.targets.forEach((target)=>{
      //   console.log('processing target '+target.datasource)
      ctrl.map.setPollutants();
      //   ctrl.map.drawPoints(target);
      // })
      console.log('map_render will drawPoints');
      ctrl.map.drawPoints();
    }
  }

  _export('default', link);

  return {
    setters: [function (_worldmap) {
      WorldMap = _worldmap.default;
    }, function (_utilsMap_utils) {
      hideAllByMapSize = _utilsMap_utils.hideAllByMapSize;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map
