from jose import jwt, JWTError
import os


def create_jwt_token(claim_payload, pem_pk_file, algo="RS256"):
    """Create JWT from claim and private pem"""
    with open(pem_pk_file, 'r') as pem_pk:
        token = jwt.encode(
            claim_payload,
            pem_pk.read(),
            algorithm=algo,
            headers={
                "alg": algo
            }
        )
    return token

def verify_jwt_payload(token, pem_file, algos=['RS256']):
    """Verifies JWT signature and returns the payload."""
    if not isinstance(token, bytes):
        token = token.encode('utf-8')
    
    with open(pem_file, 'r') as pem_public_key:
        public_key = pem_public_key.read()

    try:
        decoded_payload = jwt.decode(token, public_key, algorithms=algos)
        return decoded_payload
    except JWTError as err:
        print(f"JWT verification failed: {err}")
        return None
    

def is_valid_token(token):
    """Returns a boolean for JWT verification status"""
    pwd = os.path.dirname(__file__)
    cd_to_public_key_file = 'jwt_public_key.pem'
    rel_path = os.path.join(pwd,cd_to_public_key_file)
    pub_pem_file = os.path.abspath(rel_path)
    # print(pub_pem_file)

    claim_payload = verify_jwt_payload(token,pub_pem_file)
    if claim_payload:
        print('PAYLOAD:')
        print(claim_payload)
        return True
    return False


def get_token_from_request(request):
    """Extracts JWT from Bearer's Authorization header property"""
    auth_value = request.headers.get('authorization', None)

    jwt = auth_value.split(' ')[1]
    return jwt



if __name__=='__main__':

    payload={
    "sub": "user",
    "kid": "abc-12345"
    }
    pwd = os.path.dirname(__file__)
    # pem_file = os.path.join(pwd, 'jwt_private_key.pem')
    pem_file = os.path.join(pwd, 'private.pem')
    jwt_token = create_jwt_token(payload, pem_file)
    print(jwt_token)


    
    # pem_file = os.path.join(pwd, 'jwt_public_key.pem')
    pem_file = os.path.join(pwd, 'public.pem')
    decoded_payload=verify_jwt_payload(jwt_token, pem_file)
    print('payload:',decoded_payload)




    # https://python-jose.readthedocs.io/en/latest/index.html