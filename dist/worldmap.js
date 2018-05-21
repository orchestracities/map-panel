'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable id-length, no-unused-vars */

/* Vendor specific */


/* App Specific */


var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

require('./vendor/leaflet.awesome-markers/leaflet.awesome-markers.css!');

var _leaflet = require('./vendor/leaflet/leaflet');

var L = _interopRequireWildcard(_leaflet);

require('./vendor/leaflet.awesome-markers/leaflet.awesome-markers');

var _definitions = require('./definitions');

var _map_utils = require('./utils/map_utils');

var _data_formatter = require('./utils/data_formatter');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DRAW_CHART = false;
var REDRAW_CHART = true;

var CIRCLE_RADIUS = 200;
var POLYGON_MAGNIFY_RATIO = 3;

var WorldMap = function () {
  function WorldMap(ctrl, mapContainer) {
    _classCallCheck(this, WorldMap);

    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.validated_metrics = {};
    this.timeSeries = {};
    this.chartSeries = {};
    this.chartData = [];
    this.currentTargetForChart = null;
    this.currentParameterForChart = null;
    this.map = null;
  }

  _createClass(WorldMap, [{
    key: 'getLayers',
    value: function getLayers() {
      return this.ctrl.layerNames.map(function (elem) {
        return L.layerGroup();
      });
    }
  }, {
    key: 'createMap',
    value: function createMap() {
      var _this = this;

      var location = [parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)];

      this.layers = this.getLayers();

      this.map = L.map(this.mapContainer, {
        worldCopyJump: true,
        center: location,
        zoomControl: false,
        attributionControl: false,
        layers: this.layers
      });
      //.fitWorld()

      this.map.setZoom(this.ctrl.panel.initialZoom);
      this.map.panTo(location);
      L.control.zoom({ position: 'topright' }).addTo(this.map);
      this.addLayersToMap();

      // this.map.on('zoomstart', (e) => { mapZoom = this.map.getZoom() });
      this.map.on('click', function () {
        (0, _map_utils.hideAllGraphPopups)(_this.ctrl.panel.id);
        _this.currentTargetForChart = null;
      });

      var selectedTileServer = _definitions.TILE_SERVERS[this.ctrl.tileServer];
      L.tileLayer(selectedTileServer.url, {
        maxZoom: 18,
        subdomains: selectedTileServer.subdomains,
        reuseTiles: true,
        detectRetina: true,
        attribution: selectedTileServer.attribution
      }).addTo(this.map, true);

      document.querySelector('#parameters_dropdown_' + this.ctrl.panel.id).addEventListener('change', function (event) {
        _this.currentParameterForChart = event.currentTarget.value;
        console.debug('selecting point for measure:');
        console.debug(_this.currentParameterForChart);
        _this.drawPointDetails();
      }); //, {passive: true} <= to avoid blocking
    }
  }, {
    key: 'addLayersToMap',
    value: function addLayersToMap() {
      this.overlayMaps = {};
      for (var i = 0; i < this.ctrl.layerNames.length; i++) {
        this.overlayMaps[this.ctrl.layerNames[i]] = this.layers[i];
      }L.control.layers({}, this.overlayMaps).addTo(this.map);
    }
  }, {
    key: 'clearLayers',
    value: function clearLayers() {
      this.layers.forEach(function (layer) {
        return layer.clearLayers();
      });
    }

    /* Validate metrics for a given target*/

  }, {
    key: 'setMetrics',
    value: function setMetrics() {
      try {
        this.validated_metrics = this.ctrl.panel.metrics;
      } catch (error) {
        console.warn(error);
        throw new Error('Please insert a valid JSON in the Metrics field (Edit > Tab Worldmap > Section AirQualityObserved - Metrics field)');
      }
    }
  }, {
    key: 'drawPoints',
    value: function drawPoints() {
      var _this2 = this;

      Object.keys(this.ctrl.data).forEach(function (layerKey) {
        var layer = _this2.ctrl.data[layerKey];

        //for each layer
        Object.keys(layer).forEach(function (objectKey) {
          var lastObjectValues = layer[objectKey][layer[objectKey].length - 1];
          lastObjectValues.type = layerKey;

          var newIcon = _this2.createIcon(lastObjectValues);

          try {
            if (newIcon) _this2.overlayMaps[layerKey].addLayer(newIcon);
          } catch (error) {
            console.warn(layerKey);console.warn(error);
          }
        });
      });
    }
  }, {
    key: 'createIcon',
    value: function createIcon(dataPoint) {
      //console.log(this.ctrl.panel.layersIcons)
      if (!dataPoint || !dataPoint.type) return null;

      var layerIcon = this.ctrl.panel.layersIcons[dataPoint.type];
      var layerColor = this.ctrl.panel.layersColors[dataPoint.type];
      var icon = layerIcon ? this.createMarker(dataPoint, layerIcon, layerColor) : this.createShape(dataPoint);

      this.createPopup(this.associateEvents(icon), (0, _map_utils.getDataPointStickyInfo)(dataPoint, this.ctrl.panel.metrics));

      return icon;
    }
  }, {
    key: 'createShape',
    value: function createShape(dataPoint) {
      var dataPointExtraFields = (0, _map_utils.getDataPointExtraFields)(dataPoint);
      var shape = void 0;

      _lodash2.default.defaultsDeep(dataPointExtraFields, dataPoint);

      switch (dataPoint.type) {
        case 'AirQualityObserved':
          shape = L.circle([dataPoint.latitude, dataPoint.longitude], CIRCLE_RADIUS, dataPointExtraFields);
          break;
        case 'TrafficFlowObserved':
          shape = L.rectangle([[dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.latitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], dataPointExtraFields);
          //shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointExtraFields)
          break;
        default:
          dataPointExtraFields.color = 'green'; //default color
          shape = L.polygon([[dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.latitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude], [dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], dataPointExtraFields);
      }

      return shape;
    }
  }, {
    key: 'createMarker',
    value: function createMarker(dataPoint, elementIcon, elementColor) {
      var dataPointExtraFields = (0, _map_utils.getDataPointExtraFields)(dataPoint);
      var location = [dataPoint.latitude, dataPoint.longitude];

      var markerProperties = {
        icon: L.AwesomeMarkers.icon({
          icon: elementIcon,
          prefix: 'fa',
          markerColor: elementColor ? elementColor : dataPointExtraFields.markerColor
          //spin: true,
        })
      };
      _lodash2.default.defaultsDeep(markerProperties, dataPoint);

      return L.marker(location, markerProperties);
    }
  }, {
    key: 'associateEvents',
    value: function associateEvents(shape) {
      var _this3 = this;

      return shape.on('click', function (event) {
        _this3.currentTargetForChart = event;
      }).on('click', function () {
        return _this3.drawPointDetails();
      });
    }
  }, {
    key: 'createPopup',
    value: function createPopup(shape, stickyPopupInfo) {
      shape.bindPopup(stickyPopupInfo, {
        'offset': L.point(0, -2),
        'className': 'worldmap-popup',
        'closeButton': this.ctrl.panel.stickyLabels
      });
      shape.on('mouseover', function () {
        this.openPopup();
      });

      if (!this.ctrl.panel.stickyLabels) {
        shape.on('mouseout', function () {
          this.closePopup();
        });
      }
    }
  }, {
    key: 'setTarget',
    value: function setTarget(event) {
      this.currentTargetForChart = event;
    }
  }, {
    key: 'resize',
    value: function resize() {
      this.map.invalidateSize();
    }
  }, {
    key: 'panToMapCenter',
    value: function panToMapCenter() {
      var _this4 = this;

      var location = [parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)];

      if (this.ctrl.panel.mapCenter === 'cityenv' && this.ctrl.isADiferentCity()) {
        this.ctrl.setNewCoords().then(function () {
          console.debug('flying to a new location');
          console.debug(location);
          _this4.map.flyTo(location);
          _this4.ctrl.refresh();
        }).catch(function (error) {
          return console.warn(error);
        });
        return;
      }

      this.map.flyTo(location);
      this.ctrl.mapCenterMoved = false;
    }
  }, {
    key: 'removeLegend',
    value: function removeLegend() {
      this.legend.removeFrom(this.map);
      this.legend = null;
    }
  }, {
    key: 'setZoom',
    value: function setZoom(zoomFactor) {
      this.map.setZoom(parseInt(zoomFactor, 10));
    }
  }, {
    key: 'drawPointDetails',
    value: function drawPointDetails() {
      console.debug('drawPointDetails');
      if (this.currentTargetForChart == null) {
        console.debug('no point selected in map');
        return;
      }

      var currentParameterForChart = this.currentParameterForChart || 'value';

      var selectedPointValues = this.ctrl.data[this.currentTargetForChart.target.options.type][this.currentTargetForChart.target.options.id];
      var lastValueMeasure = selectedPointValues[selectedPointValues.length - 1];

      (0, _map_utils.drawSelect)(this.ctrl.panel.id, lastValueMeasure, this.validated_metrics, currentParameterForChart);

      (0, _map_utils.drawPopups)(this.ctrl.panel.id, lastValueMeasure, this.validated_metrics);

      (0, _map_utils.renderChart)(this.ctrl.panel.id, selectedPointValues, getTranslation(this.validated_metrics, currentParameterForChart), [this.currentTargetForChart.target.options.type, this.currentTargetForChart.target.options.id, currentParameterForChart]);
    }
  }]);

  return WorldMap;
}();

exports.default = WorldMap;


function getTranslation(measuresMetaInfo, measure) {
  var resp = measuresMetaInfo.filter(function (measure_) {
    return measure_[0].toLowerCase() === measure.toLowerCase();
  });
  return resp.length > 0 ? resp[0] : [measure, measure, null];
}
//# sourceMappingURL=worldmap.js.map
