const configDB={
    namePouchDB:'test',
    remoteCouchURL:`http://127.0.0.1:5984/${this.namePouchDB}`,
    syncPouchToCouch:false,
    listenForChanges:true,
    destroyPouchDB:false,
};

// where is CORS enabled? in the backend w/python? in couchdb _utils interface?
// https://github.com/pouchdb/add-cors-to-couchdb

const db=new PouchDB(configDB.namePouchDB);

window.addEventListener('beforeunload',()=>{db.close()});
if(configDB.destroyPouchDB){
    db.destroy().then(response=>{
        console.log(`Was pouchDB destroyed? ${response.ok}`);
    }).catch(err=>{
        console.log(err);
    });
}

if(configDB.syncPouchToCouch){
    /* 
     * If db.sync() is enabled, any changes made on the client-side 
     *  PouchDB will be synced with the remote CouchDB.
     * 
     * When the remote CouchDB gets updated and those changes are 
     *  synced back to the local PouchDB, db.changes() will pick up 
     *  these updates as well. So, it can serve as a confirmation 
     *  that the sync has occurred and the local database is 
     *  up-to-date with the remote database.
     * 
     * The options for db.sync() and db.changes() in PouchDB are not 
     *  exactly the same, as they serve different purposes and contexts:
     * 
     * db.sync(): The options for this function are related to the 
     *  synchronization process between the local PouchDB instance 
     *  and a remote CouchDB instance. The options can include details 
     *  about the documents being replicated, error handling, and more.
     * 
     * db.changes(): The options for this function are related to 
     *  listening for changes to the local PouchDB database. 
     *  The options can include filters to limit the changes 
     *  you’re listening for, configuration for how the 
     *  changes should be ordered, and more.
     *  
     * https://youtu.be/-Z7UF2TuSp0?si=Ebvws3h-84TlAop9&t=2029
     * https://pouchdb.com/api.html#sync
     * https://pouchdb.com/api.html#replication
     *  Replication options may have overlap with sync's.
     *  Sync documentation lacks detail on options.
     */


    const options={
        live:true, 
        // retry:true,  // check if this option is still available, it's not listed in docs; deprecated?...
    };

    const syncDb=db.sync(configDB.remoteCouchURL, options
        ).on('change', function(e){
            console.log(`DB.sync change event detected. What is your event driven response?:\n`,e);
        }).on('error', function(e){
            console.log(`Sync error:\n`,e);
        });

    const isCancel=false;
    if(isCancel){syncDb.cancel();}
    
} // end sync

if(configDB.listenForChanges){
    /*
     * The db.changes() function in PouchDB is like a feedback system 
     *  for the client-side. It gets called whenever any changes happen 
     *  to the local PouchDB database.
     * 
     * However, if you want to listen to changes as they happen directly 
     *  on the remote CouchDB database, you would use the _changes feed 
     *  provided by CouchDB itself. This would allow you to get real-time 
     *  updates from the remote CouchDB database.
     * 
     * So, in summary, db.changes() in PouchDB primarily listens for 
     *  local changes, but it can also reflect remote changes after 
     *  a sync. For real-time updates directly from the remote CouchDB 
     *  database, you would use CouchDB’s _changes feed.
     * 
     * The _changes feed is a feature provided by CouchDB, and it’s 
     *  typically set up and managed by the backend developer. This 
     *  feed allows applications to listen for changes to the 
     *  database in real-time.
     * 
     * So, in a typical setup, the backend developer would write code 
     *  to handle the _changes feed and define what should happen when 
     *  changes occur in the CouchDB database. This could include syncing 
     *  changes to connected PouchDB instances, updating application state, 
     *  triggering notifications, and so on.
     * 
     * If the backend developer adds data directly to the CouchDB database 
     *  and _changes feed is not set up to push these changes in real-time, 
     *  these changes won’t immediately reflect in the PouchDB database.
     * 
     * However, these changes will get reflected in PouchDB during the next 
     *  sync operation. When you call db.sync() in PouchDB, it communicates 
     *  with the CouchDB database, pulling any new changes from CouchDB and 
     *  pushing any local changes to CouchDB. So, even if the changes were 
     *  made directly on CouchDB and not initially reflected in PouchDB, 
     *  they will be pulled into PouchDB during the next sync.
     * 
     * After this sync, the db.changes() function in PouchDB will pick up 
     *  these updates from CouchDB, reflecting the current state of the 
     *  database after the sync. So, in essence, the sync process ensures 
     *  that PouchDB is kept up-to-date with CouchDB, even if changes 
     *  are made directly on CouchDB.
     * 
     * db.sync().on('change', ...) is about tracking changes as part of 
     *  the sync process between PouchDB and CouchDB, while 
     *  db.changes().on('change', ...) is about listening 
     *  for changes to the local PouchDB database.
     * 
     * db.changes().on(‘change’, …) in this context is triggered whenever 
     *  a change (like a document being added, updated, or deleted) occurs 
     *  in the local database. This can be useful for updating your 
     *  application in response to local database changes.
     * 
     * https://pouchdb.com/api.html#changes
     */

    const options={
        // limit: 10,
        include_docs: true,
        binary:true,  // attachments as Blobs/Buffers(buffers for node.js)
        // attachments:false,  // attachments as base64-encoded strings
        conflicts:false,  // isInclude
        descending:false,
        live:true,
        since:'now',
        // retry:true, // check if this option is still available, it's not listed in docs; deprecated?...
        // filter: function(doc){}, 5 examples provided in docs...
    };

    const changes = db.changes(options
        ).on('change', function(info){
            console.log('DB.changes change event detected.\n', info);
            if(options.include_docs){
                console.log(`What do you want to do with:\n`,info.doc);
            }
        // }).on('complete', function(info){}) / /Note: 'complete' event only fires when you aren’t doing live changes.
        }).on('error', function(err){
            console.log(err);
        });
    
    const isCancel=false;
    if(isCancel){changes.cancel();} // call if you don’t want to listen to new changes anymore; unsubscribe to all event listeners.
}




/**
 * Flashcard class that processes input form data and provides a method
 * to add the data as a flashcard object to a PouchDB instance.
 */
class Flashcard {
    static blobType = ['input-image', 'input-audio', 'input-video'];

    constructor(form){
        /** @type {HTMLFormElement} */
        this.form = form;
        /** @type {FormData} */
        this.formData = new FormData(this.form);
        /** @type {Number} */
        this.numInputs=0;
        /** @type {Object} */
        this.doc={};
        this._processFormData();
        /** @type {Object} */
        this.lastSavedCard={};
    }

    _processFormData(){
        const preDoc={};
        const attachments={};
        this.formData.delete('inlineRadioOptions');
        for (const [_key,_value] of this.formData.entries()){
            if(Flashcard.blobType.includes(_key)){
                if(_value.size>0){
                    const blobFile = new Blob([_value], {type:_value.type});
                    const keyName=`${Flashcard.blobType[Flashcard.blobType.indexOf(_key)].split('-')[1]}.${_value.type.split('/')[1]}`; // e.g. image.jpeg
                    attachments[keyName]={
                        "content_type":_value.type, // MIME: image/jpeg
                        "data":blobFile // Blob {size: INT, type: MIME}
                    };
                }
            }else if(_value !== ""){
                preDoc[_key]=_value;
            }
        }
        const numBlobs=Object.keys(attachments).length;
        const numNonBlobInputs=Object.keys(preDoc).length;
        this.numInputs=numNonBlobInputs + numBlobs;
        if(numNonBlobInputs>0){
            Object.assign(this.doc,preDoc);
        }
        if(numBlobs>0){
            this.doc['_attachments']=attachments;
        }
    }

    addFlashcard(flashCardDoc){
        /** @type {Object} */
        flashCardDoc=flashCardDoc||this._constructFlashcardDocument(this.doc);
        if(flashCardDoc.hasOwnProperty('_id')){
            // db == new PouchDB('myDBInstance') from global context.

            // console.log('flashCard put request queued.');
            db.put(flashCardDoc)
                .then(res=>{
                    this.lastSavedCard=res;
                    
                    // just in case we need _rev, _id
                    console.log(`Flashcard was saved to database: "${this.formData.get('input-question')}"`, this.lastSavedCard);
                })
                .catch(err=>console.error(err));
            return;
        }
        throw 'The flashcard document must have an _id property; use new Date().toISOString().';
    }

    _constructFlashcardDocument(data){
        /* Finalize a single flashCard document from the data entered in Flashcard Builder form
        *   by adding `_id` property to input dataset.
        */

        /** @type {Object} */
        data=data||this.doc;
        if(Object.keys(data).length===0 || !data){
        throw 'form/FormData with actual inputs is required in order to add a flashcard.';
        }
        // NOTE: .toISOString() => returns UTC time, as indicated by the `Z` at the end of stamp.
        const flashCardID={_id: new Date().toISOString()};
        const flashCardObject=Object.assign(data,flashCardID);
        return flashCardObject;
    }

    logForm(){
        console.log(this.form);
    }
    logFormData(){
        console.log(this.formData);
    }

    toJson(spaces){
        /** @type {Number} */
        spaces=spaces||0;
        return JSON.stringify(this.doc,null,spaces);
    }
    print(){console.dir(this.doc)}
    pprint(spaces){
        /** @type {Number} */
        spaces=spaces||2;
        console.log(this.toJson(spaces));
    }
};

/**
 * Query class that wraps a PouchDB instance.
 */
class Query {
    /**
     * Create a new Query class object.
     * @param {PouchDB} pouchDatabase - An instance of PouchDB.
     */
    constructor(pouchDatabase){
        this.db=pouchDatabase;
    }
    // https://pouchdb.com/api.html#batch_fetch
    /*
        Make sure that you have enabled the 
        JavaScript > Implicit Project Config: Check JS setting in VSCode. 
        This setting enables type checking for JavaScript files. 
        If it’s not enabled, VSCode might not show type suggestions based 
        on your JSDoc comments. You can find this setting in the 
        settings.json file or in the settings UI (File > Preferences > Settings).
    */
    getAll(justMetaData,includeBlobs,mostRecentFirst){
        /** @type {Boolean} */
        justMetaData=justMetaData||false; // show actual data by default
        /** @type {Boolean} */
        includeBlobs=includeBlobs||false; // don't incl Blob attachments(image, audio, video) by default
        /** @type {Boolean} */
        mostRecentFirst=mostRecentFirst||true; // show most recent first by default

        return this.db.allDocs({
            include_docs:!justMetaData,
            binary:includeBlobs,
            descending:mostRecentFirst,
        }).then(docs=>{
            // console.log(docs);
            return docs;
        }).catch(err=>console.error(err));
    }

    async getLastCreatedFlashcard(){
        try{
            const queryOptions={
                include_docs:true,
                binary:true,
                descending: true,
                limit: 1,
            };

            const record = await db.allDocs(queryOptions);
            return record.rows[0].doc;
        }catch(err){
            console.log(err);
        }
    }

    async getRandomFlashcard(){
        try{
            const flashcardMetadata = await this.getAll(true);
            const totalRecords=flashcardMetadata?.total_rows;
            const randomIndex=Math.floor(Math.random() * totalRecords);
            const randomId=flashcardMetadata?.rows[randomIndex]?.id;
            return await this.getRecordByID(randomId);
        }catch(err){
            console.error(err);
        }
    }

    /**
     * Retrieves a PouchDB document by its ID.
     * @param {string} id - The unique identifier for the document. It was derived from new Date().toISOString().
     * @param {string} [rev] - The _rev identifier for a particular revision version of a document. Omit to get the latest revision. 
     * @returns {Promise<object>} A promise that resolves with the PouchDB document.
     */
    async getRecordByID(id, rev){
        try {
            const options={
                binary:true, // Blob|Buffer(node.js)
                attachments:false, // base64 hex string
            };
            if(rev){options.rev=rev;}
            const doc = await db.get(id,options);
            return doc;
        } catch (err) {
            console.log(err);
        }
    }

    async searchWithPagination(regex, lastId, isDescending, isCaseSensitive){
        /* Use backslash to escape regex special characters.
            e.g. `h\.t`

            Find flashcards based on questions posed. 

            This is a `Temporary query` && is considered very slow.
            It is meant for debugging during development.

            https://pouchdb.com/guides/queries.html#mappin-and-reducin
        */
        if(regex===""){return null;}
        /** @type {String} */
        lastId=lastId||"";
        /** @type {Boolean} */
        isCaseSensitive=isCaseSensitive||false;
        /** @type {String} */
        regex=isCaseSensitive?new RegExp(regex):new RegExp(regex,'i');
        try{
            const queryOptions={
                include_docs:false,
                descending: isDescending,
                limit: 10,
            };
            if(lastId){
                queryOptions.startkey=lastId;
                queryOptions.skip=1;
            }


            const records = await db.query((doc,emit)=>{
                if(regex.test(doc['input-question'])){
                    // seems to order by key parameter, emit _id for expected ordering.
                    const valueEmitted={
                        _rev: doc._rev,
                        question: doc['input-question']
                    };
                    emit(doc._id, valueEmitted); // props returned => key, value; not key: value
                }
            }, queryOptions);

            
            // console.log(records.rows);
            console.log(records);
            return records;
        }catch(err){
            console.log(err);
        }
    }



    

















    /* Old Development versions. Purpose: Mistake reminders. */
    async _question_async(regex, isCaseSensitive){
        /* Use backslash to escape regex special characters.
            e.g. `h\.t`

            Find flashcards based on questions posed. 

            This is a `Temporary query` && is considered very slow.
            It is meant for debugging during development.

            https://pouchdb.com/guides/queries.html#mappin-and-reducin
        */
        if(regex===""){return null;}
        /** @type {Boolean} */
        isCaseSensitive=isCaseSensitive||false;
        /** @type {String} */
        regex=isCaseSensitive?new RegExp(regex):new RegExp(regex,'i');
        console.log("regex:", regex);
        try{
            const queryOptions={
                include_docs:true,
                descending:true,
                // limit: 5,
                // skip:2,
            };
            const result = await db.query((doc,emit)=>{
                if(regex.test(doc['input-question'])){
                    // orders by _rev not by _id! kept for lesson reminder.
                    emit(doc._rev,doc['input-question']); // props returned => key, value; not key: value
                }
            }, queryOptions);

            console.log(result.rows);
            console.log(result);
            return result.rows; // Assignable w/in promise chain.
        }catch(err){
            console.log(err);
        }
    }

    _question_sync(regex, isCaseSensitive){
        /* Use backslash to escape regex special characters.
            e.g. `h\.t`

            This is a `Temporary query` && is considered very slow.
            It is meant for debugging during development.

            Because db.query returns a promise, return value of res
            will be undefined if trying to assign return value outside of 
            the class. This is why we have written an async version above
            in order to work with the result after the promise resolves
            outside of the class.
        */
        /** @type {Boolean} */
        isCaseSensitive=isCaseSensitive||false;
        /** @type {String} */
        regex=isCaseSensitive?new RegExp(regex):new RegExp(regex,'i');
        db.query((doc,emit)=>{
            if(regex.test(doc['input-question'])){
                emit(doc['input-question'],doc._rev);
            }},
            {
                include_docs:true,
                descending:true,
            }
        ).then(res=>{
            console.log(res.rows);
            console.log(res);
            // return res; => undefined bc db.query is async and unresolved @time of assignment.
        }).catch(err=>{
            console.log(err);
        });
    }

    /* Persistent query */
    // _indexForQuestion(){
    //     const designDoc ={
    //         _id: '_design_docs/questions',
    //         views: {
    //             by_questions: {
    //                 map: function(doc){
    //                     emit(doc.name); // "The emit function will be available in scope when the map function is run, so don't pass it in as a parameter."
    //                 }.toString() // The .toString() at the end of the map function is necessary to prep the object for becoming valid JSON.
    //             }
    //         }
    //     }

    //     // save the Index
    //     this._db.put(designDoc).then(function(){
    //         // saved index.
    //     }).catch(function(err){
    //         console.log(err);
    //     })
    // }
    // ... db.query(...)

}


/* Context menu for removing flashcard from database from search list in sidebar
 * Coded here bc will be using Query class obj.
*/



















/* References:
    https://pouchdb.com/api.html
    https://nolanlawson.github.io/pouchdb-find/
    https://unpkg.com/browse/pouchdb@8.0.1/dist/pouchdb.find.js
    https://github.com/pouchdb/add-cors-to-couchdb
*/