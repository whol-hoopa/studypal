const btnLogin = document.getElementById('btn-login');
btnLogin?.addEventListener('click',(event)=>{
    event.preventDefault();

    const messageElement= document.getElementById('response');
    
    try {
        const target = event.target;
        if (target && 'form' in target) {
            // console.error(target?.hasOwnProperty('form')); // 'form' property is not directly on the target object.
            // console.error(Object.keys(target).includes('form')); // 'form' is not an enumerable property directly on the target object or its prototype chain.
            // console.log('form' in target) // 'form' is somewhere in the prototype chain, even though it's not directly on the target object itself.
            // console.log(target?.form)

            var credentials = extractCredentials(target.form);
        }
    }catch(error){
        if(messageElement){
            messageElement.innerHTML=`<h1 class='text-danger'>Please enter credentials.</h1>`;
            throw error.message;
        }
    }


    // check localStorage for public.pem
    /** @type {string | null | undefined} */
    let b64UrlPem=localStorage.getItem('studypal_public_key');
    let getPem='false';
    if( !b64UrlPem ){ 
        // get pem from server
        getPem='true';
    }

    // check localStorage for jwt
    /** @type {string | null | undefined} */
    let jwt_token = localStorage.getItem('studypal_jwt');
    let getJwt='false';
    if( !jwt_token ){ 
        // get jwt from server
        getJwt='true';
    }
    else{
        // check expiration
    }

    authenticate(credentials, getPem, getJwt)
        .then(resp=>{
            credentials=null;
            console.log(resp.headers)
            if( [200,201].includes(resp.status) ){

                // cache public pem
                if( getPem==='true' ){
                    b64UrlPem = resp.headers.get('x-pub-pem');
                    if(b64UrlPem){ localStorage.setItem('studypal_public_key', b64UrlPem); }
                }
                b64UrlPem=null;

                // cache jwt
                if( getJwt==='true' ){
                    jwt_token=resp.headers.get('authorization')?.split(' ')[1];
                    if(jwt_token){ localStorage.setItem("studypal_jwt", jwt_token); }
                }
                jwt_token=null;

                // // Authorization:

                // // decode public pem for verification of jwt
                // const public_pem = base64UrlToOriginalData(b64UrlPem);
                // b64UrlPem=null;
    
                // // verify jwt
                // const pubKey = KEYUTIL.getKey(public_pem); // not necessary, verifyJWT calls it under the hood.
                // const isValid = KJUR.jws.JWS.verifyJWT(jwt_token, pubKey, {alg: ['RS256']});
                // jwt_token=null;
    
                // if( !isValid ){ throw new Error('Invalid JWT.'); }


            }

            return Promise.all([resp.status, resp.text()])
                .then( ([ status_code, text ]) => {
                    return {
                        status_code,
                        text
                    };
                });

        }).then(obj => {
            // log(obj)
            if(messageElement){
                let msg;
                switch(obj?.status_code){
                    case 200:
                        // ok
                    case 201:
                        messageElement.innerHTML=obj?.text;
                        // redirect to review page
                        // const authorized = setTimeout(() => {
                        //     window.location.href = '/review/';
                        //     clearTimeout(authorized);
                        // }, 1000); // pause for greeting message
                        
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
            if(messageElement){ messageElement.innerHTML=`<h1 class='text-danger'>Autorization Error</h1><p>Please reauthenticate.</p>`; }
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

async function authenticate (credentials, getPem, getJwt){
    
    const resp = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-send-pub-pem': getPem,
            'x-send-jwt': getJwt
        },
        body: JSON.stringify(credentials)
    });
    // log(resp.clone().text())

    return resp;
}

/**
 * Verifies JWT with public key.
 * @param {string} jwt_token - JWT token.
 * @param {string} b64UrlPem  - Base64URL of the public pem used to verify the provided JWT.
 * @returns {boolean} Boolean conveying state of provided JWT verification.
 */
function isAuthorized(jwt_token, b64UrlPem){

    // decode public pem for verification of jwt
    const public_pem = base64UrlToOriginalData(b64UrlPem);
    // b64UrlPem=null;

    // verify jwt
    const pubKey = KEYUTIL.getKey(public_pem); // not necessary, verifyJWT calls it under the hood.
    const isValid = KJUR.jws.JWS.verifyJWT(jwt_token, pubKey, {alg: ['RS256']});
    // jwt_token=null;

    if( !isValid ){ 
        throw new Error('Invalid JWT.'); 
    }
    else{
        return isValid;
    }
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
        // data=data.replace('1','2') //  "Error: Invalid JWT.""
        return data;
    }
}