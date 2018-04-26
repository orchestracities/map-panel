'use strict';

System.register(['./worldmap', './utils/map_utils'], function (_export, _context) {
  "use strict";

  var WorldMap, hideAllGraphPopups;
  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.map-container');

    ctrl.events.on('render', function () {
      return render();
    });

    function render() {
      if (!ctrl.data) return;

      if (!ctrl.worldMap) {
        ctrl.worldMap = new WorldMap(ctrl, mapContainer[0]);
      }

      /**
      * map display
      */
      hideAllGraphPopups();
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

      /**
      * graph display
      */
      ctrl.worldMap.prepareSeries();
      ctrl.worldMap.drawChart(true); // call drawChart but redraw the chart just update information related


      ctrl.renderingCompleted();
    }
  }

  _export('default', link);

  return {
    setters: [function (_worldmap) {
      WorldMap = _worldmap.default;
    }, function (_utilsMap_utils) {
      hideAllGraphPopups = _utilsMap_utils.hideAllGraphPopups;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map
