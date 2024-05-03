import hashlib
import re

def obfuscate_email(email, algo='sha256'):
    algo = algo.lower()
    # Encode the email string as bytes (UTF-8 encoding)
    email_bytes = email.encode('utf-8')

    if algo == 'sha256':
        # Hash the email bytes using SHA-256
        hashed_email = hashlib.sha256(email_bytes).hexdigest()
    if algo == 'sha1':
        # Hash the email bytes using SHA-1
        hashed_email = hashlib.sha1(email_bytes).hexdigest()
    if algo == 'md5':
        # Hash the email bytes using md-5
        hashed_email = hashlib.md5(email_bytes).hexdigest()

    return hashed_email

def create_user_id(email):
    """Designed to create a userId from the hexString
    derived from obfuscate_email(). In addition, the 
    id must start with a letter so the first letter
    in found in the hex string will serve to prepend
    the hexString derived from obfuscate_email{}. 
    This userId will be used for the user's database 
    name. CouchDB requires that the name start 
    with an alphabet.
    """
    hex_string = obfuscate_email(email)
    padding = re.search('[a-f]',hex_string).group()
    return f'{padding}{hex_string}'


if __name__=='__main__':
    email = "example@example.com"
    user_id = create_user_id(email)
    print('user_id: ',user_id)
    obfuscated_email = obfuscate_email(email,'sha256')
    print("Obfuscated email sha256:", obfuscated_email)
    obfuscated_email = obfuscate_email(email,'sha1')
    print("Obfuscated email sha1:", obfuscated_email)
    obfuscated_email = obfuscate_email(email,'md5')
    print("Obfuscated email md5:", obfuscated_email)