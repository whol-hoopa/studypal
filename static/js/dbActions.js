
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
    function addIndicatorBtn(indexNum, isFirstBtn){
        isFirstBtn=isFirstBtn||false;
        const slideBtn=document.createElement('button');
        slideBtn.setAttribute('type','button');
        slideBtn.setAttribute('data-bs-target','#carouselIndicators');
        slideBtn.setAttribute('data-bs-slide-to',indexNum);
        slideBtn.setAttribute('aria-label',`Slide ${indexNum+1}`);
        if(isFirstBtn){
            slideBtn.setAttribute('class','active');
            slideBtn.setAttribute('aria-current','true');
        }
        return slideBtn;
    }
    testDB._async_get_record().then(record=>{
        const flashcard=record.rows[0].doc;
        // const questionAnswerArray=Object.entries(flashcard);
        // console.log('num items: ',questionAnswerArray.length);

        const containerFlashcard=document.getElementById('flashcard-components-container');
        containerFlashcard.innerHTML="";
        const flashcardFrag=document.createDocumentFragment();
        const indicatorBtnFrag=document.createDocumentFragment();

        let indicatorBtnNum=0;
        for(const key in flashcard){

            if(['_id','_rev'].includes(key)){
                containerFlashcard?.setAttribute(`data-${key}`,flashcard[key]); // flashcard id/rev
            }else if(key==='tags'){
                // Hash tag processing
                const tags=flashcard[key];
                const tagsArray=tags.split(',');
                const fragmentElement=document.createDocumentFragment();
                for(let i=0; i<tagsArray.length; i++){
                    const item=tagsArray[i];
                    const div=document.createElement('div');
                    div.classList.add('rounded','border','border-warning');
                    div.append(item)
                    fragmentElement.append(div);
                }
                const tagContainer=document.getElementById('tag-container');
                tagContainer.innerHTML='';
                tagContainer?.append(fragmentElement);                
            }else if(key==='_attachments'){
                console.log('attachments:\n',flashcard[key])
            }else{
                console.log(`${key}: ${flashcard[key]}`);
                const divContent=document.createElement('div'),
                    divContentClass='px-1 pt-2 pb-5 px-sm-5 pt-sm-3 pb-sm-5 d-flex justify-content-center';
                const divContentContainer=document.createElement('div'),
                    divContentContainerClass='carousel-item';

                if(key==='input-question'){
                    divContent.textContent=flashcard[key]; // flashcard text

                    divContentContainer.classList.add('active'); // show question on landing
                    const slideBtn=addIndicatorBtn(indicatorBtnNum,true);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                if(key==='input-answer'){
                    divContent.textContent=flashcard[key]; // flashcard text

                    const slideBtn=addIndicatorBtn(indicatorBtnNum);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                if(key==='input-answer-markdown'){
                    const markdownConverter = new showdown.Converter();
                    divContent.innerHTML=markdownConverter.makeHtml(flashcard[key]);

                    // divContent.textContent=flashcard[key]; // flashcard text
                    
                    const slideBtn=addIndicatorBtn(indicatorBtnNum);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                if(key==='input-answer-latex'){
                    divContent.textContent=flashcard[key]; // flashcard text

                    const slideBtn=addIndicatorBtn(indicatorBtnNum);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                /*
                        <script>
                            // LaTex, & Mermaid preview output
                            textAreaLaTexElement.addEventListener("input", function () {
                                const textAreaContent = this.value;
                                outputDiv.textContent=textAreaContent;
                                MathJax.typesetPromise();
                            });
                            textAreaMermaidElement.addEventListener("input", function () {
                                outputDiv.innerHTML = "";
                                // create new div to ensure mermaid rerenders else no image shown just from inserting text.
                                const mermaidElem = document.createElement("div");
                                mermaidElem.className = "mermaid";
                                mermaidElem.textContent = this.value;
                                outputDiv.appendChild(mermaidElem);
                                mermaid.init(undefined, mermaidElem);
                            });
                        </script>

                */
                if(key==='input-answer-mermaid'){
                    divContent.textContent=flashcard[key]; // flashcard text

                    const slideBtn=addIndicatorBtn(indicatorBtnNum);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                if(key==='input-answer-webpage-anchor'){
                    const name_url=flashcard[key].split('@');
                    const aTag=document.createElement('a');
                    aTag.setAttribute('href', name_url[1]);
                    aTag.setAttribute('target','_blank');
                    aTag.setAttribute('rel','noopener nofollow noreferrer');
                    aTag.classList.add('fs-1');
                    aTag.textContent=name_url[0]; // flashcard text
                    divContent.append(aTag);

                    const slideBtn=addIndicatorBtn(indicatorBtnNum);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                if(key==='input-youtube'){
                    
                    const iframe=document.createElement('iframe');
                    // TODO: make responsive
                        // on mobile, prev/next btn 'covers' play and fullscreen buttons. 
                    iframe?.setAttribute('width','560');
                    iframe?.setAttribute('height','315');

                    iframe?.setAttribute('src',flashcard[key]);
                    iframe?.setAttribute('title','YouTube video player');
                    iframe?.setAttribute('frameborder','0');
                    iframe?.setAttribute('allow','accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; webshare');
                    // Firefox:
                        // Feature Policy: Skipping unsupported feature name “accelerometer”.
                        // Feature Policy: Skipping unsupported feature name “clipboard-write”.
                        // Feature Policy: Skipping unsupported feature name “encrypted-media”.
                        // Feature Policy: Skipping unsupported feature name “gyroscope”.
                        // Feature Policy: Skipping unsupported feature name “picture-in-picture”.
                        // Feature Policy: Skipping unsupported feature name “webshare”.

                    // iframe?.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
                        //This policy sends a full URL as a referrer when the request is made from the same origin (same domain, protocol, and port), but only sends the origin (scheme, host, and port) when the request is made to a different origin (cross-origin).
                    iframe?.setAttribute('allowfullscreen','');
                    divContent.append(iframe);

                    const slideBtn=addIndicatorBtn(indicatorBtnNum);
                    indicatorBtnFrag.append(slideBtn);
                    indicatorBtnNum++;
                }
                divContent.classList.add(...divContentClass.split(' '));
                divContentContainer.append(divContent);
                divContentContainer.classList.add(divContentContainerClass);
                flashcardFrag.append(divContentContainer);
            }

        }
        
        // containerFlashcard.innerHTML=""; 
        containerFlashcard?.append(flashcardFrag);
        const containerIndicatorBtns=document.querySelector('.carousel-indicators');
        containerIndicatorBtns.innerHTML="";
        containerIndicatorBtns?.append(indicatorBtnFrag)
        // reviewOutputDiv.textContent=JSON.stringify(record.rows[0].doc);
    })
});

// dynamically append flashcard components to slides


