from typing import List
from pydantic import BaseModel
from collections import defaultdict
from fastapi import FastAPI , Request
from couchdb_requests import post_find, putDB, putDoc, deleteDB, deleteDoc, _getDocInfo, _getUUID, _toStringJSON, IsMatchDB, getAllDocs
from account_user import getCardSetName, getSettingsName, getDefaultSettings
from datetime import datetime
from pickle import loads, dumps
from fsrs import Card, FSRS
from codecs import encode, decode
import re


# > uvicorn backend:studypal_backend --reload --port 8080
studypal_backend = FastAPI()
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

class AnswerData(BaseModel):
    # be between 1-5
    Rating: int | None = None
    # unique 
    id: int

class FlashcardInfo(BaseModel):
    id: int
    front: str
    back: str

class FlashcardData():
    difficulty: float
    lapses: int
    reps: int



@studypal_backend.get('/')
async def root():
    return 'Studypal backend working'

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

# 
#############################################################
# 
getReponseDocs = lambda res : res['response']['docs']

# Example Curl: curl -X PUT "http://127.0.0.1:8080/couchdb/createAccount/?username=bob&password=pop"
# 
# Creates a database to store a document for credentials
# Can be used to store account settings too
@studypal_backend.put('/couchdb/createAccount')
async def createAccount(username: str, password: str):
    settingName = getSettingsName(username, password)
    try:
        putDB(settingName)
        data = "{\"name\":\"credentials\",\
                \"username\":\"" + username + "\",\
                \"password\":\"" + password + "\"}"
        putDoc(settingName, 
                uuid=_getUUID(1)['uuids'][0],
                headers={},
                data=data)
    except:
        raise

    return {"status": 200}

# Example Curl: curl -X GET "http://127.0.0.1:8080/couchdb/userSettings/?username=bob&password=pop"
# 
# Gets settings from database document
@studypal_backend.get('/couchdb/userSettings/')
async def getUserSettings(username: str, password: str):
    name = getSettingsName(username, password)
    if not IsMatchDB(name):
        return {"status": 200, "response": "Unknown User"}
    
    try:
        #TODO: Make selector class to make it easier
        selector = "{\
            \"selector\": {\
                \"$and\": [\
                {\
                    \"name\":\"credentials\"\
                }\
                ]\
            }\
        }"
        credentialDoc = post_find(name, selector)

    except ConnectionError:
        return CouchdbErrorMessage('getUserSettings | getAllDocs')
    
    return credentialDoc

# Example Curl: curl -X GET "http://127.0.0.1:8080/couchdb/userCards/testset?username=bob&password=pop"
#
# Example Response:
# {
#   "status": 200,
#   "response": {
#     "docs": [
#       {
#         "_id": "f8750a6a38ee4eb6f36342eb9100c739",
#         "_rev": "1-8e37044753cf592ae5eb3097e2b999fd",
#         "name": "flashcard",
#         "id": "12",
#         "front": "dfjng",
#         "back": "iojnj",
#         "card_var": "gASV7QAAAAAAAACMC2ZzcnMubW9kZWxzlIwEQ2FyZJSTl...",
#         "fsrs_var": "gASV7QAAAAAAAACMC2ZzcnMubW9kZWxzlIwEQ2FyZJSTl..."
#       },
#       {
#         "_id": "f8750a6a38ee4eb6f36342eb91016c29",
#         "_rev": "1-8b178e50bc67f158f27583116a784a93",
#         "name": "flashcard",
#         "id": "5",
#         "front": "dfjng",
#         "back": "iojnj".
#         "card_var": "gASV7QAAAAAAAACMC2ZzcnMubW9kZWxzlIwEQ2FyZJSTl...",
#         "fsrs_var": "gASV7QAAAAAAAACMC2ZzcnMubW9kZWxzlIwEQ2FyZJSTl..."
#       }
#     ],
#     "bookmark": "g1AAAABweJzLYWBgYMpgSmHgKy5JLCrJTq2MT8lPzkzJBYorpFmYmxokmiUaW6SmmqQmmaUZmxmbGKUmWRoaGJolG1mC9HHA9BGlIwsAnzceIQ",
#     "warning": "No matching index found, create an index to optimize query time."
#   }
# }
#
# Gets all Flashcards from a database using the 
# username, password and setname
@studypal_backend.get('/couchdb/userCards/{setname}')
async def getCards(username: str, password: str, setname: str):
    name = getCardSetName(username, password, setname)
    try:
        if not IsMatchDB(name):
            return {"status": 200, "response": "No matches"}
        
        selector = "{\
            \"selector\": {\
                \"$and\": [\
                {\
                    \"name\":\"flashcard\"\
                }\
                ]\
            }\
        }"
        response = post_find(name, selector)
    except:
        raise
    return response

# Test command: doesn't work on curl for me So here is the code
    # payload = {
    #     "id":5,
    #     "front":"gsdfs",
    #     "back":"mkklcv"
    # }
    # params = {"username":"bob","password":"pop"}
    # response = requests.request("PUT", "http://127.0.0.1:8080/couchdb/userCard/testset", json=payload, params=params, headers={"Content-Type": "application/json"}) 
    # print(response.json())
#
# status should be 200
# Example Response:
# {"status": 200,"response": {"days": 2}}
#
# Put a New Flashcard into a database using 
# username, password, setname for database name
# "FlashcardInfo" id, front, back is stored in the doc
# card_var, and fsrs_var is also stored in the doc
# Creates the database if there isn't one
@studypal_backend.put('/couchdb/userCard/{setname}')
async def putNewCard(username: str, password: str, setname: str, FlashcardInfo: FlashcardInfo):    
    name = getCardSetName(username, password, setname)
    try:
        if not IsMatchDB(name):
            putDB(name)
        
        selector = "{\
            \"selector\": {\
                \"$and\": [\
                {\
                    \"name\":\"flashcard\"\
                },\
                {\
                    \"id\":\"" + str(FlashcardInfo.id) + "\"\
                }\
                ]\
            }\
        }"
        response = post_find(name, selector)

        if response["status"] != 200:
            return response

        if len(getReponseDocs(response)) > 1:
            return {"status": 200, "response": "id in use"}

        data = "{\"name\":\"flashcard\",\
                \"id\":\"" + str(FlashcardInfo.id) + "\",\
                \"front\":\"" + FlashcardInfo.front + "\",\
                \"back\":\"" + FlashcardInfo.back + "\",\
                \"card_var\":\"" + encode(dumps(Card()), 'base64').decode() + "\",\
                \"fsrs_var\":\"" + encode(dumps(FSRS()), 'base64').decode() + "\"}"
        
        data = re.sub(r'[\n\t\s]*', '', data)

        response = putDoc(name, 
                        uuid=_getUUID(1)['uuids'][0],
                        headers={},
                        data=data)
    except:
        raise
    return response

# Example Curl: curl -X DELETE "http://127.0.0.1:8080/couchdb/userCard/testset?username=bob&password=pop&id=4"
# 
# Example Response:
# {"status":200,"response":{"ok":true,"id":"f8750a6a38ee4eb6f36342eb910134b2","rev":"2-5f8af6d48a4ee53bdcfd8a56df2b8e53"}}
#
# Delete a flashcard using 
# username, password, and setname to find the database and
# search for the wanted id to delete 
@studypal_backend.delete('/couchdb/userCard/{setname}')
async def deleteCard(username: str, password: str, setname: str, id: int):
    name = getCardSetName(username, password, setname)
    try:
        if not IsMatchDB(name):
            return {"status": 200, "response": "input error"}
        
        selector = "{\
                \"selector\": {\
                    \"$and\": [\
                    {\
                        \"name\":\"flashcard\"\
                    },\
                    {\
                        \"id\":\"" + str(id) + "\"\
                    }\
                    ]\
                }\
            }"
        response = post_find(name, selector)

        if response["status"] != 200:
            return response

        doc = getReponseDocs(response)

        if len(doc) > 1:
            raise "more than one flashcard use same ids"
        
        doc = doc[0]
    except:
        raise
    return deleteDoc(name, doc['_id'], {'If-Match': doc['_rev']})

# Example Curl: curl GET "http://127.0.0.1:8080/couchdb/userCard/testset/getScheduleDays?username=bob&password=pop&id=0&rating=3"
#
# Example Response:
# {
#   "status": 200,
#   "response": {
#     "days": 13
#   }
# }
#
# Gets scheduled days from algorithm
@studypal_backend.get('/couchdb/userCard/{setname}/getScheduleDays')
async def getScheduleDays(username: str, password: str, setname: str, id: int, rating: int):
    name = getCardSetName(username, password, setname)
    try:
        selector = "{\
            \"selector\": {\
                \"$and\": [\
                {\
                    \"name\":\"flashcard\"\
                },\
                {\
                    \"id\":\"" + str(id) + "\"\
                }\
                ]\
            }\
        }"
        response = post_find(name, selector)

        if response['status'] != 200:
            return response
        
        doc = getReponseDocs(response)

        if len(doc) > 1:
            return {"status": 200, "response": "id in use"}
        elif len(doc) < 1:
            return {"status": 200, "response": "id not found"}
        
        doc = doc[0]
        card = loads(decode(doc['card_var'].encode(), 'base64'))
        fsrs = loads(decode(doc['fsrs_var'].encode(), 'base64'))
        card = fsrs.repeat(card, datetime.now())[rating].card

        data = "{\"name\":\"flashcard\",\
                \"id\":\"" + str(doc['id']) + "\",\
                \"front\":\"" + doc['front'] + "\",\
                \"back\":\"" + doc['back'] + "\",\
                \"card_var\":\"" + encode(dumps(card), 'base64').decode() + "\",\
                \"fsrs_var\":\"" + encode(dumps(fsrs), 'base64').decode() + "\"}"
        
        data = re.sub(r'[\n\t\s]*', '', data)

        response = putDoc(name, 
                        uuid=doc['_id'],
                        headers={'If-Match': doc['_rev']},
                        data=data)
        
    except:
        raise
    return {"status": 200, "response": {"days": card.scheduled_days}}