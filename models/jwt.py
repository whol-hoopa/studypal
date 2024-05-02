from jose import jwt, JWTError
import os


def create_jwt_token(claim_payload, pem_pk_file, algo="ES256"):
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

def verify_jwt_payload(token, public_pem_file, algos='ES256'):
    """Verifies JWT signature and returns the payload."""
    if not isinstance(token, bytes):
        token = token.encode('utf-8')
    
    with open(public_pem_file, 'r') as pem_public_key:
        public_key = pem_public_key.read()

    try:
        decoded_payload = jwt.decode(token, public_key, algorithms=[algos])
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
    pem_file = os.path.join(pwd, 'jwt_private_key.pem')
    jwt_token = create_jwt_token(payload, pem_file, 'ES256')
    print(jwt_token)


    
    # pem_file = os.path.join(pwd, 'jwt_public_key.pem')
    pem_file = os.path.join(pwd, 'jwt_public_key.pem')
    decoded_payload=verify_jwt_payload(jwt_token, pem_file, 'ES256')
    print('payload:',decoded_payload)




    # https://python-jose.readthedocs.io/en/latest/index.html

    """
         You should not expect to get the same JWT every time, even if you are 
            using the same payload and the same private EC key. This is because 
            the ES256 algorithm (Elliptic Curve Digital Signature Algorithm or ECDSA) 
            introduces randomness into the signature generation process.

        The ES256 algorithm uses a random number for each signature generation to 
            ensure the security of the key. This random number is known as k in the 
            ECDSA algorithm. Because k is different for each signature generation, 
            the resulting signature will also be different each time, even if the 
            payload and the key remain the same.

        However, the head.payload part of the JWT should indeed remain the same if 
            the payload and the key are the same. The changing part is the signature, 
            which is expected behavior for the ES256 algorithm.

        This is a feature of the algorithm to ensure the security of the key. 
            It’s important to note that while the signature is different each time, 
            it is still valid and can be verified with the corresponding public key.
    """