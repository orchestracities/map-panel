'use strict';

System.register(['lodash', './libs/highstock', './libs/leaflet'], function (_export, _context) {
  "use strict";

  var _, Highcharts, L, _createClass, AQI, carsCount, providedPollutants, timeSeries, chartData, chartSeries, mapControl, mapZoom, globalCircles, globalMarkers, globalPolylines, currentTargetForChart, currentParameterForChart, tileServers, carMarker, WorldMap;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function showPollutants(providedPollutants, allPollutants, id, aqi) {

    var measuresTable = document.getElementById('measures-table');

    while (measuresTable.rows[0]) {
      measuresTable.deleteRow(0);
    } // Remove air paramters from dropdown
    var el = document.getElementById('airParametersDropdown');
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    // ---

    // Add default pollutant option to dropdown
    var defaultPollutantOption = document.createElement('option');
    var html = '<option value="0" selected="selected">Air Parameter</option>';

    defaultPollutantOption.innerHTML = html;
    document.getElementById('airParametersDropdown').appendChild(defaultPollutantOption);

    // -----


    var pollutantsToShow = {};

    var _loop = function _loop(key) {
      allPollutants[key].forEach(function (_value) {
        if (_value.id === id) {
          if (!pollutantsToShow[key]) {
            pollutantsToShow[key] = 0;
          }
          pollutantsToShow[key] = _value.value;
        }
      });
    };

    for (var key in allPollutants) {
      _loop(key);
    }

    pollutantsToShow['aqi'] = aqi;

    for (var pollutant in pollutantsToShow) {
      var row = measuresTable.insertRow(0);
      row.className = 'measure';

      var innerCell0 = providedPollutants[pollutant].name;
      var innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;

      var cell0 = row.insertCell(0);
      var cell1 = row.insertCell(1);

      cell0.innerHTML = innerCell0;
      cell1.innerHTML = innerCell1;
      cell0.className = 'cell';
      cell1.className = 'cell';

      // Add Pollutants to Chart Dropdown
      var newPollutant = document.createElement('option');

      newPollutant.id = 'pollutantOption';
      newPollutant.value = pollutant.toUpperCase();

      newPollutant.innerHTML = providedPollutants[pollutant].name;

      document.getElementById('airParametersDropdown').appendChild(newPollutant);

      // ----
    };
    var mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
    var mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      document.getElementById('environmentTable').style.display = 'block';
      document.getElementById('measuresTable').style.display = 'block';
    }
  }

  function showHealthConcerns(providedPollutants, risk, color, meaning) {
    var healthConcernsWrapper = document.getElementById('healthConcernsWrapper');
    var healthConcerns = document.getElementById('healthConcerns');
    var healthRisk = document.getElementById('healthRisk');

    var mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
    var mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      healthConcernsWrapper.style.display = 'block';
      healthConcerns.style.backgroundColor = color;
      healthRisk.innerHTML = risk;
    }
  }

  function calculateAQI(aqi) {
    var aqiIndex = void 0;
    AQI.range.forEach(function (value, index) {
      if (aqi >= value) {
        aqiIndex = index;
      }
    });
    return aqiIndex;
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

    var lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values

    var aqiIndex = calculateAQI(lastValueMeasure);

    // Show Pollutants Legend (MAP)
    if (type === 'environment') {
      var allPollutants = timeSeries.pollutants;
      showPollutants(providedPollutants, allPollutants, id, lastValueMeasure);
      showHealthConcerns(providedPollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
    } else {
      // Hide legend
      var mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
      var mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

      if (mapDivHeight >= 405 && mapDivWidth >= 860) {
        document.getElementById('trafficTable').style.display = 'block';
      }
      document.getElementById('healthConcernsWrapper').style.display = 'none';
      document.getElementById('measuresTable').style.display = 'none';
    }
    // ------

    if (redrawChart) {
      chartData = [];

      parameterUnit = providedPollutants[currentParameter].unit;

      title = providedPollutants[currentParameter].name + ' - Sensor ' + id;

      if (type === 'environment' && currentParameter !== 'aqi') {

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

            chartData.push([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), sensor.value]);
          }
        });
      }
      if (type === 'environment' && currentParameter === 'aqi' || type === 'traffic') {

        if (type === 'traffic') {
          title = 'Cars Count - Sensor ' + id;
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

          chartData.push([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), value.value]);
        });
      }

      window.Highcharts.theme = {
        colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
        chart: {
          backgroundColor: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
            stops: [[0, '#2a2a2b'], [1, '#3e3e40']]
          },
          style: {
            fontFamily: '\'Unica One\', sans-serif'
          },
          plotBorderColor: '#606063'
        },
        title: {
          style: {
            color: '#E0E0E3',
            // textTransform: 'uppercase',
            fontSize: '20px'
          }
        },
        subtitle: {
          style: {
            color: '#E0E0E3',
            textTransform: 'uppercase'
          }
        },
        xAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
              color: '#E0E0E3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          title: {
            style: {
              color: '#A0A0A3'

            }
          }
        },
        yAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
              color: '#E0E0E3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          tickWidth: 1,
          title: {
            style: {
              color: '#A0A0A3'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          style: {
            color: '#F0F0F0'
          }
        },
        plotOptions: {
          series: {
            dataLabels: {
              color: '#B0B0B3'
            },
            marker: {
              lineColor: '#333'
            }
          },
          boxplot: {
            fillColor: '#505053'
          },
          candlestick: {
            lineColor: 'white'
          },
          errorbar: {
            color: 'white'
          }
        },
        legend: {
          itemStyle: {
            color: '#E0E0E3'
          },
          itemHoverStyle: {
            color: '#FFF'
          },
          itemHiddenStyle: {
            color: '#606063'
          }
        },
        credits: {
          style: {
            color: '#666'
          }
        },
        labels: {
          style: {
            color: '#707073'
          }
        },

        drilldown: {
          activeAxisLabelStyle: {
            color: '#F0F0F3'
          },
          activeDataLabelStyle: {
            color: '#F0F0F3'
          }
        },

        navigation: {
          buttonOptions: {
            symbolStroke: '#DDDDDD',
            theme: {
              fill: '#505053'
            }
          }
        },

        // scroll charts
        rangeSelector: {
          buttonTheme: {
            fill: '#505053',
            stroke: '#000000',
            style: {
              color: '#CCC'
            },
            states: {
              hover: {
                fill: '#707073',
                stroke: '#000000',
                style: {
                  color: 'white'
                }
              },
              select: {
                fill: '#000003',
                stroke: '#000000',
                style: {
                  color: 'white'
                }
              }
            }
          },
          inputBoxBorderColor: '#505053',
          inputStyle: {
            backgroundColor: '#333',
            color: 'silver'
          },
          labelStyle: {
            color: 'silver'
          }
        },

        navigator: {
          handles: {
            backgroundColor: '#666',
            borderColor: '#AAA'
          },
          outlineColor: '#CCC',
          maskFill: 'rgba(255,255,255,0.1)',
          series: {
            color: '#7798BF',
            lineColor: '#A6C7ED'
          },
          xAxis: {
            gridLineColor: '#505053'
          }
        },

        scrollbar: {
          barBackgroundColor: '#808083',
          barBorderColor: '#808083',
          buttonArrowColor: '#CCC',
          buttonBackgroundColor: '#606063',
          buttonBorderColor: '#606063',
          rifleColor: '#FFF',
          trackBackgroundColor: '#404043',
          trackBorderColor: '#404043'
        },

        // special colors for some of the
        legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        background2: '#505053',
        dataLabelsColor: '#B0B0B3',
        textColor: '#C0C0C0',
        contrastTextColor: '#F0F0F3',
        maskColor: 'rgba(255,255,255,0.3)'
      };
      window.Highcharts.setOptions(window.Highcharts.theme);

      window.Highcharts.stockChart('graphContainer', {
        chart: {
          zoomType: 'x',
          backgroundColor: '#1f1d1d',
          events: {
            load: function load() {
              // set up the updating of the chart each second
              chartSeries = this.series[0];
              // setInterval(function () {
              //     const x = chartData[chartData.length - 1][0];
              //     const y = chartData[chartData.length - 1][1];
              //     series.addPoint([x, y], true, true);
              //     //console.log(chartData[chartData.length - 1]);
              // }, 1000);
            }
          }
        },
        title: {
          text: title
        },
        subtitle: {
          text: document.ontouchstart === undefined ? '' : ''
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
    }, function (_libsHighstock) {
      Highcharts = _libsHighstock.default;
    }, function (_libsLeaflet) {
      L = _libsLeaflet.default;
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

      AQI = {
        'range': [0, 50, 100, 150, 200, 300, 500],
        'meaning': ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
        'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023'],
        'risks': ['Air quality is considered satisfactory, and air pollution poses little or no risk.', 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', 'Health alert: everyone may experience more serious health effects.', 'Health warnings of emergency conditions. The entire population is more likely to be affected.']
      };
      carsCount = {
        'range': [0, 15, 30, 45, 70, 85, 100],
        'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023']
      };
      providedPollutants = void 0;
      timeSeries = {};
      chartData = [];
      chartSeries = void 0;
      mapControl = void 0;
      mapZoom = void 0;
      globalCircles = [];
      globalMarkers = [];
      globalPolylines = [];
      currentTargetForChart = null;
      currentParameterForChart = 'aqi';
      tileServers = {
        'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' }
      };
      carMarker = window.L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Map_marker.svg/2000px-Map_marker.svg.png',

        iconSize: [25, 40] // size of the icon
        // iconAnchor: [15, 82], // point of the icon which will correspond to marker's location
        // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
      });

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

            var mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
            mapControl = this.map = window.L.map(this.mapContainer, { worldCopyJump: true, center: mapCenter, zoomControl: false, attributionControl: false }).fitWorld();
            // .zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
            this.map.setZoom(this.ctrl.panel.initialZoom);
            this.map._initPathRoot();
            this.map._updatePathViewport();

            this.map.panTo(mapCenter);
            window.L.control.zoom({ position: 'topright' }).addTo(this.map);

            this.map.on('zoomstart', function (e) {
              mapZoom = mapControl.getZoom();
            });

            this.map.on('click', function (e) {
              document.getElementById('measuresTable').style.display = 'none';
              document.getElementById('healthConcernsWrapper').style.display = 'none';
              document.getElementById('dataChart').style.display = 'none';
              document.getElementById('environmentTable').style.display = 'none';
              document.getElementById('trafficTable').style.display = 'none';
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
            if (this.circlesLayer) {
              this.circlesLayer.clearLayers();
              this.removeCircles(this.circlesLayer);
              globalCircles = [];
            }
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
            if (this.polylinesLayer) {
              this.polylinesLayer.clearLayers();
              this.removePolylines(this.polylinesLayer);
              globalPolylines = [];
            }
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
              if (value.type === 'environment') {
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
            this.clearMarkers();
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

              if (targetType === 'environment') {
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
              if (targetType === 'traffic') {
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
                chartSeries.addPoint([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), lastMeasure], true, true);
              }
            }
          }
        }, {
          key: 'hideAllTables',
          value: function hideAllTables() {
            var mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
            var mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

            // Remove the map secundary data (tables) when the map div is too small
            if (mapDivHeight <= 405 || mapDivHeight <= 860) {
              document.getElementById('measuresTable').style.display = 'none';
              document.getElementById('healthConcernsWrapper').style.display = 'none';
              document.getElementById('environmentTable').style.display = 'none';
              document.getElementById('trafficTable').style.display = 'none';
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

                if (point.type === 'environment') {
                  pollutants = point.pollutants;
                }
                var value = point.value;
                if (point.type === 'environment') {
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
              if (value.type === 'environment') {
                var newCircle = _this2.createCircle(value);
                globalCircles.push(newCircle);
                _this2.circlesLayer = _this2.addCircles(globalCircles);
              } else if (value.type === 'traffic') {
                _this2.createMarker(value);
                // const newMarker = this.createMarker(dataPoint);
                // globalMarkers.push(newMarker);
                // this.markersLayer = this.addMarkers(globalMarkers);
              } else {
                console.log('Map point type ' + value.type + ' invalid. Must be environment or traffic');
              }
            });
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
          value: function createPolyline(way, value, id, type) {
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

            globalPolylines.push(polygon);
            this.polylinesLayer = this.addPolylines(globalPolylines);

            this.createPopupPolyline(polygon, value);
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

            var urlStart = 'http://nominatim.openstreetmaps.org/reverse?format=json&';
            var urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

            window.$.ajax({
              url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
              type: 'GET',
              dataType: 'json',
              cache: false,
              success: function success(data) {
                // console.log(data);
                _this3.osm(data.osm_id, value, id, type);
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
          value: function osm(osm_id, value, id, type) {
            var _this4 = this;

            var url = 'http://api.openstreetmap.org/api/0.6/way/' + osm_id + '/full';
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
                _this4.createPolyline(wayCoordinates, value, id, type);
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
            var aqi = calculateAQI(dataPoint.value);
            var aqiColor = AQI.color[aqi];
            var aqiMeaning = AQI.meaning[aqi];
            var aqiRisk = AQI.risks[aqi];
            var pollutants = dataPoint.pollutants;
            var id = dataPoint.id;
            var type = dataPoint.type;

            console.log(id, aqi, aqiColor);

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
            document.getElementById('trafficTable').style.display = 'none';

            var mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
            var mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

            // Only show the map secundary data (tables) when the map div is not too small
            if (mapDivHeight >= 405 && mapDivHeight >= 860) {
              // Add environment colors table
              document.getElementById('environmentTable').style.display = 'block';
            }
          }
        }, {
          key: 'removePollDropdown',
          value: function removePollDropdown() {
            // Remove pollutants chart dropdown
            document.getElementById('dataDetails').style.display = 'none';

            // Remove environmentcolors table
            document.getElementById('environmentTable').style.display = 'none';

            var mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
            var mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

            // Only show the map secundary data (tables) when the map div is not too small
            if (mapDivHeight >= 405 && mapDivHeight >= 860) {
              // Add traffic colors table
              document.getElementById('trafficTable').style.display = 'block';
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
          value: function createPopupPolyline(polyline, value) {
            var label = ('Number of cars: ' + value).trim();
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
          key: 'addCircles',
          value: function addCircles(circles) {
            return window.L.layerGroup(circles).addTo(this.map);
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
            this.map.removeLayer(this.circlesLayer);
          }
        }, {
          key: 'removeMarkers',
          value: function removeMarkers() {
            this.map.removeLayer(this.markersLayer);
          }
        }, {
          key: 'removePolylines',
          value: function removePolylines() {
            this.map.removeLayer(this.polylinesLayer);
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
