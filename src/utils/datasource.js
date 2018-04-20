  function getDatasources(targets) {
    return targets.map(elem=>{return { "name": elem.datasource } })

    //, "pollutants": "{'t': {'name': 'Temperature', 'unit': 'ºC'} }"
/*    let datasources={}
    for(let ds of targets.map(elem=>elem.datasource))
      datasources[ds] = {}

    return datasources*/
  }

  function getValidDatasources(targets) {
    return targets.filter(elem=>elem.metricAggs.filter(elem=>elem.alias==="latitude"||elem.alias==="longitude")).map(elem=>elem.datasource)
  }


  

  export { 
    getDatasources, getValidDatasources
  }