'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _createClass, DataFormatter;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

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
        function DataFormatter(kbn) {
          _classCallCheck(this, DataFormatter);

          this.kbn = kbn;
        }

        _createClass(DataFormatter, [{
          key: 'getValues',
          value: function getValues(series, pollutants) {
            if (!series || series.length == 0) return [];

            var s_ = this.getSeries(series, pollutants);
            console.log(s_);

            //processing only latitudes  
            return this.getDataValues();
          }
        }, {
          key: 'getSeries',
          value: function getSeries(series, pollutants) {
            var _this = this;

            var setSeries = {};
            var serieType = void 0;

            series.forEach(function (serie) {
              serieType = serie.id.split(':')[0];

              // if (allowedTypes.indexOf(serieType) === -1) {
              //    console.log('Please make sure you group by your query');
              // }
              var serieName = serie.alias.split(': ')[1];
              //      console.log('serieType => '+serieType+', serieName => '+serieName)
              // VERIFY HERE ALL TYPES RECEIVED
              if (!setSeries[serieName]) {
                setSeries[serieName] = [];
              }

              serie.datapoints.forEach(function (datapoint, index) {
                var datapointValue = parseFloat(datapoint[0]);
                var valueAndType = { 'value': datapointValue, 'type': serieType, 'id': index };
                setSeries[serieName].push(valueAndType);
              });
            });

            this.latitudes = setSeries.latitude;
            this.longitudes = setSeries.longitude;
            this.values = setSeries.value;
            this.ids = setSeries.id;
            this.times = setSeries.created_at;
            this.pollutantsAux = {};

            if (!(this.latitudes && this.longitudes && this.values && this.ids && this.times)) {
              throw new Error("Please make sure you selected Raw Data for latitude, longitude, value, id and created_at series");
            }

            setSeries.pollutants = [];

            this.pollutants = JSON.parse(pollutants);
            if (this.pollutants) {
              Object.keys(this.pollutants).forEach(function (key) {
                var currentPoll = _this.pollutants[key];

                if (setSeries[key]) {
                  // const receivedPoll = [];
                  setSeries[key].forEach(function (poll) {
                    var keyString = key.toString();
                    var keyId = poll.id.toString();
                    var newKey = keyString + keyId;
                    if (!_this.pollutantsAux[newKey]) {
                      _this.pollutantsAux[newKey] = { 'value': poll.value };
                    }
                  });
                  delete setSeries[currentPoll.name];
                }
              });
            } else {
              throw new Error("For each datasource target, please insert a valid JSON in the Available Pollutants field");
            }

            return setSeries;
          }
        }, {
          key: 'getDataValues',
          value: function getDataValues() {
            var _this2 = this;

            var response = [];

            this.latitudes.forEach(function (value, index) {
              try {
                var _dataValue = {
                  locationLatitude: value.value,
                  locationLongitude: _this2.longitudes[index].value,
                  value: _this2.values[index].value,
                  type: _this2.values[index].type,
                  id: _this2.ids[index].value,
                  time: _this2.times[index].value
                };

                // if AQI process add also info about pollutants
                if (value.type === 'AirQualityObserved') {
                  var thisPollutants = [];

                  Object.keys(_this2.pollutants).forEach(function (key) {
                    var getPollutant = key.toString() + value.id.toString();

                    if (_this2.pollutantsAux[getPollutant]) {
                      thisPollutants.push({ 'name': key, 'value': _this2.pollutantsAux[getPollutant].value });
                    }
                  });

                  _dataValue.pollutants = thisPollutants;
                }

                response.push(_dataValue);
              } catch (error) {
                console.log(dataValue);
                console.log(error);
                throw new Error("Error parsing a data value");
              }
            });
            return response;
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
