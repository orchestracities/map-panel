import _ from 'lodash';
import WorldMap from './worldmap';
import { hideAllGraphPopups } from './utils/map_utils';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.map-container');

  ctrl.events.on('render', () => render());

  function render() {
    if (!ctrl.data) return;

    if (!ctrl.worldMap) {
      ctrl.worldMap = new WorldMap(ctrl, mapContainer[0]);
    }

    if(layersChanged())
      throw Error('layers had changed! Please Refresh Page!');
      //ctrl.worldMap.addLayersToMap();
    
    ctrl.worldMap.resize();

    if( (ctrl.panel.mapCenter === 'cityenv' && ctrl.isADiferentCity()) || ctrl.mapCenterMoved)
      ctrl.worldMap.panToMapCenter();

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
    console.log(ctrl.layerNames)
    console.log(Object.keys(ctrl.worldMap.overlayMaps))

    return !_.isEqual(ctrl.layerNames, Object.keys(ctrl.worldMap.overlayMaps));
  }
}
