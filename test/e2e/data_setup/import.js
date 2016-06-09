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
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest/';
	config.authCookie = config.authCookie || 'oauth2_auth_nonce=1464217155.1jyAUppOZlRPdOR-KGkZTK-dtN_Z0RtO24zkxdOg.; ermrest=C6KFIQn2JS37CGovofWnjKfu';
	config.schemaName = config.schema.name || "legacy";

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie },
	    json: true
	});

	var catalog = new Catalog({ 
		url: config.url, 
		id: config.catalog.id 
	});

	var schema = new Schema({
		url: config.url,
		catalog: catalog,
		schema: require(config.schema.path || './schema/' + config.schemaName  + '.json')
	});

	var defer = Q.defer();

	var server = ermRest.ermrestFactory.getServer(config.url);
	server.session.get().then(function(response) {
		console.log("Valid session found");
		return createCatalog(catalog);
	}).then(function() {
		return catalog.addACLs([{ name: "read_user", user: "*" }, { name: "content_read_user", user : "*"}]);
	}).then(function() {
		console.log("ACL's added to catalog");
		return createSchema(schema);
	}).then(function() {
		return createTables(schema);
	}).then(function() {
		console.log("=======================Catalog imported with Id : " + catalog.id + "===========================");
		defer.resolve({ catalogId: catalog.id, schema: schema });
	}, function(err) {
		console.dir(err);
		if (catalog.id) defer.reject({ catalogId: catalog.id });
		else defer.reject(err || {});
	});

	return defer.promise;
};

exports.tear = function(options) {
	config = options;
	config.url = config.url || 'https://dev.isrd.isi.edu/ermrest/';
	config.authCookie = config.dataSetup.authCookie || 'oauth2_auth_nonce=1464217155.1jyAUppOZlRPdOR-KGkZTK-dtN_Z0RtO24zkxdOg.; ermrest=C6KFIQn2JS37CGovofWnjKfu';

	var defer = Q.defer();

	http.setDefaults({
	    headers: { 'Cookie': config.authCookie },
	    json: true
	});

	if (!config.dataSetup.catalog.id) {
		removeCatalog(defer, options.catalogId);
	} else if (config.dataSetup.schema.createNew) {
		removeSchema(defer, options.catalogId, config.dataSetup.schema)
	} else if (!config.dataSetup.tables.newTables.length > 0) {
		removeTables(defer, options.catalogId, config.dataSetup.schema);
	} else {
		defer.resolve();
	}

	return defer.promise;
};

var removeCatalog = function(defer, catalogId) {
	var catalog = new Catalog({ url: config.url, id: catalogId });
	catalog.remove().then(function() {	
		console.log("Catalog deleted with id " + catalog.id);
		defer.resolve();
	}, function(err) {
		console.log("Unable to delete the catalog with id " + catalog.id);
		defer.reject(err);
	});
};

var removeSchema = function(defer, catalogId, schemaName) {
	var catalog = new Catalog({ url: config.url, id: catalogId });
	var schema = new Schema({
		url: config.url,
		catalog: catalog,
		schema: require(config.dataSetup.schema.path || './schema/' + config.dataSetup.schemaName  + '.json')
	});
	schema.remove().then(function() {	
		console.log("Schema deleted with name " + schema.name);
		defer.resolve();
	}, function(err) {
		console.log("Unable to delete the schema with name " + schema.name);
		defer.reject(err);
	});
};

var removeTables = function(defer, catalogId, schemaName) {
	var promises = [], catalog = new Catalog({ url: config.url, id: catalogId });
	var schema = new Schema({
		url: config.url,
		catalog: catalog,
		schema: require(config.dataSetup.schema.path || './schema/' + config.dataSetup.schemaName  + '.json')
	});
	for (var k in schema.content.tables) {
		var table = new Table({
			url: config.url,
			schema: schema,
			table: schema.content.tables[k]
		});
		tables[k] = table;
		tableNames.push(k);
		if (!schema.content.tables[k].exists || (config.dataSetup.tables.newTables.indexOf(k) != -1)) promises.push(table.remove());
	}

	Q.all(promises).then(function() {
		console.log("Tables removed");
		defer.resolve();
	}, function(err) {
		defer.reject(err);
	});
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

	if (config.schema.createNew) {
		schema.create().then(function() {	
			console.log("Schema created with name " + schema.name);
			defer.resolve();
		}, function(err) {
			defer.reject(err);
		});
	} else {
		defer.resolve();
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

	var promises = [], tables = {}, tableNames = [], index = 0;

	// Populate tables from their json on basis of schema tables field and then create them
	for (var k in schema.content.tables) {
		var table = new Table({
			url: config.url,
			schema: schema,
			table: schema.content.tables[k]
		});
		tables[k] = table;
		tableNames.push(k);
		if (!schema.content.tables[k].exists || (config.tables.newTables.indexOf(k) != -1)) promises.push(table.create(++index * 500));
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
	delete require.cache[require.resolve(config.schema.path)];
	var association = new Association({ schema: require(config.schema.path) });

	var cb = function() {
		if (tableNames.length == 0) return defer.resolve();
		var name = tableNames.shift();
		var table = tables[name];
		if (!table.exists || config.entities.newTables.indexOf(name) != -1) {
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
		} else {
			importedTables.push(name);
			cb();
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
		entities: require(config.entities.path + "/" + table.name + '.json')
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
		if (!schema.content.tables[k].exists || (config.tables.newTables.indexOf(k) != -1)) {
			table.foreignKeys.forEach(function(fk) {
				promises.push(table.addForeignKey(fk));
			});
		}
	}

    Q.all(promises).then(function() {
    	defer.resolve();
    }, function(err) {
    	console.log(err);
    	defer.reject(err);
    });

    return defer.promise;
};	
