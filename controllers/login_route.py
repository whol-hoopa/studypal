from fastapi import Request, APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from models.auth import User
from models.hash import hashPwd, matchesHash

from pydantic import ValidationError



router_login = APIRouter()

@router_login.post("/", response_class=HTMLResponse, tags=['login'])
async def login(request:Request):
    print('AUTHENTICATION REQUEST')
    # print(request.headers)
    try:
        credentials = await request.json()
        # print(credentials)
        # print(credentials.get('password'))
        # print(hashPwd(credentials.get('password')))
        
        user = User(**credentials)
        print("Pydantic validation successful.")

        # check if user is in db

        # if in db, get pwd_hash

        # if not in db, create new user


        if matchesHash(user.password,hashPwd(user.password)):
            return "<h1>Welcome to Study<span class='outlined-text'>Pal</span></h1><p class='fs-4'>Have a great session!</p>"
            
        raise HTTPException(status_code=401, detail="Invalid: Password didn't match.") 

    except ValidationError as e:
        # error_messages = "\n".join([f"{error['loc'][0]} - {error['msg']}" for error in e.errors()])
        # detail=f"Validation error(s):\n{error_messages}"
        raise HTTPException(status_code=400, detail=e.errors()[0]['msg'])

