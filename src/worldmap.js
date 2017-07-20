import _ from 'lodash';

// import Highcharts from './libs/highcharts';
import Highcharts from './libs/highstock';

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
let chartData = [];
let chartSeries;

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
      // .zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
    this.map.setZoom(this.ctrl.panel.initialZoom);
    this.map._initPathRoot();
    this.map._updatePathViewport();

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
      drawChart(providedPollutants, currentTargetForChart, 1);
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

    try{
      providedPollutants = JSON.parse(this.ctrl.panel.pollutants);
    }catch(error){
      throw new Error('Please insert a valid JSON in the Available Pollutants field');
    }

    this.hideAllTables();

    const data = this.filterEmptyAndZeroValues(this.ctrl.data);
    this.clearCircles();
    this.clearMarkers();
    this.clearPolylines();

    timeSeries = {};

    const treatedData = this.dataTreatment(data);

    this.createTimeSeries(treatedData);
    this.createPoints(treatedData);

    // Id sensor selected and new data arrives the chart will be updated (no redraw)
    if (currentTargetForChart !== null){
      drawChart(providedPollutants, currentTargetForChart, 0); // call drawChart but redraw the chart just update information related

      const targetType = currentTargetForChart.target.options.type;
      const targetId = currentTargetForChart.target.options.id;
      const currentParameter = currentParameterForChart.toLowerCase();
      let lastMeasure;
      let lastTime;

      if (targetType === 'environment') {
        let timeEnvironment;
        if (currentParameter !== 'aqi'){
          timeEnvironment = timeSeries.pollutants[currentParameter];
          timeEnvironment.forEach((val) => {
            if (val.id === targetId){
              lastTime = val.time;
              lastMeasure = val.value;
            } 
          });
        }else {
          timeEnvironment = timeSeries.values[targetId];
          lastMeasure = timeEnvironment[timeEnvironment.length - 1].value;
          lastTime = timeEnvironment[timeEnvironment.length - 1].time
        }
      }
      if (targetType === 'traffic') {
        const timeTraffic = timeSeries.values[targetId];
        lastMeasure = timeTraffic[timeTraffic.length - 1].value;
        lastTime = timeTraffic[timeTraffic.length - 1].time
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
        chartSeries.addPoint([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), lastMeasure], true, true);
      }
    }
  }

  hideAllTables() {
    const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

    // Remove the map secundary data (tables) when the map div is too small
    if (mapDivHeight <= 405 || mapDivHeight <= 860) {
      document.getElementById('measuresTable').style.display = 'none';
      document.getElementById('healthConcernsWrapper').style.display = 'none';
      document.getElementById('environmentTable').style.display = 'none';
      document.getElementById('trafficTable').style.display = 'none';
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
    // way.forEach((point) => {
    //   polyline.push([point[1], point[0]]);
    // });

    let colorIndex;
    carsCount.range.forEach((_value, index) => {
      if (value > _value) {
        colorIndex = index;
      }
    });

    const color = carsCount.color[colorIndex];

    const polygon = window.L.polyline(way, {
      color: color,
      weight: 5,
      smoothFactor: 5,
      id: id,
      type: type
    }).on('click', function (e) {
      drawChart(providedPollutants, e, 1);
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
    const urlStart = 'http://130.206.118.134:8282/reverse?format=json&';
    const urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

    window.$.ajax({
      url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
      type: 'GET',
      dataType: 'json',
      cache: false,
      success: (data) => {
        // console.log(data);
        this.osm(data.osm_id, value, id, type);
        // this.createPolyline(data.geojson.coordinates, value, id, type);
      },
      error: (error) => {
        // this.osm(120550284, value, id, type);
        console.log('Nominatim Error');
        console.log(error);
      }
    });
  }

  osm(osm_id, value, id, type) {
    const url = 'http://api.openstreetmap.org/api/0.6/way/' + osm_id + '/full';
    const wayCoordinates = [];
    const nodesAux = {}

    window.$.ajax({
      url: url,
      type: 'GET',
      dataType: 'xml',
      cache: false,
      success: (data) => {
        const nodes = data.getElementsByTagName('node');
        const nds = data.getElementsByTagName('nd');

        let i;
        for (i = 0; i < nodes.length; i++) {
          let nodeId = nodes[i].attributes.id.value;
          let lat = parseFloat(nodes[i].attributes.lat.value);
          let lon = parseFloat(nodes[i].attributes.lon.value);

          if (!(nodesAux[nodeId])) {
            nodesAux[nodeId] = {};
          }
          nodesAux[nodeId].lat = lat;
          nodesAux[nodeId].lng = lon;
        }
        
        for (i = 0; i < nds.length; i++) {
          let nd = nds[i].attributes.ref.value;

          wayCoordinates.push([nodesAux[nd].lat, nodesAux[nd].lng]);
        }
        this.createPolyline(wayCoordinates, value, id, type);
      },
      error: (error) => {
        console.log('OSM Error');
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

    console.log(id, aqi, aqiColor);

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
      drawChart(providedPollutants, e, 1);
    }).on('click', this.setTarget).on('click', this.addPollDropdown);

    this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
    return circle;
  }

  addPollDropdown() {
    // Add pollutants chart dropdown 
    document.getElementById('dataDetails').style.display = 'block';

    // Remove traffic colors table
    document.getElementById('trafficTable').style.display = 'none';

    const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;
    
    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivHeight >= 860) {
      // Add environment colors table
      document.getElementById('environmentTable').style.display = 'block';
    }
  }

  removePollDropdown() {
    // Remove pollutants chart dropdown
    document.getElementById('dataDetails').style.display = 'none';

    // Remove environmentcolors table
    document.getElementById('environmentTable').style.display = 'none';

    const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivHeight >= 860) {
      // Add traffic colors table
      document.getElementById('trafficTable').style.display = 'block';
    }
    
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

    newPollutant.id = 'pollutantOption';
    newPollutant.value = pollutant.toUpperCase();

    newPollutant.innerHTML = providedPollutants[pollutant].name;
 
    document.getElementById('airParametersDropdown').appendChild(newPollutant);

    // ----
  };
  const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
  const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= 405 && mapDivWidth >= 860) {
    document.getElementById('environmentTable').style.display = 'block';
    document.getElementById('measuresTable').style.display = 'block';
  }
}

function showHealthConcerns(providedPollutants, risk, color, meaning) {
  const healthConcernsWrapper = document.getElementById('healthConcernsWrapper');
  const healthConcerns = document.getElementById('healthConcerns');
  const healthRisk = document.getElementById('healthRisk');

  const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
  const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= 405 && mapDivWidth >= 860) {
    healthConcernsWrapper.style.display = 'block';
    healthConcerns.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
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

function drawChart(providedPollutants, e, redrawChart) {
  const currentParameter = currentParameterForChart.toLowerCase();

  const chart = document.getElementById('dataChart');
  chart.style.display = 'block';

  const id = e.target.options.id;
  const type = e.target.options.type;

  const values = timeSeries.values[id];
  let title = '';
  let parameterUnit = '';

  const lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values

  const aqiIndex = calculateAQI(lastValueMeasure);

  // Show Pollutants Legend (MAP)
  if (type === 'environment') {
    const allPollutants = timeSeries.pollutants;
    showPollutants(providedPollutants, allPollutants, id, lastValueMeasure);
    showHealthConcerns(providedPollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
  } else { // Hide legend
    const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      document.getElementById('trafficTable').style.display = 'block';
    }
    document.getElementById('healthConcernsWrapper').style.display = 'none';
    document.getElementById('measuresTable').style.display = 'none';

  }
  // ------

  if (redrawChart) {
    chartData = [];

    parameterUnit = providedPollutants[currentParameter].unit;

    title = providedPollutants[currentParameter].name + ' - Sensor ' + id;

    if (type === 'environment' && currentParameter !== 'aqi') {

      const parameterChoice = timeSeries.pollutants[currentParameter];
      
      parameterChoice.forEach((sensor) => {
        if (sensor.id === id) {
          const time = new Date(sensor.time);

          const day = time.getDate();
          const month = time.getMonth();
          const year = time.getFullYear();
          const hour = time.getHours() - 1;
          const minutes = time.getMinutes();
          const seconds = time.getSeconds();
          const milliseconds = time.getMilliseconds();

          chartData.push([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), sensor.value]);
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

        chartData.push([Date.UTC(year, month, day, hour, minutes, seconds, milliseconds), value.value]);
      });
    }

    window.Highcharts.theme = {
      colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee',
          '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
      chart: {
          backgroundColor: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
            stops: [
                [0, '#2a2a2b'],
                [1, '#3e3e40']
            ]
          },
          style: {
            fontFamily: '\'Unica One\', sans-serif'
          },
          plotBorderColor: '#606063'
      },
      title: {
          style: {
            color: '#E0E0E3',
            // textTransform: 'uppercase',
            fontSize: '20px'
          }
      },
      subtitle: {
          style: {
            color: '#E0E0E3',
            textTransform: 'uppercase'
          }
      },
      xAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
                color: '#E0E0E3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          title: {
            style: {
                color: '#A0A0A3'

            }
          }
      },
      yAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
                color: '#E0E0E3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          tickWidth: 1,
          title: {
            style: {
                color: '#A0A0A3'
            }
          }
      },
      tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          style: {
            color: '#F0F0F0'
          }
      },
      plotOptions: {
          series: {
            dataLabels: {
                color: '#B0B0B3'
            },
            marker: {
                lineColor: '#333'
            }
          },
          boxplot: {
            fillColor: '#505053'
          },
          candlestick: {
            lineColor: 'white'
          },
          errorbar: {
            color: 'white'
          }
      },
      legend: {
          itemStyle: {
            color: '#E0E0E3'
          },
          itemHoverStyle: {
            color: '#FFF'
          },
          itemHiddenStyle: {
            color: '#606063'
          }
      },
      credits: {
          style: {
            color: '#666'
          }
      },
      labels: {
          style: {
            color: '#707073'
          }
      },

      drilldown: {
          activeAxisLabelStyle: {
            color: '#F0F0F3'
          },
          activeDataLabelStyle: {
            color: '#F0F0F3'
          }
      },

      navigation: {
          buttonOptions: {
            symbolStroke: '#DDDDDD',
            theme: {
                fill: '#505053'
            }
          }
      },

      // scroll charts
      rangeSelector: {
          buttonTheme: {
            fill: '#505053',
            stroke: '#000000',
            style: {
                color: '#CCC'
            },
            states: {
                hover: {
                  fill: '#707073',
                  stroke: '#000000',
                  style: {
                      color: 'white'
                  }
                },
                select: {
                  fill: '#000003',
                  stroke: '#000000',
                  style: {
                      color: 'white'
                  }
                }
            }
          },
          inputBoxBorderColor: '#505053',
          inputStyle: {
            backgroundColor: '#333',
            color: 'silver'
          },
          labelStyle: {
            color: 'silver'
          }
      },

      navigator: {
          handles: {
            backgroundColor: '#666',
            borderColor: '#AAA'
          },
          outlineColor: '#CCC',
          maskFill: 'rgba(255,255,255,0.1)',
          series: {
            color: '#7798BF',
            lineColor: '#A6C7ED'
          },
          xAxis: {
            gridLineColor: '#505053'
          }
      },

      scrollbar: {
          barBackgroundColor: '#808083',
          barBorderColor: '#808083',
          buttonArrowColor: '#CCC',
          buttonBackgroundColor: '#606063',
          buttonBorderColor: '#606063',
          rifleColor: '#FFF',
          trackBackgroundColor: '#404043',
          trackBorderColor: '#404043'
      },

      // special colors for some of the
      legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
      background2: '#505053',
      dataLabelsColor: '#B0B0B3',
      textColor: '#C0C0C0',
      contrastTextColor: '#F0F0F3',
      maskColor: 'rgba(255,255,255,0.3)'
    };
    window.Highcharts.setOptions(window.Highcharts.theme);

    window.Highcharts.stockChart('graphContainer', {
        chart: {
          zoomType: 'x',
          backgroundColor: '#1f1d1d',
          events: {
            load: function () {
              // set up the updating of the chart each second
              chartSeries = this.series[0];
              // setInterval(function () {
              //     const x = chartData[chartData.length - 1][0];
              //     const y = chartData[chartData.length - 1][1];
              //     series.addPoint([x, y], true, true);
              //     //console.log(chartData[chartData.length - 1]);
              // }, 1000);
            }
          }
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
  }
}
