from jose import jwt
import os


def get_jwt_token(claim_payload, pem_pk_file, algo="RS256"):
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

def get_jwt_payload(token, public_pem_file, algos=['RS256']):
    if not isinstance(token, bytes):
        token = token.encode('utf-8')

    with open(public_pem_file, 'r') as pem_public_key:
        public_key = pem_public_key.read()

    return jwt.decode(token, public_key, algorithms=algos)



if __name__=='__main__':

    payload={
    "sub": "user",
    "kid": "abc-123"
    }
    pwd = os.path.dirname(__file__)
    pem_file = os.path.join(pwd, 'jwt_private_key.pem')
    jwt_token = get_jwt_token(payload, pem_file)


    
    public_pem_file = os.path.join(pwd, 'jwt_public_key.pem')
    decoded_payload=get_jwt_payload(jwt_token, public_pem_file)
    print('payload:',decoded_payload)




    # https://python-jose.readthedocs.io/en/latest/index.html