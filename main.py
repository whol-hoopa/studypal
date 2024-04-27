from fastapi import FastAPI, Request, HTTPException
from controllers.flashcard_review_route import router_review as review_page
from controllers.flashcard_builder_route import router_builder as build_page
from controllers.statistics_route import router_stats as statistics_page
from controllers.category_route import router_category as category_page
from controllers.settings_route import router_settings as settings_page

from controllers.couchdb_routes import router as couchdb_router

from models.auth import User
from pydantic import ValidationError
from models.hash import hashPwd

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

# > uvicorn main:app --reload --port 8080
app = FastAPI()

pwd = os.path.dirname(__file__) # .../studypal
static_dir = os.path.join(pwd, "static") # C:\Users\User\Desktop\studypal\static
html_dir = os.path.join(static_dir, "html")
# templates_dir = os.path.join(pwd, "templates")

# StudyPal webpage routes
@app.get("/") # defined in main to allow: # http://localhost:8080 to render studypal.html, else requires /path_name.
async def root():
    homepage = os.path.join(html_dir,'studypal.html')
    return FileResponse(homepage)

@app.post("/login", response_class=HTMLResponse)
async def login(request:Request):
    print('AUTHENTICATION REQUEST')
    # print(request.headers)
    credentials = await request.json()
    # try:
    user = User(**credentials)
    print(user)
    print(user.email)
    print(hashPwd(user.password))

    # except ValidationError as e:
    #     raise HTTPException(status_code=400, detail='Invalid email address.')


    return "<h1 class='text-success'>Welcome to Study<span class='outlined-text'>Pal</span></h1><p>You are official! Have a great session!!</p>"


# app.include_router(review_page, prefix='/flashcard/review') # http://localhost:8080/flashcard/review/
app.include_router(build_page, prefix='/build')
app.include_router(review_page, prefix='/review')
app.include_router(statistics_page, prefix='/stats')
app.include_router(category_page, prefix='/category')
app.include_router(settings_page, prefix='/settings')

app.mount("/static", StaticFiles(directory=static_dir, html=False), name="static") # serves css & js in html[href] && html[src]


# CouchDB routes
app.include_router(couchdb_router, prefix='/couchdb')


# Development server
if __name__ == '__main__':
    import uvicorn

    uvicorn.run('main:app', host='127.0.0.1', port=8080, reload=True)

    # (studypal) PS:\Users\User\Desktop\studypal> python main.py