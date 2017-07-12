import _ from 'lodash';

import Highcharts from './libs/highcharts';

/* eslint-disable id-length, no-unused-vars */
import L from './libs/leaflet';
/* eslint-disable id-length, no-unused-vars */

const AQI = {
  'range': [0, 50, 100, 150, 200, 300, 500],
  'meaning': ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
  'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023'],
  'risks': ['Air quality is considered satisfactory, and air pollution poses little or no risk.', 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', 'Health alert: everyone may experience more serious health effects.', 'Health warnings of emergency conditions. The entire population is more likely to be affected.']
};

const carsCount = {
  'range': [0, 15, 30, 45, 70, 85, 100],
  'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023']
};

let providedPollutants;

let timeSeries = {};

let mapControl;
let mapZoom;

let globalCircles = [];
let globalMarkers = [];
let globalPolylines = [];

let currentTargetForChart = null;
let currentParameterForChart = 'aqi';

const tileServers = {
  'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'},
  'CartoDB Dark': {url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'}
};
const carMarker = window.L.icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Map_marker.svg/2000px-Map_marker.svg.png',

  iconSize: [25, 40], // size of the icon
  // iconAnchor: [15, 82], // point of the icon which will correspond to marker's location
  // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

export default class WorldMap {
  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.createMap();
    this.circles = [];
  }

  createMap() {
    const mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
    mapControl = this.map = window.L.map(this.mapContainer, {worldCopyJump: true, center: mapCenter, zoomControl: false, attributionControl: false})
      .fitWorld()
      .zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
    this.map.panTo(mapCenter);
    window.L.control.zoom({position: 'topright'}).addTo(this.map);

    this.map.on('zoomstart', (e) => {
      mapZoom = mapControl.getZoom();
    });

    this.map.on('click', (e) => {
      document.getElementById('measuresTable').style.display = 'none';
      document.getElementById('healthConcernsWrapper').style.display = 'none';
      document.getElementById('dataChart').style.display = 'none';
      document.getElementById('environmentTable').style.display = 'none';
      document.getElementById('trafficTable').style.display = 'none';
    });

    providedPollutants = JSON.parse(this.ctrl.panel.pollutants);

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    window.L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map, true);

    const airParametersDropdown = document.getElementById('airParametersDropdown');

    airParametersDropdown.addEventListener('change', function() {
      currentParameterForChart = this.value;
      drawChart(providedPollutants, currentTargetForChart);
    });
  }

  filterEmptyAndZeroValues(data) {
    return _.filter(data, (o) => { return !(this.ctrl.panel.hideEmpty && _.isNil(o.value)) && !(this.ctrl.panel.hideZero && o.value === 0); });
  }

  clearCircles() {
    if (this.circlesLayer) {
      this.circlesLayer.clearLayers();
      this.removeCircles(this.circlesLayer);
      globalCircles = [];
    }
  }
  clearMarkers() {
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
      this.removeMarkers(this.markersLayer);
      globalMarkers = [];
    }
  }

  clearPolylines() {
    if (this.polylinesLayer) {
      this.polylinesLayer.clearLayers();
      this.removePolylines(this.polylinesLayer);
      globalPolylines = [];
    }
  }

  dataTreatment(data) {
    const finalData = {};
    let auxData = {};

    data.forEach((value) => {
      if (!(finalData[value.id])) {
        finalData[value.id] = [];
      }
      if (value.type === 'environment'){
          finalData[value.id].push({'id': value.id, 'locationLatitude': value.locationLatitude, 'locationLongitude': value.locationLongitude, 'time': value.time, 'type': value.type, 'value': value.value,'pollutants': value.pollutants});
      }
      else {
          finalData[value.id].push({'id': value.id, 'locationLatitude': value.locationLatitude, 'locationLongitude': value.locationLongitude, 'time': value.time, 'type': value.type, 'value': value.value});
      }
    });

    return finalData;
  }

  drawPoints() {
    const data = this.filterEmptyAndZeroValues(this.ctrl.data);
    this.clearCircles();
    this.clearMarkers();
    this.clearPolylines();

    timeSeries = {};

    const treatedData = this.dataTreatment(data);

    this.createTimeSeries(treatedData);
    this.createPoints(treatedData);

    // Id sensor selected and new data arrives the chart will be updated
    if (currentTargetForChart !== null){
      drawChart(providedPollutants, currentTargetForChart);
    }
  }

  createTimeSeries(data) {
    timeSeries = {};
    const valueValues = {};
    const values = [];
    const pollutantsValues = [];

    Object.keys(data).forEach((key) => {
      data[key].forEach((point) => {
        const id = point.id;
        const time = point.time;
        let pollutants = '';

        if (point.type === 'environment') {
          pollutants = point.pollutants;
        }
        const value = point.value;
        if (point.type === 'environment') {
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
    timeSeries = {'values': valueValues, 'pollutants': pollutantsValues};
  }

  createPoints(data) {
    Object.keys(data).forEach((key) => {
      const value = data[key][data[key].length - 1 ]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
      if (value.type === 'environment') {
        const newCircle = this.createCircle(value);
        globalCircles.push(newCircle);
        this.circlesLayer = this.addCircles(globalCircles);
      } else if (value.type === 'traffic') {
        console.log(value);
        this.createMarker(value);
        // const newMarker = this.createMarker(dataPoint);
        // globalMarkers.push(newMarker);
        // this.markersLayer = this.addMarkers(globalMarkers);
      } else {
        console.log('Map point type ' + value.type + ' invalid. Must be environment or traffic');
      }
    });
  }

  createMarker(dataPoint) {
    // const marker = window.L.marker([dataPoint.locationLatitude, dataPoint.locationLongitude]);
    const way = this.calculatePointPolyline(dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value, dataPoint.id, dataPoint.type);
    // this.createPopupMarker(marker, dataPoint.value);
    // return marker;
  }

  createPolyline(way, value, id, type) {
    const polyline = [];
    way.forEach((point) => {
      polyline.push([point[1], point[0]]);
    });

    let colorIndex;
    carsCount.range.forEach((_value, index) => {
      if (value >= _value) {
        colorIndex = index - 1;
      }
    });

    const color = carsCount.color[colorIndex];

    const polygon = window.L.polyline(polyline, {
      color: color,
      weight: 5,
      smoothFactor: 5,
      id: id,
      type: type
    }).on('click', function (e) {
      drawChart(providedPollutants, e);
    }).on('click', this.setTarget).on('click', this.removePollDropdown);

    globalPolylines.push(polygon);
    this.polylinesLayer = this.addPolylines(globalPolylines);

    this.createPopupPolyline(polygon, value);
  }

  calculatePointPolyline(latitude, longitude, value, id, type) {
    const way = this.nominatim(latitude, longitude, value, id, type);
    return way;
  }

  nominatim(latitude, longitude, value, id, type) {
    const urlStart = 'http://nominatim.openstreetmap.org/reverse?format=json&';
    const urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

    window.$.ajax({
      url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
      type: 'GET',
      dataType: 'json',
      cache: false,
      success: (data) => {
        console.log(urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish);
        this.createPolyline(data.geojson.coordinates, value, id, type);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  createCircle(dataPoint) {
    const aqi = calculateAQI(dataPoint.value);
    const aqiColor = AQI.color[aqi];
    const aqiMeaning = AQI.meaning[aqi];
    const aqiRisk = AQI.risks[aqi];
    const pollutants = dataPoint.pollutants;
    const id = dataPoint.id;
    const type = dataPoint.type;

    pollutants.push({'name': 'aqi', 'value': dataPoint.value});

    const circle = window.L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], 200, {
      color: aqiColor,
      fillColor: aqiColor,
      fillOpacity: 0.5,
      aqiColor: aqiColor,
      aqiMeaning: aqiMeaning,
      aqiRisk: aqiRisk,
      pollutants: pollutants,
      id: id,
      type: type,
      latitude: dataPoint.locationLatitude,
      longitude: dataPoint.locationLongitude,
      aqi: dataPoint.value
    }).on('click', function (e) {
      drawChart(providedPollutants, e);
    }).on('click', this.setTarget).on('click', this.addPollDropdown);

    this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
    return circle;
  }

  addPollDropdown() {
    // Add pollutants chart dropdown 
    document.getElementById('dataDetails').style.display = 'block';

    // Remove traffic colors table
    document.getElementById('trafficTable').style.display = 'none';

    // Add environment colors table
    document.getElementById('environmentTable').style.display = 'block';
  }

  removePollDropdown() {
    // Remove pollutants chart dropdown
    document.getElementById('dataDetails').style.display = 'none';

    // Remove environmentcolors table
    document.getElementById('environmentTable').style.display = 'none';

    // Add traffic colors table
    document.getElementById('trafficTable').style.display = 'block';
  }

  createPopupMarker(marker, value) {
    const label = ('Cars: ' + value);
    marker.bindPopup(label, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels});

    marker.on('mouseover', function onMouseOver(evt) {
      // const layer = evt.target;
      // layer.bringToFront();
      this.openPopup();
    });

    if (!this.ctrl.panel.stickyLabels) {
      marker.on('mouseout', function onMouseOut() {
        marker.closePopup();
      });
    }
  }

  createPopupCircle(circle, aqi, aqiMeaning) {
    const label = ('AQI: ' + aqi + ' (' + aqiMeaning + ')').trim();
    circle.bindPopup(label, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels});

    circle.on('mouseover', function onMouseOver(evt) {
      // const layer = evt.target;
      // layer.bringToFront();
      this.openPopup();
    });

    if (!this.ctrl.panel.stickyLabels) {
      circle.on('mouseout', function onMouseOut() {
        circle.closePopup();
      });
    }
  }

  createPopupPolyline(polyline, value) {
    const label = ('Number of cars: ' + value).trim();
    polyline.bindPopup(label, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels});

    polyline.on('mouseover', function onMouseOver(evt) {
      // const layer = evt.target;
      // layer.bringToFront();
      this.openPopup();
    });

    if (!this.ctrl.panel.stickyLabels) {
      polyline.on('mouseout', function onMouseOut() {
        polyline.closePopup();
      });
    }
  }

  setTarget(e) {
    currentTargetForChart = e;
  }

  resize() {
    this.map.invalidateSize();
  }

  panToMapCenter() {
    this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.removeFrom(this.map);
    this.legend = null;
  }

  addCircles(circles) {
    return window.L.layerGroup(circles).addTo(this.map);
  }
  addMarkers(markers) {
    return window.L.layerGroup(markers).addTo(this.map);
  }

  addPolylines(polylines) {
    return window.L.layerGroup(polylines).addTo(this.map);
  }

  removeCircles() {
    this.map.removeLayer(this.circlesLayer);
  }

  removeMarkers() {
    this.map.removeLayer(this.markersLayer);
  }

  removePolylines() {
    this.map.removeLayer(this.polylinesLayer);
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

}

function showPollutants(providedPollutants, allPollutants, id, aqi) {

  const measuresTable = document.getElementById('measures-table');

  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  // Remove air paramters from dropdown
  var el = document.getElementById('airParametersDropdown');
  while ( el.firstChild ) {
    el.removeChild( el.firstChild )
  }

  // ---

  // Add default pollutant option to dropdown
  const defaultPollutantOption = document.createElement('option');
  const html = '<option value="0" selected="selected">Air Parameter</option>';

  defaultPollutantOption.innerHTML = html;
  document.getElementById('airParametersDropdown').appendChild(defaultPollutantOption);

  // -----


  const pollutantsToShow = {};
  for (const key in allPollutants) {
    allPollutants[key].forEach((_value) => {
      if (_value.id === id) {
        if (!(pollutantsToShow[key])){
          pollutantsToShow[key] = 0;
        }
        pollutantsToShow[key] = _value.value;
      }
    });
  }

  pollutantsToShow['aqi'] = aqi;

  for (const pollutant in pollutantsToShow){
    const row = measuresTable.insertRow(0);
    row.className = 'measure';

    const innerCell0 = providedPollutants[pollutant].name;
    const innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;

    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);


    cell0.innerHTML = innerCell0;
    cell1.innerHTML = innerCell1;
    cell0.className = 'cell';
    cell1.className = 'cell';

    // Add Pollutants to Chart Dropdown
    const newPollutant = document.createElement('option');

    // if (pollutant.name === 'aqi'){
    //   newPollutant.selected = 'selected'
    // }
    newPollutant.id = 'pollutantOption';
    newPollutant.value = pollutant.toUpperCase();

    newPollutant.innerHTML = providedPollutants[pollutant].name;
 
    document.getElementById('airParametersDropdown').appendChild(newPollutant);

    // ----
  };

  document.getElementById('measuresTable').style.display = 'inherit';

  // showHealthConcerns(e);
}

function showHealthConcerns(providedPollutants, risk, color, meaning) {
  const healthConcernsWrapper = document.getElementById('healthConcernsWrapper');
  const healthConcerns = document.getElementById('healthConcerns');
  const healthRisk = document.getElementById('healthRisk');

  healthConcernsWrapper.style.display = 'inherit';

  // const risk = e.target.options.aqiRisk;
  // const color = e.target.options.aqiColor;
  // const meaning = e.target.options.aqiMeaning;

  healthConcerns.style.backgroundColor = color;
  healthRisk.innerHTML = risk;
}

function calculateAQI(aqi) {
  let aqiIndex;
  AQI.range.forEach((value, index) => {
    if (aqi > value && aqi <= AQI.range[index + 1]) {
      aqiIndex = index;
    }
  });
  return aqiIndex;
}

function drawChart(providedPollutants, e) {
  const currentParameter = currentParameterForChart.toLowerCase();

  const chart = document.getElementById('dataChart');
  chart.style.display = 'block';

  const id = e.target.options.id;
  const type = e.target.options.type;

  const values = timeSeries.values[id];
  let title = '';
  let parameterUnit = '';
  let data = [];

  const lastValueMeasure = values[values.length - 1].value;

  const aqiIndex = calculateAQI(lastValueMeasure);

  // Show Pollutants Legend (MAP)
  if (type === 'environment') {
    const allPollutants = timeSeries.pollutants;
    showPollutants(providedPollutants, allPollutants, id, lastValueMeasure);
    showHealthConcerns(providedPollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
  } else { // Hide legend
    document.getElementById('healthConcernsWrapper').style.display = 'none';
    document.getElementById('measuresTable').style.display = 'none';

  }
  // ------

  parameterUnit = providedPollutants[currentParameter].unit;

  title = providedPollutants[currentParameter].name + ' - Sensor ' + id;

  if (type === 'environment' && currentParameter !== 'aqi') {

    const parameterChoice = timeSeries.pollutants[currentParameter];
    
    parameterChoice.forEach((sensor) => {
      if (sensor.id === id) {
        console.log(sensor.time);
        const time = new Date(sensor.time);

        const day = time.getDay();
        const month = time.getMonth();
        const year = time.getFullYear();
        const hour = time.getHours() - 1;
        const minutes = time.getMinutes();
        const seconds = time.getSeconds();
        const milliseconds = time.getMilliseconds();

        console.log(day);

        data.push([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), sensor.value]);
      }
    });
  }
  if ((type === 'environment' && currentParameter === 'aqi')  || type === 'traffic') {

    if(type === 'traffic') {
      title = 'Cars Count - Sensor ' + id;
      parameterUnit = 'Cars'
    }

    values.forEach((value) => {
      const time = new Date(value.time);

      const day = time.getDate();
      const month = time.getMonth();
      const year = time.getFullYear();
      const hour = time.getHours() - 1;
      const minutes = time.getMinutes();
      const seconds = time.getSeconds();
      const milliseconds = time.getMilliseconds();

      console.log(day);

      data.push([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), value.value]);
    });
  }

  window.Highcharts.chart('graphContainer', {
      chart: {
          zoomType: 'x',
          backgroundColor: '#1f1d1d'
      },
      title: {
          text: title
      },
      subtitle: {
          text: document.ontouchstart === undefined ? '' : ''
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
      plotOptions: {
          area: {
              // fillColor: {
              //   linearGradient: {
              //     x1: 0,
              //     y1: 0,
              //     x2: 0,
              //     y2: 1
                // }
                // stops: [
                //     [0, '#CCCCCC'],
                //     [1, '#FFFFFF']
                // ]
              // },
              marker: {
                  radius: 4
              },
              lineWidth: 3,
              states: {
                  hover: {
                      lineWidth: 4
                  }
              },
              threshold: null
          }
      },

      series: [{
          type: 'area',
          name: title,
          color: '#CCCCCC',
          data: data
      }]
  });
}
