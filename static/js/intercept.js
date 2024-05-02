const settingsHref = document.getElementById('anchor-settings');

settingsHref?.addEventListener('click', event=>{
    event.preventDefault();
    const pemUrl = localStorage.getItem('studypal_public_key');

    console.log(pemUrl)
    console.log(settingsHref)
});