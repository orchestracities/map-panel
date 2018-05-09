'use strict';

System.register(['app/plugins/sdk', 'app/core/time_series2', 'app/core/utils/kbn', 'lodash', './definitions', './utils/datasource', './utils/map_utils', './map_renderer', './utils/data_formatter', './css/worldmap-panel.css!', './vendor/leaflet/leaflet.css!'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, TimeSeries, kbn, _, PLUGIN_PATH, panelDefaults, mapCenters, ICON_TYPES, getDatasources, getValidDatasources, getCityCoordinates, getSelectedCity, mapRenderer, DataFormatter, _createClass, dataFormatter, WorldmapCtrl;

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_definitions) {
      PLUGIN_PATH = _definitions.PLUGIN_PATH;
      panelDefaults = _definitions.panelDefaults;
      mapCenters = _definitions.mapCenters;
      ICON_TYPES = _definitions.ICON_TYPES;
    }, function (_utilsDatasource) {
      getDatasources = _utilsDatasource.getDatasources;
      getValidDatasources = _utilsDatasource.getValidDatasources;
    }, function (_utilsMap_utils) {
      getCityCoordinates = _utilsMap_utils.getCityCoordinates;
      getSelectedCity = _utilsMap_utils.getSelectedCity;
    }, function (_map_renderer) {
      mapRenderer = _map_renderer.default;
    }, function (_utilsData_formatter) {
      DataFormatter = _utilsData_formatter.default;
    }, function (_cssWorldmapPanelCss) {}, function (_vendorLeafletLeafletCss) {}],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      dataFormatter = new DataFormatter();

      WorldmapCtrl = function (_MetricsPanelCtrl) {
        _inherits(WorldmapCtrl, _MetricsPanelCtrl);

        function WorldmapCtrl($scope, $injector, contextSrv) {
          _classCallCheck(this, WorldmapCtrl);

          var _this = _possibleConstructorReturn(this, (WorldmapCtrl.__proto__ || Object.getPrototypeOf(WorldmapCtrl)).call(this, $scope, $injector));

          _this.setMapProvider(contextSrv);
          console.info(_this.panel);
          _.defaultsDeep(_this.panel, panelDefaults);
          _this.iconTypes = ICON_TYPES;
          //this.mapCenterMoved=true;

          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('data-error', _this.onDataError.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this)); //process resultset as a result of the execution of all queries
          _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
          //this.handleDatasourceParamsChange = this.applyDatasourceParamsChange.bind(this)
          //this.handleMapLayerIconsChange = this.changeMapLayerIcons.bind(this)
          return _this;
        }

        _createClass(WorldmapCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Worldmap', PLUGIN_PATH + 'partials/editor.html', 2);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            if (!dataList) return; //no result sets
            if (this.dashboard.snapshot && this.locations) {
              this.panel.snapshotLocationData = this.locations;
            }
            this.layerNames = [].concat(_toConsumableArray(new Set(dataList.map(function (elem) {
              return elem.target.split(':')[0];
            }))));
            this.series = dataList.map(this.seriesHandler.bind(this));
            this.data = dataFormatter.getValues(this.series, this.panel.resources.airQualityObserved.pollutants);
            this.render();
          }
        }, {
          key: 'onDataError',
          value: function onDataError(error) {
            if (error && error.data && error.data.error) {
              console.warn('Error: ');
              console.warn(error.data.error.message);
            }
            this.onDataReceived([]);
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });

            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            return series;
          }
        }, {
          key: 'onPanelTeardown',
          value: function onPanelTeardown() {
            if (this.worldMap) this.worldMap.remove();
          }
        }, {
          key: 'setMapProvider',
          value: function setMapProvider(contextSrv) {
            this.tileServer = contextSrv.user.lightTheme ? 'CartoDB Positron' : 'CartoDB Dark';
            this.setMapSaturationClass();
          }
        }, {
          key: 'setMapSaturationClass',
          value: function setMapSaturationClass() {
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
              this.panel.mapCenterLatitude = mapCenters[this.panel.mapCenter].mapCenterLatitude;
              this.panel.mapCenterLongitude = mapCenters[this.panel.mapCenter].mapCenterLongitude;
            }

            this.mapCenterMoved = true;
            this.render();
          }
        }, {
          key: 'isADiferentCity',
          value: function isADiferentCity() {
            return getSelectedCity(this.templateSrv.variables) !== this.panel.city;
          }
        }, {
          key: 'setNewCoords',
          value: function setNewCoords() {
            var _this3 = this;

            var city = getSelectedCity(this.templateSrv.variables);

            return getCityCoordinates(city).then(function (coordinates) {
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
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            mapRenderer(scope, elem, attrs, ctrl);
          }
        }]);

        return WorldmapCtrl;
      }(MetricsPanelCtrl);

      _export('default', WorldmapCtrl);

      WorldmapCtrl.templateUrl = 'partials/module.html';
    }
  };
});
//# sourceMappingURL=worldmap_ctrl.js.map
