'use strict';

System.register(['lodash', '../vendor/highcharts/highstock', '../vendor/highcharts/modules/exporting', 'app/core/config', '../definitions', '../utils/highcharts/custom_themes'], function (_export, _context) {
  "use strict";

  var _, Highcharts, Exporting, config, AQI, CARS_COUNT, NOMINATIM_ADDRESS, PANEL_DEFAULTS, HIGHCHARTS_THEME_DARK, _slicedToArray, TRANSLATIONS;

  /**
  * Primary functions
  */

  //helper to create series for chart display
  function getTimeSeries(data) {
    console.debug('getTimeSeries');
    console.debug(data);
    var valueValues = {};
    var values = [];
    var pollutantsValues = [];

    Object.keys(data).forEach(function (key) {
      data[key].forEach(function (point) {
        var id = point.id;
        var time = point.time;
        var pollutants = '';

        var value = point.value;
        //      if (point.type === 'AirQualityObserved') {
        pollutants = point.pollutants;
        var pollutantsTemp = {};

        pollutants.forEach(function (pollutant) {
          if (!pollutantsValues[pollutant.name]) {
            pollutantsValues[pollutant.name] = [];
          }
          pollutantsValues[pollutant.name].push({ 'time': time, 'value': pollutant.value, 'id': id });
        });
        //      }

        if (!valueValues[point.id]) {
          valueValues[point.id] = [];
        }
        valueValues[point.id].push({ 'time': time, 'value': value, 'id': id });
      });
    });

    return { 'values': valueValues, 'pollutants': pollutantsValues };
  }

  // Agregate data by id
  function dataTreatment(data) {
    var finalData = {};
    var auxData = void 0;

    data.forEach(function (value) {
      if (!finalData[value.id]) {
        finalData[value.id] = [];
      }

      finalData[value.id].push(value);
    });

    return finalData;
  }

  function getUpdatedChartSeries(chartSeries, timeSeries, currentParameterForChart, currentTargetForChart) {

    if (Object.keys(chartSeries).length === 0) return chartSeries;

    var targetType = currentTargetForChart.target.options.type;
    var targetId = currentTargetForChart.target.options.id;
    var currentParameter = currentParameterForChart.toLowerCase();
    var lastMeasure = void 0;
    var lastTime = void 0;

    try {
      var timeTemp = void 0;
      // if (currentParameter !== 'aqi' && targetType === 'AirQualityObserved'){    // 
      timeTemp = timeSeries.pollutants[currentParameter];
      timeTemp.forEach(function (val) {
        if (val.id === targetId) {
          lastTime = val.time;
          lastMeasure = val.value;
        }
      });
      // } else {
      //   timeTemp = timeSeries.values[targetId];
      //   lastTime = timeTemp[timeTemp.length - 1].time
      //   lastMeasure = timeTemp[timeTemp.length - 1].value;
      // }

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
  }

  function processData(chartSeries, timeSeries, validatedPollutants, currentParameterForChart, currentTargetForChart) {
    //console.log(currentParameterForChart)
    //console.log(currentTargetForChart)

    var chartData = [];
    var currentParameter = currentParameterForChart.toLowerCase();

    //currentTargetForChart is the marker
    var C_T_CHART = currentTargetForChart.target.options;
    var id_ = C_T_CHART.id;
    var type_ = C_T_CHART.type;

    var parameterUnit = '';
    var title = '';

    if (validatedPollutants.length > 0) {
      //type_ === 'AirQualityObserved' &&  currentParameter !== 'aqi'

      if (!currentParameter) {
        console.log('currentParameter is empty. going to use the first one ' + validatedPollutants[0][0]);
        currentParameter = validatedPollutants[0][0];
      }

      var abc = validatedPollutants.filter(function (elem) {
        return elem[0] === currentParameter;
      })[0];
      if (!abc) abc = validatedPollutants[0];
      var pollutantId = abc[0];
      var pollutantName = abc[1];
      var pollutantUnit = abc[2];

      //    parameterUnit = validated_pollutants[currentParameter].unit;
      title = type_ + ': Device #' + id_ + ' - ' + pollutantName;
      parameterUnit = pollutantName + (pollutantUnit != '' ? ' (' + pollutantUnit + ')' : '');

      var parameterChoice = timeSeries.pollutants[currentParameter] || timeSeries.pollutants[0];
      parameterChoice.forEach(function (sensor) {
        if (sensor.id === id_) {
          chartData.push(createLine(sensor));
        }
      });
    } else {
      //without pollutants
      if (type_ === 'AirQualityObserved') {
        title = 'Air Quality Index: Device ' + id_;
        parameterUnit = 'AQI';
      } else if (type_ === 'TrafficFlowObserved') {
        title = 'Cars Intensity: Device ' + id_;
        parameterUnit = 'Cars';
      } else {
        title = type_ + ': Device ' + id_;
        parameterUnit = '';
      }

      var values_ = timeSeries.values[id_];
      values_ && values_.forEach(function (value) {
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
    if (!currentTargetForChart) {
      console.warn('currentTargetForChart not setted');
      return;
    }
    if (!currentTargetForChart.target.options.id) {
      console.warn('currentTargetForChart id not setted');
      return;
    }

    //console.log('drawPopups');
    var selectedPointId = currentTargetForChart.target.options.id;
    var selectedPointType = currentTargetForChart.target.options.type;
    var selectedPointValues = timeSeries.values[selectedPointId];

    hideAllGraphPopups(panel_id);

    //render popups
    try {
      var lastValueMeasure = selectedPointValues[selectedPointValues.length - 1].value; //values array is the one for the AQI values

      // Show Pollutants Legend (MAP)

      //draw select
      if (validated_pollutants) {
        var allPollutants = timeSeries.pollutants;
        var pollutantsToShow = getPollutantsToShow(allPollutants, selectedPointId);

        drawSelect(panel_id, pollutantsToShow, validated_pollutants, currentParameterForChart, currentTargetForChart.target.options);
        drawMeasuresPopup(panel_id, pollutantsToShow, validated_pollutants, currentParameterForChart);

        switch (selectedPointType) {
          case 'AirQualityObserved':
            var aqiIndex = calculateAQIIndex(lastValueMeasure);

            document.getElementById('environment_table_' + panel_id).style.display = 'block';
            //drawAQIPollutantsPopup(panel_id, validated_pollutants, allPollutants, selectedPointId, lastValueMeasure, currentParameterForChart);
            drawHealthConcernsPopup(panel_id, validated_pollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);

            break;
          case 'TrafficFlowObserved':
            drawTrafficFlowPopup(panel_id);
            break;
          default:
            drawDefaultPopups(panel_id);
        }
      }
    } catch (error) {
      console.log("Error:");
      console.log(error);
      console.log("selectedPointId: " + selectedPointId + ", selectedPointType: " + selectedPointType + ", selectedPointValues: " + selectedPointValues);
    }
  }

  /*
  * view components manipulation
  */
  function showDataDetailsSelect(panel_id) {
    document.querySelector('#data_details_' + panel_id).style.display = 'block';
  }

  function getDataPointExtraFields(dataPoint) {

    var values = {
      fillOpacity: 0.5
    };

    if (dataPoint.type === 'AirQualityObserved') {
      var aqi = calculateAQIIndex(dataPoint.value);
      var aqiColor = AQI.color[aqi];
      var aqiMeaning = AQI.meaning[aqi];
      var aqiRisk = AQI.risks[aqi];

      _.defaults(values, {
        color: aqiColor,
        fillColor: aqiColor,

        aqiColor: aqiColor,
        aqiMeaning: aqiMeaning,
        aqiRisk: aqiRisk,
        aqi: dataPoint.value,

        markerColor: AQI.markerColor[aqi]
      });
    } else {
      if (dataPoint.type === 'TrafficFlowObserved') {
        var color_index = calculateCarsIntensityIndex(dataPoint.value);

        _.defaults(values, {
          color: CARS_COUNT.color[color_index],
          fillColor: CARS_COUNT.color[color_index],

          markerColor: CARS_COUNT.markerColor[color_index]
        });
      }
    }

    return values;
  }

  function getMapMarkerClassName(type, value) {
    var resp = 'map-marker-';
    if (type === 'AirQualityObserved') {
      return resp + AQI.classColor[calculateAQIIndex(value)];
    } else if (type === 'TrafficFlowObserved') return resp + CARS_COUNT.classColor[calculateCarsIntensityIndex(value)];
    return resp + 'default';
  }

  function getDataPointStickyInfo(dataPoint, pollutantsTranslations) {
    var dataPointExtraFields = getDataPointExtraFields(dataPoint);
    var stickyInfo = '<div class="stycky-popup-info">';

    if (dataPoint.type === 'AirQualityObserved') {
      stickyInfo += '<div class="head air-quality">Air Quality</div>';
    } else {
      if (dataPoint.type === 'TrafficFlowObserved') {
        stickyInfo += '<div class="head traffic-flow">Cars Intensity</div>';
      } else {
        stickyInfo += '<div class="head">' + dataPoint.type + '</div>';
      }
    }

    //body
    stickyInfo += '<div class="body">' + '<div>Id: ' + dataPoint.id + '</div>';
    // if(dataPoint.type==='AirQualityObserved')
    //   stickyInfo += '<div>AQI: ' + dataPoint.value + ' (' + dataPointExtraFields.aqiMeaning + ')</div>'
    // else
    stickyInfo += '<div>Value: ' + dataPoint.value + '</div>';

    //let qq = getDataPointDetails(dataPoint.pollutants)
    //console.debug(qq)
    stickyInfo += getDataPointDetails(dataPoint, pollutantsTranslations).join('');
    stickyInfo += '</div>';
    stickyInfo += '</div>';

    //console.debug(dataPoint)
    return stickyInfo;
  }

  function getDataPointDetails(dataPoint, pollutantsTranslations) {
    var translatedValues = dataPoint.pollutants.map(function (p) {
      var trans = pollutantsTranslations.filter(function (elem) {
        return elem[0] === p.name;
      });
      return trans.length > 0 ? { 'name': trans[0][1], value: p.value, unit: trans[0][2] } : { 'name': p, value: dataPoint[p.name], unit: '' };
    });

    return translatedValues.map(function (translatedValue) {
      return '<div>' + translatedValue.name + ': ' + translatedValue.value + ' ' + (translatedValue.unit || '') + '</div>';
    });
  }

  function renderChart(panel_id, chartSeries, chartData, parameterUnit, title) {

    showDataDetailsSelect(panel_id);
    drawChart(panel_id);

    //config highchart acording with grafana theme
    if (!config.bootData.user.lightTheme) {
      Highcharts.theme = HIGHCHARTS_THEME_DARK;

      // Apply the theme
      Highcharts.setOptions(Highcharts.theme);
    }

    Highcharts.chart('graph_container_' + panel_id, {
      chart: {
        type: 'line',
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
      series: [{
        name: title,
        data: chartData
      }]
    });
  }

  function hideAllGraphPopups(panel_id) {
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
  }
  function drawHealthConcernsPopup(panel_id, providedPollutants, risk, color, meaning, map_size) {
    var healthConcernsWrapper = document.getElementById('health_concerns_wrapper_' + panel_id);
    var healthConcerns = document.querySelector('#health_concerns_wrapper_' + panel_id + '>div');
    var healthConcernsColor = document.querySelector('#health_concerns_wrapper_' + panel_id + '>div>span>span.color');
    var healthRisk = document.getElementById('health_risk_' + panel_id);

    healthConcernsWrapper.style.display = 'block';
    healthConcernsColor.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }
  function drawDefaultPopups() {}
  function drawTrafficFlowPopup(panel_id) {
    document.getElementById('traffic_table_' + panel_id).style.display = 'block';
  }
  function drawChart(panel_id) {
    document.getElementById('data_chart_' + panel_id).style.display = 'block';
  }

  //show all accepted pollutants for a specific point id
  function getPollutantsToShow(allPollutants, id) {
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

    //  pollutantsToShow['aqi'] = aqi;
    return pollutantsToShow;
  }

  //render the select in the specific panel, with the specif pollutants and select the option
  function drawSelect(panel_id, pollutantsToShow, providedPollutants, currentParameterForChart, mapPointOptions) {

    // Remove air paramters from dropdown
    var el = document.querySelector('#parameters_dropdown_' + panel_id);
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    //select population

    var _loop2 = function _loop2(pollutant) {
      var _providedPollutants$f = _slicedToArray(providedPollutants.filter(function (elem) {
        return elem[0] === pollutant;
      })[0], 3),
          pollutantId = _providedPollutants$f[0],
          pollutantName = _providedPollutants$f[1],
          pollutantUnit = _providedPollutants$f[2];

      // Add Pollutants to Chart Dropdown
      var newPollutant = document.createElement('option');
      newPollutant.id = 'pollutantOption';
      newPollutant.value = pollutant.toUpperCase();

      if (currentParameterForChart === newPollutant.value) newPollutant.selected = 'selected';

      newPollutant.innerHTML = pollutantName;

      el.appendChild(newPollutant);
      // ----
    };

    for (var pollutant in pollutantsToShow) {
      _loop2(pollutant);
    }
    var selectBox = document.querySelector('#parameters_dropdown_' + panel_id);
    if (selectBox.options.length > 0) selectBox.style.display = 'block';
  }

  function drawMeasuresPopup(panel_id, pollutantsToShow, providedPollutants, currentParameterForChart) {
    var measuresTable = document.querySelector('#measures_table_' + panel_id + ' > table > tbody');
    while (measuresTable.rows[0]) {
      measuresTable.deleteRow(0);
    }
    var _loop3 = function _loop3(pollutant) {
      var row = measuresTable.insertRow(-1); // -1 for inserting bottom

      var _providedPollutants$f2 = _slicedToArray(providedPollutants.filter(function (elem) {
        return elem[0] === pollutant;
      })[0], 3),
          pollutantId = _providedPollutants$f2[0],
          pollutantName = _providedPollutants$f2[1],
          pollutantUnit = _providedPollutants$f2[2];

      var innerCell0 = pollutantName;
      var innerCell1 = pollutantsToShow[pollutant] + ' ' + pollutantUnit;
      var cell0 = row.insertCell(0);
      var cell1 = row.insertCell(1);

      cell0.innerHTML = innerCell0;
      cell1.innerHTML = innerCell1;
    };

    for (var pollutant in pollutantsToShow) {
      _loop3(pollutant);
    }

    document.getElementById('measures_table_' + panel_id).style.display = 'block';
  }

  // function drawAQIPollutantsPopup(panel_id, providedPollutants, allPollutants, selectedId, aqi, currentParameterForChart) {

  //   //no pollutants
  //   if(!providedPollutants || providedPollutants.length===0)
  //     return ;
  //   if(!selectedId) {
  //     console.warn('no selectedId here')
  //   }

  //   let pollutantsToShow = getPollutantsToShow(allPollutants, selectedId)
  //   drawAQIPopups(panel_id, pollutantsToShow, providedPollutants, currentParameterForChart)
  // }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_vendorHighchartsHighstock) {
      Highcharts = _vendorHighchartsHighstock.default;
    }, function (_vendorHighchartsModulesExporting) {
      Exporting = _vendorHighchartsModulesExporting.default;
    }, function (_appCoreConfig) {
      config = _appCoreConfig.default;
    }, function (_definitions) {
      AQI = _definitions.AQI;
      CARS_COUNT = _definitions.CARS_COUNT;
      NOMINATIM_ADDRESS = _definitions.NOMINATIM_ADDRESS;
      PANEL_DEFAULTS = _definitions.PANEL_DEFAULTS;
    }, function (_utilsHighchartsCustom_themes) {
      HIGHCHARTS_THEME_DARK = _utilsHighchartsCustom_themes.HIGHCHARTS_THEME_DARK;
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

      // Initialize exporting module.
      Exporting(Highcharts);

      /* Grafana Specific */


      /* App specific */
      TRANSLATIONS = PANEL_DEFAULTS['pollutants'];

      _export('processData', processData);

      _export('getTimeSeries', getTimeSeries);

      _export('dataTreatment', dataTreatment);

      _export('getUpdatedChartSeries', getUpdatedChartSeries);

      _export('hideAllGraphPopups', hideAllGraphPopups);

      _export('drawPopups', drawPopups);

      _export('renderChart', renderChart);

      _export('getCityCoordinates', getCityCoordinates);

      _export('getDataPointExtraFields', getDataPointExtraFields);

      _export('getDataPointStickyInfo', getDataPointStickyInfo);

      _export('getSelectedCity', getSelectedCity);

      _export('getMapMarkerClassName', getMapMarkerClassName);
    }
  };
});
//# sourceMappingURL=map_utils.js.map
