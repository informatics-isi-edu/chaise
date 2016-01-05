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
     * The module expects the http service to implement the
     * interface defined by the AngularJS 1.x $http service.
     */
    function configure(http, q) {
        _http = http;
        _q = q;
    }

    /**
     * @memberof ERMrest
     * @function
     * @param {String} uri URI of the ERMrest service.
     * @param {Object} credentials Credentials object (TBD)
     * @return {Client} Returns a new ERMrest.Client instance.
     * @desc
     * ERMrest client factory creates or reuses ERMrest.Client instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getClient(uri, credentials) {
        cli = _clients[uri];
        if (! cli) {
            cli = new Client(uri, credentials);
            _clients[uri] = cli;
        }
        return cli;
    }

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} uri URI of the client.
     * @param {Object} credentials TBD credentials object
     * @desc
     * Represents the ERMrest client endpoint. This is completely TBD. There
     * will be bootstrapping the connection, figuring out what credentials are
     * even needed, then how to establish those credentials etc. This may not
     * even be the right place to do this. There may be some other class needed
     * represent all of that etc.
     */
    function Client(uri, credentials) {
        if (uri === undefined || uri === null)
            throw "URI undefined or null";
        this.uri = uri;
        this.credentials = credentials;
        this._catalogs = {}; // consider "private"
    }

    /**
     * @var
     * @desc
     * The URI of the ERMrest service.
     */
    Client.prototype.uri = null;

    /**
     * @function
     * @param {String} id Identifier of a catalog within the context of a
     * client connection to an ERMrest service.
     * @desc
     * Returns an interface to a Catalog object representing the catalog
     * resource on the service.
     */
    Client.prototype.getCatalog = function (id) {
        if (id === undefined || id === null)
            throw "ID is undefined or nul";
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
     * @param {Client} client The ERMrest.Client connection.
     * @param {String} id Identifier of a catalog within the context of a
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
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, it gets the
     * schemas of the catalog. This method should be called at least on the
     * catalog object before using the rest of its methods.
     */
    Catalog.prototype.introspect = function () {
        // TODO this needs to process the results not just return raw json to client.
        // This method should:
        //   1. make the http call to get the schemas.
        //   2. do any processing it needs to do on the raw json returned by server
        //   3. save a copy of the schemas in this._schemas
        //   4. then return the schemas via the promise
        var self = this;
        return _http.get(this._uri + "/schema").then(function(response) {
            var jsonSchemas = response.data;
            for (var s in jsonSchemas.schemas) {
                self._schemas[s] = new Schema(self, jsonSchemas.schemas[s]);
            }
            return self._schemas;
        });
    };

    /**
     * @function
     * @return {Object} Returns a dictionary of schemas.
     * @desc
     * A synchronous method that returns immediately.
     */
    Catalog.prototype.getSchemas = function () {
        return this._schemas;
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog The catalog the schema belongs to.
     * @param {Object} jsonSchemas The raw json Schema returned by ERMrest.
     * @desc
     * Constructor for the Schema.
     */
    function Schema(catalog, jsonSchema) {
        this.catalog = catalog;
        this._uri = catalog._uri + "/schema/" + jsonSchema.schema_name;
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
     * @param {String} name The name of the table.
     * @desc
     * Returns a table from the schema.
     */
    Schema.prototype.getTable = function (name) {
        return this._tables[name];
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema The schema that the table belongs to.
     * @param {Object} jsonTable The raw json of the table returned by ERMrest.
     * @desc
     * Creates an instance of the Table object.
     */
    function Table(schema, jsonTable) {
        this._uri = schema.catalog._uri + "/entity/" + schema.name + ":" + jsonTable.table_name;
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
     * @param {Object} table The base table.
     * @param {Object} fitlers The filters.
     * @return {Object} a filtered table instance.
     * @desc
     * Returns a filtered table based on this table.
     */
    Table.prototype.getFilteredTable = function (filters) {
        return new FilteredTable(this, filters);
    };

    /**
     * @function
     * @return {Promise} Returns a Promise.
     * @desc
     * An asynchronous method that returns a promise. If fulfilled, it gets the
     * rows for this table.
     */
    Table.prototype.getRows = function () {
        var self = this;
        return _http.get(this._uri).then(function(response) {
            var rows = [];
            for (var i = 0; i < response.data.length; i++) {
                rows[i] = new Row(self, response.data[i]);
            }
            return rows;
        }, function(response) {
            return $q.reject(response.data);
        });
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {name} name of the column
     * @param {displayName} column's display name
     * @param {hidden} whether this column is hidden or not
     * @desc
     * Creates an instance of the Table object.
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
     * @param {table} parent table
     * @param {rowData} json row data
     * @desc
     * Creates an instance of the Table object.
     */
    function Row (table, jsonRow) {
        this.table = table;
        this.data = jsonRow;

        var keys = {};
        if (table.keys.length) {
            keys = table.keys[0].unique_columns;
        }
        else {
            for (var i = 0; i < table.columns.length; i++) {
                keys.push(table.columns[i].name);
            }
        }

        this.uri = table._uri;
        for (var k = 0; k < keys.length; k++) {
            this.uri = this.uri + "/" + keys[k] + "=" + jsonRow[keys[k]];
        }
    }

    /**
     * @var
     * @desc row uri
     */
    Row.prototype.uri = null;

    /**
     * @function
     * @param {String} schemaName Schema name.
     * @param {String} tableName Table name.
     * @return {Object} related table instance.
     * @desc
     * Returns a related table based on this row.
     */
    Row.prototype.getRelatedTable = function (schemaName, tableName) {
        return new RelatedTable(this, schemaName, tableName);
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Object} row row object.
     * @param {String} schemaName related schema name.
     * @param {String} tableName related table name.
     * @desc
     * Creates an instance of the Table object.
     */
    function RelatedTable(row, schemaName, tableName) {
        this._uri = row.uri + "/" + schemaName + ":" + tableName;
        this.name = tableName;

        // TODO we'll want to add more error handling here
        var table = row.table.schema.catalog.getSchemas()[schemaName].getTable(tableName);
        this.schema = table.schema;
        this.displayName = table.displayName;
        this.hidden = table.hidden;
        this.columns = table.columns;
        this.keys = table.keys;
        this.annotations = table.annotations;
    }

    RelatedTable.prototype = Object.create(Table.prototype);

    RelatedTable.prototype.constructor = RelatedTable;


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema The schema that the table belongs to.
     * @param {Object} jsonTable The raw json of the table returned by ERMrest.
     * @desc
     * Creates an instance of the Table object.
     */
    function FilteredTable(table, filters) {
        this._uri = table._uri;
        for (var i = 0; i < filters.length; i++) {
            this._uri = this._uri + "/" + filters[i];
        }

        this.filters = filters;
        this.displayName = table.displayName;
        this.name = table.name;
        this.schema = table.schema;
        this.hidden = table.hidden;
        this.columns = table.columns;
        this.keys = table.keys;
        this.annotations = table.annotations;
    }

    FilteredTable.prototype = Object.create(Table.prototype);

    FilteredTable.prototype.constructor = FilteredTable;

    /**
     * @var
     * @desc
     * Filters of the filtered table
     */
    FilteredTable.prototype.filters = {};

    return module;
})();
