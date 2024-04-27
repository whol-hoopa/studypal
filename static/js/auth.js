const btnLogin = document.getElementById('btn-login');
btnLogin?.addEventListener('click',(e)=>{
    e.preventDefault();
    const credentials = extractCredentials(e.target?.form);

    authenticate(credentials)
        .then(resp=>{

            if(resp.status!==200){
                document.getElementById('response').innerHTML=`<h1 class='text-danger'>Authentication Error</h1>`;
                throw `Error code ${resp.status}: ${resp.statusText}`
            }          
            
            return resp.text();
        }).then(html => {
            console.log(html)
            document.getElementById('response').innerHTML=html;
            setTimeout(() => {
                window.location.href = '/review/';
            }, 1000);
        }).catch(error=>{
            console.error(error)
        });
    
})

/**
 * Extracts email and password form a form element.
 * @param {HTMLFormElement} form - Login form element.
 * @returns {Object} Object containing email and password.
 */
function extractCredentials (form){
    if(form instanceof HTMLFormElement && form.password.value && form.email.value){
        const credentials = {
            [form.email.name]:form.email.value,
            [form.password.name]:form.password.value
        };
        return credentials;
    }
}

async function authenticate (credentials){
    const resp = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
    });

    return resp;
}