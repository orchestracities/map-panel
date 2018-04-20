/* eslint import/no-extraneous-dependencies: 0 */

/* Grafana Specific */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
/* Vendor specific */
import _ from 'lodash';
/* App specific */
import { PLUGIN_PATH, panelDefaults, mapCenters } from './definitions'
import { getDatasources, getValidDatasources } from './utils/datasource';
import mapRenderer from './map_renderer';
import DataFormatter from './utils/data_formatter';

import './css/worldmap-panel.css!';
import './vendor/leaflet/leaflet.css!';

let dataFormatter = new DataFormatter(kbn);

export default class WorldmapCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);
    this.setMapProvider(contextSrv);
    _.defaultsDeep(this.panel, panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));  //process resultset as a result of the execution of all queries

    this.handleDatasourceParamsChange = this.applyDatasourceParamsChange.bind(this)
  }



  onInitEditMode() {
    this.addEditorTab('Worldmap', `${PLUGIN_PATH}partials/editor.html`, 2);
  }

  /* 
  * Process the resultset
  * @dataList: The resultset from the executed query 
  */
  onDataReceived(dataList) {
    if (!dataList) return;    //no result sets
    if (this.dashboard.snapshot && this.locations) {
      this.panel.snapshotLocationData = this.locations;
    }

console.log('dataList')
console.log(dataList)
    this.layerNames = [...new Set(dataList.map((elem)=>elem.target.split(':')[0]))]
    this.series = dataList.map(this.seriesHandler.bind(this));
    this.data = dataFormatter.getValues(this.series, this.panel.pollutants);



console.log('this.data')
console.log(this.data)

    this.render();
  }

  onDataSnapshotLoad(snapshotData) {
    this.onDataReceived(snapshotData);
  }

  seriesHandler(seriesData) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  applyDatasourceParamsChange(datasource) {
    console.log('datasource')
    console.log(datasource)
    /*this.panel.pollutants=datasource.pollutants*/
    this.render()
  }

  onPanelTeardown() {
    if (this.map) this.map.remove();
  }

  setMapProvider(contextSrv) {
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.setMapSaturationClass();
  }

  setMapSaturationClass() {
    this.saturationClass = this.tileServer === 'CartoDB Dark' ? 'map-darken' : '';    
  }

  setNewMapCenter() {
    if (this.panel.mapCenter !== 'custom') {
      this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
      this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
    }
    this.mapCenterMoved = true;
    this.render();
  }

  setZoom() {
    this.map.setZoom(this.panel.initialZoom);
  }

  toggleLegend() {
    if (!this.panel.showLegend) {
      this.map.removeLegend();
    }
    this.render();
  }

  toggleStickyLabels() {
    this.map.clearCircles();
    this.render();
  }

  changeThresholds() {
    this.updateThresholdData();
    this.map.legend.update();
    this.render();
  }

  // eslint class-methods-use-this: 0
  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }

}

WorldmapCtrl.templateUrl = 'partials/module.html';
