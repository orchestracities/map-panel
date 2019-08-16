"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lodash = require("lodash");

require("./vendor/leaflet.awesome-markers/leaflet.awesome-markers.css!");

var L = _interopRequireWildcard(require("./vendor/leaflet/leaflet"));

require("./vendor/leaflet.awesome-markers/leaflet.awesome-markers");

require("./vendor/leaflet-sleep/Leaflet.Sleep");

require("./vendor/leaflet.markercluster/leaflet.markercluster");

require("./vendor/leaflet.markercluster/MarkerCluster.Default.css!");

require("./vendor/leaflet.markercluster/MarkerCluster.css!");

var _definitions = require("./definitions");

var _map_utils = require("./utils/map_utils");

var turf = _interopRequireWildcard(require("./vendor/turf/turf"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CIRCLE_RADIUS = 200;
var POLYGON_MAGNIFY_RATIO = 3;

var WorldMap =
/*#__PURE__*/
function () {
  function WorldMap(ctrl, mapContainer) {
    _classCallCheck(this, WorldMap);

    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.validatedMetrics = {};
    this.timeSeries = {};
    this.currentTargetForChart = null;
    this.currentParameterForChart = null;
    this.map = null;
    this.geoMarkers = {};
    this.ctrl.events.on('panel-size-changed', this.flagChartRefresh.bind(this));
    this.setDefaultValues();
  }

  _createClass(WorldMap, [{
    key: "flagChartRefresh",
    value: function flagChartRefresh() {
      this.refreshChart = true;
    }
  }, {
    key: "getLayers",
    value: function getLayers() {
      return this.ctrl.layerNames.map(function (elem) {
        return L.layerGroup();
      });
    }
  }, {
    key: "createMap",
    value: function createMap() {
      var _this = this;

      var location = [parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)];
      this.layers = this.getLayers();
      this.map = L.map(this.mapContainer, {
        sleepNote: false,
        sleepOpacity: 0.8,
        hoverToWake: false,
        worldCopyJump: true,
        center: location,
        zoomControl: false,
        minZoom: 3,
        maxZoom: 20,
        attributionControl: false,
        layers: this.layers
      });
      this.map.setZoom(this.ctrl.panel.initialZoom);
      this.map.panTo(location);
      L.control.zoom({
        position: 'topright'
      }).addTo(this.map);
      this.addLayersToMap(); // this.map.on('zoomstart', (e) => { mapZoom = this.map.getZoom() });

      this.map.on('click', function () {
        (0, _map_utils.hideAllGraphPopups)(_this.ctrl.panel.id);
        _this.currentTargetForChart = null;
      });
      this.map.on('zoomend', function () {
        var zoomLevel = _this.map.getZoom();

        _this.updateGeoLayers(zoomLevel);
      });
      var selectedTileServer = _definitions.TILE_SERVERS[this.ctrl.tileServer];
      L.tileLayer(selectedTileServer.url, {
        maxZoom: 20,
        subdomains: selectedTileServer.subdomains,
        reuseTiles: true,
        detectRetina: true,
        attribution: selectedTileServer.attribution
      }).addTo(this.map, true);
    }
  }, {
    key: "addLayersToMap",
    value: function addLayersToMap() {
      this.overlayMaps = {};

      for (var i = 0; i < this.ctrl.layerNames.length; i++) {
        this.overlayMaps[this.ctrl.layerNames[i]] = this.layers[i];
      }

      L.control.layers({}, this.overlayMaps).addTo(this.map);
    }
  }, {
    key: "clearLayers",
    value: function clearLayers() {
      this.layers.forEach(function (layer) {
        return layer.clearLayers();
      });
    }
  }, {
    key: "updateGeoLayers",
    value: function updateGeoLayers(zoomLevel) {
      var _this2 = this;

      Object.keys(this.geoMarkers).forEach(function (layerKey) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _this2.geoMarkers[layerKey][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var layer = _step.value;

            if (zoomLevel < _this2.ctrl.panel.minZoomShapes) {
              if (_this2.overlayMaps[layerKey].hasLayer(layer)) {
                _this2.overlayMaps[layerKey].removeLayer(layer);
              }
            } else if (!_this2.overlayMaps[layerKey].hasLayer(layer)) {
              _this2.overlayMaps[layerKey].addLayer(layer);
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator["return"] != null) {
              _iterator["return"]();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      });
    }
    /* Validate metrics for a given target */

  }, {
    key: "setMetrics",
    value: function setMetrics() {
      try {
        this.validatedMetrics = this.ctrl.panel.metrics;
      } catch (error) {
        console.warn(error);
        throw new Error('Please insert a valid JSON in the Metrics field (Edit > Tab Worldmap > Section AirQualityObserved - Metrics field)');
      }
    }
  }, {
    key: "drawPoints",
    value: function drawPoints() {
      var _this3 = this;

      this.geoMarkers = {};
      Object.keys(this.ctrl.data).forEach(function (layerKey) {
        var layer = _this3.ctrl.data[layerKey];
        var markersGJ = L.geoJSON();
        var markers = L.markerClusterGroup(); // for each layer

        Object.keys(layer).forEach(function (objectKey) {
          var lastObjectValues = layer[objectKey][layer[objectKey].length - 1];
          lastObjectValues.type = layerKey;
          var geoJsonName = null;
          var keyArray = Object.keys(lastObjectValues);

          for (var k = 0; k < keyArray.length; k++) {
            if (keyArray[k].toLowerCase() === 'geojson') {
              geoJsonName = keyArray[k];
              break;
            }
          }

          var markerColor = _this3.getGeoMarkerColor(lastObjectValues);

          if (geoJsonName !== null && lastObjectValues.latitude === undefined && lastObjectValues.longitude === undefined) {
            var centroid = turf.centroid(lastObjectValues[geoJsonName]);
            lastObjectValues.longitude = centroid.geometry.coordinates[0];
            lastObjectValues.latitude = centroid.geometry.coordinates[1];
          }

          if (geoJsonName && lastObjectValues[geoJsonName] && lastObjectValues[geoJsonName].type !== 'Point') {
            var newGJ = _this3.createGeoJson(lastObjectValues, geoJsonName, markerColor);

            newGJ.addTo(markersGJ);
          }

          if (lastObjectValues.latitude && lastObjectValues.longitude && _this3.ctrl.panel.layersIcons[layerKey]) {
            var newIcon = _this3.createIcon(lastObjectValues, geoJsonName);

            try {
              if (newIcon) markers.addLayer(newIcon);
            } catch (error) {
              console.warn(layerKey);
              console.warn(error);
            }
          }
        });

        _this3.overlayMaps[layerKey].addLayer(markers);

        _this3.overlayMaps[layerKey].addLayer(markersGJ);

        _this3.geoMarkers[layerKey] = _this3.geoMarkers[layerKey] || [];

        _this3.geoMarkers[layerKey].push(markersGJ);
      });
    }
  }, {
    key: "getGeoMarkerColor",
    value: function getGeoMarkerColor(objectValues) {
      if (this.ctrl.panel.layersColorType[objectValues.type] === 'fix') {
        return this.ctrl.panel.layersColors[objectValues.type];
      } else {
        var bindingValue = objectValues[this.ctrl.panel.layersColorsBinding[objectValues.type]];

        var _this$getGeoMarkerCol = this.getGeoMarkerColorThesholds(objectValues),
            medium = _this$getGeoMarkerCol.medium,
            high = _this$getGeoMarkerCol.high;

        if (bindingValue < medium) {
          return this.ctrl.panel.layersColorsLow[objectValues.type];
        }

        if (bindingValue > high) {
          return this.ctrl.panel.layersColorsHigh[objectValues.type];
        }

        return this.ctrl.panel.layersColorsMedium[objectValues.type];
      }
    }
  }, {
    key: "getGeoMarkerColorThesholds",
    value: function getGeoMarkerColorThesholds(objectValues) {
      var thresholds = this.ctrl.panel.layersColorsThresholds[objectValues.type] || '';
      var splitted = thresholds.split(',');
      return {
        medium: parseInt(splitted[0], 10),
        high: parseInt(splitted[1], 10)
      };
    }
  }, {
    key: "createGeoJson",
    value: function createGeoJson(dataPoint, geoJsonName, geoMarkerColor) {
      var myStyle = {
        'color': geoMarkerColor,
        'weight': 5,
        'opacity': 0.65
      };
      var retVal;

      if (_typeof(dataPoint[geoJsonName]) === 'object') {
        retVal = L.geoJSON(dataPoint[geoJsonName], {
          style: myStyle
        });
      } else {
        retVal = L.geoJSON(JSON.parse(dataPoint[geoJsonName]), {
          style: myStyle
        });
      }

      this.createPopup(this.associateEvents(retVal), (0, _map_utils.getDataPointStickyInfo)(dataPoint, this.ctrl.panel.metrics));
      return retVal;
    }
  }, {
    key: "createIcon",
    value: function createIcon(dataPoint, geoJsonName) {
      // console.log(this.ctrl.panel.layersIcons)
      if (!dataPoint || !dataPoint.type) return null;
      var layerIcon = this.ctrl.panel.layersIcons[dataPoint.type];
      var icon = layerIcon ? this.createMarker(dataPoint, layerIcon, this.ctrl.panel.layersColors[dataPoint.type]) : this.createShape(dataPoint);
      this.createPopup(this.associateEvents(icon), (0, _map_utils.getDataPointStickyInfo)(dataPoint, this.ctrl.panel.metrics));
      return icon;
    }
  }, {
    key: "createShape",
    value: function createShape(dataPoint) {
      var dataPointExtraFields = (0, _map_utils.getDataPointExtraFields)(dataPoint);
      var shape;
      (0, _lodash.defaultsDeep)(dataPointExtraFields, dataPoint);

      switch (dataPoint.type) {
        case 'AirQualityObserved':
          shape = L.circle([dataPoint.latitude, dataPoint.longitude], CIRCLE_RADIUS, dataPointExtraFields);
          break;

        case 'TrafficFlowObserved':
          shape = L.rectangle([[dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.latitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], dataPointExtraFields); // shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointExtraFields)

          break;

        default:
          dataPointExtraFields.color = 'green'; // default color

          shape = L.polygon([[dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.latitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude], [dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], dataPointExtraFields);
      }

      return shape;
    }
  }, {
    key: "createMarker",
    value: function createMarker(dataPoint, elementIcon, elementColor) {
      var dataPointExtraFields = (0, _map_utils.getDataPointExtraFields)(dataPoint);
      var location = [dataPoint.latitude, dataPoint.longitude];
      var markerProperties = {
        icon: L.AwesomeMarkers.icon({
          icon: elementIcon,
          prefix: 'fa',
          markerColor: elementColor || dataPointExtraFields.markerColor // spin: true,

        })
      };
      (0, _lodash.defaultsDeep)(markerProperties, dataPoint);
      return L.marker(location, markerProperties);
    }
  }, {
    key: "associateEvents",
    value: function associateEvents(shape) {
      var _this4 = this;

      return shape.on('click', function (event) {
        _this4.currentTargetForChart = event;
      }).on('click', function () {
        return _this4.drawPointDetails();
      });
    }
  }, {
    key: "createPopup",
    value: function createPopup(shape, stickyPopupInfo) {
      shape.bindPopup(stickyPopupInfo, {
        'offset': L.point(0, -2),
        'className': 'worldmap-popup',
        'closeButton': this.ctrl.panel.stickyLabels
      });

      if (!this.ctrl.panel.stickyLabels) {
        shape.on('mouseover', function () {
          this.openPopup();
        });
        shape.on('mouseout', function () {
          this.closePopup();
        });
      }
    }
  }, {
    key: "setTarget",
    value: function setTarget(event) {
      this.currentTargetForChart = event;
    }
  }, {
    key: "resize",
    value: function resize() {
      var _this5 = this;

      setTimeout(function () {
        _this5.map.invalidateSize();
      }, 0);
    }
  }, {
    key: "panToMapCenter",
    value: function panToMapCenter() {
      var location = [parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)];
      /*    if ( 'Location Variable' === this.ctrl.panel.mapCenter && this.ctrl.isADiferentCity() ) {
        console.log('diferent city detected')
         this.ctrl.setNewCoords()
          .then(() => {
            console.debug('flying to a new location')
            console.debug(location)
            this.map.flyTo(location)
            this.ctrl.refresh();
          })
          .catch(error => console.warn(error))
        return ;
      } */

      this.map.flyTo(location);
      this.ctrl.mapCenterMoved = false;
    }
  }, {
    key: "removeLegend",
    value: function removeLegend() {
      this.legend.removeFrom(this.map);
      this.legend = null;
    }
  }, {
    key: "setZoom",
    value: function setZoom(zoomFactor) {
      this.map.setZoom(parseInt(zoomFactor, 10));
    }
  }, {
    key: "drawPointDetails",
    value: function drawPointDetails() {
      console.debug('drawPointDetails');

      if (this.currentTargetForChart == null) {
        console.debug('no point selected in map');
        return;
      }

      var currentParameterForChart = this.currentParameterForChart || 'value';

      if (!this.currentTargetForChart.target.options.type || this.currentTargetForChart.target.options.id) {
        return;
      }

      var selectedPointValues = this.ctrl.data[this.currentTargetForChart.target.options.type][this.currentTargetForChart.target.options.id];

      if (!selectedPointValues) {
        return;
      }

      var lastValueMeasure = selectedPointValues[selectedPointValues.length - 1]; // refresh chart only if new values arrived

      if (!this.isToRefreshChart(selectedPointValues, currentParameterForChart)) return;
      this.refreshChart = false;
    } // helper method just to avoid unnecessary chart refresh

  }, {
    key: "isToRefreshChart",
    value: function isToRefreshChart(selectedPointValues, currentParameterForChart) {
      if (this.refreshChart) return true;
      var chartData = selectedPointValues.map(function (elem) {
        return [elem.created_at, elem[currentParameterForChart]];
      });
      if ((0, _lodash.isEqual)(this.currentChartData, chartData)) return false;
      this.currentChartData = chartData;
      return true;
    }
  }, {
    key: "setDefaultValues",
    value: function setDefaultValues() {
      var _this6 = this;

      Object.keys(this.ctrl.data).forEach(function (layerKey) {
        if (_this6.ctrl.panel.layersColorsBinding[layerKey] === undefined) {
          _this6.ctrl.panel.layersColorsBinding[layerKey] = 'value';
        }

        if (_this6.ctrl.panel.layersColorsThresholds[layerKey] === undefined) {
          _this6.ctrl.panel.layersColorsThresholds[layerKey] = '30, 50';
        }

        if (_this6.ctrl.panel.layersColorsLow[layerKey] === undefined) {
          _this6.ctrl.panel.layersColorsLow[layerKey] = 'red';
        }

        if (_this6.ctrl.panel.layersColorsMedium[layerKey] === undefined) {
          _this6.ctrl.panel.layersColorsMedium[layerKey] = 'orange';
        }

        if (_this6.ctrl.panel.layersColorsHigh[layerKey] === undefined) {
          _this6.ctrl.panel.layersColorsHigh[layerKey] = 'green';
        }
      });
    }
  }]);

  return WorldMap;
}();

exports["default"] = WorldMap;

function getTranslation(measuresMetaInfo, measure) {
  var resp = measuresMetaInfo.filter(function (measure_) {
    return measure_[0].toLowerCase() === measure.toLowerCase();
  });
  return resp.length > 0 ? resp[0] : [measure, measure, null];
}
//# sourceMappingURL=worldmap.js.map
