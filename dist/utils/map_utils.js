"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hideAllGraphPopups = hideAllGraphPopups;
exports.getCityCoordinates = getCityCoordinates;
exports.getDataPointExtraFields = getDataPointExtraFields;
exports.getDataPointStickyInfo = getDataPointStickyInfo;
exports.getSelectedCity = getSelectedCity;
exports.getMapMarkerClassName = getMapMarkerClassName;
exports.geolocationOptions = void 0;

var _lodash = require("lodash");

var _config = _interopRequireDefault(require("app/core/config"));

var _string = require("./string");

var _definitions = require("../definitions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
* Primary functions
*/

/**
* Display popups based in the click in map's marker
*/
function drawPopups(panelId, lastValueMeasure, validatedMetrics) {
  // render popups
  try {
    // Show Metrics Legend (MAP)
    // draw select
    if (validatedMetrics) {
      hideAllGraphPopups(panelId);
      if (document.querySelector('#parameters_dropdown_' + panelId).options.length > 1) drawMeasuresPopup(panelId, lastValueMeasure, validatedMetrics);

      switch (lastValueMeasure.type) {
        case 'AirQualityObserved':
          var aqiIndex = calculateAQIIndex(lastValueMeasure.value);
          document.getElementById('environment_table_' + panelId).style.display = 'block';
          drawHealthConcernsPopup(panelId, _definitions.AQI.risks[aqiIndex], _definitions.AQI.color[aqiIndex], _definitions.AQI.meaning[aqiIndex]);
          break;

        case 'TrafficFlowObserved':
          drawTrafficFlowPopup(panelId);
          break;

        default:
          drawDefaultPopups(panelId);
      }
    }
  } catch (error) {
    console.log('Error:');
    console.log(error);
    console.log('lastValueMeasure: ');
    console.log(lastValueMeasure);
  }
}
/**
* private functions
*/


function getDataPointExtraFields(dataPoint) {
  var values = {
    fillOpacity: 0.5
  };

  if (dataPoint.type === 'AirQualityObserved') {
    var aqiIndex = calculateAQIIndex(dataPoint.value);
    var aqiColor = _definitions.AQI.color[aqiIndex];
    (0, _lodash.defaults)(values, {
      color: aqiColor,
      fillColor: aqiColor,
      aqiColor: aqiColor,
      aqiMeaning: _definitions.AQI.meaning[aqiIndex],
      aqiRisk: _definitions.AQI.risks[aqiIndex],
      aqi: dataPoint.value,
      markerColor: _definitions.AQI.markerColor[aqiIndex]
    });
  } else if (dataPoint.type === 'TrafficFlowObserved') {
    var colorIndex = calculateCarsIntensityIndex(dataPoint.value);
    (0, _lodash.defaults)(values, {
      color: _definitions.CARS_COUNT.color[colorIndex],
      fillColor: _definitions.CARS_COUNT.color[colorIndex],
      markerColor: _definitions.CARS_COUNT.markerColor[colorIndex]
    });
  }

  return values;
}

function getMapMarkerClassName(type, value) {
  var resp = 'map-marker-';

  if (type === 'AirQualityObserved') {
    return resp + _definitions.AQI.classColor[calculateAQIIndex(value)];
  }

  if (type === 'TrafficFlowObserved') return resp + _definitions.CARS_COUNT.classColor[calculateCarsIntensityIndex(value)];
  return resp + 'default';
}

function getDataPointStickyInfo(dataPoint, metricsTranslations) {
  var dataPointExtraFields = getDataPointExtraFields(dataPoint);
  var stickyInfo = '<div class="stycky-popup-info">';
  var bodyData = getDataPointDetails(dataPoint, ['geojson', 'id', 'type', 'created_at', 'longitude', 'latitude', 'name'], false);

  if (dataPoint.name && Object.keys(bodyData).length > 1) {
    stickyInfo += '<div class="head">' + dataPoint.name + '</div>';
  } else if (dataPoint.id && Object.keys(bodyData).length > 1) {
    stickyInfo += '<div class="head">' + dataPoint.id + '</div>';
  } else if (Object.keys(bodyData).length === 1) {
    stickyInfo += '<div class="head">' + Object.keys(bodyData)[0] + '</div>';
  }

  var bodyClass = 'popup-single-value';

  if (Object.keys(bodyData).length > 1) {
    bodyClass = 'popup-multiple-value';
  } // body


  stickyInfo += '<div class="body">';
  stickyInfo += translate(bodyData, metricsTranslations, bodyClass).join('');
  stickyInfo += '</div>'; // foot

  var footData;

  if (Object.keys(bodyData).length === 1 && dataPoint.name) {
    footData = getDataPointDetails(dataPoint, ['created_at', 'name'], true);
  } else {
    footData = getDataPointDetails(dataPoint, ['created_at'], true);
  }

  var footClass = '';
  stickyInfo += '<div class="foot">';
  stickyInfo += translate(footData, metricsTranslations, footClass).join('');
  stickyInfo += '</div>';
  return stickyInfo;
}

function getDataPointDetails(dataPoint, skipkey, include) {
  return include ? Object.keys(dataPoint).filter(function (key) {
    return skipkey.includes(key);
  }).reduce(function (obj, key) {
    obj[key] = dataPoint[key];
    return obj;
  }, {}) : Object.keys(dataPoint).filter(function (key) {
    return !skipkey.includes(key);
  }).reduce(function (obj, key) {
    obj[key] = dataPoint[key];
    return obj;
  }, {});
}

function objToString(obj) {
  var str = '<div>';

  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      if (typeof obj[p] === 'string') {
        str += p + ': ' + obj[p] + '<br/>';
      } else {
        str += p + ': ' + objToString(obj[p]) + '<br/>';
      }
    }
  }

  str += '</div>';
  return str;
}

function translate(filteredData, metricsTranslations, cssClass) {
  var keys = Object.keys(filteredData);
  var translatedValues = keys.map(function (dpKey) {
    var dP = dpKey === 'created_at' ? new Date(filteredData[dpKey]).toLocaleString() : _typeof(filteredData[dpKey]) === 'object' ? objToString(filteredData[dpKey]) : filteredData[dpKey];
    var trans = metricsTranslations.filter(function (elem) {
      return elem[0] === dpKey;
    });
    return {
      'name': trans.length > 0 && trans[0][1] ? trans[0][1] : (0, _string.titleize)(dpKey),
      'value': dP || '-',
      'unit': trans.length > 0 ? trans[0][2] : ''
    };
  });
  return translatedValues.map(function (translatedValue) {
    return "<div class='".concat(cssClass, "'><span class='name'>").concat(translatedValue.name, "</span><span class='value'>").concat(translatedValue.value, "</span><span class ='unit'>").concat(translatedValue.unit || '', "</span></div>");
  });
} // show all accepted metrics for a specific point id
// function getMetricsToShow(allMetrics, id) {
//   const metricsToShow = {};
//   for (const key in allMetrics) {
//     allMetrics[key].forEach((_value) => {
//       if (_value.id === id) {
//         if (_value.value) {
//           if (!(metricsToShow[key])){
//             metricsToShow[key] = 0;
//           }
//           metricsToShow[key] = _value.value;
//         }
//       }
//     });
//   }
//   //  metricsToShow['aqi'] = aqi;
//   return metricsToShow
// }
// Given vars passed as param, retrieves the selected city


function getSelectedCity(vars, selectedVarName) {
  var cityEnv = vars.filter(function (elem) {
    return elem.name === selectedVarName;
  });
  var city = null;
  if (cityEnv && cityEnv.length === 1) city = cityEnv[0].current.value;
  return city;
}

function hideAllGraphPopups(panelId) {
  var map_table_popups = ['measures_table', 'health_concerns_wrapper', 'environment_table', 'traffic_table'];

  for (var _i = 0, _map_table_popups = map_table_popups; _i < _map_table_popups.length; _i++) {
    var map_table_popup = _map_table_popups[_i];
    var popup = document.getElementById(map_table_popup + '_' + panelId);
    if (popup) popup.style.display = 'none';
  }
}

function drawDefaultPopups() {}
/*
* Draw Traffic Flow Popup
*/


function drawTrafficFlowPopup(panelId) {
  document.getElementById('traffic_table_' + panelId).style.display = 'block';
}
/*
* Draw Health Concerns Popup
*/


function drawHealthConcernsPopup(panelId, risk, color, meaning, map_size) {
  var healthConcernsWrapper = document.getElementById('health_concerns_wrapper_' + panelId);
  var healthConcerns = document.querySelector('#health_concerns_wrapper_' + panelId + '>div');
  var healthConcernsColor = document.querySelector('#health_concerns_wrapper_' + panelId + '>div>span>span.color');
  var healthRisk = document.getElementById('health_risk_' + panelId);
  healthConcernsWrapper.style.display = 'block';
  healthConcernsColor.style.backgroundColor = color;
  healthRisk.innerHTML = risk;
}
/*
* Draw Measures Popup - The popup info is related with the choosed value
*  from select box and with the metrics that came from result set
*  and from a list of what to show metrics
*/


function drawMeasuresPopup(panelId, metricsToShow, providedMetrics) {
  var measuresTable = document.querySelector('#measures_table_' + panelId + ' > table > tbody');

  while (measuresTable.rows[0]) {
    measuresTable.deleteRow(0);
  }

  Object.keys(metricsToShow).forEach(function (metric) {
    providedMetrics.forEach(function (elem) {
      if (elem[0] == metric) {
        var row = measuresTable.insertRow(); // -1 for inserting bottom

        var innerCell0 = elem[1] ? elem[1] : (0, _string.titleize)(elem[0]);
        var innerCell1 = (metricsToShow[metric] ? metricsToShow[metric] : '-') + (elem[2] ? " ".concat(elem[2]) : '');
        var cell0 = row.insertCell(0);
        var cell1 = row.insertCell(1);
        cell0.innerHTML = innerCell0;
        cell1.innerHTML = innerCell1;
      }
    });
  });
  document.getElementById('measures_table_' + panelId).style.display = 'block';
} // Access remote api and gives the coordinates from a city center based on NOMINATIM url server


function getCityCoordinates(city_name) {
  var url = _definitions.NOMINATIM_ADDRESS.replace('<city_name>', city_name);

  return fetch(url).then(function (response) {
    return response.json();
  }).then(function (data) {
    return {
      latitude: data[0].lat,
      longitude: data[0].lon
    };
  })["catch"](function (error) {
    return console.error(error);
  });
} // gets the aqi index from the AQI var


function calculateAQIIndex(value) {
  var aqiIndex;

  _definitions.AQI.range.forEach(function (elem, index) {
    if (value >= elem) {
      aqiIndex = index;
    }
  });

  return aqiIndex;
} // gets the index from the CARS_COUNT const var


function calculateCarsIntensityIndex(value) {
  _definitions.CARS_COUNT.range.forEach(function (elem, index) {
    if (value >= elem) {
      return index;
    }
  });

  return 0;
}
/*
* Auxiliar functions
*/
// just for improve DRY


function convertDate(time_) {
  var time = new Date(time_);
  var day = time.getDate();
  var month = time.getMonth();
  var year = time.getFullYear();
  var hour = time.getHours() - 1;
  var minutes = time.getMinutes();
  var seconds = time.getSeconds();
  var milliseconds = time.getMilliseconds();
  return Date.UTC(year, month, day, hour + 1, minutes, seconds, milliseconds);
}

var geolocationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 110
};
exports.geolocationOptions = geolocationOptions;
//# sourceMappingURL=map_utils.js.map
