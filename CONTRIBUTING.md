# Building Map Plugin

## Requirements
- git
- npm / yarn

## Install process

- Clone "map-plugin" from repo to the grafana plugins folder. (eg. grafana_data/plugins)

- Install plugin package dependencies

```sh
$ npm install
```
or
```
$ yarn install
```

## Test / Run

- clone the crated data source.

    ```sh
    $ sh get-crate-plugin.sh
    ```

- Start docker-compose.

    ```sh
    $ docker-compose up -d
    ```

(unless you remove the docker volumes, you need to run the following steps only
the first time)

- Populate the database:

    ```sh
    $ sh create-table.sh
    ```

- Set-up grafana:

    ```sh
    $ sh set-up-grafana.sh
    ```

## Other Tasks

- `Compile the code` + restart grafana
```sh
$ yarn build && docker-compose restart grafana
```

## Notes

Default start page url: http://localhost:3000
Default user is admin.

If you are trying to install packages and you get console permissions errors, it could be related with grafana changing owner from dist files.
