// import _ from 'lodash';
// import decodeGeoHash from './geohash';

const allowedPollutants = ['h', 'no2', 'p', 'pm10', 'pm25', 't'];
const allowedTypes = ['traffic', 'environment'];

export default class DataFormatter {
  constructor(ctrl, kbn) {
    this.ctrl = ctrl;
    this.kbn = kbn;
  }

  setValues(data) {
    const setSeries = {};
    let serieType;
    let pollutantsAux;

    if (this.ctrl.series && this.ctrl.series.length > 0) {
      this.ctrl.series.forEach((serie) => {

        serieType = serie.id.split(':')[0];
        
        if (allowedTypes.indexOf(serieType) === -1){
          throw new Error("Please make sure you group series by type (environment or traffic)");
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
      const times = setSeries.created_at

      if(!(latitudes) || !(longitudes) || !(values) || !(ids) || !(times)){
        throw new Error("Please make sure you selected Raw Data for latitude, longitude, value, id and created_at series");
      }

      setSeries.pollutants = [];
      pollutantsAux = [];

      allowedPollutants.forEach((pollutant) => {
        if (setSeries[pollutant]) {
          const receivedPoll = [];
          setSeries[pollutant].forEach((poll) => {
            receivedPoll.push(poll);
          });

          pollutantsAux.push({'name': pollutant, 'value': receivedPoll});
          delete setSeries[pollutant];
        }
      });

      latitudes.forEach((value, index) => {
        let dataValue;

        if (value.type === 'environment') {
          const thisPollutants = [];
          pollutantsAux.forEach((pollAux) => {
            thisPollutants.push({'name': pollAux.name, 'value': pollAux.value[index].value});
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
        } else if (value.type === 'traffic') {
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
