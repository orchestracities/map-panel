// draw components in the map
/* Vendor specific */
import { defaults, isEqual } from 'lodash';

import Highcharts from "../vendor/highcharts/highcharts";
import Exporting from '../vendor/highcharts/modules/exporting';
// Initialize exporting module.
Exporting(Highcharts);

/* Grafana Specific */
import config from 'app/core/config';

import { titleize } from './string'

/* App specific */
import { AQI, CARS_COUNT, NOMINATIM_ADDRESS } from '../definitions';
import { HIGHCHARTS_THEME_DARK } from '../utils/highcharts/custom_themes';


/*
* Primary functions
*/

/**
* Display popups based in the click in map's marker
*/
function drawPopups(panelId, lastValueMeasure, validatedMetrics) {

  //render popups
  try {
    // Show Metrics Legend (MAP)

    //draw select
    if(validatedMetrics) {

      hideAllGraphPopups(panelId)

      if(document.querySelector('#parameters_dropdown_'+panelId).options.length>1)
        drawMeasuresPopup(panelId, lastValueMeasure, validatedMetrics)

      switch(lastValueMeasure.type) {
        case 'AirQualityObserved':
          let aqiIndex = calculateAQIIndex(lastValueMeasure.value);
          
          document.getElementById('environment_table_'+panelId).style.display = 'block';

          drawHealthConcernsPopup(panelId, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
     
          break;
        case 'TrafficFlowObserved':
          drawTrafficFlowPopup(panelId);
          break;
        default:
          drawDefaultPopups(panelId);
      }
    }
    
  } catch(error) {
    console.log("Error:");
    console.log(error);
    console.log("lastValueMeasure: ")
    console.log(lastValueMeasure)
  }
}
/*
* Draw the select box in the specific panel, with the specif metrics and select the option
*/
function drawSelect(panelId, metricsToShow, providedMetrics, currentParameterForChart) {
  // Remove air paramters from dropdown
  let el = document.querySelector('#parameters_dropdown_'+panelId);
  while ( el.firstChild ) {
    el.removeChild( el.firstChild )
  }

  let metricsKeys = Object.keys(metricsToShow)

  //default option
  let emptyOption = document.createElement('option');
  emptyOption.id = 'metricsOption_'+panelId;
  emptyOption.value = 'value';
  emptyOption.title = "Select this to see the default field values"
  emptyOption.innerHTML = 'Select Metric';
  if(metricsKeys.length===0)
    emptyOption.selected = 'selected';
  el.appendChild(emptyOption);

  //select population
  metricsKeys.forEach((metric)=>{
    providedMetrics.forEach((elem)=>{
      if(elem[0] == metric) {
        let newMetric = document.createElement('option');
        newMetric.id = 'metricsOption_'+panelId;
        newMetric.value = metric.toUpperCase();

        if(currentParameterForChart===newMetric.value)
          newMetric.selected = 'selected';
        
        newMetric.innerHTML = elem[1]?elem[1]:titleize(elem[0]);

        el.appendChild(newMetric);
      }
    })
  })
  
  let selectBox = document.querySelector('#parameters_dropdown_'+panelId)
  if(selectBox.options.length>0)
    selectBox.style.display = 'block';
}
/**
* Render's the chart in panel
*/
function renderChart(panelId, selectedPointData, measurementUnits, chartDetails) {
  console.debug('renderChart')
  let [type, pointId, fieldName] = chartDetails

  drawChartCointainer(panelId);

  //prepare data to chart
  let chartData = selectedPointData.map((elem)=>[ convertDate(elem.created_at), elem[fieldName.toLowerCase()] ]);

  function getChartMetaInfo() {
    let props = {
      AirQualityObserved: 'Air Quality',
      TrafficFlowObserved: 'Cars'
    }

    return { 
        title: `${props[type]||type}: Device ${pointId} - ${measurementUnits[1]?measurementUnits[1]:titleize(measurementUnits[0])}`,
        units: (measurementUnits[2] ? `${measurementUnits[1]} (${measurementUnits[2]})` : measurementUnits[1])
      }
  }

  let chartInfo = getChartMetaInfo();
  
  //config highchart acording with grafana theme
  if(!config.bootData.user.lightTheme) {
    Highcharts.theme = HIGHCHARTS_THEME_DARK;

    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);
  }

  // let chart = angular.element(
  //     document.getElementById('graph_container_'+panelId)
  // ).highcharts();

  Highcharts.chart('graph_container_'+panelId,
    {
      chart: {
        type: 'line',
        height: 200,
        zoomType: 'x',
        events: {
          load: function () {            
            chartData = this.series[0]; // set up the updating of the chart each second
          }
        }
      },
      title: {
        text: chartInfo.title
      },
      subtitle: {
        text: ''
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: chartInfo.units
        }
      },
      legend: {
        enabled: false
      },
      series: [{
        name: chartInfo.units,
        data: chartData
      }]
    }
  );
}


/**
* private functions
*/
function getDataPointExtraFields(dataPoint) {

  const values = {
    fillOpacity: 0.5
  }

  if(dataPoint.type==='AirQualityObserved') {
    let aqiIndex = calculateAQIIndex(dataPoint.value);
    let aqiColor = AQI.color[aqiIndex];

    defaults(values, {
      color: aqiColor,
      fillColor: aqiColor,

      aqiColor: aqiColor,
      aqiMeaning: AQI.meaning[aqiIndex],
      aqiRisk: AQI.risks[aqiIndex],
      aqi: dataPoint.value,

      markerColor: AQI.markerColor[aqiIndex]
    })    
  } else {
    if(dataPoint.type==='TrafficFlowObserved') {
      let colorIndex = calculateCarsIntensityIndex(dataPoint.value)

      defaults(values, {
        color: CARS_COUNT.color[colorIndex], 
        fillColor: CARS_COUNT.color[colorIndex],
        
        markerColor: CARS_COUNT.markerColor[colorIndex]
      })
    }
  }

  return values;
}

function getMapMarkerClassName(type, value) {
  let resp = 'map-marker-';
  if(type==='AirQualityObserved') {
    return resp+AQI.classColor[calculateAQIIndex(value)];
  } else if(type==='TrafficFlowObserved')
    return resp+CARS_COUNT.classColor[calculateCarsIntensityIndex(value)];
  return resp+'default';
}

function getDataPointStickyInfo(dataPoint, metricsTranslations) {
  let dataPointExtraFields = getDataPointExtraFields(dataPoint);  
  let stickyInfo = '<div class="stycky-popup-info">';

  if(dataPoint.type==='AirQualityObserved') {
    stickyInfo += '<div class="head air-quality">Air Quality</div>';
  } else {
    if(dataPoint.type==='TrafficFlowObserved') {
      stickyInfo += '<div class="head traffic-flow">Cars Intensity</div>';
    } else {
      stickyInfo += '<div class="head">' + dataPoint.type + '</div>';
    }
  }  

  //body
  stickyInfo += '<div class="body">';
  stickyInfo += getDataPointDetails(dataPoint, metricsTranslations).join('');
  stickyInfo += '</div>';
  stickyInfo += '</div>';

  //console.debug(dataPoint)
  return stickyInfo
}

function getDataPointDetails(dataPoint, metricsTranslations) {
  const withoutGeojson = Object.keys(dataPoint).filter((key) => key !== 'geojson');
  let translatedValues = withoutGeojson.map((dpKey)=>{
    let dP = (dpKey==='created_at'?new Date(dataPoint[dpKey]).toLocaleString():dataPoint[dpKey]);
    let trans = metricsTranslations.filter((elem)=>elem[0]===dpKey);
    return { 'name': (trans.length>0 && trans[0][1] ? trans[0][1] : titleize(dpKey) ), value: dP||'-', unit: (trans.length>0 ? trans[0][2] : '') }
  })
  //creation of html row
  return translatedValues.map((translatedValue)=>`<div><span>${translatedValue.name}</span><span>${translatedValue.value} ${translatedValue.unit||''}</span></div>`)
}

//show all accepted metrics for a specific point id
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
  let cityEnv = vars.filter(elem => elem.name===selectedVarName)

  let city = null;
  if(cityEnv && cityEnv.length === 1)
    city = cityEnv[0].current.value;

  return city;
}

function hideAllGraphPopups(panelId) {
  let map_table_popups = ['measures_table', 'health_concerns_wrapper', 'environment_table', 'traffic_table'];

  for(let map_table_popup of map_table_popups) {
    let popup = document.getElementById(map_table_popup+'_'+panelId);
    if(popup)
      popup.style.display = 'none';
  }
}

function drawDefaultPopups() {  
}
/*
* Draw Traffic Flow Popup
*/
function drawTrafficFlowPopup(panelId) {
  document.getElementById('traffic_table_'+panelId).style.display = 'block';
}
/*
* Draw Health Concerns Popup
*/
function drawHealthConcernsPopup(panelId, risk, color, meaning, map_size) {
  const healthConcernsWrapper = document.getElementById('health_concerns_wrapper_'+panelId);
  const healthConcerns = document.querySelector('#health_concerns_wrapper_'+panelId+'>div');
  const healthConcernsColor = document.querySelector('#health_concerns_wrapper_'+panelId+'>div>span>span.color');
  const healthRisk = document.getElementById('health_risk_'+panelId);

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
  const measuresTable = document.querySelector('#measures_table_'+panelId+' > table > tbody');
  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  Object.keys(metricsToShow).forEach((metric)=>{
    providedMetrics.forEach((elem)=>{
      if(elem[0] == metric) {
        let row = measuresTable.insertRow();    // -1 for inserting bottom
        let innerCell0 = elem[1]?elem[1]:titleize(elem[0]);
        let innerCell1 = (metricsToShow[metric] ? metricsToShow[metric] : '-') + (elem[2]?` ${elem[2]}`:'');
        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);

        cell0.innerHTML = innerCell0;
        cell1.innerHTML = innerCell1;        
      }
    })

  })

  document.getElementById('measures_table_'+panelId).style.display = 'block';
}
/*
* Draw Chart
*/
function drawChartCointainer(panelId) {
  document.querySelector('#data_details_'+panelId).style.display = 'block';
  document.getElementById('data_chart_'+panelId).style.display = 'block';
}

// Access remote api and gives the coordinates from a city center based on NOMINATIM url server
function getCityCoordinates(city_name) {
  let url = NOMINATIM_ADDRESS.replace('<city_name>', city_name)
  return fetch(url)
    .then(response => response.json())
    .then(data => { return { latitude: data[0].lat, longitude: data[0].lon } })
    .catch(error => console.error(error))
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
  return Date.UTC(year, month, day, hour+1, minutes, seconds, milliseconds)
}

var geolocationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 110
};

export {

  hideAllGraphPopups, 
  drawPopups,
  drawSelect,
  renderChart,

  getCityCoordinates,

  getDataPointExtraFields,
  getDataPointStickyInfo,

  getSelectedCity,

  getMapMarkerClassName,

  geolocationOptions
}