import _ from 'lodash';

export default class DataFormatter {

  getValues(series, pollutants) {
    if (!series || series.length ==0)
      return []

    let s_ = this.getSeries(series, pollutants)

    //processing only latitudes  
    return this.getDataValues();
  }

  getSeries(series, pollutants) {
    let setSeries = {};
    let serieType;

    series.forEach((serie) => {
      serieType = serie.id.split(':')[0];
      
      // if (allowedTypes.indexOf(serieType) === -1) {
      //    console.log('Please make sure you group by your query');
      // }
      const serieName = serie.alias.split(': ')[1];
      //console.log('serieType => '+serieType+', serieName => '+serieName)
      // VERIFY HERE ALL TYPES RECEIVED
      if (!(setSeries[serieName])) {
        setSeries[serieName] = [];
      }

      serie.datapoints.forEach((datapoint, index) => {
        const datapointValue = parseFloat(datapoint[0]);
        const valueAndType = {'value': datapointValue, 'type': serieType, 'id': index};
        setSeries[serieName].push(valueAndType);
      });
    });

    this.latitudes = setSeries.latitude;
    this.longitudes = setSeries.longitude;
    this.values = setSeries.value;
    this.ids = setSeries.id;
    this.times = setSeries.created_at;


    if ( !(this.latitudes && this.longitudes && this.values && this.ids && this.times) ) {
      throw new Error("Please make sure you selected 'Raw' in the aggregation type for the mandatory fields 'latitude', 'longitude', 'value', 'id', 'created_at'. You must also group by expression in order to create map layers.");
    }

    //Try to process pollutants
    if(pollutants) {
      this.pollutantsAux = {};
      setSeries.pollutants = [];
      this.pollutants = JSON.parse(pollutants)

      // if (this.pollutants) {
        Object.keys(this.pollutants).forEach((key) => {
          const currentPoll = this.pollutants[key];

          if (setSeries[key]) {
            // const receivedPoll = [];
            setSeries[key].forEach((poll) => {     
              const keyString = key.toString();
              const keyId = poll.id.toString();
              const newKey = keyString + keyId;
              if (!(this.pollutantsAux[newKey])) {
                this.pollutantsAux[newKey] = { 'value': poll.value };
              }
            });
            delete setSeries[currentPoll.name];
          }
        });

      //} else {
      //  throw new Error("For each datasource target, please insert a valid JSON in the Available Pollutants field");
      //}
    }
    
    return setSeries;
  }

  getDataValues() {
    let response = []

    this.latitudes.forEach((value, index) => {
      try {
        let dataValue = {
              locationLatitude: value.value,
              locationLongitude: this.longitudes[index].value,
              value: this.values[index].value,
              type: this.values[index].type,
              id: this.ids[index].value,
              time: this.times[index].value
            };

        // if AQI, add also info about pollutants
        if (value.type === 'AirQualityObserved') {
          const thisPollutants = [];        

          Object.keys(this.pollutants).forEach((key) => {
            const getPollutant = key.toString() + value.id.toString();

            if (this.pollutantsAux[getPollutant]) {
              thisPollutants.push({'name': key, 'value': this.pollutantsAux[getPollutant].value});
            }
          });

          dataValue.pollutants = thisPollutants
        }

        response.push(dataValue);

      } catch (error) {
        console.log("Error:")
        console.log(error)
        console.log("Parsing a data value:")
        console.log(dataValue)
/*        throw new Error("Error parsing a data value");*/
      }
    });
    return response;
  }

}

/*
* Discard elements with value 0 or null
* and hidden elements
*/
function filterEmptyAndZeroValues(data, hideEmpty, hideZero) {
  return _.filter(data, (o) => { return !(hideEmpty && _.isNil(o.value)) && !(hideZero && o.value === 0) });
}

export { filterEmptyAndZeroValues }