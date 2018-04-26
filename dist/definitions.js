'use strict';

System.register(['./vendor/leaflet/leaflet'], function (_export, _context) {
  "use strict";

  var L, PLUGIN_PATH, AQI, CARS_COUNT, HIGHCHARTS_THEME_DARK, tileServers, carMarker, panelDefaults, mapCenters, MIN_WIDTH_TO_SHOW_MAP_POPUPS, MIN_HEIGHT_TO_SHOW_MAP_POPUPS, nominatim_address;
  return {
    setters: [function (_vendorLeafletLeaflet) {
      L = _vendorLeafletLeaflet.default;
    }],
    execute: function () {
      _export('PLUGIN_PATH', PLUGIN_PATH = 'public/plugins/grafana-traffic-env-panel/');

      _export('AQI', AQI = {
        'range': [0, 50, 100, 150, 200, 300, 500],
        'meaning': ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
        'color': ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023'],
        'risks': ['Air quality is considered satisfactory, and air pollution poses little or no risk.', 'Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.', 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.', 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.', 'Health alert: everyone may experience more serious health effects.', 'Health warnings of emergency conditions. The entire population is more likely to be affected.']
      });

      _export('CARS_COUNT', CARS_COUNT = {
        'range': [0, 15, 30, 45, 70, 85, 100],
        'color': ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97', '#7e0023']
      });

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

      _export('tileServers', tileServers = {
        'CartoDB Positron': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' },
        'CartoDB Dark': { url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>', subdomains: 'abcd' }
      });

      _export('carMarker', carMarker = window.L.icon({
        iconUrl: 'img/map_marker.png',
        iconSize: [25, 40]
      }));

      _export('panelDefaults', panelDefaults = {
        maxDataPoints: 1,
        mapCenter: '(0°, 0°)',
        mapCenterLatitude: 0,
        mapCenterLongitude: 0,
        initialZoom: 1,
        valueName: 'total',
        circleMinSize: 2,
        circleMaxSize: 30,
        thresholds: '0,10',
        colors: ['rgba(245, 54, 54, 0.9)', 'rgba(237, 129, 40, 0.89)', 'rgba(50, 172, 45, 0.97)'],
        unitSingle: '',
        unitPlural: '',
        showLegend: true,
        esMetric: 'Count',
        decimals: 0,
        hideEmpty: false,
        hideZero: false,
        stickyLabels: false,

        resources: {
          airQualityObserved: {
            pollutants: '{}'
          }
        }
      });

      _export('mapCenters', mapCenters = {
        '(0°, 0°)': { mapCenterLatitude: 0.0, mapCenterLongitude: 0.0 },
        'North America': { mapCenterLatitude: 40, mapCenterLongitude: -100 },
        'Europe': { mapCenterLatitude: 46, mapCenterLongitude: 14 },
        'West Asia': { mapCenterLatitude: 26, mapCenterLongitude: 53 },
        'SE Asia': { mapCenterLatitude: 10, mapCenterLongitude: 106 }
      });

      _export('MIN_WIDTH_TO_SHOW_MAP_POPUPS', MIN_WIDTH_TO_SHOW_MAP_POPUPS = 840);

      _export('MIN_HEIGHT_TO_SHOW_MAP_POPUPS', MIN_HEIGHT_TO_SHOW_MAP_POPUPS = 480);

      _export('nominatim_address', nominatim_address = 'https://nominatim.openstreetmap.org/search/<city_name>?format=json&addressdetails=1&limit=1&polygon_svg=1');

      _export('PLUGIN_PATH', PLUGIN_PATH);

      _export('AQI', AQI);

      _export('CARS_COUNT', CARS_COUNT);

      _export('HIGHCHARTS_THEME_DARK', HIGHCHARTS_THEME_DARK);

      _export('tileServers', tileServers);

      _export('carMarker', carMarker);

      _export('panelDefaults', panelDefaults);

      _export('mapCenters', mapCenters);

      _export('MIN_WIDTH_TO_SHOW_MAP_POPUPS', MIN_WIDTH_TO_SHOW_MAP_POPUPS);

      _export('MIN_HEIGHT_TO_SHOW_MAP_POPUPS', MIN_HEIGHT_TO_SHOW_MAP_POPUPS);

      _export('nominatim_address', nominatim_address);
    }
  };
});
//# sourceMappingURL=definitions.js.map
