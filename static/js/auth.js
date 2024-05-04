

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

/**
 * Authenticates user credentials with the server and returns response object.
 * @param {Object} credentials - Object containing credentials.
 * @param {string} credentials - credentials.email
 * @param {string} credentials - credentials.password
 * @param {string} getPem - String representing boolean to embed in header as flag to signal whether to return public pem.
 * @param {string} getJwt - String representing boolean to embed in header as flag to signal whether to return JWT.
 * @returns {Promise<Response>} Returns response object with status code and status text.
 */
async function authenticate (credentials, getPem, getJwt){
    console.log('FETCH from /login via POST request.')
    const resp = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-send-pub-pem': getPem,
            'x-send-jwt': getJwt
        },
        body: JSON.stringify(credentials)
    });
    console.log('RETURNED response from /login:')
    log(resp.clone().text())
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

function isExpired(){
    const pemUrl = localStorage.getItem('studypal_public_key');
    const jwt = localStorage.getItem('studypal_jwt');
    if(jwt && pemUrl){
        const isVerified = isAuthorized(jwt, pemUrl);
        console.log(isVerified)
        console.log(settingsHref)
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

/**
 * const email = "example@example.com";
 * 
 *     obfuscateEmail(email).then(obfuscatedEmail => {
 *       console.log("Obfuscated email (SHA-256):", obfuscatedEmail);
 *       return obfuscatedEmail;
 *     });
 * Return result is designed to used with hexToBase64UrlSafe().
 * 
 * Initially designed to be used with obfuscateEmail() so that the email name
 * can be used as a unique ID for PouchDB and CouchDB. Communication with
 * CouchDB is through HTTP and thus the name needs to be URL safe. 
 * @param {string} email 
 * @returns {Promise<string>} HexString: 31c5543c1734d25c7206f5fd591525d0295bec6fe84ff82f946a34fe970a1e66
 */
async function obfuscateEmail(email) {
    // Convert the email string to a Uint8Array
    const emailBytes = new TextEncoder().encode(email);

    // Create a hash using SHA-256
    const sha256Buffer = await crypto.subtle.digest('SHA-256', emailBytes);

    // Convert the hash buffer to a hexadecimal string
    const hashedEmail = Array.from(new Uint8Array(sha256Buffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    return hashedEmail;
}

function create_user_id(hashedEmail){
    const firstChar = /['a-f']/;
    const padding = hashedEmail.match(firstChar)[0];
    return `${padding}${hashedEmail}`;
}

// /**
//  * Converts a hexString to a Base64 URL safe string.
//  * Initially designed to be used with obfuscateEmail() so that the email name
//  * can be used as a unique ID for PouchDB and CouchDB. Communication with
//  * CouchDB is through HTTP and thus the name needs to be URL safe. 
//  * @param {string} hexString 
//  * @returns Base64UrlSafe string
//  */
// function hexToBase64UrlSafe(hexString) {
//     // Convert the hexadecimal string to a buffer

//     // const buffer = Buffer.from(hexString, 'hex'); // node.js
//     const buffer = Uint8Array.from(hexString, char => parseInt(char, 16));

//     // Encode the buffer to Base64
//     // const base64 = buffer.toString('base64'); // node.js
    
//     // Make the Base64 string URL-safe
//     const base64UrlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
//     return base64UrlSafe;
// }

// function base64Str(hexString){
//     const buffer = Uint8Array.from(hexString, char => parseInt(char, 16));

//     // Convert the Uint8Array to a Blob
//     const blob = new Blob([buffer]);
    
//     // Use FileReader to read the Blob as a Base64-encoded string
//     const reader = new FileReader();

//     return new Promise((resolve, reject) => {
//         reader.onload = function(event) {
//             const base64 = event.target.result.split(',')[1];
//             resolve(base64);
//         };
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//     });
// }