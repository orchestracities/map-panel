curl -sS -H 'Content-Type: application/json' \
  -X POST 'localhost:4200/_sql' \
  -H 'Default-Schema: doc' \
  -d '{"stmt":"drop table example;"}'

