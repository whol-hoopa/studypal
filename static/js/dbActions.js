
// Create flashcard
document.getElementById('create-btn')?.addEventListener('click',function(e){
    // identical evListener in html on line 1411.
    // https://pouchdb.com/api.html#save_attachment
    e.preventDefault();

    const flashcard = new Flashcard(e.target?.form);
    // flashcard.logForm();
    flashcard.logFormData();
    // console.log(flashcard.numInputs);
    // console.log(flashcard.doc);
    flashcard.addFlashcard();
    // console.log(flashcard.lastSavedCard); // doesn't work as expected. empty obj.
    // flashcard.print();
    flashcard.pprint();

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
btnSearch?.addEventListener('click',function(e){
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
                li.setAttribute('style','cursor:pointer');
                li.ondblclick=function(){
                    console.log(this.dataset._id);
                    console.log(this.dataset._rev);
                    console.log('Repopulate flashcard builder for editing.')
                };
                frag.append(li);
            });
            searchResultsContainer.innerHTML="";
            searchResultsContainer?.append(frag);

            // pagination status
            if(changeToggle===false){
                const previousCount = parseInt(paginationStatus?.dataset.count);
                totalRecords=records.total_rows;
                const currentCount = previousCount+records.rows.length;
                paginationStatus.dataset.count=currentCount;
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

