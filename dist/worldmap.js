'use strict';

System.register(['lodash', './libs/highcharts', './libs/leaflet'], function (_export, _context) {
  "use strict";

  var _, Highcharts, L, _createClass, AQI, carsCount, mapControl, mapZoom, globalCircles, globalMarkers, globalPolylines, tileServers, carMarker, WorldMap;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function showPollutants(e) {
    var chart = document.getElementById('dataChart');
    var measuresTable = document.getElementById('measures-table');

    chart.style.display = 'block';

    while (measuresTable.rows[0]) {
      measuresTable.deleteRow(0);
    }var circlePollutants = e.target.options.pollutants;

    circlePollutants.forEach(function (pollutant) {
      var row = measuresTable.insertRow(0);
      row.className = 'measure';

      var innerCell0 = pollutant.name.toUpperCase();
      var innerCell1 = pollutant.value;

      var cell0 = row.insertCell(0);
      var cell1 = row.insertCell(1);

      cell0.innerHTML = innerCell0;
      cell1.innerHTML = innerCell1;
      cell0.className = 'cell';
      cell1.className = 'cell';
    });

    document.getElementById('measuresTable').style.display = 'inherit';

    showHealthConcerns(e);
  }

  function showHealthConcerns(e) {
    var healthConcernsWrapper = document.getElementById('healthConcernsWrapper');
    var healthConcerns = document.getElementById('healthConcerns');
    var healthRisk = document.getElementById('healthRisk');

    healthConcernsWrapper.style.display = 'inherit';

    var risk = e.target.options.aqiRisk;
    var color = e.target.options.aqiColor;
    var meaning = e.target.options.aqiMeaning;

    healthConcerns.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }

  function calculateAQI(aqi) {
    var aqiIndex = void 0;
    AQI.range.forEach(function (value, index) {
      if (aqi > value && aqi <= AQI.range[index + 1]) {
        aqiIndex = index;
      }
    });
    return aqiIndex;
  }

  function drawChart() {
    var data = [[Date.UTC(2013, 5, 2), 0.7695], [Date.UTC(2013, 5, 3), 0.7648], [Date.UTC(2013, 5, 4), 0.7645], [Date.UTC(2013, 5, 5), 0.7638], [Date.UTC(2013, 5, 6), 0.7549], [Date.UTC(2013, 5, 7), 0.7562], [Date.UTC(2013, 5, 9), 0.7574], [Date.UTC(2013, 5, 10), 0.7543], [Date.UTC(2013, 5, 11), 0.7510], [Date.UTC(2013, 5, 12), 0.7498], [Date.UTC(2013, 5, 13), 0.7477], [Date.UTC(2013, 5, 14), 0.7492], [Date.UTC(2013, 5, 16), 0.7487], [Date.UTC(2013, 5, 17), 0.7480], [Date.UTC(2013, 5, 18), 0.7466], [Date.UTC(2013, 5, 19), 0.7521], [Date.UTC(2013, 5, 20), 0.7564], [Date.UTC(2013, 5, 21), 0.7621], [Date.UTC(2013, 5, 23), 0.7630], [Date.UTC(2013, 5, 24), 0.7623], [Date.UTC(2013, 5, 25), 0.7644], [Date.UTC(2013, 5, 26), 0.7685], [Date.UTC(2013, 5, 27), 0.7671], [Date.UTC(2013, 5, 28), 0.7687], [Date.UTC(2013, 5, 30), 0.7687], [Date.UTC(2013, 6, 1), 0.7654], [Date.UTC(2013, 6, 2), 0.7705], [Date.UTC(2013, 6, 3), 0.7687], [Date.UTC(2013, 6, 4), 0.7744], [Date.UTC(2013, 6, 5), 0.7793], [Date.UTC(2013, 6, 7), 0.7804], [Date.UTC(2013, 6, 8), 0.7770], [Date.UTC(2013, 6, 9), 0.7824], [Date.UTC(2013, 6, 10), 0.7705], [Date.UTC(2013, 6, 11), 0.7635], [Date.UTC(2013, 6, 12), 0.7652], [Date.UTC(2013, 6, 14), 0.7656], [Date.UTC(2013, 6, 15), 0.7655], [Date.UTC(2013, 6, 16), 0.7598], [Date.UTC(2013, 6, 17), 0.7619], [Date.UTC(2013, 6, 18), 0.7628], [Date.UTC(2013, 6, 19), 0.7609], [Date.UTC(2013, 6, 21), 0.7599], [Date.UTC(2013, 6, 22), 0.7584], [Date.UTC(2013, 6, 23), 0.7562], [Date.UTC(2013, 6, 24), 0.7575], [Date.UTC(2013, 6, 25), 0.7531], [Date.UTC(2013, 6, 26), 0.7530], [Date.UTC(2013, 6, 28), 0.7526], [Date.UTC(2013, 6, 29), 0.7540], [Date.UTC(2013, 6, 30), 0.7540], [Date.UTC(2013, 6, 31), 0.7518], [Date.UTC(2013, 7, 1), 0.7571], [Date.UTC(2013, 7, 2), 0.7529], [Date.UTC(2013, 7, 4), 0.7532], [Date.UTC(2013, 7, 5), 0.7542], [Date.UTC(2013, 7, 6), 0.7515], [Date.UTC(2013, 7, 7), 0.7498], [Date.UTC(2013, 7, 8), 0.7473], [Date.UTC(2013, 7, 9), 0.7494], [Date.UTC(2013, 7, 11), 0.7497], [Date.UTC(2013, 7, 12), 0.7519], [Date.UTC(2013, 7, 13), 0.7540], [Date.UTC(2013, 7, 14), 0.7543], [Date.UTC(2013, 7, 15), 0.7492], [Date.UTC(2013, 7, 16), 0.7502], [Date.UTC(2013, 7, 18), 0.7503], [Date.UTC(2013, 7, 19), 0.7499], [Date.UTC(2013, 7, 20), 0.7453], [Date.UTC(2013, 7, 21), 0.7487], [Date.UTC(2013, 7, 22), 0.7487], [Date.UTC(2013, 7, 23), 0.7472], [Date.UTC(2013, 7, 25), 0.7471], [Date.UTC(2013, 7, 26), 0.7480], [Date.UTC(2013, 7, 27), 0.7467], [Date.UTC(2013, 7, 28), 0.7497], [Date.UTC(2013, 7, 29), 0.7552], [Date.UTC(2013, 7, 30), 0.7562], [Date.UTC(2013, 8, 1), 0.7572], [Date.UTC(2013, 8, 2), 0.7581], [Date.UTC(2013, 8, 3), 0.7593], [Date.UTC(2013, 8, 4), 0.7571], [Date.UTC(2013, 8, 5), 0.7622], [Date.UTC(2013, 8, 6), 0.7588], [Date.UTC(2013, 8, 8), 0.7591], [Date.UTC(2013, 8, 9), 0.7544], [Date.UTC(2013, 8, 10), 0.7537], [Date.UTC(2013, 8, 11), 0.7512], [Date.UTC(2013, 8, 12), 0.7519], [Date.UTC(2013, 8, 13), 0.7522], [Date.UTC(2013, 8, 15), 0.7486], [Date.UTC(2013, 8, 16), 0.7500], [Date.UTC(2013, 8, 17), 0.7486], [Date.UTC(2013, 8, 18), 0.7396], [Date.UTC(2013, 8, 19), 0.7391], [Date.UTC(2013, 8, 20), 0.7394], [Date.UTC(2013, 8, 22), 0.7389], [Date.UTC(2013, 8, 23), 0.7411], [Date.UTC(2013, 8, 24), 0.7422], [Date.UTC(2013, 8, 25), 0.7393], [Date.UTC(2013, 8, 26), 0.7413], [Date.UTC(2013, 8, 27), 0.7396], [Date.UTC(2013, 8, 29), 0.7410], [Date.UTC(2013, 8, 30), 0.7393], [Date.UTC(2013, 9, 1), 0.7393], [Date.UTC(2013, 9, 2), 0.7365], [Date.UTC(2013, 9, 3), 0.7343], [Date.UTC(2013, 9, 4), 0.7376], [Date.UTC(2013, 9, 6), 0.7370], [Date.UTC(2013, 9, 7), 0.7362], [Date.UTC(2013, 9, 8), 0.7368], [Date.UTC(2013, 9, 9), 0.7393], [Date.UTC(2013, 9, 10), 0.7397], [Date.UTC(2013, 9, 11), 0.7385], [Date.UTC(2013, 9, 13), 0.7377], [Date.UTC(2013, 9, 14), 0.7374], [Date.UTC(2013, 9, 15), 0.7395], [Date.UTC(2013, 9, 16), 0.7389], [Date.UTC(2013, 9, 17), 0.7312], [Date.UTC(2013, 9, 18), 0.7307], [Date.UTC(2013, 9, 20), 0.7309], [Date.UTC(2013, 9, 21), 0.7308], [Date.UTC(2013, 9, 22), 0.7256], [Date.UTC(2013, 9, 23), 0.7258], [Date.UTC(2013, 9, 24), 0.7247], [Date.UTC(2013, 9, 25), 0.7244], [Date.UTC(2013, 9, 27), 0.7244], [Date.UTC(2013, 9, 28), 0.7255], [Date.UTC(2013, 9, 29), 0.7275], [Date.UTC(2013, 9, 30), 0.7280], [Date.UTC(2013, 9, 31), 0.7361], [Date.UTC(2013, 10, 1), 0.7415], [Date.UTC(2013, 10, 3), 0.7411], [Date.UTC(2013, 10, 4), 0.7399], [Date.UTC(2013, 10, 5), 0.7421], [Date.UTC(2013, 10, 6), 0.7400], [Date.UTC(2013, 10, 7), 0.7452], [Date.UTC(2013, 10, 8), 0.7479], [Date.UTC(2013, 10, 10), 0.7492], [Date.UTC(2013, 10, 11), 0.7460], [Date.UTC(2013, 10, 12), 0.7442], [Date.UTC(2013, 10, 13), 0.7415], [Date.UTC(2013, 10, 14), 0.7429], [Date.UTC(2013, 10, 15), 0.7410], [Date.UTC(2013, 10, 17), 0.7417], [Date.UTC(2013, 10, 18), 0.7405], [Date.UTC(2013, 10, 19), 0.7386], [Date.UTC(2013, 10, 20), 0.7441], [Date.UTC(2013, 10, 21), 0.7418], [Date.UTC(2013, 10, 22), 0.7376], [Date.UTC(2013, 10, 24), 0.7379], [Date.UTC(2013, 10, 25), 0.7399], [Date.UTC(2013, 10, 26), 0.7369], [Date.UTC(2013, 10, 27), 0.7365], [Date.UTC(2013, 10, 28), 0.7350], [Date.UTC(2013, 10, 29), 0.7358], [Date.UTC(2013, 11, 1), 0.7362], [Date.UTC(2013, 11, 2), 0.7385], [Date.UTC(2013, 11, 3), 0.7359], [Date.UTC(2013, 11, 4), 0.7357], [Date.UTC(2013, 11, 5), 0.7317], [Date.UTC(2013, 11, 6), 0.7297], [Date.UTC(2013, 11, 8), 0.7296], [Date.UTC(2013, 11, 9), 0.7279], [Date.UTC(2013, 11, 10), 0.7267], [Date.UTC(2013, 11, 11), 0.7254], [Date.UTC(2013, 11, 12), 0.7270], [Date.UTC(2013, 11, 13), 0.7276], [Date.UTC(2013, 11, 15), 0.7278], [Date.UTC(2013, 11, 16), 0.7267], [Date.UTC(2013, 11, 17), 0.7263], [Date.UTC(2013, 11, 18), 0.7307], [Date.UTC(2013, 11, 19), 0.7319], [Date.UTC(2013, 11, 20), 0.7315], [Date.UTC(2013, 11, 22), 0.7311], [Date.UTC(2013, 11, 23), 0.7301], [Date.UTC(2013, 11, 24), 0.7308], [Date.UTC(2013, 11, 25), 0.7310], [Date.UTC(2013, 11, 26), 0.7304], [Date.UTC(2013, 11, 27), 0.7277], [Date.UTC(2013, 11, 29), 0.7272], [Date.UTC(2013, 11, 30), 0.7244], [Date.UTC(2013, 11, 31), 0.7275], [Date.UTC(2014, 0, 1), 0.7271], [Date.UTC(2014, 0, 2), 0.7314], [Date.UTC(2014, 0, 3), 0.7359], [Date.UTC(2014, 0, 5), 0.7355], [Date.UTC(2014, 0, 6), 0.7338], [Date.UTC(2014, 0, 7), 0.7345], [Date.UTC(2014, 0, 8), 0.7366], [Date.UTC(2014, 0, 9), 0.7349], [Date.UTC(2014, 0, 10), 0.7316], [Date.UTC(2014, 0, 12), 0.7315], [Date.UTC(2014, 0, 13), 0.7315], [Date.UTC(2014, 0, 14), 0.7310], [Date.UTC(2014, 0, 15), 0.7350], [Date.UTC(2014, 0, 16), 0.7341], [Date.UTC(2014, 0, 17), 0.7385], [Date.UTC(2014, 0, 19), 0.7392], [Date.UTC(2014, 0, 20), 0.7379], [Date.UTC(2014, 0, 21), 0.7373], [Date.UTC(2014, 0, 22), 0.7381], [Date.UTC(2014, 0, 23), 0.7301], [Date.UTC(2014, 0, 24), 0.7311], [Date.UTC(2014, 0, 26), 0.7306], [Date.UTC(2014, 0, 27), 0.7314], [Date.UTC(2014, 0, 28), 0.7316], [Date.UTC(2014, 0, 29), 0.7319], [Date.UTC(2014, 0, 30), 0.7377], [Date.UTC(2014, 0, 31), 0.7415], [Date.UTC(2014, 1, 2), 0.7414], [Date.UTC(2014, 1, 3), 0.7393], [Date.UTC(2014, 1, 4), 0.7397], [Date.UTC(2014, 1, 5), 0.7389], [Date.UTC(2014, 1, 6), 0.7358], [Date.UTC(2014, 1, 7), 0.7334], [Date.UTC(2014, 1, 9), 0.7343], [Date.UTC(2014, 1, 10), 0.7328], [Date.UTC(2014, 1, 11), 0.7332], [Date.UTC(2014, 1, 12), 0.7356], [Date.UTC(2014, 1, 13), 0.7309], [Date.UTC(2014, 1, 14), 0.7304], [Date.UTC(2014, 1, 16), 0.7300], [Date.UTC(2014, 1, 17), 0.7295], [Date.UTC(2014, 1, 18), 0.7268], [Date.UTC(2014, 1, 19), 0.7281], [Date.UTC(2014, 1, 20), 0.7289], [Date.UTC(2014, 1, 21), 0.7278], [Date.UTC(2014, 1, 23), 0.7280], [Date.UTC(2014, 1, 24), 0.7280], [Date.UTC(2014, 1, 25), 0.7275], [Date.UTC(2014, 1, 26), 0.7306], [Date.UTC(2014, 1, 27), 0.7295], [Date.UTC(2014, 1, 28), 0.7245], [Date.UTC(2014, 2, 2), 0.7259], [Date.UTC(2014, 2, 3), 0.7280], [Date.UTC(2014, 2, 4), 0.7276], [Date.UTC(2014, 2, 5), 0.7282], [Date.UTC(2014, 2, 6), 0.7215], [Date.UTC(2014, 2, 7), 0.7206], [Date.UTC(2014, 2, 9), 0.7206], [Date.UTC(2014, 2, 10), 0.7207], [Date.UTC(2014, 2, 11), 0.7216], [Date.UTC(2014, 2, 12), 0.7192], [Date.UTC(2014, 2, 13), 0.7210], [Date.UTC(2014, 2, 14), 0.7187], [Date.UTC(2014, 2, 16), 0.7188], [Date.UTC(2014, 2, 17), 0.7183], [Date.UTC(2014, 2, 18), 0.7177], [Date.UTC(2014, 2, 19), 0.7229], [Date.UTC(2014, 2, 20), 0.7258], [Date.UTC(2014, 2, 21), 0.7249], [Date.UTC(2014, 2, 23), 0.7247], [Date.UTC(2014, 2, 24), 0.7226], [Date.UTC(2014, 2, 25), 0.7232], [Date.UTC(2014, 2, 26), 0.7255], [Date.UTC(2014, 2, 27), 0.7278], [Date.UTC(2014, 2, 28), 0.7271], [Date.UTC(2014, 2, 30), 0.7272], [Date.UTC(2014, 2, 31), 0.7261], [Date.UTC(2014, 3, 1), 0.7250], [Date.UTC(2014, 3, 2), 0.7264], [Date.UTC(2014, 3, 3), 0.7289], [Date.UTC(2014, 3, 4), 0.7298], [Date.UTC(2014, 3, 6), 0.7298], [Date.UTC(2014, 3, 7), 0.7278], [Date.UTC(2014, 3, 8), 0.7248], [Date.UTC(2014, 3, 9), 0.7218], [Date.UTC(2014, 3, 10), 0.7200], [Date.UTC(2014, 3, 11), 0.7202], [Date.UTC(2014, 3, 13), 0.7222], [Date.UTC(2014, 3, 14), 0.7236], [Date.UTC(2014, 3, 15), 0.7239], [Date.UTC(2014, 3, 16), 0.7238], [Date.UTC(2014, 3, 17), 0.7238], [Date.UTC(2014, 3, 18), 0.7238], [Date.UTC(2014, 3, 20), 0.7239], [Date.UTC(2014, 3, 21), 0.7250], [Date.UTC(2014, 3, 22), 0.7244], [Date.UTC(2014, 3, 23), 0.7238], [Date.UTC(2014, 3, 24), 0.7229], [Date.UTC(2014, 3, 25), 0.7229], [Date.UTC(2014, 3, 27), 0.7226], [Date.UTC(2014, 3, 28), 0.7220], [Date.UTC(2014, 3, 29), 0.7240], [Date.UTC(2014, 3, 30), 0.7211], [Date.UTC(2014, 4, 1), 0.7210], [Date.UTC(2014, 4, 2), 0.7209], [Date.UTC(2014, 4, 4), 0.7209], [Date.UTC(2014, 4, 5), 0.7207], [Date.UTC(2014, 4, 6), 0.7180], [Date.UTC(2014, 4, 7), 0.7188], [Date.UTC(2014, 4, 8), 0.7225], [Date.UTC(2014, 4, 9), 0.7268], [Date.UTC(2014, 4, 11), 0.7267], [Date.UTC(2014, 4, 12), 0.7269], [Date.UTC(2014, 4, 13), 0.7297], [Date.UTC(2014, 4, 14), 0.7291], [Date.UTC(2014, 4, 15), 0.7294], [Date.UTC(2014, 4, 16), 0.7302], [Date.UTC(2014, 4, 18), 0.7298], [Date.UTC(2014, 4, 19), 0.7295], [Date.UTC(2014, 4, 20), 0.7298], [Date.UTC(2014, 4, 21), 0.7307], [Date.UTC(2014, 4, 22), 0.7323], [Date.UTC(2014, 4, 23), 0.7335], [Date.UTC(2014, 4, 25), 0.7338], [Date.UTC(2014, 4, 26), 0.7329], [Date.UTC(2014, 4, 27), 0.7335], [Date.UTC(2014, 4, 28), 0.7358], [Date.UTC(2014, 4, 29), 0.7351], [Date.UTC(2014, 4, 30), 0.7337], [Date.UTC(2014, 5, 1), 0.7338], [Date.UTC(2014, 5, 2), 0.7355], [Date.UTC(2014, 5, 3), 0.7338], [Date.UTC(2014, 5, 4), 0.7353], [Date.UTC(2014, 5, 5), 0.7321], [Date.UTC(2014, 5, 6), 0.7330], [Date.UTC(2014, 5, 8), 0.7327], [Date.UTC(2014, 5, 9), 0.7356], [Date.UTC(2014, 5, 10), 0.7381], [Date.UTC(2014, 5, 11), 0.7389], [Date.UTC(2014, 5, 12), 0.7379], [Date.UTC(2014, 5, 13), 0.7384], [Date.UTC(2014, 5, 15), 0.7388], [Date.UTC(2014, 5, 16), 0.7367], [Date.UTC(2014, 5, 17), 0.7382], [Date.UTC(2014, 5, 18), 0.7356], [Date.UTC(2014, 5, 19), 0.7349], [Date.UTC(2014, 5, 20), 0.7353], [Date.UTC(2014, 5, 22), 0.7357], [Date.UTC(2014, 5, 23), 0.7350], [Date.UTC(2014, 5, 24), 0.7350], [Date.UTC(2014, 5, 25), 0.7337], [Date.UTC(2014, 5, 26), 0.7347], [Date.UTC(2014, 5, 27), 0.7327], [Date.UTC(2014, 5, 29), 0.7330], [Date.UTC(2014, 5, 30), 0.7304], [Date.UTC(2014, 6, 1), 0.7310], [Date.UTC(2014, 6, 2), 0.7320], [Date.UTC(2014, 6, 3), 0.7347], [Date.UTC(2014, 6, 4), 0.7356], [Date.UTC(2014, 6, 6), 0.7360], [Date.UTC(2014, 6, 7), 0.7350], [Date.UTC(2014, 6, 8), 0.7346], [Date.UTC(2014, 6, 9), 0.7329], [Date.UTC(2014, 6, 10), 0.7348], [Date.UTC(2014, 6, 11), 0.7349], [Date.UTC(2014, 6, 13), 0.7352], [Date.UTC(2014, 6, 14), 0.7342], [Date.UTC(2014, 6, 15), 0.7369], [Date.UTC(2014, 6, 16), 0.7393], [Date.UTC(2014, 6, 17), 0.7392], [Date.UTC(2014, 6, 18), 0.7394], [Date.UTC(2014, 6, 20), 0.7390], [Date.UTC(2014, 6, 21), 0.7395], [Date.UTC(2014, 6, 22), 0.7427], [Date.UTC(2014, 6, 23), 0.7427], [Date.UTC(2014, 6, 24), 0.7428], [Date.UTC(2014, 6, 25), 0.7446], [Date.UTC(2014, 6, 27), 0.7447], [Date.UTC(2014, 6, 28), 0.7440], [Date.UTC(2014, 6, 29), 0.7458], [Date.UTC(2014, 6, 30), 0.7464], [Date.UTC(2014, 6, 31), 0.7469], [Date.UTC(2014, 7, 1), 0.7446], [Date.UTC(2014, 7, 3), 0.7447], [Date.UTC(2014, 7, 4), 0.7450], [Date.UTC(2014, 7, 5), 0.7477], [Date.UTC(2014, 7, 6), 0.7472], [Date.UTC(2014, 7, 7), 0.7483], [Date.UTC(2014, 7, 8), 0.7457], [Date.UTC(2014, 7, 10), 0.7460], [Date.UTC(2014, 7, 11), 0.7470], [Date.UTC(2014, 7, 12), 0.7480], [Date.UTC(2014, 7, 13), 0.7482], [Date.UTC(2014, 7, 14), 0.7482], [Date.UTC(2014, 7, 15), 0.7463], [Date.UTC(2014, 7, 17), 0.7469], [Date.UTC(2014, 7, 18), 0.7483], [Date.UTC(2014, 7, 19), 0.7508], [Date.UTC(2014, 7, 20), 0.7541], [Date.UTC(2014, 7, 21), 0.7529], [Date.UTC(2014, 7, 22), 0.7551], [Date.UTC(2014, 7, 24), 0.7577], [Date.UTC(2014, 7, 25), 0.7580], [Date.UTC(2014, 7, 26), 0.7593], [Date.UTC(2014, 7, 27), 0.7580], [Date.UTC(2014, 7, 28), 0.7585], [Date.UTC(2014, 7, 29), 0.7614], [Date.UTC(2014, 7, 31), 0.7618], [Date.UTC(2014, 8, 1), 0.7618], [Date.UTC(2014, 8, 2), 0.7614], [Date.UTC(2014, 8, 3), 0.7604], [Date.UTC(2014, 8, 4), 0.7725], [Date.UTC(2014, 8, 5), 0.7722], [Date.UTC(2014, 8, 7), 0.7721], [Date.UTC(2014, 8, 8), 0.7753], [Date.UTC(2014, 8, 9), 0.7730], [Date.UTC(2014, 8, 10), 0.7742], [Date.UTC(2014, 8, 11), 0.7736], [Date.UTC(2014, 8, 12), 0.7713], [Date.UTC(2014, 8, 14), 0.7717], [Date.UTC(2014, 8, 15), 0.7727], [Date.UTC(2014, 8, 16), 0.7716], [Date.UTC(2014, 8, 17), 0.7772], [Date.UTC(2014, 8, 18), 0.7739], [Date.UTC(2014, 8, 19), 0.7794], [Date.UTC(2014, 8, 21), 0.7788], [Date.UTC(2014, 8, 22), 0.7782], [Date.UTC(2014, 8, 23), 0.7784], [Date.UTC(2014, 8, 24), 0.7824], [Date.UTC(2014, 8, 25), 0.7843], [Date.UTC(2014, 8, 26), 0.7884], [Date.UTC(2014, 8, 28), 0.7891], [Date.UTC(2014, 8, 29), 0.7883], [Date.UTC(2014, 8, 30), 0.7916], [Date.UTC(2014, 9, 1), 0.7922], [Date.UTC(2014, 9, 2), 0.7893], [Date.UTC(2014, 9, 3), 0.7989], [Date.UTC(2014, 9, 5), 0.7992], [Date.UTC(2014, 9, 6), 0.7903], [Date.UTC(2014, 9, 7), 0.7893], [Date.UTC(2014, 9, 8), 0.7853], [Date.UTC(2014, 9, 9), 0.7880], [Date.UTC(2014, 9, 10), 0.7919], [Date.UTC(2014, 9, 12), 0.7912], [Date.UTC(2014, 9, 13), 0.7842], [Date.UTC(2014, 9, 14), 0.7900], [Date.UTC(2014, 9, 15), 0.7790], [Date.UTC(2014, 9, 16), 0.7806], [Date.UTC(2014, 9, 17), 0.7835], [Date.UTC(2014, 9, 19), 0.7844], [Date.UTC(2014, 9, 20), 0.7813], [Date.UTC(2014, 9, 21), 0.7864], [Date.UTC(2014, 9, 22), 0.7905], [Date.UTC(2014, 9, 23), 0.7907], [Date.UTC(2014, 9, 24), 0.7893], [Date.UTC(2014, 9, 26), 0.7889], [Date.UTC(2014, 9, 27), 0.7875], [Date.UTC(2014, 9, 28), 0.7853], [Date.UTC(2014, 9, 29), 0.7916], [Date.UTC(2014, 9, 30), 0.7929], [Date.UTC(2014, 9, 31), 0.7984], [Date.UTC(2014, 10, 2), 0.7999], [Date.UTC(2014, 10, 3), 0.8012], [Date.UTC(2014, 10, 4), 0.7971], [Date.UTC(2014, 10, 5), 0.8009], [Date.UTC(2014, 10, 6), 0.8081], [Date.UTC(2014, 10, 7), 0.8030], [Date.UTC(2014, 10, 9), 0.8025], [Date.UTC(2014, 10, 10), 0.8051], [Date.UTC(2014, 10, 11), 0.8016], [Date.UTC(2014, 10, 12), 0.8040], [Date.UTC(2014, 10, 13), 0.8015], [Date.UTC(2014, 10, 14), 0.7985], [Date.UTC(2014, 10, 16), 0.7988], [Date.UTC(2014, 10, 17), 0.8032], [Date.UTC(2014, 10, 18), 0.7976], [Date.UTC(2014, 10, 19), 0.7965], [Date.UTC(2014, 10, 20), 0.7975], [Date.UTC(2014, 10, 21), 0.8071], [Date.UTC(2014, 10, 23), 0.8082], [Date.UTC(2014, 10, 24), 0.8037], [Date.UTC(2014, 10, 25), 0.8016], [Date.UTC(2014, 10, 26), 0.7996], [Date.UTC(2014, 10, 27), 0.8022], [Date.UTC(2014, 10, 28), 0.8031], [Date.UTC(2014, 10, 30), 0.8040], [Date.UTC(2014, 11, 1), 0.8020], [Date.UTC(2014, 11, 2), 0.8075], [Date.UTC(2014, 11, 3), 0.8123], [Date.UTC(2014, 11, 4), 0.8078], [Date.UTC(2014, 11, 5), 0.8139], [Date.UTC(2014, 11, 7), 0.8135], [Date.UTC(2014, 11, 8), 0.8119], [Date.UTC(2014, 11, 9), 0.8081], [Date.UTC(2014, 11, 10), 0.8034], [Date.UTC(2014, 11, 11), 0.8057], [Date.UTC(2014, 11, 12), 0.8024], [Date.UTC(2014, 11, 14), 0.8024], [Date.UTC(2014, 11, 15), 0.8040], [Date.UTC(2014, 11, 16), 0.7993], [Date.UTC(2014, 11, 17), 0.8102], [Date.UTC(2014, 11, 18), 0.8139], [Date.UTC(2014, 11, 19), 0.8177], [Date.UTC(2014, 11, 21), 0.8180], [Date.UTC(2014, 11, 22), 0.8176], [Date.UTC(2014, 11, 23), 0.8215], [Date.UTC(2014, 11, 24), 0.8200], [Date.UTC(2014, 11, 25), 0.8182], [Date.UTC(2014, 11, 26), 0.8213], [Date.UTC(2014, 11, 28), 0.8218], [Date.UTC(2014, 11, 29), 0.8229], [Date.UTC(2014, 11, 30), 0.8225], [Date.UTC(2014, 11, 31), 0.8266], [Date.UTC(2015, 0, 1), 0.8262], [Date.UTC(2015, 0, 2), 0.8331], [Date.UTC(2015, 0, 4), 0.8371], [Date.UTC(2015, 0, 5), 0.8380], [Date.UTC(2015, 0, 6), 0.8411], [Date.UTC(2015, 0, 7), 0.8447], [Date.UTC(2015, 0, 8), 0.8480], [Date.UTC(2015, 0, 9), 0.8445], [Date.UTC(2015, 0, 11), 0.8425], [Date.UTC(2015, 0, 12), 0.8451], [Date.UTC(2015, 0, 13), 0.8495], [Date.UTC(2015, 0, 14), 0.8482], [Date.UTC(2015, 0, 15), 0.8598], [Date.UTC(2015, 0, 16), 0.8643], [Date.UTC(2015, 0, 18), 0.8648], [Date.UTC(2015, 0, 19), 0.8617], [Date.UTC(2015, 0, 20), 0.8658], [Date.UTC(2015, 0, 21), 0.8613], [Date.UTC(2015, 0, 22), 0.8798], [Date.UTC(2015, 0, 23), 0.8922], [Date.UTC(2015, 0, 25), 0.8990], [Date.UTC(2015, 0, 26), 0.8898], [Date.UTC(2015, 0, 27), 0.8787], [Date.UTC(2015, 0, 28), 0.8859], [Date.UTC(2015, 0, 29), 0.8834], [Date.UTC(2015, 0, 30), 0.8859], [Date.UTC(2015, 1, 1), 0.8843], [Date.UTC(2015, 1, 2), 0.8817], [Date.UTC(2015, 1, 3), 0.8710], [Date.UTC(2015, 1, 4), 0.8813], [Date.UTC(2015, 1, 5), 0.8713], [Date.UTC(2015, 1, 6), 0.8837], [Date.UTC(2015, 1, 8), 0.8839], [Date.UTC(2015, 1, 9), 0.8831], [Date.UTC(2015, 1, 10), 0.8833], [Date.UTC(2015, 1, 11), 0.8823], [Date.UTC(2015, 1, 12), 0.8770], [Date.UTC(2015, 1, 13), 0.8783], [Date.UTC(2015, 1, 15), 0.8774], [Date.UTC(2015, 1, 16), 0.8807], [Date.UTC(2015, 1, 17), 0.8762], [Date.UTC(2015, 1, 18), 0.8774], [Date.UTC(2015, 1, 19), 0.8798], [Date.UTC(2015, 1, 20), 0.8787], [Date.UTC(2015, 1, 22), 0.8787], [Date.UTC(2015, 1, 23), 0.8824], [Date.UTC(2015, 1, 24), 0.8818], [Date.UTC(2015, 1, 25), 0.8801], [Date.UTC(2015, 1, 26), 0.8931], [Date.UTC(2015, 1, 27), 0.8932], [Date.UTC(2015, 2, 1), 0.8960], [Date.UTC(2015, 2, 2), 0.8941], [Date.UTC(2015, 2, 3), 0.8948], [Date.UTC(2015, 2, 4), 0.9026], [Date.UTC(2015, 2, 5), 0.9066], [Date.UTC(2015, 2, 6), 0.9222], [Date.UTC(2015, 2, 8), 0.9221], [Date.UTC(2015, 2, 9), 0.9214], [Date.UTC(2015, 2, 10), 0.9347], [Date.UTC(2015, 2, 11), 0.9482], [Date.UTC(2015, 2, 12), 0.9403], [Date.UTC(2015, 2, 13), 0.9528], [Date.UTC(2015, 2, 15), 0.9541], [Date.UTC(2015, 2, 16), 0.9462], [Date.UTC(2015, 2, 17), 0.9435], [Date.UTC(2015, 2, 18), 0.9203], [Date.UTC(2015, 2, 19), 0.9381], [Date.UTC(2015, 2, 20), 0.9241], [Date.UTC(2015, 2, 22), 0.9237], [Date.UTC(2015, 2, 23), 0.9135], [Date.UTC(2015, 2, 24), 0.9152], [Date.UTC(2015, 2, 25), 0.9114], [Date.UTC(2015, 2, 26), 0.9188], [Date.UTC(2015, 2, 27), 0.9184], [Date.UTC(2015, 2, 29), 0.9188], [Date.UTC(2015, 2, 30), 0.9231], [Date.UTC(2015, 2, 31), 0.9319], [Date.UTC(2015, 3, 1), 0.9291], [Date.UTC(2015, 3, 2), 0.9188], [Date.UTC(2015, 3, 3), 0.9109], [Date.UTC(2015, 3, 5), 0.9091], [Date.UTC(2015, 3, 6), 0.9154], [Date.UTC(2015, 3, 7), 0.9246], [Date.UTC(2015, 3, 8), 0.9276], [Date.UTC(2015, 3, 9), 0.9382], [Date.UTC(2015, 3, 10), 0.9431], [Date.UTC(2015, 3, 12), 0.9426], [Date.UTC(2015, 3, 13), 0.9463], [Date.UTC(2015, 3, 14), 0.9386], [Date.UTC(2015, 3, 15), 0.9357], [Date.UTC(2015, 3, 16), 0.9293], [Date.UTC(2015, 3, 17), 0.9254], [Date.UTC(2015, 3, 19), 0.9251], [Date.UTC(2015, 3, 20), 0.9312], [Date.UTC(2015, 3, 21), 0.9315], [Date.UTC(2015, 3, 22), 0.9323], [Date.UTC(2015, 3, 23), 0.9236], [Date.UTC(2015, 3, 24), 0.9196], [Date.UTC(2015, 3, 26), 0.9201], [Date.UTC(2015, 3, 27), 0.9184], [Date.UTC(2015, 3, 28), 0.9106], [Date.UTC(2015, 3, 29), 0.8983], [Date.UTC(2015, 3, 30), 0.8909], [Date.UTC(2015, 4, 1), 0.8928], [Date.UTC(2015, 4, 3), 0.8941], [Date.UTC(2015, 4, 4), 0.8972], [Date.UTC(2015, 4, 5), 0.8940], [Date.UTC(2015, 4, 6), 0.8808], [Date.UTC(2015, 4, 7), 0.8876], [Date.UTC(2015, 4, 8), 0.8925], [Date.UTC(2015, 4, 10), 0.8934], [Date.UTC(2015, 4, 11), 0.8964], [Date.UTC(2015, 4, 12), 0.8917], [Date.UTC(2015, 4, 13), 0.8805], [Date.UTC(2015, 4, 14), 0.8764], [Date.UTC(2015, 4, 15), 0.8732], [Date.UTC(2015, 4, 17), 0.8737], [Date.UTC(2015, 4, 18), 0.8838], [Date.UTC(2015, 4, 19), 0.8969], [Date.UTC(2015, 4, 20), 0.9014], [Date.UTC(2015, 4, 21), 0.8999], [Date.UTC(2015, 4, 22), 0.9076], [Date.UTC(2015, 4, 24), 0.9098], [Date.UTC(2015, 4, 25), 0.9110], [Date.UTC(2015, 4, 26), 0.9196], [Date.UTC(2015, 4, 27), 0.9170], [Date.UTC(2015, 4, 28), 0.9133], [Date.UTC(2015, 4, 29), 0.9101], [Date.UTC(2015, 4, 31), 0.9126], [Date.UTC(2015, 5, 1), 0.9151], [Date.UTC(2015, 5, 2), 0.8965], [Date.UTC(2015, 5, 3), 0.8871], [Date.UTC(2015, 5, 4), 0.8898], [Date.UTC(2015, 5, 5), 0.8999], [Date.UTC(2015, 5, 7), 0.9004], [Date.UTC(2015, 5, 8), 0.8857], [Date.UTC(2015, 5, 9), 0.8862], [Date.UTC(2015, 5, 10), 0.8829], [Date.UTC(2015, 5, 11), 0.8882], [Date.UTC(2015, 5, 12), 0.8873], [Date.UTC(2015, 5, 14), 0.8913], [Date.UTC(2015, 5, 15), 0.8862], [Date.UTC(2015, 5, 16), 0.8891], [Date.UTC(2015, 5, 17), 0.8821], [Date.UTC(2015, 5, 18), 0.8802], [Date.UTC(2015, 5, 19), 0.8808], [Date.UTC(2015, 5, 21), 0.8794], [Date.UTC(2015, 5, 22), 0.8818], [Date.UTC(2015, 5, 23), 0.8952], [Date.UTC(2015, 5, 24), 0.8924], [Date.UTC(2015, 5, 25), 0.8925], [Date.UTC(2015, 5, 26), 0.8955], [Date.UTC(2015, 5, 28), 0.9113], [Date.UTC(2015, 5, 29), 0.8900], [Date.UTC(2015, 5, 30), 0.8950]];
    window.Highcharts.chart('graphContainer', {
      chart: {
        zoomType: 'x',
        backgroundColor: '#1f1d1d'
      },
      title: {
        text: 'Air Quality Index for Sensor 1234'
      },
      subtitle: {
        text: document.ontouchstart === undefined ? 'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: 'AQI'
        }
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: {
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 1
            },
            stops: [[0, 'gray'], [1, 'white']]
          },
          marker: {
            radius: 5
          },
          lineWidth: 4,
          states: {
            hover: {
              lineWidth: 5
            }
          },
          threshold: null
        }
      },

      series: [{
        type: 'area',
        name: 'Air Quality Index',
        color: 'white',
        data: data
      }]
    });
  }
  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_libsHighcharts) {
      Highcharts = _libsHighcharts.default;
    }, function (_libsLeaflet) {
      L = _libsLeaflet.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      AQI = {
        'range': [0, 50, 100, 150, 200, 300, 500],
        'meaning': ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
        'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023'],
        'risks': ['Air quality is considered satisfactory, and air pollution poses little or no risk.', 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', 'Health alert: everyone may experience more serious health effects.', 'Health warnings of emergency conditions. The entire population is more likely to be affected.']
      };
      carsCount = {
        'range': [15, 30, 45, 60, 75, 90, 105],
        'color': ['#009966', '#ffde33', '#ff9933', '#cc0033', '#660099', '#7e0023']
      };
      mapControl = void 0;
      mapZoom = void 0;
      globalCircles = [];
      globalMarkers = [];
      globalPolylines = [];
      tileServers = {
        'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' }
      };
      carMarker = window.L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Map_marker.svg/2000px-Map_marker.svg.png',

        iconSize: [25, 40] // size of the icon
        // iconAnchor: [15, 82], // point of the icon which will correspond to marker's location
        // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
      });

      WorldMap = function () {
        function WorldMap(ctrl, mapContainer) {
          _classCallCheck(this, WorldMap);

          this.ctrl = ctrl;
          this.mapContainer = mapContainer;
          this.createMap();
          this.circles = [];
        }

        _createClass(WorldMap, [{
          key: 'createMap',
          value: function createMap() {
            var mapCenter = window.L.latLng(parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude));
            mapControl = this.map = window.L.map(this.mapContainer, { worldCopyJump: true, center: mapCenter, zoomControl: false }).fitWorld().zoomIn(parseInt(this.ctrl.panel.initialZoom, 5));
            this.map.panTo(mapCenter);
            window.L.control.zoom({ position: 'topright' }).addTo(this.map);

            this.map.on('zoomstart', function (e) {
              mapZoom = mapControl.getZoom();
            });

            drawChart();

            // this.map.on('zoomend', (e) => {
            //   globalCircles.forEach((circle) => {
            //     console.log(mapZoom, e.target._zoom);
            //     if (e.target._zoom !== 0 && e.target._zoom >= mapZoom) {
            //       circle.setRadius(circle.getRadius() + Math.round(mapZoom));
            //     }
            //     if (e.target._zoom !== 0 && e.target._zoom <= mapZoom) {
            //       circle.setRadius(circle.getRadius() - Math.round(mapZoom));
            //     }
            //     console.log(circle.getRadius());
            //   });
            // });

            this.map.on('click', function (e) {
              document.getElementById('measuresTable').style.display = 'none';
              document.getElementById('healthConcernsWrapper').style.display = 'none';
            });

            var selectedTileServer = tileServers[this.ctrl.tileServer];
            window.L.tileLayer(selectedTileServer.url, {
              maxZoom: 18,
              subdomains: selectedTileServer.subdomains,
              reuseTiles: true,
              detectRetina: true,
              attribution: selectedTileServer.attribution
            }).addTo(this.map, true);
          }
        }, {
          key: 'filterEmptyAndZeroValues',
          value: function filterEmptyAndZeroValues(data) {
            var _this = this;

            return _.filter(data, function (o) {
              return !(_this.ctrl.panel.hideEmpty && _.isNil(o.value)) && !(_this.ctrl.panel.hideZero && o.value === 0);
            });
          }
        }, {
          key: 'clearCircles',
          value: function clearCircles() {
            if (this.circlesLayer) {
              this.circlesLayer.clearLayers();
              this.removeCircles(this.circlesLayer);
              globalCircles = [];
            }
          }
        }, {
          key: 'clearMarkers',
          value: function clearMarkers() {
            if (this.markersLayer) {
              this.markersLayer.clearLayers();
              this.removeMarkers(this.markersLayer);
              globalMarkers = [];
            }
          }
        }, {
          key: 'clearPolylines',
          value: function clearPolylines() {
            if (this.polylinesLayer) {
              this.polylinesLayer.clearLayers();
              this.removePolylines(this.polylinesLayer);
              globalPolylines = [];
            }
          }
        }, {
          key: 'drawPoints',
          value: function drawPoints() {
            var data = this.filterEmptyAndZeroValues(this.ctrl.data);
            this.clearCircles();
            this.clearMarkers();
            this.clearPolylines();

            this.createPoints(data);
          }
        }, {
          key: 'createPoints',
          value: function createPoints(data) {
            var _this2 = this;

            data.forEach(function (dataPoint) {
              if (dataPoint.type === 'environment') {
                var newCircle = _this2.createCircle(dataPoint);
                globalCircles.push(newCircle);
                _this2.circlesLayer = _this2.addCircles(globalCircles);
              } else if (dataPoint.type === 'traffic') {
                _this2.createMarker(dataPoint);
                // const newMarker = this.createMarker(dataPoint);
                // globalMarkers.push(newMarker);
                // this.markersLayer = this.addMarkers(globalMarkers);
              } else {
                console.log('Map point type ' + dataPoint.type + ' invalid. Must be environment or traffic');
              }
            });
          }
        }, {
          key: 'createMarker',
          value: function createMarker(dataPoint) {
            // const marker = window.L.marker([dataPoint.locationLatitude, dataPoint.locationLongitude]);
            var way = this.calculatePointPolyline(dataPoint.locationLatitude, dataPoint.locationLongitude, dataPoint.value);
            // this.createPopupMarker(marker, dataPoint.value);
            // return marker;
          }
        }, {
          key: 'createPolyline',
          value: function createPolyline(way, value) {
            var polyline = [];
            way.forEach(function (point) {
              polyline.push([point[1], point[0]]);
            });

            var colorIndex = void 0;
            carsCount.range.forEach(function (_value, index) {
              if (value > _value && value <= carsCount.range[index + 1]) {
                colorIndex = index;
              }
            });

            var color = carsCount.color[colorIndex];

            var polygon = window.L.polyline(polyline, {
              color: color,
              weight: 5,
              smoothFactor: 1
            });
            globalPolylines.push(polygon);
            this.polylinesLayer = this.addPolylines(globalPolylines);

            this.createPopupPolyline(polygon, value);
          }
        }, {
          key: 'calculatePointPolyline',
          value: function calculatePointPolyline(latitude, longitude, value) {
            var way = this.nominatim(latitude, longitude, value);
            return way;
          }
        }, {
          key: 'nominatim',
          value: function nominatim(latitude, longitude, value) {
            var _this3 = this;

            var urlStart = 'http://nominatim.openstreetmap.org/reverse?format=json&';
            var urlFinish = '&zoom=16&addressdetails=1&polygon_geojson=1';

            window.$.ajax({
              url: urlStart + 'lat=' + latitude + '&lon=' + longitude + urlFinish,
              type: 'GET',
              dataType: 'json',
              cache: false,
              success: function success(data) {
                _this3.createPolyline(data.geojson.coordinates, value);
              },
              error: function error(_error) {
                alert('Nominatim ERROR');
              }
            });
          }
        }, {
          key: 'createCircle',
          value: function createCircle(dataPoint) {
            var aqi = calculateAQI(dataPoint.value);
            var aqiColor = AQI.color[aqi];
            var aqiMeaning = AQI.meaning[aqi];
            var aqiRisk = AQI.risks[aqi];
            var pollutants = dataPoint.pollutants;

            var circle = window.L.circle([dataPoint.locationLatitude, dataPoint.locationLongitude], 200, {
              color: aqiColor,
              fillColor: aqiColor,
              fillOpacity: 0.5,
              aqiColor: aqiColor,
              aqiMeaning: aqiMeaning,
              aqiRisk: aqiRisk,
              pollutants: pollutants
            }).on('click', showPollutants).on('mouseover', showPollutants);

            this.createPopupCircle(circle, dataPoint.value, aqiMeaning);
            return circle;
          }
        }, {
          key: 'createPopupMarker',
          value: function createPopupMarker(marker, value) {
            var label = 'Cars: ' + value;
            marker.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            marker.on('mouseover', function onMouseOver(evt) {
              // const layer = evt.target;
              // layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              marker.on('mouseout', function onMouseOut() {
                marker.closePopup();
              });
            }
          }
        }, {
          key: 'createPopupCircle',
          value: function createPopupCircle(circle, aqi, aqiMeaning) {
            var label = ('AQI: ' + aqi + ' (' + aqiMeaning + ')').trim();
            circle.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            circle.on('mouseover', function onMouseOver(evt) {
              // const layer = evt.target;
              // layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              circle.on('mouseout', function onMouseOut() {
                circle.closePopup();
              });
            }
          }
        }, {
          key: 'createPopupPolyline',
          value: function createPopupPolyline(polyline, value) {
            var label = ('Number of cars: ' + value).trim();
            polyline.bindPopup(label, { 'offset': window.L.point(0, -2), 'className': 'worldmap-popup', 'closeButton': this.ctrl.panel.stickyLabels });

            polyline.on('mouseover', function onMouseOver(evt) {
              // const layer = evt.target;
              // layer.bringToFront();
              this.openPopup();
            });

            if (!this.ctrl.panel.stickyLabels) {
              polyline.on('mouseout', function onMouseOut() {
                polyline.closePopup();
              });
            }
          }
        }, {
          key: 'resize',
          value: function resize() {
            this.map.invalidateSize();
          }
        }, {
          key: 'panToMapCenter',
          value: function panToMapCenter() {
            this.map.panTo([parseFloat(this.ctrl.panel.mapCenterLatitude), parseFloat(this.ctrl.panel.mapCenterLongitude)]);
            this.ctrl.mapCenterMoved = false;
          }
        }, {
          key: 'removeLegend',
          value: function removeLegend() {
            this.legend.removeFrom(this.map);
            this.legend = null;
          }
        }, {
          key: 'addCircles',
          value: function addCircles(circles) {
            return window.L.layerGroup(circles).addTo(this.map);
          }
        }, {
          key: 'addMarkers',
          value: function addMarkers(markers) {
            return window.L.layerGroup(markers).addTo(this.map);
          }
        }, {
          key: 'addPolylines',
          value: function addPolylines(polylines) {
            console.log(polylines);
            return window.L.layerGroup(polylines).addTo(this.map);
          }
        }, {
          key: 'removeCircles',
          value: function removeCircles() {
            this.map.removeLayer(this.circlesLayer);
          }
        }, {
          key: 'removeMarkers',
          value: function removeMarkers() {
            this.map.removeLayer(this.markersLayer);
          }
        }, {
          key: 'removePolylines',
          value: function removePolylines() {
            this.map.removeLayer(this.polylinesLayer);
          }
        }, {
          key: 'setZoom',
          value: function setZoom(zoomFactor) {
            this.map.setZoom(parseInt(zoomFactor, 10));
          }
        }]);

        return WorldMap;
      }();

      _export('default', WorldMap);
    }
  };
});
//# sourceMappingURL=worldmap.js.map
