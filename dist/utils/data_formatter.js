'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _createClass, DataFormatter;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  /*
  * Discard elements with value 0 or null
  * and hidden elements
  */
  function filterEmptyAndZeroValues(data, hideEmpty, hideZero) {
    return _.filter(data, function (o) {
      return !(hideEmpty && _.isNil(o.value)) && !(hideZero && o.value === 0);
    });
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
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

      DataFormatter = function () {
        function DataFormatter() {
          _classCallCheck(this, DataFormatter);
        }

        _createClass(DataFormatter, [{
          key: 'getValues',
          value: function getValues(series, panelDefaultPollutants) {
            if (!series || series.length == 0) return [];

            var parsedPollutants = this.getSeries(series, panelDefaultPollutants);

            //processing only latitudes  
            return this.getDataValues(parsedPollutants, panelDefaultPollutants);
          }
        }, {
          key: 'getSeries',
          value: function getSeries(series, panelDefaultPollutants) {
            var setSeries = {};
            var serieType = void 0;

            series.forEach(function (serie) {
              serieType = serie.id.split(':')[0];

              var serieName = serie.alias.split(': ')[1];
              console.debug('serieType => ' + serieType + ', serieName => ' + serieName);

              if (!setSeries[serieName]) {
                setSeries[serieName] = [];
              }

              serie.datapoints.forEach(function (datapoint, index) {
                var valueAndType = {
                  'id': index,
                  'type': serieType,
                  'value': parseFloat(datapoint[0])
                };

                setSeries[serieName].push(valueAndType);
              });
            });

            this.latitudes = setSeries.latitude;
            this.longitudes = setSeries.longitude;
            this.values = setSeries.value;
            this.ids = setSeries.id;
            this.times = setSeries.created_at;

            if (!(this.latitudes && this.longitudes && this.values && this.ids && this.times)) {
              throw new Error("Please make sure you selected 'Raw' in the aggregation type. 'latitude', 'longitude', 'value', 'id', 'created_at' are mandatory. You must also group by expression in order to create map layers.");
            }

            var pollutants_ = {};
            //Try to process pollutants
            if (panelDefaultPollutants) {
              setSeries.pollutants = [];

              panelDefaultPollutants.forEach(function (pollutant) {
                var key = pollutant[0];

                if (setSeries[key]) {
                  setSeries[key].forEach(function (poll) {
                    var keyId = poll.id.toString();
                    var newKey = key + keyId;
                    if (!pollutants_[newKey]) {
                      pollutants_[newKey] = { 'value': poll.value };
                    }
                  });
                  //          delete setSeries[panelDefaultPollutants[0][0]];//?
                }
              });
            }

            return pollutants_;
          }
        }, {
          key: 'getDataValues',
          value: function getDataValues(parsedPollutants, panelDefaultPollutants) {
            var _this = this;

            var dataValues = [];

            this.latitudes.forEach(function (value, index) {
              try {
                var _dataValue = {
                  locationLatitude: value.value,
                  locationLongitude: _this.longitudes[index].value,
                  value: _this.values[index].value,
                  type: _this.values[index].type,
                  id: _this.ids[index].value,
                  time: _this.times[index].value
                };

                var thisPollutants = [];

                panelDefaultPollutants.forEach(function (p) {
                  var pollutantKey = p[0] + value.id.toString();
                  if (parsedPollutants[pollutantKey]) {
                    thisPollutants.push({ 'name': p[0], 'value': parsedPollutants[pollutantKey].value });
                  }
                });

                _dataValue.pollutants = thisPollutants;

                dataValues.push(_dataValue);
              } catch (error) {
                console.log("Error:");
                console.log(error);
                console.log("Parsing a data value:");
                console.log(dataValue);
                /*        throw new Error("Error parsing a data value");*/
              }
            });
            console.debug(dataValues);
            return dataValues;
          }
        }]);

        return DataFormatter;
      }();

      _export('default', DataFormatter);

      _export('filterEmptyAndZeroValues', filterEmptyAndZeroValues);
    }
  };
});
//# sourceMappingURL=data_formatter.js.map
