import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
# from fastapi import Request
# from fastapi.responses import HTMLResponse 


router_category = APIRouter()
pwd = os.path.dirname(__file__)
cd_to_html_dir = os.path.join(pwd, r"..\static\html") # ...\controllers\..\static\html (relative path)
html_dir = os.path.abspath(cd_to_html_dir)


@router_category.get('/', tags=['category']) # http://localhost:8080/category/
async def category():
    category_page = os.path.join(html_dir, "tags.html")
    print(category_page)
    return FileResponse(category_page)