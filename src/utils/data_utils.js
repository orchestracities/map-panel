// import { isEqual, reduce, filter, transform, isObject } from 'lodash';

class DataFormatter {
  getValues(series) {
    if (!series || series.length === 0) return {};

    const seriesType = this._getSeriesType(series);

    return (seriesType === 'table') ? this._getSeries(series) : this._getSeriesTimeSeries(series);
  }


  isJson(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
  }

  fixType(item) {
    if (this.isJson(item)) {
      return JSON.parse(item);
    } else {
      return item;
    }
  }

  _getSeries(series) {
    const hashSeriesByLayerByKey = {};
    let seriesLayer = null;
    let id = null;

    series.forEach((series_elem) => {
      const columns = series_elem.columns.map((elem) => elem.text);
      var type_index = columns.length - 1;
      var id_index = 1;

      if(columns.indexOf("type") < 0){
        console.warn("Missing type alias in the query (required to define layers)");
      } else {
        type_index = columns.indexOf("type");
      }

      if(columns.indexOf("id") < 0 ){
        console.warn("Missing id alias in the query");
      } else {
        id_index = columns.indexOf("id");
      }

      series_elem.rows.forEach((series_elem_row) => {
        seriesLayer = series_elem_row[type_index];

        if (!(hashSeriesByLayerByKey[seriesLayer])) {
          hashSeriesByLayerByKey[seriesLayer] = {};
        }

        id = series_elem_row[id_index];
        if (!(hashSeriesByLayerByKey[seriesLayer][id])) {
          hashSeriesByLayerByKey[seriesLayer][id] = [];
        }

        const hashWithValues = {};
        columns.forEach((elem, i) => {
          if (i !== columns.indexOf("time") && i !== columns.length - 1) // do not insert grafana field 'time' and the group by field
          { hashWithValues[elem] = this.fixType(series_elem_row[i]); }
        });
        hashSeriesByLayerByKey[seriesLayer][id].push(hashWithValues);
      });
    });

    return hashSeriesByLayerByKey;
  }

  _getSeriesTimeSeries(series) {
    const setSeries = {};
    const setSeriesByLayer = {};

    series.forEach((series_elem) => {
      const [seriesLayer, seriesFieldName] = series_elem.target.split(': ');

      if (!(setSeriesByLayer[seriesLayer])) {
        setSeriesByLayer[seriesLayer] = [];
      }

      setSeriesByLayer[seriesLayer].push([seriesFieldName, ...series_elem.datapoints.map((elem) => elem[0])]);
    });


    // get one array and transform into a hash
    const hashSeriesByLayerByKey = {};

    Object.keys(setSeriesByLayer).forEach((layerName) => {
      if (!hashSeriesByLayerByKey[layerName]) hashSeriesByLayerByKey[layerName] = {};

      const superArray = setSeriesByLayer[layerName];

      for (let column = 1; column < superArray[0].length; column++) {
        const result = {};
        for (let line = 0; line < superArray.length; line++) {
          result[superArray[line][0]] = superArray[line][column];
        }

        if (!hashSeriesByLayerByKey[layerName][result.id]) hashSeriesByLayerByKey[layerName][result.id] = [];

        hashSeriesByLayerByKey[layerName][result.id].push(result);
      }
    });

    return hashSeriesByLayerByKey;
  }

  _getSeriesType(series) {
    return series[0].type;
  }
}

export { DataFormatter };
