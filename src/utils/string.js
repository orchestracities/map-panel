export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleize(str) {
  return str.split('_').map((elem)=>capitalize(elem)).join(' ');
}


String.prototype.capitalize = function() {
  this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.titleize = function() {
  this.split('_').map((elem)=>this.capitalize(elem)).join(' ');
}
