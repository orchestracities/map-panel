import _ from 'lodash';
import WorldMap from './worldmap';
import { hideAllGraphPopups, getUserLocation } from './utils/map_utils';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.map-container')[0];

  ctrl.events.on('render', () => render());

  function render() {
    if (!ctrl.data) return;

    //map is initializing
    if (!ctrl.worldMap) {
      ctrl.worldMap = new WorldMap(ctrl, mapContainer);
      console.debug('creating worldMap');

      if('User Geolocation'===ctrl.panel.mapCenter) {
        ctrl.setLocationByUserGeolocation();
      } else
      //detect city change when using Location Variable
      if ('Location Variable'===ctrl.panel.mapCenter) {// && this.ctrl.isADiferentCity()
        console.log('centering at city');
        ctrl.setNewCoords();
      }
      else
        ctrl.mapCenterMoved=true;

      ctrl.worldMap.createMap();      
    } else
    if ('Location Variable'===ctrl.panel.mapCenter && ctrl.isADiferentCity()) {
      console.log('centering at new city');
      ctrl.setNewCoords();
    }

    if(layersChanged()){
      console.log('layers had changed!');
      ctrl.worldMap.map.remove();
      ctrl.worldMap.createMap();
    }
    
    ctrl.worldMap.resize();

    if(ctrl.mapCenterMoved) {
      ctrl.worldMap.panToMapCenter();
    }

    ctrl.worldMap.clearLayers();
    ctrl.worldMap.setMetrics()


    //ctrl.worldMap.filterEmptyData();
    ctrl.worldMap.drawPoints();

    /**
    * popups and graph display
    */
    // draw all info associated with selected point but when redrawing the chart just update information related
    ctrl.worldMap.drawPointDetails(); 

    ctrl.renderingCompleted();
  }

  // if users add new metrics we must verify if layers are the same or if we must recreate the map
  function layersChanged() {
    return !_.isEqual(ctrl.layerNames, Object.keys(ctrl.worldMap.overlayMaps));
  }
}
