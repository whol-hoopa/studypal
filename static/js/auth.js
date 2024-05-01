const btnLogin = document.getElementById('btn-login');
btnLogin?.addEventListener('click',(e)=>{
    e.preventDefault();

    const messageElement= document.getElementById('response');

    try {
        var credentials = extractCredentials(e.target?.form);
    }catch(error){
        if(messageElement){
            messageElement.innerHTML=`<h1 class='text-danger'>Please enter credentials.</h1>`;
            throw error.message;
        }
    }


    // check localStorage for public.pem
    /** @type {string | null | undefined} */
    let b64UrlPem=localStorage.getItem('studypal_public_key');

    authenticate(credentials, b64UrlPem)
        .then(resp=>{
            credentials=null;

            if(!b64UrlPem){
                b64UrlPem = resp.headers.get('x-pub-pem');
                if(b64UrlPem){ localStorage.setItem('studypal_public_key', b64UrlPem); }
            }
            const public_pem = base64UrlToOriginalData(b64UrlPem);

            // verify jwt
            const jwt_token=resp.headers.get('authorization')?.split(' ')[1];
            const pubKey = KEYUTIL.getKey(public_pem); // not necessary, verifyJWT calls it under the hood.
            const isValid = KJUR.jws.JWS.verifyJWT(jwt_token, pubKey, {alg: ['RS256']});


            console.log('JWT is valid:', isValid);

            if(isValid){
                return Promise.all([resp.status, resp.text()])
                .then( ([ status_code, text ]) => {
                    return {
                        status_code,
                        text
                    };
                });
            }




            // }          
        }).then(obj => {
            log(obj)
            if(messageElement){
                let msg;
                switch(obj?.status_code){
                    case 200:
                        // ok
                    case 201:
                        messageElement.innerHTML=obj?.text;
                        // redirect to review page
                        setTimeout(() => {
                            window.location.href = '/review/';
                        }, 1000); // pause for greeting message

                        break;
                    case 400:
                        // failed user input validation
                        msg= `
                            <h1 class='text-danger'>Authentication Error</h1>
                            <p class='fs-6'>${JSON.parse(obj.text).detail}</p>
                        `;
                        messageElement.innerHTML=msg;                        
                        break;
                    case 401:
                        // invalid password
                        msg= `
                            <h1 class='text-danger'>Authentication Error</h1>
                            <p class='fs-4'>${JSON.parse(obj.text).detail}</p>
                        `;
                        messageElement.innerHTML=msg;
                        break;
                    case 500:
                        msg= `
                            <h1 class='text-danger'>Authentication Error</h1>
                        `; // <p class='fs-4'>${obj.text}</p>
                        messageElement.innerHTML=msg;
                        break;
                }
            }

        }).catch(error=>{
            credentials=null;
            console.error(error);
        });
});

/**
 * Extracts email and password form a form element.
 * @param {HTMLFormElement} form - Login form element.
 * @returns {Object} Object containing email and password.
 */
function extractCredentials (form){
    if(form instanceof HTMLFormElement && form.password.value && form.email.value){
        const credentials = {
            email: form.email.value,
            password: form.password.value
        };
        return credentials;
    }

    throw new Error('Form must contain valid email and password.');
}

async function authenticate (credentials, b64UrlPem){

    let sendPem='true';
    if(b64UrlPem){ sendPem='false'; }
    
    const resp = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-send-pub-pem': sendPem
        },
        body: JSON.stringify(credentials)
    });

    return resp;
}


/**
 * Convert URL safe base64Url string back to PEM format string.
 * @param {string | null} base64Url - Base64URL string from x-pub-pem header property if applicable. 
 * @returns {string | undefined} PEM formatted public key if applicable
 */
function base64UrlToOriginalData(base64Url) {
    if(base64Url){
        // Add back the removed '=' padding
        const padding = '='.repeat((4 - base64Url.length % 4) % 4);
        const base64UrlWithPadding = base64Url + padding;
    
        // Convert base64url to base64
        const base64 = base64UrlWithPadding.replace(/-/g, '+').replace(/_/g, '/');
    
        // Decode base64
        const data = atob(base64);
    
        return data;
    }
}