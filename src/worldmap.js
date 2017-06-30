import _ from 'lodash';
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
  'range': [15, 30, 45, 60, 75, 90, 105],
  'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023']
};

let mapControl;
let mapZoom;

let globalCircles = [];
let globalMarkers = [];
let globalPolylines = [];

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
    mapControl = this.map = window.L.map(this.mapContainer, {worldCopyJump: true, center: mapCenter, zoomControl: false})
      .fitWorld()
      .zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
    this.map.panTo(mapCenter);
    window.L.control.zoom({position: 'topright'}).addTo(this.map);

    this.map.on('zoomstart', (e) => {
      mapZoom = mapControl.getZoom();
    });

    // this.map.on('zoomend', (e) => {
    //   globalCircles.forEach((circle) => {
    //     console.log(mapZoom, e.target._zoom);
    //     if (e.target._zoom !== 0 && e.target._zoom >= mapZoom) {
    //       circle.setRadius(circle.getRadius() + Math.round(mapZoom));
    //     }
    //     if (e.target._zoom !== 0 && e.target._zoom <= mapZoom) {
    //       circle.setRadius(circle.getRadius() - Math.round(mapZoom));
    //     }
    //     console.log(circle.getRadius());
    //   });
    // });

    this.map.on('click', (e) => {
      document.getElementById('measuresTable').style.display = 'none';
      document.getElementById('healthConcernsWrapper').style.display = 'none';
    });

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    window.L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map, true);
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

  drawPoints() {
    const data = this.filterEmptyAndZeroValues(this.ctrl.data);
    this.clearCircles();
    this.clearMarkers();
    this.clearPolylines();

    this.createPoints(data);
  }

  createPoints(data) {
    data.forEach((dataPoint) => {
      if (dataPoint.type === 'environment') {
        const newCircle = this.createCircle(dataPoint);
        globalCircles.push(newCircle);
        this.circlesLayer = this.addCircles(globalCircles);
      } else if (dataPoint.type === 'traffic') {
        this.createMarker(dataPoint);
        // const newMarker = this.createMarker(dataPoint);
        // globalMarkers.push(newMarker);
        // this.markersLayer = this.addMarkers(globalMarkers);
      } else {
        console.log('Map point type ' + dataPoint.type + ' invalid. Must be environment or traffic');
      }
    });
  }

  createMarker(dataPoint) {
    // const marker = window.L.marker([dataPoint.locationLatitude, dataPoint.locationLongitude]);
    const way = this.calculatePointPolyline(dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value);
    // this.createPopupMarker(marker, dataPoint.value);
    // return marker;
  }

  createPolyline(way, value) {
    const polyline = [];
    way.forEach((point) => {
      polyline.push([point[1], point[0]]);
    });

    let colorIndex;
    carsCount.range.forEach((_value, index) => {
      if (value > _value && value <= carsCount.range[index + 1]) {
        colorIndex = index;
      }
    });

    const color = carsCount.color[colorIndex];

    const polygon = window.L.polyline(polyline, {
      color: color,
      weight: 5,
      smoothFactor: 1
    });
    globalPolylines.push(polygon);
    this.polylinesLayer = this.addPolylines(globalPolylines);

    this.createPopupPolyline(polygon, value);
  }

  calculatePointPolyline(latitude, longitude, value) {
    const way = this.nominatim(latitude, longitude, value);
    return way;
  }

  nominatim(latitude, longitude, value) {
    const urlStart = 'http://nominatim.openstreetmap.org/reverse?format=json&';
    const urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

    window.$.ajax({
      url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
      type: 'GET',
      dataType: 'json',
      cache: false,
      success: (data) => {
        this.createPolyline(data.geojson.coordinates, value);
      },
      error: (error) => {
        alert('Nominatim ERROR');
      }
    });
  }

  createCircle(dataPoint) {
    const aqi = calculateAQI(dataPoint.value);
    const aqiColor = AQI.color[aqi];
    const aqiMeaning = AQI.meaning[aqi];
    const aqiRisk = AQI.risks[aqi];
    const pollutants = dataPoint.pollutants;

    const circle = window.L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], 200, {
      color: aqiColor,
      fillColor: aqiColor,
      fillOpacity: 0.5,
      aqiColor: aqiColor,
      aqiMeaning: aqiMeaning,
      aqiRisk: aqiRisk,
      pollutants: pollutants
    }).on('click', showPollutants).on('mouseover', showPollutants);

    this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
    return circle;
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
    console.log(polylines);
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

function showPollutants(e) {
  const measuresTable = document.getElementById('measures-table');

  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  const circlePollutants = e.target.options.pollutants;

  circlePollutants.forEach((pollutant) => {
    const row = measuresTable.insertRow(0);
    row.className = 'measure';

    const innerCell0 = pollutant.name.toUpperCase();
    const innerCell1 = pollutant.value;

    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);


    cell0.innerHTML = innerCell0;
    cell1.innerHTML = innerCell1;
    cell0.className = 'cell';
    cell1.className = 'cell';
  });

  document.getElementById('measuresTable').style.display = 'inherit';

  showHealthConcerns(e);
}

function showHealthConcerns(e) {
  const healthConcernsWrapper = document.getElementById('healthConcernsWrapper');
  const healthConcerns = document.getElementById('healthConcerns');
  const healthRisk = document.getElementById('healthRisk');

  healthConcernsWrapper.style.display = 'inherit';

  const risk = e.target.options.aqiRisk;
  const color = e.target.options.aqiColor;
  const meaning = e.target.options.aqiMeaning;

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
