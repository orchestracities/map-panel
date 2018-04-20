import WorldMap from './worldmap';
import { hideAllByMapSize } from './utils/map_utils'
export default function link(scope, elem, attrs, ctrl) {
  const mapContainer = elem.find('.map-container');

  ctrl.events.on('render', () => {
    render();
    ctrl.renderingCompleted();
  });

  function render() {
    if (!ctrl.data) return;

    if (!ctrl.map) {
      ctrl.map = new WorldMap(ctrl, mapContainer[0]);
    }

    ctrl.map.resize();

    if (ctrl.mapCenterMoved) ctrl.map.panToMapCenter();

    // if (!ctrl.map.legend && ctrl.panel.showLegend) ctrl.map.createLegend();

    hideAllByMapSize();
    
    ctrl.map.clearCircles();

    //for each target drawpoints  
    // ctrl.panel.targets.forEach((target)=>{
    //   console.log('processing target '+target.datasource)
    ctrl.map.setPollutants()
    //   ctrl.map.drawPoints(target);
    // })
    console.log('map_render will drawPoints')
    ctrl.map.drawPoints();

  }
}
