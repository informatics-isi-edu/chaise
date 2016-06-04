var http = require('./plugin/q-request.js');
var Catalog = require('./model/catalog.js'); 
var Schema = require('./model/schema.js');
var Table = require('./model/table.js');
var Entites = require('./model/entities.js');
var Association = require('./model/association.js');
var Q = require('q');
var ermRest = require('./model/ermrest.js');
ermRest.configure(http, require('q'))

var config = {};

exports.setup = function(options) {
	config = options;
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest';
	config.authCookie = config.authCookie || 'oauth2_auth_nonce=1464217155.1jyAUppOZlRPdOR-KGkZTK-dtN_Z0RtO24zkxdOg.; ermrest=C6KFIQn2JS37CGovofWnjKfu';
	config.schemaName = config.schemaName || "legacy";

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie },
	    json: true
	});

	var catalog = new Catalog({ 
		url: config.url, 
		id: config.catalogId 
	});

	var schema = new Schema({
		url: config.url,
		catalog: catalog,
		schema: require('./schema/' + config.schemaName  + '.json')
	});

	var defer = Q.defer();

	createCatalog(catalog).then(function() {
		return createSchema(schema);
	}).then(function() {
		return createTables(schema);
	}).then(function() {
		console.log("=======================Catalog imported with Id : " + catalog.id + "===========================");
		defer.resolve({ catalogId: catalog.id });
	}, function(err) {
		console.dir(err);
		if (catalog.id) defer.reject({ catalogId: catalog.id });
		else defer.reject(err || {});
	});

	return defer.promise;
};

exports.tear = function(options) {
	config = options;
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest';
	config.authCookie = config.authCookie || 'oauth2_auth_nonce=1464217155.1jyAUppOZlRPdOR-KGkZTK-dtN_Z0RtO24zkxdOg.; ermrest=C6KFIQn2JS37CGovofWnjKfu';

	var defer = Q.defer();

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie },
	    json: true
	});
	var catalog = new Catalog({ url: config.url, id: options.catalogId });
	catalog.remove().then(function() {
		console.log("Catalog deleted with id " + catalog.id);
		defer.reject({ });
	}, function(err) {
		console.log("Unable to delete the catalog with id " + catalog.id);
		defer.reject(err);
	});

	return defer.promise;
};

var createCatalog = function(catalog) {
	var defer = Q.defer();

	if (catalog.id) {
		defer.resolve();
	} else {
		catalog.create().then(function() {
			console.log("Catalog created with id " + catalog.id);
			defer.resolve()
		}, function(err) {
			defer.reject(err);
		});
	}

	return defer.promise;
};

var createSchema = function(schema) {
	var defer = Q.defer();

	if (config.createSchema == false) {
		defer.resolve();
	} else {
		schema.create().then(function() {	
			console.log("Schema created with name " + schema.name);
			defer.resolve();
		}, function(err) {
			defer.reject(err);
		});
	}

	return defer.promise;
};


/**
 * @desc
 * Creates tables for specified schema and catalog and then calls createForeignKeys and importEntities to import data.
 * @returns {Promise} Returns a promise.
 * @param {Schema} An object of Schema
 */
var createTables = function(schema) {
	var defer = Q.defer();

	var promises = [], tables = {}, tableNames = [];

	// Populate tables from their json on basis of schema tables field and then create them
	for (var k in schema.content.tables) {
		var table = new Table({
			url: config.url,
			schema: schema,
			table: schema.content.tables[k]
		});
		tables[k] = table;
		tableNames.push(k);
		promises.push(table.create());
	}

	Q.all(promises).then(function() {
		console.log("Tables created ");
		schema.tables = tables;
		// Add foreign keys in the table
		return createForeignKeys(schema);
	}).then(function() {
		console.log("Foreign Keys created");
		// Import data for following tables in order for managing foreign key management
		return importEntities(tableNames, tables, schema);
	}).then(function() {
		console.log("Data imported");
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 * @desc
 * Calls insertEntitiesForATable for each passed in tables to import entities in the order specified in schema.
 * @returns {Promise} Returns a promise.
 * @param {tables} An array of Table Objects.
 */
var importEntities = function(tableNames, tables, schema) {
	var defer = Q.defer(), index = -1, importedTables = []; 
	delete require.cache[require.resolve('./schema/' + schema.name +'.json')];
	var association = new Association({ schema: require('./schema/' + schema.name + '.json') });

	var cb = function() {
		if (tableNames.length == 0) return defer.resolve();
		var name = tableNames.shift();
		if (association.hasAReference(name, importedTables)) {
			tableNames.push(name);
			cb();
		} else {
			var table = tables[name];
			insertEntitiesForATable(table, schema.name).then(function() {
				importedTables.push(name);
				cb();
			}, function(err) {
				console.log(err);
				importedTables.push(name);
				cb();
			});
		}
	};

	cb();

	return defer.promise;
};

/**
 * @desc
 * Insert entities for passed in table reading them from a json file with the same name in data folder.
 * @returns {Promise} Returns a promise.
 * @param {table} A Table Object.
 */
var insertEntitiesForATable = function(table, schemaName) {
	var defer = Q.defer();
	
	var datasets = new Entites({ 
		url: config.url,
		table: table 
	});
	datasets.create({
		entities: require('./data/' + schemaName + "/" + table.name + '.json')
	}).then(function(entities) {
		console.log(entities.length + " Entities of type " + table.name.toLowerCase() + " created");
		table.entites = entities;
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});

	return defer.promise;
};

/**
 * @desc
 * Creates foreign keys for specified tables.
 * @returns {Promise} Returns a promise.
 * @param {tables} table Objects.
 */
var createForeignKeys = function(schema) {
	var defer = Q.defer();
	
	var promises = [];
	for (var k in schema.tables) {
		var table = schema.tables[k];
		table.foreignKeys.forEach(function(fk) {
			promises.push(table.addForeignKey(fk));
		});
	}

    Q.all(promises).then(function() {
    	defer.resolve();
    }, function(err) {
    	console.log(err);
    	defer.reject(err);
    });

    return defer.promise;
};	
