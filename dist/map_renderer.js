'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = link;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _worldmap = require('./worldmap');

var _worldmap2 = _interopRequireDefault(_worldmap);

var _map_utils = require('./utils/map_utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function link(scope, elem, attrs, ctrl) {
  var mapContainer = elem.find('.map-container')[0];

  ctrl.events.on('render', function () {
    return render();
  });

  function render() {
    if (!ctrl.data) return;

    //map is initializing
    if (!ctrl.worldMap) {
      ctrl.worldMap = new _worldmap2.default(ctrl, mapContainer);
      console.debug('creating worldMap');
      ctrl.worldMap.createMap();
    }

    if (layersChanged()) {
      console.log('layers had changed!');
      //      console.log(ctrl.layerNames);
      //      console.log(Object.keys(ctrl.worldMap.overlayMaps));
      //.off();
      ctrl.worldMap.map.remove();
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
    ctrl.worldMap.setMetrics();

    //ctrl.worldMap.filterEmptyData();
    ctrl.worldMap.drawPoints();

    /**
    * popups and graph display
    */
    // draw all info associated with selected point but when redrawing the chart just update information related
    ctrl.worldMap.drawPointDetails();

    ctrl.renderingCompleted();
  }

  // if users add new metrics we must verify if layers are the same or if we must recreate the map
  function layersChanged() {
    return !_lodash2.default.isEqual(ctrl.layerNames, Object.keys(ctrl.worldMap.overlayMaps));
  }
}
//# sourceMappingURL=map_renderer.js.map
