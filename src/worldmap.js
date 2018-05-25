/* eslint-disable id-length, no-unused-vars */

/* Vendor specific */
import { defaultsDeep, isEqual } from 'lodash';

import './vendor/leaflet.awesome-markers/leaflet.awesome-markers.css!';

import * as L from './vendor/leaflet/leaflet';
import './vendor/leaflet.awesome-markers/leaflet.awesome-markers';

/* App Specific */
import { TILE_SERVERS, PLUGIN_PATH } from './definitions';
import { 
  dataTreatment, processData, getTimeSeries, getUpdatedChartSeries,
  drawSelect, drawPopups, renderChart, 
  hideAllGraphPopups, getDataPointExtraFields, getDataPointStickyInfo,
  getMapMarkerClassName
} from './utils/map_utils';

const CIRCLE_RADIUS = 200
const POLYGON_MAGNIFY_RATIO = 3

export default class WorldMap {

  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.validatedMetrics = {};
    this.timeSeries = {};
    this.chartSeries = {};
    this.chartData = [];
    this.currentTargetForChart = null;
    this.currentParameterForChart = null;
    this.map = null;

    this.ctrl.events.on('panel-size-changed', this.flagChartRefresh.bind(this));
  }

  flagChartRefresh() {
    this.refreshChart = true
  }
  getLayers() {
    return this.ctrl.layerNames.map(elem => L.layerGroup())
  }

  createMap() {
    let location = [ parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude) ]

    this.layers = this.getLayers()

    this.map = L.map(this.mapContainer, 
      {
        worldCopyJump: true, 
        center: location,
        zoomControl: false, 
        attributionControl: false,
        layers: this.layers
      })

    this.map.setZoom(this.ctrl.panel.initialZoom);
    this.map.panTo(location);
    L.control.zoom({position: 'topright'}).addTo(this.map);
    this.addLayersToMap();

    // this.map.on('zoomstart', (e) => { mapZoom = this.map.getZoom() });
    this.map.on('click', () => {
      hideAllGraphPopups(this.ctrl.panel.id);
      this.currentTargetForChart = null;
    });

    const selectedTileServer = TILE_SERVERS[this.ctrl.tileServer];
    L.tileLayer(selectedTileServer.url, {
      maxZoom: 18,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map, true);

    document.querySelector('#parameters_dropdown_'+this.ctrl.panel.id)
      .addEventListener('change', (event) => {
        this.currentParameterForChart = event.currentTarget.value;
        console.debug('selecting point for measure:')
        console.debug(this.currentParameterForChart)
        this.drawPointDetails();
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

  /* Validate metrics for a given target*/
  setMetrics() {
    try {
      this.validatedMetrics = this.ctrl.panel.metrics;
    } catch(error) {
      console.warn(error)
      throw new Error('Please insert a valid JSON in the Metrics field (Edit > Tab Worldmap > Section AirQualityObserved - Metrics field)');
    }
  }

  drawPoints() {
    Object.keys(this.ctrl.data).forEach((layerKey) => {
      let layer = this.ctrl.data[layerKey]

      //for each layer
      Object.keys(layer).forEach((objectKey) => {
        let lastObjectValues = layer[objectKey][layer[objectKey].length-1]
        lastObjectValues.type = layerKey

        let newIcon = this.createIcon(lastObjectValues);

        try { 
          if(newIcon)
            this.overlayMaps[layerKey].addLayer(newIcon)
        } catch(error) { console.warn(layerKey); console.warn(error) }
      })
    });
  }

  createIcon(dataPoint) {
    //console.log(this.ctrl.panel.layersIcons)
    if(!dataPoint || !dataPoint.type)
      return null;
    
    let layerIcon = this.ctrl.panel.layersIcons[dataPoint.type]
    let layerColor = this.ctrl.panel.layersColors[dataPoint.type]
    let icon = layerIcon ? this.createMarker(dataPoint, layerIcon, layerColor) : this.createShape(dataPoint);

    this.createPopup(
      this.associateEvents(icon), 
      getDataPointStickyInfo(dataPoint, this.ctrl.panel.metrics)
    );

    return icon;
  }

  createShape(dataPoint) {
    let dataPointExtraFields = getDataPointExtraFields(dataPoint);
    let shape;

    defaultsDeep(dataPointExtraFields, dataPoint)

    switch(dataPoint.type) {
      case 'AirQualityObserved':
        shape = L.circle([dataPoint.latitude, dataPoint.longitude], CIRCLE_RADIUS, dataPointExtraFields)
      break;
      case 'TrafficFlowObserved':
        shape = L.rectangle([
            [dataPoint.latitude-(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.longitude-(0.0015*POLYGON_MAGNIFY_RATIO)], 
            [dataPoint.latitude+(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.longitude+(0.0015*POLYGON_MAGNIFY_RATIO)]
          ], dataPointExtraFields)
        //shape = L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], CIRCLE_RADIUS, dataPointExtraFields)
      break;
      default:
        dataPointExtraFields.color='green'  //default color
        shape = L.polygon([
          [dataPoint.latitude-(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.longitude-(0.0015*POLYGON_MAGNIFY_RATIO)], 
          [dataPoint.latitude+(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.longitude],
          [dataPoint.latitude-(0.001*POLYGON_MAGNIFY_RATIO), dataPoint.longitude+(0.0015*POLYGON_MAGNIFY_RATIO)],
        ], dataPointExtraFields)
    }

    return shape;
  }

  createMarker(dataPoint, elementIcon, elementColor) {
    let dataPointExtraFields = getDataPointExtraFields(dataPoint);
    let location = [dataPoint.latitude, dataPoint.longitude];

    let markerProperties = { 
      icon: L.AwesomeMarkers.icon(
        { 
          icon: elementIcon,
          prefix: 'fa',
          markerColor: (elementColor ? elementColor : dataPointExtraFields.markerColor),
          //spin: true,
        }        
      )
    }
    defaultsDeep(markerProperties, dataPoint)

    return L.marker(location, markerProperties);
  }

  associateEvents(shape) {
    return shape
      .on('click', (event) => {this.currentTargetForChart = event})
      .on('click', () => this.drawPointDetails())
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
    let location = [parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]

    if ( this.ctrl.panel.mapCenter === 'Location Variable' && this.ctrl.isADiferentCity() ) {
      this.ctrl.setNewCoords()
        .then(() => {
          console.debug('flying to a new location')
          console.debug(location)
          this.map.flyTo(location)
          this.ctrl.refresh();
        })
        .catch(error => console.warn(error))
      return ;
    }
    
    this.map.flyTo(location);
    this.ctrl.mapCenterMoved = false;
  }

  removeLegend() {
    this.legend.removeFrom(this.map);
    this.legend = null;
  }

  setZoom(zoomFactor) {
    this.map.setZoom(parseInt(zoomFactor, 10));
  }

  drawPointDetails() {
    console.debug('drawPointDetails')
    if(this.currentTargetForChart==null){
      console.debug('no point selected in map')
      return ;
    }

    let currentParameterForChart = this.currentParameterForChart || 'value'
    let selectedPointValues = this.ctrl.data[this.currentTargetForChart.target.options.type][this.currentTargetForChart.target.options.id];
    let lastValueMeasure = selectedPointValues[selectedPointValues.length - 1];

    drawSelect(this.ctrl.panel.id, lastValueMeasure, this.validatedMetrics, currentParameterForChart)

    drawPopups(this.ctrl.panel.id, lastValueMeasure, this.validatedMetrics)

    //refresh chart only if new values arrived
    if(!this.isToRefreshChart(selectedPointValues, currentParameterForChart))
      return ;

    renderChart(this.ctrl.panel.id, selectedPointValues, 
      getTranslation(this.validatedMetrics, currentParameterForChart),
      [
        this.currentTargetForChart.target.options.type,
        this.currentTargetForChart.target.options.id,
        currentParameterForChart
      ]
    )  

    this.refreshChart = false
  }


  // helper method just to avoid unnecessary chart refresh
  isToRefreshChart(selectedPointValues, currentParameterForChart) {
    if(this.refreshChart)
      return true;
    let chartData = selectedPointValues.map((elem)=>[ elem.created_at, elem[currentParameterForChart] ]);
    if(isEqual(this.currentChartData, chartData))
      return false;
    this.currentChartData = chartData
    return true;
  }
}

function getTranslation(measuresMetaInfo, measure) {
  let resp = measuresMetaInfo.filter((measure_)=>measure_[0].toLowerCase()===measure.toLowerCase())
  return resp.length>0 ? resp[0] : [measure, measure, null]
}