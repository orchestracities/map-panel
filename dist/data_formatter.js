'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, allowedPollutants, DataFormatter;

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

      allowedPollutants = ['h', 'no2', 'p', 'pm10', 'pm25', 't'];

      DataFormatter = function () {
        function DataFormatter(ctrl, kbn) {
          _classCallCheck(this, DataFormatter);

          this.ctrl = ctrl;
          this.kbn = kbn;
        }

        _createClass(DataFormatter, [{
          key: 'setValues',
          value: function setValues(data) {
            var setSeries = {};
            var serieType = void 0;
            var pollutantsAux = void 0;

            if (this.ctrl.series && this.ctrl.series.length > 0) {
              this.ctrl.series.forEach(function (serie) {
                // console.log(serie);
                serieType = serie.id.split(':')[0];
                var serieName = serie.alias.split(': ')[1];

                // VERIFY HERE ALL TYPES RECEIVED
                if (!setSeries[serieName]) {
                  setSeries[serieName] = [];
                }

                serie.datapoints.forEach(function (datapoint) {
                  var datapointValue = parseFloat(datapoint[0]);
                  var valueAndType = { 'value': datapointValue, 'type': serieType };
                  setSeries[serieName].push(valueAndType);
                });
              });

              var latitudes = setSeries.latitude;
              var longitudes = setSeries.longitude;
              var values = setSeries.value;

              setSeries.pollutants = [];
              pollutantsAux = [];

              allowedPollutants.forEach(function (pollutant) {
                if (setSeries[pollutant]) {
                  var receivedPoll = [];
                  setSeries[pollutant].forEach(function (poll) {
                    receivedPoll.push(poll);
                  });

                  pollutantsAux.push({ 'name': pollutant, 'value': receivedPoll });
                  delete setSeries[pollutant];
                }
              });

              latitudes.forEach(function (value, index) {
                var dataValue = void 0;

                if (value.type === 'environment') {
                  var thisPollutants = [];
                  pollutantsAux.forEach(function (pollAux) {
                    thisPollutants.push({ 'name': pollAux.name, 'value': pollAux.value[index].value });
                  });
                  dataValue = {
                    locationLatitude: value.value,
                    locationLongitude: longitudes[index].value,
                    value: values[index].value,
                    type: values[index].type,
                    pollutants: thisPollutants
                  };
                } else if (value.type === 'traffic') {
                  dataValue = {
                    locationLatitude: value.value,
                    locationLongitude: longitudes[index].value,
                    value: values[index].value,
                    type: values[index].type
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
