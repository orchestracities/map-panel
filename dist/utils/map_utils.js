'use strict';

System.register(['app/core/config', '../definitions'], function (_export, _context) {
  "use strict";

  var config, AQI, HIGHCHARTS_THEME_DARK, MIN_WIDTH_TO_SHOW_MAP_POPUPS, MIN_HEIGHT_TO_SHOW_MAP_POPUPS;
  // draw components in the map

  /* Grafana Specific */
  function drawPollutantsPopup(providedPollutants, allPollutants, id, aqi, currentParameterForChart) {
    var measuresTable = document.querySelector('#measures_table > table > tbody');
    while (measuresTable.rows[0]) {
      measuresTable.deleteRow(0);
    } // Remove air paramters from dropdown
    var el = document.getElementById('air_parameters_dropdown');
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

    document.getElementById('environment_table').style.display = 'block';
    document.getElementById('measures_table').style.display = 'block';
  }

  function drawHealthConcernsPopup(providedPollutants, risk, color, meaning, map_size) {
    var healthConcernsWrapper = document.getElementById('health_concerns_wrapper');
    var healthConcerns = document.querySelector('#health_concerns_wrapper>div');
    var healthConcernsColor = document.querySelector('#health_concerns_wrapper>div>span>span.color');
    var healthRisk = document.getElementById('health_risk');

    healthConcernsWrapper.style.display = 'block';
    healthConcernsColor.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }function drawDefaultPopups() {
    document.getElementById('traffic_table').style.display = 'block';
  }

  function drawPopups(timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
    //console.log('drawPopups');
    var id = currentTargetForChart.target.options.id;
    var type = currentTargetForChart.target.options.type;
    var values = timeSeries.values[id];

    document.getElementById('data_chart').style.display = 'block';

    hideAll();

    //render popups
    try {
      var lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values
      var aqiIndex = calculateAQI(lastValueMeasure);

      // Show Pollutants Legend (MAP)
      if (type === 'AirQualityObserved') {
        var allPollutants = timeSeries.pollutants;

        if (validated_pollutants) {
          drawPollutantsPopup(validated_pollutants, allPollutants, id, lastValueMeasure, currentParameterForChart);
          drawHealthConcernsPopup(validated_pollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
        }
      } else {
        // Hide legend
        drawDefaultPopups();
      }
    } catch (error) {
      console.log("Exception:");
      console.log(error);
      console.log("id:");
      console.log(id);
      console.log("type:");
      console.log(type);
      console.log("values are:");
      console.log(values);
    }
  }function calculateAQI(aqi) {
    var aqiIndex = void 0;
    AQI.range.forEach(function (value, index) {
      if (aqi >= value) {
        aqiIndex = index;
      }
    });
    return aqiIndex;
  }

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
  /*
  * Agregate data by id
  */
  function dataTreatment(data) {
    var finalData = {};
    var auxData = {};

    data.forEach(function (value) {
      if (!finalData[value.id]) {
        finalData[value.id] = [];
      }

      //if (value.type === 'AirQualityObserved'){
      finalData[value.id].push({
        'id': value.id,
        'locationLatitude': value.locationLatitude,
        'locationLongitude': value.locationLongitude,
        'time': value.time,
        'type': value.type,
        'value': value.value,
        'pollutants': value.pollutants
      });
      // }
      // else {
      //     finalData[value.id].push(
      //       {
      //         'id': value.id, 
      //         'locationLatitude': value.locationLatitude, 
      //         'locationLongitude': value.locationLongitude, 
      //         'time': value.time, 
      //         'type': value.type, 
      //         'value': value.value
      //       });
      // }
    });

    return finalData;
  }

  function getUpdatedChartSeries(chartSeries, timeSeries, currentTargetForChart, currentParameterForChart) {

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
      console.log("Woaa! Something went wrong... Probably there is no recent data for the selected device. Here you have the error:");
      console.log(error);
    }

    return chartSeries;
  }function hideAll() {
    document.getElementById('measures_table').style.display = 'none';
    document.getElementById('health_concerns_wrapper').style.display = 'none';
    document.getElementById('environment_table').style.display = 'none';
    document.getElementById('traffic_table').style.display = 'none';
  }

  function processData(chartSeries, timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
    var chartData = [];
    var currentParameter = currentParameterForChart.toLowerCase();
    var id = currentTargetForChart.target.options.id;
    var type = currentTargetForChart.target.options.type;
    var values = timeSeries.values[id];

    var parameterUnit = validated_pollutants[currentParameter].unit;
    var title = validated_pollutants[currentParameter].name + ' - Device ' + id;

    if (type === 'AirQualityObserved' && currentParameter !== 'aqi') {
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

      values.forEach(function (value) {
        chartData.push(createLine(value));
      });
    }

    return [chartData, parameterUnit, title];
  }function createLine(value) {
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

  function renderChart(chartSeries, chartData, parameterUnit, title) {
    //config highchart acording with grafana theme
    if (!config.bootData.user.lightTheme) window.Highcharts.setOptions(HIGHCHARTS_THEME_DARK);

    window.Highcharts.stockChart('graph_container', {
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
  }function getCityCoordinates(city_name) {
    var url = 'https://nominatim.openstreetmap.org/search/' + city_name + '?format=json&addressdetails=1&limit=1&polygon_svg=1';
    console.log(url);

    return fetch(url, { headers: { 'content-type': 'application/json' } }).then(function (response) {
      return response.json();
    }).then(function (data) {
      return { latitude: data[0].lat, longitude: data[0].lon };
    }).catch(function (error) {
      return console.error(error);
    });
  }

  return {
    setters: [function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_definitions) {
      AQI = _definitions.AQI;
      HIGHCHARTS_THEME_DARK = _definitions.HIGHCHARTS_THEME_DARK;
      MIN_WIDTH_TO_SHOW_MAP_POPUPS = _definitions.MIN_WIDTH_TO_SHOW_MAP_POPUPS;
      MIN_HEIGHT_TO_SHOW_MAP_POPUPS = _definitions.MIN_HEIGHT_TO_SHOW_MAP_POPUPS;
    }],
    execute: function () {
      _export('calculateAQI', calculateAQI);

      _export('processData', processData);

      _export('getTimeSeries', getTimeSeries);

      _export('dataTreatment', dataTreatment);

      _export('getUpdatedChartSeries', getUpdatedChartSeries);

      _export('hideAll', hideAll);

      _export('drawPopups', drawPopups);

      _export('renderChart', renderChart);

      _export('getCityCoordinates', getCityCoordinates);
    }
  };
});
//# sourceMappingURL=map_utils.js.map
