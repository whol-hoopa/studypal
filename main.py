from fastapi import FastAPI, Request, HTTPException
from controllers.flashcard_review_route import router_review as review_page
from controllers.flashcard_builder_route import router_builder as build_page
from controllers.statistics_route import router_stats as statistics_page
from controllers.category_route import router_category as category_page
from controllers.settings_route import router_settings as settings_page
from controllers.login_route import router_login as login_api

from controllers.couchdb_routes import router as couchdb_router


import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.templating import Jinja2Templates



# > uvicorn main:app --reload --port 8080
app = FastAPI()

pwd = os.path.dirname(__file__) # .../studypal
static_dir = os.path.join(pwd, "static") # C:\Users\User\Desktop\studypal\static
html_dir = os.path.join(static_dir, "html")
templates_dir = os.path.join(pwd, "templates")

templates = Jinja2Templates(directory=templates_dir)

# StudyPal webpage routes
# @app.get("/") # defined in main to allow: # http://localhost:8080 to render studypal.html, else requires /path_name.
# async def root(request: Request):
#     homepage = os.path.join(html_dir,'studypal.html')
    # return FileResponse(homepage)

@app.get("/", response_class=HTMLResponse) # defined in main to allow: # http://localhost:8080 to render studypal.html, else requires /path_name.
async def root(request: Request):

    message = None
    return templates.TemplateResponse('studypal.html', { "request": request, "message": message })


app.include_router(login_api, prefix='/login')


# app.include_router(review_page, prefix='/flashcard/review') # http://localhost:8080/flashcard/review/
app.include_router(build_page, prefix='/build')
app.include_router(review_page, prefix='/review')
app.include_router(statistics_page, prefix='/stats')
app.include_router(category_page, prefix='/category')
app.include_router(settings_page, prefix='/settings')

app.mount("/static", StaticFiles(directory=static_dir, html=False), name="static") # serves css & js in html[href] && html[src]


# CouchDB routes
app.include_router(couchdb_router) # , prefix='/couchdb'


# Development server
if __name__ == '__main__':
    import uvicorn

    # An attempt was made to access a socket in a way forbidden by its access permissions; must hard code port
    # from dotenv import load_dotenv
    # load_dotenv()
    # port = int(os.environ.get('PORT', 8000))

    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)

    # (studypal) PS:\Users\User\Desktop\studypal> python main.py