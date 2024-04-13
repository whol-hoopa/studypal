
// Create flashcard
const createBtn=document.getElementById('create-btn');
const dbIconBtn=document.getElementById('btn-flashcard-added-icon');
createBtn?.addEventListener('click',function(e){
    // identical evListener in html on line 1411.
    // https://pouchdb.com/api.html#save_attachment
    e.preventDefault();

    const flashcard = new Flashcard(e.target?.form);
    flashcard.addFlashcard();

    /* START: development feedback */
    // flashcard.logForm();
    flashcard.logFormData();
    // console.log(flashcard.numInputs);
    // console.log(flashcard.doc);
    // console.dir(flashcard.lastSavedCard); // doesn't work as expected. empty obj.
    // flashcard.print();
    flashcard.pprint();
    /* END: development feedback */
    
    // flashcard created feedback: show feedback
    dbIconBtn?.classList.remove('d-none');
    createBtn.disabled=true;
    setTimeout(() => {
        // flashcard created feedback: remove feedback
        dbIconBtn?.classList.add('d-none');
        createBtn.disabled="";

        // flashcard input cleanup/reset
        (function resetForm(formDataObject){
            /* Resets form to initial state. 
                TODO: factor this function out of this eventListener and
                    call the function here and create a button on the 
                    webpage to allow resetting of the form.
                TODO: input[#tags]:required is not being respected. Validate when btn[#btn-create]:click()
            */

            const iteratorKeys=formDataObject.keys();
            for(let inputId of iteratorKeys){
                document.getElementById(inputId).value="";
            }

            // reset remaining elements
            cancelBtn_image.click();
            cancelBtn_audio.click();
            cancelBtn_video.click();
            youTubeCancelBtn.click();
            document.getElementById('tag-confirmation-container').innerHTML='';
    
    
            fragmentBaseUrlAndNameArray.forEach(function(inputElem){
                inputElem.value='';
              });
            fragmentSubComponentArray.forEach(function(inputElem){
                inputElem.value='';
                inputElem.classList.remove('d-none');
            });
            outputDiv.innerHTML = "";
            textAreaWebpageElement.value='';
            document.getElementById('inlineRadio-regular')?.click();
            document.getElementById('inlineRadio-regular').checked=true;
            document.getElementById('question-tab')?.click();
            // removes tooltip for dblclick instructions when webpage radio is not active
            const hasBootstrapTooltip=clearTextDataBtn.hasAttribute('data-bs-toggle');
            if(hasBootstrapTooltip){ destroyBootstrapTooltip(clearTextDataBtn); }
            document.getElementById('tags')?.focus();
        })(flashcard.formData);
    }, 800);

    // const testDB=new Query(db);
    // testDB.getAll(); // doesn't show currently saved flashcard here, but does when manually doing so in console. May not have refreshed yet.

    // Memory clean up:
    revokeImageURL();
    revokeAudioURL();
    revokeVideoURL();
});

const testDB=new Query(db);
// testDB._question_sync('what'); // only prints result.

const btnSearch=document.getElementById('btn-search');
const searchElement=document.getElementById('input-search');
const searchResultsContainer=document.getElementById('search-results');
const paginationStatus=document.getElementById('record-count');
const descendingToggler=document.getElementById('descending-toggler');

let changeToggle=false;
descendingToggler?.addEventListener('change',function(){
    /* Remove pagination status when descending toggler is switched 
        during live querying. Turns back on after new cycle.
       Adjusting the calculation is not worth it at this point.
    */
   if(+paginationStatus.dataset.count!==0){
       paginationStatus.textContent="";
       changeToggle=true;
   }
});
searchElement?.addEventListener('change',function(){
    /* Fixes bug pagination status bug from changing queries. */
    paginationStatus.dataset.count=0;
    searchResultsContainer.innerHTML="";
    paginationStatus.textContent="";
})
btnSearch?.addEventListener('click',function(e){
    /* Searches database with pagination to prevent overflow. */
    // https://pouchdb.com/2014/04/14/pagination-strategies-with-pouchdb.html
    // https://github.com/garbados/pouchdb-paginators
    // https://stackoverflow.com/questions/70803475/pouchdb-pagination
    // https://github.com/toolbuilder/pouchdb-paginated-query
    e.preventDefault();

    const queryString=this.form.querySelector('#input-search').value;

    // startKey base for next pagination offset
    const lastId=searchResultsContainer?.lastElementChild?.dataset._id;
    const isDescending=descendingToggler?.checked;
    let totalRecords=null;
    testDB._question_async_page(queryString,lastId,isDescending).then(records=>{
        if(records!==null){
            // records set to null when query input === "".
            const frag=document.createDocumentFragment();
            records.rows.forEach(element => {
                const li = document.createElement('li');
                li.textContent=element.value.question;
                li.dataset._id=element.id;
                li.dataset._rev=element.value._rev;
                li.ondblclick=function(){
                    console.log(this.dataset._id);
                    console.log(this.dataset._rev);
                    console.log('Repopulate flashcard builder for editing.')
                };
                frag.append(li);
            });
            searchResultsContainer.innerHTML="";
            searchResultsContainer?.append(frag);

            const previousCount = parseInt(paginationStatus?.dataset.count);
            totalRecords=records.total_rows;
            const currentCount = previousCount+records.rows.length;
            paginationStatus.dataset.count=currentCount;
            // pagination status
            if(changeToggle===false){
                paginationStatus.textContent=`${currentCount}/${records.total_rows}`;
            }
            if(!records.rows.length){
                paginationStatus.dataset.count=0;
                paginationStatus.textContent="";
                changeToggle=false;
            }
        }else{
            searchResultsContainer.innerHTML="";
            paginationStatus.textContent="";
        }


    /* // working, but no pagination.
    testDB._question_async(e.target?.value).then(res=>{
        if(res!==null){
            const frag=document.createDocumentFragment();
            res.forEach(element => {
                const li = document.createElement('li');
                li.textContent=element.value;
                li.dataset._id=element.id;
                li.dataset._rev=element.key;
                li.setAttribute('style','cursor:pointer');
                li.ondblclick=function(){console.log('Repopulate flashcard builder for editing.')};
                frag.append(li);
            });
            searchResultsContainer.innerHTML="";
            searchResultsContainer?.append(frag);
        }else{
            searchResultsContainer.innerHTML="";
        }
    */

        // console.log(res);
    });
});


// Review flashcard
const reviewOutputDiv=document.getElementById('review-flashcard');
const getFlashcardBtn=document.getElementById('getDoc');
getFlashcardBtn?.addEventListener('click',function(e){
    e.preventDefault();
    testDB._async_get_record().then(record=>{
        const flashcard=record.rows[0].doc;
        // const questionAnswerArray=Object.entries(flashcard);
        // console.log('num items: ',questionAnswerArray.length);
        for(const key in flashcard){
            console.log(`${key}: ${flashcard[key]}`)

        }

        // reviewOutputDiv.textContent=JSON.stringify(record.rows[0].doc);
    })
});

