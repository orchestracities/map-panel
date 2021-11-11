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

If you are using Docker, the two steps above can be done as follows:
```
# First cd into this plugin's folder.
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app node:8 npm install
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app node:8 yarn install
```

## Test / Run

- Start docker-compose.

    ```sh
    $ docker-compose up -d
    ```

Once the services are up and running, set-up the data as follows:

- Populate the database:

    ```sh
    $ sh create-table.sh
    ```

- Set-up grafana:

    ```sh
    $ sh set-up-grafana.sh
    ```

**NOTE:** Unless you remove the docker volumes, you need to run the last two
steps above only the first time)

At this point in time login in grafana using admin/admin and you should be
able to see a dashboard called `Dashboard Map`. If there is an error regarding
the datasource metadata, just go to the `datasource` menu, open the datasource
and click `save & test`.

## Other Tasks

- `Compile the code` + restart grafana
```sh
$ yarn build && docker-compose restart grafana
```

Or using docker:
```
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app node:8 yarn build
docker-compose restart grafana
```

## Notes

Default start page url: http://localhost:3000
Default user/pass is admin/admin.

If you are trying to install packages and you get console permissions errors, it could be related with grafana changing owner from dist files.
