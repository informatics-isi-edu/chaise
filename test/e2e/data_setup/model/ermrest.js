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
var ERMrest = {};

(function (module) {

    module.configure = configure;

    module.ermrestFactory = {
        getServer: getServer
    };


    var _servers = {};

    module._http = null;

    module._q = null;

    /**
     * @memberof ERMrest
     * @function
     * @param {Object} http Angular $http service object
     * @param {Object} q Angular $q service object
     * @desc This function is used to configure the module
     */
    function configure(http, q) {
        module._http = http;
        module._q = q;
    }

    /**
     * @memberof ERMrest
     * @function
     * @param {String} uri URI of the ERMrest service.
     * @return {ERMrest.Server} Returns a server instance.
     * @desc
     * ERMrest server factory creates or reuses ERMrest.Server instances. The
     * URI should be to the ERMrest _service_. For example,
     * `https://www.example.org/ermrest`.
     */
    function getServer(uri) {
        var server = _servers[uri];
        if (!server) {
            server = new Server(uri);
            _servers[uri] = server;
        }
        return server;
    }


    /**
     * @memberof ERMrest
     * @param {String} uri URI of the ERMrest service.
     * @constructor
     */
    function Server(uri) {

        if (uri === undefined || uri === null)
            throw "URI undefined or null";

        /**
         *
         * @type {String}
         */
        this.uri = uri;

        /**
         *
         * @type {ERMrest.Session}
         */
        this.session = new Session(this);
        this.session.get().then(function(data) { // TODO

        }, function(response) {

        });

        /**
         *
         * @type {ERMrest.Catalogs}
         */
        this.catalogs = new Catalogs(this);
    }


    /**
     * @memberof ERMrest
     * @constructor
     */
    function Session(server) {
        this._server = server;
        this._attributes = null;
        this._expires = null;
    }


    Session.prototype = {
        constructor: Session,

        /**
         *
         * @returns {Promise} Returns a promise.
         * @desc
         * An asynchronous method that returns a promise. If fulfilled (and a user
         * is logged in), it gets the current session information.
         */
        get: function() {
            return module._http.get(this._server.uri + "/authn/session").then(function(response) {
                return response.data;
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        login: function () {

        },

        logout: function () {

        },

        extend: function () {

        }


    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Server} server the server object.
     * @desc
     * Constructor for the Catalogs.
     */
    function Catalogs(server) {
        this._server = server;
        this._catalogs = {};
    }


    Catalogs.prototype = {
        constructor: Catalogs,

        create: function () {

        },

        /**
         *
         * @returns {Number} Returns the length of the catalogs.
         */
        length: function () {
            return Object.keys(this._catalogs).length;
        },

        /**
         *
         * @returns {Array} Returns an array of names of catalogs.
         */
        names: function () {
            return Object.keys(this._catalogs);
        },

        /**
         * @param {String} id Catalog ID.
         * @returns {Promise} Promise with the catalog object
         */
        get: function (id) {
            // do introspection here and return a promise

            var self = this;
            var defer = module._q.defer();

            // load catalog only when requested
            if (id in this._catalogs) {

                defer.resolve(self._catalogs[id]);
                return defer.promise;

            } else {

                var catalog = new Catalog(self._server, id);
                catalog._introspect().then(function (schemas) {
                    self._catalogs[id] = catalog;
                    defer.resolve(catalog);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            }
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Server} server the server object.
     * @param {String} id the catalog id.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog(server, id) {

        /**
         *
         * @type {ERMrest.Server}
         */
        this.server = server;

        /**
         *
         * @type {String}
         */
        this.id = id;

        this._uri = server.uri + "/catalog/" + id;

        /**
         *
         * @type {ERMrest.Schemas}
         */
        this.schemas = new Schemas();
    }

    Catalog.prototype = {
        constructor: Catalog,

        delete: function () {

        },

        _introspect: function () {
            // load all schemas
            var self = this;
            return module._http.get(this._uri + "/schema").then(function (response) {
                var jsonSchemas = response.data;
                for (var s in jsonSchemas.schemas) {
                    self.schemas._push(new Schema(self, jsonSchemas.schemas[s]));
                }

                // all schemas created
                // build foreign keys for each table in each schema
                var schemaNames = self.schemas.names();
                for (s = 0; s < schemaNames.length; s++) {
                    var schema = self.schemas.get(schemaNames[s]);
                    var tables = schema.tables.names();
                    for (var t = 0; t < tables.length; t++) {
                        var table = schema.tables.get(tables[t]);
                        table._buildForeignKeys();
                    }
                }

                return self.schemas;
            }, function (response) {
                // this is not a valid catalog
                return module._q.reject(response);
            });
        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Schemas.
     */
    function Schemas() {
        this._schemas = {};
    }

    Schemas.prototype = {
        constructor: Schemas,

        _push: function(schema) {
            this._schemas[schema.name] = schema;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of schemas
         */
        length: function () {
            return Object.keys(this._schemas).length;
        },

        /**
         *
         * @returns {Array} Array of all schemas
         */
        all: function() {
            var array = [];
            for (var key in this._schemas) {
                array.push(this._schemas[key]);
            }
            return array;
        },

        /**
         *
         * @returns {Array} Array of schema names
         */
        names: function () {
            return Object.keys(this._schemas);
        },

        /**
         * @param {String} name schema name
         * @returns {ERMrest.Schema} schema object
         */
        get: function (name) {
            if (!(name in this._schemas)) {
                // TODO schema not found, throw error
            }

            return this._schemas[name];
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Catalog} catalog the catalog object.
     * @param {String} jsonSchema json of the schema.
     * @desc
     * Constructor for the Catalog.
     */
    function Schema(catalog, jsonSchema) {

        /**
         *
         * @type {ERMrest.Catalog}
         */
        this.catalog = catalog;

        /**
         *
         */
        this.name = jsonSchema.schema_name;

        //this._uri = catalog._uri + "/schema/" + module._fixedEncodeURIComponent(this.name);

        /**
         *
         * @type {ERMrest.Tables}
         */
        this.tables = new Tables();
        for (var key in jsonSchema.tables) {
            var jsonTable = jsonSchema.tables[key];
            this.tables._push(new Table(this, jsonTable));
        }

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonSchema.annotations) {
            var jsonAnnotation = jsonSchema.annotations[uri];
            this.annotations._push(new Annotation("schema", uri, jsonAnnotation));
        }

    }

    Schema.prototype = {
        constructor: Schema,

        delete: function () {

        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Tables.
     */
    function Tables() {
        this._tables = {};
    }

    Tables.prototype = {
        constructor: Tables,

        _push: function(table) {
            this._tables[table.name] = table;
        },

        /**
         *
         * @returns {Array} array of tables
         */
        all: function() {
            var array = [];
            for (var key in this._tables) {
                array.push(this._tables[key]);
            }
            return array;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of tables
         */
        length: function () {
            return Object.keys(this._tables).length;
        },

        /**
         *
         * @returns {Array} Array of table names
         */
        names: function () {
            return Object.keys(this._tables);
        },

        /**
         *
         * @param {String} name name of table
         * @returns {ERMrest.Table} table
         */
        get: function (name) {
            if (!(name in this._tables)) {
                // TODO table not found, throw error
            }

            return this._tables[name];
        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Schema} schema the schema object.
     * @param {String} jsonTable the json of the table.
     * @desc
     * Constructor for Table.
     */
    function Table(schema, jsonTable) {

        /**
         *
         * @type {ERMrest.Schema}
         */
        this.schema = schema;

        /**
         *
         */
        this.name = jsonTable.table_name;
        this._jsonTable = jsonTable;

        //this.uri = schema.catalog._uri + "/entity/" + module._fixedEncodeURIComponent(schema.name) + ":" + module._fixedEncodeURIComponent(jsonTable.table_name);

        /**
         *
         * @type {ERMrest.Table.Entity}
         */
        this.entity = new Entity(this);

        /**
         *
         * @type {ERMrest.Columns}
         */
        this.columns = new Columns();
        for (var i = 0; i < jsonTable.column_definitions.length; i++) {
            var jsonColumn = jsonTable.column_definitions[i];
            this.columns._push(new Column(this, jsonColumn));
        }

        /**
         *
         * @type {ERMrest.Keys}
         */
        this.keys = new Keys();
        for (i = 0; i < jsonTable.keys.length; i++) {
            var jsonKey = jsonTable.keys[i];
            this.keys._push(new Key(this, jsonKey));
        }

        /**
         *
         * @type {ERMrest.ForeignKeys}
         */
        this.foreignKeys = new ForeignKeys();

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonTable.annotations) {
            var jsonAnnotation = jsonTable.annotations[uri];
            this.annotations._push(new Annotation("table", uri, jsonAnnotation));
        }
    }

    Table.prototype = {
        constructor: Table,

        delete: function () {

        },

        _buildForeignKeys: function() {
            // this should be built on the second pass after introspection
            // so we already have all the keys and columns for all tables
            this.foreignKeys = new ForeignKeys();
            for (var i = 0; i < this._jsonTable.foreign_keys.length; i++) {
                var jsonFKs = this._jsonTable.foreign_keys[i];
                this.foreignKeys._push(new ForeignKeyRef(this, jsonFKs));
            }
        }

    };


    /**
     * @memberof ERMrest.Table
     * @constructor
     * @param {ERMrest.Table} table
     * @desc
     * Constructor for Entity. This is a container in Table
     */
    function Entity(table) {
        this._table = table;
    }

    Entity.prototype = {
        constructor: Entity,

        /**
         *
         * @param {string} api entity, attribute or attributegroup
         * @returns {string} the base URI for doing http calls
         * @private
         * @desc <service>/catalog/<cid>/<api>/<schema>:<table>
         */
        _getBaseURI: function(api) {
            return this._table.schema.catalog._uri + "/" + api + "/" +
                module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);
        },

        _toURI: function(filter, output, sortby, paging, row, limit) {

            var api = (output === null || output === undefined) ? "entity" : "attribute";

            var uri = this._getBaseURI(api);

            if (filter !== undefined && filter !== null) {
                uri = uri + "/" + filter.toUri();
            }

            // selected columns only
            if (output !== undefined && output !== null) {
                for (var c = 0; c < output.length; c++) {
                    var col = output[c]; // if string
                    if (output[c] instanceof Column) {
                        col = output[c].name;
                    }
                    if (c === 0)
                        uri = uri + "/" + module._fixedEncodeURIComponent(col);
                    else
                        uri = uri + "," + module._fixedEncodeURIComponent(col);
                }
            }

            if (sortby !== undefined && sortby !== null) {
                for (var d = 0; d < sortby.length; d++) {
                    var sortCol = sortby[d].column; // if string
                    if (sortby[d] instanceof Column) { // if Column object
                        sortCol = sortby[d].name;
                    }
                    var order = (sortby[d].order === 'desc' ? "::desc::" : "");
                    if (d === 0)
                        uri = uri + "@sort(" + module._fixedEncodeURIComponent(sortCol) + order;
                    else
                        uri = uri + "," + module._fixedEncodeURIComponent(sortCol) + order;
                }
                uri = uri + ")";

                // paging requires sortby
                if (paging  !== undefined && paging !== null && row !== undefined && row !== null) {
                    if (paging === "before") {
                        uri = uri + "@before(";
                    } else {
                        uri = uri + "@after(";
                    }

                    for (d = 0; d < sortby.length; d++) {
                        var pageCol = sortby[d].column; // if string
                        if (sortby[d] instanceof Column) { // if Column object
                            pageCol = sortby[d].name;
                        }
                        var value = row[pageCol];
                        if (value === null)
                            value = "::null::";
                        else
                            value = module._fixedEncodeURIComponent(value);
                        if (d === 0)
                            uri = uri + value;
                        else
                            uri = uri + "," + value;
                    }

                    uri = uri + ")";
                }

            }


            if (limit !== undefined && limit !== null) {
                uri = uri + "?limit=" + limit;
            }

            return uri;
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @returns {Promise}
         * @desc get the number of rows
         *
         */
        count: function(filter) {

            var uri = this._getBaseURI("aggregate");

            if (filter !== undefined && filter !== null) {
                uri = uri + "/" + filter.toUri();
            }

            uri = uri + "/row_count:=cnt(*)";

            return module._http.get(uri).then(function(response) {
                return response.data[0].row_count;
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit Optional. Number of rows or null
         * @param {Array} columns Optional. Array of column names or Column objects output
         * @param {Array} sortby Option. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
         * @returns {Promise}
         * @desc
         * get table rows with option filter, row limit and selected columns (in this order).
         *
         * In order to use before & after on a rowset, limit must be speficied,
         * output columns and sortby needs to have columns of a key
         */
        get: function(filter, limit, columns, sortby) {

            var uri = this._toURI(filter, columns, sortby, null, null, limit);

            var self = this;
            return module._http.get(uri).then(function(response) {
                return new RowSet(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit Required. Number of rows
         * @param {Array} columns Optional. Array of column names or Column objects output
         * @param {Array} sortby Option. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
         * @param {Object} row json row data used to getBefore
         *
         * @returns {Promise}
         * @desc
         * get a page of rows before a specific row
         *
         */
        getBefore: function(filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "before", row, limit);

            var self = this;
            return module._http.get(uri).then(function(response) {
                return new RowSet(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        /**
         *
         * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
         * @param {Number} limit Required. Number of rows
         * @param {Array} columns Optional. Array of column names or Column objects output
         * @param {Array} sortby Option. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
         * @param {Object} row json row data used to getAfter
         *
         * @returns {Promise}
         * @desc
         * get a page of rows after a specific row
         *
         */
        getAfter: function(filter, limit, columns, sortby, row) {
            var uri =
                this._toURI(filter, columns, sortby, "after", row, limit);

            var self = this;
            return module._http.get(uri).then(function(response) {
                return new RowSet(self._table, response.data, filter, limit, columns, sortby);
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        /**
         *
         * @param {Object} filter Negation, Conjunction, Disjunction, UnaryPredicate, or BinaryPredicate
         * @returns {Promise} Promise
         * @desc
         * Delete rows from table based on the filter
         */
        delete: function (filter) {
            var uri = this._toURI(filter);

            return module._http.delete(uri).then(function(response) {
                return response.data;
            }, function(response) {
                return module._q.reject(response.data);
            });
        },

        /**
         *
         * @param {Object} rows jSON representation of the updated rows
         * @returns {Promise} Promise
         * Update rows in the table
         */
        put: function (rows) {

            var uri = this._toURI();

            return module._http.put(uri, rows).then(function(response) {
                return response.data;
            }, function(response) {
                console.log(response);
                return module._q.reject(response.data);
            });
        },

        /**
         *
         * @param {Object} rows Array of jSON representation of rows
         * @param {Array} defaults Array of string column names to be defaults
         * @returns {Promise} Promise
         * @desc
         * Create new entities
         */
        post: function (rows, defaults) { // create new entities
            var uri = this._table.schema.catalog._uri + "/entity/" +
                module._fixedEncodeURIComponent(this._table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this._table.name);

            if (typeof defaults !== 'undefined') {
                for (var i = 0; i < defaults.length; i++) {
                    if (i === 0) {
                        uri = uri + "?defaults=" + module._fixedEncodeURIComponent(defaults[i]);
                    } else {
                        uri = uri + "," + module._fixedEncodeURIComponent(defaults[i]);
                    }
                }
            }

            return module._http.post(uri, rows).then(function(response) {
               return response.data;
            }, function(response) {
                return module._q.reject(response);
            });
        }

    };


    /**
     *
     * @memberof ERMrest
     * @param {ERMrest.Table} table Required.
     * @param {Object} jsonRows Required.
     * @param {Object} filter Optional. Negation, Conjunction, Disjunction, UnaryPredicate, BinaryPredicate or null
     * @param {Number} limit Required. Number of rows
     * @param {Array} columns Optional. Array of column names or Column objects output
     * @param {Array} sortby Optional. An ordered array of {column, order} where column is column name or Column object, order is null/'' (default), 'asc' or 'desc'
     * @constructor
     */
    function RowSet(table, jsonRows, filter, limit, columns, sortby) {
        this._table = table;
        this.data = jsonRows;
        this._filter = filter;
        this._limit = limit;
        this._columns = columns;
        this._sortby = sortby;
    }

    RowSet.prototype = {
        constructor: RowSet,

        /**
         *
         * @returns {number}
         */
        length: function() {
            return this.data.length;
        },

        /**
         *
         * @returns {Promise}
         * @desc get the rowset of the next page
         *
         */
        after: function() {

            return this._table.entity.getAfter(this._filter, this._limit, this._output, this._sortby, this.data[this.data.length - 1]);
        },

        /**
         *
         * @returns {Promise}
         * @desc get the rowset of the previous page
         *
         */
        before: function() {

            return this._table.entity.getBefore(this._filter, this._limit, this._output, this._sortby, this.data[0]);
        }
    };

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Columns.
     */
    function Columns() {
        this._columns = {};
    }

    Columns.prototype = {
        constructor: Columns,

        _push: function(column) {
            this._columns[column.name] = column;
        },

        /**
         *
         * @returns {Array} array of all columns
         */
        all: function() {
            var array = [];
            for (var key in this._columns) {
                array.push(this._columns[key]);
            }
            return array;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of columns
         */
        length: function () {
            return Object.keys(this._columns).length;
        },

        /**
         *
         * @returns {Array} names of columns
         */
        names: function () {
            return Object.keys(this._columns);
        },

        /**
         *
         * @param {String} name name of column
         * @returns {ERMrest.Column} column
         */
        get: function (name) {
            if (!(name in this._columns)) {
                // TODO not found, throw error
            }
            return this._columns[name];
        },

        getByPosition: function (pos) {

        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Table} table the table object.
     * @param {String} jsonColumn the json column.
     * @desc
     * Constructor for Column.
     */
    function Column(table, jsonColumn) {

        /**
         *
         * @type {ERMrest.Table}
         */
        this.table = table;

        /**
         * @type {String}
         */
        this.name = jsonColumn.name;

        /**
         *
         * @type {ERMrest.Type}
         */
        this.type = new Type(jsonColumn.type.typename);

        /**
         * @type {Boolean}
         */
        this.nullok = jsonColumn.nullok;

        /**
         * @type {String}
         */
        this.default = jsonColumn.default;

        /**
         * @type {String}
         */
        this.comment = jsonColumn.comment;

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonColumn.annotations) {
            var jsonAnnotation = jsonColumn.annotations[uri];
            this.annotations._push(new Annotation("column", uri, jsonAnnotation));
        }

        /**
         * Member of Keys
         * @type {Array}
         */
        this.memberOfKeys = [];

        /**
         * Member of ForeignKeys
         * @type {Array}
         */
        this.memberOfForeignKeys = [];
    }

    Column.prototype = {
        constructor: Column,

        delete: function () {

        },

        _equals: function(column) {
            return (column.table.schema.name === this.table.schema.name &&
                column.table.name === this.table.name &&
                column.name === this.name);
        }

    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Annotations.
     */
    function Annotations() {
        this._annotations = {};
    }

    Annotations.prototype = {
        constructor: Annotations,

        _push: function(annotation) {
            this._annotations[annotation._uri] = annotation;
        },

        /**
         *
         * @returns {Array} list of all annotations
         */
        all: function() {
            var array = [];
            for (var key in this._annotations) {
                array.push(this._annotations[key]);
            }
            return array;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of annotations
         */
        length: function () {
            return Object.keys(this._annotations).length;
        },

        /**
         *
         * @returns {Array} array of annotation names
         */
        names: function () {
            return Object.keys(this._annotations);
        },

        /**
         *
         * @param {String} uri uri of annotation
         * @returns {ERMrest.Annotation} annotation
         */
        get: function (uri) {
            if (!(uri in this._annotations)) {
                // TODO table not found, throw error
            }

            return this._annotations[uri];
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} subject subject of the annotation: schema,table,column,key,foreignkeyref.
     * @param {String} uri uri id of the annotation.
     * @param {String} jsonAnnotation json of annotation.
     * @desc
     * Constructor for Annotation.
     */
    function Annotation(subject, uri, jsonAnnotation) {

        /**
         *
         * @type {String}  schema,table,column,key,foreignkeyref
         */
        this.subject = subject;
        this._uri = uri;

        /**
         *
         * @type {String} json content
         */
        this.content = jsonAnnotation;
    }

    Annotation.prototype = {
        constructor: Annotation,

        _delete: function () {

        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Keys.
     */
    function Keys() {
        this._keys = [];
    }

    Keys.prototype = {
        constructor: Keys,

        _push: function(key) {
            this._keys.push(key);
        },

        /**
         *
         * @returns {Array} a list of all Keys
         */
        all: function() {
            return this._keys;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of keys
         */
        length: function () {
            return this._keys.length;
        },

        /**
         *
         * @returns {Array} array of colsets
         */
        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._keys.length; i++) {
                sets.push(this._keys[i].colset);
            }
            return sets;
        },

        /**
         *
         * @param {ERMrest.ColSet} colset
         * @returns {ERMrest.Key} key of the colset
         */
        get: function (colset) {
            // find Key with the same colset
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (colset._equals(key.colset)) {
                    return key;
                }
            }
            return null;
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {ERMrest.Table} table the table object.
     * @param {String} jsonKey json key.
     * @desc
     * Constructor for Key.
     */
    function Key(table, jsonKey) {

        this._table = table;

        var uniqueColumns = [];
        for (var i = 0; i < jsonKey.unique_columns.length; i++) {
            // find corresponding column objects
            var col = table.columns.get(jsonKey.unique_columns[i]);
            uniqueColumns.push(col);
            col.memberOfKeys.push(this);
        }

        /**
         *
         * @type {ERMrest.ColSet}
         */
        this.colset = new ColSet(uniqueColumns);

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonKey.annotations) {
            var jsonAnnotation = jsonKey.annotations[uri];
            this.annotations._push(new Annotation("key", uri, jsonAnnotation));
        }
    }

    Key.prototype = {
        constructor: Key,

        /**
         * Indicates if the key is simple (not composite)
         * @type {Boolean}
         */
        get simple() {
            return this.colset.length() == 1;
        }
    };


    /**
     * @memberof ERMrest
     * @constructor
     * @param {Array} columns an array of Column objects.
     * @desc
     * Constructor for ColSet, a set of Column objects.
     */
    function ColSet(columns) {

        /**
         *
         * @type {Array}
         */
        this.columns = columns;
    }

    ColSet.prototype = {
        constructor: ColSet,

        /**
         *
         * @returns {Number} number of columns
         */
        length: function () {
            return this.columns.length;
        },

        _equals: function (colset) {
            var colsA = colset.columns;
            var colsB = this.columns;

            // for each col in colsetA, find equiv. col in colsetB
            if (colsA.length === colsB.length) {
                for (var a = 0; a < colsA.length; a++) {
                    var colA = colsA[a];

                    // find equiv col in colsetB
                    // if not found, return false
                    var foundMatchingCol = false;
                    for (var b = 0; b < colsB.length; b++) {
                        var colB = colsB[b];
                        if (colA._equals(colB)){
                            foundMatchingCol = true;
                            break;
                        }
                    }
                    if (!foundMatchingCol) {
                        return false;
                    }
                }
            } else return false;

            return true;
        }

    };


    /**
     *
     * @memberof ERMrest
     * @param {Array} from array of from Columns
     * @param {Array} to array of to Columns
     * @constructor
     */
    function Mapping(from, to) { // both array of 'Column' objects
        this._from = from;
        this._to = to;
    }

    Mapping.prototype = {
        constructor: Mapping,

        /**
         *
         * @returns {Number} number of mapping columns
         */
        length: function () {
            return this._from.length;
        },

        /**
         *
         * @returns {Array} the from columns
         */
        domain: function () {
            return this._from;
        },

        /**
         *
         * @param {ERMrest.Column} fromCol
         * @returns {ERMrest.Column} mapping column
         */
        get: function (fromCol) {
            for (var i = 0; i < this._from.length; i++) {
                if (fromCol._equals(this._from[i])) {
                    return this._to[i];
                }
            }
            return null; // no mapping found
        }
    };


    /**
     *
     * @memberof ERMrest
     * @constructor
     */
    function ForeignKeys() {
        this._foreignKeys = []; // array of ForeignKeyRef
        this._mappings = []; // array of Mapping
    }

    ForeignKeys.prototype = {
        constructor: ForeignKeys,

        _push: function(foreignKeyRef) {
            this._foreignKeys.push(foreignKeyRef);
            this._mappings.push(foreignKeyRef.mapping);
        },

        /**
         *
         * @returns {Array} an array of all foreign key references
         */
        all: function() {
            return this._foreignKeys;
        },

        /**
         *
         * @returns {Array} an array of the foreign keys' colsets
         */
        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._foreignKeys.length; i++) {
                sets.push(this._foreignKeys[i].colset);
            }
            return sets;
        },

        create: function () {

        },

        /**
         *
         * @returns {Number} number of foreign keys
         */
        length: function () {
            return this._foreignKeys.length;
        },

        /**
         *
         * @returns {Array} mappings
         */
        mappings: function () {
            return this._mappings;
        },

        //get: function (mapping) { // TODO?
        //},

        /**
         *
         * @param {ERMrest.ColSet} colset
         * @returns {ERMrest.ForeignKeyRef} foreign key reference of the colset
         */
        get: function (colset) {
            // find ForeignKeyRef with the same colset
            for (var i = 0; i < this._foreignKeys.length; i++) {
                var fkr = this._foreignKeys[i];
                if (colset._equals(fkr.colset)) {
                    return fkr;
                }
            }
            return null;
        }
    };


    /**
     *
     * @memberof ERMrest
     * @param {ERMrest.Table} table
     * @param {Object} jsonFKR
     * @constructor
     */
    function ForeignKeyRef(table, jsonFKR) {

        var catalog = table.schema.catalog;

        // create ColSet for foreign key columns
        var fkCols = jsonFKR.foreign_key_columns;
        var foreignKeyCols = [];
        for (var i = 0; i < fkCols.length; i++) {
            var fkcol = table.columns.get(fkCols[i].column_name); // "Column" object
            foreignKeyCols.push(fkcol);
            fkcol.memberOfForeignKeys.push(this);
        }

        /**
         *
         * @type {ERMrest.ColSet}
         */
        this.colset = new ColSet(foreignKeyCols);

        // find corresponding Key from referenced columns
        // ** all the tables in the catalog must have been created at this point
        var refCols = jsonFKR.referenced_columns;
        var refTable = catalog.schemas.get(refCols[0].schema_name).tables.get(refCols[0].table_name);
        var referencedCols = [];
        for (var j = 0; j < refCols.length; j++) {
            var col = refTable.columns.get(refCols[j].column_name);
            referencedCols.push(col);
        }

        /**
         *
         * find key from referencedCols
         * use index 0 since all refCols should be of the same schema:table
         * @type {ERMrest.Key}
         */
        this.key = refTable.keys.get(new ColSet(referencedCols));

        /**
         *
         * @type {ERMrest.Mapping}
         */
        this.mapping = new Mapping(foreignKeyCols, referencedCols);

        /**
         *
         * @type {ERMrest.Annotations}
         */
        this.annotations = new Annotations();
        for (var uri in jsonFKR.annotations) {
            var jsonAnnotation = jsonFKR.annotations[uri];
            this.annotations._push(new Annotation("foreignkeyref", uri, jsonAnnotation));
        }

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        delete: function () {

        },

        // returns rows of the referenced key's table
        /**
         *
         * @param {Number} limit
         * @returns {Promise} promise with rows of the referenced key's table
         */
        getDomainValues: function (limit) {
            if (limit === undefined)
                limit = null;
            return this.key._table.entity.get(null, limit, this.key.colset.columns);
        },

        /**
         * Indicates if the foreign key is simple (not composite)
         * @type {Boolean}
         */
        get simple() {
            return this.key.simple;
        }
    };


    /**
     *
     * @memberof ERMrest
     * @param name
     * @constructor
     */
    function Type(name) {
        //.name
        //.is_array : boolean
        //.base_type

        /**
         *
         */
        this.name = name;
    }

    Type.prototype = {
        constructor: Type,

        is_array: function () {

        }
    };

    /**
     * @constructor
     * @param {String} message error message
     * @desc
     * Creates a undefined error object
     */
    function UndefinedError(message) {
        /**
         *
         * @type {string} error name
         */
        this.name = "UndefinedError";

        /**
         *
         * @type {String} error message
         */
        this.message = (message || "");
    }

    UndefinedError.prototype = Error.prototype;

    return module;
})(ERMrest || {});


/**
 * @namespace ERMrest.Datapath
 */
(function(module) {

    module.DataPath = DataPath;

    /**
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Table} table
     * @constructor
     */
    function DataPath(table) {

        this._nextAlias = "a"; // TODO better way to doing alias?

        /**
         *
         * @type {ERMrest.Catalog}
         */
        this.catalog = table.schema.catalog;

        /**
         *
         * @type {ERMrest.Datapath.PathTable}
         */
        this.context = new PathTable(table, this, this._nextAlias);

        this._nextAlias = module._nextChar(this._nextAlias);

        this.attribute = null;

        this.attributegroup = null;

        this.aggregate = null;

        this.entity._bind(this);

        this._pathtables = [this.context]; // in order

        this._filter = null;

    }

    DataPath.prototype = {
        constructor: module.DataPath,

        _copy: function() { // shallow copy
            var dp = Object.create(DataPath.prototype);
            module._clone(dp, this);
            dp.entity._bind(dp);
            return dp;
        },

        /**
         *
         * @param {Object} filter
         * @returns {ERMrest.Datapath.DataPath} a shallow copy of this datapath with filter
         * @desc
         * this datapath is not modified
         */
        filter: function (filter) {
            var dp = this._copy();
            dp._filter = filter;
            return dp;
        },

        /**
         *
         * @param {ERMrest.Table} table
         * @param context
         * @param link
         * @returns {ERMrest.Datapath.PathTable}
         */
        extend: function (table, context, link) { // TODO context? link?
            this.context = new PathTable(table, this, this._nextAlias);
            this._nextAlias = module._nextChar(this._nextAlias);
            this._pathtables.push(this.context);
            return this.context;
        },

        _getUri: function() {
            var uri = "";
            for (var i = 0; i < this._pathtables.length; i++) {
                if (i === 0)
                    uri = this._pathtables[i].toString();
                else
                    uri = uri + "/" + this._pathtables[i].toString();
            }

            // filter strings
            if (this._filter !== null) {
                uri = uri + "/" + this._filter.toUri();
            }

            return uri;

        },

        /**
         * @desc
         * entity container
         */
        entity: {
            scope: null,

            _bind: function(scope) {
                this.scope = scope;
            },

            /**
             * @returns {Promise} promise with rowset data
             */
            get: function () {
                var baseUri = this.scope.catalog.server.uri;
                var catId = this.scope.catalog.id;
                var uri = baseUri +            // base
                    "/catalog/" + catId +      // catalog
                    "/entity/" +               // interface
                    this.scope._getUri();      // datapath

                return module._http.get(uri).then(function(response){
                    return response.data;
                }, function(response){
                    return module._q.reject(response);
                });
            },

            /**
             *
             * @param {Object} filter
             * @desc delete entities
             * @returns {Promise}
             */
            delete: function (filter) {
                var baseUri = this.scope.catalog.server.uri;
                var catId = this.scope.catalog.id;
                var uri = baseUri +
                    "/catalog/" + catId +
                    "/entity/" +
                    this.scope._getUri();

                uri = uri + "/" + filter.toUri();

                return module._http.delete(uri).then(function(response) {
                    return response.data;
                }, function(response) {
                    return module._q.reject(response.data);
                });
            }
        }

    };


    /**
     *
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Table} table
     * @param {ERMrest.Datapath.DataPath} datapath
     * @param {string} alias
     * @constructor
     */
    function PathTable(table, datapath, alias) {

        /**
         *
         * @type {ERMrest.Datapath.DataPath}
         */
        this.datapath = datapath;

        /**
         *
         * @type {ERMrest.Table}
         */
        this.table = table;

        /**
         *
         * @type {string}
         */
        this.alias = alias;

        /**
         *
         * @type {ERMrest.Datapath.Columns}
         */
        this.columns = new Columns(table, this); // pathcolumns
    }

    PathTable.prototype = {
        constructor: PathTable,

        /**
         *
         * @returns {string} uri of the PathTable
         */
        toString: function () {
            return this.alias + ":=" + module._fixedEncodeURIComponent(this.table.schema.name) + ":" +
                module._fixedEncodeURIComponent(this.table.name);
        }

    };

    /**
     *
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Table} table
     * @param {ERMrest.Datapath.PathTable} pathtable
     */
    function Columns(table, pathtable) {
        this._table = table;
        this._pathtable = pathtable;
        this._pathcolumns = {};
    }

    Columns.prototype = {
        constructor: Columns,

        _push: function(pathcolumn) {
            this._pathcolumns[pathcolumn.column.name] = pathcolumn;
        },

        /**
         *
         * @returns {Number} number of path columns
         */
        length: function () {
            return Object.keys(this._pathcolumns).length;
        },

        /**
         *
         * @returns {Array} a list of pathcolumn names
         */
        names: function () { // TODO order by position
            return Object.keys(this._pathcolumns);
        },

        /**
         *
         * @param {string} colName column name
         * @returns {ERMrest.Datapath.PathColumn} returns the PathColumn
         */
        get: function (colName) {
            if (colName in this._pathcolumns)
                return this._pathcolumns[colName];
            else {
                // create new PathColumn
                var pc = new PathColumn(this._table.columns.get(colName), this._pathtable);
                this._pathcolumns[colName] = pc;
                return pc;
            }
        },

        getByPosition: function (pos) {

        }
    };


    /**
     * @memberof ERMrest.Datapath
     * @param {ERMrest.Column} column
     * @param {ERMrest.Datapath.PathTable} pathtable
     * @constructor
     */
    function PathColumn(column, pathtable) {

        /**
         *
         * @type {ERMrest.Datapath.PathTable}
         */
        this.pathtable = pathtable;

        /**
         *
         * @type {ERMrest.Column}
         */
        this.column = column;

        this.operators = new Operators(); // TODO

        this.pathtable.columns._push(this);
    }


    function Operators() {
        this._operators = {};
    }

    Operators.prototype = {
        constructor: Operators,

        length: function () {
            return Object.keys(this._operators).length;
        },

        names: function () {
            return Object.keys(this._operators);
        },

        get: function (name) {
            return this._operators[name];
        }
    };


}(ERMrest || {}));

/**
 * @namespace ERMrest.Filters
 */
(function(module) {

    module.Negation = Negation;

    module.Conjunction = Conjunction;

    module.Disjunction = Disjunction;

    module.UnaryPredicate = UnaryPredicate;

    module.BinaryPredicate = BinaryPredicate;

    module.OPERATOR = {
        EQUAL: "=",
        GREATER_THAN: "::gt::",
        LESS_THAN: "::lt::",
        NULL: "::null::"
    };

    /**
     * @memberof ERMrest.Filters
     * @param filter
     * @constructor
     */
    function Negation (filter) {
        this.filter = filter;
    }

    Negation.prototype = {
        constructor: Negation,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function () {
            return "!(" + this.filter.toUri() + ")";
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param filters
     * @constructor
     */
    function Conjunction (filters) {
        this.filters = filters;
    }

    Conjunction.prototype = {
        constructor: Conjunction,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function () {
            // loop through individual filters to create filter strings
            var filterStrings = [];
            for (var i = 0; i < this.filters.length; i++) {
                filterStrings[i] = this.filters[i].toUri();
            }

            // combine filter strings
            var uri = "";
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + filterStrings[j];
                else
                    uri = uri + "&" + filterStrings[j];
            }

            return uri;
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param filters
     * @constructor
     */
    function Disjunction (filters) {
        this.filters = filters;
    }

    Disjunction.prototype = {
        constructor: Disjunction,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function () {
            // loop through individual filters to create filter strings
            var filterStrings = [];
            for (var i = 0; i < this.filters.length; i++) {
                filterStrings[i] = this.filters[i].toUri();
            }

            // combine filter strings
            var uri = "";
            for (var j = 0; j < filterStrings.length; j++) {
                if (j === 0)
                    uri = uri + filterStrings[j];
                else
                    uri = uri + ";" + filterStrings[j];
            }

            return uri;
        }
    };

    /**
     *
     * @memberof ERMrest.Filters
     * @param {ERMrest.Column} column
     * @param {ERMrest.Filters.OPERATOR} operator
     * @constructor
     */
    function UnaryPredicate (column, operator) {
        this.column = column; // pathcolumn or column
        this.operator = operator;
    }

    UnaryPredicate.prototype = {
        constructor: UnaryPredicate,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function() {
            var colName =  (this.column.name ?
                // Column
                this.column.name :
                // Pathcolumn
                this.column.pathtable.alias + ":" + this.column.column.name);
            return colName + this.operator;
        }
    };

    /**
     * @memberof ERMrest.Filters
     * @param {ERMrest.Column} column
     * @param {ERMrest.Filters.OPERATOR} operator
     * @param {String | Number} rvalue
     * @constructor
     */
    function BinaryPredicate (column, operator, rvalue) {

        this.column = column; // either pathcolumn or column
        this.operator = operator;
        this.rvalue = rvalue;
    }

    BinaryPredicate.prototype = {
        constructor: BinaryPredicate,

        /**
         *
         * @returns {string} URI of the filter
         */
        toUri: function() {
            var colName =  (this.column.name ?
                // Column
                this.column.name :
                // Pathcolumn
                this.column.pathtable.alias + ":" + this.column.column.name);
            return colName + this.operator + this.rvalue;
        }
    };


}(ERMrest || {}));

(function(module) {

    /**
     * @function
     * @param {Object} copyTo the object to copy values to.
     * @param {Object} copyFrom the object to copy value from.
     * @desc
     * This private utility function does a shallow copy between objects.
     */
    module._clone = function (copyTo, copyFrom) {
        for (var key in copyFrom) {
            // only copy those properties that were set in the object, this
            // will skip properties from the source object's prototype
            if (copyFrom.hasOwnProperty(key)) {
                copyTo[key] = copyFrom[key];
            }
        }
    };

    /**
     * @function
     * @param {String} str string to be converted.
     * @desc
     * converts a string to title case
     */
    module._toTitleCase = function (str) {
        return str.replace(/\w\S*/g, function(txt){
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    /**
     * @function
     * @param {String} str string to be encoded.
     * @desc
     * converts a string to an URI encoded string
     */
    module._fixedEncodeURIComponent = function (str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16).toUpperCase();
        });
    };

    module._nextChar = function (c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    };

}(ERMrest || {}));

if (typeof module === 'object' && module.exports && typeof require === 'function') {
     module.exports = ERMrest;
} else {
    window.ERMrest = ERMrest;
}
