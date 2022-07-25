#bash
echo 'populate timescale db'
docker exec -ti grafana-map-plugin_timescale_1 createdb ecom -U postgres
docker exec -ti grafana-map-plugin_timescale_1 psql -U postgres --dbname ecom -f /db-init/ekz-airquality-import.sql
echo 'populate crate db'
source ./db-init/create-table.sh
