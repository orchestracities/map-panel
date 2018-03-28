function showPollutants(providedPollutants, allPollutants, id, aqi) {

  const measuresTable = document.getElementById('measures-table');

  while (measuresTable.rows[0]) measuresTable.deleteRow(0);

  // Remove air paramters from dropdown
  var el = document.getElementById('airParametersDropdown');
  while ( el.firstChild ) {
    el.removeChild( el.firstChild )
  }

  // ---

  // Add default pollutant option to dropdown
  const defaultPollutantOption = document.createElement('option');
  const html = '<option value="0" selected="selected">Air Parameter</option>';

  defaultPollutantOption.innerHTML = html;
  document.getElementById('airParametersDropdown').appendChild(defaultPollutantOption);

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
    row.className = 'measure';

    const innerCell0 = providedPollutants[pollutant].name;
    const innerCell1 = pollutantsToShow[pollutant] + ' ' + providedPollutants[pollutant].unit;

    const cell0 = row.insertCell(0);
    const cell1 = row.insertCell(1);


    cell0.innerHTML = innerCell0;
    cell1.innerHTML = innerCell1;
    cell0.className = 'cell';
    cell1.className = 'cell';

    // Add Pollutants to Chart Dropdown
    const newPollutant = document.createElement('option');

    newPollutant.id = 'pollutantOption';
    newPollutant.value = pollutant.toUpperCase();

    newPollutant.innerHTML = providedPollutants[pollutant].name;

    document.getElementById('airParametersDropdown').appendChild(newPollutant);

    // ----
  }

  const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
  const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= 405 && mapDivWidth >= 860) {
    document.getElementById('environmentTable').style.display = 'block';
    document.getElementById('measuresTable').style.display = 'block';
  }
}

function showHealthConcerns(providedPollutants, risk, color, meaning) {
  const healthConcernsWrapper = document.getElementById('healthConcernsWrapper');
  const healthConcerns = document.getElementById('healthConcerns');
  const healthRisk = document.getElementById('healthRisk');

  const mapDivHeight = document.getElementsByClassName('mapcontainer')[0].offsetHeight;
  const mapDivWidth = document.getElementsByClassName('mapcontainer')[0].offsetWidth;

  // Only show the map secundary data (tables) when the map div is not too small
  if (mapDivHeight >= 405 && mapDivWidth >= 860) {
    healthConcernsWrapper.style.display = 'block';
    healthConcerns.style.backgroundColor = color;
    healthRisk.innerHTML = risk;
  }
}


function calculateAQI(aqi) {
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