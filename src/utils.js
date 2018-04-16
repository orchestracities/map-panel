function showPollutants(providedPollutants, allPollutants, id, aqi, currentParameterForChart) {

  const measuresTable = document.querySelector('#measures_table > table > tbody');

  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  // Remove air paramters from dropdown
  var el = document.getElementById('airParametersDropdown');
  while ( el.firstChild ) {
    el.removeChild( el.firstChild )
  }

  // ---

  // Add default pollutant option to dropdown
/*  const defaultPollutantOption = document.createElement('option');
  const html = '<option value="0">Air Parameter</option>';

  defaultPollutantOption.innerHTML = html;
  document.getElementById('airParametersDropdown').appendChild(defaultPollutantOption);*/
  // -----

  const pollutantsToShow = {};
  for (const key in allPollutants) {
    
    allPollutants[key].forEach((_value) => {
      if (_value.id === id) {
        if (_value.value) {
          if (!(pollutantsToShow[key])){
            pollutantsToShow[key] = 0;
          }
          pollutantsToShow[key] = _value.value;
        }
      }
    });
  }

  pollutantsToShow['aqi'] = aqi;

  for (const pollutant in pollutantsToShow){
    const row = measuresTable.insertRow(0);
    //row.className = 'measure';

    const innerCell0 = providedPollutants[pollutant].name;
    const innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;

    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);


    cell0.innerHTML = innerCell0;
    cell1.innerHTML = innerCell1;

    // Add Pollutants to Chart Dropdown
    const newPollutant = document.createElement('option');

    newPollutant.id = 'pollutantOption';
    newPollutant.value = pollutant.toUpperCase();

    if(currentParameterForChart===newPollutant.value)
      newPollutant.selected = 'selected';
    
    newPollutant.innerHTML = providedPollutants[pollutant].name;

    document.getElementById('airParametersDropdown').appendChild(newPollutant);
    // ----
  }

  const mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
  const mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= 405 && mapDivWidth >= 860) {
    document.getElementById('environment_table').style.display = 'block';
    document.getElementById('measures_table').style.display = 'block';
  }
}

function showHealthConcerns(providedPollutants, risk, color, meaning) {
  const healthConcernsWrapper = document.getElementById('health_concerns_wrapper');
  const healthConcerns = document.querySelector('#health_concerns_wrapper>div');
  const healthConcernsColor = document.querySelector('#health_concerns_wrapper>div>span>span.color');
  const healthRisk = document.getElementById('health_risk');

  const mapDivHeight = document.getElementsByClassName('map-container')[0].offsetHeight;
  const mapDivWidth = document.getElementsByClassName('map-container')[0].offsetWidth;

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= 405 && mapDivWidth >= 860) {
    healthConcernsWrapper.style.display = 'block';
    healthConcernsColor.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }
}

function calculateAQI(AQI, aqi) {
  let aqiIndex;
  AQI.range.forEach((value, index) => {
    if (aqi >= value) {
      aqiIndex = index;
    }
  });
  return aqiIndex;
}

export {
  showPollutants, showHealthConcerns, calculateAQI
}