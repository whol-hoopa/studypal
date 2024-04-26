from fastapi import FastAPI
from controllers.frontend_routes import router as frontend_router
from controllers.couchdb_routes import router as couchdb_router




# > uvicorn main:app --reload --port 8080
app = FastAPI()


app.include_router(frontend_router)

app.include_router(couchdb_router)