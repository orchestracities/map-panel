'use strict';

System.register(['lodash', './vendor/highcharts/highstock', './vendor/leaflet/leaflet', './utils/map_utils', './utils/data_formatter', './definitions'], function (_export, _context) {
  "use strict";

  var _, Highcharts, L, drawPopups, calculateAQI, getTimeSeries, dataTreatment, getUpdatedChartSeries, hideAll, addPollDropdown, processData, renderChart, filterEmptyAndZeroValues, AQI, carsCount, tileServers, carMarker, _slicedToArray, _createClass, mapZoom, circlesLayer, currentTargetForChart, currentParameterForChart, DRAW_CHART, REDRAW_CHART, WorldMap;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_vendorHighchartsHighstock) {
      Highcharts = _vendorHighchartsHighstock.default;
    }, function (_vendorLeafletLeaflet) {
      L = _vendorLeafletLeaflet.default;
    }, function (_utilsMap_utils) {
      drawPopups = _utilsMap_utils.drawPopups;
      calculateAQI = _utilsMap_utils.calculateAQI;
      getTimeSeries = _utilsMap_utils.getTimeSeries;
      dataTreatment = _utilsMap_utils.dataTreatment;
      getUpdatedChartSeries = _utilsMap_utils.getUpdatedChartSeries;
      hideAll = _utilsMap_utils.hideAll;
      addPollDropdown = _utilsMap_utils.addPollDropdown;
      processData = _utilsMap_utils.processData;
      renderChart = _utilsMap_utils.renderChart;
    }, function (_utilsData_formatter) {
      filterEmptyAndZeroValues = _utilsData_formatter.filterEmptyAndZeroValues;
    }, function (_definitions) {
      AQI = _definitions.AQI;
      carsCount = _definitions.carsCount;
      tileServers = _definitions.tileServers;
      carMarker = _definitions.carMarker;
    }],
    execute: function () {
      _slicedToArray = function () {
        function sliceIterator(arr, i) {
          var _arr = [];
          var _n = true;
          var _d = false;
          var _e = undefined;

          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);

              if (i && _arr.length === i) break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"]) _i["return"]();
            } finally {
              if (_d) throw _e;
            }
          }

          return _arr;
        }

        return function (arr, i) {
          if (Array.isArray(arr)) {
            return arr;
          } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
          } else {
            throw new TypeError("Invalid attempt to destructure non-iterable instance");
          }
        };
      }();

      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      mapZoom = void 0;
      circlesLayer = void 0;
      currentTargetForChart = null;
      currentParameterForChart = 'AQI';
      DRAW_CHART = false;
      REDRAW_CHART = true;

      WorldMap = function () {
        function WorldMap(ctrl, mapContainer) {
          _classCallCheck(this, WorldMap);

          this.ctrl = ctrl;
          this.mapContainer = mapContainer;
          this.circles = [];
          this.validated_pollutants = {};
          this.timeSeries = {};
          this.chartSeries = {};
          this.chartData = [];

          this.createMap(); //only called once
        }

        _createClass(WorldMap, [{
          key: 'getLayers',
          value: function getLayers() {
            return this.ctrl.layerNames.map(function (elem) {
              return window.L.layerGroup();
            });
          }
        }, {
          key: 'createMap',
          value: function createMap() {
            var _this = this;

            var mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));

            this.layers = this.getLayers();

            this.map = window.L.map(this.mapContainer, {
              worldCopyJump: true,
              center: mapCenter,
              zoomControl: false,
              attributionControl: false,
              layers: this.layers
            }).fitWorld();

            this.map.setZoom(this.ctrl.panel.initialZoom);
            this.map._initPathRoot();
            this.map._updatePathViewport();

            this.map.panTo(mapCenter);
            L.control.zoom({ position: 'topright' }).addTo(this.map);

            //    this.layers.forEach((layer)=>layer.addTo(this.map))

            this.addLayersToMap();

            this.map.on('zoomstart', function (e) {
              mapZoom = _this.map.getZoom();
            });
            this.map.on('click', function (e) {
              hideAll();
              currentTargetForChart = null;
            });

            var selectedTileServer = tileServers[this.ctrl.tileServer];
            L.tileLayer(selectedTileServer.url, {
              maxZoom: 18,
              subdomains: selectedTileServer.subdomains,
              reuseTiles: true,
              detectRetina: true,
              attribution: selectedTileServer.attribution
            }).addTo(this.map, true);

            var self_ = this;
            document.querySelector('#air_parameters_dropdown').addEventListener('change', function (event) {
              currentParameterForChart = event.currentTarget.value;
              //console.log('event: '); console.log(event)
              //console.log('parameter: '+currentParameterForChart)
              //console.log('this.timeSeries: '+this.timeSeries)
              _this.drawChart(REDRAW_CHART);
            });
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
          key: 'clearCircles',
          value: function clearCircles() {
            this.layers.forEach(function (layer) {
              return layer.clearLayers();
            });
          }
        }, {
          key: 'setPollutants',
          value: function setPollutants() {
            try {
              //console.log('validating and setting pollutants')
              //console.log(this.ctrl.panel.pollutants)

              this.validated_pollutants = JSON.parse(this.ctrl.panel.pollutants);
            } catch (error) {
              console.log(error);
              throw new Error('Please insert a valid JSON in the Available Pollutants ');
            }
          }
        }, {
          key: 'drawPoints',
          value: function drawPoints() {
            //console.log('striping unnecessary entries from recieved data...')
            this.data = dataTreatment(filterEmptyAndZeroValues(this.ctrl.data, this.ctrl.panel.hideEmpty, this.ctrl.panel.hideZero));

            this.addPointsToMap();
            this.timeSeries = getTimeSeries(this.data);

            if (currentTargetForChart === null) return;
            this.chartSeries = getUpdatedChartSeries(this.chartSeries, this.timeSeries, currentTargetForChart, currentParameterForChart);
            this.drawChart(DRAW_CHART); // call drawChart but redraw the chart just update information related
          }
        }, {
          key: 'addPointsToMap',
          value: function addPointsToMap() {
            var _this2 = this;

            //console.log('addPointsToMap');
            Object.keys(this.data).forEach(function (key) {
              var value = _this2.data[key][_this2.data[key].length - 1]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
              var newCircle = _this2.createCircle(value);
              try {
                _this2.overlayMaps[value.type].addLayer(newCircle);
              } catch (error) {
                console.log(value);console.log(error);
              }
            });
          }
        }, {
          key: 'createCircle',
          value: function createCircle(dataPoint) {
            var _this3 = this;

            //console.log('createCircle');
            var aqi = calculateAQI(dataPoint.value);
            var aqiColor = AQI.color[aqi];
            var aqiMeaning = AQI.meaning[aqi];
            var aqiRisk = AQI.risks[aqi];
            var id = dataPoint.id;
            var type = dataPoint.type;

            var pollutants = dataPoint.pollutants;
            if (pollutants) pollutants.push({ 'name': 'aqi', 'value': dataPoint.value });

            var circle = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], 200, {
              id: id,
              type: type,
              latitude: dataPoint.locationLatitude,
              longitude: dataPoint.locationLongitude,

              color: aqiColor,
              fillColor: aqiColor,
              fillOpacity: 0.5,
              aqiColor: aqiColor,
              aqiMeaning: aqiMeaning,
              aqiRisk: aqiRisk,
              pollutants: pollutants,
              aqi: dataPoint.value
            }).on('click', this.setTarget).on('click', function () {
              return _this3.drawChart(REDRAW_CHART);
            });
            //.on('click', addPollDropdown);

            this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
            return circle;
          }
        }, {
          key: 'createPopupCircle',
          value: function createPopupCircle(circle, aqi, aqiMeaning) {
            var label = ('AQI: ' + aqi + ' (' + aqiMeaning + ')').trim();
            circle.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            circle.on('mouseover', function onMouseOver(event) {
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              circle.on('mouseout', function onMouseOut() {
                circle.closePopup();
              });
            }
          }
        }, {
          key: 'setTarget',
          value: function setTarget(event) {
            currentTargetForChart = event;
          }
        }, {
          key: 'resize',
          value: function resize() {
            this.map.invalidateSize();
          }
        }, {
          key: 'panToMapCenter',
          value: function panToMapCenter() {
            this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
            this.ctrl.mapCenterMoved = false;
          }
        }, {
          key: 'removeLegend',
          value: function removeLegend() {
            this.legend.removeFrom(this.map);
            this.legend = null;
          }
        }, {
          key: 'removeCircles',
          value: function removeCircles() {
            this.map.removeLayer(circlesLayer);
          }
        }, {
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(parseInt(zoomFactor, 10));
          }
        }, {
          key: 'drawChart',
          value: function drawChart(redrawChart) {
            //console.log('drawChart')
            if (currentTargetForChart == null || this.timeSeries == null) {
              console.log("unnable to show");
              console.log(currentTargetForChart);
              return;
            }

            drawPopups(this.timeSeries, this.validated_pollutants, currentParameterForChart, currentTargetForChart);

            // ------
            var parameterUnit = '';
            var title = '';

            if (redrawChart) {
              var _processData = processData(this.chartSeries, this.timeSeries, this.validated_pollutants, currentParameterForChart, currentTargetForChart);

              var _processData2 = _slicedToArray(_processData, 3);

              this.chartData = _processData2[0];
              parameterUnit = _processData2[1];
              title = _processData2[2];
            }

            renderChart(this.chartSeries, this.chartData, parameterUnit, title);
          }
        }]);

        return WorldMap;
      }();

      _export('default', WorldMap);
    }
  };
});
//# sourceMappingURL=worldmap.js.map
