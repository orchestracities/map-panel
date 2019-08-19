"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataFormatter = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// import { isEqual, reduce, filter, transform, isObject } from 'lodash';
var DataFormatter =
/*#__PURE__*/
function () {
  function DataFormatter() {
    _classCallCheck(this, DataFormatter);
  }

  _createClass(DataFormatter, [{
    key: "getValues",
    value: function getValues(series) {
      if (!series || series.length === 0) return {};

      var seriesType = this._getSeriesType(series);

      return seriesType === 'table' ? this._getSeries(series) : this._getSeriesTimeSeries(series);
    }
  }, {
    key: "_getSeries",
    value: function _getSeries(series) {
      var hashSeriesByLayerByKey = {};
      var seriesLayer = null;
      var id = null;
      series.forEach(function (series_elem) {
        var columns = series_elem.columns.map(function (elem) {
          return elem.text;
        });
        var type_index = columns.length - 1;
        var id_index = 1;

        if (columns.indexOf("type") < 0) {
          console.warn("Missing type alias in the query (required to define layers)");
        } else {
          type_index = columns.indexOf("type");
        }

        if (columns.indexOf("id") < 0) {
          console.warn("Missing id alias in the query");
        } else {
          id_index = columns.indexOf("id");
        }

        series_elem.rows.forEach(function (series_elem_row) {
          seriesLayer = series_elem_row[type_index];

          if (!hashSeriesByLayerByKey[seriesLayer]) {
            hashSeriesByLayerByKey[seriesLayer] = {};
          }

          id = series_elem_row[id_index];

          if (!hashSeriesByLayerByKey[seriesLayer][id]) {
            hashSeriesByLayerByKey[seriesLayer][id] = [];
          }

          var hashWithValues = {};
          columns.forEach(function (elem, i) {
            if (i !== columns.indexOf("time") && i !== columns.length - 1) // do not insert grafana field 'time' and the group by field
              {
                hashWithValues[elem] = series_elem_row[i];
              }
          });
          hashSeriesByLayerByKey[seriesLayer][id].push(hashWithValues);
        });
      });
      return hashSeriesByLayerByKey;
    }
  }, {
    key: "_getSeriesTimeSeries",
    value: function _getSeriesTimeSeries(series) {
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
      }); // get one array and transform into a hash

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
  }, {
    key: "_getSeriesType",
    value: function _getSeriesType(series) {
      return series[0].type;
    }
  }]);

  return DataFormatter;
}();

exports.DataFormatter = DataFormatter;
//# sourceMappingURL=data_utils.js.map
