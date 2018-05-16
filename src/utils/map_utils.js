// draw components in the map
/* Vendor specific */
import _ from 'lodash';
//import Highcharts from './vendor/highcharts/highstock';
//import "../vendor/highcharts/highcharts.css!";
//import "../vendor/highcharts/themes/dark-unica.css!";
import Highcharts from "../vendor/highcharts/highstock";
import Exporting from '../vendor/highcharts/modules/exporting';
// Initialize exporting module.
Exporting(Highcharts);

/* Grafana Specific */
import config from 'app/core/config';

/* App specific */
import { AQI, CARS_COUNT, NOMINATIM_ADDRESS, PANEL_DEFAULTS } from '../definitions';
import { HIGHCHARTS_THEME_DARK } from '../utils/highcharts/custom_themes';

const TRANSLATIONS = PANEL_DEFAULTS['pollutants']

/**
* Primary functions
*/

//helper to create series for chart display
function getTimeSeries(data) {
  console.debug('getTimeSeries')
  console.debug(data)
  const valueValues = {};
  const values = [];
  const pollutantsValues = [];

  Object.keys(data).forEach((key) => {
    data[key].forEach((point) => {
      const id = point.id;
      const time = point.time;
      let pollutants = '';

      const value = point.value;
//      if (point.type === 'AirQualityObserved') {
        pollutants = point.pollutants;
        const pollutantsTemp = {};

        pollutants.forEach((pollutant) => {
          if (!(pollutantsValues[pollutant.name])) {
            pollutantsValues[pollutant.name] = [];
          }
          pollutantsValues[pollutant.name].push({'time': time, 'value': pollutant.value, 'id': id});
        });
//      }

      if (!valueValues[point.id]) {
        valueValues[point.id] = [];
      }
      valueValues[point.id].push({'time': time, 'value': value, 'id': id});
    });
  });

  return {'values': valueValues, 'pollutants': pollutantsValues};
}

// Agregate data by id
function dataTreatment(data) {
  const finalData = {};
  let auxData;

  data.forEach((value) => {
    if (!finalData[value.id]) {
      finalData[value.id] = [];
    }

    finalData[value.id].push( value );
  });

  return finalData;
}

function getUpdatedChartSeries(chartSeries, timeSeries, currentParameterForChart, currentTargetForChart) {

  if(Object.keys(chartSeries).length === 0)
    return chartSeries

  const targetType = currentTargetForChart.target.options.type;
  const targetId = currentTargetForChart.target.options.id;
  const currentParameter = currentParameterForChart.toLowerCase();
  let lastMeasure;
  let lastTime;

  try {
    let timeTemp;
    // if (currentParameter !== 'aqi' && targetType === 'AirQualityObserved'){    // 
      timeTemp = timeSeries.pollutants[currentParameter];
      timeTemp.forEach((val) => {
        if (val.id === targetId){
          lastTime = val.time;
          lastMeasure = val.value;
        } 
      });
    // } else {
    //   timeTemp = timeSeries.values[targetId];
    //   lastTime = timeTemp[timeTemp.length - 1].time
    //   lastMeasure = timeTemp[timeTemp.length - 1].value;
    // }
   
    const time = new Date(lastTime);
    const day = time.getDate();
    const month = time.getMonth();
    const year = time.getFullYear();
    const hour = time.getHours() - 1;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const milliseconds = time.getMilliseconds();      
    const chartLastDisplayedValue = chartSeries.data[chartSeries.data.length - 1].y;
    const chartLastDisplayedTime = chartSeries.data[chartSeries.data.length - 1].x;
    let chartLastDisplayedId = chartSeries.name.split(' ');

    chartLastDisplayedId = parseInt(chartLastDisplayedId[chartLastDisplayedId.length - 1]);      

    if (!(lastTime === chartLastDisplayedTime && lastMeasure === chartLastDisplayedValue && targetId === chartLastDisplayedId)){
      chartSeries.addPoint([Date.UTC(year, month, day, hour+1, minutes, seconds, milliseconds), lastMeasure], true, true);
    }
  } catch(error){
    console.log("Error:");
    console.log(error);
  }

  return chartSeries;
}

function processData(chartSeries, timeSeries, validatedPollutants, currentParameterForChart, currentTargetForChart) {
  //console.log(currentParameterForChart)
  //console.log(currentTargetForChart)

  let chartData = [];
  let currentParameter = currentParameterForChart.toLowerCase();

  //currentTargetForChart is the marker
  const C_T_CHART = currentTargetForChart.target.options;
  const id_ = C_T_CHART.id;
  const type_ = C_T_CHART.type;

  let parameterUnit = '';
  let title = '';

  if (validatedPollutants.length>0 ) {//type_ === 'AirQualityObserved' &&  currentParameter !== 'aqi'

    if(!currentParameter){
      console.log('currentParameter is empty. going to use the first one '+validatedPollutants[0][0])
      currentParameter = validatedPollutants[0][0]
    }

    let abc = validatedPollutants.filter((elem)=>elem[0]===currentParameter)[0]
    if(!abc)
      abc = validatedPollutants[0]
    let pollutantId = abc[0]
    let pollutantName = abc[1] 
    let pollutantUnit = abc[2];

//    parameterUnit = validated_pollutants[currentParameter].unit;
    title = `${type_}: Device #${id_} - ${pollutantName}`;
    parameterUnit = pollutantName + (pollutantUnit!='' ? ` (${pollutantUnit})` : '');


    let parameterChoice = timeSeries.pollutants[currentParameter] || timeSeries.pollutants[0];
    parameterChoice.forEach((sensor) => {
      if (sensor.id === id_) {
       chartData.push(createLine(sensor));
      }
    });
  } else {
    //without pollutants
    if(type_ === 'AirQualityObserved') {
      title = 'Air Quality Index: Device ' + id_;
      parameterUnit = 'AQI'
    } else
    if(type_ === 'TrafficFlowObserved') {
      title = 'Cars Intensity: Device ' + id_;
      parameterUnit = 'Cars'
    } else {
      title = type_ + ': Device ' + id_;
      parameterUnit = '';
    }

    const values_ = timeSeries.values[id_];
    values_ && values_.forEach((value) => {
      chartData.push(createLine(value));
    });
  }

  return [chartData, parameterUnit, title]
}

/*
* Auxiliar functions
*/
// just for improve DRY
function createLine(value) {
  const time = new Date(value.time);
  const day = time.getDate();
  const month = time.getMonth();
  const year = time.getFullYear();
  const hour = time.getHours() - 1;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();
  return [Date.UTC(year, month, day, hour+1, minutes, seconds, milliseconds), value.value]
}

// Access remote api and gives the coordinates from a city center based on NOMINATIM url server
function getCityCoordinates(city_name) {
  let url = NOMINATIM_ADDRESS.replace('<city_name>', city_name)
  return fetch(url)
    .then(response => response.json())
    .then(data => { return { latitude: data[0].lat, longitude: data[0].lon } })
    .catch(error => console.error(error))
}

// Given vars passed as param, retrieves the selected city
function getSelectedCity(vars) {
  let cityenv_ = vars.filter(elem => elem.name==="cityenv")
  let city = null;
  if(cityenv_ && cityenv_.length === 1)
    city = cityenv_[0].current.value

  return city;
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
* View components controllers
*/
function drawPopups(panel_id, timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
  if(!currentTargetForChart) {
    console.warn('currentTargetForChart not setted')
    return ;
  }
  if(!currentTargetForChart.target.options.id) {
    console.warn('currentTargetForChart id not setted')
    return ;
  }

  //console.log('drawPopups');
  let selectedPointId = currentTargetForChart.target.options.id;
  let selectedPointType = currentTargetForChart.target.options.type;
  let selectedPointValues = timeSeries.values[selectedPointId];

  hideAllGraphPopups(panel_id)

  //render popups
  try {
    let lastValueMeasure = selectedPointValues[selectedPointValues.length - 1].value; //values array is the one for the AQI values

    // Show Pollutants Legend (MAP)

    //draw select
    if(validated_pollutants) {
      let allPollutants = timeSeries.pollutants;
      let pollutantsToShow = getPollutantsToShow(allPollutants, selectedPointId)

      drawSelect(panel_id, pollutantsToShow, validated_pollutants, currentParameterForChart, currentTargetForChart.target.options)
      drawMeasuresPopup(panel_id, pollutantsToShow, validated_pollutants, currentParameterForChart)

      switch(selectedPointType) {
        case 'AirQualityObserved':
          let aqiIndex = calculateAQIIndex(lastValueMeasure);
          
          document.getElementById('environment_table_'+panel_id).style.display = 'block';
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
    
  } catch(error) {
    console.log("Error:");
    console.log(error);
    console.log("selectedPointId: " + selectedPointId + ", selectedPointType: " + selectedPointType + ", selectedPointValues: " + selectedPointValues)
  }
}

/*
* view components manipulation
*/
function showDataDetailsSelect(panel_id) {
  document.querySelector('#data_details_'+panel_id).style.display = 'block';
}

function getDataPointExtraFields(dataPoint) {

  const values = {
    fillOpacity: 0.5
  }

  if(dataPoint.type==='AirQualityObserved') {
    const aqi = calculateAQIIndex(dataPoint.value);
    const aqiColor = AQI.color[aqi];
    const aqiMeaning = AQI.meaning[aqi];
    const aqiRisk = AQI.risks[aqi];

    _.defaults(values, {
      color: aqiColor,
      fillColor: aqiColor,

      aqiColor: aqiColor,
      aqiMeaning: aqiMeaning,
      aqiRisk: aqiRisk,
      aqi: dataPoint.value,

      markerColor: AQI.markerColor[aqi]
    })    
  } else {
    if(dataPoint.type==='TrafficFlowObserved') {
      let color_index = calculateCarsIntensityIndex(dataPoint.value)

      _.defaults(values, {
        color: CARS_COUNT.color[color_index], 
        fillColor: CARS_COUNT.color[color_index],
        
        markerColor: CARS_COUNT.markerColor[color_index]
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

function getDataPointStickyInfo(dataPoint, pollutantsTranslations) {
  let dataPointExtraFields = getDataPointExtraFields(dataPoint);  
  let stickyInfo = '<div class="stycky-popup-info">'

  if(dataPoint.type==='AirQualityObserved') {
    stickyInfo += '<div class="head air-quality">Air Quality</div>'
  } else {
    if(dataPoint.type==='TrafficFlowObserved') {
      stickyInfo += '<div class="head traffic-flow">Cars Intensity</div>'
    } else {
      stickyInfo += '<div class="head">' + dataPoint.type + '</div>'
    }
  }  

  //body
  stickyInfo += '<div class="body">'+
                  '<div>Id: ' + dataPoint.id + '</div>';
  // if(dataPoint.type==='AirQualityObserved')
  //   stickyInfo += '<div>AQI: ' + dataPoint.value + ' (' + dataPointExtraFields.aqiMeaning + ')</div>'
  // else
    stickyInfo += '<div>Value: '+dataPoint.value + '</div>'

  //let qq = getDataPointDetails(dataPoint.pollutants)
  //console.debug(qq)
  stickyInfo += getDataPointDetails(dataPoint, pollutantsTranslations).join('')
  stickyInfo += '</div>'
  stickyInfo += '</div>'

//console.debug(dataPoint)
  return stickyInfo
}

function getDataPointDetails(dataPoint, pollutantsTranslations) {
  let translatedValues = dataPoint.pollutants.map((p)=>{
    let trans = pollutantsTranslations.filter((elem)=>elem[0]===p.name)
    return trans.length>0 ? { 'name': trans[0][1], value: p.value, unit: trans[0][2] } : { 'name': p, value: dataPoint[p.name], unit: '' }
  })

  return translatedValues.map((translatedValue)=>`<div>${translatedValue.name}: ${translatedValue.value} ${translatedValue.unit||''}</div>`)
}

function renderChart(panel_id, chartSeries, chartData, parameterUnit, title) {

  showDataDetailsSelect(panel_id);
  drawChart(panel_id);

  //config highchart acording with grafana theme
  if(!config.bootData.user.lightTheme) {
    Highcharts.theme = HIGHCHARTS_THEME_DARK;

    // Apply the theme
    Highcharts.setOptions(Highcharts.theme);
  }

  Highcharts.chart('graph_container_'+panel_id,
    {
      chart: {
        type: 'line',
        height: 200,
        zoomType: 'x',
        events: {
          load: function () {            
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
    }
  );
}

function hideAllGraphPopups(panel_id) {
  let map_table_popups = ['measures_table', 'health_concerns_wrapper', 'environment_table', 'traffic_table'];

  for(let map_table_popup of map_table_popups) {
    let popup = document.getElementById(map_table_popup+'_'+panel_id)
    if(popup)
      popup.style.display = 'none';
  }
}
function drawHealthConcernsPopup(panel_id, providedPollutants, risk, color, meaning, map_size) {
  const healthConcernsWrapper = document.getElementById('health_concerns_wrapper_'+panel_id);
  const healthConcerns = document.querySelector('#health_concerns_wrapper_'+panel_id+'>div');
  const healthConcernsColor = document.querySelector('#health_concerns_wrapper_'+panel_id+'>div>span>span.color');
  const healthRisk = document.getElementById('health_risk_'+panel_id);

  healthConcernsWrapper.style.display = 'block';
  healthConcernsColor.style.backgroundColor = color;
  healthRisk.innerHTML = risk;
}
function drawDefaultPopups() {  
}
function drawTrafficFlowPopup(panel_id) {
  document.getElementById('traffic_table_'+panel_id).style.display = 'block';
}
function drawChart(panel_id) {
  document.getElementById('data_chart_'+panel_id).style.display = 'block';
}

//show all accepted pollutants for a specific point id
function getPollutantsToShow(allPollutants, id) {
  const pollutantsToShow = {};
  for (const key in allPollutants) {
    allPollutants[key].forEach((_value) => {
      if (_value.id === id) {
        if (_value.value) {
          if (!(pollutantsToShow[key])){
            pollutantsToShow[key] = 0;
          }
          pollutantsToShow[key] = _value.value;
        }
      }
    });
  }

//  pollutantsToShow['aqi'] = aqi;
  return pollutantsToShow
}

//render the select in the specific panel, with the specif pollutants and select the option
function drawSelect(panel_id, pollutantsToShow, providedPollutants, currentParameterForChart, mapPointOptions) {

  // Remove air paramters from dropdown
  let el = document.querySelector('#parameters_dropdown_'+panel_id);
  while ( el.firstChild ) {
    el.removeChild( el.firstChild )
  }
  //select population
  for (const pollutant in pollutantsToShow){
    let [pollutantId, pollutantName, pollutantUnit] = providedPollutants.filter((elem)=>elem[0]===pollutant)[0]

    // Add Pollutants to Chart Dropdown
    const newPollutant = document.createElement('option');
    newPollutant.id = 'pollutantOption';
    newPollutant.value = pollutant.toUpperCase();

    if(currentParameterForChart===newPollutant.value)
      newPollutant.selected = 'selected';
    
    newPollutant.innerHTML = pollutantName;

    el.appendChild(newPollutant);
    // ----
  }
  let selectBox = document.querySelector('#parameters_dropdown_'+panel_id)
  if(selectBox.options.length>0)
    selectBox.style.display = 'block';

}

function drawMeasuresPopup(panel_id, pollutantsToShow, providedPollutants, currentParameterForChart) {
  const measuresTable = document.querySelector('#measures_table_'+panel_id+' > table > tbody');
  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  for (const pollutant in pollutantsToShow){
    const row = measuresTable.insertRow(-1);    // -1 for inserting bottom

    let [pollutantId, pollutantName, pollutantUnit] = providedPollutants.filter((elem)=>elem[0]===pollutant)[0]

    const innerCell0 = pollutantName;
    const innerCell1 = pollutantsToShow[pollutant] + ' ' + pollutantUnit;
    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);

    cell0.innerHTML = innerCell0;
    cell1.innerHTML = innerCell1;
  }

  document.getElementById('measures_table_'+panel_id).style.display = 'block';
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

export {
  processData,
  getTimeSeries, 
  dataTreatment, 
  getUpdatedChartSeries, 

  hideAllGraphPopups, 
  drawPopups,
  renderChart,

  getCityCoordinates,

  getDataPointExtraFields,
  getDataPointStickyInfo,

  getSelectedCity,

  getMapMarkerClassName
}