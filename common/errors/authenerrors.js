/**
 * Created by jenniferchen on 5/2/16.
 */

var Errors = (function(module) {

    module.AuthenticationError = AuthenticationError;

    module.SessionNotFoundError = SessionNotFoundError;

    module.SessionExpiredError = SessionExpiredError;


    
    function AuthenticationError(message) {
        this.message = message;
    }

    AuthenticationError.prototype = Object.create(Error.prototype);

    AuthenticationError.prototype.constructor = AuthenticationError;



    function SessionNotFoundError(message) {
        this.message = message;
    }

    SessionNotFoundError.prototype = Object.create(Error.prototype);

    SessionNotFoundError.prototype.constructor = SessionNotFoundError;



    function SessionExpiredError(message) {
        this.message = message;
    }

    SessionExpiredError.prototype = Object.create(Error.prototype);

    SessionExpiredError.prototype.constructor = SessionExpiredError;


    return module;
})(Errors || {});



