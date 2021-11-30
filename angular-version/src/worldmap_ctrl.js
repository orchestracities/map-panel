/* eslint import/no-extraneous-dependencies: 0 */

/* Grafana Specific */
import {MetricsPanelCtrl} from 'app/plugins/sdk';
import TimeSeries from 'app/core/time_series2';
import kbn from 'app/core/utils/kbn';
/* Vendor specific */
import { defaultsDeep } from 'lodash';
/* App specific */
import {
  PLUGIN_PATH, PANEL_DEFAULTS, DEFAULT_METRICS, MAP_LOCATIONS, ICON_TYPES, MARKER_COLORS, COLOR_TYPES, CLUSTER_TYPES
} from './definitions';
import { getDatasources, getValidDatasources } from './utils/datasource';

import { getCityCoordinates, getSelectedCity, geolocationOptions } from './utils/map_utils';

import mapRenderer from './map_renderer';
import { DataFormatter, dataRecievedIsTheSame } from './utils/data_utils';

import './css/worldmap-panel.css!';
import './vendor/leaflet/leaflet.css!';

const dataFormatter = new DataFormatter();

export default class WorldmapCtrl extends MetricsPanelCtrl {
  constructor($scope, $injector, contextSrv) {
    super($scope, $injector);
    this.setMapProvider(contextSrv);
    defaultsDeep(this.panel, PANEL_DEFAULTS);

    // helper vars definitions to be used in editor
    this.mapLocationsLabels = [...Object.keys(MAP_LOCATIONS), 'Location Variable', 'Custom', 'User Geolocation'];
    this.iconTypes = ICON_TYPES;
    this.defaultMetrics = DEFAULT_METRICS;
    this.colorTypes = COLOR_TYPES;
    this.clusterTypes = CLUSTER_TYPES;
    this.markerColors = MARKER_COLORS;
    //this.environmentVars = this.templateSrv.variables.map((elem) => elem.name);

    //this.variables = this.templateSrv.variables;
    //this.variableSrv = variableSrv;
    // bind grafana events
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this)); // process resultset as a result of the execution of all queries
    this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));

    // bind specific editor events
    this.handleClickAddMetric = this.addMetric.bind(this);
    this.handleRemoveMetric = this.removeMetric.bind(this);
  }

  // adds a empty line in order to allow adding new metric in editor
  addMetric() {
    this.panel.metrics.push(['', '', '']);
  }

  // removes specific metric in editor
  removeMetric(index) {
    this.panel.metrics.splice(index, 1);
    this.refresh();
  }

  // process the event of clicking the Worldmap Tab
  onInitEditMode() {
    this.addEditorTab('Worldmap', `${PLUGIN_PATH}partials/editor.html`, 2);
  }

  /*
  * Process the resultset
  * @dataList: The resultset from the executed query
  */
  onDataReceived(dataList) {
    // console.debug('dataList:')
    // console.debug(dataList)

    if (this.dashboard.snapshot && this.locations) {
      this.panel.snapshotLocationData = this.locations;
    }

    if (!dataList) {
      console.debug('No dataList recieved but continuing...');
      return;
    }
    if (dataList.length === 0) {
      console.debug('Empty dataList. returning...');
      return;
    }

    this.data = dataFormatter.getValues(dataList);// , this.panel.metrics);
    this.layerNames = Object.keys(this.data);
    this.render();
  }

  onDataError(error) {
    if (error && error.data && error.data.error) {
      console.warn('Error: ' + error.data.error.message);
    }
    this.onDataReceived([]);
  }

  onPanelTeardown() {
    if (this.worldMap) {
      // console.debug('Cleaning map')
      this.worldMap.map.remove();
    }
  }

  setMapProvider(contextSrv) {
    this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
    this.saturationClass = this.tileServer === 'CartoDB Dark' ? 'map-darken' : '';
  }

  setLocationByUserGeolocation(render = false) {
    console.log('User Geolocation');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = position.coords;
          this.recenterMap(coordinates);
          if (render) this.render();
        },
        (error) => console.log('Unable to get location!'),
        geolocationOptions
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }

  // var watchID = navigator.geolocation.watchPosition
  // navigator.geolocation.clearWatch(watchID)
  setNewMapCenter() {
    console.debug(this.panel.mapCenter);
    if (this.panel.mapCenter === 'User Geolocation') {
      this.setLocationByUserGeolocation(true);
    } else
    /* if (this.panel.mapCenter === 'Location Variable') { // && this.isADiferentCity()
      this.setNewCoords();
    } else */
    if (this.panel.mapCenter === 'Custom') {
      this.mapCenterMoved = true;
      this.render();
    } else { // center at continent or area
      // console.info('centering at City/Continent location')
      const coordinates = {latitude: MAP_LOCATIONS[this.panel.mapCenter].mapCenterLatitude, longitude: MAP_LOCATIONS[this.panel.mapCenter].mapCenterLongitude};
      this.recenterMap(coordinates);
      this.render();
    }
  }

  /*isADiferentCity() {
    return (getSelectedCity(this.templateSrv.variables, this.panel.cityEnvVariable) !== this.panel.city);
  }*/

  /*
    setNewCoords() {
    const city = getSelectedCity(this.templateSrv.variables, this.panel.cityEnvVariable);
    console.debug('selecting new city: ' + city);
    return getCityCoordinates(city)
      .then((coordinates) => {
        this.panel.city = city;
        if (coordinates) {
          this.recenterMap(coordinates);
          this.render();
        } else console.log('Coordinates not available for the selected location ' + city);
      })
      .catch((error) => console.warn(error));
  }
  */
  recenterMap(coordinates) {
    console.debug('recentering at new coordinates');
    // console.debug(coordinates)
    this.panel.mapCenterLatitude = coordinates.latitude;
    this.panel.mapCenterLongitude = coordinates.longitude;
    this.mapCenterMoved = true;
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
