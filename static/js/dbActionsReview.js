

if(true){
    setTimeout(()=>{
        dbQuery
            .getLastCreatedFlashcard()
            .then(flashcard=>{
                renderFlashcard(flashcard);
            }).catch(err=>{
                console.error(err);
            });
        // flashcard must be rendered first in order to read clientHeight
        adjustFlashcardHeight();
    },60);
}else{
    setTimeout(()=>{
        dbQuery
            .getRandomFlashcard()
            .then(flashcard=>{
                renderFlashcard(flashcard);
            }).catch(err=>{
                console.error(err);
            });
        adjustFlashcardHeight();
    },60);
}

// Review flashcard
const getLastCreatedFlashcardBtn=document.getElementById('btn-last-created');
getLastCreatedFlashcardBtn?.addEventListener('click',function(e){
    e.preventDefault();

    dbQuery.getLastCreatedFlashcard().then(flashcard=>{
        renderFlashcard(flashcard);
    });
    // flashcard must be rendered first in order to read clientHeight
    adjustFlashcardHeight();
});
const getRandomFlashcardBtn=document.getElementById('btn-random');
getRandomFlashcardBtn?.addEventListener('click',function(e){
    e.preventDefault();
    dbQuery
        .getRandomFlashcard()
        .then(flashcard=>{
            renderFlashcard(flashcard);
        }).catch(err=>{
            console.error(err);
        })
    adjustFlashcardHeight();
});

function addIndicatorBtn(indexNum, isFirstBtn){
    /* add indicator button at bottom of carousel slides. */
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
function renderFlashcard(flashcard){
    /*
        Note: this just renders the flashcard, adjusting the height
            is accomplished by another function, adjustFlashcardHeight().
            DOM must be rendered first in order to read element's
                clientHeight property to get current height.
    */
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
                divContentClass='px-1 pt-2 pb-5 px-sm-5 pt-sm-3 pb-sm-5 d-flex justify-content-center align-items-center';
            const divContentContainer=document.createElement('div'),
                divContentContainerClass='carousel-item';

            if(key==='input-question'){
                divContent.textContent=flashcard[key]; // flashcard text
                divContentContainer.classList.add('active','invisible'); // show question on landing
                divContentContainer.setAttribute('id','fc-question');

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
                divContent.innerHTML=markdownConverter.makeHtml(flashcard[key]); // flashcard text
                
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
            if(key==='input-answer-mermaid'){
                divContent.textContent=flashcard[key]; // flashcard text
                divContent.classList.add('mermaid');
                divContentContainer.classList.add('active','invisible'); // must be active to render, set clientHeight, get rendered clientHeight; active removed below, causes flashing.
                divContent.setAttribute('id', 'mermaidElem');
                // mermaid.init(undefined, divContent);
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

                divContentContainer.classList.add('active','invisible'); // must be active to render, set clientHeight, get rendered clientHeight, invisible prevents flashing; these classes removed below.
                divContentContainer.setAttribute('id', 'youTubeElemContainer');

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

    containerFlashcard?.append(flashcardFrag);
    const containerIndicatorBtns=document.querySelector('.carousel-indicators');
    containerIndicatorBtns.innerHTML="";
    containerIndicatorBtns?.append(indicatorBtnFrag)
    MathJax.typesetPromise();
    const mermaidElem=document.getElementById('mermaidElem');
    mermaid.init(undefined, mermaidElem);

    setTimeout(() => {
        // goal: remove flashing from rendering mermaid.
        mermaidElem?.parentElement?.classList.remove('active', 'invisible');
        document.getElementById('youTubeElemContainer')?.classList.remove('active', 'invisible');
        document.getElementById('fc-question')?.classList.remove('invisible');
    }, 0);
}
function adjustFlashcardHeight(){
    /* set min-height of all containers to tallest container height.
        purpose: reduce height volatility between slides,
            and thus rendered content volatility.
        Centering with flexBox didn't solve centering; volatility remains.

        Setting timeout required to allow time for rendering so
        clientHeight property can be set by browser and thus read, else it's 0.
    */
    setTimeout(()=>{
        const cardComponents=document.getElementById('flashcard-components-container');
        let maxHeight=0;
        for(let i of cardComponents?.children){
            maxHeight=i.clientHeight > maxHeight ? i.clientHeight : maxHeight;
        }
        document.getElementById('carouselIndicators')?.setAttribute('style',`min-height: ${maxHeight}px`);
    },1);
}


/**
 * Renders flashcard by injecting carousel slides in #flashcard-components-container.
 * It also sets min-height to tallest of question, mermaid, or YouTube height.
 * @param {Query} queryObject - Custom Query class instance used to query a PouchDB instance.
 * @param {string} _id - The unique identifier for the flashcard document. It was originally derived from new Date().toISOString() upon flashcard creation.
 */
function renderOptimizedFlashcard(queryObject, _id){
    queryObject
        .getRecordByID(_id)
        .then(flashcard=>{
            renderFlashcard(flashcard);
        });
        adjustFlashcardHeight();
}