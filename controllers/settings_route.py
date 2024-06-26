import os
from fastapi import APIRouter#, HTTPException, status
from fastapi.responses import FileResponse#, RedirectResponse
# from fastapi.responses import HTMLResponse
from fastapi import Request#, Response
from fastapi.templating import Jinja2Templates

from models.jwt import is_valid_token, is_expired
from models.jwt import get_token_from_request

import os


router_settings = APIRouter()
pwd = os.path.dirname(__file__) # \settings
cd_to_templates=os.path.join(pwd, r"..\templates")
cd_to_html_dir = os.path.join(pwd, r"..\static\html") # ...\controllers\..\static\html (relative path)
html_dir = os.path.abspath(cd_to_html_dir)
templates_dir = os.path.abspath(cd_to_templates)
templates = Jinja2Templates(directory=templates_dir)


@router_settings.get('/', tags=['settings']) # http://localhost:8080/settings/
async def settings(request: Request):
    print('settings queried.')

    token=get_token_from_request(request)

    if token and is_valid_token(token) and not is_expired(token):
        settings_page = os.path.join(html_dir, "settings.html")
        return FileResponse(settings_page)

    message={
        "h1":"Authorization Error",
        "p": "Please login to access page."
    }
    print(request.headers)
    return  templates.TemplateResponse('studypal.html', { "request": request, "message": message})


