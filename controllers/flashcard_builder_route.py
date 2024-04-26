import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
# from fastapi import Request
# from fastapi.responses import HTMLResponse


router_builder = APIRouter()
pwd = os.path.dirname(__file__)
cd_to_html_dir = os.path.join(pwd, r"..\static\html") # ...\controllers\..\static\html (relative path)
html_dir = os.path.abspath(cd_to_html_dir)


# @router.get('/', tags=['flashcard/build']) # http://localhost:8080/flashcard/build/

@router_builder.get('/', tags=['build']) # http://localhost:8080/build/
async def flashcard_build():
    build_page = os.path.join(html_dir, "flashcard-builder.html")
    return FileResponse(build_page)