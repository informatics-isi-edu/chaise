/**
 * Created by jenniferchen on 3/10/16.
 */

/******************************************************/
/* Utilities                                          */
/******************************************************/


/**
 * @constructor
 * @param {String} message error message
 * @desc
 * Creates a undefined error object
 */
function UndefinedError(message) {
    this.name = "UndefinedError";
    this.message = (message || "");
}

UndefinedError.prototype = Error.prototype;

/**
 * @function
 * @param {Object} copyTo the object to copy values to.
 * @param {Object} copy the object to copy value from.
 * @desc
 * This private utility function does a shallow copy between objects.
 */
function _clone(copyTo, copyFrom) {
    for (var key in copyFrom) {
        // only copy those properties that were set in the object, this
        // will skip properties from the source object's prototype
        if (copyFrom.hasOwnProperty(key)) {
            copyTo[key] = copyFrom[key];
        }
    }
}

/**
 * @function
 * @param {String} str string to be converted.
 * @desc
 * converts a string to title case
 */
function _toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * @function
 * @param {String} str string to be encoded.
 * @desc
 * converts a string to an URI encoded string
 */
function _fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

/**
 * @function
 * @param {String} str string to be encoded.
 * @desc
 * converts a string to an URI encoded string
 */
function _filterToUri(filter) {

    var uri = "";

    // Extend the URI with the filters.js
    var filters = [];

    // multiple filters.js
    if (filter instanceof Conjunction || filter instanceof Disjunction) {
        filters = filters.concat(filter.filters); // only one filter
    } else if (filter instanceof Negation) {
        filters.push(filter.filter);
    } else {
        filters.push(filter);
    }

    // loop through individual filters.js to create filter strings
    var filterStrings = [];
    for (var i = 0; i < filters.length; i++) {
        var f = filters[i];

        var filterString = "";
        var negate = false;
        if (f instanceof Negation) {
            f = f.filter;
            negate = true;
        }
        if (f instanceof BinaryPredicate) {
            filterString = f.column + f.operator + f.rvalue;
        } else if (f instanceof UnaryPredicate) {
            filterString = f.column + f.operator;
        }


        if (filter instanceof Negation || negate) {

            filterString = "!(" + filterString + ")";
        }

        filterStrings[i] = filterString;
    }

    if (filter instanceof Conjunction) {
        for (var j = 0; j < filterStrings.length; j++) {
            if (j === 0)
                uri = uri + "/" + filterStrings[j];
            else
                uri = uri + "&" + filterStrings[j];
        }
    } else if (filter instanceof Disjunction) {
        for (var j = 0; j < filterStrings.length; j++) {
            if (j === 0)
                uri = uri + "/" + filterStrings[j];
            else
                uri = uri + ";" + filterStrings[j];
        }
    } else { // single filter
        uri = uri + "/" + filterStrings[0];
    }

    return uri;
}
