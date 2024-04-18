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

            // add evListener for contextmenu to modify flashcard state (edit/delete)
            var listItems = document.querySelectorAll("#search-results li");
            listItems.forEach(function(item) {
                item.addEventListener("contextmenu", handleRightClick);
            });

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


/* Search results editing optionality via custom context menu */
// remove context menu from sidebar when user left clicks away after displaying context menu
document.addEventListener('click', handleLeftClickOutsideContextMenu);

// remove context menu from sidebar when user right clicks away after displaying context menu
document.addEventListener('contextmenu', handleRightClickOutsideContextMenu);

function handleLeftClickOutsideContextMenu(event) {
    const contextMenu=document.querySelector('.context-menu');

    if (contextMenu && !contextMenu.contains(event.target)) {
        // Left click occurred outside of the context menu
        contextMenu.remove();
    }
}
function handleRightClickOutsideContextMenu(event) {
    const contextMenu=document.querySelector('.context-menu');
    const contextMenus=document.querySelectorAll('.context-menu');
    console.log(event.target)
    if (contextMenu && !contextMenu.contains(event.target)) {
        // is triggering element a descendent of contextMenu
        // has custom contextmenu open & user clicks right btn outside of the existing opened contextmenu; leading to multiple rendered menus
        if(contextMenus.length>1 || !event.target.dataset._id){
            //  remove previously opened custom contextmenu; keep last opened.
            //  user right clicks outside, but only one context menu open; remove the single context menu.
            contextMenus[0].remove();
        }
    }
}

// sidebar flashcard search result editing|deleting feature via context menu
// Function to handle the right-click event on search result li element; show custom context menu.
function handleRightClick(event) {
    event.preventDefault(); // Prevent the default context menu from appearing
    // Create the context menu
    const contextMenu = document.createElement("div");
    contextMenu.className = "context-menu"; // to add styles and as selector for managing context menu instance(s)

    // Get flashcard id to delete.
    const currentListItem=event.target; // the <li> representing the target flashcard.
    const _id=currentListItem.dataset._id;
    const _rev=currentListItem.dataset._rev;
    
    // Create the delete option
    const deleteOption = document.createElement("div");
    deleteOption.textContent = "Delete from Database";
    deleteOption.className = "context-menu-option";
    deleteOption.addEventListener("dblclick", function() {
  
        // Remove flashcard from database.
        // dbQuery is Query class instantiated at top of this file to query PouchDB.
        dbQuery.deleteFlashcard(_id,_rev);

        // Delete the clicked <li> element representing the flashcard deleted.
        currentListItem.remove();

        // update search btn pagination status
        const paginationStatusText=paginationStatus?.textContent; // global variable from top of file: paginationStatus 
        const paginationValues = paginationStatusText?.split('/');
        if(paginationStatus && paginationValues && paginationValues?.length>1){
            let numerator = parseInt(paginationValues[0]);
            let denominator = parseInt(paginationValues[1]);
            numerator--;
            denominator--;
            paginationStatus.textContent=`${numerator}/${denominator}`;
            paginationStatus.dataset.count=numerator.toString();
        }

        // Remove the context menu after deleting.
        contextMenu.remove();
    });
  
    // TODO: Add an Edit option
    const editOption = document.createElement("div");
    editOption.textContent="Edit Flashcard";
    editOption.className="context-menu-option"; // to add css cursor:pointer
    editOption.addEventListener('dblclick', function(event){
  
      // handle edit event...
  
      
  
      // remove context menu after event
      contextMenu.remove();
    });
  
    // Append the delete option to the context menu
    contextMenu.appendChild(deleteOption);
    contextMenu.appendChild(editOption);
    
    // Position the context menu
    contextMenu.style.top = event.clientY + "px";
    contextMenu.style.left = event.clientX + "px";
    
    // Append the context menu to the body
    document.body.appendChild(contextMenu);
}
