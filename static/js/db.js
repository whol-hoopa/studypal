const db=new PouchDB('test');
// const remoteCouch=false;

// const flashcardData = {
//     tags: ["math", "multiplication"],
//     question: "What is 10 * 10?",
//     answer:{
//         text:{
//             regular:"regular text.",
//             markdown:"#Markdown text",
//             latex:"\\[\\int_a^b f(\\mu) \\, d\\mu\\]",
//             mermaid:"graph LR;A[Square Rect] -- Link text --> B((Circle));A --> C(Round Rect);B --> D{Rhombus};C --> D;",
//             webpage:{
//                 label:"Link name",
//                 href:"url:frag"
//             }
//         },
//         image:"BlobURL",
//         audio:"BlobURL",
//         video:{
//             local:"BlobURL",
//             youtube:"src"
//         }
//     }
// };

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
                    console.log('Flashcard was saved to database.');
                    this.lastSavedCard=res;
                    console.log(res);
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

class Query {
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

        this.db.allDocs({
            include_docs:!justMetaData,
            binary:includeBlobs,
            descending:mostRecentFirst,
        }).then(docs=>{
            console.log(docs);
            return docs;
        }).catch(err=>console.log(err));
    }

    async _question_async(regex, isCaseSensitive){
        /* Use backslash to escape regex special characters.
            e.g. `h\.t`

            Find flashcards based on questions posed. 

            This is a `Temporary query` && is considered very slow.
            It is meant for debugging during development.

            https://pouchdb.com/guides/queries.html#mappin-and-reducin
        */
        /** @type {Boolean} */
        isCaseSensitive=isCaseSensitive||false;
        /** @type {String} */
        regex=isCaseSensitive?new RegExp(regex):new RegExp(regex,'i');

        try{
            const result = await db.query((doc,emit)=>{
                if(regex.test(doc['input-question'])){
                    emit(doc['input-question'],doc._rev);
                }
            },{
                include_docs:true,
                descending:true,
            });
            // console.log(result.rows);
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
}