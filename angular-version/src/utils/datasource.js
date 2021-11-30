function getDatasources(targets) {
  return targets.map((elem) => { return { 'name': elem.datasource }; });
}

function getValidDatasources(targets) {
  return targets.filter((elem) => elem.metricAggs.filter((elem) => elem.alias === 'latitude' || elem.alias === 'longitude')).map((elem) => elem.datasource);
}

export {
  getDatasources, getValidDatasources
};
