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


    // localStorage has public.pem? doNothing : getIt from server
    /** @type {string | null | undefined} */
    let b64UrlPem=localStorage.getItem('studypal_public_key');
    let getPem='false';
    if( !b64UrlPem ){ getPem='true'; }

    // localStorage has jwt? doNothing : getIt from server
    /** @type {string | null | undefined} */
    let jwt_token = localStorage.getItem('studypal_jwt');
    let getJwt='false';
    if( !jwt_token ){ getJwt='true'; }
    else{
        // check expiration
    }

    authenticate(credentials, getPem, getJwt)
        .then(resp=>{
            // cache jwt|pem if authenticated

            if( [200,201].includes(resp.status) ){
                // successfully authenticated

                obfuscateEmail(credentials.email)
                    .then(obfuscatedEmail => {
                        const dbName = create_user_id(obfuscatedEmail);
                        localStorage.setItem('studypal_uid', dbName);
                    })
                    .catch(error => {
                        console.error('Error creating db name:\n', error);
                    });

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
            }
            
            credentials=null;
            return Promise.all([resp.status, resp.text()])
                .then( ([ status_code, text ]) => {
                    return {
                        status_code,
                        text
                    };
                });

        }).then(obj => {
            // authentication response message status

            // log(obj)
            if(messageElement){
                let msg;
                switch(obj?.status_code){
                    case 200:
                        // ok
                    case 201:
                        messageElement.innerHTML=obj?.text;
                        // redirect to review page
                        const authorized = setTimeout(() => {
                            window.location.href = '/review/';
                            clearTimeout(authorized);
                        }, 0); // pause for greeting message
                        
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