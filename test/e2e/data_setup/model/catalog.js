var Q = require('q');
var http = require('../plugin/q-request.js');
var Schema = require('./schema.js');

/* @namespace Catalog
 * @desc
 * The Catalog module allows you to create and delete catalogs for the ERMrest API
 * service.
 * @param {options} A json object which may optionally contain the id of the catalog { id: 21 }.
 * @constructor
 */
var Catalog = function(options) {
	this.content = options || {};
	this.url = options.url;
	this.id = this.content.id;
};

/**
 *
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it creates a new catalog.
 */
Catalog.prototype.create = function() {
	var defer = Q.defer(), self = this;

	console.log("=========Inside catalog create=============");

	http.post(this.url + 'catalog').then(function(response) {
		self.content = response.data;
		self.id = response.data.id;
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

 /**
 * @param {acls} An array of acl objects
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acls for the catalog.
 */
Catalog.prototype.addACLs = function(acls) {
	var defer = Q.defer(), self = this;
	if (!this.id) return defer.reject("No Id set : addACL catalog function"), defer.promise;
	if (!acls || acls.length == 0) defer.resolve();

	var promises = [];

	acls.forEach(function(acl) {
		promises.push(self.addACL(acl));
	});

	Q.all(promises).then(function() {
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
}

/**
 * @param {acl} An acl object of the form { name: '', value: '' }
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it adds the acl for the catalog.
 */
Catalog.prototype.addACL = function(acl) {
	var defer = Q.defer(), self = this;
	if (!this.id || !acl) return defer.reject("No Id or ACL set : addACL catalog function"), defer.promise;
	
	http.put(this.url + 'catalog/' + this.id + "/meta/" + acl.name + "/" + acl.user).then(function(response) {
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 *
 * @returns {Promise} Returns a promise.
 * @desc
 * An asynchronous method that returns a promise. If fulfilled, it deletes the catalog.
 */
Catalog.prototype.remove = function() {
	var defer = Q.defer(), self = this;
	if (!this.id) return defer.reject("No Id set : remove catalog function"), defer.promise;
	
	http.delete(this.url + 'catalog/' + this.id).then(function() {
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 *
 * @desc
 * A synchronous method that sets the default schema on basis of current catalog schemas.
 */
Catalog.prototype.setDefaultSchema = function() {
	var defaultSchema = null, schemas = this.content.schemas;	
	
	for (var k in schemas) {
		var annotations = schemas[k].annotations; 

		if (annotations != null && annotations['comment'] != null && annotations['comment'].contains('default')) {
			defaultSchema = schemas[k];
			break;
		}
	}
	
	if (defaultSchema == null) {
		for (var k in schemas) {
			var s = schemas[k];
			for (var t in s.tables) {
				var table = s.tables[t];
				if (table['annotations'] != null && table['annotations']['comment'] != null && table['annotations']['comment'].contains('default')) {
					defaultSchema = s;
					break;
				}
			}
			if (defaultSchema != null) break;
		}
		
		if (defaultSchema == null) {
			// get the first schema from the catalog
			for (var k in schemas) {
				defaultSchema = schemas[k];
				break;
			}
		}
	}
	var schema = new Schema({ schema: defaultSchema, catalog: this, name: defaultSchema.schema_name });				
	this.defaultSchema = schema;
	schema.setDefaultTable();
};

/**
 *
 * @desc
 * Retrieves all schema and tables for them respectively.
 */
Catalog.prototype.get = function() {
	var defer = Q.defer(), self = this;
	if (!this.id) return defer.reject("No Id set : get catalog function"), defer.promise;
	http.get(this.url + 'catalog/' + this.id + "/schema").then(function(response) {
		self.content = response.data;
		self.setDefaultSchema();
		defer.resolve(self.defaultSchema);
	}, function(err) {
		console.log("some error");
		defer.reject(err, self);
	});

	return defer.promise;
};



module.exports = Catalog;