# Building WorldMap

## Requirements
- git
- npm / yarn

## Install process

- Clone "map-plugin" from repo to the grafana plugins folder. (eg. grafana_data/plugins)

- Install plugin package dependencies

```sh
(...)/grafana_data/plugins/map-plugin (develop)$ npm install
```
or
```
(...)/grafana_data/plugins/map-plugin (develop)$ yarn install
```

## Test / Run

- Start kubectl. Don't forget to specify your config location if you don't have a default definition (docker-compose.yml).
```sh
kubectl [--kubeconfig <path to config file>] port-forward --namespace prod crate-0 4200:4200
```

- Start docker-compose.
```sh
(...)/grafana_data/plugins/grafana_status_panel (master)$ docker-compose start grafana
```


## Other Tasks

Compiles the code + restart grafana
```sh
$ grunt && docker-compose restart grafana
```

## Notes

Default start page url: http://localhost:3000
Default user is admin.

If you are trying to install packages and you get console permitions errors, it could be because grafana is changing owner from dist files.

Grafana will read in the dist folder first so to see your changes to WorldMap in Grafana, you have to run Grunt. However, you do not need to restart your local Grafana server after every change; just refresh the page.
