/** 
 * Variable to control the function "log(message)", a console.log wrapper, in codebase.
 * @type {boolean} */
let LOGGING_ENABLED=true;

/**
 * Switchable console.log wrapper. 
 * set LOGGING_ENABLED:bool (global let declared) for local control.
 * @param {string} message - The message to log to console. 
 * @Returns Logged string.
 */
function log(message){
    if(LOGGING_ENABLED){
        console.log(message);
    }
}