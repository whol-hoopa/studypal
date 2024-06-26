
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.backends import default_backend

from collections import namedtuple
import os
from base64 import urlsafe_b64encode

def generate_private_public_keys(algo='es256'):
    """algo = es256 | rs256; returns namedtuple of Pem(private, public) """

    # Generate a new private key
    algo = algo.lower()
    if algo=='rs256':
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,  # ie 256 bytes
            backend=default_backend()
        )
    if algo=='es256':
        private_key = ec.generate_private_key(
            curve=ec.SECP256R1(),
            backend=default_backend()
        )
    print(private_key)

    # Serialize the private key to PEM format
    private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    # Generate the public key from the private key
    public_key = private_key.public_key()

    # Serialize the public key to PEM format
    public = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    Pem = namedtuple('Pem', ['private',  'public'])
    return Pem(private, public)

# Pem = generate_private_public_keys()
# print(Pem)
# print("PEM Private key:", Pem.private)
# print("PEM Public key:", Pem.public)
# print("Private key decoded:\n", Pem.private.decode())
# print("Public key decoded:\n", Pem.public.decode())


def create_pem_file(key, file_name, cd_to_target_dir='.'):

    pwd=os.path.dirname(__file__)
    target_dir=os.path.join(pwd, cd_to_target_dir)
    target_path=os.path.join(target_dir,file_name)
    absolute_path=os.path.abspath(target_path)
    print(absolute_path)
    with open(absolute_path, 'wb') as pem_file:
        pem_file.write(key)



def read_pem(file):
    with open(file, 'rb') as pem_file:
        pem_data = pem_file.read()
    return pem_data

def base64urlencode(data):
    """Returns base64urlencode byte string"""
    return urlsafe_b64encode(data).rstrip(b'=')

def base64url_encoded_pem(file):
    """ URL safe PEM. Safe for transmission in URLs, 
        HTTP headers, and other similar mediums.

        Safe for transmission does not mean secure or encrypted.
    """
    pem_byte_str = read_pem(file)
    pem_b64url_byte_str = base64urlencode(pem_byte_str)
    pub_pem_str = pem_b64url_byte_str.decode('utf-8')
    return pub_pem_str

if __name__=='__main__':
    Pem = generate_private_public_keys()
    # print(Pem.private.decode())
    # print(Pem.public)
    create_pem_file(Pem.private, 'private.pem')
    create_pem_file(Pem.public, 'public.pem')


""" private_key:

    1) public_exponent: This parameter specifies the public exponent used in the 
        RSA key generation algorithm. The public exponent is typically a small 
        prime number, often chosen as 65537 (2^16 + 1), due to its efficiency and 
        security properties. It's used in the RSA encryption and signature schemes. 
        Choosing a suitable public exponent is important for the security and 
        performance of the RSA algorithm.
    
    2) key_size: This parameter determines the size of the RSA key, measured in bits. 
        The key size directly affects the security level of the RSA encryption scheme. 
        A larger key size generally provides stronger security but may result in slower 
        cryptographic operations. Common key sizes for RSA range from 1024 bits to 4096 bits, 
        with 2048 bits being a commonly used choice for many applications.

    3) backend: This parameter specifies the cryptographic backend used for key generation. 
        In this case, default_backend() is used, which selects the default backend provided 
        by the cryptography library. The backend is responsible for implementing the cryptographic 
        algorithms and operations. Different backends may offer different features, 
        performance characteristics, and security properties.

    When you call generate_private_key with these parameters, it produces an RSA private key 
    according to the specified key size and public exponent, using the chosen 
    cryptographic backend. This private key can then be used for various cryptographic operations, 
    such as encryption, decryption, digital signatures, and key exchange, depending on 
    your specific requirements and use case.
"""

""" pem_private_key

    1) encoding: This parameter specifies the encoding format for the resulting byte string. 
        In this case, serialization.Encoding.PEM is used, indicating that the private key 
        will be encoded using the PEM (Privacy-Enhanced Mail) format. PEM encoding is a 
        common format for representing cryptographic objects, such as keys and certificates, 
        in a human-readable ASCII format. It typically starts with a header line 
        (e.g., -----BEGIN PRIVATE KEY-----) and ends with a 
        footer line (e.g., -----END PRIVATE KEY-----), with the key data encoded 
        in Base64 between them.
    
    2) format: This parameter specifies the format of the private key. 
        Here, serialization.PrivateFormat.PKCS8 is used, indicating that the private key 
        will be encoded using the PKCS#8 format. PKCS#8 (Public-Key Cryptography Standards #8) 
        is a standard syntax for encoding private keys, which allows for flexibility and 
        interoperability between different cryptographic libraries and systems.
    
    3) encryption_algorithm: This parameter specifies the encryption algorithm to use, if any, 
        for encrypting the private key. In this case, serialization.NoEncryption() is used, 
        indicating that no encryption will be applied to the private key. The private key will 
        be encoded in its raw, unencrypted form. This is appropriate when the private key is 
        intended to be stored securely and does not need additional protection through encryption.
    
    When you call private_bytes with these parameters, it serializes the private key object 
    into a byte string according to the specified encoding, format, and encryption settings. 
    The resulting byte string, pem_private_key, contains the encoded representation of the 
    private key in PEM format, ready to be stored or transmitted as needed.
"""

""" pem_public_key
    
    1) encoding: Similar to the previous example, this parameter specifies the encoding format 
        for the resulting byte string. Here, serialization.Encoding.PEM indicates that the public key 
        will be encoded using the PEM format.

    2) format: This parameter specifies the format of the public key. In this case, 
        serialization.PublicFormat.SubjectPublicKeyInfo is used. SubjectPublicKeyInfo is a 
        standard format defined in X.509, which represents a public key along with its associated 
        algorithm parameters. It's a common format used for encoding public keys in 
        certificates and other cryptographic contexts.

    When you call public_bytes with these parameters, it serializes the public key object into a 
    byte string according to the specified encoding and format. The resulting byte string, 
    pem_public_key, contains the encoded representation of the public key in PEM format, ready to 
    be stored or transmitted as needed.

    The SubjectPublicKeyInfo format is commonly used in X.509 certificates to encapsulate the 
    public key and its metadata, including the algorithm parameters. When you use 
    serialization.PublicFormat.SubjectPublicKeyInfo, you are instructing the cryptography library 
    to generate the public key in a format that includes this metadata.

    In the code snippet, when you generate the pem_public_key using public_bytes with 
    serialization.PublicFormat.SubjectPublicKeyInfo, it ensures that the resulting PEM-encoded 
    public key contains the necessary information about the key's algorithm and associated 
    parameters. This format is suitable for many cryptographic operations that require knowledge 
    of the algorithm and parameters used in the public key.
"""
