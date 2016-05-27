var Errors = (function(module) {

    module.InvalidFilterOperatorError = InvalidFilterOperatorError;

    function InvalidFilterOperatorError(message) {
        this.message = message;
    }

    InvalidFilterOperatorError.prototype = Object.create(Error.prototype);

    InvalidFilterOperatorError.prototype.constructor = InvalidFilterOperatorError;


    return module;
})(Errors || {});

