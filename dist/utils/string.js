"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.capitalize = capitalize;
exports.titleize = titleize;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function titleize(str) {
  return str.split('_').map(function (elem) {
    return capitalize(elem);
  }).join(' ');
}

String.prototype.capitalize = function () {
  this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.titleize = function () {
  var _this = this;

  this.split('_').map(function (elem) {
    return _this.capitalize(elem);
  }).join(' ');
};
//# sourceMappingURL=string.js.map
