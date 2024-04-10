
// Create flashcard
document.getElementById('create-btn').addEventListener('click',function(e){
    // identical evListener in html on line 1411.
    // https://pouchdb.com/api.html#save_attachment
    e.preventDefault();

    const flashcard = new Flashcard(e.target.form);
    // flashcard.logForm();
    flashcard.logFormData();
    // console.log(flashcard.numInputs);
    // console.log(flashcard.doc);
    flashcard.addFlashcard();
    console.log(flashcard.lastSavedCard); // doesn't work as expected. empty obj.
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
// testDB._question_sync('1'); // only prints result.

testDB._question_async('1').then(res=> console.log(res));
