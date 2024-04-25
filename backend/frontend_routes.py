import fastapi
from fastapi.responses import HTMLResponse
from fastapi import Request

# from fastapi.responses import FileResponse # METHOD 1
# from fastapi.responses import HTMLResponse # METHOD 2


router = fastapi.APIRouter()



@router.get('/', response_class=HTMLResponse, include_in_schema=False)
def form(request:Request):
    return "<h1>Form Response</h1>"

























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

# @studypal_backend.get('/flashcard-builder.html')
# async def build(request: Request):
#     with open('./../flashcard-builder.html', 'r') as file:
#         builder_page = file.read()
#         return HTMLResponse(content=builder_page, status_code=200)
    
# @studypal_backend.get('/flashcard-review.html')
# async def review(request: Request):
#     with open('./../flashcard-review.html', 'r') as file:
#         review_page = file.read()
#         return HTMLResponse(content=review_page, status_code=200)
    
# @studypal_backend.get('/statistics.html')
# async def statistics(request: Request):
#     with open('./../statistics.html', 'r') as file:
#         stats_page = file.read()
#         return HTMLResponse(content=stats_page, status_code=200)
    
# @studypal_backend.get('/settings.html')
# async def settings(request: Request):
#     with open('./../settings.html', 'r') as file:
#         settings_page = file.read()
#         return HTMLResponse(content=settings_page, status_code=200)
    
# @studypal_backend.get('/tags.html')
# async def tags(request: Request):
#     with open('./../tags.html', 'r') as file:
#         tags_page = file.read()
#         return HTMLResponse(content=tags_page, status_code=200)