'use strict';

System.register(['lodash', './vendor/highcharts/highstock', './vendor/leaflet/leaflet', './definitions', './utils/map_utils', './utils/data_formatter'], function (_export, _context) {
  "use strict";

  var _, Highcharts, L, tileServers, dataTreatment, processData, getTimeSeries, getUpdatedChartSeries, drawPopups, renderChart, hideAllGraphPopups, getDataPointValues, getDataPointStickyInfo, filterEmptyAndZeroValues, _slicedToArray, _createClass, currentTargetForChart, currentParameterForChart, DRAW_CHART, REDRAW_CHART, CIRCLE_RADIUS, POLYGON_MAGNIFY_RATIO, WorldMap;

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
    }, function (_definitions) {
      tileServers = _definitions.tileServers;
    }, function (_utilsMap_utils) {
      dataTreatment = _utilsMap_utils.dataTreatment;
      processData = _utilsMap_utils.processData;
      getTimeSeries = _utilsMap_utils.getTimeSeries;
      getUpdatedChartSeries = _utilsMap_utils.getUpdatedChartSeries;
      drawPopups = _utilsMap_utils.drawPopups;
      renderChart = _utilsMap_utils.renderChart;
      hideAllGraphPopups = _utilsMap_utils.hideAllGraphPopups;
      getDataPointValues = _utilsMap_utils.getDataPointValues;
      getDataPointStickyInfo = _utilsMap_utils.getDataPointStickyInfo;
    }, function (_utilsData_formatter) {
      filterEmptyAndZeroValues = _utilsData_formatter.filterEmptyAndZeroValues;
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

      currentTargetForChart = null;
      currentParameterForChart = 'AQI';
      DRAW_CHART = false;
      REDRAW_CHART = true;
      CIRCLE_RADIUS = 200;
      POLYGON_MAGNIFY_RATIO = 3;

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
              return L.layerGroup();
            });
          }
        }, {
          key: 'createMap',
          value: function createMap() {
            var _this = this;

            var mapCenter = L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));

            this.layers = this.getLayers();

            this.map = L.map(this.mapContainer, {
              worldCopyJump: true,
              center: mapCenter,
              zoomControl: false,
              attributionControl: false,
              layers: this.layers
            }).fitWorld();

            this.map.setZoom(this.ctrl.panel.initialZoom);
            this.map.panTo(mapCenter);
            L.control.zoom({ position: 'topright' }).addTo(this.map);
            this.addLayersToMap();

            // this.map.on('zoomstart', (e) => { mapZoom = this.map.getZoom() });
            this.map.on('click', function (e) {
              hideAllGraphPopups();
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

            document.querySelector('#air_parameters_dropdown').addEventListener('change', function (event) {
              currentParameterForChart = event.currentTarget.value;
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
              this.validated_pollutants = JSON.parse(this.ctrl.panel.resources.airQualityObserved.pollutants);
            } catch (error) {
              console.log(error);
              throw new Error('Please insert a valid JSON in the Pollutants field (Edit > Tab Worldmap > Section AirQualityObserved - Pollutents field)');
            }
          }
        }, {
          key: 'drawPoints',
          value: function drawPoints() {
            //console.log('striping unnecessary entries from recieved data...')
            this.data = dataTreatment(filterEmptyAndZeroValues(this.ctrl.data, this.ctrl.panel.hideEmpty, this.ctrl.panel.hideZero));

            this.addPointsToMap();
          }
        }, {
          key: 'prepareSeries',
          value: function prepareSeries() {
            this.timeSeries = getTimeSeries(this.data);
            if (currentTargetForChart === null) return;
            this.chartSeries = getUpdatedChartSeries(this.chartSeries, this.timeSeries, currentTargetForChart, currentParameterForChart);
          }
        }, {
          key: 'addPointsToMap',
          value: function addPointsToMap() {
            var _this2 = this;

            //console.log('addPointsToMap');
            Object.keys(this.data).forEach(function (key) {
              var value = _this2.data[key][_this2.data[key].length - 1]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
              var newShape = _this2.createShape(value);
              try {
                _this2.overlayMaps[value.type].addLayer(newShape);
              } catch (error) {
                console.log(value);console.log(error);
              }
            });
          }
        }, {
          key: 'createShape',
          value: function createShape(dataPoint) {
            var _this3 = this;

            var dataPointDetails = getDataPointValues(dataPoint);
            var stickyPopupInfo = getDataPointStickyInfo(dataPointDetails);
            var shape = void 0;

            switch (dataPoint.type) {
              case 'AirQualityObserved':
                shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointDetails);
                break;
              case 'TrafficFlowObserved':
                shape = L.rectangle([[dataPoint.locationLatitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.locationLongitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.locationLatitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.locationLongitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], dataPointDetails);
                //shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointDetails)
                break;
              default:
                dataPointDetails.color = 'green'; //default color
                shape = L.polygon([[dataPoint.locationLatitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.locationLongitude - 0.0015 * POLYGON_MAGNIFY_RATIO], [dataPoint.locationLatitude + 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.locationLongitude], [dataPoint.locationLatitude - 0.001 * POLYGON_MAGNIFY_RATIO, dataPoint.locationLongitude + 0.0015 * POLYGON_MAGNIFY_RATIO]], dataPointDetails);
            }

            shape.on('click', this.setTarget).on('click', function () {
              return _this3.drawChart(REDRAW_CHART);
            });

            this.createPopup(shape, stickyPopupInfo);

            return shape;
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
            var _this4 = this;

            if (this.ctrl.panel.mapCenter === 'cityenv' && this.ctrl.isADiferentCity()) {
              this.ctrl.setNewCoords().then(function () {
                return _this4.map.flyTo([parseFloat(_this4.ctrl.panel.mapCenterLatitude), parseFloat(_this4.ctrl.panel.mapCenterLongitude)]);
              }).catch(function (error) {
                return console.log(error);
              });
              return;
            }

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
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(parseInt(zoomFactor, 10));
          }
        }, {
          key: 'drawChart',
          value: function drawChart(redrawChart) {
            if (currentTargetForChart == null || this.timeSeries == null) {
              console.log("unnable to drawChart");
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
