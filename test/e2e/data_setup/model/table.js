var chance =  new (require('chance'))();
var Q = require('q');
var http = require('../plugin/q-request.js');

/* @namespace Table
 * @desc
 * The Table module allows you to create and delete tables for the ERMrest API
 * service.
 * @param {options} A json object which should contain a Catalog object, a Schema object and optionally the table json  { catalog: @Catalog, schema: @Schema, table: { table_name: 'sample_name' } }.
 * @constructor
 */
var Table = function(options) {
	options = options || {};
	this.url = options.url;
	this.content = options.table || {};
	this.schema = options.schema || {};
	this.catalog = this.schema.catalog || {};
	this.name = this.content.table_name;
	this.foreignKeys = this.content.foreign_keys || [];
	this.content.schema_name = this.schema.name;

	this.setTableParameters = function(name) {
		this.content = {
		  "comment": "", 
		  "kind": "table", 
		  "keys": [], 
		  "foreign_keys": [], 
		  "table_name": name, 
		  "schema_name": this.schema.name, 
		  "column_definitions": [], 
		  "annotations": {}
		};
		this.name = name;
	};
};

Table.prototype.create = function(timeout) {
	var defer = Q.defer(), self  = this;

	if (!this.catalog.id || !this.schema.name || !this.name) return defer.reject("No catalog or schema set : create table function"), defer.promise;
	
	this.content.schema_name = this.schema.name;
	this.foreignKeys = this.content.foreign_keys;
	this.content.foreign_keys = [];

	setTimeout(function() {

		http.post(self.url + 'catalog/' + self.catalog.id + "/schema/" + self.schema.name + "/table", self.content).then(function(response) {
			self.content = response.data;
			self.name = self.content.table_name;
			defer.resolve(self);
		}, function(err) {
			defer.reject(err, self);
		});

	}, timeout || 0);

	return defer.promise;
};

Table.prototype.remove = function() {
	var defer = Q.defer(), self = this;
	if (!this.catalog.id || !this.schema.name || !this.name) return defer.reject("No catalog or schema or table name set : create table function"), defer.promise;
	
	http.delete(this.url + 'catalog/' + this.catalog.id + "/schema/" + this.schema.name + "/table/" + this.name).then(function() {
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

Table.prototype.addForeignKey = function(foreignKey) {
	var defer = Q.defer(), self = this;
	
	http.post(this.url + 'catalog/' + this.catalog.id + "/schema/" + this.schema.name + "/table/" + this.name + "/foreignkey", foreignKey).then(function(response) {
		self.content.foreign_keys.push(response.data);
		defer.resolve(self);
	}, function(err) {
		defer.reject(err, self);
	});

	return defer.promise;
};

/**
 *
 * @desc
 * Not yet implemented.
 */
Table.prototype.get = function() {
	throw new Error("Not Implemented");
};

module.exports = Table;