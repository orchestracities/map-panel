/* eslint-disable id-length, no-unused-vars */
import _ from 'lodash';
import Highcharts from './vendor/highcharts/highstock';
import L from './vendor/leaflet/leaflet';
import { showPollutants, showHealthConcerns, calculateAQI, HIGHCHARTS_THEME_DARK } from './utils';
import config from 'app/core/config';

const AQI = {
  'range': [0, 50, 100, 150, 200, 300, 500],
  'meaning': ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
  'color': ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023'],
  'risks': ['Air quality is considered satisfactory, and air pollution poses little or no risk.', 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', 'Health alert: everyone may experience more serious health effects.', 'Health warnings of emergency conditions. The entire population is more likely to be affected.']
};

const carsCount = {
  'range': [0, 15, 30, 45, 70, 85, 100],
  'color': ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023']
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

let circlesLayer;
let polylinesLayer;

let currentTargetForChart = null;
let currentParameterForChart = 'aqi';

const tileServers = {
  'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'},
  'CartoDB Dark': {url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd'}
};
const carMarker = window.L.icon({
  iconUrl: 'images/map_marker.png',
  iconSize: [25, 40]
});

export default class WorldMap {

  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.createMap();
    this.circles = [];
  }

  createMap() {
    circlesLayer = window.L.layerGroup();
    polylinesLayer = window.L.layerGroup();

    const mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
    mapControl = this.map = window.L.map(this.mapContainer, {worldCopyJump: true, center: mapCenter, zoomControl: false, attributionControl: false, layers: [polylinesLayer, circlesLayer]})
      .fitWorld()
      // .zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
    this.map.setZoom(this.ctrl.panel.initialZoom);
    this.map._initPathRoot();
    this.map._updatePathViewport();

    this.map.panTo(mapCenter);
    window.L.control.zoom({position: 'topright'}).addTo(this.map);

    circlesLayer.addTo(mapControl);
    polylinesLayer.addTo(mapControl);

    var baseMaps = {
    };

    var overlayMaps = {
      "Environment Data": circlesLayer,
      "Traffic Data": polylinesLayer
    };

    window.L.control.layers(baseMaps, overlayMaps).addTo(mapControl);

    this.map.on('zoomstart', (e) => {
      mapZoom = mapControl.getZoom();
    });

    this.map.on('click', (e) => {
      document.getElementById('measures_table').style.display = 'none';
      document.getElementById('health_concerns_wrapper').style.display = 'none';
      document.getElementById('environment_table').style.display = 'none';
      document.getElementById('traffic_table').style.display = 'none';

      currentTargetForChart = null;
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
    circlesLayer.clearLayers();
    // if (circlesLayer) {
    //   circlesLayer.clearLayers();
    //   this.removeCircles(circlesLayer);
    //   globalCircles = [];
    // }
  }
  clearMarkers() {
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
      this.removeMarkers(this.markersLayer);
      globalMarkers = [];
    }
  }

  clearPolylines() {
    polylinesLayer.clearLayers();
    // polylinesLayer.layers.forEach((layer) => {
    //   console.log(layer);
    // });
    // if (polylinesLayer) {
    //   polylinesLayer.clearLayers();
    //   this.removePolylines(polylinesLayer);
    //   globalPolylines = [];
    // }
  }

  dataTreatment(data) {
    const finalData = {};
    let auxData = {};

    data.forEach((value) => {
      if (!(finalData[value.id])) {
        finalData[value.id] = [];
      }
      if (value.type === 'AirQualityObserved'){
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
    // this.clearMarkers();
    this.clearPolylines();

    timeSeries = {};

    const treatedData = this.dataTreatment(data);

    this.createTimeSeries(treatedData);
    this.createPoints(treatedData);

    // Id sensor selected and new data arrives the chart will be updated (no redraw)
    if (currentTargetForChart !== null) {
      drawChart(providedPollutants, currentTargetForChart, 0); // call drawChart but redraw the chart just update information related

      const targetType = currentTargetForChart.target.options.type;
      const targetId = currentTargetForChart.target.options.id;
      const currentParameter = currentParameterForChart.toLowerCase();
      let lastMeasure;
      let lastTime;

      try{

        if (targetType === 'AirQualityObserved') {
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
        if (targetType === 'TrafficFlowObserved') {
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
          chartSeries.addPoint([Date.UTC(year, month, day, hour+1, minutes, seconds, milliseconds), lastMeasure], true, true);
        }
      }catch(error){
        console.log("Woaa! Something went wrong... Probably there is no recent data for the selected device. Here you have the error:");
        console.log(error);
      }
    }
  }

  hideAllTables() {
    const mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

    // Remove the map secundary data (tables) when the map div is too small
    if (mapDivHeight <= 405 || mapDivHeight <= 860) {
      document.getElementById('measures_table').style.display = 'none';
      document.getElementById('health_concerns_wrapper').style.display = 'none';
      document.getElementById('environment_table').style.display = 'none';
      document.getElementById('traffic_table').style.display = 'none';
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
    timeSeries = {'values': valueValues, 'pollutants': pollutantsValues};
  }

  createPoints(data) {
    Object.keys(data).forEach((key) => {
      const value = data[key][data[key].length - 1 ]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
      if (value.type === 'AirQualityObserved') {
        const newCircle = this.createCircle(value);
        circlesLayer.addLayer(newCircle);
        // globalCircles.push(newCircle);
        // circlesLayer = this.addCircles(globalCircles);
      } else if (value.type === 'TrafficFlowObserved') {
        this.createMarker(value);
        // const newMarker = this.createMarker(dataPoint);
        // globalMarkers.push(newMarker);
        // this.markersLayer = this.addMarkers(globalMarkers);
      } else {
        console.log('Map point type ' + value.type + ' invalid. Must be AirQualityObserved or TrafficFlowObserved');
      }
    });
    // mapControl.removeLayer(circlesLayer);

    // setTimeout(function(){
    //     mapControl.addLayer(circlesLayer);
    // }, 5000);
  }

  createMarker(dataPoint) {
    // const marker = window.L.marker([dataPoint.locationLatitude, dataPoint.locationLongitude]);
    const way = this.calculatePointPolyline(dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value, dataPoint.id, dataPoint.type);
    // this.createPopupMarker(marker, dataPoint.value);
    // return marker;
  }

  createPolyline(way, value, id, type, street_name) {
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

    // globalPolylines.push(polygon);
    // polylinesLayer = this.addPolylines(globalPolylines);

    polylinesLayer.addLayer(polygon);

    this.createPopupPolyline(polygon, value, street_name);
  }

  calculatePointPolyline(latitude, longitude, value, id, type) {
    const way = this.nominatim(latitude, longitude, value, id, type);
    return way;
  }

  nominatim(latitude, longitude, value, id, type) {
    const urlStart = 'https://nominatim-antwerp-x.s.orchestracities.com/reverse?format=json&';
    const urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

    window.$.ajax({
      url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
      type: 'GET',
      dataType: 'json',
      cache: false,
      success: (data) => {
        let street_name = ''

        if(data.address) {
          if (data.address.road) {
            street_name += 'data.address.road, ';
          }
          if(data.address.city) {
            street_name += data.address.city;
          }

          if(data.address.country) {
            if (data.address.city || data.address.road) {
              street_name += ', ';
            }
            street_name += data.address.country;
          }
        }
        
        if (data.osm_id) {
          this.osm(data.osm_id, value, id, type, street_name);
        }
        else {
          console.log("OSM ID not found for: " + latitude + ";" + longitude);
        }
        // this.createPolyline(data.geojson.coordinates, value, id, type);
      },
      error: (error) => {
        // this.osm(120550284, value, id, type);
        console.log('Nominatim Error');
        console.log(error);
      }
    });
  }

  osm(osm_id, value, id, type, street_name) {
    const url = 'https://api.openstreetmap.org/api/0.6/way/' + osm_id + '/full';
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
        this.createPolyline(wayCoordinates, value, id, type, street_name);
      },
      error: (error) => {
        console.log('OSM Error');
        console.log(error);
      }
    });
  }

  createCircle(dataPoint) {
    const aqi = calculateAQI(AQI, dataPoint.value);
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
      drawChart(providedPollutants, e, 1);
    }).on('click', this.setTarget).on('click', this.addPollDropdown);

    this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
    return circle;
  }

  addPollDropdown() {
    // Add pollutants chart dropdown 
    document.getElementById('dataDetails').style.display = 'block';

    // Remove traffic colors table
    document.getElementById('traffic_table').style.display = 'none';

    const mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;
    
    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      // Add environment colors table
      document.getElementById('environment_table').style.display = 'block';
    }
  }

  removePollDropdown() {
    // Remove pollutants chart dropdown
    document.getElementById('dataDetails').style.display = 'none';

    // Remove environmentcolors table
    document.getElementById('environment_table').style.display = 'none';

    const mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
    const mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      // Add traffic colors table
      document.getElementById('traffic_table').style.display = 'block';
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

  createPopupPolyline(polyline, value, street_name) {
    let label;

    if (street_name !== '') {
      label = ('Street: ' + street_name + '</br>Cars Intensity: ' + value).trim();
    }else{
      label = ('Cars Intensity: ' + value).trim();
    }
    
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

  // addCircles(circles) {
  //   return window.L.layerGroup(circles).addTo(this.map);
  // }
  addMarkers(markers) {
    return window.L.layerGroup(markers).addTo(this.map);
  }

  addPolylines(polylines) {
    return window.L.layerGroup(polylines).addTo(this.map);
  }

  removeCircles() {
    this.map.removeLayer(circlesLayer);
  }

  removeMarkers() {
    this.map.removeLayer(this.markersLayer);
  }

  removePolylines() {
    this.map.removeLayer(polylinesLayer);
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

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

  try {
    const lastValueMeasure = values[values.length - 1].value; //values array is the one for the AQI values

    const aqiIndex = calculateAQI(AQI, lastValueMeasure);

    // Show Pollutants Legend (MAP)
    if (type === 'AirQualityObserved') {
      const allPollutants = timeSeries.pollutants;
      showPollutants(providedPollutants, allPollutants, id, lastValueMeasure, currentParameterForChart);
      showHealthConcerns(providedPollutants, AQI.risks[aqiIndex], AQI.color[aqiIndex], AQI.meaning[aqiIndex]);
    } else { // Hide legend
      const mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
      const mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

      if (mapDivHeight >= 405 && mapDivWidth >= 860) {
        document.getElementById('traffic_table').style.display = 'block';
      }
      document.getElementById('health_concerns_wrapper').style.display = 'none';
      document.getElementById('measures_table').style.display = 'none';
    }
  } catch(error) {
      console.log("Woaa! Something went wrong... Probably there is no recent data for the selected device. Here you have the error:");
      console.log(error);
  }

  // ------

  if (redrawChart) {
    chartData = [];

    parameterUnit = providedPollutants[currentParameter].unit;

    title = providedPollutants[currentParameter].name + ' - Device ' + id;

    if (type === 'AirQualityObserved' && currentParameter !== 'aqi') {

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

          chartData.push([Date.UTC(year, month, day, hour+1, minutes, seconds, milliseconds), sensor.value]);
        }
      });
    }
    if ((type === 'AirQualityObserved' && currentParameter === 'aqi')  || type === 'TrafficFlowObserved') {

      if(type === 'TrafficFlowObserved') {
        title = 'Cars Intensity - Device ' + id;
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

        chartData.push([Date.UTC(year, month, day, hour+1, minutes, seconds, milliseconds), value.value]);
      });
    }

    if(!config.bootData.user.lightTheme)
      window.Highcharts.setOptions(HIGHCHARTS_THEME_DARK);

    window.Highcharts.stockChart('graphContainer', {
        chart: {
          height: 200,
          zoomType: 'x',
          events: {
            load: function () {
              // set up the updating of the chart each second
              chartSeries = this.series[0];
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