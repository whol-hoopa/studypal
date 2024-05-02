const settingsHref = document.getElementById('anchor-settings');

settingsHref?.addEventListener('click', async (event)=>{
    event.preventDefault();
    // const pemUrl = localStorage.getItem('studypal_public_key');
    const jwt = localStorage.getItem('studypal_jwt');

    // if(jwt && pemUrl){
    //     const isVerified = isAuthorized(jwt, pemUrl);
    //     console.log(isVerified)
    //     console.log(settingsHref)
    // }
    if(navigator.onLine){

        const resp = await fetch('/settings',{
            method: 'GET',
            headers: {
                'Accept': 'text/html',
                'authorization': `Bearer ${jwt}`
            }
        });
        if(resp.ok){
            const html = await resp.text();
            window.history.pushState({}, '', '/settings');
            document.body.innerHTML=html;
        }
    }

});