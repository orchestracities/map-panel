'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var HIGHCHARTS_THEME_DARK;


  function showPollutants(providedPollutants, allPollutants, id, aqi) {

    var measuresTable = document.querySelector('#measures_table > table > tbody');

    while (measuresTable.rows[0]) {
      measuresTable.deleteRow(0);
    } // Remove air paramters from dropdown
    var el = document.getElementById('airParametersDropdown');
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    // ---

    // Add default pollutant option to dropdown
    var defaultPollutantOption = document.createElement('option');
    var html = '<option value="0" selected="selected">Air Parameter</option>';

    defaultPollutantOption.innerHTML = html;
    document.getElementById('airParametersDropdown').appendChild(defaultPollutantOption);

    // -----


    var pollutantsToShow = {};

    var _loop = function _loop(key) {

      allPollutants[key].forEach(function (_value) {
        if (_value.id === id) {
          if (_value.value) {
            if (!pollutantsToShow[key]) {
              pollutantsToShow[key] = 0;
            }
            pollutantsToShow[key] = _value.value;
          }
        }
      });
    };

    for (var key in allPollutants) {
      _loop(key);
    }

    pollutantsToShow['aqi'] = aqi;

    for (var pollutant in pollutantsToShow) {
      var row = measuresTable.insertRow(0);
      /*    row.className = 'measure';*/

      var innerCell0 = providedPollutants[pollutant].name;
      var innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;

      var cell0 = row.insertCell(0);
      var cell1 = row.insertCell(1);

      cell0.innerHTML = innerCell0;
      cell1.innerHTML = innerCell1;
      /*    cell0.className = 'cell';
          cell1.className = 'cell';*/

      // Add Pollutants to Chart Dropdown
      var newPollutant = document.createElement('option');

      newPollutant.id = 'pollutantOption';
      newPollutant.value = pollutant.toUpperCase();

      newPollutant.innerHTML = providedPollutants[pollutant].name;

      document.getElementById('airParametersDropdown').appendChild(newPollutant);

      // ----
    }

    var mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
    var mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      document.getElementById('environment_table').style.display = 'block';
      document.getElementById('measures_table').style.display = 'block';
    }
  }

  function showHealthConcerns(providedPollutants, risk, color, meaning) {
    var healthConcernsWrapper = document.getElementById('health_concerns_wrapper');
    var healthConcerns = document.querySelector('#health_concerns_wrapper>div');
    var healthConcernsColor = document.querySelector('#health_concerns_wrapper>div>span>span.color');
    var healthRisk = document.getElementById('health_risk');

    var mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
    var mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

    // Only show the map secundary data (tables) when the map div is not too small
    if (mapDivHeight >= 405 && mapDivWidth >= 860) {
      healthConcernsWrapper.style.display = 'block';
      healthConcernsColor.style.backgroundColor = color;
      healthRisk.innerHTML = risk;
    }
  }

  function calculateAQI(AQI, aqi) {
    var aqiIndex = void 0;
    AQI.range.forEach(function (value, index) {
      if (aqi >= value) {
        aqiIndex = index;
      }
    });
    return aqiIndex;
  }

  return {
    setters: [],
    execute: function () {
      _export('HIGHCHARTS_THEME_DARK', HIGHCHARTS_THEME_DARK = {
        colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
        chart: {
          backgroundColor: {
            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
            stops: [[0, '#2a2a2b'], [1, '#3e3e40']]
          },
          style: {
            fontFamily: '\'Unica One\', sans-serif'
          },
          plotBorderColor: '#606063'
        },
        title: {
          style: {
            color: '#E0E0E3',
            // textTransform: 'uppercase',
            fontSize: '20px'
          }
        },
        subtitle: {
          style: {
            color: '#E0E0E3',
            textTransform: 'uppercase'
          }
        },
        xAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
              color: '#E0E0E3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          title: {
            style: {
              color: '#A0A0A3'

            }
          }
        },
        yAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
              color: '#E0E0E3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          tickWidth: 1,
          title: {
            style: {
              color: '#A0A0A3'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          style: {
            color: '#F0F0F0'
          }
        },
        plotOptions: {
          series: {
            dataLabels: {
              color: '#B0B0B3'
            },
            marker: {
              lineColor: '#333'
            }
          },
          boxplot: {
            fillColor: '#505053'
          },
          candlestick: {
            lineColor: 'white'
          },
          errorbar: {
            color: 'white'
          }
        },
        legend: {
          itemStyle: {
            color: '#E0E0E3'
          },
          itemHoverStyle: {
            color: '#FFF'
          },
          itemHiddenStyle: {
            color: '#606063'
          }
        },
        credits: {
          style: {
            color: '#666'
          }
        },
        labels: {
          style: {
            color: '#707073'
          }
        },

        drilldown: {
          activeAxisLabelStyle: {
            color: '#F0F0F3'
          },
          activeDataLabelStyle: {
            color: '#F0F0F3'
          }
        },

        navigation: {
          buttonOptions: {
            symbolStroke: '#DDDDDD',
            theme: {
              fill: '#505053'
            }
          }
        },

        // scroll charts
        rangeSelector: {
          buttonTheme: {
            fill: '#505053',
            stroke: '#000000',
            style: {
              color: '#CCC'
            },
            states: {
              hover: {
                fill: '#707073',
                stroke: '#000000',
                style: {
                  color: 'white'
                }
              },
              select: {
                fill: '#000003',
                stroke: '#000000',
                style: {
                  color: 'white'
                }
              }
            }
          },
          inputBoxBorderColor: '#505053',
          inputStyle: {
            backgroundColor: '#333',
            color: 'silver'
          },
          labelStyle: {
            color: 'silver'
          }
        },

        navigator: {
          handles: {
            backgroundColor: '#666',
            borderColor: '#AAA'
          },
          outlineColor: '#CCC',
          maskFill: 'rgba(255,255,255,0.1)',
          series: {
            color: '#7798BF',
            lineColor: '#A6C7ED'
          },
          xAxis: {
            gridLineColor: '#505053'
          }
        },

        scrollbar: {
          barBackgroundColor: '#808083',
          barBorderColor: '#808083',
          buttonArrowColor: '#CCC',
          buttonBackgroundColor: '#606063',
          buttonBorderColor: '#606063',
          rifleColor: '#FFF',
          trackBackgroundColor: '#404043',
          trackBorderColor: '#404043'
        },

        // special colors for some of the
        legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        background2: '#505053',
        dataLabelsColor: '#B0B0B3',
        textColor: '#C0C0C0',
        contrastTextColor: '#F0F0F3',
        maskColor: 'rgba(255,255,255,0.3)'
      });

      _export('showPollutants', showPollutants);

      _export('showHealthConcerns', showHealthConcerns);

      _export('calculateAQI', calculateAQI);

      _export('HIGHCHARTS_THEME_DARK', HIGHCHARTS_THEME_DARK);
    }
  };
});
//# sourceMappingURL=utils.js.map
