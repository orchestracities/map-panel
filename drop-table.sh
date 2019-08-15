source config.sh

curl -sS -H 'Content-Type: application/json' \
  -X POST "$CRATE_URL/_sql" \
  -H 'Default-Schema: doc' \
  -d '{"stmt":"drop table example;"}'
