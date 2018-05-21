"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function getDatasources(targets) {
  return targets.map(function (elem) {
    return { "name": elem.datasource };
  });
}

function getValidDatasources(targets) {
  return targets.filter(function (elem) {
    return elem.metricAggs.filter(function (elem) {
      return elem.alias === "latitude" || elem.alias === "longitude";
    });
  }).map(function (elem) {
    return elem.datasource;
  });
}

exports.getDatasources = getDatasources;
exports.getValidDatasources = getValidDatasources;
//# sourceMappingURL=datasource.js.map
