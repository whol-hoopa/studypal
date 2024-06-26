const readClientHeightOnload=false; // else min-height statically set to 25vh; recall this is done to reduce volatility between slide heights and thus content jumping/jerking
// MARK: TODO
const setTimeoutTimeOnload=60; // need time for node to load in order to read clientHeight, else dynamic setting of min-height won't work; TODO: mutation observer may work well here; 60ms is specific to my machine... and sometimes that wasn't long enough...
const getLastCreatedFlashcard=true;  // else random fc onLoad

// Development: whether to set fixed min-height on flashcard or allow YouTube or mermaid to dictate min-height. purpose: to reduce height volatility on fc slide 'pagination'
if(readClientHeightOnload){
    if(getLastCreatedFlashcard){
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
        },setTimeoutTimeOnload);
    }else if(!getLastCreatedFlashcard){
        setTimeout(()=>{
            dbQuery
                .getRandomFlashcard()
                .then(flashcard=>{
                    renderFlashcard(flashcard);
                }).catch(err=>{
                    console.error(err);
                });
            adjustFlashcardHeight();
        },setTimeoutTimeOnload);
    }
}else if(!readClientHeightOnload){
    if(getLastCreatedFlashcard){

        dbQuery
            .getLastCreatedFlashcard()
            .then(flashcard=>{
                renderFlashcard(flashcard);
            }).catch(err=>{
                console.error(err);
            });
        // flashcard must be rendered first in order to read clientHeight
        adjustFlashcardHeight();

    }else if(!getLastCreatedFlashcard){

        dbQuery
            .getRandomFlashcard()
            .then(flashcard=>{
                renderFlashcard(flashcard);
            }).catch(err=>{
                console.error(err);
            });
        adjustFlashcardHeight();

    }
}

// ObjectURLs must be revoked when no longer used to avoid memory leaks. Especially for large files like video|audio.
let global_AUDIO_OBJECT_URL=null;
let global_VIDEO_OBJECT_URL=null;
// coded in class Query:
// function revokeObjectURLs(){
//     if(global_AUDIO_OBJECT_URL){
//         URL.revokeObjectURL(global_AUDIO_OBJECT_URL);
//         global_AUDIO_OBJECT_URL=null;
//     }
//     if(global_VIDEO_OBJECT_URL){
//         URL.revokeObjectURL(global_VIDEO_OBJECT_URL);
//         global_VIDEO_OBJECT_URL=null;
//     }
// }


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


const btnGradesContainer= document.getElementById('btn-grades-container');
btnGradesContainer?.addEventListener('click',event=>{
    const gradeBtn=event.target;
    if(gradeBtn && gradeBtn.id){
        const score=gradeBtn.id.split('-');
        const scoreMap={
            [score[0]]: parseInt(score[1]), // using square brackets [] to create a dynamic `computed property` name at runtime, else propName error.
            lastReviewed: new Date().toISOString()
        };
        // scoreMap[score[0]]=parseInt(score[1]);
        // scoreMap['lastReviewed']= (new Date().toISOString());

        const cardContainer= document.getElementById('flashcard-components-container');
        const _id= cardContainer?.dataset._id;
        const _rev= cardContainer?.dataset._rev;

        // ADD moving average grade field/function
        if(_id && _rev && scoreMap){

            dbQuery.updateScoreAndLastReviewedDate(_id, _rev, scoreMap);
        }

        dbQuery.revokeObjectURLs(global_AUDIO_OBJECT_URL, global_VIDEO_OBJECT_URL); // to avoid memory leaks from audio|video content
    }
});




/**
 * Add indicator button at bottom of carousel slides. Actually, it returns a button; you need to add it separately.
 * @param {number} indexNum - Index to position the carousel indicator button. 
 * @param {boolean} isFirstBtn - Set to true for the first instance of an added button.
 * @returns
 */
function addIndicatorBtn(indexNum, isFirstBtn){
    /* add indicator button at bottom of carousel slides. */
    isFirstBtn=isFirstBtn||false;
    const slideBtn=document.createElement('button');
    slideBtn.setAttribute('type','button');
    slideBtn.setAttribute('data-bs-target','#carouselIndicators');
    slideBtn.setAttribute('data-bs-slide-to',indexNum.toString());
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
    const allowableIdsToRender=[
        'input-question', 'input-answer', 'input-answer-markdown',
        'input-answer-latex', 'input-answer-mermaid', 
        'input-answer-webpage-anchor', 'input-youtube'
    ];
    const containerFlashcard=document.getElementById('flashcard-components-container');
    if(containerFlashcard){
        containerFlashcard.innerHTML="";
    }
    const flashcardFrag=document.createDocumentFragment();
    const indicatorBtnFrag=document.createDocumentFragment();

    let indicatorBtnNum=0;
    for(const key in flashcard){
        if(['_id','_rev'].includes(key)){
            containerFlashcard?.setAttribute(`data-${key}`,flashcard[key]); // flashcard id/rev
        }
        if(key==='tags'){
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
            if(tagContainer){
                tagContainer.innerHTML='';
            }
            tagContainer?.append(fragmentElement);                
        }
        if(allowableIdsToRender.includes(key)){
            log(`${key}: ${flashcard[key]}`);
            // MARK: Overflow container
            const divContent=document.createElement('div'),
                  divContentClass='px-1 pt-2 pb-5 px-sm-5 pt-sm-3 pb-sm-5 d-flex flex-column justify-content-center align-items-center'; // bootstrap classes on element
                    // flex-column else elements will display horizontally, not desired here.
                    // justify-content-center align-items-center: this inhibits overflow-management from working; led to non-viewable content on overflow-x. dynamic removal of those rules added scroll-x
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

                const slideBtn=addIndicatorBtn(indicatorBtnNum,false);
                indicatorBtnFrag.append(slideBtn);
                indicatorBtnNum++;
            }
            if(key==='input-answer-markdown'){
                const tasklistExtension = {
                    type: 'lang', // Specify that it's a language extension
                    filter: function(text) {
                        // Regular expression to match task list items
                        const taskListRegex = /- \[( |x)\] (.*)/g;
                        
                        // Replace task list syntax with HTML checkboxes
                        return text.replace(taskListRegex, function(match, checked, label) {
                            const isChecked = checked.trim() === 'x' ? 'checked' : ''; // Check if task is completed
                            return '<label><input type="checkbox" ' + isChecked + '> ' + label + `</label><br>`;
                        });
                    }
                };
                // const markdownTextExample = `
                //   - [x] Task 1  
                //   - [ ] Task 2
                //   `;
                const markdownConverter = new showdown.Converter({
                    extensions: [tasklistExtension],
                    tables:true,
                    strikethrough:true,
                  });
                divContent.innerHTML=markdownConverter.makeHtml(flashcard[key]); // flashcard text
                
                const slideBtn=addIndicatorBtn(indicatorBtnNum,false);
                indicatorBtnFrag.append(slideBtn);
                indicatorBtnNum++;
            }
            if(key==='input-answer-latex'){
                divContent.textContent=flashcard[key]; // flashcard text
                log('latex');
                const slideBtn=addIndicatorBtn(indicatorBtnNum,false);
                indicatorBtnFrag.append(slideBtn);
                indicatorBtnNum++;
            }
            if(key==='input-answer-mermaid'){
                divContent.textContent=flashcard[key]; // flashcard text
                divContent.classList.add('mermaid');
                divContentContainer.classList.add('active','invisible'); // must be active to render, set clientHeight, get rendered clientHeight; active removed below, causes flashing.
                divContent.setAttribute('id', 'mermaidElem');
 
                const slideBtn=addIndicatorBtn(indicatorBtnNum,false);
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

                const slideBtn=addIndicatorBtn(indicatorBtnNum,false);
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
                iframe?.setAttribute('allow','accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                // Firefox:
                    // Feature Policy: Skipping unsupported feature name “accelerometer”.
                    // Feature Policy: Skipping unsupported feature name “clipboard-write”.
                    // Feature Policy: Skipping unsupported feature name “encrypted-media”.
                    // Feature Policy: Skipping unsupported feature name “gyroscope”.
                    // Feature Policy: Skipping unsupported feature name “picture-in-picture”.
                    // Feature Policy: Skipping unsupported feature name “webshare”.
                //Edge:
                    // Unrecognized feature: 'webshare'.

                // iframe?.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
                    //This policy sends a full URL as a referrer when the request is made from the same origin (same domain, protocol, and port), but only sends the origin (scheme, host, and port) when the request is made to a different origin (cross-origin).
                iframe?.setAttribute('allowfullscreen','');
                divContent.append(iframe);

                divContentContainer.classList.add('active','invisible'); // must be active to render, set clientHeight, get rendered clientHeight, invisible prevents flashing; these classes removed below.
                divContentContainer.setAttribute('id', 'youTubeElemContainer');

                const slideBtn=addIndicatorBtn(indicatorBtnNum,false);
                indicatorBtnFrag.append(slideBtn);
                indicatorBtnNum++;
            }       

            // re-creating/populating/setting bootstrap classes on element
            divContent.classList.add(...divContentClass.split(' '));
            divContentContainer.append(divContent);
            divContentContainer.classList.add(divContentContainerClass);
            flashcardFrag.append(divContentContainer);
        }
    }

    containerFlashcard?.append(flashcardFrag);
    const containerIndicatorBtns=document.querySelector('.carousel-indicators');
    if(containerIndicatorBtns){
        containerIndicatorBtns.innerHTML="";
    }
    containerIndicatorBtns?.append(indicatorBtnFrag)
    const mermaidElem=document.getElementById('mermaidElem');
    mermaid.init(undefined, mermaidElem);
    MathJax.typesetPromise();

    setTimeout(() => {
        // goal: remove flashing from rendering mermaid.
        mermaidElem?.parentElement?.classList.remove('active', 'invisible');
        document.getElementById('youTubeElemContainer')?.classList.remove('active', 'invisible');
        document.getElementById('fc-question')?.classList.remove('invisible');
    }, 0);

    renderAttachments(flashcard);
}

async function renderAttachments(flashcard){
    // blob attachments ie image, audio, video files
    if(flashcard?._attachments){
        const objectKeys = Object.keys(flashcard._attachments);
   
        for(let i=0; i<objectKeys.length; i++){
            const divContent=document.createElement('div'),
                divContentClass='px-1 pt-2 pb-5 px-sm-5 pt-sm-3 pb-sm-5 d-flex flex-column justify-content-center align-items-center';
            divContent.classList.add(...divContentClass.split(' ')); // bootstrap classes
            const divContentContainer=document.createElement('div'),
                divContentContainerClass='carousel-item';
            divContentContainer.classList.add(divContentContainerClass);

            const containerIndicatorBtns=document.querySelector('.carousel-indicators');
            const containerFlashcard= document.getElementById('flashcard-components-container');

            if(objectKeys[i].startsWith('image')){
                const imageBlob= await dbQuery.getAttachmentBlobURL(flashcard._id, objectKeys[i]);
                    // global imageBlob not needed bc image behaves well when revoked here.
                
                const imgTag= document.createElement('img');
                // MARK: TODO: add alt attr Input
                imgTag.alt='flashcard image you saved.';
                imgTag.src=imageBlob;

                // Add event listener to revoke the URL after the image has loaded
                imgTag.addEventListener('load', function() {
                    URL.revokeObjectURL(imageBlob);
                }, false);

                // add image to container
                divContent.append(imgTag);
                divContentContainer.append(divContent);
                containerFlashcard?.append(divContentContainer);
                
                // add indicator btn
                if(containerIndicatorBtns){
                    const btnIndexPosition=containerIndicatorBtns.childElementCount;
                    const slideBtn=addIndicatorBtn(btnIndexPosition,false);
                    containerIndicatorBtns.append(slideBtn);
                }     
            }
            if(objectKeys[i].startsWith('audio')){
                global_AUDIO_OBJECT_URL= await dbQuery.getAttachmentBlobURL(flashcard._id, objectKeys[i]);
                const audioTag= document.createElement('audio');
                audioTag.setAttribute('controls','true');

                // Add event listener to revoke the URL after the audio has loaded; doesn't work as expected on chromium; too strict.
                // audioTag.addEventListener('canplaythrough', function() {
                //     URL.revokeObjectURL(global_AUDIO_OBJECT_URL);
                // }, false);

                const sourceTag=document.createElement('source');
                const mimeType=flashcard._attachments[objectKeys[i]].content_type;
                sourceTag.type=mimeType;
                sourceTag.src=global_AUDIO_OBJECT_URL;

                audioTag.append(sourceTag, "Your browser does not support the audio element. Upgrade to a modern browser.");

                divContent.append(audioTag);
                divContentContainer.append(divContent);
                containerFlashcard?.append(divContentContainer);

                if(containerIndicatorBtns){
                    const btnIndexPosition=containerIndicatorBtns.childElementCount;
                    const slideBtn=addIndicatorBtn(btnIndexPosition,false);
                    containerIndicatorBtns.append(slideBtn);
                }
            }
            if(objectKeys[i].startsWith('video')){
                global_AUDIO_OBJECT_URL= await dbQuery.getAttachmentBlobURL(flashcard._id, objectKeys[i]);

                const videoTag= document.createElement('video');
                videoTag.setAttribute('controls','true');

                // Add event listener to revoke the URL after the audio has loaded
                // videoTag.addEventListener('canplaythrough', function() {
                //     URL.revokeObjectURL(global_AUDIO_OBJECT_URL);
                // }, false);

                const sourceTag=document.createElement('source');
                const mimeType=flashcard._attachments[objectKeys[i]].content_type;
                sourceTag.type=mimeType;
                sourceTag.src=global_AUDIO_OBJECT_URL;

                videoTag.append(sourceTag, "Your browser does not support the video element. Upgrade to a modern browser.");

                divContent.append(videoTag);
                divContentContainer.append(divContent);
                containerFlashcard?.append(divContentContainer);

                if(containerIndicatorBtns){
                    const btnIndexPosition=containerIndicatorBtns.childElementCount;
                    const slideBtn=addIndicatorBtn(btnIndexPosition,false);
                    containerIndicatorBtns.append(slideBtn);
                }
            }
        }
    }
}

function adjustFlashcardHeight(){
    /* set min-height of all containers to tallest container height.
        purpose: reduce height volatility between slides,
            and thus rendered content volatility.
        Centering with flexBox didn't solve centering; volatility remains.

        Current code observe's YouTube and mermaid slides to set maxHeight when not hard coded.
            Visibility is set in renderFlashcard(); card must be visible to read rendered height.

        Setting timeout required to allow time for rendering so
        clientHeight property can be set by browser and thus read, else it's 0.
    */
    setTimeout(()=>{
        let maxHeight=0;
        const setByMermaidOrYouTube=false;
        if(setByMermaidOrYouTube){
            const cardComponents=document.getElementById('flashcard-components-container');
            if(cardComponents){
                for(let i of cardComponents.children){
                    maxHeight=i.clientHeight > maxHeight ? i.clientHeight : maxHeight;
                }
                document.getElementById('carouselIndicators')?.setAttribute('style',`min-height: ${maxHeight}px`);
            }
        }
        else{
            // hard coded height rather than arbitrary maxHeight of observed fc component slide.
            document.getElementById('carouselIndicators')?.setAttribute('style',`min-height: 25vh;`);
        }
    },1);
}


/**
 * Renders flashcard by injecting carousel slides in #flashcard-components-container.
 * It also sets min-height to tallest of question, mermaid, or YouTube height.
 * @param {Query} queryObject - Custom Query class instance used to query a PouchDB instance.
 * @param {string} _id - The unique identifier for the flashcard document. It was originally derived from new Date().toISOString() upon flashcard creation.
 */
function renderOptimizedFlashcard(queryObject, _id){
    // used in btnSearch listener in dbQuery.searchWithPagination() in dbActions.js
    queryObject
        .getRecordByID(_id)
        .then(flashcard=>{
            renderFlashcard(flashcard);
        });
        adjustFlashcardHeight();
}


// MARK: Overflow handler
// Monitoring an element for overflow and managing it. Done bc certain elements were not responsive in mobile and needed scroll-x on overflow.
// Create a new instance of MutationObserver and specify a callback function
/**
 * Observes element(s) for change and responds according to code written.
 * @param {function} mutationHandler - callback function to handle mutation event.
 * @param {MutationObserver|null} observerToDisconnect - An instance of any mutation observer to disconnect, or null if not applicable.
 * @returns {MutationObserver} The Created MutationObserver.
 */
function mutationObserver(mutationHandler, observerToDisconnect){
    return new MutationObserver(function(mutationsList, thisObserver){
        mutationsList.forEach(function(mutation){
            mutationHandler(mutation, thisObserver, observerToDisconnect);
        });
    });
}


function carouselItemsObserverHandler(mutation, thisObserver, observerToDisconnect){
    if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target.className.includes('active')) {
        // Perform actions based on the class change
        if(observerToDisconnect){
            observerToDisconnect.disconnect();
        }

        const firstChild=mutation.target.firstChild;
        if(firstChild.scrollWidth > firstChild.clientWidth){
            // console.log('is overflowing');
            firstChild.classList.remove('justify-content-center', 'align-items-center');
        }
        // else{
        //     // this will just reverse the removal bc the loop runs more than once due to other 
        //       // bootstrap class manipulations on the element eg next&previous button className toggling.
        //     // this is kind of ok, bc the next loaded fc will come with the justify & align set, so
        //       // if the overflow was temporary due to browser resizing, it will reset.
        //       // However, for mobile, this observer will run for each new card.
        //     firstChild.classList.add('justify-content-center', 'align-items-center');
        // }
    }
}

function carouselInnerContainerHandler(mutation, thisObserver, observerToDisconnect){
    if (mutation.type === 'attributes' && mutation.attributeName?.includes('_id') && mutation.target.dataset._id!==mutation.oldValue) {            
        // observe new fc components for overflow. Old fc already removed from DOM.

        if(observerToDisconnect){
            // initially designed to disconnect observer for removed flashcard; container.innerHTML=''; To un-inhibit garbage collection.
            observerToDisconnect.disconnect();
        }

        const flashcardComponentObserver=mutationObserver(carouselItemsObserverHandler, observerToDisconnect);
        const configFlashcardComponents = { attributes: true }; // observing element's attr
        mutation.target.childNodes.forEach(targetNode=>{
            // Start observing the target node for changes
            flashcardComponentObserver.observe(targetNode, configFlashcardComponents);
        });
    }
}

setTimeout(() => {
    // const config = { attributes: true, subtree: true };

    // observe flashcard components for overflow-x
    const flashcardComponentObserver= mutationObserver(carouselItemsObserverHandler,null);
    
    const targetNodes= document.querySelectorAll('.carousel-item');
    const configFlashcardComponents= { attributes: true }; // observing element's attr
    targetNodes.forEach(targetNode=>{
        // Start observing the target node for changes
        flashcardComponentObserver.observe(targetNode, configFlashcardComponents);
    });

    // observe flashcard container for new flashcards
    const newFlashcardObserver= mutationObserver(carouselInnerContainerHandler,flashcardComponentObserver);
    const configNewFlashcard= { attributes: true, attributeOldValue:true }; // oldValue for _id observation
    // observe container for a change in flashcard; when true, set childNodes ie new fc components to be observed for overflow.
    const flashcardContainer= document.getElementById('flashcard-components-container');
    if(flashcardContainer){
        // IDE complaining about potential illegal null value, so if'd it.
        newFlashcardObserver.observe(flashcardContainer, configNewFlashcard);
        window.addEventListener('beforeunload', ()=>{
            newFlashcardObserver.disconnect();
        })
    }
}, setTimeoutTimeOnload); // needed 30ms on my machine for nodes to load and log, else nodeList.len==0.

