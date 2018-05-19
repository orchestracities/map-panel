export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleize(str) {
  return str.split('_').map((elem)=>capitalize(elem)).join(' ');
}