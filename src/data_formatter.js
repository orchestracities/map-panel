// import _ from 'lodash';
// import decodeGeoHash from './geohash';
const allowedTypes = ['TrafficFlowObserved', 'AirQualityObserved'];

export default class DataFormatter {
  constructor(ctrl, kbn) {
    this.ctrl = ctrl;
    this.kbn = kbn;
  }

  validateJSON(data){
    try {
      JSON.parse(data);
    } catch (e) {
      return false;
    }
    return true;
  }

  setValues(data) {
    const setSeries = {};
    let serieType;
    let pollutantsAux;

    if (this.ctrl.series && this.ctrl.series.length > 0) {
      this.ctrl.series.forEach((serie) => {
        serieType = serie.id.split(':')[0];

        if (allowedTypes.indexOf(serieType) === -1) {
          throw new Error('Please make sure you group series by type (AirQualityObserved or TrafficFlowObserved)');
        }
        const serieName = serie.alias.split(': ')[1];

        // VERIFY HERE ALL TYPES RECEIVED
        if (!(setSeries[serieName])) {
          setSeries[serieName] = [];
        }

        serie.datapoints.forEach((datapoint) => {
          const datapointValue = parseFloat(datapoint[0]);
          const valueAndType = {'value': datapointValue, 'type': serieType};
          setSeries[serieName].push(valueAndType);
        });
      });

      const latitudes = setSeries.latitude;
      const longitudes = setSeries.longitude;
      const values = setSeries.value;
      const ids = setSeries.id;
      const times = setSeries.created_at;

      if (!(latitudes) || !(longitudes) || !(values) || !(ids) || !(times)){
        throw new Error("Please make sure you selected Raw Data for latitude, longitude, value, id and created_at series");
      }

      setSeries.pollutants = [];
      pollutantsAux = [];

      // console.log(this.validateJSON(this.ctrl.panel.pollutants));
      if (!(this.validateJSON(this.ctrl.panel.pollutants))) {
        throw new Error("Please insert a valid JSON in the Available Pollutants field");
      } else {
        const polls = JSON.parse(this.ctrl.panel.pollutants);

        Object.keys(polls).forEach(key => {
          const currentPoll = polls[key];

          if (setSeries[key]) {
            const receivedPoll = [];
            setSeries[key].forEach((poll) => {
              receivedPoll.push(poll);
            });

            pollutantsAux.push({'name': key, 'value': receivedPoll});
            delete setSeries[currentPoll.name];
          }
        });
      }

      latitudes.forEach((value, index) => {
        let dataValue;

        if (value.type === 'AirQualityObserved') {
          const thisPollutants = [];
          pollutantsAux.forEach((pollAux) => {
            if (pollAux.name && pollAux.value[index]){
              thisPollutants.push({'name': pollAux.name, 'value': pollAux.value[index].value});
            }
          });
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
}
