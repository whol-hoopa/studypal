const dbQuery=new Query(db);



// sidebar search feature
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
    dbQuery.searchWithPagination(queryString,lastId,isDescending).then(records=>{
        if(records!==null){
            // records set to null when query input === "".
            const frag=document.createDocumentFragment();
            // CHECK FOR MEMORY LEAKS. li eventlistener leading to leaks? li ref still bound?
            records.rows.forEach(element => {
                const li = document.createElement('li');
                li.textContent=element.value.question;
                li.dataset._id=element.id;
                li.dataset._rev=element.value._rev;
                li.ondblclick=function(e){
                    e.preventDefault();
                    console.log(this.dataset._id);
                    console.log(this.dataset._rev);
                    const currentURL=window.location.pathname;
                    if(currentURL.includes('review')){
                        renderOptimizedFlashcard(dbQuery, this.dataset._id);
                    }
                    if(currentURL.includes('build')){
                        console.log('Repopulate flashcard builder for editing.');
                        console.log(currentURL)
                    }
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
    dbQuery._question_async(e.target?.value).then(res=>{
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


