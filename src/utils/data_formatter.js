import _ from 'lodash';

export default class DataFormatter {

  getValues(series, panelDefaultPollutants) {
    if (!series || series.length ==0)
      return []

    let parsedPollutants = this.getSeries(series, panelDefaultPollutants)

    //processing only latitudes  
    return this.getDataValues(parsedPollutants, panelDefaultPollutants);
  }

  getSeries(series, panelDefaultPollutants) {
    let setSeries = {};
    let serieType;

    series.forEach((serie) => {
      serieType = serie.id.split(':')[0];
      
      const serieName = serie.alias.split(': ')[1];
      console.debug('serieType => '+serieType+', serieName => '+serieName)

      if (!(setSeries[serieName])) {
        setSeries[serieName] = [];
      }

      serie.datapoints.forEach((datapoint, index) => {
        const valueAndType = {
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

    if ( !(this.latitudes && this.longitudes && this.values && this.ids && this.times) ) {
      throw new Error("Please make sure you selected 'Raw' in the aggregation type. 'latitude', 'longitude', 'value', 'id', 'created_at' are mandatory. You must also group by expression in order to create map layers.");
    }

    let pollutants_ = {}
    //Try to process pollutants
    if(panelDefaultPollutants) {
      setSeries.pollutants = [];

      panelDefaultPollutants.forEach((pollutant) => {
        let key = pollutant[0]

        if (setSeries[key]) {
          setSeries[key].forEach((poll) => {
            const keyId = poll.id.toString();
            const newKey = key + keyId;
            if (!(pollutants_[newKey])) {
              pollutants_[newKey] = { 'value': poll.value };
            }
          });
//          delete setSeries[panelDefaultPollutants[0][0]];//?
        }
      });
    }

    return pollutants_;
  }

  getDataValues(parsedPollutants, panelDefaultPollutants) {
    let dataValues = []

    this.latitudes.forEach((value, index) => {
      try {
        let dataValue = {
              locationLatitude: value.value,
              locationLongitude: this.longitudes[index].value,
              value: this.values[index].value,
              type: this.values[index].type,
              id: this.ids[index].value,
              time: this.times[index].value,
            };

        let thisPollutants = [];

        panelDefaultPollutants.forEach((p) => {
          const pollutantKey = p[0] + value.id.toString();
          if (parsedPollutants[pollutantKey]) {
            thisPollutants.push({'name': p[0], 'value': parsedPollutants[pollutantKey].value});
          }
        });

        dataValue.pollutants = thisPollutants

        dataValues.push(dataValue);

      } catch (error) {
        console.log("Error:")
        console.log(error)
        console.log("Parsing a data value:")
        console.log(dataValue)
/*        throw new Error("Error parsing a data value");*/
      }
    });
    console.debug(dataValues)
    return dataValues;
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