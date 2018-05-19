'use strict';

System.register([], function (_export, _context) {
  "use strict";

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  _export('capitalize', capitalize);

  function titleize(str) {
    return str.split('_').map(function (elem) {
      return capitalize(elem);
    }).join(' ');
  }

  _export('titleize', titleize);

  return {
    setters: [],
    execute: function () {}
  };
});
//# sourceMappingURL=string.js.map
