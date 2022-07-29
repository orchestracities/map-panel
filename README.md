# Orchestra Cities - Map Panel
This plugin extends [Grafana Geomap](https://grafana.com/docs/grafana/latest/visualizations/geomap/)
panel with several functionalities:

* Support for GeoJSON shapes
* Support for icons (icons supported are from [FontAwesome](https://fontawesome.com/))
* Support for pop up visualizations of data from a specific point
* Multiple layers for the different queries
* A new map layer leveraging [Inverse distance weighting](https://en.wikipedia.org/wiki/Inverse_distance_weighting)
  (IDW) interpolation for scattered data points using Shepard's method.

![Marker layer](https://github.com/orchestracities/grafana-map-plugin/raw/master/example.png)

![IDW layer](https://github.com/orchestracities/grafana-map-plugin/raw/master/example4.png)


New customization options available for the markers layer:

* Cluster support with a lot of customization like distance and value to display
* A fully customizable pin with the possibility to change colors, shapes and sizes
* The possibility to select which properties to be displayed on the popup

![Marker layer options](https://github.com/orchestracities/grafana-map-plugin/raw/master/example2.png)

Cluster options:

* Distance
* Min distance

Pin Options:

* Shape
* Size
* Customizable icon
* Shadow
* Gradient

Popup Options:

* Display a title
* Display the Timestamp
* Selectable properties

![Marker layer options](https://github.com/orchestracities/grafana-map-plugin/raw/master/example3.png)

Options available for the IDW layer:

IDW options:

* Weight value to be used to create the interpolation,
  including min and max range
* Scale factor of the precision of the interpolation
* Show data values over the map

Pupup Options:

* Display a title
* Display the Timestamp
* Selectable properties


![Marker layer options](https://github.com/orchestracities/grafana-map-plugin/raw/master/example5.png)

It requires Grafana >=8.2.0

## Usage with PostGis

To use the plugin with PostGis, you need either to query longitude and latitude from a stored `Point`, e.g.:
* `ST_X(ST_GeomFromEWKT(location_centroid)) AS \"longitude\"`
* `ST_Y(ST_GeomFromEWKT(location_centroid)) AS \"latitude\"`

Or query the GeoJSON shape, e.g.:
* `ST_AsGeoJSON(ST_GeomFromEWKT(location)) AS \"geojson\"`

## Usage with CrateDB

To use the plugin with CrateDB, you need either to query longitude and latitude from a stored `Point`, e.g.:
* `longitude(location_centroid) AS \"longitude\"`
* `latitude(location_centroid) AS \"latitude\"`

Or query the GeoJSON field, e.g.:
* `location AS \"geojson\"`

## What is a Grafana Panel Plugin?

Panels are the building blocks of Grafana. They allow you to visualize data in different ways. While Grafana has several types of panels already built-in, you can also build your own panel, to add support for other visualizations.

For more information about panels, refer to the documentation on [Panels](https://grafana.com/docs/grafana/latest/features/panels/panels/)

## Set up dev environment

See [Contributing](https://github.com/orchestracities/grafana-map-plugin/blob/master/CONTRIBUTING.md)
