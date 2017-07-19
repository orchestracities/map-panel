/* eslint import/no-extraneous-dependencies: 0 */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';

import _ from 'lodash';
import mapRenderer from './map_renderer';
import DataFormatter from './data_formatter';
import './css/worldmap-panel.css!';

const panelDefaults = {
  maxDataPoints: 1,
  mapCenter: '(0°, 0°)',
  mapCenterLatitude: 0,
  mapCenterLongitude: 0,
  initialZoom: 1,
  valueName: 'total',
  circleMinSize: 2,
  circleMaxSize: 30,
  thresholds: '0,10',
  colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
  unitSingle: '',
  unitPlural: '',
  showLegend: true,
  esMetric: 'Count',
  decimals: 0,
  hideEmpty: false,
  hideZero: false,
  stickyLabels: false,
  pollutants: {
    'h': {'name': 'Hydrogen', 'unit': ''},
    'no2': {'name': 'Nitrogen Dioxide', 'unit': 'µg/m3'},
    'p': {'name': 'Pressure', 'unit': 'hPa'},
    'pm10': {'name': 'PM10', 'unit': 'ug/m3'},
    'pm25': {'name': 'PM25', 'unit': 'ug/m3'},
    't': {'name': 'Temperature', 'unit': 'ºC'},
    'aqi': {'name': 'Air Quality Index', 'unit': ''}
  }
};

const mapCenters = {
  '(0°, 0°)': {mapCenterLatitude: 0.0, mapCenterLongitude: 0.0},
  'North America': {mapCenterLatitude: 40, mapCenterLongitude: -100},
  'Europe': {mapCenterLatitude: 46, mapCenterLongitude: 14},
  'West Asia': {mapCenterLatitude: 26, mapCenterLongitude: 53},
  'SE Asia': {mapCenterLatitude: 10, mapCenterLongitude: 106}
};

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
    if (this.tileServer === 'CartoDB Dark') {
      this.saturationClass = 'map-darken';
    } else {
      this.saturationClass = '';
    }
  }

  // loadLocationDataFromFile(reload) {
  //   if (this.map && !reload) return;

  //   if (this.panel.snapshotLocationData) {
  //     this.locations = this.panel.snapshotLocationData;
  //     return;
  //   }

  //   if (this.panel.locationData === 'jsonp endpoint') {
  //     if (!this.panel.jsonpUrl || !this.panel.jsonpCallback) return;

  //     window.$.ajax({
  //       type: 'GET',
  //       url: this.panel.jsonpUrl + '?callback=?',
  //       contentType: 'application/json',
  //       jsonpCallback: this.panel.jsonpCallback,
  //       dataType: 'jsonp',
  //       success: (res) => {
  //         this.locations = res;
  //         this.render();
  //       }
  //     });
  //   } else if (this.panel.locationData === 'json endpoint') {
  //     if (!this.panel.jsonUrl) return;

  //     window.$.getJSON(this.panel.jsonUrl).then((res) => {
  //       this.locations = res;
  //       this.render();
  //     });
  //   } else if (this.panel.locationData === 'table') {
  //     // .. Do nothing
  //   } else if (this.panel.locationData !== 'geohash') {
  //     window.$.getJSON('public/plugins/grafana-worldmap-panel/data/' + this.panel.locationData + '.json')
  //       .then(this.reloadLocations.bind(this));
  //   }
  // }

  // reloadLocations(res) {
  //   this.locations = res;
  //   this.refresh();
  // }

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
    console.log(this.panel.initialZoom);
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

/* eslint class-methods-use-this: 0 */
  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }
}

WorldmapCtrl.templateUrl = 'module.html';
