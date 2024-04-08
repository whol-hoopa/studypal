const flashcardData = {
    tags: ["math", "multiplication"],
    question: "What is 10 * 10?",
    answer:{
        text:{
            regular:"regular text.",
            markdown:"#Markdown text",
            latex:"\\[\\int_a^b f(\\mu) \\, d\\mu\\]",
            mermaid:"graph LR;A[Square Rect] -- Link text --> B((Circle));A --> C(Round Rect);B --> D{Rhombus};C --> D;",
            webpage:{
                label:"Link name",
                href:"url:frag"
            }
        },
        image:"BlobURL",
        audio:"BlobURL",
        video:{
            local:"BlobURL",
            youtube:"src"
        }
    }
};

// console.log(document.forms.namedItem('search'))

var formData;
document.getElementById('create-btn').addEventListener('click',function(e){
    // identical evListener in html on line 1411.
    // https://pouchdb.com/api.html#save_attachment
    e.preventDefault();

    formData = new FormData(e.target.form);
    formData.delete('inlineRadioOptions');

    const newObj={};
    const attachments={};
    const blob = ['input-image', 'input-audio', 'input-video'];
    for (const kv of formData.entries()){
        if(blob.includes(kv[0])){
            if(kv[1].size>0){
                const fileBlob = new Blob([kv[1]], {type: kv[1].type});
                const keyName=`${blob[blob.indexOf(kv[0])].split('-')[1]}.${kv[1].type.split('/')[1]}`; // e.g. image.jpeg
                attachments[keyName]={
                    "content_type": kv[1].type, // e.g. image/jpeg
                    "data":fileBlob // Blob {size: INT, type: MIME}
                };
            }
        }else if(kv[1] !== ""){
            newObj[kv[0]] = kv[1];
        }
    }
    newObj['_attachments']=attachments;
    newObj["_id"]=new Date().toISOString();
    console.log(newObj)
    // const jsonObj = JSON.stringify(newObj);
    // console.log(jsonObj);
})
// TODO: save only href not <a>, you an rebuild it. save db space.
// don't save key for empty blobs. 