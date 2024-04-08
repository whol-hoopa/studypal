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


const pouchDB={

    data:this.data,

    addFlashcard(flashCardDoc){
        flashCardDoc=flashCardDoc||this.constructFlashcardDocument(this.data);
        if(flashCardDoc.hasOwnProperty('_id')){
            // db == new PouchDB('myDBInstance') from global context.
            db.put(flashCardDoc)
                .then(res=>{
                    console.log('Flashcard was saved to database.');
                    console.log(res);
                })
                .catch(err=>console.error(err));
            return;
        }
        throw 'The flashcard document must have an _id property; use new Date().toISOString().';
    },

    constructFlashcardDocument(data){
        /* Create a single flashCard document from the data entered in Flashcard Builder form.  
        *   Save the outputted document to PouchDB.
        */
        this.data=data;
        const flashCardID={_id: new Date().toISOString()};
        const flashCardObject=Object.assign(flashCardID, data);
        return flashCardObject;
    },
    toJson(spaces){
        spaces=spaces||0;
        return JSON.stringify(this.constructFlashcardDocument(this.data),null,spaces);
    },
    print(){console.dir(this.constructFlashcardDocument(this.data))},
    pprint(spaces){
        spaces=spaces||2;
        console.log(this.toJson(spaces));
    }
};

pouchDB.data=flashcardData;
// pouchDB.constructFlashcardDocument(flashcardData);
// pouchDB.print();
// pouchDB.pprint();


