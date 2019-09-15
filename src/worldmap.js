/* eslint-disable id-length, no-unused-vars */

/* Vendor specific */
import { defaultsDeep, isEqual } from 'lodash';

import './vendor/leaflet.awesome-markers/leaflet.awesome-markers.css!';

import * as L from './vendor/leaflet/leaflet';
import './vendor/leaflet.awesome-markers/leaflet.awesome-markers';
import './vendor/leaflet-sleep/Leaflet.Sleep';
import './vendor/leaflet.markercluster/leaflet.markercluster';
import './vendor/leaflet.markercluster/MarkerCluster.Default.css!';
import './vendor/leaflet.markercluster/MarkerCluster.css!';
import './vendor/osmbuildings/OSMBuildings-Leaflet';


/* App Specific */
import { TILE_SERVERS, PLUGIN_PATH } from './definitions';
import {
  dataTreatment, processData, getTimeSeries, getUpdatedChartSeries,
  getDataPointStickyInfo
} from './utils/map_utils';

import * as turf from './vendor/turf/turf';

const CIRCLE_RADIUS = 200;
const POLYGON_MAGNIFY_RATIO = 3;

export default class WorldMap {
  constructor(ctrl, mapContainer) {
    this.ctrl = ctrl;
    this.mapContainer = mapContainer;
    this.validatedMetrics = {};
    this.timeSeries = {};
    this.map = null;
    this.geoMarkers = {};

    this.setDefaultValues();
  }

  getLayers() {
    return this.ctrl.layerNames.map((elem) => L.layerGroup());
  }

  createMap() {
    const location = [ parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude) ];

    this.layers = this.getLayers();

    this.map = L.map(this.mapContainer,
      {
        sleepNote: false,
        sleepOpacity: 0.8,
        hoverToWake: false,
        worldCopyJump: true,
        center: location,
        zoomControl: false,
        minZoom: 3,
        maxZoom: 20,
        attributionControl: false,
        layers: this.layers
      });
    this.map.setZoom(this.ctrl.panel.initialZoom);
    this.map.panTo(location);
    L.control.zoom({position: 'topright'}).addTo(this.map);
    this.addLayersToMap();

    this.map.on('zoomend', () => {
      const zoomLevel = this.map.getZoom();
      this.updateGeoLayers(zoomLevel);
    });

    const selectedTileServer = TILE_SERVERS[this.ctrl.tileServer];
    L.tileLayer(selectedTileServer.url, {
      maxZoom: 20,
      subdomains: selectedTileServer.subdomains,
      reuseTiles: true,
      detectRetina: true,
      attribution: selectedTileServer.attribution
    }).addTo(this.map, true);

    if (this.ctrl.panel.buildings) new OSMBuildings(this.map).load('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');

  }

  addLayersToMap() {
    this.overlayMaps = {};
    for (let i = 0; i < this.ctrl.layerNames.length; i++) this.overlayMaps[this.ctrl.layerNames[i]] = this.layers[i];
    L.control.layers({}, this.overlayMaps).addTo(this.map);
  }

  clearLayers() {
    this.layers.forEach((layer) => layer.clearLayers());
  }

  updateGeoLayers(zoomLevel) {

    Object.keys(this.geoMarkers).forEach((layerKey) => {
      for (const layer of this.geoMarkers[layerKey]) {
        if (zoomLevel < this.ctrl.panel.minZoomShapes) {
          if (this.overlayMaps[layerKey].hasLayer(layer)) {
            this.overlayMaps[layerKey].removeLayer(layer);
          }
        } else if (!this.overlayMaps[layerKey].hasLayer(layer)) {
          this.overlayMaps[layerKey].addLayer(layer);
        }
      }
    });
  }


  drawPoints() {
    this.geoMarkers = {};

    Object.keys(this.ctrl.data).forEach((layerKey) => {
      const layer = this.ctrl.data[layerKey];

      var type = this.ctrl.panel.layersClusterType[layerKey];
      var faIcon = this.ctrl.panel.layersIcons[layerKey];

      var panel = this;

      var getGeoMarkerColorThesholds = this.getGeoMarkerColorThesholds;
      var getGeoMarkerColor = this.getGeoMarkerColor;
      var convertHex = this.convertHex;

      var createIcon = function (cluster) {
        
        var markers = cluster.getAllChildMarkers();

        var value = 'NA';

        var valueId = "value";
        if (panel.ctrl.panel.layersColorsBinding[layerKey] !== undefined) {
          valueId = panel.ctrl.panel.layersColorsBinding[layerKey];
        }

        switch(type) {
          case 'average':
            var n = 0;
            for (var i = 0; i < markers.length; i++) {
            	n += markers[i].options[valueId];
            }
            value = Math.round( n / markers.length * 10 ) / 10;
            break;
          case 'total':
            for (var i = 0; i < markers.length; i++) {
              n += markers[i].options[valueId];
            }
            value = n;
            break;
          default:
             value = cluster.getChildCount();
        }

        var object = {
          type: layerKey
        }
  
        object[valueId] = value;

        var hex = getGeoMarkerColor(object, panel);

        var color = "background-color: " + hex + "; opacity: 0.6";
        if (faIcon !== undefined){
          var icon = "<i class='fa fa-" + faIcon + " icon-white'></i><br/>";
          return new L.DivIcon({ html: '<div style="'+color+'"><span class="double">' + icon + value + '</span></div>', className: 'oc-cluster', iconSize: new L.Point(40, 40) });
        }
        return new L.DivIcon({ html: '<div style="'+color+'"><span class="single">' + value + '</span></div>', className: 'oc-cluster', iconSize: new L.Point(40, 40) });
      }

      const markersGJ = L.geoJSON();
      const markers = L.markerClusterGroup({iconCreateFunction: createIcon, disableClusteringAtZoom: 21});

      // for each layer
      Object.keys(layer).forEach((objectKey) => {
        const lastObjectValues = layer[objectKey][layer[objectKey].length - 1];
        lastObjectValues.type = layerKey;

        let geoJsonName = null;
        const keyArray = Object.keys(lastObjectValues);
        for (let k = 0; k < keyArray.length; k++) {
          if (keyArray[k].toLowerCase() === 'geojson') {
            geoJsonName = keyArray[k];
            break;
          }
        }

        const markerColor = this.getGeoMarkerColor(lastObjectValues, this);

        if (geoJsonName !== null && lastObjectValues.latitude === undefined && lastObjectValues.longitude === undefined) {
          const centroid = turf.centroid(lastObjectValues[geoJsonName]);
          lastObjectValues.longitude = centroid.geometry.coordinates[0];
          lastObjectValues.latitude = centroid.geometry.coordinates[1];
        }

        if (geoJsonName && lastObjectValues[geoJsonName] && lastObjectValues[geoJsonName].type !== 'Point') {
          const newGJ = this.createGeoJson(lastObjectValues, geoJsonName, markerColor);
          newGJ.addTo(markersGJ);
        }
        if (lastObjectValues.latitude && lastObjectValues.longitude && this.ctrl.panel.layersIcons[layerKey]) {
          const newIcon = this.createIcon(lastObjectValues, geoJsonName);
          try {
            if (newIcon) markers.addLayer(newIcon);
          } catch (error) { console.warn(layerKey); console.warn(error); }
        }
      });

      this.overlayMaps[layerKey].addLayer(markers);
      this.overlayMaps[layerKey].addLayer(markersGJ);

      this.geoMarkers[layerKey] = this.geoMarkers[layerKey] || [];
      this.geoMarkers[layerKey].push(markersGJ);
    });
  }


  convertHex(hex,opacity) {
      hex = hex.replace('#','');
      var r = parseInt(hex.substring(0,2), 16);
      var g = parseInt(hex.substring(2,4), 16);
      var b = parseInt(hex.substring(4,6), 16);

      return 'rgba('+r+','+g+','+b+','+opacity/100+')';
  }

  getGeoMarkerColor(objectValues, obj) {
    if (obj.ctrl.panel.layersColorType[objectValues.type] === 'fix'){
      return obj.ctrl.panel.layersColors[objectValues.type];
    } else {  
      const bindingValue = objectValues[obj.ctrl.panel.layersColorsBinding[objectValues.type]];
      const {medium, high} = obj.getGeoMarkerColorThesholds(objectValues, obj);

      if (bindingValue < medium) {
        return obj.ctrl.panel.layersColorsLow[objectValues.type];
      }
      if (bindingValue > high) {
        return obj.ctrl.panel.layersColorsHigh[objectValues.type];
      }
      return obj.ctrl.panel.layersColorsMedium[objectValues.type];
    }
  }

  getGeoMarkerColorThesholds(objectValues, obj) {
    const thresholds = obj.ctrl.panel.layersColorsThresholds[objectValues.type] || '';
    const splitted = thresholds.split(',');
    return {
      medium: parseFloat(splitted[0]),
      high: parseFloat(splitted[1]),
    };
  }

  createGeoJson(dataPoint, geoJsonName, geoMarkerColor) {
    const myStyle = {
      'color': geoMarkerColor,
      'weight': 5,
      'opacity': 0.65
    };
    let retVal;
    if (typeof dataPoint[geoJsonName] === 'object') {
      retVal = L.geoJSON(dataPoint[geoJsonName], {
        style: myStyle
      });
    } else {
      retVal = L.geoJSON(JSON.parse(dataPoint[geoJsonName]), {
        style: myStyle
      });
    }

    this.createPopup(
      this.associateEvents(retVal),
      getDataPointStickyInfo(dataPoint, this.ctrl.panel.metrics)
    );
    return retVal;
  }

  createIcon(dataPoint, geoJsonName) {
    // console.log(this.ctrl.panel.layersIcons)
    if (!dataPoint || !dataPoint.type) return null;
    const markerColor = this.getGeoMarkerColor(dataPoint, this);
    const layerIcon = this.ctrl.panel.layersIcons[dataPoint.type];
    const icon = layerIcon ? this.createMarker(dataPoint, layerIcon, markerColor) : this.createShape(dataPoint);
    
    this.createPopup(
      this.associateEvents(icon),
      getDataPointStickyInfo(dataPoint, this.ctrl.panel.metrics)
    );

    return icon;
  }

  createShape(dataPoint) {
    let shape = L.polygon([
          [dataPoint.latitude - (0.001 * POLYGON_MAGNIFY_RATIO), dataPoint.longitude - (0.0015 * POLYGON_MAGNIFY_RATIO)],
          [dataPoint.latitude + (0.001 * POLYGON_MAGNIFY_RATIO), dataPoint.longitude],
          [dataPoint.latitude - (0.001 * POLYGON_MAGNIFY_RATIO), dataPoint.longitude + (0.0015 * POLYGON_MAGNIFY_RATIO)],
        ], {});

    return shape;
  }

  createMarker(dataPoint, elementIcon, elementColor) {
    const location = [dataPoint.latitude, dataPoint.longitude];

    const markerProperties = {
      icon: L.AwesomeMarkers.icon(
        {
          icon: elementIcon,
          prefix: 'fa',
          markerColor: (elementColor)
        }
      )
    };
    defaultsDeep(markerProperties, dataPoint);

    return L.marker(location, markerProperties);
  }

  associateEvents(shape) {
    return shape
     .on('click', () => this.updateVariable(shape))
  }

  updateVariable(shape){
    let variable = _.find(this.ctrl.variables, {'name': this.ctrl.panel.layersVariables[shape.options.type]});
    console.debug(variable);
    
    if(variable) {
      variable.current.text = shape.options.id;
      variable.current.value = shape.options.id;

      this.ctrl.variableSrv.updateOptions(variable).then(() => {
        this.ctrl.variableSrv.variableUpdated(variable).then(() => {
          this.ctrl.$scope.$emit('template-variable-value-updated');
          this.ctrl.$scope.$root.$broadcast('refresh');
        });
      });
    }
  }

  createPopup(shape, stickyPopupInfo) {
    shape.bindPopup(stickyPopupInfo,
      {
        'offset': L.point(0, -2),
        'className': 'worldmap-popup',
        'closeButton': this.ctrl.panel.stickyLabels
      });

    if (!this.ctrl.panel.stickyLabels) {
      shape.on('mouseover', function () { this.openPopup(); });
      shape.on('mouseout', function () { this.closePopup(); });
    }
  }

  setTarget(event) {
    this.currentTargetForChart = event;
  }

  resize() {
    setTimeout(() => {
      this.map.invalidateSize();
    }, 0);
  }

  panToMapCenter() {
    const location = [parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)];

    /*    if ( 'Location Variable' === this.ctrl.panel.mapCenter && this.ctrl.isADiferentCity() ) {
      console.log('diferent city detected')

      this.ctrl.setNewCoords()
        .then(() => {
          console.debug('flying to a new location')
          console.debug(location)
          this.map.flyTo(location)
          this.ctrl.refresh();
        })
        .catch(error => console.warn(error))
      return ;
    } */

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

  setDefaultValues() {
    Object.keys(this.ctrl.data).forEach((layerKey) => {
      if (this.ctrl.panel.layersColorsBinding[layerKey] === undefined) {
        this.ctrl.panel.layersColorsBinding[layerKey] = 'value';
      }
      if (this.ctrl.panel.layersColorsThresholds[layerKey] === undefined) {
        this.ctrl.panel.layersColorsThresholds[layerKey] = '30, 50';
      }

      if (this.ctrl.panel.layersClusterType[layerKey] === undefined) {
        this.ctrl.panel.layersClusterType[layerKey] = 'count';
      }
    
      if (this.ctrl.panel.layersColorsLow[layerKey] === undefined) {
        this.ctrl.panel.layersColorsLow[layerKey] = 'red';
      }
      if (this.ctrl.panel.layersColorsMedium[layerKey] === undefined) {
        this.ctrl.panel.layersColorsMedium[layerKey] = 'orange';
      }
      if (this.ctrl.panel.layersColorsHigh[layerKey] === undefined) {
        this.ctrl.panel.layersColorsHigh[layerKey] = 'green';
      }
    });
  }
}

function getTranslation(measuresMetaInfo, measure) {
  const resp = measuresMetaInfo.filter((measure_) => measure_[0].toLowerCase() === measure.toLowerCase());
  return resp.length > 0 ? resp[0] : [measure, measure, null];
}
