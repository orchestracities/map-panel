'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterEmptyAndZeroValues = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataFormatter = function () {
  function DataFormatter() {
    _classCallCheck(this, DataFormatter);
  }

  _createClass(DataFormatter, [{
    key: 'getValues',
    value: function getValues(series, panelDefaultMetrics) {
      if (!series || series.length == 0) return {};

      return this.getSeries(series, panelDefaultMetrics);
    }
  }, {
    key: 'getSeries',
    value: function getSeries(series, panelDefaultMetrics) {
      var setSeries = {};
      var setSeriesByLayer = {};

      series.forEach(function (series_elem) {
        var _series_elem$target$s = series_elem.target.split(': '),
            _series_elem$target$s2 = _slicedToArray(_series_elem$target$s, 2),
            seriesLayer = _series_elem$target$s2[0],
            seriesFieldName = _series_elem$target$s2[1];

        if (!setSeriesByLayer[seriesLayer]) {
          setSeriesByLayer[seriesLayer] = [];
        }

        setSeriesByLayer[seriesLayer].push([seriesFieldName].concat(_toConsumableArray(series_elem.datapoints.map(function (elem) {
          return elem[0];
        }))));
      });

      // get one array and transform into a hash
      var hashSeriesByLayerByKey = {};
      Object.keys(setSeriesByLayer).forEach(function (layerName) {
        if (!hashSeriesByLayerByKey[layerName]) hashSeriesByLayerByKey[layerName] = {};

        var superArray = setSeriesByLayer[layerName];

        for (var column = 1; column < superArray[0].length; column++) {
          var result = {};
          for (var line = 0; line < superArray.length; line++) {
            result[superArray[line][0]] = superArray[line][column];
          }

          if (!hashSeriesByLayerByKey[layerName][result.id]) hashSeriesByLayerByKey[layerName][result.id] = [];

          hashSeriesByLayerByKey[layerName][result.id].push(result);
        }
      });

      return hashSeriesByLayerByKey;
    }
  }]);

  return DataFormatter;
}();

/*
* Discard elements with value 0 or null
* and hidden elements
*/


exports.default = DataFormatter;
function filterEmptyAndZeroValues(data, hideEmpty, hideZero) {
  return _lodash2.default.filter(data, function (o) {
    return !(hideEmpty && _lodash2.default.isNil(o.value)) && !(hideZero && o.value === 0);
  });
}

exports.filterEmptyAndZeroValues = filterEmptyAndZeroValues;
//# sourceMappingURL=data_formatter.js.map
