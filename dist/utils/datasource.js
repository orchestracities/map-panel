"use strict";

System.register([], function (_export, _context) {
  "use strict";

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

  return {
    setters: [],
    execute: function () {
      _export("getDatasources", getDatasources);

      _export("getValidDatasources", getValidDatasources);
    }
  };
});
//# sourceMappingURL=datasource.js.map
