# Changelog

## v1.4.4
- Support for IDW Interpolation
- Update OpenLayer libraries

## v1.4.3
- community signature
- Bump follow-redirects from 1.14.5 to 1.14.8

## v1.4.2
- allow to the define colours for specific values via mappings

## v1.4.1
- fix icon visualisation in pop-up and improve pop-up format
- support label for legends
- fix color per value in geometries
- fix color for clustering

## v1.4.0
- Migrate to react for compatibility with Grafana 7+

## v1.3.1
- Map centered at location updated when changing coordinates.

## v1.3.0
- New option for centering map at user geolocation

## v1.2.0
- Suport for leaflet markercluster
- Suport for leaflet sleep to avoid auto scroll when hover big dashboards.
- Resize panel improvements for mobile.
- min zoom level set to 3.

## v1.1.0
- In the editor metrics tab, a query result can be 'format as' 'table'

## v1.0.0

### New features / Fix
- Changed the plugin's working process. Any datasource query with a group by clause will result in layers.
- Map rendering faster.
- Removal of polylines for data point of type traffic flow observed.
- Data points of type air quality, traffic flow and other have now distinct shapes (circle, square and triangle). 
- Added missing snapshot functionality (Not tested).
- New option on editor for cityenv variable support. If we choose this option the map centers on the selected city.
- Fix problem with multiple map panels in the same dashboard.
- Ability to change the icon associated to the layer (with leaflet.awesome-markers).
- When adding this panel for the first time to a dashboard, metrics are filled with predefined values.
- Dark theme improvements.

### Development
- Improvements based on grafana development guide best practices.
- New project structure. Improved DRY.
- Updated project packages. Leaflet version updated from 0.7 to 1.3.
- Updated project packages. Highcharts updated from 5.0.15 to 6.1.0.
- Fix app bugs introduced by Leaflet update.
- Gruntfile improvements.

## v0.1.0

- Project structure improvements. Leaflet and highstock went out from project src and are now a dependency.
- Support for light and dark themes.
- From now on this file contents are reverse ordered to get last features on top.

## v0.0.2

- Fixes bug where time series with a country code not found in the country data crashes the panel.
- Adds some extra country codes to the country data to be more similar to the MaxMind Country database.

## v0.0.3

- Support for lowercase country codes for non-elasticsearch datasources.

## v0.0.4

- Fixes snapshotting.

## v.0.0.5

- Adds support for json and jsonp endpoints for location data.

## v.0.0.6

- Adds decimal places option for data values in circle popovers.

## v.0.0.7

- Updates tile map urls to https to avoid mixed content warnings on https sites.

## v.0.0.8

- Saves location data in the dashboard json when snapshotting. This means snapshots should work even when using a custom endpoint for returning a location data json file.

## v.0.0.9

- Fixes bug that meant location data did not refresh after being changed in the editor. It required the page to be refreshed to reload it.

## v.0.0.10

- Performance fix for snapshotting. Sets maxdatapoints to 1 to minimize data that needs to be saved in the snapshot.

## v.0.0.11

- Zoom issue fix and adds a states options for USA states location data.

## v.0.0.12

- Fixes [issue with the JSON endpoint not working](https://github.com/grafana/worldmap-panel/issues/22)

## v.0.0.13

- New location data option -> table data. Location data can now come from data sources other than graphite and Elasticsearch (InfluxDb for example). See table data instructions above on how to use it.

## v.0.0.14

- Various [bug](https://github.com/grafana/worldmap-panel/pull/31) [fixes](https://github.com/grafana/worldmap-panel/pull/32) provided by [linkslice](https://github.com/linkslice) (Thank you!)

## v.0.0.15

- Fix for change in Grafana that [breaks Worldmap panels using Geohash or Table Data](https://github.com/grafana/worldmap-panel/issues/45).

## v.0.0.16

- Option for sticky labels. Fix for https://github.com/grafana/worldmap-panel/issues/27

- Ability to hide null or 0 values. Fix for https://github.com/grafana/worldmap-panel/issues/13

- Background color change. Fixes https://github.com/grafana/worldmap-panel/issues/36

- Dynamic thresholds implemented by [Sam Hatchett](https://github.com/samhatchett). Can now have more than 2 threshold values. Thanks! Fixes https://github.com/grafana/worldmap-panel/issues/25

- Validation and default values for option fields. Fixes https://github.com/grafana/worldmap-panel/issues/29

## v.0.0.17

- Adds Country data with 3-letter country codes.

