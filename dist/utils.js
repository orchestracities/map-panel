'use strict';

System.register([], function (_export, _context) {
  "use strict";

  function showPollutants(providedPollutants, allPollutants, id, aqi, currentParameterForChart) {

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
    /*  const defaultPollutantOption = document.createElement('option');
      const html = '<option value="0">Air Parameter</option>';
    
      defaultPollutantOption.innerHTML = html;
      document.getElementById('airParametersDropdown').appendChild(defaultPollutantOption);*/
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
      //row.className = 'measure';

      var innerCell0 = providedPollutants[pollutant].name;
      var innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;

      var cell0 = row.insertCell(0);
      var cell1 = row.insertCell(1);

      cell0.innerHTML = innerCell0;
      cell1.innerHTML = innerCell1;

      // Add Pollutants to Chart Dropdown
      var newPollutant = document.createElement('option');

      newPollutant.id = 'pollutantOption';
      newPollutant.value = pollutant.toUpperCase();

      if (currentParameterForChart === newPollutant.value) newPollutant.selected = 'selected';

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
      _export('showPollutants', showPollutants);

      _export('showHealthConcerns', showHealthConcerns);

      _export('calculateAQI', calculateAQI);
    }
  };
});
//# sourceMappingURL=utils.js.map
