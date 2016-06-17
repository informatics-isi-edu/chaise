var chance =  new (require('chance'))();
var Q = require('q');
var http = require('../plugin/q-request.js');

/* @namespace Entities
 * @Entities
 * The Entity module allows you to create and delete entities for the ERMrest API
 * service.
 * @param {options} A json object which should contain a table object  { table: @Table, entity: { } }.
 * @constructor
 */
var Entities = function(options) {
	options = options || {};
	this.url = options.url;
	this.table = options.table || {};
	this.schema = this.table.schema;
	this.catalog = this.table.catalog;
};

Entities.prototype.create = function(options) {
	options = options || {};
	var defer = Q.defer(), self  = this;
	if (!this.table) return defer.reject("No table provided as argument : bulkCreate entity function"), defer.promise;
	if (!options.entities) return defer.reject("No entities provided as argument : bulkCreate entity function").promise;
	if (options.entities.length == 0) {
		defer.resolve([]);
		return defer.promise;
	}
	http.post(this.url + "catalog/" + this.catalog.id + "/entity/" + this.schema.name + ":" + this.table.name, options.entities).then(function(response) {
		self.table.entityCount = options.entities.length;
		defer.resolve(response.data);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

Entities.prototype.remove = function(options) {
	throw new Error("Not Implemented");
};

/**
 *
 * @desc
 * Not yet implemented.
 */
Entities.prototype.get = function() {
	throw new Error("Not Implemented");
};

module.exports = Entities;