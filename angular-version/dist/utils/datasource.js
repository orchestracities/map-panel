"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDatasources = getDatasources;
exports.getValidDatasources = getValidDatasources;

function getDatasources(targets) {
  return targets.map(function (elem) {
    return {
      'name': elem.datasource
    };
  });
}

function getValidDatasources(targets) {
  return targets.filter(function (elem) {
    return elem.metricAggs.filter(function (elem) {
      return elem.alias === 'latitude' || elem.alias === 'longitude';
    });
  }).map(function (elem) {
    return elem.datasource;
  });
}
//# sourceMappingURL=datasource.js.map
