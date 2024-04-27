import bcrypt

def hashPwd(password:str):
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_pwd


def getHashedPwd():
    pass


def matchesHash(password:str, db_hash:bytes):
    client_hash = password.encode('utf-8')
    return bcrypt.checkpw(client_hash, db_hash)
