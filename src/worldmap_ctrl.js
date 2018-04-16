/* eslint import/no-extraneous-dependencies: 0 */

/* GRafana Specific */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
/* Vendor specific */
import _ from 'lodash';
/* App specific */
import { panelDefaults, mapCenters } from './definitions'
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';
import './css/worldmap-panel.css!';
import './vendor/leaflet/leaflet.css!';

export default class WorldmapCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);

    this.setMapProvider(contextSrv);
    _.defaults(this.panel, panelDefaults);

    this.dataFormatter = new DataFormatter(this, kbn);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    // this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    // this.events.on('data-snapshot-load', this.onDataSnapshotLoad.bind(this));

    // this.loadLocationDataFromFile();
  }

  setMapProvider(contextSrv) {
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.setMapSaturationClass();
  }

  setMapSaturationClass() {
    this.saturationClass = this.tileServer === 'CartoDB Dark' ? 'map-darken' : '';    
  }

  onPanelTeardown() {
    if (this.map) this.map.remove();
  }

  onInitEditMode() {
    this.addEditorTab('Worldmap', 'public/plugins/grafana-traffic-env-panel/partials/editor.html', 2);
  }

  onDataReceived(dataList) {
    if (!dataList) return;

    if (this.dashboard.snapshot && this.locations) {
      this.panel.snapshotLocationData = this.locations;
    }

    const data = [];
    this.series = dataList.map(this.seriesHandler.bind(this));
    this.dataFormatter.setValues(data);
    this.data = data;
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

  setPollutants() {
    console.log("SET POLL");
  }

  // eslint class-methods-use-this: 0
  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }

}

WorldmapCtrl.templateUrl = 'partials/module.html';
