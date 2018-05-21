'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sdk = require('app/plugins/sdk');

var _time_series = require('app/core/time_series2');

var _time_series2 = _interopRequireDefault(_time_series);

var _kbn = require('app/core/utils/kbn');

var _kbn2 = _interopRequireDefault(_kbn);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _definitions = require('./definitions');

var _datasource = require('./utils/datasource');

var _map_utils = require('./utils/map_utils');

var _map_renderer = require('./map_renderer');

var _map_renderer2 = _interopRequireDefault(_map_renderer);

var _data_formatter = require('./utils/data_formatter');

var _data_formatter2 = _interopRequireDefault(_data_formatter);

require('./css/worldmap-panel.css!');

require('./vendor/leaflet/leaflet.css!');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint import/no-extraneous-dependencies: 0 */

/* Grafana Specific */

/* Vendor specific */

/* App specific */


var dataFormatter = new _data_formatter2.default();

var WorldmapCtrl = function (_MetricsPanelCtrl) {
  _inherits(WorldmapCtrl, _MetricsPanelCtrl);

  function WorldmapCtrl($scope, $injector, contextSrv) {
    _classCallCheck(this, WorldmapCtrl);

    var _this = _possibleConstructorReturn(this, (WorldmapCtrl.__proto__ || Object.getPrototypeOf(WorldmapCtrl)).call(this, $scope, $injector));

    _this.setMapProvider(contextSrv);
    _lodash2.default.defaultsDeep(_this.panel, _definitions.PANEL_DEFAULTS);

    //helper vars definitions to be used in editor
    _this.mapLocationsLabels = [].concat(_toConsumableArray(Object.keys(_definitions.MAP_LOCATIONS)), ['cityenv', 'custom']);
    _this.iconTypes = _definitions.ICON_TYPES;
    _this.defaultMetrics = _definitions.DEFAULT_METRICS;
    _this.markerColors = _definitions.MARKER_COLORS;

    //bind grafana events
    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
    _this.events.on('data-error', _this.onDataError.bind(_this));
    _this.events.on('data-received', _this.onDataReceived.bind(_this)); //process resultset as a result of the execution of all queries
    _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));
    _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));

    //bind specific editor events
    _this.handleClickAddMetric = _this.addMetric.bind(_this);
    _this.handleRemoveMetric = _this.removeMetric.bind(_this);
    return _this;
  }

  //adds a empty line in order to allow adding new metric in editor


  _createClass(WorldmapCtrl, [{
    key: 'addMetric',
    value: function addMetric() {
      this.panel.metrics.push(['', '', '']);
    }
    //removes specific metric in editor

  }, {
    key: 'removeMetric',
    value: function removeMetric(index) {
      this.panel.metrics.splice(index, 1);
      this.refresh();
    }
    //process the event of clicking the Worldmap Tab

  }, {
    key: 'onInitEditMode',
    value: function onInitEditMode() {
      this.addEditorTab('Worldmap', _definitions.PLUGIN_PATH + 'partials/editor.html', 2);
    }

    /* 
    * Process the resultset
    * @dataList: The resultset from the executed query 
    */

  }, {
    key: 'onDataReceived',
    value: function onDataReceived(dataList) {
      if (!dataList || dataList.length == 0) {
        console.debug('no data');
        return; //no result sets  
      }
      console.debug('dataList:');
      console.debug(dataList);

      if (this.dashboard.snapshot && this.locations) {
        this.panel.snapshotLocationData = this.locations;
      }

      this.layerNames = [].concat(_toConsumableArray(new Set(dataList.map(function (elem) {
        return elem.target.split(':')[0];
      }))));
      this.data = dataFormatter.getValues(dataList, this.panel.metrics);

      console.debug('data >');
      console.debug(this.data);

      this.render();
    }
  }, {
    key: 'onDataError',
    value: function onDataError(error) {
      if (error && error.data && error.data.error) {
        console.warn('Error: ');
        console.warn(error.data.error.message);
        throw new Error('Please verify your setting. No values Returned.' + error.data.error.message);
      }
      this.onDataReceived([]);
    }
  }, {
    key: 'onPanelTeardown',
    value: function onPanelTeardown() {
      if (this.worldMap) {
        console.debug('Cleaning map');
        this.worldMap.map.remove();
      }
    }
  }, {
    key: 'setMapProvider',
    value: function setMapProvider(contextSrv) {
      this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
      this.saturationClass = this.tileServer === 'CartoDB Dark' ? 'map-darken' : '';
    }
  }, {
    key: 'setNewMapCenter',
    value: function setNewMapCenter() {
      var _this2 = this;

      if (this.panel.mapCenter === 'cityenv') {
        // && this.isADiferentCity()
        this.setNewCoords().then(function () {
          return _this2.render();
        }).catch(function (error) {
          return console.log(error);
        });

        return;
      }

      if (this.panel.mapCenter !== 'custom') {
        // center at continent or area
        console.info('centering !== custom');
        this.panel.mapCenterLatitude = _definitions.MAP_LOCATIONS[this.panel.mapCenter].mapCenterLatitude;
        this.panel.mapCenterLongitude = _definitions.MAP_LOCATIONS[this.panel.mapCenter].mapCenterLongitude;
      }

      this.mapCenterMoved = true;
      this.render();
    }
  }, {
    key: 'isADiferentCity',
    value: function isADiferentCity() {
      return (0, _map_utils.getSelectedCity)(this.templateSrv.variables) !== this.panel.city;
    }
  }, {
    key: 'setNewCoords',
    value: function setNewCoords() {
      var _this3 = this;

      var city = (0, _map_utils.getSelectedCity)(this.templateSrv.variables);

      return (0, _map_utils.getCityCoordinates)(city).then(function (coordinates) {
        _this3.panel.city = city;
        _this3.panel.mapCenterLatitude = coordinates.latitude;
        _this3.panel.mapCenterLongitude = coordinates.longitude;
      });
    }
  }, {
    key: 'setZoom',
    value: function setZoom() {
      this.worldMap.setZoom(this.panel.initialZoom);
    }
  }, {
    key: 'toggleLegend',
    value: function toggleLegend() {
      if (!this.panel.showLegend) {
        this.worldMap.removeLegend();
      }
      this.render();
    }
  }, {
    key: 'toggleStickyLabels',
    value: function toggleStickyLabels() {
      this.worldMap.clearLayers();
      this.render();
    }
  }, {
    key: 'changeThresholds',
    value: function changeThresholds() {
      this.updateThresholdData();
      this.worldMap.legend.update();
      this.render();
    }

    // eslint class-methods-use-this: 0

  }, {
    key: 'link',
    value: function link(scope, elem, attrs, ctrl) {
      (0, _map_renderer2.default)(scope, elem, attrs, ctrl);
    }
  }]);

  return WorldmapCtrl;
}(_sdk.MetricsPanelCtrl);

exports.default = WorldmapCtrl;


WorldmapCtrl.templateUrl = 'partials/module.html';
//# sourceMappingURL=worldmap_ctrl.js.map
