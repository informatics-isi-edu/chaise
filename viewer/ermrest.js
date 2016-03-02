/*
 * Copyright 2015 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @namespace ERMrest
 * @desc
 * The ERMrest module is a JavaScript client library for the ERMrest
 * service.
 *
 * IMPORTANT NOTE: This module is a work in progress.
 * It is likely to change several times before we have an interface we wish
 * to use for ERMrest JavaScript agents.
 */
var ERMrest = (function () {

    /**
     * @var
     * @private
     * @desc This is the state of the module.
     */
    var module = {
        configure: configure,
        clientFactory: {
            getClient: getClient
        }
    };

    /**
     * @private
     * @var _clients
     * @desc
     * Internal collection of ERMrest clients.
     */
    var _clients = {};

    /**
     * @private
     * @var _http
     * @desc
     * The http service used by this module. This is private and not
     * visible to users of the module.
     */
    var _http = null;

    /**
     * @private
     * @var _q
     * @desc
     * Angular $q service
     */
    var _q = null;

    /**
     * @memberof ERMrest
     * @function
     * @param {Object} http Angular $http service object
     * @param {Object} q Angular $q service object
     * @desc
     * This function is used to configure the module.
     */
    function configure(http, q) {
        _http = http;
        _q = q;
    }

    /**
     * @memberof ERMrest
     * @function
     * @param {String} uri URI of the ERMrest service.
     * @return {Client} Returns a client.
     * @desc
     * ERMrest client factory creates or reuses ERMrest.Client instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getClient(uri) {
        cli = _clients[uri];
        if (! cli) {
            cli = new Client(uri);
            _clients[uri] = cli;
        }
        return cli;
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} uri URI of the ERMrest service.
     * @desc
     * The client for the ERMrest service endpoint.
     */
    function Client(uri) {
        if (uri === undefined || uri === null)
            throw "URI undefined or null";
        this.uri = uri;
        this._catalogs = {}; // consider this var "private"
    }

    /**
     * @var
     * @desc
     * The URI of the ERMrest service.
     */
    Client.prototype.uri = null;

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled (and a user
     * is logged in), it gets the current session information.
     */

    Client.prototype.getSession = function() {
        return _http.get(this.uri + "/authn/session").then(function(response) {
            return response.data;
        }, function(response) {
            return _q.reject(response);
        });
    }

    /**
     * @function
     * @param {String} id Identifier of a catalog within the ERMrest
     * service.
     * @return {Catalog} an instance of a catalog object.
     * @desc
     * Returns an interface to a Catalog object representing the catalog
     * resource on the service.
     */
    Client.prototype.getCatalog = function (id) {
        if (id === undefined || id === null)
            throw "ID is undefined or null";
        catalog = this._catalogs[id];
        if (! catalog) {
            catalog = new Catalog(this, id);
            this._catalogs[id] = catalog;
        }
        return catalog;
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Client} client the client object.
     * @param {String} id Identifier of a catalog within the ERMrest
     * service.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog (client, id) {
        this.client = client;
        this.id = id;
        this._uri = client.uri + "/catalog/" + id;
        this._schemas = {}; // consider this "private"
    }

    /**
     * @var
     * @desc Identifier of the Catalog.
     */
    Catalog.prototype.id = null;

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, it gets the
     * schemas of the catalog. This method should be called at least on the
     * catalog object before using the rest of its methods.
     */
    Catalog.prototype.introspect = function () {
        var self = this;
        return _http.get(this._uri + "/schema").then(function(response) {
            var jsonSchemas = response.data;
            for (var s in jsonSchemas.schemas) {
                self._schemas[s] = new Schema(self, jsonSchemas.schemas[s]);
            }
            return self._schemas;
        }, function(response) {
            return _q.reject(response);
        });
    };

    /**
     * @function
     * @return {Object} returns a dictionary of schemas. The keys of the
     * dictionary are taken from the schema names and the values are the
     * corresponding schema objects.
     * @desc
     * This is a synchronous method that returns a schema object from an
     * already introspected catalog.
     */
    Catalog.prototype.getSchemas = function () {
        return this._schemas;
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog The catalog the schema belongs to.
     * @param {Object} jsonSchema The raw json Schema returned by the ERMrest
     * service.
     * @desc
     * Constructor for the Schema.
     */
    function Schema(catalog, jsonSchema) {
        this.catalog = catalog;
        this._uri = catalog._uri + "/schema/" + _fixedEncodeURIComponent(jsonSchema.schema_name);
        this.name = jsonSchema.schema_name; // get the name out of the json
        this._tables = {}; // dictionary of tables, keyed on table name

        // create all tables
        for (var t in jsonSchema.tables) {
            this._tables[t] = new Table(this, jsonSchema.tables[t]);
        }
    }

    /**
     * @var
     * @desc The name of the schema.
     */
    Schema.prototype.name = null;

    /**
     * @function
     * @param {String} name the name of the table.
     * @return {Table} a table object.
     * @desc
     * This is a synchronous method that returns a table object from an
     * already introspected catalog.
     */
    Schema.prototype.getTable = function (name) {
        return this._tables[name];
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema The schema for the table.
     * @param {Object} jsonTable The raw json of the table returned by the
     * ERMrest service.
     * @desc
     * Constructor of the Table.
     */
    function Table(schema, jsonTable) {
        this.uri = schema.catalog._uri + "/entity/" + _fixedEncodeURIComponent(schema.name) + ":" + _fixedEncodeURIComponent(jsonTable.table_name);
        this.name = jsonTable.table_name;
        this.schema = schema;
        this.columns = [];
        this.keys = jsonTable.keys;
        this.annotations = jsonTable.annotations;

        // table display name
        this.displayName = jsonTable.table_name;
        var annotations = jsonTable.annotations;
        if (annotations['tag:misd.isi.edu,2015:display'] !== undefined &&
            annotations['tag:misd.isi.edu,2015:display'].name !== undefined) {
            this.displayName = annotations['tag:misd.isi.edu,2015:display'].name;
        }
        else {
            this.displayName = this.displayName.replace(/_/g, ' ');
            this.displayName = _toTitleCase(this.displayName);
        }

        // hidden
        if (annotations['tag:misd.isi.edu,2015:hidden'] !== undefined) {
            this.hidden = true;
        }

        // columns
        var columnDefinitions = jsonTable.column_definitions;
        for (var i = 0; i < columnDefinitions.length; i++){

            var cd = columnDefinitions[i];

            // hidden?
            var cHidden = false;
            if (cd.annotations['tag:misd.isi.edu,2015:hidden'] !== undefined) {
                cHidden = true;
            }

            // display name
            var cDisplayName = cd.name;
            if (cd.annotations['tag:misd.isi.edu,2015:display'] !== undefined && cd.annotations['tag:misd.isi.edu,2015:display'].name !== undefined) {
                cDisplayName = cd.annotations['tag:misd.isi.edu,2015:display'].name;
            }

            var column = new Column(cd.name, cDisplayName, cHidden);
            this.columns.push(column);
        }

    }

    /**
     * @var
     * @desc The uri of the table.
     */
    Table.prototype.uri = null;

    /**
     * @var
     * @desc The name of the table.
     */
    Table.prototype.name = null;

    /**
     * @var
     * @desc The schema that the table belongs to.
     */
    Table.prototype.schema = null;

    /**
     * @var
     * @desc The display name of the table.
     */
    Table.prototype.displayName = null;

    /**
     * @var
     * @desc The name of the table.
     */
    Table.prototype.hidden = false;

    /**
     * @var
     * @desc list of column definitions.
     */
    Table.prototype.columns = null;

    /**
     * @var
     * @desc list of keys of the table.
     */
    Table.prototype.keys = null;

    /**
     * @var
     * @desc a list or dictionary of annotation objects.
     */
    Table.prototype.annotations = null;

    /**
     * @function
     * @param {Array} fitlers array of filters, which are strings.
     * @return {Table} a filtered table instance.
     * @desc
     * Returns a filtered table based on this table.
     */
    Table.prototype.getFilteredTable = function (filters) {
        return new FilteredTable(this, filters);
    };

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, it gets the
     * entities for this table.
     */
    Table.prototype.getEntities = function () {
        var self = this;
        return _http.get(this.uri).then(function(response) {
            var entities = [];
            for (var i = 0; i < response.data.length; i++) {
                entities[i] = new Entity(self, response.data[i]);
            }
            return entities;
        }, function(response) {
            return _q.reject(response.data);
        });
    };

    /**
     * @function
     * @param {Object} data The entity data. This is typically a dictionary of
     * attribute name-value pairs essentially.
     * @param {Object} defaults An array of default columns.
     * @return {Promise} Returns a promise.
     * @desc
     * Creating a new entity. If the promise is fullfilled a new entity has
     * been created in the catalog, otherwise the promise is rejected.
     */
    Table.prototype.createEntity = function (data, defaults) {
        var self = this;
        var path = this.schema.catalog._uri + "/entity/" + _fixedEncodeURIComponent(this.schema.name) + ":" + _fixedEncodeURIComponent(this.name);
        if (typeof defaults !== 'undefined') {
            for (var i = 0; i < defaults.length; i++) {
                if (i === 0) {
                    path = path + "?defaults=" + _fixedEncodeURIComponent(defaults[i]);
                } else {
                    path = path + "," + _fixedEncodeURIComponent(defaults[i]);
                }
            }
        }
        return _http.post(path, data).then(function(response) {
            return new Entity(self, response.data[0]);
        }, function(response) {
            return _q.reject(response.data);
        });
    };

    /**
     * @function
     * @param {Object} keys The keys and values identifying the entity
     * @return {Promise} Returns a promise.
     * @desc
     * Deletes entities, if promise is fulfilled.
     */
    Table.prototype.deleteEntity = function (keys) {
        var path = this.uri;
        var first = true;
        for (var key in keys) {
            if (first) {
                path = path + "/" + _fixedEncodeURIComponent(key) + "=" + _fixedEncodeURIComponent(keys[key]);
                first = false;
            } else {
                path = path + "," + _fixedEncodeURIComponent(key) + "=" + _fixedEncodeURIComponent(keys[key]);
            }
        }
        return _http.delete(path).then(function(response) {
            return response.data;
        }, function(response) {
            return _q.reject(response.data);
        });
    };

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * Update entities with data that has been modified.
     */
    Table.prototype.updateEntities = function (entities) {
        // TODO we should replace this sometime with a bulk call to the server
        var promiseArray = [];
        for (var i = 0; i < entities.length; i++) {
            promiseArray.push(entities[i].update());
        }
        return _q.all(promiseArray).then(function(results){
            return results;
        }, function(results) {
            return results;
        });
    };

    /**
     * @function
     * @param {String} schemaName Schema name.
     * @param {String} tableName Table name.
     * @return {Table} related table instance.
     * @desc
     * Returns a related table based on this entity.
     */
    Table.prototype.getRelatedTable = function(schemaName, tableName) {
        return new RelatedTable(this, schemaName, tableName);
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @param {name} name of the column
     * @param {displayName} column's display name
     * @param {hidden} whether this column is hidden or not
     * @desc
     * Constructor of the Column.
     */
    function Column (name, displayName, hidden) {
        this.name = name;
        this.displayName = displayName;
        this.hidden = hidden;
    }

    /**
     * @var
     * @desc name of the column
     */
    Column.prototype.name = null;

    /**
     * @var
     * @desc display name of the column
     */
    Column.prototype.displayName = null;

    /**
     * @var
     * @desc whether column is hidden or not
     */
    Column.prototype.hidden = false;

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} parent table
     * @param {Object} json entity data
     * @desc
     * Creates an entity, which is an instance of a table object.
     */
    function Entity (table, jsonEntity) {
        this.table = table;
        this.data = jsonEntity;

        var keys = {};
        if (table.keys.length) {
            keys = table.keys[0].unique_columns;
        }
        else {
            for (var i = 0; i < table.columns.length; i++) {
                keys.push(table.columns[i].name);
            }
        }

        this.uri = table.uri;
        for (var k = 0; k < keys.length; k++) {
            this.uri = this.uri + "/" + _fixedEncodeURIComponent(keys[k]) + "=" + _fixedEncodeURIComponent(jsonEntity[keys[k]]);
        }
    }

    /**
     * @var
     * @desc table
     */
    Entity.prototype.table = null;

    /**
     * @var
     * @desc entity uri
     */
    Entity.prototype.uri = null;

    /**
     * @var
     * @desc entity data
     */
    Entity.prototype.data = null;

    /**
     * @function
     * @param {String} schemaName Schema name.
     * @param {String} tableName Table name.
     * @return {Table} related table instance.
     * @desc
     * Returns a related table based on this entity.
     */
    Entity.prototype.getRelatedTable = function (schemaName, tableName) {
        return new RelatedTable(this, schemaName, tableName);
    };

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * Delete this entity from its table
     */
    Entity.prototype.delete = function () {
        var path = this.table.uri;
        var keys = this.table.keys[0].unique_columns;
        for (var i = 0; i < keys.length; i++) {
            if (i === 0) {
                path = path + "/" + _fixedEncodeURIComponent(keys[i]) + "=" + _fixedEncodeURIComponent(this.data[keys[i]]);
            } else {
                path = path + "," + _fixedEncodeURIComponent(keys[i]) + "=" + _fixedEncodeURIComponent(this.data[keys[i]]);
            }
        }
        return _http.delete(path).then(function(response) {
            return response.data;
        }, function(response) {
            return _q.reject(response.data);
        });
    };

    /**
     * @function
     * @return {Promise} Returns a promise.
     * @desc
     * Update entity with data that has been modified
     */
    Entity.prototype.update = function () {
        var path = this.table.schema.catalog._uri + "/entity/" + _fixedEncodeURIComponent(this.table.schema.name) + ":" + _fixedEncodeURIComponent(this.table.name);
        return _http.put(path, [this.data]).then(function(response) {
            return response.data;
        }, function(response) {
            console.log(response);
            return _q.reject(response.data);
        });

    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Object} object the Entity object or Table object.
     * @param {String} schemaName related schema name.
     * @param {String} tableName related table name.
     * @desc
     * Creates an instance of the Table object.
     */
    function RelatedTable(object, schemaName, tableName) {
        var schema;
        if (object instanceof Entity)
            schema = object.table.schema.catalog.getSchemas()[schemaName];
        else if(object instanceof Table)
            schema = object.schema.catalog.getSchemas()[schemaName];

        if (schema == undefined) {
            throw new UndefinedError(schemaName + " is not a valid schema.");
        }
        var table = schema.getTable(tableName);
        if (table == undefined) {
            throw new UndefinedError(tableName + " is not a valid table.");
        }

        // clone the parent
        _clone(this, table);

        // Extend the path from the entity to this related table
        this.uri = object.uri + "/" + _fixedEncodeURIComponent(schemaName) + ":" + _fixedEncodeURIComponent(tableName);
    }

    RelatedTable.prototype = Object.create(Table.prototype);

    RelatedTable.prototype.constructor = RelatedTable;


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table The base table to be filtered.
     * @param {Array} filters The array of filters. Need to be URI encoded!
     * @desc
     * Creates an instance of the Table object.
     *
     * Currently, the filters are strings that follow the ERMrest specification
     * for filters.
     */
    function FilteredTable(table, filters) {
        // clone the parent
        _clone(this, table);

        // Extend the URI with the filters
        for (var i = 0; i < filters.length; i++) {
            this.uri = this.uri + "/" + filters[i];
        }

        // TODO we probably want these filters to be more object oriented
        //   like a Filter object with left & right operands and an operator.
        this.filters = filters;
    }

    FilteredTable.prototype = Object.create(Table.prototype);

    FilteredTable.prototype.constructor = FilteredTable;

    /**
     * @var
     * @desc
     * Filters of the filtered table
     */
    FilteredTable.prototype.filters = {};

    /**
     * @memberof ERMrest
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
     * @private
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
     * @private
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
     * @private
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

    return module;
})();
