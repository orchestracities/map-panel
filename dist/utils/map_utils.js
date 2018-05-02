'use strict';

System.register(['lodash', 'app/core/config', '../definitions'], function (_export, _context) {
  "use strict";

  var _, config, AQI, CARS_COUNT, HIGHCHARTS_THEME_DARK, NOMINATIM_ADDRESS;

  /**
  * Primary functions
  */

  //helper to create series for chart display


  /* Grafana Specific */
  function getTimeSeries(data) {
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

    return { 'values': valueValues, 'pollutants': pollutantsValues };
  }

  // Agregate data by id


  /* App specific */
  // draw components in the map
  /* Vendor specific */
  function dataTreatment(data) {
    var finalData = {};
    var auxData = void 0;

    data.forEach(function (value) {
      if (!finalData[value.id]) {
        finalData[value.id] = [];
      }

      auxData = {
        'id': value.id,
        'locationLatitude': value.locationLatitude,
        'locationLongitude': value.locationLongitude,
        'time': value.time,
        'type': value.type,
        'value': value.value
      };

      if (value.type === 'AirQualityObserved') auxData.pollutants = value.pollutants;

      finalData[value.id].push(auxData);
    });

    return finalData;
  }function getUpdatedChartSeries(chartSeries, timeSeries, currentTargetForChart, currentParameterForChart) {

    if (Object.keys(chartSeries).length === 0) return chartSeries;

    var targetType = currentTargetForChart.target.options.type;
    var targetId = currentTargetForChart.target.options.id;
    var currentParameter = currentParameterForChart.toLowerCase();
    var lastMeasure = void 0;
    var lastTime = void 0;

    try {
      var timeTemp = void 0;
      if (currentParameter !== 'aqi' && targetType === 'AirQualityObserved') {
        timeTemp = timeSeries.pollutants[currentParameter];
        timeTemp.forEach(function (val) {
          if (val.id === targetId) {
            lastTime = val.time;
            lastMeasure = val.value;
          }
        });
      } else {
        timeTemp = timeSeries.values[targetId];
        lastMeasure = timeTemp[timeTemp.length - 1].value;
        lastTime = timeTemp[timeTemp.length - 1].time;
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
      console.log("Error:");
      console.log(error);
    }

    return chartSeries;
  }function processData(chartSeries, timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
    console.log(currentParameterForChart);
    console.log(currentTargetForChart);
    var chartData = [];
    var currentParameter = currentParameterForChart.toLowerCase();
    var id = currentTargetForChart.target.options.id;
    var type = currentTargetForChart.target.options.type;
    var values = timeSeries.values[id];

    var parameterUnit = '';
    var title = '';

    if (type === 'AirQualityObserved' && currentParameter !== 'aqi') {
      parameterUnit = validated_pollutants[currentParameter].unit;
      title = validated_pollutants[currentParameter].name + ' - Device ' + id;

      var parameterChoice = timeSeries.pollutants[currentParameter];
      parameterChoice.forEach(function (sensor) {
        if (sensor.id === id) {
          chartData.push(createLine(sensor));
        }
      });
    } else {
      if (type === 'TrafficFlowObserved') {
        title = 'Cars Intensity - Device ' + id;
        parameterUnit = 'Cars';
      } else {
        title = type + ' - Device ' + id;
        parameterUnit = type;
      }

      values && values.forEach(function (value) {
        chartData.push(createLine(value));
      });
    }

    return [chartData, parameterUnit, title];
  }

  /*
  * Auxiliar functions
  */
  // just for improve DRY
  function createLine(value) {
    var time = new Date(value.time);
    var day = time.getDate();
    var month = time.getMonth();
    var year = time.getFullYear();
    var hour = time.getHours() - 1;
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();
    var milliseconds = time.getMilliseconds();
    return [Date.UTC(year, month, day, hour + 1, minutes, seconds, milliseconds), value.value];
  }

  // Access remote api and gives the coordinates from a city center based on NOMINATIM url server
  function getCityCoordinates(city_name) {
    var url = NOMINATIM_ADDRESS.replace('<city_name>', city_name);
    return fetch(url).then(function (response) {
      return response.json();
    }).then(function (data) {
      return { latitude: data[0].lat, longitude: data[0].lon };
    }).catch(function (error) {
      return console.error(error);
    });
  }

  // Given vars passed as param, retrieves the selected city
  function getSelectedCity(vars) {
    var cityenv_ = vars.filter(function (elem) {
      return elem.name === "cityenv";
    });
    var city = null;
    if (cityenv_ && cityenv_.length === 1) city = cityenv_[0].current.value;

    return city;
  }

  // gets the aqi index from the AQI var
  function calculateAQIIndex(value) {
    var aqiIndex = void 0;
    AQI.range.forEach(function (elem, index) {
      if (value >= elem) {
        aqiIndex = index;
      }
    });
    return aqiIndex;
  }
  // gets the index from the CARS_COUNT const var
  function calculateCarsIntensityIndex(value) {
    CARS_COUNT.range.forEach(function (elem, index) {
      if (value >= elem) {
        return index;
      }
    });
    return 0;
  }

  /*
  * View components controllers
  */
  function drawPopups(panel_id, timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
    if (!currentTargetForChart) return;

    //console.log('drawPopups');
    var selected_id = currentTargetForChart.target.options.id;
    var type = currentTargetForChart.target.options.type;
    var values = timeSeries.values[selected_id];

    hideAllGraphPopups(panel_id);

    //render popups
    try {
      var lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values
      var aqiIndex = calculateAQIIndex(lastValueMeasure);

      // Show Pollutants Legend (MAP)

      switch (type) {
        case 'AirQualityObserved':
          var allPollutants = timeSeries.pollutants;

          if (validated_pollutants) {
            drawPollutantsPopup(panel_id, validated_pollutants, allPollutants, selected_id, lastValueMeasure, currentParameterForChart);
            drawHealthConcernsPopup(panel_id, validated_pollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
          }
          break;
        case 'TrafficFlowObserved':
          drawTrafficFlowPopup(panel_id);
          break;
        default:
          drawDefaultPopups(panel_id);
      }
    } catch (error) {
      console.log("Error:");
      //    console.log(error);
      console.log("selected_id: " + selected_id + ", type: " + type + ", values: " + values);
    }
  }

  /*
  * view components manipulation
  */
  function showDataDetailsSelect(panel_id) {
    document.querySelector('#data_details_' + panel_id).style.display = 'block';
  }function getDataPointValues(dataPoint) {

    var values = {
      id: dataPoint.id,
      type: dataPoint.type,
      latitude: dataPoint.locationLatitude,
      longitude: dataPoint.locationLongitude,
      value: dataPoint.value,
      fillOpacity: 0.5
    };

    if (dataPoint.type === 'AirQualityObserved') {
      var aqi = calculateAQIIndex(dataPoint.value);
      var aqiColor = AQI.color[aqi];
      var aqiMeaning = AQI.meaning[aqi];
      var aqiRisk = AQI.risks[aqi];

      var pollutants = dataPoint.pollutants;
      if (pollutants) {
        pollutants.push({ 'name': 'aqi', 'value': dataPoint.value });
      }

      _.defaults(values, {
        color: aqiColor,
        fillColor: aqiColor,
        aqiColor: aqiColor,
        aqiMeaning: aqiMeaning,
        aqiRisk: aqiRisk,
        pollutants: pollutants,
        aqi: dataPoint.value
      });
    } else {
      if (dataPoint.type === 'TrafficFlowObserved') {
        var color_index = calculateCarsIntensityIndex(dataPoint.value);
        _.defaults(values, {
          color: CARS_COUNT.color[color_index],
          fillColor: CARS_COUNT[color_index]
        });
      }
    }

    return values;
  }function getDataPointStickyInfo(data) {
    var stickyInfo = '<div class="stycky-popup-info">';

    if (data.type === 'AirQualityObserved') {
      stickyInfo += '<div class="head air-quality">Air Quality</div>' + '<div class="body">' + '<div>Device: ' + data.id + '</div>' + '<div>AQI: ' + data.value + ' (' + data.aqiMeaning + ')</div>' + '</div>';
    } else {
      if (data.type === 'TrafficFlowObserved') {
        stickyInfo += '<div class="head traffic-flow">Cars Intensity</div>';
      } else {
        stickyInfo += '<div class="head">' + data.type + '</div>';
      }

      stickyInfo += '<div class="body">' + '<div>Device: ' + data.id + '</div>' + '<div>Value: ' + data.value + '</div>' + '</div>';
    }
    stickyInfo += '</div>';

    return stickyInfo;
  }function renderChart(panel_id, chartSeries, chartData, parameterUnit, title) {

    showDataDetailsSelect(panel_id);
    drawChart(panel_id);

    //config highchart acording with grafana theme
    if (!config.bootData.user.lightTheme) window.Highcharts.setOptions(HIGHCHARTS_THEME_DARK);

    window.Highcharts.stockChart('graph_container_' + panel_id, {
      chart: {
        height: 200,
        zoomType: 'x',
        events: {
          load: function load() {
            chartSeries = this.series[0]; // set up the updating of the chart each second
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
  }function hideAllGraphPopups(panel_id) {
    var map_table_popups = ['measures_table', 'health_concerns_wrapper', 'environment_table', 'traffic_table'];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = map_table_popups[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var map_table_popup = _step.value;

        var popup = document.getElementById(map_table_popup + '_' + panel_id);
        if (popup) popup.style.display = 'none';
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }function drawHealthConcernsPopup(panel_id, providedPollutants, risk, color, meaning, map_size) {
    var healthConcernsWrapper = document.getElementById('health_concerns_wrapper_' + panel_id);
    var healthConcerns = document.querySelector('#health_concerns_wrapper_' + panel_id + '>div');
    var healthConcernsColor = document.querySelector('#health_concerns_wrapper_' + panel_id + '>div>span>span.color');
    var healthRisk = document.getElementById('health_risk_' + panel_id);

    healthConcernsWrapper.style.display = 'block';
    healthConcernsColor.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }function drawDefaultPopups() {}function drawTrafficFlowPopup(panel_id) {
    document.getElementById('traffic_table_' + panel_id).style.display = 'block';
  }function drawChart(panel_id) {
    document.getElementById('data_chart_' + panel_id).style.display = 'block';
  }function drawPollutantsPopup(panel_id, providedPollutants, allPollutants, id, aqi, currentParameterForChart) {

    //no pollutants
    if (!providedPollutants || Object.keys(providedPollutants).length === 0) return;

    var measuresTable = document.querySelector('#measures_table_' + panel_id + ' > table > tbody');
    while (measuresTable.rows[0]) {
      measuresTable.deleteRow(0);
    } // Remove air paramters from dropdown
    var el = document.querySelector('#air_parameters_dropdown_' + panel_id);
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    var pollutantsToShow = {};

    var _loop = function _loop(key) {
      allPollutants[key].forEach(function (_value) {
        if (_value.id === id) {
          if (_value.value) {
            if (!pollutantsToShow[key]) {
              pollutantsToShow[key] = 0;
            }
            pollutantsToShow[key] = _value.value;
          }
        }
      });
    };

    for (var key in allPollutants) {
      _loop(key);
    }

    pollutantsToShow['aqi'] = aqi;

    for (var pollutant in pollutantsToShow) {
      var row = measuresTable.insertRow(0);
      var innerCell0 = providedPollutants[pollutant].name;
      var innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;
      var cell0 = row.insertCell(0);
      var cell1 = row.insertCell(1);

      cell0.innerHTML = innerCell0;
      cell1.innerHTML = innerCell1;

      // Add Pollutants to Chart Dropdown
      var newPollutant = document.createElement('option');
      newPollutant.id = 'pollutantOption';
      newPollutant.value = pollutant.toUpperCase();

      if (currentParameterForChart === newPollutant.value) newPollutant.selected = 'selected';

      newPollutant.innerHTML = providedPollutants[pollutant].name;

      el.appendChild(newPollutant);
      // ----
    }

    document.getElementById('environment_table_' + panel_id).style.display = 'block';
    document.getElementById('measures_table_' + panel_id).style.display = 'block';
  }return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_definitions) {
      AQI = _definitions.AQI;
      CARS_COUNT = _definitions.CARS_COUNT;
      HIGHCHARTS_THEME_DARK = _definitions.HIGHCHARTS_THEME_DARK;
      NOMINATIM_ADDRESS = _definitions.NOMINATIM_ADDRESS;
    }],
    execute: function () {
      _export('processData', processData);

      _export('getTimeSeries', getTimeSeries);

      _export('dataTreatment', dataTreatment);

      _export('getUpdatedChartSeries', getUpdatedChartSeries);

      _export('hideAllGraphPopups', hideAllGraphPopups);

      _export('drawPopups', drawPopups);

      _export('renderChart', renderChart);

      _export('getCityCoordinates', getCityCoordinates);

      _export('getDataPointValues', getDataPointValues);

      _export('getDataPointStickyInfo', getDataPointStickyInfo);

      _export('getSelectedCity', getSelectedCity);
    }
  };
});
//# sourceMappingURL=map_utils.js.map
