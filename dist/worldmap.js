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

require("./vendor/osmbuildings/OSMBuildings-Leaflet");

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
    this.map = null;
    this.geoMarkers = {};
    this.setDefaultValues();
  }

  _createClass(WorldMap, [{
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
      this.addLayersToMap();
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
      if (this.ctrl.panel.buildings) new OSMBuildings(this.map).load('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');
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
  }, {
    key: "drawPoints",
    value: function drawPoints() {
      var _this3 = this;

      this.geoMarkers = {};
      Object.keys(this.ctrl.data).forEach(function (layerKey) {
        var layer = _this3.ctrl.data[layerKey];
        var type = _this3.ctrl.panel.layersClusterType[layerKey];
        var faIcon = _this3.ctrl.panel.layersIcons[layerKey];
        var panel = _this3;
        var getGeoMarkerColorThesholds = _this3.getGeoMarkerColorThesholds;
        var getGeoMarkerColor = _this3.getGeoMarkerColor;
        var convertHex = _this3.convertHex;

        var createClusterIcon = function createClusterIcon(cluster) {
          var markers = cluster.getAllChildMarkers();
          var value = 'NA';
          var valueId = "value";

          if (panel.ctrl.panel.layersColorsBinding[layerKey] !== undefined) {
            valueId = panel.ctrl.panel.layersColorsBinding[layerKey];
          }

          switch (type) {
            case 'average':
              var n = 0;

              for (var i = 0; i < markers.length; i++) {
                n += isNaN(markers[i].options[valueId]) ? 0 : markers[i].options[valueId];
              }

              value = Math.round(n / markers.length * 10) / 10;
              break;

            case 'total':
              for (var i = 0; i < markers.length; i++) {
                n += isNaN(markers[i].options[valueId]) ? 0 : markers[i].options[valueId];
              }

              value = n;
              break;

            default:
              value = cluster.getChildCount();
          }

          var object = {
            type: layerKey
          };
          object[valueId] = value;
          var hex = getGeoMarkerColor(object, panel);
          var color = "background-color: " + hex + "; opacity: 0.6";

          if (faIcon !== undefined) {
            var icon = "<i class='fa fa-" + faIcon + " icon-white'></i><br/>";
            return new L.DivIcon({
              html: '<div style="' + color + '"><span class="double">' + icon + value + '</span></div>',
              className: 'oc-cluster',
              iconSize: new L.Point(40, 40)
            });
          }

          return new L.DivIcon({
            html: '<div style="' + color + '"><span class="single">' + value + '</span></div>',
            className: 'oc-cluster',
            iconSize: new L.Point(40, 40)
          });
        };

        var markersGJ = L.geoJSON();
        var markers = L.markerClusterGroup({
          iconCreateFunction: createClusterIcon,
          disableClusteringAtZoom: 21
        }); // for each layer

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

          var markerColor = _this3.getGeoMarkerColor(lastObjectValues, _this3);

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
            var newIcon = _this3.createIcon(lastObjectValues, markerColor);

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
    key: "convertHex",
    value: function convertHex(hex, opacity) {
      hex = hex.replace('#', '');
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
    }
  }, {
    key: "getGeoMarkerColor",
    value: function getGeoMarkerColor(objectValues, obj) {
      if (obj.ctrl.panel.layersColorType[objectValues.type] === 'fix') {
        return obj.ctrl.panel.layersColors[objectValues.type];
      } else {
        var bindingValue = objectValues[obj.ctrl.panel.layersColorsBinding[objectValues.type]];

        var _obj$getGeoMarkerColo = obj.getGeoMarkerColorThesholds(objectValues, obj),
            medium = _obj$getGeoMarkerColo.medium,
            high = _obj$getGeoMarkerColo.high;

        if (bindingValue < medium) {
          return obj.ctrl.panel.layersColorsLow[objectValues.type];
        }

        if (bindingValue > high) {
          return obj.ctrl.panel.layersColorsHigh[objectValues.type];
        }

        return obj.ctrl.panel.layersColorsMedium[objectValues.type];
      }
    }
  }, {
    key: "getGeoMarkerColorThesholds",
    value: function getGeoMarkerColorThesholds(objectValues, obj) {
      var thresholds = obj.ctrl.panel.layersColorsThresholds[objectValues.type] || '';
      var splitted = thresholds.split(',');
      return {
        medium: parseFloat(splitted[0]),
        high: parseFloat(splitted[1])
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
    value: function createIcon(dataPoint, markerColor) {
      // console.log(this.ctrl.panel.layersIcons)
      if (!dataPoint || !dataPoint.type) return null;
      var layerIcon = this.ctrl.panel.layersIcons[dataPoint.type];
      var icon = layerIcon ? this.createMarker(dataPoint, layerIcon, markerColor) : this.createShape(dataPoint);
      this.createPopup(this.associateEvents(icon), (0, _map_utils.getDataPointStickyInfo)(dataPoint, this.ctrl.panel.metrics));
      return icon;
    }
  }, {
    key: "createShape",
    value: function createShape(dataPoint) {
      var shape = L.polygon([[dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.latitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude], [dataPoint.latitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.longitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], {});
      return shape;
    }
  }, {
    key: "createMarker",
    value: function createMarker(dataPoint, elementIcon, elementColor) {
      var location = [dataPoint.latitude, dataPoint.longitude];

      switch (elementColor) {
        case "#56A64B":
        case "#73BF69":
          elementColor = 'green';
          break;

        case "#19730E":
        case "#37872D":
          elementColor = 'darkgreen';
          break;

        case "#96D98D":
        case "#C8F2C2":
          elementColor = 'lightgreen';
          break;

        case "#F2CC0C":
        case "#FADE2A":
        case "#CC9D00":
        case "#E0B400":
        case "#FFEE52":
        case "#FFF899":
          elementColor = 'yellow';
          break;

        case "#E02F44":
        case "#F2495C":
          elementColor = 'red';
          break;

        case "#AD0317":
        case "#C4162A":
          elementColor = 'darkred';
          break;

        case "#FF7383":
        case "#FFA6B0":
          elementColor = 'lightred';
          break;

        case "#3274D9":
        case "#5794F2":
          elementColor = 'blue';
          break;

        case "#1250B0":
        case "#1F60C4":
          elementColor = 'darkblue';
          break;

        case "#8AB8FF":
        case "#C0D8FF":
          elementColor = 'lightblue';
          break;

        case "#FF780A":
        case "#FF9830":
        case "#E55400":
        case "#FA6400":
        case "#FFB357":
        case "#FFCB7D":
          elementColor = 'orange';
          break;

        case "#A352CC":
        case "#B877D9":
        case "#7C2EA3":
        case "#8F3BB8":
        case "#CA95E5":
        case "#DEB6F2":
          elementColor = 'purple';
          break;

        default:
          elementColor = 'green';
      }

      var markerProperties = {
        icon: L.AwesomeMarkers.icon({
          icon: elementIcon,
          prefix: 'fa',
          markerColor: elementColor
        })
      };
      (0, _lodash.defaultsDeep)(markerProperties, dataPoint);
      return L.marker(location, markerProperties);
    }
  }, {
    key: "associateEvents",
    value: function associateEvents(shape) {
      var _this4 = this;

      return shape.on('click', function () {
        return _this4.updateVariable(shape);
      });
    }
  }, {
    key: "updateVariable",
    value: function updateVariable(shape) {
      var _this5 = this;

      var variable = _.find(this.ctrl.variables, {
        'name': this.ctrl.panel.layersVariables[shape.options.type]
      });

      console.debug(variable);

      if (variable) {
        variable.current.text = shape.options.id;
        variable.current.value = shape.options.id;
        this.ctrl.variableSrv.updateOptions(variable).then(function () {
          _this5.ctrl.variableSrv.variableUpdated(variable).then(function () {
            _this5.ctrl.$scope.$emit('template-variable-value-updated');

            _this5.ctrl.$scope.$root.$broadcast('refresh');
          });
        });
      }
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
      var _this6 = this;

      setTimeout(function () {
        _this6.map.invalidateSize();
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
    key: "setDefaultValues",
    value: function setDefaultValues() {
      var _this7 = this;

      Object.keys(this.ctrl.data).forEach(function (layerKey) {
        if (_this7.ctrl.panel.layersColorsBinding[layerKey] === undefined) {
          _this7.ctrl.panel.layersColorsBinding[layerKey] = 'value';
        }

        if (_this7.ctrl.panel.layersColorsThresholds[layerKey] === undefined) {
          _this7.ctrl.panel.layersColorsThresholds[layerKey] = '30, 50';
        }

        if (_this7.ctrl.panel.layersClusterType[layerKey] === undefined) {
          _this7.ctrl.panel.layersClusterType[layerKey] = 'count';
        }

        if (_this7.ctrl.panel.layersColorsLow[layerKey] === undefined) {
          _this7.ctrl.panel.layersColorsLow[layerKey] = 'red';
        }

        if (_this7.ctrl.panel.layersColorsMedium[layerKey] === undefined) {
          _this7.ctrl.panel.layersColorsMedium[layerKey] = 'orange';
        }

        if (_this7.ctrl.panel.layersColorsHigh[layerKey] === undefined) {
          _this7.ctrl.panel.layersColorsHigh[layerKey] = 'green';
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
