"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCityCoordinates = getCityCoordinates;
exports.getDataPointStickyInfo = getDataPointStickyInfo;
exports.getSelectedCity = getSelectedCity;
exports.geolocationOptions = void 0;

var _lodash = require("lodash");

var _config = _interopRequireDefault(require("app/core/config"));

var _string = require("./string");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
* private functions
*/
function getDataPointStickyInfo(dataPoint, metricsTranslations) {
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
    var dP = dpKey === 'created_at' ? new Date(filteredData[dpKey]).toLocaleString() : _typeof(filteredData[dpKey]) === 'object' ? objToString(filteredData[dpKey]) : isNaN(filteredData[dpKey]) ? filteredData[dpKey] : Number.isInteger(filteredData[dpKey]) ? filteredData[dpKey] : parseFloat(filteredData[dpKey]).toFixed(2);
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
} // Given vars passed as param, retrieves the selected city


function getSelectedCity(vars, selectedVarName) {
  var cityEnv = vars.filter(function (elem) {
    return elem.name === selectedVarName;
  });
  var city = null;
  if (cityEnv && cityEnv.length === 1) city = cityEnv[0].current.value;
  return city;
} // Access remote api and gives the coordinates from a city center based on NOMINATIM url server


function getCityCoordinates(city_name) {
  var url = NOMINATIM_ADDRESS.replace('<city_name>', city_name);
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
