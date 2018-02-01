'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, allowedTypes, DataFormatter;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [],
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

      allowedTypes = ['TrafficFlowObserved', 'AirQualityObserved'];

      DataFormatter = function () {
        function DataFormatter(ctrl, kbn) {
          _classCallCheck(this, DataFormatter);

          this.ctrl = ctrl;
          this.kbn = kbn;
        }

        _createClass(DataFormatter, [{
          key: 'validateJSON',
          value: function validateJSON(data) {
            try {
              JSON.parse(data);
            } catch (e) {
              return false;
            }
            return true;
          }
        }, {
          key: 'setValues',
          value: function setValues(data) {
            var _this = this;

            var setSeries = {};
            var serieType = void 0;
            var pollutantsAux = void 0;

            if (this.ctrl.series && this.ctrl.series.length > 0) {
              this.ctrl.series.forEach(function (serie) {
                serieType = serie.id.split(':')[0];

                if (allowedTypes.indexOf(serieType) === -1) {
                  throw new Error('Please make sure you group series by type (AirQualityObserved or TrafficFlowObserved)');
                }
                var serieName = serie.alias.split(': ')[1];

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
              var latitudes = setSeries.latitude;
              var longitudes = setSeries.longitude;
              var values = setSeries.value;
              var ids = setSeries.id;
              var times = setSeries.created_at;

              if (!latitudes || !longitudes || !values || !ids || !times) {
                throw new Error("Please make sure you selected Raw Data for latitude, longitude, value, id and created_at series");
              }

              setSeries.pollutants = [];
              pollutantsAux = {};

              // console.log(this.validateJSON(this.ctrl.panel.pollutants));
              if (!this.validateJSON(this.ctrl.panel.pollutants)) {
                throw new Error("Please insert a valid JSON in the Available Pollutants field");
              } else {
                var polls = JSON.parse(this.ctrl.panel.pollutants);

                Object.keys(polls).forEach(function (key) {
                  var currentPoll = polls[key];

                  if (setSeries[key]) {
                    // const receivedPoll = [];
                    setSeries[key].forEach(function (poll) {

                      var keyString = key.toString();
                      var keyId = poll.id.toString();
                      var newKey = keyString + keyId;
                      if (!pollutantsAux[newKey]) {
                        pollutantsAux[newKey] = {
                          'value': poll.value
                        };
                      }
                    });
                    delete setSeries[currentPoll.name];
                  }
                });
              }
              latitudes.forEach(function (value, index) {
                var dataValue = void 0;
                if (value.type === 'AirQualityObserved') {
                  var thisPollutants = [];

                  var _polls = JSON.parse(_this.ctrl.panel.pollutants);
                  Object.keys(_polls).forEach(function (key) {
                    var getPollutant = key.toString() + value.id.toString();

                    if (pollutantsAux[getPollutant]) {
                      thisPollutants.push({ 'name': key, 'value': pollutantsAux[getPollutant].value });
                    }
                  });
                  // pollutantsAux.forEach((pollAux) => {
                  // if (pollAux.name && pollAux.value[index]){

                  // }
                  // });
                  dataValue = {
                    locationLatitude: value.value,
                    locationLongitude: longitudes[index].value,
                    value: values[index].value,
                    type: values[index].type,
                    pollutants: thisPollutants,
                    id: ids[index].value,
                    time: times[index].value
                  };
                } else if (value.type === 'TrafficFlowObserved') {
                  dataValue = {
                    locationLatitude: value.value,
                    locationLongitude: longitudes[index].value,
                    value: values[index].value,
                    type: values[index].type,
                    id: ids[index].value,
                    time: times[index].value
                  };
                }
                data.push(dataValue);
              });
            }
          }
        }]);

        return DataFormatter;
      }();

      _export('default', DataFormatter);
    }
  };
});
//# sourceMappingURL=data_formatter.js.map
