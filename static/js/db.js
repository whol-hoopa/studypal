// const db=new PouchDB('test');
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

class Pouch {
    static blobType = ['input-image', 'input-audio', 'input-video'];

    constructor(form){
        /** @type {HTMLFormElement} */
        this.form = form;
        /** @type {FormData} */
        this.formData = new FormData(this.form);
        /** @type {Number} */
        this.numInputs=null;
        /** @type {Object} */
        this.doc={};
        this.processFormData();
        /** @type {Object} */
        this.lastSavedCard={};
    }

    processFormData(){
        const preDoc={};
        const attachments={};
        this.formData.delete('inlineRadioOptions');
        for (const [_key,_value] of this.formData.entries()){
            if(Pouch.blobType.includes(_key)){
                if(_value.size>0){
                    const blobFile = new Blob([_value], {type:_value.type});
                    const keyName=`${Pouch.blobType[Pouch.blobType.indexOf(_key)].split('-')[1]}.${_value.type.split('/')[1]}`; // e.g. image.jpeg
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
        flashCardDoc=flashCardDoc||this.constructFlashcardDocument(this.doc);
        if(flashCardDoc.hasOwnProperty('_id')){
            // db == new PouchDB('myDBInstance') from global context.

            console.log('flashCard put request queued.');
            // db.put(flashCardDoc)
            //     .then(res=>{
            //         console.log('Flashcard was saved to database.');
            //         this.lastSavedCard=res;
            //         console.log(res);
            //     })
            //     .catch(err=>console.error(err));
            return;
        }
        throw 'The flashcard document must have an _id property; use new Date().toISOString().';
    }

    constructFlashcardDocument(data){
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