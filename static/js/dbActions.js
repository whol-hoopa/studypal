document.getElementById('create-btn').addEventListener('click',function(e){
    // identical evListener in html on line 1411.
    // https://pouchdb.com/api.html#save_attachment
    e.preventDefault();

    const pouch = new Pouch(e.target.form);
    // pouch.logForm();
    // pouch.logFormData();
    // console.log(pouch.numInputs);
    // console.log(pouch.doc);
    // pouch.addFlashcard();
    pouch.print();
    pouch.pprint();

});