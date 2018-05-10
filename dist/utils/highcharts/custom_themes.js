'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var HIGHCHARTS_THEME_DARK;
  return {
    setters: [],
    execute: function () {
      _export('HIGHCHARTS_THEME_DARK', HIGHCHARTS_THEME_DARK = {
        colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee', '#55bf3b', '#df5353', '#7798bf', '#aaeeee'],
        chart: {
          backgroundColor: '#262629',
          // {
          //   linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
          //   stops: [
          //     [0, '#3e3e40'], [1, '#2a2a2b']
          //   ]
          // },
          style: {
            fontFamily: '\'Unica One\', sans-serif'
          },
          plotBorderColor: '#606063'
        },
        title: {
          style: {
            color: '#e0e0e3',
            // textTransform: 'uppercase',
            fontSize: '20px'
          }
        },
        subtitle: {
          style: {
            color: '#e0e0e3',
            textTransform: 'uppercase'
          }
        },
        xAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
              color: '#e0e0e3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          title: {
            style: {
              color: '#a0a0a3'
            }
          }
        },
        yAxis: {
          gridLineColor: '#707073',
          labels: {
            style: {
              color: '#e0e0e3'
            }
          },
          lineColor: '#707073',
          minorGridLineColor: '#505053',
          tickColor: '#707073',
          tickWidth: 1,
          title: {
            style: {
              color: '#a0a0a3'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          style: {
            color: '#f0f0f0'
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
            color: '#e0e0e3'
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

        // drilldown: {
        //   activeAxisLabelStyle: {
        //     color: '#f0f0f3'
        //   },
        //   activeDataLabelStyle: {
        //     color: '#f0f0f3'
        //   }
        // },

        navigation: {
          buttonOptions: {
            symbolStroke: '#ddd',
            theme: {
              fill: '#505053'
            }
          }
        },

        /* scroll charts, zoom */
        // rangeSelector: {
        //   buttonTheme: {
        //     fill: '#505053',
        //     stroke: '#000000',
        //     style: {
        //       color: '#ccc'
        //     },
        //     states: {
        //       hover: {
        //         fill: '#707073',
        //         stroke: '#000000',
        //         style: {
        //           color: 'white'
        //         }
        //       },
        //       select: {
        //         fill: '#000003',
        //         stroke: '#000000',
        //         style: {
        //           color: 'white'
        //         }
        //       }
        //     }
        //   },

        //   inputBoxBorderColor: '#505053',
        //   inputStyle: {
        //     backgroundColor: '#333',
        //     color: 'silver'
        //   },
        //   labelStyle: {
        //     color: 'silver'
        //   }
        // },
        rangeSelector: {
          enabled: false
        },

        navigator: {
          enabled: false
        },

        scrollbar: {
          barBackgroundColor: '#808083',
          barBorderColor: '#808083',
          buttonArrowColor: '#ccc',
          buttonBackgroundColor: '#606063',
          buttonBorderColor: '#606063',
          rifleColor: '#fff',
          trackBackgroundColor: '#404043',
          trackBorderColor: '#404043'
        },

        // special colors for some of the
        legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
        background2: '#505053',
        dataLabelsColor: '#b0b0b3',
        textColor: '#c0c0c0',
        contrastTextColor: '#f0f0f3',
        maskColor: 'rgba(255,255,255,0.3)'
      });

      _export('HIGHCHARTS_THEME_DARK', HIGHCHARTS_THEME_DARK);
    }
  };
});
//# sourceMappingURL=custom_themes.js.map
