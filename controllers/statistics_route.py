import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
# from fastapi import Request
# from fastapi.responses import HTMLResponse


router_stats = APIRouter()
pwd = os.path.dirname(__file__)
cd_to_html_dir = os.path.join(pwd, r"..\static\html") # ...\controllers\..\static\html (relative path)
html_dir = os.path.abspath(cd_to_html_dir)


@router_stats.get('/', tags=['stats']) # http://localhost:8080/stats/
async def statistics():
    stats_page = os.path.join(html_dir, "statistics.html")
    return FileResponse(stats_page)