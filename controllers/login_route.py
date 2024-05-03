from fastapi import Request, APIRouter, HTTPException, status

from models.validate import User
from pydantic import ValidationError
from models.hash import hashPwd, matchesHash

from fastapi.responses import HTMLResponse
from models.jwt import create_jwt_token
import os
from models.key_gen import base64url_encoded_pem
from models.email import create_user_id

import time


router_login = APIRouter()

@router_login.post("/", response_class=HTMLResponse, tags=['authentication'])
async def login(request:Request):
    print('AUTHENTICATION REQUEST')
    print(request.headers)
    try:
        # print('credentials')
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
            print(request.headers)
            updated_headers = None
            pwd=os.path.dirname(__file__)
            cd_to_models='../models'
            if request.headers['x-send-jwt'] == 'true':
                # generate jwt token
                userID=create_user_id(user.email)
                issued_at_time=int(time.time())
                # expiration_time = issued_at_time + 86400 # 24hrs
                expiration_time = issued_at_time + 180 # 3min
                claim={
                    "algo": "ES256",
                    "type": "JWT",
                    "iss": "studypal",
                    "sub": userID,
                    "role": "user",
                    "iat": issued_at_time,
                    "exp": expiration_time
                }
                
                rel_pem_file=os.path.join(pwd, cd_to_models, "jwt_private_key.pem")
                pk_pem_file=os.path.abspath(rel_pem_file)
                token=create_jwt_token(claim,pk_pem_file)

                if updated_headers == None:
                    updated_headers={}

                updated_headers["Authorization"] = f"Bearer {token}"

            # send public pem key if not in storage
            if request.headers['x-send-pub-pem'] == 'true':
                rel_pub_pem_path = os.path.join(pwd, cd_to_models, "jwt_public_key.pem")
                pub_pem_path = os.path.abspath(rel_pub_pem_path)
                pub_pem_str = base64url_encoded_pem(pub_pem_path)

                if updated_headers == None:
                    updated_headers={}
                updated_headers["x-pub-pem"] = f"{pub_pem_str}"



            content="<h1>Welcome to Study<span class='outlined-text'>Pal</span></h1><p class='fs-4'>Have a great session!</p>"
            print(updated_headers)
            if updated_headers:
                return HTMLResponse(content, headers=updated_headers)
            else:
                return HTMLResponse(content)
        
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid: Password didn't match."
        ) 

    except ValidationError as err:
        # error_messages = "\n".join([f"{error['loc'][0]} - {error['msg']}" for error in err.errors()])
        # detail=f"Validation error(s):\n{error_messages}"
        print('pydantic validation raised')
        # failed Pydantic User validation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=err.errors()[0]['msg']
        )

