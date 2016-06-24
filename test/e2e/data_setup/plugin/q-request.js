/**
 * Creates Q-wrapped request
 * See: https://github.com/request/request
 * User: motorro
 * Date: 15.01.2015
 * Time: 8:06
 */

"use strict";

var Q = require ("q");
var request = require("request");

/**
 * A list of methods to create denodeified versions
 * @type {string[]}
 */
var REQUEST_METHODS = [
    "del",
    "delete",
    "get",
    "head",
    "patch",
    "post",
    "put"
];

/**
 * Q-wrapped request constructor
 * @param {Object} [defaults] Default values
 * @constructor
 */
function QRequest(defaults) {

    if (null == defaults) defaults = QRequest.defaults;
    /**
     * The raw request object with optional defaults
     */
    this.raw = request.defaults(defaults);
}

QRequest.defaults = {};

// Create denodeified methods for request shortcuts
REQUEST_METHODS.forEach(function(method) {
    QRequest.prototype[method] = function () {
        var result = Q.defer();
        var fArgs = Array.prototype.slice.call(arguments, 0);
        fArgs.push(function (err, response, body) {
            if (null != err) {
                result.reject({ data: err });
            } else if(response.statusCode < 200 || response.statusCode >= 400) {
                result.reject({ data: body, statusCode: response.statusCode });
            } else {
                result.resolve({ data: body });
            }
        });
        if (method == 'delete') method = 'del';
        this.raw[method].apply(this.raw, fArgs);
        return result.promise;
    };

    QRequest[method] = function() {
        var request = new QRequest(this.defaults);
        var args = Array.prototype.slice.call(arguments, 0);
        if ((method == 'post' || method == 'put') && (typeof args[1] == 'object')) {
            args[1] = { json: args[1] };
        } 
        return request[method].apply(request, args);
    }
});

/**
 * Reference to original raw request
 */
QRequest.raw = request;

/**
 * Returns a function to check the response has a valid status code
 * @param {(Number|Number[])} permittedStatus
 * @returns {Function}
 */
QRequest.bodyIfStatusOk = function(permittedStatus) {
    if (false === Array.isArray(permittedStatus)) {
        permittedStatus = [permittedStatus];
    }
    return function(response, body) {
        if (permittedStatus.indexOf(response.statusCode) < 0) {
            throw new RangeError("Invalid response status: " + response.statusCode);
        }
        return body;
    };
};

/**
 * Returns request body if response status code is 200
 * @returns {Function}
 */
QRequest.body = function(response, body) {
    return QRequest.bodyIfStatusOk(200)(response, body);
};

QRequest.setDefaults = function(defaults) {
    this.defaults = defaults || {}; 
};

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};

Array.prototype.intersect = function( array ) {
    // this is naive--could use some optimization
    var result = [];
    for ( var i = 0; i < this.length; i++ ) {
        if ( array.contains(this[i]) && !result.contains(this[i]) )
            result.push( this[i] );
    }
    return result;
}

module.exports = QRequest;
