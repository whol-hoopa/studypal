const readClientHeightOnload=false;
const setTimeoutTimeOnload=60;
const getLastCreatedFlashcard=true;

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
            // MARK: Overflow container
            const divContent=document.createElement('div'),
                  divContentClass='px-1 pt-2 pb-5 px-sm-5 pt-sm-3 pb-sm-5 d-flex flex-column justify-content-center align-items-center';
                //   divContentClass='px-1 pt-2 pb-5 px-sm-5 pt-sm-3 pb-sm-5 d-flex flex-column overflow-management';
                    // flex-column else elements will display horizontally, not desired here.
                    // justify-content-center align-items-center: this inhibits overflow-management from working; led to non-viewable content on overflow-x.
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
    const mermaidElem=document.getElementById('mermaidElem');
    mermaid.init(undefined, mermaidElem);
    MathJax.typesetPromise();

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
        let maxHeight=0;
        const setByMarkdownOrYouTube=false;
        if(setByMarkdownOrYouTube){
            const cardComponents=document.getElementById('flashcard-components-container');
            for(let i of cardComponents?.children){
                maxHeight=i.clientHeight > maxHeight ? i.clientHeight : maxHeight;
            }
            document.getElementById('carouselIndicators')?.setAttribute('style',`min-height: ${maxHeight}px`);
        }
        else{
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
    queryObject
        .getRecordByID(_id)
        .then(flashcard=>{
            renderFlashcard(flashcard);
        });
        adjustFlashcardHeight();
}

// Monitoring an element for overflow and managing it. --chatGPT



// document.addEventListener("DOMContentLoaded", function() {
    // Your MutationObserver code here
    // Create a new instance of MutationObserver and specify a callback function
    const observer = new MutationObserver(function(mutationsList, observer) {
        // Iterate through the list of mutations
        mutationsList.forEach(function(mutation) {
            // console.log("mutation:", mutation);
            // Check if a class was added or removed
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                console.log('Class change detected:', mutation.target.className);
                // Perform actions based on the class change
                if(mutation.target.className.includes('active')){
                    const firstChild=mutation.target.firstChild;
                    if(firstChild.scrollWidth > firstChild.clientWidth){
                        // MARK: Overflow handler
                        console.log('is overflowing')
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
        });
    });



        // // Select the target node
        // const targetNodes = document.querySelectorAll('.carousel-item');

        // // Configure the MutationObserver to watch for changes to attributes
        // const config = { attributes: true, subtree: true };

        // targetNodes.forEach(targetNode=>{
        //     // Start observing the target node for changes
        //     observer.observe(targetNode, config);
        // });

        // console.log(targetNodes)

    setTimeout(() => {
        // Select the target node
        const targetNodes = document.querySelectorAll('.carousel-item');

        // Configure the MutationObserver to watch for changes to attributes
        const config = { attributes: true, subtree: true };

        targetNodes.forEach(targetNode=>{
            // Start observing the target node for changes
            observer.observe(targetNode, config);
        });

        // console.log(targetNodes)
    }, setTimeoutTimeOnload); // needed 30ms on my machine for nodes to load and log, else nodeList.len==0.

// });
