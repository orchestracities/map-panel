// draw components in the map
/* Vendor specific */
import { defaults, isEqual } from 'lodash';

import config from 'app/core/config';

/* Grafana Specific */

import { titleize } from './string';

/* App specific */
import { AQI, CARS_COUNT, NOMINATIM_ADDRESS } from '../definitions';

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
          const aqiIndex = calculateAQIIndex(lastValueMeasure.value);

          document.getElementById('environment_table_' + panelId).style.display = 'block';

          drawHealthConcernsPopup(panelId, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);

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
            if(typeof obj[p] === 'string'){
              str += p + ': ' + obj[p] + '<br/>';
            } else {
              str += p + ': ' + objToString(obj[p]) + '<br/>';
            }
        }
    }
    str += '</div>';
    return str;
}

function translate(filteredData, metricsTranslations, cssClass){
  const keys = Object.keys(filteredData);
  const translatedValues =   keys.map((dpKey) => {
    const dP = (dpKey === 'created_at' ? new Date(filteredData[dpKey]).toLocaleString() : typeof filteredData[dpKey] === 'object' ? objToString(filteredData[dpKey]) : filteredData[dpKey]);
    const trans = metricsTranslations.filter((elem) => elem[0] === dpKey);
    return { 'name': (trans.length > 0 && trans[0][1] ? trans[0][1] : titleize(dpKey)), 'value': dP || '-', 'unit': (trans.length > 0 ? trans[0][2] : '') };
  });
  return translatedValues.map((translatedValue) => `<div class='${cssClass}'><span class='name'>${translatedValue.name}</span><span class='value'>${translatedValue.value}</span><span class ='unit'>${translatedValue.unit || ''}</span></div>`);
}

// show all accepted metrics for a specific point id
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
  const cityEnv = vars.filter((elem) => elem.name === selectedVarName);

  let city = null;
  if (cityEnv && cityEnv.length === 1) city = cityEnv[0].current.value;

  return city;
}

function hideAllGraphPopups(panelId) {
  const map_table_popups = ['measures_table', 'health_concerns_wrapper', 'environment_table', 'traffic_table'];

  for (const map_table_popup of map_table_popups) {
    const popup = document.getElementById(map_table_popup + '_' + panelId);
    if (popup) popup.style.display = 'none';
  }
}

function drawDefaultPopups() {
}
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
  const healthConcernsWrapper = document.getElementById('health_concerns_wrapper_' + panelId);
  const healthConcerns = document.querySelector('#health_concerns_wrapper_' + panelId + '>div');
  const healthConcernsColor = document.querySelector('#health_concerns_wrapper_' + panelId + '>div>span>span.color');
  const healthRisk = document.getElementById('health_risk_' + panelId);

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
  const measuresTable = document.querySelector('#measures_table_' + panelId + ' > table > tbody');
  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  Object.keys(metricsToShow).forEach((metric) => {
    providedMetrics.forEach((elem) => {
      if (elem[0] == metric) {
        const row = measuresTable.insertRow(); // -1 for inserting bottom
        const innerCell0 = elem[1] ? elem[1] : titleize(elem[0]);
        const innerCell1 = (metricsToShow[metric] ? metricsToShow[metric] : '-') + (elem[2] ? ` ${elem[2]}` : '');
        const cell0 = row.insertCell(0);
        const cell1 = row.insertCell(1);

        cell0.innerHTML = innerCell0;
        cell1.innerHTML = innerCell1;
      }
    });
  });

  document.getElementById('measures_table_' + panelId).style.display = 'block';
}

// Access remote api and gives the coordinates from a city center based on NOMINATIM url server
function getCityCoordinates(city_name) {
  const url = NOMINATIM_ADDRESS.replace('<city_name>', city_name);
  return fetch(url)
    .then((response) => response.json())
    .then((data) => { return { latitude: data[0].lat, longitude: data[0].lon }; })
    .catch((error) => console.error(error));
}

// gets the aqi index from the AQI var
function calculateAQIIndex(value) {
  let aqiIndex;
  AQI.range.forEach((elem, index) => {
    if (value >= elem) {
      aqiIndex = index;
    }
  });
  return aqiIndex;
}
// gets the index from the CARS_COUNT const var
function calculateCarsIntensityIndex(value) {
  CARS_COUNT.range.forEach((elem, index) => {
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

  hideAllGraphPopups,

  getCityCoordinates,

  getDataPointStickyInfo,

  getSelectedCity,

  geolocationOptions
};
