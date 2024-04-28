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

    authenticate(credentials)
        .then(resp=>{
            return Promise.all([resp.status, resp.text()])
                .then( ([ status_code, text ]) => {
                    return {
                        status_code,
                        text
                    };
            });
            // }          
        }).then(obj => {
            console.log(obj)
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
                        // failed syntax validation
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
            email: form.email.value,
            password: form.password.value
        };
        return credentials;
    }

    throw new Error('Form must contain valid email and password.');
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