//import { isEqual, reduce, filter, transform, isObject } from 'lodash';

class DataFormatter {

  getValues(series) {
    if (!series || series.length === 0)
      return {}

    let seriesType = this._getSeriesType(series);

    return ('table'===seriesType) ? this._getSeries(series) : this._getSeriesTimeSeries(series)
  }

  _getSeries(series) {
    let hashSeriesByLayerByKey = {};
    let seriesLayer = null;
    let id = null;

    series.forEach((series_elem) => {

      let columns = series_elem.columns.map((elem)=>elem.text);

      series_elem.rows.forEach((series_elem_row) => {
        seriesLayer = series_elem_row[series_elem_row.length-1]

        if (!(hashSeriesByLayerByKey[seriesLayer])) {
          hashSeriesByLayerByKey[seriesLayer] = {};    
        }

        id = series_elem_row[1]
        if (!(hashSeriesByLayerByKey[seriesLayer][id])) {
          hashSeriesByLayerByKey[seriesLayer][id] = [];
        }
        
        let hashWithValues = {}
        columns.forEach((elem, i)=>{ 
          if(i!==0 && i!==columns.length-1) //do not insert grafana field 'time' and the group by field
            hashWithValues[elem] = series_elem_row[i] 
        });
        hashSeriesByLayerByKey[seriesLayer][id].push(hashWithValues);
      });
    });

    return hashSeriesByLayerByKey;
  }

  _getSeriesTimeSeries(series) {
    let setSeries = {};
    let setSeriesByLayer = {}

    series.forEach((series_elem) => {
      let [seriesLayer, seriesFieldName] = series_elem.target.split(': ');
   
      if (!(setSeriesByLayer[seriesLayer])) {
        setSeriesByLayer[seriesLayer] = [];        
      }

      setSeriesByLayer[seriesLayer].push([seriesFieldName, ...series_elem.datapoints.map((elem)=>elem[0])])
    });


    // get one array and transform into a hash
    let hashSeriesByLayerByKey = {};

    Object.keys(setSeriesByLayer).forEach((layerName)=>{
      if (!hashSeriesByLayerByKey[layerName])
        hashSeriesByLayerByKey[layerName] = {};  

      let superArray = setSeriesByLayer[layerName]
      
      for(let column=1; column<superArray[0].length; column++) {
        let result = {}
        for(let line=0; line<superArray.length; line++) {
          result[superArray[line][0]] = superArray[line][column]
        }

        if(!hashSeriesByLayerByKey[layerName][result.id])
          hashSeriesByLayerByKey[layerName][result.id] = []

        hashSeriesByLayerByKey[layerName][result.id].push(result)
      } 
    })

    return hashSeriesByLayerByKey;
  }

  _getSeriesType(series) {
    return series[0].type;
  }
}

export { DataFormatter }
