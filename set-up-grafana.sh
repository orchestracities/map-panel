for i in data_sources/*; do \
    curl -X "POST" "http://localhost:3000/api/datasources" \
    -H "Content-Type: application/json" \
     --user admin:admin \
     --data-binary @$i
done

for i in dashboards/*; do \
    curl -X "POST" "http://localhost:3000/api/dashboards/db" \
    -H "Content-Type: application/json" \
     --user admin:admin \
     --data-binary @$i
done
