/* eslint-disable id-length, no-unused-vars */

/* Vendor specific */
import _ from 'lodash';
import Highcharts from './vendor/highcharts/highstock';
import L from './vendor/leaflet/leaflet';

/* App Specific */
import { tileServers, PLUGIN_PATH } from './definitions';
import { 
  dataTreatment, processData, getTimeSeries, getUpdatedChartSeries,
  drawPopups, renderChart, hideAllGraphPopups, getDataPointValues, getDataPointStickyInfo,
  getMapMarkerClassName
} from './utils/map_utils';
import { filterEmptyAndZeroValues } from './utils/data_formatter';

const DRAW_CHART = false
const REDRAW_CHART = true

const CIRCLE_RADIUS = 200
const POLYGON_MAGNIFY_RATIO = 3

export default class WorldMap {

  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.validated_pollutants = {};
    this.timeSeries = {};
    this.chartSeries = {};
    this.chartData = [];
    this.currentTargetForChart = null;

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
    this.map.on('click', () => {
      hideAllGraphPopups(this.ctrl.panel.id);
      this.currentTargetForChart = null;
    });

    const selectedTileServer = tileServers[this.ctrl.tileServer];
    L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map, true);

    document.querySelector('#air_parameters_dropdown_'+this.ctrl.panel.id)
      .addEventListener('change', (event) => {
        this.ctrl.panel.currentParameterForChart = event.currentTarget.value;
        this.drawChart(REDRAW_CHART);
      }); //, {passive: true} <= to avoid blocking
  }

  addLayersToMap() {
    this.overlayMaps = {};
    for (let i=0; i<this.ctrl.layerNames.length; i++)
      this.overlayMaps[this.ctrl.layerNames[i]]=this.layers[i]
    L.control.layers({}, this.overlayMaps).addTo(this.map);
  }

  clearLayers() {
    this.layers.forEach((layer)=>layer.clearLayers())
  }

  /* Validate pollutants for a given target*/
  setPollutants() {
    try {
      this.validated_pollutants = JSON.parse(this.ctrl.panel.resources.airQualityObserved.pollutants);
    } catch(error) {
      console.log(error)
      throw new Error('Please insert a valid JSON in the Pollutants field (Edit > Tab Worldmap > Section AirQualityObserved - Pollutents field)');
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
    if (this.currentTargetForChart === null) 
      return ;
    this.chartSeries = getUpdatedChartSeries(this.chartSeries, this.timeSeries, this.ctrl.panel.currentParameterForChart, this.currentTargetForChart);
  }

  addPointsToMap() {
    //console.log('addPointsToMap');
    Object.keys(this.data).forEach((key) => {
      const value = this.data[key][this.data[key].length - 1]; // Use the last data for each sensor to create on map -> avoid repeated markers on map and use just the last measurement (the one needed to show on marker)
      const newIcon = this.createIcon(value);

      try { 
        if(newIcon)
          this.overlayMaps[value.type].addLayer(newIcon)
      } catch(error) { console.log(value); console.log(error) }
    });
  }

  createIcon(dataPoint) {
    //console.log(this.ctrl.panel.layersIcons)
    if(!dataPoint || !dataPoint.type)
      return null;
    
    let styled_icon = this.ctrl.panel.layersIcons[dataPoint.type]
    console.log(styled_icon ? styled_icon : 'styled_icon not found for datapoint type '+dataPoint.type+'. going to use default shape!')

    let icon = styled_icon ? this.createMarker(dataPoint, styled_icon ? styled_icon : 'question') : this.createShape(dataPoint);

    this.createPopup(
      this.associateEvents(icon), 
      getDataPointStickyInfo(dataPoint)
    );

    return icon;
  }

  createShape(dataPoint) {
    let dataPointDetails = getDataPointValues(dataPoint);
    let shape;

    switch(dataPoint.type) {
      case 'AirQualityObserved':
        shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointDetails)
      break;
      case 'TrafficFlowObserved':
        shape = L.rectangle([
            [dataPoint.locationLatitude-(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.locationLongitude-(0.0015*POLYGON_MAGNIFY_RATIO)], 
            [dataPoint.locationLatitude+(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.locationLongitude+(0.0015*POLYGON_MAGNIFY_RATIO)]
          ], dataPointDetails)
        //shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointDetails)
      break;
      default:
        dataPointDetails.color='green'  //default color
        shape = L.polygon([
          [dataPoint.locationLatitude-(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.locationLongitude-(0.0015*POLYGON_MAGNIFY_RATIO)], 
          [dataPoint.locationLatitude+(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.locationLongitude],
          [dataPoint.locationLatitude-(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.locationLongitude+(0.0015*POLYGON_MAGNIFY_RATIO)],
        ], dataPointDetails)
    }

    return shape;
  }

  createMarker(dataPoint, styled_icon) {
    let dataPointDetails = getDataPointValues(dataPoint);
    //console.log(dataPointDetails)
    let myIcon = L.icon({
      iconUrl: PLUGIN_PATH+'img/fa/'+styled_icon+'.svg',
      iconSize:  [25, 25], // size of the icon
      className: getMapMarkerClassName(dataPointDetails.value)
    });

    return L.marker(
      [dataPointDetails.latitude, dataPointDetails.longitude], 
      { icon: myIcon, id: dataPointDetails.id, type: dataPointDetails.type }
    );
  }

  associateEvents(shape) {
    return shape
      .on('click', (event) => {this.currentTargetForChart = event})
      .on('click', () => this.drawChart(REDRAW_CHART))
  }

  createPopup(shape, stickyPopupInfo) {
    shape.bindPopup(stickyPopupInfo, 
      {
        'offset': L.point(0, -2), 
        'className': 'worldmap-popup', 
        'closeButton': this.ctrl.panel.stickyLabels
      }
    );
    shape.on('mouseover', function () { this.openPopup() });

    if (!this.ctrl.panel.stickyLabels) { 
      shape.on('mouseout', function () { this.closePopup() });
    }
  }

  setTarget(event) {
    this.currentTargetForChart = event;
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
    
    this.map.flyTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
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
    if(this.currentTargetForChart==null || this.timeSeries==null ) {
      //console.log("not going to drawChart")
      //console.log("currentTargetForChart")
      //console.log(this.currentTargetForChart)
      //console.log("this.timeSeries")
      //console.log(this.timeSeries)
      return ;
    }
    
    drawPopups(this.ctrl.panel.id, this.timeSeries, this.validated_pollutants, this.ctrl.panel.currentParameterForChart, this.currentTargetForChart)

    // ------
    let parameterUnit = ''
    let title = ''

    if (redrawChart) {
      [this.chartData, parameterUnit, title] = processData(this.chartSeries, this.timeSeries, this.validated_pollutants, this.ctrl.panel.currentParameterForChart, this.currentTargetForChart )
    }
    
    renderChart(this.ctrl.panel.id, this.chartSeries, this.chartData, parameterUnit, title)
  }
}
