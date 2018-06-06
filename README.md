# Grafana Map Plugin

Map views of your datasources.

## Install process

- Clone "map-plugin" from repo to the grafana plugins folder.

- Install plugin package dependencies

```sh
$ npm install
```

## Test / Run

- Start kubectl. Don't forget to specify your config location if you don't have a default.
```sh
kubectl [--kubeconfig <path to config file> port-forward] --namespace prod crate-0 4200:4200
```

- Start docker-compose.
```sh
(...)/grafana_data/plugins/grafana_status_panel (master)$ docker-compose start grafana
```


## Other Tasks

Compiles the code to the vendor folder
```sh
$ grunt
```

```
$ npm run build
$ npm run build:watch
```