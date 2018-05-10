import _ from 'lodash';
import WorldMap from './worldmap';
import { hideAllGraphPopups } from './utils/map_utils';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.map-container')[0];

  ctrl.events.on('render', () => render());

  function render() {
    if (!ctrl.data) return;

    //map is initializing
    if (!ctrl.worldMap) {
      ctrl.worldMap = new WorldMap(ctrl, mapContainer);
      console.debug('creating worldMap');
    }

    if(layersChanged()){
      console.log('layers had changed! Please Refresh Page!');
      console.log(ctrl.layerNames);
      console.log(Object.keys(ctrl.worldMap.overlayMaps));
    }
    
    ctrl.worldMap.resize();

    if( (ctrl.panel.mapCenter === 'cityenv') || ctrl.mapCenterMoved) {  //&& ctrl.isADiferentCity()
      console.debug('panToMapCenter');
      console.debug(`${ctrl.panel.mapCenterLatitude} : ${ctrl.panel.mapCenterLongitude}`)
      ctrl.worldMap.panToMapCenter();
    }

    ctrl.worldMap.clearLayers();
    ctrl.worldMap.setPollutants()
    ctrl.worldMap.drawPoints();

    /**
    * graph display
    */
    ctrl.worldMap.prepareSeries();
    ctrl.worldMap.drawChart(true); // call drawChart but redraw the chart just update information related

    ctrl.renderingCompleted();
  }

  // if users add new metrics we must verify if layers are the same or if we must recreate the map
  function layersChanged() {
    return !_.isEqual(ctrl.layerNames, Object.keys(ctrl.worldMap.overlayMaps));
  }
}
