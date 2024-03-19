import requests

global httpString, couchdbIP

# Version: Couchdb 3.3
couchdbIP = '127.0.0.1:5984'
httpString = 'http://{}'.format(couchdbIP)

global auth_login
auth_login = ('admin', 'password') # (username, password)

ConnectionErrorMessage = lambda func_name: 'connection error at \"{}\" function'.format(func_name)

# Get UUID
def _getUUID(count=1):
    params = {
        'count': str(count),
    }
    response = requests.get(httpString + '/_uuids',
                            params=params,
                            auth=auth_login)
    return response.json()

# request.json -> string json
def _toStringJSON(json):
    s = lambda s : '\"{}\"'.format(s)
    body = ''

    for k in json.keys():
        body = body + s(k) + ':' + s(json[k]) + ','

    return '{' + body[:-1] + '}'

# Get document information
def _getDocInfo(nameDB, doc_ID):
    url = httpString + '/{}/{}'.format(nameDB, doc_ID)
    response = requests.get(url=url,
                        auth=auth_login)
    
    if response.status_code != 200 and response.json()['reason']:
        raise ConnectionError('doc_ID or nameDB is wrong')
    elif response.status_code != 200:
        raise ConnectionError(ConnectionErrorMessage('_getDocInfo'))
    
    return response.json()

# Get all databases
def _getDBs():
    response = requests.get(httpString + '/_all_dbs',
                           auth=auth_login)
    
    if response.status_code != 200:
        raise ConnectionError(ConnectionErrorMessage('_getDBs'))
    
    return {'status': response.status_code, 'response': response.json()}

# Delete database
def deleteDB(nameDB):
    url = httpString + '/{}'.format(nameDB)
    response = requests.delete(url = url,
                               auth=auth_login)
    
    if response.status_code != 200:
        raise ConnectionError(ConnectionErrorMessage('deleteDB'))

    return {'status': response.status_code, 'response': response.json()}
    

# Make new database
def putDB(nameDB):
    url = httpString + '/{}'.format(nameDB)
    response = requests.put(url = url,
                            auth=auth_login)
    
    if response.status_code != 201:
        raise ConnectionError(ConnectionErrorMessage('putDB'))

    return {'status': response.status_code, 'response': response.json()}

# delete document
# "If-Match" header needed to delete
def deleteDoc(nameDB, uuid, headers):
    url = httpString + '/{nameDB}/{uuid}'.format(nameDB = nameDB, uuid = uuid)
    response = requests.delete(url = url,
                               headers=headers,
                               auth=auth_login)
    
    if response.status_code != 200:
        raise ConnectionError(ConnectionErrorMessage('deleteDoc'))

    return {'status': response.status_code, 'response': response.json()}

# New/edit document
# If "If-Match" header is added when changing document
def putDoc(nameDB, uuid, headers = {}, data = '{}'):    
    url = httpString + '/{nameDB}/{uuid}'.format(nameDB = nameDB, uuid = uuid)
    response = requests.put(
        url=url,
        headers=headers,
        data=data,
        auth=auth_login
    )

    if response.status_code != 201:
        raise ConnectionError(ConnectionErrorMessage('putDoc'))

    return {'status': response.status_code, 'response': response.json()}

# Find documents in Database with selectors/operators
def post_find(nameDB, data):
    url = httpString + '/{nameDB}/_find'.format(nameDB = nameDB)

    headers = {
        'Content-Type': 'application/json',
    }

    response = requests.post(
        url=url,
        headers=headers,
        data=data,
        auth=auth_login
    )

    if response.status_code != 200:
        raise ConnectionError(ConnectionErrorMessage("post_find"))
    
    return {'status': response.status_code, 'response': response.json()}