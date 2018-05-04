/* eslint import/no-extraneous-dependencies: 0 */

/* Grafana Specific */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
/* Vendor specific */
import _ from 'lodash';
/* App specific */
import { PLUGIN_PATH, panelDefaults, mapCenters, ICON_TYPES } from './definitions'
import { getDatasources, getValidDatasources } from './utils/datasource';

import { getCityCoordinates, getSelectedCity } from './utils/map_utils';

import mapRenderer from './map_renderer';
import DataFormatter from './utils/data_formatter';

import './css/worldmap-panel.css!';
import './vendor/leaflet/leaflet.css!';

let dataFormatter = new DataFormatter();

export default class WorldmapCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);
    this.setMapProvider(contextSrv);
    _.defaultsDeep(this.panel, panelDefaults);
    this.iconTypes = ICON_TYPES;
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));  //process resultset as a result of the execution of all queries
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    //this.handleDatasourceParamsChange = this.applyDatasourceParamsChange.bind(this)
    //this.handleMapLayerIconsChange = this.changeMapLayerIcons.bind(this)
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
    this.layerNames = [...new Set(dataList.map((elem)=>elem.target.split(':')[0]))]
    this.series = dataList.map(this.seriesHandler.bind(this));
    this.data = dataFormatter.getValues(this.series, this.panel.resources.airQualityObserved.pollutants);
    this.render();
  }

  onDataError(error) {    
    if(error && error.data && error.data.error) {
      console.log('Error: ')
      console.log(error.data.error.message)
    }
    this.onDataReceived([]);
  }

  // onDataSnapshotLoad(snapshotData) {
  //   this.onDataReceived(snapshotData);
  // }

  seriesHandler(seriesData) {
    const series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target,
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

/*  changeMapLayerIcons(mapLayer) {
    console.log('mapLayer')
    console.log(mapLayer)
    //this.panel.layersIcons[mapLayer]=mapLayer

    console.log('panel')

    console.log(this.panel.layersIcons)

    this.render()
  }*/

  onPanelTeardown() {
    if (this.worldMap) this.worldMap.remove();
  }

  setMapProvider(contextSrv) {
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.setMapSaturationClass();
  }

  setMapSaturationClass() {
    this.saturationClass = this.tileServer === 'CartoDB Dark' ? 'map-darken' : '';    
  }

  setNewMapCenter() {    
    if (this.panel.mapCenter === 'cityenv') {// && this.isADiferentCity()
      this.setNewCoords()
        .then(()=>this.render())
        .catch(error => console.log(error))

      return ;
    }

    if (this.panel.mapCenter !== 'custom') { // center in continent or area
      this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
      this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
    }

    this.mapCenterMoved = true;
    this.render();
  }

  isADiferentCity() {
    return getSelectedCity(this.templateSrv.variables) !== this.panel.city
  }

  setNewCoords() {
    let city = getSelectedCity(this.templateSrv.variables)
    
    return getCityCoordinates(city)
      .then(coordinates => {
        this.panel.city = city;
        this.panel.mapCenterLatitude = coordinates.latitude;
        this.panel.mapCenterLongitude = coordinates.longitude;
      })
  }

  setZoom() {
    this.worldMap.setZoom(this.panel.initialZoom);
  }

  toggleLegend() {
    if (!this.panel.showLegend) {
      this.worldMap.removeLegend();
    }
    this.render();
  }

  toggleStickyLabels() {
    this.worldMap.clearLayers();
    this.render();
  }

  changeThresholds() {
    this.updateThresholdData();
    this.worldMap.legend.update();
    this.render();
  }

  // eslint class-methods-use-this: 0
  link(scope, elem, attrs, ctrl) {
    mapRenderer(scope, elem, attrs, ctrl);
  }

}

WorldmapCtrl.templateUrl = 'partials/module.html';
