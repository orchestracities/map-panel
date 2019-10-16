// draw components in the map
/* Vendor specific */
import { defaults, isEqual } from 'lodash';

import config from 'app/core/config';

/* Grafana Specific */

import { titleize } from './string';


/**
* private functions
*/

function getDataPointStickyInfo(dataPoint, metricsTranslations) {
  let stickyInfo = '<div class="stycky-popup-info">';

  var bodyData = getDataPointDetails(dataPoint, ['geojson', 'id', 'type', 'created_at', 'longitude', 'latitude' , 'name'], false);

  if (dataPoint.name && Object.keys(bodyData).length > 1){
    stickyInfo += '<div class="head">' + dataPoint.name + '</div>';
  } else if (dataPoint.id && Object.keys(bodyData).length > 1) {
    stickyInfo += '<div class="head">' + dataPoint.id + '</div>';
  } else if (Object.keys(bodyData).length === 1){
    stickyInfo += '<div class="head">' + Object.keys(bodyData)[0] + '</div>';
  }

  var bodyClass = 'popup-single-value';
  if (Object.keys(bodyData).length > 1){
    bodyClass = 'popup-multiple-value';
  }

  // body
  stickyInfo += '<div class="body">';
  stickyInfo += translate(bodyData, metricsTranslations, bodyClass).join('');
  stickyInfo += '</div>';

  // foot
  var footData;
  if (Object.keys(bodyData).length === 1 && dataPoint.name){
    footData = getDataPointDetails(dataPoint, ['created_at', 'name'], true);
  } else {
    footData = getDataPointDetails(dataPoint, ['created_at'], true);
  }


  var footClass = '';

  stickyInfo += '<div class="foot">';
  stickyInfo+= translate(footData, metricsTranslations, footClass).join('');
  stickyInfo += '</div>';
  return stickyInfo;
}

function getDataPointDetails(dataPoint, skipkey, include) {
  return include? Object.keys(dataPoint).filter(key => skipkey.includes(key)).reduce((obj, key) => { obj[key] = dataPoint[key]; return obj; }, {}) : Object.keys(dataPoint).filter(key => !skipkey.includes(key)).reduce((obj, key) => { obj[key] = dataPoint[key]; return obj; }, {});
}


function objToString (obj) {
    var str = '<div>';
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            if(typeof obj[p] === 'object'){
              str += p + ': ' + objToString(obj[p]) + '<br/>';
            } else {
              str += p + ': ' + obj[p] + '<br/>';
            }
        }
    }
    str += '</div>';
    return str;
}

function translate(filteredData, metricsTranslations, cssClass){
  const keys = Object.keys(filteredData);
  const translatedValues =   keys.map((dpKey) => {
    const dP = (dpKey === 'created_at' ? new Date(filteredData[dpKey]).toLocaleString() : typeof filteredData[dpKey] === 'object' ? objToString(filteredData[dpKey]) : typeof filteredData[dpKey] === 'boolean' ? filteredData[dpKey] : isNaN(filteredData[dpKey]) ? filteredData[dpKey] : Number.isInteger(filteredData[dpKey]) ? filteredData[dpKey] : filteredData[dpKey].toFixed(2) );
    const trans = metricsTranslations.filter((elem) => elem[0] === dpKey);
    return { 'name': (trans.length > 0 && trans[0][1] ? trans[0][1] : titleize(dpKey)), 'value': dP || '-', 'unit': (trans.length > 0 ? trans[0][2] : '') };
  });
  return translatedValues.map((translatedValue) => `<div class='${cssClass}'><span class='name'>${translatedValue.name}</span><span class='value'>${translatedValue.value}</span><span class ='unit'>${translatedValue.unit || ''}</span></div>`);
}

// Given vars passed as param, retrieves the selected city
function getSelectedCity(vars, selectedVarName) {
  const cityEnv = vars.filter((elem) => elem.name === selectedVarName);

  let city = null;
  if (cityEnv && cityEnv.length === 1) city = cityEnv[0].current.value;

  return city;
}

// Access remote api and gives the coordinates from a city center based on NOMINATIM url server
function getCityCoordinates(city_name) {
  const url = NOMINATIM_ADDRESS.replace('<city_name>', city_name);
  return fetch(url)
    .then((response) => response.json())
    .then((data) => { return { latitude: data[0].lat, longitude: data[0].lon }; })
    .catch((error) => console.error(error));
}
/*
* Auxiliar functions
*/
// just for improve DRY
function convertDate(time_) {
  const time = new Date(time_);
  const day = time.getDate();
  const month = time.getMonth();
  const year = time.getFullYear();
  const hour = time.getHours() - 1;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();
  return Date.UTC(year, month, day, hour + 1, minutes, seconds, milliseconds);
}

const geolocationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 110
};

export {

  getCityCoordinates,

  getDataPointStickyInfo,

  getSelectedCity,

  geolocationOptions
};
