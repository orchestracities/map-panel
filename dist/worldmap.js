'use strict';

System.register(['lodash', './vendor/highcharts/highstock', './vendor/leaflet/leaflet', 'app/core/config', './utils', './definitions'], function (_export, _context) {
  "use strict";

  var _, Highcharts, L, config, showPollutants, showHealthConcerns, calculateAQI, AQI, carsCount, HIGHCHARTS_THEME_DARK, tileServers, carMarker, _createClass, providedPollutants, timeSeries, chartData, chartSeries, mapControl, mapZoom, globalCircles, globalMarkers, globalPolylines, circlesLayer, polylinesLayer, currentTargetForChart, currentParameterForChart, WorldMap;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function drawChart(providedPollutants, e, redrawChart) {
    var currentParameter = currentParameterForChart.toLowerCase();

    var chart = document.getElementById('dataChart');
    chart.style.display = 'block';

    var id = e.target.options.id;
    var type = e.target.options.type;

    var values = timeSeries.values[id];
    var title = '';
    var parameterUnit = '';

    try {
      var lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values

      var aqiIndex = calculateAQI(AQI, lastValueMeasure);

      // Show Pollutants Legend (MAP)
      if (type === 'AirQualityObserved') {
        var allPollutants = timeSeries.pollutants;
        showPollutants(providedPollutants, allPollutants, id, lastValueMeasure, currentParameterForChart);
        showHealthConcerns(providedPollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
      } else {
        // Hide legend
        var mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
        var mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

        if (mapDivHeight >= 405 && mapDivWidth >= 860) {
          document.getElementById('traffic_table').style.display = 'block';
        }
        document.getElementById('health_concerns_wrapper').style.display = 'none';
        document.getElementById('measures_table').style.display = 'none';
      }
    } catch (error) {
      console.log("Woaa! Something went wrong... Probably there is no recent data for the selected device. Here you have the error:");
      console.log(error);
    }

    // ------

    if (redrawChart) {
      chartData = [];

      parameterUnit = providedPollutants[currentParameter].unit;

      title = providedPollutants[currentParameter].name + ' - Device ' + id;

      if (type === 'AirQualityObserved' && currentParameter !== 'aqi') {

        var parameterChoice = timeSeries.pollutants[currentParameter];

        parameterChoice.forEach(function (sensor) {
          if (sensor.id === id) {
            var time = new Date(sensor.time);

            var day = time.getDate();
            var month = time.getMonth();
            var year = time.getFullYear();
            var hour = time.getHours() - 1;
            var minutes = time.getMinutes();
            var seconds = time.getSeconds();
            var milliseconds = time.getMilliseconds();

            chartData.push([Date.UTC(year, month, day, hour + 1, minutes, seconds, milliseconds), sensor.value]);
          }
        });
      }
      if (type === 'AirQualityObserved' && currentParameter === 'aqi' || type === 'TrafficFlowObserved') {

        if (type === 'TrafficFlowObserved') {
          title = 'Cars Intensity - Device ' + id;
          parameterUnit = 'Cars';
        }

        values.forEach(function (value) {
          var time = new Date(value.time);

          var day = time.getDate();
          var month = time.getMonth();
          var year = time.getFullYear();
          var hour = time.getHours() - 1;
          var minutes = time.getMinutes();
          var seconds = time.getSeconds();
          var milliseconds = time.getMilliseconds();

          chartData.push([Date.UTC(year, month, day, hour + 1, minutes, seconds, milliseconds), value.value]);
        });
      }

      if (!config.bootData.user.lightTheme) window.Highcharts.setOptions(HIGHCHARTS_THEME_DARK);

      window.Highcharts.stockChart('graphContainer', {
        chart: {
          height: 200,
          zoomType: 'x',
          events: {
            load: function load() {
              // set up the updating of the chart each second
              chartSeries = this.series[0];
            }
          }
        },
        title: {
          text: title
        },
        subtitle: {
          text: ''
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: parameterUnit
          }
        },
        legend: {
          enabled: false
        },
        rangeSelector: {
          buttons: [{
            count: 5,
            type: 'minute',
            text: '5M'
          }, {
            count: 10,
            type: 'minute',
            text: '10M'
          }, {
            type: 'all',
            text: 'All'
          }],
          inputEnabled: false,
          selected: 2
        },

        series: [{
          name: title,
          data: chartData
        }]
      });
    }
  }
  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_vendorHighchartsHighstock) {
      Highcharts = _vendorHighchartsHighstock.default;
    }, function (_vendorLeafletLeaflet) {
      L = _vendorLeafletLeaflet.default;
    }, function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_utils) {
      showPollutants = _utils.showPollutants;
      showHealthConcerns = _utils.showHealthConcerns;
      calculateAQI = _utils.calculateAQI;
    }, function (_definitions) {
      AQI = _definitions.AQI;
      carsCount = _definitions.carsCount;
      HIGHCHARTS_THEME_DARK = _definitions.HIGHCHARTS_THEME_DARK;
      tileServers = _definitions.tileServers;
      carMarker = _definitions.carMarker;
    }],
    execute: function () {
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

      providedPollutants = void 0;
      timeSeries = {};
      chartData = [];
      chartSeries = void 0;
      mapControl = void 0;
      mapZoom = void 0;
      globalCircles = [];
      globalMarkers = [];
      globalPolylines = [];
      circlesLayer = void 0;
      polylinesLayer = void 0;
      currentTargetForChart = null;
      currentParameterForChart = 'AQI';

      WorldMap = function () {
        function WorldMap(ctrl, mapContainer) {
          _classCallCheck(this, WorldMap);

          this.ctrl = ctrl;
          this.mapContainer = mapContainer;
          this.createMap();
          this.circles = [];
        }

        _createClass(WorldMap, [{
          key: 'createMap',
          value: function createMap() {
            circlesLayer = window.L.layerGroup();
            polylinesLayer = window.L.layerGroup();

            var mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
            mapControl = this.map = window.L.map(this.mapContainer, { worldCopyJump: true, center: mapCenter, zoomControl: false, attributionControl: false, layers: [polylinesLayer, circlesLayer] }).fitWorld();
            // .zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
            this.map.setZoom(this.ctrl.panel.initialZoom);
            this.map._initPathRoot();
            this.map._updatePathViewport();

            this.map.panTo(mapCenter);
            window.L.control.zoom({ position: 'topright' }).addTo(this.map);

            circlesLayer.addTo(mapControl);
            polylinesLayer.addTo(mapControl);

            var baseMaps = {};

            var overlayMaps = {
              "Environment Data": circlesLayer,
              "Traffic Data": polylinesLayer
            };

            window.L.control.layers(baseMaps, overlayMaps).addTo(mapControl);

            this.map.on('zoomstart', function (e) {
              mapZoom = mapControl.getZoom();
            });

            this.map.on('click', function (e) {
              document.getElementById('measures_table').style.display = 'none';
              document.getElementById('health_concerns_wrapper').style.display = 'none';
              document.getElementById('environment_table').style.display = 'none';
              document.getElementById('traffic_table').style.display = 'none';

              currentTargetForChart = null;
            });

            var selectedTileServer = tileServers[this.ctrl.tileServer];
            window.L.tileLayer(selectedTileServer.url, {
              maxZoom: 18,
              subdomains: selectedTileServer.subdomains,
              reuseTiles: true,
              detectRetina: true,
              attribution: selectedTileServer.attribution
            }).addTo(this.map, true);

            var airParametersDropdown = document.getElementById('airParametersDropdown');

            airParametersDropdown.addEventListener('change', function () {
              currentParameterForChart = this.value;
              drawChart(providedPollutants, currentTargetForChart, 1);
            });
          }
        }, {
          key: 'filterEmptyAndZeroValues',
          value: function filterEmptyAndZeroValues(data) {
            var _this = this;

            return _.filter(data, function (o) {
              return !(_this.ctrl.panel.hideEmpty && _.isNil(o.value)) && !(_this.ctrl.panel.hideZero && o.value === 0);
            });
          }
        }, {
          key: 'clearCircles',
          value: function clearCircles() {
            circlesLayer.clearLayers();
          }
        }, {
          key: 'clearMarkers',
          value: function clearMarkers() {
            if (this.markersLayer) {
              this.markersLayer.clearLayers();
              this.removeMarkers(this.markersLayer);
              globalMarkers = [];
            }
          }
        }, {
          key: 'clearPolylines',
          value: function clearPolylines() {
            polylinesLayer.clearLayers();
          }
        }, {
          key: 'dataTreatment',
          value: function dataTreatment(data) {
            var finalData = {};
            var auxData = {};

            data.forEach(function (value) {
              if (!finalData[value.id]) {
                finalData[value.id] = [];
              }
              if (value.type === 'AirQualityObserved') {
                finalData[value.id].push({ 'id': value.id, 'locationLatitude': value.locationLatitude, 'locationLongitude': value.locationLongitude, 'time': value.time, 'type': value.type, 'value': value.value, 'pollutants': value.pollutants });
              } else {
                finalData[value.id].push({ 'id': value.id, 'locationLatitude': value.locationLatitude, 'locationLongitude': value.locationLongitude, 'time': value.time, 'type': value.type, 'value': value.value });
              }
            });

            return finalData;
          }
        }, {
          key: 'drawPoints',
          value: function drawPoints() {

            try {
              providedPollutants = JSON.parse(this.ctrl.panel.pollutants);
            } catch (error) {
              throw new Error('Please insert a valid JSON in the Available Pollutants field');
            }

            this.hideAllTables();

            var data = this.filterEmptyAndZeroValues(this.ctrl.data);

            this.clearCircles();
            // this.clearMarkers();
            this.clearPolylines();

            timeSeries = {};

            var treatedData = this.dataTreatment(data);

            this.createTimeSeries(treatedData);
            this.createPoints(treatedData);

            // Id sensor selected and new data arrives the chart will be updated (no redraw)
            if (currentTargetForChart !== null) {
              drawChart(providedPollutants, currentTargetForChart, 0); // call drawChart but redraw the chart just update information related

              var targetType = currentTargetForChart.target.options.type;
              var targetId = currentTargetForChart.target.options.id;
              var currentParameter = currentParameterForChart.toLowerCase();
              var lastMeasure = void 0;
              var lastTime = void 0;

              try {

                if (targetType === 'AirQualityObserved') {
                  var timeEnvironment = void 0;
                  if (currentParameter !== 'aqi') {
                    timeEnvironment = timeSeries.pollutants[currentParameter];
                    timeEnvironment.forEach(function (val) {
                      if (val.id === targetId) {
                        lastTime = val.time;
                        lastMeasure = val.value;
                      }
                    });
                  } else {
                    timeEnvironment = timeSeries.values[targetId];
                    lastMeasure = timeEnvironment[timeEnvironment.length - 1].value;
                    lastTime = timeEnvironment[timeEnvironment.length - 1].time;
                  }
                }
                if (targetType === 'TrafficFlowObserved') {
                  var timeTraffic = timeSeries.values[targetId];
                  lastMeasure = timeTraffic[timeTraffic.length - 1].value;
                  lastTime = timeTraffic[timeTraffic.length - 1].time;
                }

                var time = new Date(lastTime);

                var day = time.getDate();
                var month = time.getMonth();
                var year = time.getFullYear();
                var hour = time.getHours() - 1;
                var minutes = time.getMinutes();
                var seconds = time.getSeconds();
                var milliseconds = time.getMilliseconds();

                var chartLastDisplayedValue = chartSeries.data[chartSeries.data.length - 1].y;
                var chartLastDisplayedTime = chartSeries.data[chartSeries.data.length - 1].x;
                var chartLastDisplayedId = chartSeries.name.split(' ');
                chartLastDisplayedId = parseInt(chartLastDisplayedId[chartLastDisplayedId.length - 1]);

                if (!(lastTime === chartLastDisplayedTime && lastMeasure === chartLastDisplayedValue && targetId === chartLastDisplayedId)) {
                  chartSeries.addPoint([Date.UTC(year, month, day, hour + 1, minutes, seconds, milliseconds), lastMeasure], true, true);
                }
              } catch (error) {
                console.log("Woaa! Something went wrong... Probably there is no recent data for the selected device. Here you have the error:");
                console.log(error);
              }
            }
          }
        }, {
          key: 'hideAllTables',
          value: function hideAllTables() {
            var mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
            var mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

            // Remove the map secundary data (tables) when the map div is too small
            if (mapDivHeight <= 405 || mapDivHeight <= 860) {
              document.getElementById('measures_table').style.display = 'none';
              document.getElementById('health_concerns_wrapper').style.display = 'none';
              document.getElementById('environment_table').style.display = 'none';
              document.getElementById('traffic_table').style.display = 'none';
            }
          }
        }, {
          key: 'createTimeSeries',
          value: function createTimeSeries(data) {
            timeSeries = {};
            var valueValues = {};
            var values = [];
            var pollutantsValues = [];

            Object.keys(data).forEach(function (key) {
              data[key].forEach(function (point) {
                var id = point.id;
                var time = point.time;
                var pollutants = '';

                var value = point.value;
                if (point.type === 'AirQualityObserved') {
                  pollutants = point.pollutants;
                  var pollutantsTemp = {};

                  pollutants.forEach(function (pollutant) {
                    if (!pollutantsValues[pollutant.name]) {
                      pollutantsValues[pollutant.name] = [];
                    }
                    pollutantsValues[pollutant.name].push({ 'time': time, 'value': pollutant.value, 'id': id });
                  });
                }

                if (!valueValues[point.id]) {
                  valueValues[point.id] = [];
                }
                valueValues[point.id].push({ 'time': time, 'value': value, 'id': id });
              });
            });
            timeSeries = { 'values': valueValues, 'pollutants': pollutantsValues };
          }
        }, {
          key: 'createPoints',
          value: function createPoints(data) {
            var _this2 = this;

            Object.keys(data).forEach(function (key) {
              var value = data[key][data[key].length - 1]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
              if (value.type === 'AirQualityObserved') {
                var newCircle = _this2.createCircle(value);
                circlesLayer.addLayer(newCircle);
                // globalCircles.push(newCircle);
                // circlesLayer = this.addCircles(globalCircles);
              } else if (value.type === 'TrafficFlowObserved') {
                _this2.createMarker(value);
                // const newMarker = this.createMarker(dataPoint);
                // globalMarkers.push(newMarker);
                // this.markersLayer = this.addMarkers(globalMarkers);
              } else {
                console.log('Map point type ' + value.type + ' invalid. Must be AirQualityObserved or TrafficFlowObserved');
              }
            });
            // mapControl.removeLayer(circlesLayer);

            // setTimeout(function(){
            //     mapControl.addLayer(circlesLayer);
            // }, 5000);
          }
        }, {
          key: 'createMarker',
          value: function createMarker(dataPoint) {
            // const marker = window.L.marker([dataPoint.locationLatitude, dataPoint.locationLongitude]);
            var way = this.calculatePointPolyline(dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value, dataPoint.id, dataPoint.type);
            // this.createPopupMarker(marker, dataPoint.value);
            // return marker;
          }
        }, {
          key: 'createPolyline',
          value: function createPolyline(way, value, id, type, street_name) {
            var polyline = [];
            // way.forEach((point) => {
            //   polyline.push([point[1], point[0]]);
            // });

            var colorIndex = void 0;
            carsCount.range.forEach(function (_value, index) {
              if (value > _value) {
                colorIndex = index;
              }
            });

            var color = carsCount.color[colorIndex];

            var polygon = window.L.polyline(way, {
              color: color,
              weight: 5,
              smoothFactor: 5,
              id: id,
              type: type
            }).on('click', function (e) {
              drawChart(providedPollutants, e, 1);
            }).on('click', this.setTarget).on('click', this.removePollDropdown);

            // globalPolylines.push(polygon);
            // polylinesLayer = this.addPolylines(globalPolylines);

            polylinesLayer.addLayer(polygon);

            this.createPopupPolyline(polygon, value, street_name);
          }
        }, {
          key: 'calculatePointPolyline',
          value: function calculatePointPolyline(latitude, longitude, value, id, type) {
            var way = this.nominatim(latitude, longitude, value, id, type);
            return way;
          }
        }, {
          key: 'nominatim',
          value: function nominatim(latitude, longitude, value, id, type) {
            var _this3 = this;

            var urlStart = 'https://nominatim-antwerp-x.s.orchestracities.com/reverse?format=json&';
            var urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

            window.$.ajax({
              url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
              type: 'GET',
              dataType: 'json',
              cache: false,
              success: function success(data) {
                var street_name = '';

                if (data.address) {
                  if (data.address.road) {
                    street_name += 'data.address.road, ';
                  }
                  if (data.address.city) {
                    street_name += data.address.city;
                  }

                  if (data.address.country) {
                    if (data.address.city || data.address.road) {
                      street_name += ', ';
                    }
                    street_name += data.address.country;
                  }
                }

                if (data.osm_id) {
                  _this3.osm(data.osm_id, value, id, type, street_name);
                } else {
                  console.log("OSM ID not found for: " + latitude + ";" + longitude);
                }
                // this.createPolyline(data.geojson.coordinates, value, id, type);
              },
              error: function error(_error) {
                // this.osm(120550284, value, id, type);
                console.log('Nominatim Error');
                console.log(_error);
              }
            });
          }
        }, {
          key: 'osm',
          value: function osm(osm_id, value, id, type, street_name) {
            var _this4 = this;

            var url = 'https://api.openstreetmap.org/api/0.6/way/' + osm_id + '/full';
            var wayCoordinates = [];
            var nodesAux = {};

            window.$.ajax({
              url: url,
              type: 'GET',
              dataType: 'xml',
              cache: false,
              success: function success(data) {
                var nodes = data.getElementsByTagName('node');
                var nds = data.getElementsByTagName('nd');

                var i = void 0;
                for (i = 0; i < nodes.length; i++) {
                  var nodeId = nodes[i].attributes.id.value;
                  var lat = parseFloat(nodes[i].attributes.lat.value);
                  var lon = parseFloat(nodes[i].attributes.lon.value);

                  if (!nodesAux[nodeId]) {
                    nodesAux[nodeId] = {};
                  }
                  nodesAux[nodeId].lat = lat;
                  nodesAux[nodeId].lng = lon;
                }

                for (i = 0; i < nds.length; i++) {
                  var nd = nds[i].attributes.ref.value;

                  wayCoordinates.push([nodesAux[nd].lat, nodesAux[nd].lng]);
                }
                _this4.createPolyline(wayCoordinates, value, id, type, street_name);
              },
              error: function error(_error2) {
                console.log('OSM Error');
                console.log(_error2);
              }
            });
          }
        }, {
          key: 'createCircle',
          value: function createCircle(dataPoint) {
            var aqi = calculateAQI(AQI, dataPoint.value);
            var aqiColor = AQI.color[aqi];
            var aqiMeaning = AQI.meaning[aqi];
            var aqiRisk = AQI.risks[aqi];
            var pollutants = dataPoint.pollutants;
            var id = dataPoint.id;
            var type = dataPoint.type;

            pollutants.push({ 'name': 'aqi', 'value': dataPoint.value });

            var circle = window.L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], 200, {
              color: aqiColor,
              fillColor: aqiColor,
              fillOpacity: 0.5,
              aqiColor: aqiColor,
              aqiMeaning: aqiMeaning,
              aqiRisk: aqiRisk,
              pollutants: pollutants,
              id: id,
              type: type,
              latitude: dataPoint.locationLatitude,
              longitude: dataPoint.locationLongitude,
              aqi: dataPoint.value
            }).on('click', function (e) {
              drawChart(providedPollutants, e, 1);
            }).on('click', this.setTarget).on('click', this.addPollDropdown);

            this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
            return circle;
          }
        }, {
          key: 'addPollDropdown',
          value: function addPollDropdown() {
            // Add pollutants chart dropdown 
            document.getElementById('dataDetails').style.display = 'block';

            // Remove traffic colors table
            document.getElementById('traffic_table').style.display = 'none';

            var mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
            var mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

            // Only show the map secundary data (tables) when the map div is not too small
            if (mapDivHeight >= 405 && mapDivWidth >= 860) {
              // Add environment colors table
              document.getElementById('environment_table').style.display = 'block';
            }
          }
        }, {
          key: 'removePollDropdown',
          value: function removePollDropdown() {
            // Remove pollutants chart dropdown
            document.getElementById('dataDetails').style.display = 'none';

            // Remove environmentcolors table
            document.getElementById('environment_table').style.display = 'none';

            var mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
            var mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

            // Only show the map secundary data (tables) when the map div is not too small
            if (mapDivHeight >= 405 && mapDivWidth >= 860) {
              // Add traffic colors table
              document.getElementById('traffic_table').style.display = 'block';
            }
          }
        }, {
          key: 'createPopupMarker',
          value: function createPopupMarker(marker, value) {
            var label = 'Cars: ' + value;
            marker.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            marker.on('mouseover', function onMouseOver(evt) {
              // const layer = evt.target;
              // layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              marker.on('mouseout', function onMouseOut() {
                marker.closePopup();
              });
            }
          }
        }, {
          key: 'createPopupCircle',
          value: function createPopupCircle(circle, aqi, aqiMeaning) {
            var label = ('AQI: ' + aqi + ' (' + aqiMeaning + ')').trim();
            circle.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            circle.on('mouseover', function onMouseOver(evt) {
              // const layer = evt.target;
              // layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              circle.on('mouseout', function onMouseOut() {
                circle.closePopup();
              });
            }
          }
        }, {
          key: 'createPopupPolyline',
          value: function createPopupPolyline(polyline, value, street_name) {
            var label = void 0;

            if (street_name !== '') {
              label = ('Street: ' + street_name + '</br>Cars Intensity: ' + value).trim();
            } else {
              label = ('Cars Intensity: ' + value).trim();
            }

            polyline.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            polyline.on('mouseover', function onMouseOver(evt) {
              // const layer = evt.target;
              // layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              polyline.on('mouseout', function onMouseOut() {
                polyline.closePopup();
              });
            }
          }
        }, {
          key: 'setTarget',
          value: function setTarget(e) {
            currentTargetForChart = e;
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
          key: 'addMarkers',
          value: function addMarkers(markers) {
            return window.L.layerGroup(markers).addTo(this.map);
          }
        }, {
          key: 'addPolylines',
          value: function addPolylines(polylines) {
            return window.L.layerGroup(polylines).addTo(this.map);
          }
        }, {
          key: 'removeCircles',
          value: function removeCircles() {
            this.map.removeLayer(circlesLayer);
          }
        }, {
          key: 'removeMarkers',
          value: function removeMarkers() {
            this.map.removeLayer(this.markersLayer);
          }
        }, {
          key: 'removePolylines',
          value: function removePolylines() {
            this.map.removeLayer(polylinesLayer);
          }
        }, {
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(parseInt(zoomFactor, 10));
          }
        }]);

        return WorldMap;
      }();

      _export('default', WorldMap);
    }
  };
});
//# sourceMappingURL=worldmap.js.map
