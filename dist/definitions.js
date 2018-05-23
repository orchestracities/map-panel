'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var PLUGIN_PATH = 'public/plugins/grafana-traffic-env-panel/';

var AQI = {
  'range': [0, 50, 100, 150, 200, 300, 500],
  'meaning': ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
  'markerColor': ['green', 'beige', 'orange', 'red', 'darkred', 'purple'],
  'color': ['#00e400', '#fdca92', '#ff7e00', '#d41c32', '#7e0023', '#8f3f97'],
  'classColor': ['level-0', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6'],
  'risks': ['Air quality is considered satisfactory, and air pollution poses little or no risk.', 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', 'Health alert: everyone may experience more serious health effects.', 'Health warnings of emergency conditions. The entire population is more likely to be affected.']
};

var CARS_COUNT = {
  'range': [0, 15, 30, 45, 70, 85, 100],
  'color': ['#00e400', '#fdca92', '#ff7e00', '#d41c32', '#7e0023', '#8f3f97'],
  'markerColor': ['green', 'beige', 'orange', 'red', 'darkred', 'purple'],
  'classColor': ['level-0', 'level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6']
};

var MARKER_COLORS = ['red', 'blue', 'green', 'purple', 'orange', 'darkred', 'lightred', 'beige', 'darkblue', 'darkgreen', 'cadetblue', 'darkpurple', 'white', 'pink', 'lightblue', 'lightgreen', 'gray', 'black', 'lightgray'];

var DEFAULT_MARKER_COLORS_RANGE = {
  range: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180],
  markerColor: MARKER_COLORS
};

var TILE_SERVERS = {
  'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
  'CartoDB Dark': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' }
};

var ICON_TYPES = ['info-circle', 'question', 'clock-o', 'warning', 'car', 'bell', 'bell-slash', 'bicycle', 'bus', 'close', 'ban', 'tree', 'trash', 'truck', 'umbrella', 'volume-up'];

var PANEL_DEFAULTS = {
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

  metrics: [],
  targets: [{
    refId: "A",
    groupByAliases: ["type"],
    groupByColumns: ["entity_type"],
    whereClauses: [],
    metricAggs: [{ alias: "id", column: "entity_id", type: "raw" }, { alias: "value", column: "", type: "raw" }, { alias: "longitude", column: "longitude(location)", type: "raw" }, { alias: "latitude", column: "latitude(location)", type: "raw" }, { alias: "created_at", column: "time_index", type: "raw" }]
  }],
  layersIcons: {},
  layersColors: {},
  cityEnvVariable: '',
  renderChart: false
};

var DEFAULT_METRICS = {
  "aqi": { "name": "Air Quality Index", "unit": "" },
  "h": { "name": "Hydrogen", "unit": "" },
  "no2": { "name": "Nitrogen Dioxide", "unit": "µg/m3" },
  "p": { "name": "Pressure", "unit": "hPa" },
  "pm10": { "name": "PM10", "unit": "ug/m3" },
  "pm25": { "name": "PM25", "unit": "ug/m3" },
  "t": { "name": "Temperature", "unit": "ºC" },
  "co": { "name": "CO2", "unit": "" },
  "intensity": { "name": "Intensity", "unit": "" }
};

var MAP_LOCATIONS = {
  '(0°, 0°)': { mapCenterLatitude: 0.0, mapCenterLongitude: 0.0 },
  'North America': { mapCenterLatitude: 40, mapCenterLongitude: -100 },
  'Europe': { mapCenterLatitude: 46, mapCenterLongitude: 14 },
  'West Asia': { mapCenterLatitude: 26, mapCenterLongitude: 53 },
  'SE Asia': { mapCenterLatitude: 10, mapCenterLongitude: 106 }
};

var NOMINATIM_ADDRESS = 'https://nominatim.openstreetmap.org/search/<city_name>?format=json&addressdetails=1&limit=1&polygon_svg=1';

exports.PLUGIN_PATH = PLUGIN_PATH;
exports.PANEL_DEFAULTS = PANEL_DEFAULTS;
exports.NOMINATIM_ADDRESS = NOMINATIM_ADDRESS;
exports.TILE_SERVERS = TILE_SERVERS;
exports.AQI = AQI;
exports.CARS_COUNT = CARS_COUNT;
exports.DEFAULT_METRICS = DEFAULT_METRICS;
exports.MAP_LOCATIONS = MAP_LOCATIONS;
exports.ICON_TYPES = ICON_TYPES;
exports.MARKER_COLORS = MARKER_COLORS;
//# sourceMappingURL=definitions.js.map
