from fastapi import FastAPI
from controllers.flashcard_review_route import router_review as review_page
from controllers.flashcard_builder_route import router_builder as build_page
from controllers.statistics_route import router_stats as statistics_page
from controllers.category_route import router_category as category_page
from controllers.settings_route import router_settings as settings_page

from controllers.couchdb_routes import router as couchdb_router

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# > uvicorn main:app --reload --port 8080
app = FastAPI()

pwd = os.path.dirname(__file__) # .../controllers
static_dir = os.path.join(pwd, "static") # C:\Users\User\Desktop\studypal\static
html_dir = os.path.join(static_dir, "html")
templates_dir = os.path.join(pwd, "templates")
# homepage = os.path.join(static_dir, "\html\studypal.html")
# print(static_dir)
# print(html_dir)
# print(templates_dir)



@app.get("/") # defined in main to allow: # http://localhost:8080 to render index.html, else requires /path_name.
async def root():
    homepage = os.path.join(html_dir,'studypal.html')
    return FileResponse(homepage)

# app.include_router(review_page, prefix='/flashcard/review') # http://localhost:8080/flashcard/review/
app.include_router(build_page, prefix='/build')
app.include_router(review_page, prefix='/review')
app.include_router(statistics_page, prefix='/stats')
app.include_router(category_page, prefix='/category')
app.include_router(settings_page, prefix='/settings')

app.mount("/static", StaticFiles(directory=static_dir), name="static") # serves css & js in html[href] && html[src]





app.include_router(couchdb_router, prefix='/couchdb')