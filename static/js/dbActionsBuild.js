

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
        // setTimout upon creation of flashcard does two things: 1) prevents dblclick duplicates. 2) spaces out _id by timeout. 
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

    // const dbQuery=new Query(db);
    // dbQuery.getAll(); // doesn't show currently saved flashcard here, but does when manually doing so in console. May not have refreshed yet.

    // Memory clean up:
    revokeImageURL();
    revokeAudioURL();
    revokeVideoURL();
});