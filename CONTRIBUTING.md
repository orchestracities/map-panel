# Building Map Plugin

## Requirements
- git
- node v14+ and yarn

## Install process

- Clone "map-plugin" from repo to the grafana plugins folder. (eg. grafana_data/plugins)

- Install plugin package dependencies

```
$ yarn install
```

If you are using Docker, the two steps above can be done as follows:
```
# First cd into this plugin's folder.
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app node:14 yarn install
```

## Build process

1. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn dev --watch
   ```

2. Build plugin in production mode

   ```bash
   yarn build
   ```

## Test / Run

1. Launch services

    ```bash
    docker-compose up -d
    ```

2. Import database

    ```bash
    sh populate_db.sh
    ```

3. Set-up grafana

    ```bash
    sh set-up-grafana.sh
    ```

4. In case of changes to code to restart grafana

    ```bash
    yarn dev && docker-compose restart grafana
    ```

**NOTE:** Unless you remove the docker volumes, you need to run the last two
steps above only the first time)

At this point in time login in grafana using admin/admin and you should be
able to see a dashboard called `Dashboard Map`.


## Other Tasks

- `Compile the code` + restart grafana
```sh
$ yarn dev && docker-compose restart grafana
```

Or using docker:
```
docker run -it --rm -v "$PWD":/usr/src/app -w /usr/src/app node:14 yarn build
docker-compose restart grafana
```

## Notes

Default start page url: http://localhost:3000
Default user/pass is admin/admin.
