source ./config.sh

echo 'create table\n'

curl -sS -H 'Content-Type: application/json' \
  -X POST "$CRATE_URL/_sql" \
  -H 'Default-Schema: doc' \
  -d '{"stmt":"create table example ( bool boolean, address object, availablespotnumber FLOAT, entity_id STRING, entity_type STRING, fiware_servicepath  STRING, license STRING, location GEO_SHAPE, location_centroid GEO_POINT, name STRING, source STRING, status STRING, time_index TIMESTAMP, timeinstant STRING);"}'

echo '\n\ninsert data 1\n'

curl -sS -H 'Content-Type: application/json' \
  -X POST "$CRATE_URL/_sql" \
  -H 'Default-Schema: doc' \
  -d '
  {"stmt": "INSERT INTO example (bool, address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[true, {"addressCountry":"Switzerland","streetAddress":"Armin-Bollinger-Weg","addressLocality":"Zurich"}, 73, "urn:ngsi-ld:OffStreetParking:max_bill_platz", "OffStreetParking", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[[8.5379554,47.4143907],[8.5378758,47.4143952],[8.5365221,47.4144732],[8.5364455,47.4144776]],"type":"LineString"}, [8.537199699999999,47.414434175], "Parkhaus Max-Bill-Platz / Armin-Bollinger-Weg", "https://data.stadt-zuerich.ch", "open", 1551872353000, "2019-03-06T11:39:13Z"]]}'

echo '\n\ninsert data 2\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST "$CRATE_URL/_sql" \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (bool, address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[false, {"addressCountry": "Switzerland","streetAddress": "Dufourstrasse 142","addressLocality": "Zurich"},65,"urn:ngsi-ld:OffStreetParking:zuerichhorn","OffStreetParking","/ParkingManagement","https://creativecommons.org/publicdomain/zero/1.0/",{"coordinates":[[[8.5532871,47.3560349],[8.5533097,47.3560042],[8.5533122,47.3560009],[8.5535063,47.3560663],[8.5535399,47.3560206],[8.5535011,47.3560076],[8.5535323,47.355965],[8.5535761,47.3559798],[8.5535994,47.3559482],[8.5536647,47.3559702],[8.5535516,47.3561241],[ 8.5532871,47.3560349]]],"type": "Polygon"},[8.553472291666667,47.35601305833334],"Parkhaus Zurichhorn / Dufourstrasse 142","https://data.stadt-zuerich.ch","open",1552031070000,"2019-03-08T07:44:30Z"]]}'

echo '\n\ninsert data 3\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST "$CRATE_URL/_sql" \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Gloriastrasse","addressLocality":"Zurich"}, 55, "urn:ngsi-ld:OffStreetParking:unispital_sued", "OffStreetParking", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[[8.5536227,47.3770429],[8.5539427,47.3769896],[8.5543784,47.3769189]],"type":"LineString"}, [8.553981266666666,47.3769838], "Parkplatz USZ S�d / Gloriastrasse", "https://data.stadt-zuerich.ch/", "open", 1551906232000, "2019-03-06T21:03:52Z"]]}'

echo '\n\ninsert data 4\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST "$CRATE_URL/_sql" \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"N�schelerstrasse 31","addressLocality":"Zurich"}, 45, "urn:ngsi-ld:OffStreetParking:talgarten", "OffStreetParking", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[[[8.5353503,47.3724602],[8.5354002,47.3724064],[8.5354454,47.3723659],[8.535915,47.3720271],[8.5360576,47.3721039],[8.5360503,47.3721084],[8.5360682,47.3721192],[8.5356209,47.3724429],[8.5355803,47.3724762],[8.5355454,47.3725128],[8.5355045,47.3724983],[8.5353503,47.3724602]]],"type":"Polygon"}, [8.535657366666667,47.37233179166666], "Parkhaus Talgarten / N�schelerstrasse 31", "https://data.stadt-zuerich.ch/", "open", 1552158093000, "2019-03-09T19:01:33Z"]]}'

echo '\n\ninsert data 5\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST "$CRATE_URL/_sql" \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Schillerstrasse 5","addressLocality":"Zurich"}, 35, "urn:ngsi-ld:OffStreetParking:opera", "OffStreetParking", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[[[8.5457149,47.3656622],[8.546062,47.365176],[8.5468001,47.365415],[8.5469132,47.3654479],[8.5472176,47.3655636],[8.5471347,47.3656516],[8.5470483,47.3656188],[8.546679,47.3659876],[8.5457149,47.3656622]]],"type":"Polygon"}, [8.546587188888887,47.3655761], "Parkhaus Op�ra / Schillerstrasse 5", "https://data.stadt-zuerich.ch/", "open", 1551200630000, "2019-02-26T17:03:50Z"
]]}'

echo '\n\ninsert data 6\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST "$CRATE_URL/_sql" \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Schillerstrasse 5","addressLocality":"Zurich"}, 25, "urn:ngsi-ld:OffStreetParking:opera", "OffStreetParking2", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[[[8.5457149,47.3656622],[8.546062,47.265176],[8.5468001,47.365415],[8.5469132,47.3654479],[8.5472176,47.3655636],[8.5471347,47.3656516],[8.5470483,47.3656188],[8.546679,47.3659876],[8.5457149,47.3656622]]],"type":"Polygon"}, [8.546587188888887,47.3655761], "Parkhaus Op�ra / Schillerstrasse 55", "https://data.stadt-zuerich.ch/", "open", 1551200630000, "2019-02-26T17:03:50Z"
]]}'

echo '\n\ninsert data 6\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Gladbachstrasse","addressLocality":"Zurich"}, 0, "urn:ngsi-ld:OffStreetParking:Siriuswiese", "OffStreetParking", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[8.5539437,47.3797464],"type":"Point"}, [8.5539437,47.3797464], "Siriuswiese", "https://test.ch/", "open", 1551200630000, "2019-02-26T17:03:50Z"
]]}'

echo '\n\ninsert data 7\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Voltastrasse 40","addressLocality":"Zurich"}, 1, "urn:ngsi-ld:OffStreetParking:ultimobacio", "OffStreetParking", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[8.5534266,47.3791918],"type":"Point"}, [8.5534266,47.3791918], "LUltimo Bacio", "https://test/", "open", 1551200630000, "2019-02-26T17:03:50Z"
]]}'

echo '\n\ninsert data 8\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Liedenhofstrasse 4","addressLocality":"Zurich"}, 1, "urn:ngsi-ld:EVChargingStation:EVChargingStation1", "EVChargingStation", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[8.54098230600357, 47.37481948235262],"type":"Point"}, [8.54098230600357, 47.37481948235262], "EVChargingStation 1", "https://test/", "open", 1551200630000, "2019-02-26T17:03:50Z"
]]}'

echo '\n\ninsert data 9\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry":"Switzerland","streetAddress":"Liedenhofstrasse 4","addressLocality":"Zurich"}, 1, "urn:ngsi-ld:EVChargingStation:EVChargingStation2", "EVChargingStation", "/ParkingManagement", "https://creativecommons.org/publicdomain/zero/1.0/", {"coordinates":[8.54112982749939,47.37481040040007],"type":"Point"}, [8.54112982749939,47.37481040040007], "EVChargingStation 2", "https://test/", "open", 1551200630000, "2019-02-26T17:03:50Z"
]]}'

echo '\n\ninsert data 10\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry": "Switzerland","streetAddress": "Liedenhofstrasse 4","addressLocality": "Zurich"},1,"urn:ngsi-ld:OffStreetParking:l1","OffStreetParking","/ParkingManagement","https://creativecommons.org/publicdomain/zero/1.0/",{"coordinates":[
          [
            [
              8.54087769985199,
              47.374832197083556
            ],
            [
              8.540968894958496,
              47.374826747913545
            ],
            [
              8.5409876704216,
              47.3749084854048
            ],
            [
              8.540893793106079,
              47.37491575095346
            ],
            [
              8.54087769985199,
              47.374832197083556
            ]
          ]
        ],"type": "Polygon"},[8.54087769985199,47.374832197083556],"Random Test in Zurich","https://test.ch","open",1552031070000,"2019-03-08T07:44:30Z"]]}'

echo '\n\ninsert data 11\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry": "Switzerland","streetAddress": "Liedenhofstrasse 4","addressLocality": "Zurich"},1,"urn:ngsi-ld:OffStreetParking:l2","OffStreetParking","/ParkingManagement","https://creativecommons.org/publicdomain/zero/1.0/",{"coordinates":[
          [
            [
              8.541017174720764,
              47.37482493152339
            ],
            [
              8.5411137342453,
              47.37481766596224
            ],
            [
              8.54112982749939,
              47.37489758707997
            ],
            [
              8.541038632392883,
              47.3749048526301
            ],
            [
              8.541017174720764,
              47.37482493152339
            ]
          ]
        ],"type": "Polygon"},[8.541038632392883,47.3749048526301],"Random Test in Zurich","https://test.ch","open",1552031070000,"2019-03-08T07:44:30Z"]]}'

echo '\n\ninsert data 12\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry": "Switzerland","streetAddress": "Liedenhofstrasse 4","addressLocality": "Zurich"},1,"urn:ngsi-ld:OffStreetParking:l3","OffStreetParking","/ParkingManagement","https://creativecommons.org/publicdomain/zero/1.0/",{"coordinates":[
          [
            [
              8.540861606597899,
              47.374719580788586
            ],
            [
              8.540947437286377,
              47.37471594800088
            ],
            [
              8.540960848331451,
              47.37480131844597
            ],
            [
              8.540880382061005,
              47.374808584009386
            ],
            [
              8.540861606597899,
              47.374719580788586
            ]
          ]
        ],"type": "Polygon"},[8.540960848331451,47.37480131844597],"Random Test in Zurich","https://test.ch","open",1552031070000,"2019-03-08T07:44:30Z"]]}'

echo '\n\ninsert data 12\n'

  curl -sS -H 'Content-Type: application/json' \
    -X POST 'localhost:4200/_sql' \
    -H 'Default-Schema: doc' \
    -d '{"stmt": "INSERT INTO example (address,availablespotnumber,entity_id,entity_type,fiware_servicepath,license,location,location_centroid,name,source,status,time_index,timeinstant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "bulk_args": [[{"addressCountry": "Switzerland","streetAddress": "Liedenhofstrasse 4","addressLocality": "Zurich"},1,"urn:ngsi-ld:OffStreetParking:l4","OffStreetParking","/ParkingManagement","https://creativecommons.org/publicdomain/zero/1.0/",{"coordinates":[
          [
            [
              8.54099839925766,
              47.37471231521293
            ],
            [
              8.541092276573181,
              47.374708682424696
            ],
            [
              8.5411137342453,
              47.374799502054955
            ],
            [
              8.541017174720764,
              47.37480131844597
            ],
            [
              8.54099839925766,
              47.37471231521293
            ]
          ]
        ],"type": "Polygon"},[8.541092276573181,47.374708682424696],"Random Test in Zurich","https://test.ch","open",1552031070000,"2019-03-08T07:44:30Z"]]}'


echo '\n\ndone\n'



