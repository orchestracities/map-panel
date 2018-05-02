import WorldMap from './worldmap';
import { hideAllGraphPopups } from './utils/map_utils';

export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.map-container');

  ctrl.events.on('render', () => render());

  function render() {
    if (!ctrl.data) return;

    if (!ctrl.worldMap) {
      ctrl.worldMap = new WorldMap(ctrl, mapContainer[0]);
      /**
      * map display
      */
      hideAllGraphPopups(ctrl.panel.id);

      //if (ctrl.mapCenterMoved) 
      ctrl.worldMap.panToMapCenter();

    }
    
    ctrl.worldMap.resize();

    if(ctrl.panel.mapCenter === 'cityenv' && ctrl.isADiferentCity())
      ctrl.worldMap.panToMapCenter();
    if(ctrl.mapCenterMoved) {
      ctrl.worldMap.panToMapCenter();
      ctrl.mapCenterMoved=false;
    }


    ctrl.worldMap.clearCircles();
    //for each target drawpoints  
    // ctrl.panel.targets.forEach((target)=>{
    //   console.log('processing target '+target.datasource)
    ctrl.worldMap.setPollutants()
    //   ctrl.worldMap.drawPoints(target);
    // })
    ctrl.worldMap.drawPoints();

    /**
    * graph display
    */
    ctrl.worldMap.prepareSeries();
    ctrl.worldMap.drawChart(true); // call drawChart but redraw the chart just update information related

    ctrl.renderingCompleted();
  }
}
