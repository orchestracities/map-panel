"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = link;

var _lodash = _interopRequireDefault(require("lodash"));

var _worldmap = _interopRequireDefault(require("./worldmap"));

var _map_utils = require("./utils/map_utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function link(scope, elem, attrs, ctrl) {
  var mapContainer = elem.find('.map-container')[0];
  ctrl.events.on('render', function () {
    return render();
  });

  function render() {
    if (!ctrl.data) return; // map is initializing

    if (!ctrl.worldMap) {
      ctrl.worldMap = new _worldmap["default"](ctrl, mapContainer);
      console.debug('creating worldMap');

      if (ctrl.panel.mapCenter === 'User Geolocation') {
        ctrl.setLocationByUserGeolocation();
      } else // detect city change when using Location Variable
        if (ctrl.panel.mapCenter === 'Location Variable') {
          // && this.ctrl.isADiferentCity()
          console.log('centering at city');
          ctrl.setNewCoords();
        } else ctrl.mapCenterMoved = true;

      ctrl.worldMap.createMap();
    } else if (ctrl.panel.mapCenter === 'Location Variable' && ctrl.isADiferentCity()) {
      console.log('centering at new city');
      ctrl.setNewCoords();
    }

    if (layersChanged()) {
      console.log('layers had changed!');
      ctrl.worldMap.map.remove();
      ctrl.worldMap.createMap();
    }

    ctrl.worldMap.resize();

    if (ctrl.mapCenterMoved) {
      ctrl.worldMap.panToMapCenter();
    }

    ctrl.worldMap.clearLayers(); // ctrl.worldMap.filterEmptyData();

    ctrl.worldMap.drawPoints();
    /**
    * popups and graph display
    */

    ctrl.renderingCompleted();
  } // if users add new metrics we must verify if layers are the same or if we must recreate the map


  function layersChanged() {
    return !_lodash["default"].isEqual(ctrl.layerNames, Object.keys(ctrl.worldMap.overlayMaps));
  }
}
//# sourceMappingURL=map_renderer.js.map
