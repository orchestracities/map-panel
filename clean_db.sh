#bash
source ./config.sh

echo 'clean cratedb'
curl -sS -H 'Content-Type: application/json' \
  -X POST "$CRATE_URL/_sql" \
  -H 'Default-Schema: doc' \
  -d '{"stmt":"drop table example;"}'

echo 'clean timescaledb'
docker exec -ti map-panel-timescale-1 dropdb ecom -U postgres