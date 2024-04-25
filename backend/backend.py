from typing import List
from pydantic import BaseModel
from collections import defaultdict
from fastapi import FastAPI , Request
from fastapi.staticfiles import StaticFiles

import os

from couchdb_requests import post_find, putDB, putDoc, deleteDB, deleteDoc, _getDocInfo, _getUUID, _toStringJSON


# > uvicorn backend:studypal_backend --reload --port 8080
studypal_backend = FastAPI()

# serve static files: html, css, js
pwd = os.path.dirname(__file__) # /backend
cd_to_parent_dir = os.path.join(pwd, "..") # /backend/..
root_dir = os.path.abspath(cd_to_parent_dir) # C:\Users\User\Desktop\studypal
studypal_backend.mount("/", StaticFiles(directory=root_dir), name="root") # works to send all files mounted under path.
# functional routes:
# http://localhost:8080/studypal.html # was index.html; http://localhost:8080/ didn't work, http://localhost:8080/index.html is not desireable. 
# http://localhost:8080/flashcard-builder.html
# http://localhost:8080/flashcard-review.html

CouchdbErrorMessage = lambda message: '{\"error\": Bad CouchDb Connection at \"' + message + '\"}'
# CouchdbErrorMessage = lambda message: '{' + '{\"error\": Bad CouchDb Connection at \"{}\"'.format(message) + '}'
global Valid_Operators, valid_Conditionals, NoQuote
Valid_Operators = ['$lt', '$lte', '$eq', '$ne', '$gte', '$gt', '$exists', '$type', '$in', '$nin', '$regex']
valid_Conditionals = ['$and', '$or', '$not', '$nor', '$all']
NoQuoteStrings = ['null', 'true', 'false']

class BaseSelector(BaseModel):
    # valid operators $lt, $lte, $eq, $ne, $gte, $gt, 
    # $exists, $type, $in, $nin, $regex
    operator: str 
    # json key
    field: str
    # argument to compare value from db 
    arg: str

class GroupSelector(BaseModel):
    # valid conditions $and, $or, $not, $nor, $all
    condition: str
    selectorOps: List[BaseSelector]


# Test command: curl -X DELETE "http://127.0.0.1:8080/couchdb/albums"
#
# status should be 200
# Example Response:
# {"status": 200, "response": {"ok": true }}
@studypal_backend.delete('/couchdb/{nameDB}')
async def removeDB(nameDB: str):
    try:
        res = deleteDB(nameDB)
    except ConnectionError:
        return CouchdbErrorMessage('removeDB | deleteDB')
    
    return res

# Test command: curl -X PUT "http://127.0.0.1:8080/couchdb/albums"
#
# status should be 201
# Example Response:
# {"status":201,"response":{"ok":true}}
@studypal_backend.put('/couchdb/{nameDB}')
async def newDB(nameDB: str):
    try:
        res = putDB(nameDB)
    except ConnectionError:
        return CouchdbErrorMessage('newDB | putDB')
    
    return res

# Test command: curl -X DELETE -H "doc_ID: d2a67fb89dec2825560d4e8cb500d6ee" "http://127.0.0.1:8080/couchdb/albums/removeDoc"
#
# status should be 200
# Example Response:
# {"status":200,"response":{"ok":true,"id":"d2a67fb89dec2825560d4e8cb500d6ee","rev":"4-6e74ca79854efea96730a06d165ee3d0"}}
@studypal_backend.delete('/couchdb/{nameDB}/removeDoc')
async def removeDoc(nameDB: str, request: Request):
    doc_ID = request.headers.get('doc_ID')
    # print(doc_ID)
    if doc_ID == None:
        return '{"error": "Needs doc_ID value in \"removeDoc\" function"}'

    try:
        rev = _getDocInfo(nameDB, doc_ID)['_rev']
    except ConnectionError:
        return CouchdbErrorMessage('removeDoc | _getDocInfo')

    headers = {
        'If-Match' : rev
    }
    
    try:
        res = deleteDoc(nameDB,
                       uuid=doc_ID,
                       headers=headers)
    except ConnectionError:
        return CouchdbErrorMessage('removeDoc | putDoc')

    return res

# Test command: curl -X PUT -d "{\"asdasd\":\"asdwq\"}" "http://127.0.0.1:8080/couchdb/albums/newDoc"
#
# status should be 201
# Example Response:
# {"status":201,"response":{"ok":true,"id":"d2a67fb89dec2825560d4e8cb500e5b5","rev":"1-547ffc1b5059b80ef163ca2817cc0e90"}}
@studypal_backend.put('/couchdb/{nameDB}/newDoc')
async def addDoc(nameDB: str, request: Request):
    data = _toStringJSON(await request.json())

    try:
        res = putDoc(nameDB, 
                     uuid=_getUUID(1)['uuids'][0],
                     headers={},
                     data=data)
    except ConnectionError:
        return CouchdbErrorMessage('addDoc | putDoc')
    
    return res

# Needs "doc_ID" header(variable: _id)
# Test command: curl -X PUT -H "doc_ID: d2a67fb89dec2825560d4e8cb500d6ee" -d "{\"asdasd\":\"asdwq\"}" "http://127.0.0.1:8080/couchdb/albums/editDoc"
#
# rev should be increasing after every edit
# Example Response:
# {"status":201,"response":{"ok":true,"id":"d2a67fb89dec2825560d4e8cb500d6ee","rev":"2-3496805ed57e50a11a7ec8402c7a0ebf"}}
# {"status":201,"response":{"ok":true,"id":"d2a67fb89dec2825560d4e8cb500d6ee","rev":"3-074d0b9c6b895b2389f2d2e5bfdf25d0"}}
@studypal_backend.put('/couchdb/{nameDB}/editDoc')
async def editDoc(nameDB: str, request: Request):
    doc_ID = request.headers.get('doc_ID')
    if doc_ID == None:
        return '{"error": "Needs doc_ID value in \"editDoc\" function"}'

    try:
        rev = _getDocInfo(nameDB, doc_ID)['_rev']
    except ConnectionError:
        return CouchdbErrorMessage('editDoc | _getDocInfo')

    headers = {
        'If-Match' : rev
    }

    data = _toStringJSON(await request.json())
    
    try:
        res = putDoc(nameDB,
                     uuid=doc_ID,
                     headers=headers,
                     data=data)
    except ConnectionError:
        return CouchdbErrorMessage('editDoc | putDoc')

    return res

# Test command: doesn't work on curl for me So here is the code
    # payload = {
    #     "condition": "$and",
    #     "selectorOps": [
    #         {
    #             "operator": "$exists",
    #             "field": "_id",
    #             "arg": "true"
    #         },
    #         {
    #             "operator": "$exists",
    #             "field": "_id",
    #             "arg": "true"
    #         }
    #     ]
    # }
    # response = requests.request("POST", "http://127.0.0.1:8080/couchdb/albums/search", json=payload, headers={"Content-Type": "application/json"}) 
    # print(response.json())

@studypal_backend.post('/couchdb/{nameDB}/search')
async def searchDB(nameDB: str,
                   selectorOps: GroupSelector):
    def IfValids(opsList, condition):
        def getInvalidOps(selector_list):
            ifValidOp = lambda s: s.operator not in Valid_Operators
            badSelector = list(filter(ifValidOp, selector_list))

            if condition not in valid_Conditionals:
                return [s.operator for s in badSelector] + [condition]

            return [s.operator for s in badSelector]
        
        validBool = lambda bool, invalidList: {'bool': bool, 'invalids': invalidList}

        invalids = getInvalidOps(opsList)
        if len(invalids) > 0 or condition in invalids:
            return validBool(False, invalids)
        
        return validBool(True, [])
        
    def formatSelector( opsList, condition):
        def NoQuote(arg):
            if arg[0] == '[' and arg[-1] == ']':
                return True
            elif arg in NoQuoteStrings:
                return True
            return False
        quote = lambda s : '\"{}\"'.format(s)

        selector_string = ''
        selectors = opsList
        
        field_ops = defaultdict(list)

        for s in selectors:
            field_ops[s.field].append({'op': s.operator, 'arg': s.arg})

        field = ''
        for f in field_ops.keys():
            op = ''
            for ops in field_ops[f]:
                arg = ops['arg']
                if not NoQuote(arg):
                    arg = quote(arg)

                op += quote(ops['op']) + ':' + arg + ','

            field += '{' + quote(f) + ':' + '{' + op[:-1] + '}' + '}' + ','

        selector_string = '\"' + condition + '\"' + ':' + '[' + field[:-1] + ']' + ','
        return '{\"selector\":{' + selector_string[:-1] + '}}'

    v = IfValids(selectorOps.selectorOps, selectorOps.condition)
    if not v['bool']:
        print('inerher')
        return ('invalid operators or condition: ', v['invalids'], 
                'Valid Operators: ', Valid_Operators, 
                'Valid Conditionals: ', valid_Conditionals)
    
    body = formatSelector(selectorOps.selectorOps, selectorOps.condition)

    try:
        res = post_find(nameDB,
                        data=body)
    except ConnectionError:
        return CouchdbErrorMessage('searchDB | post_find')
    
    return res
