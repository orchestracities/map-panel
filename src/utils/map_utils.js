// draw components in the map

/* Grafana Specific */
import config from 'app/core/config';
import { AQI, HIGHCHARTS_THEME_DARK, MIN_WIDTH_TO_SHOW_MAP_POPUPS, MIN_HEIGHT_TO_SHOW_MAP_POPUPS } from '../definitions';

function drawPollutantsPopup(providedPollutants, allPollutants, id, aqi, currentParameterForChart) {
  const measuresTable = document.querySelector('#measures_table > table > tbody');
  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  // Remove air paramters from dropdown
  var el = document.getElementById('air_parameters_dropdown');
  while ( el.firstChild ) {
    el.removeChild( el.firstChild )
  }

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

  pollutantsToShow['aqi'] = aqi;

  for (const pollutant in pollutantsToShow){
    const row = measuresTable.insertRow(0);
    const innerCell0 = providedPollutants[pollutant].name;
    const innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;
    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);

    cell0.innerHTML = innerCell0;
    cell1.innerHTML = innerCell1;

    // Add Pollutants to Chart Dropdown
    const newPollutant = document.createElement('option');
    newPollutant.id = 'pollutantOption';
    newPollutant.value = pollutant.toUpperCase();

    if(currentParameterForChart===newPollutant.value)
      newPollutant.selected = 'selected';
    
    newPollutant.innerHTML = providedPollutants[pollutant].name;

    el.appendChild(newPollutant);
    // ----
  }

  const [mapDivWidth, mapDivHeight] = getMapSize();

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= MIN_HEIGHT_TO_SHOW_MAP_POPUPS && mapDivWidth >= MIN_WIDTH_TO_SHOW_MAP_POPUPS) {
    document.getElementById('environment_table').style.display = 'block';
    document.getElementById('measures_table').style.display = 'block';
  }
}

function drawHealthConcernsPopup(providedPollutants, risk, color, meaning) {
  const healthConcernsWrapper = document.getElementById('health_concerns_wrapper');
  const healthConcerns = document.querySelector('#health_concerns_wrapper>div');
  const healthConcernsColor = document.querySelector('#health_concerns_wrapper>div>span>span.color');
  const healthRisk = document.getElementById('health_risk');

  const [mapDivWidth, mapDivHeight] = getMapSize();
  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= MIN_HEIGHT_TO_SHOW_MAP_POPUPS && mapDivWidth >= MIN_WIDTH_TO_SHOW_MAP_POPUPS) {
    healthConcernsWrapper.style.display = 'block';
    healthConcernsColor.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }
}

function drawDefaultPopups() {
  console.log('drawDefaultPopups');
  hideAll()

  const [mapDivWidth, mapDivHeight] = getMapSize();
  if (mapDivHeight >= MIN_HEIGHT_TO_SHOW_MAP_POPUPS && mapDivWidth >= MIN_WIDTH_TO_SHOW_MAP_POPUPS) {
    document.getElementById('traffic_table').style.display = 'block';
  }

}

function drawPopups(timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
  //console.log('drawPopups');
  const id = currentTargetForChart.target.options.id;
  const type = currentTargetForChart.target.options.type;
  const values = timeSeries.values[id];

  document.getElementById('data_chart').style.display = 'block';

  //render popups
  try {
    const lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values
    const aqiIndex = calculateAQI(lastValueMeasure);

    // Show Pollutants Legend (MAP)
    if (type === 'AirQualityObserved') {
      const allPollutants = timeSeries.pollutants;

      if(validated_pollutants) {
        drawPollutantsPopup(validated_pollutants, allPollutants, id, lastValueMeasure, currentParameterForChart);
        drawHealthConcernsPopup(validated_pollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
      }
    } else { // Hide legend
      drawDefaultPopups();
    }
  } catch(error) {
    console.log("Exception:");
    console.log(error);
    console.log("id:")
    console.log(id);
    console.log("type:")
    console.log(type);
    console.log("values are:")
    console.log(values)
  }
}

function calculateAQI(aqi) {
  let aqiIndex;
  AQI.range.forEach((value, index) => {
    if (aqi >= value) {
      aqiIndex = index;
    }
  });
  return aqiIndex;
}

function getTimeSeries(data) {
    const valueValues = {};
    const values = [];
    const pollutantsValues = [];

    Object.keys(data).forEach((key) => {
      data[key].forEach((point) => {
        const id = point.id;
        const time = point.time;
        let pollutants = '';

        const value = point.value;
        if (point.type === 'AirQualityObserved') {
          pollutants = point.pollutants;
          const pollutantsTemp = {};

          pollutants.forEach((pollutant) => {
            if (!(pollutantsValues[pollutant.name])) {
              pollutantsValues[pollutant.name] = [];
            }
            pollutantsValues[pollutant.name].push({'time': time, 'value': pollutant.value, 'id': id});
          });
        }

        if (!(valueValues[point.id])) {
          valueValues[point.id] = [];
        }
        valueValues[point.id].push({'time': time, 'value': value, 'id': id});
      });
    });

    return {'values': valueValues, 'pollutants': pollutantsValues};
}
/*
* Agregate data by id
*/
function dataTreatment(data) {
  const finalData = {};
  let auxData = {};

  data.forEach((value) => {
    if (!(finalData[value.id])) {
      finalData[value.id] = [];
    }

    //if (value.type === 'AirQualityObserved'){
        finalData[value.id].push(
          {
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

  if(Object.keys(chartSeries).length === 0)
    return chartSeries

  const targetType = currentTargetForChart.target.options.type;
  const targetId = currentTargetForChart.target.options.id;
  const currentParameter = currentParameterForChart.toLowerCase();
  let lastMeasure;
  let lastTime;

  try {
    let timeTemp;
    if (currentParameter !== 'aqi' && targetType === 'AirQualityObserved'){
      timeTemp = timeSeries.pollutants[currentParameter];
      timeTemp.forEach((val) => {
        if (val.id === targetId){
          lastTime = val.time;
          lastMeasure = val.value;
        } 
      });
    } else {
      timeTemp = timeSeries.values[targetId];
      lastMeasure = timeTemp[timeTemp.length - 1].value;
      lastTime = timeTemp[timeTemp.length - 1].time
    }
   
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
    console.log("Woaa! Something went wrong... Probably there is no recent data for the selected device. Here you have the error:");
    console.log(error);
  }

  return chartSeries;
}

function getMapSize() {
  //return [ document.getElementsByClassName('map-container')[0].offsetHeight, document.getElementsByClassName('map-container')[0].offsetWidth];
  let map_svg = document.querySelector('.map-container svg');
  return [map_svg.width.baseVal.value, map_svg.height.baseVal.value]
}

function hideAllByMapSize() {
  const [mapDivWidth, mapDivHeight] = getMapSize();
  // Remove the map secundary data (tables) when the map div is too small
  if (mapDivHeight <= MIN_HEIGHT_TO_SHOW_MAP_POPUPS || mapDivHeight <= MIN_WIDTH_TO_SHOW_MAP_POPUPS) {
    hideAll()
  }
}

function hideAll() {
  document.getElementById('measures_table').style.display = 'none';
  document.getElementById('health_concerns_wrapper').style.display = 'none';
  document.getElementById('environment_table').style.display = 'none';
  document.getElementById('traffic_table').style.display = 'none';
}

function addPollDropdown() {
  // Add pollutants chart dropdown 
  document.getElementById('data_details').style.display = 'block';
  // Remove traffic colors table
  document.getElementById('traffic_table').style.display = 'none';

  const [mapDivWidth, mapDivHeight] = getMapSize();
  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= MIN_HEIGHT_TO_SHOW_MAP_POPUPS && mapDivWidth >= MIN_WIDTH_TO_SHOW_MAP_POPUPS) {
    // Add environment colors table
    document.getElementById('environment_table').style.display = 'block';
  }
} 

//Not used
function removePollDropdown() {  
  document.getElementById('data_details').style.display = 'none'; // Remove pollutants chart dropdown  
  document.getElementById('environment_table').style.display = 'none'; // Remove environmentcolors table

  const [mapDivWidth, mapDivHeight] = getMapSize();
  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= MIN_HEIGHT_TO_SHOW_MAP_POPUPS && mapDivWidth >= MIN_WIDTH_TO_SHOW_MAP_POPUPS) {
    // Add traffic colors table
    document.getElementById('traffic_table').style.display = 'block';
  }
}

function processData(chartSeries, timeSeries, validated_pollutants, currentParameterForChart, currentTargetForChart) {
  let chartData = [];
  const currentParameter = currentParameterForChart.toLowerCase();
  const id = currentTargetForChart.target.options.id;
  const type = currentTargetForChart.target.options.type;
  const values = timeSeries.values[id];

  let parameterUnit = validated_pollutants[currentParameter].unit;
  let title = validated_pollutants[currentParameter].name + ' - Device ' + id;

  if (type === 'AirQualityObserved' && currentParameter !== 'aqi') {
    const parameterChoice = timeSeries.pollutants[currentParameter];      
    parameterChoice.forEach((sensor) => {
      if (sensor.id === id) {
       chartData.push(createLine(sensor));
      }
    });
  } else {
    if(type === 'TrafficFlowObserved') {
      title = 'Cars Intensity - Device ' + id;
      parameterUnit = 'Cars'
    } else {
      title = type + ' - Device ' + id;
      parameterUnit = type;
    }

    values.forEach((value) => {
      chartData.push(createLine(value));
    });
  }


  return [chartData, parameterUnit, title]
}

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


function renderChart(chartSeries, chartData, parameterUnit, title) {
  //config highchart acording with grafana theme
  if(!config.bootData.user.lightTheme)
    window.Highcharts.setOptions(HIGHCHARTS_THEME_DARK);

  window.Highcharts.stockChart('graph_container', 
    {
      chart: {
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
    }
  );
}

export {
  drawPopups,
  calculateAQI, 
  getTimeSeries, 
  dataTreatment, 
  getUpdatedChartSeries, 
  hideAllByMapSize, 
  hideAll, 
  addPollDropdown, 
  removePollDropdown,
  processData,
  renderChart
}