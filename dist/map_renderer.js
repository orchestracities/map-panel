'use strict';

System.register(['lodash', './worldmap', './utils/map_utils'], function (_export, _context) {
  "use strict";

  var _, WorldMap, hideAllGraphPopups;

  function link(scope, elem, attrs, ctrl) {
    var mapContainer = elem.find('.map-container')[0];

    ctrl.events.on('render', function () {
      return render();
    });

    function render() {
      if (!ctrl.data) return;

      console.debug('aggs');
      console.debug(ctrl.panel.targets[0].metricAggs);
      console.debug('pollutants');
      console.debug(ctrl.panel.pollutants);

      //map is initializing
      if (!ctrl.worldMap) {
        ctrl.worldMap = new WorldMap(ctrl, mapContainer);
        console.debug('creating worldMap');
        ctrl.worldMap.createMap();
      }

      if (layersChanged()) {
        console.log('layers had changed! Please Refresh Page!');
        console.log(ctrl.layerNames);
        console.log(Object.keys(ctrl.worldMap.overlayMaps));
        ctrl.worldMap.map = null;
        ctrl.worldMap.createMap();
      }

      ctrl.worldMap.resize();

      if (ctrl.panel.mapCenter === 'cityenv' || ctrl.mapCenterMoved) {
        //&& ctrl.isADiferentCity()
        console.debug('panToMapCenter');
        console.debug(ctrl.panel.mapCenterLatitude + ' : ' + ctrl.panel.mapCenterLongitude);
        ctrl.worldMap.panToMapCenter();
      }

      ctrl.worldMap.clearLayers();
      ctrl.worldMap.setPollutants();
      ctrl.worldMap.drawPoints();

      /**
      * graph display
      */
      ctrl.worldMap.prepareSeries();
      ctrl.worldMap.drawChart(true); // call drawChart but redraw the chart just update information related

      ctrl.renderingCompleted();
    }

    // if users add new metrics we must verify if layers are the same or if we must recreate the map
    function layersChanged() {
      return !_.isEqual(ctrl.layerNames, Object.keys(ctrl.worldMap.overlayMaps));
    }
  }

  _export('default', link);

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_worldmap) {
      WorldMap = _worldmap.default;
    }, function (_utilsMap_utils) {
      hideAllGraphPopups = _utilsMap_utils.hideAllGraphPopups;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=map_renderer.js.map
