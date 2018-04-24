'use strict';

System.register(['./worldmap', './utils/map_utils'], function (_export, _context) {
  "use strict";

  var WorldMap, hideAll;
  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.map-container');

    ctrl.events.on('render', function () {
      render();
      ctrl.renderingCompleted();
    });

    function render() {
      if (!ctrl.data) return;

      if (!ctrl.worldMap) {
        ctrl.worldMap = new WorldMap(ctrl, mapContainer[0]);
      }

      hideAll();
      ctrl.worldMap.resize();

      //if (ctrl.mapCenterMoved) 
      ctrl.worldMap.panToMapCenter();

      ctrl.worldMap.clearCircles();

      //for each target drawpoints  
      // ctrl.panel.targets.forEach((target)=>{
      //   console.log('processing target '+target.datasource)
      ctrl.worldMap.setPollutants();
      //   ctrl.worldMap.drawPoints(target);
      // })

      ctrl.worldMap.drawPoints();
    }
  }

  _export('default', link);

  return {
    setters: [function (_worldmap) {
      WorldMap = _worldmap.default;
    }, function (_utilsMap_utils) {
      hideAll = _utilsMap_utils.hideAll;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map
