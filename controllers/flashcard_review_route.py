import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
# from fastapi import Request
# from fastapi.responses import HTMLResponse

router_review = APIRouter()
pwd = os.path.dirname(__file__)
cd_to_static_dir = os.path.join(pwd, r"..\static")
static_dir = os.path.abspath(cd_to_static_dir)
cd_to_html_dir = os.path.join(pwd, r"..\static\html")
html_dir = os.path.abspath(cd_to_html_dir)
print(static_dir)


# @router.get('/', tags=['flashcard/review']) # http://localhost:8080/flashcard/review/

@router_review.get('/', tags=['review']) # http://localhost:8080/review/
async def flashcard_review():
    review_page = os.path.join(html_dir, "flashcard-review.html")
    return FileResponse(review_page)






# serve static files: html, css, js
# pwd = os.path.dirname(__file__) # .../controllers
# cd_to_parent_dir = os.path.join(pwd, r"..\static") # ...\controllers\..\static
# root_dir = os.path.abspath(cd_to_parent_dir) # C:\Users\User\Desktop\studypal\static
# router.mount("/static", StaticFiles(directory=root_dir), name="static") # works to send all files mounted under path.
# print(pwd)
# print(root_dir)

# functional routes:
# http://localhost:8080/studypal.html # was index.html; http://localhost:8080/ didn't work, http://localhost:8080/index.html is not desireable. 
# http://localhost:8080/flashcard-builder.html
# http://localhost:8080/flashcard-review.html



















# METHOD 1: probably need a redirect from http://localhost:8080/   ===>   http://localhost:8080/studypal.html
# @studypal_backend.get('/')
# async def root():
#     print('hello world')
#     # http://localhost:8080/ is not serving file as expected
#     # http://localhost:8080/index.html this works, but not desireable; compromised by changing name of file.
#     homepage = os.path.join(root_dir, 'studypal.html')
#     return FileResponse(homepage)

# @studypal_backend.post('/')
# def login():
#     return "foo"

# @studypal_backend.get('/studypal.html')
# async def root(request: Request):
#     print(request)
#     # homepage = os.path.join(root_dir, 'studypal.html')
#     data = {"message": "Hello, world!"}

#     return HTMLResponse(content=f"<h1>{data['message']}</h1>", status_code=200)


# METHOD 2: leads to issues with relative hrefs in files
# @studypal_backend.get('/')
# async def root(request: Request):
#     # http://localhost:8080/ this works
#     # http://localhost:8080/index.html this no longer works
#     with open('./../index.html', 'r') as file:
#         homepage = file.read()
#     return HTMLResponse(content=homepage, status_code=200)

    

    
# @studypal_backend.get('/tags.html')
# async def tags(request: Request):
#     with open('./../tags.html', 'r') as file:
#         tags_page = file.read()
#         return HTMLResponse(content=tags_page, status_code=200)