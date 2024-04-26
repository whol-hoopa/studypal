pip install -r "requirements.txt"
docker create --name studypal -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password couchdb:3.3.3
docker start studypal
uvicorn main:app --reload --port 8080