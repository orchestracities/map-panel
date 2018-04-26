/* eslint-disable id-length, no-unused-vars */

/* Vendor specific */
import _ from 'lodash';
import Highcharts from './vendor/highcharts/highstock';
import L from './vendor/leaflet/leaflet';

/* App Specific */
import { tileServers } from './definitions';
import { 
  drawPopups, renderChart, hideAllGraphPopups, getStickyInfo, 
  dataTreatment, processData, 
  getTimeSeries, getUpdatedChartSeries
} from './utils/map_utils';
import { filterEmptyAndZeroValues } from './utils/data_formatter';

let currentTargetForChart = null;
let currentParameterForChart = 'AQI';

const DRAW_CHART = false
const REDRAW_CHART = true

export default class WorldMap {

  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.circles = [];
    this.validated_pollutants = {}
    this.timeSeries = {}
    this.chartSeries = {}
    this.chartData = []

    this.createMap();   //only called once
  }

  getLayers() {
    return this.ctrl.layerNames.map(elem => L.layerGroup())
  }

  createMap() {
    const mapCenter = L.latLng(
      parseFloat(this.ctrl.panel.mapCenterLatitude), 
      parseFloat(this.ctrl.panel.mapCenterLongitude)
      );

    this.layers = this.getLayers()

    this.map = L.map(this.mapContainer, 
      {
        worldCopyJump: true, 
        center: mapCenter, 
        zoomControl: false, 
        attributionControl: false, 
        layers: this.layers
      })
      .fitWorld()

    this.map.setZoom(this.ctrl.panel.initialZoom);
    this.map.panTo(mapCenter);
    L.control.zoom({position: 'topright'}).addTo(this.map);
    this.addLayersToMap();

    // this.map.on('zoomstart', (e) => { mapZoom = this.map.getZoom() });
    this.map.on('click', (e) => {
      hideAllGraphPopups();
      currentTargetForChart = null;
    });

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map, true);

    document.querySelector('#air_parameters_dropdown')
      .addEventListener('change', (event) => {
        currentParameterForChart = event.currentTarget.value;
        this.drawChart(REDRAW_CHART);
      });
  }

  addLayersToMap() {
    this.overlayMaps = {};
    for (let i=0; i<this.ctrl.layerNames.length; i++)
      this.overlayMaps[this.ctrl.layerNames[i]]=this.layers[i]

    L.control.layers({}, this.overlayMaps).addTo(this.map);
  }

  clearCircles() {
    this.layers.forEach((layer)=>layer.clearLayers())
  }

  /* Validate pollutants for a given target*/
  setPollutants() {
    try {
      this.validated_pollutants = JSON.parse(this.ctrl.panel.pollutants);
    } catch(error) {
      console.log(error)
      throw new Error('Please insert a valid JSON in the Available Pollutants');
    }
  }

  drawPoints() {
    //console.log('striping unnecessary entries from recieved data...')
    this.data = dataTreatment(
                    filterEmptyAndZeroValues(this.ctrl.data, this.ctrl.panel.hideEmpty, this.ctrl.panel.hideZero)
                )

    this.addPointsToMap();
  }

  // Prepare series to show in chart
  prepareSeries() {    
    this.timeSeries = getTimeSeries(this.data);
      if (currentTargetForChart === null) 
    return ;
    this.chartSeries = getUpdatedChartSeries(this.chartSeries, this.timeSeries, currentTargetForChart, currentParameterForChart);
  }

  addPointsToMap() {
    //console.log('addPointsToMap');
    Object.keys(this.data).forEach((key) => {
      const value = this.data[key][this.data[key].length - 1 ]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
      const newCircle = this.createCircle(value);
      try {this.overlayMaps[value.type].addLayer(newCircle);} catch(error) {console.log(value);console.log(error)}
    });
  }

  createCircle(dataPoint) {
    let [values, stickyPopupInfo] = getStickyInfo(dataPoint);

    const circle = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], 200, values)
      .on('click', this.setTarget)
      .on('click', () => this.drawChart(REDRAW_CHART))

    this.createPopupCircle(circle, stickyPopupInfo);

    return circle;
  }

  createPopupCircle(circle, stickyPopupInfo) {
    circle.bindPopup(stickyPopupInfo, {'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels});

    circle.on('mouseover', function () { this.openPopup() });

    if (!this.ctrl.panel.stickyLabels) { 
      circle.on('mouseout', function () { this.closePopup() });
    }
  }

  setTarget(event) {
    currentTargetForChart = event;
  }

  resize() {
    this.map.invalidateSize();
  }

  panToMapCenter() {
    if (this.ctrl.panel.mapCenter === 'cityenv' && this.ctrl.isADiferentCity()) {
      this.ctrl.setNewCoords()
        .then(() => this.map.flyTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]))
        .catch(error => console.log(error))
      return ;
    }
    
    this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.removeFrom(this.map);
    this.legend = null;
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  drawChart(redrawChart) {
    if(currentTargetForChart==null || this.timeSeries==null ) {
      console.log("unnable to drawChart")
      console.log(currentTargetForChart)
      return;
    }
    
    drawPopups(this.timeSeries, this.validated_pollutants, currentParameterForChart, currentTargetForChart)

    // ------
    let parameterUnit = ''
    let title = ''

    if (redrawChart) {
      [this.chartData, parameterUnit, title] = processData(this.chartSeries, this.timeSeries, this.validated_pollutants, currentParameterForChart, currentTargetForChart )
    }
    
    renderChart(this.chartSeries, this.chartData, parameterUnit, title)
  }
}
