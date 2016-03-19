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

var ERMrest = (function () {

    /**
     * @var
     * @private
     * @desc This is the state of the module.
     */
    var module = {
        configure: configure,

        ermrestFactory: {
            getServer: getServer
        }
    };

    /**
     * @private
     * @var _servers
     * @desc
     * Internal collection of ERMrest servers.
     */
    var _servers = {};

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
     * @return {Server} Returns a server instance.
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


    /******************************************************/
    /* Server                                             */
    /******************************************************/

    function Server(uri) {

        if (uri === undefined || uri === null)
            throw "URI undefined or null";
        this.uri = uri;
        this.session = new Session();
        this.catalogs = new Catalogs(this);
    }

    /******************************************************/
    /* Session                                            */
    /******************************************************/

    function Session() {
        this._client = null;
        this._attributes = null;
        this._expires = null;
    }

    Session.prototype = {
        constructor: Session,

        /**
         * @function
         * @return {Promise} Returns a promise.
         * @desc
         * An asynchronous method that returns a promise. If fulfilled (and a user
         * is logged in), it gets the current session information.
         */
        get: function() {
            return _http.get(this.uri + "/authn/session").then(function(response) {
                return response.data;
            }, function(response) {
                return _q.reject(response);
            });
        },

        login: function () {

        },

        logout: function () {

        },

        extend: function () {

        }


    };

    /******************************************************/
    /* Catalogs                                           */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Server} server the server object.
     * @desc
     * Constructor for the Catalogs.
     */
    function Catalogs(server) {
        this.server = server;
        this._catalogs = {};
    }


    Catalogs.prototype = {
        constructor: Catalogs,

        create: function () {

        },

        length: function () {
            return Object.keys(this._catalogs).length;
        },

        names: function () {
            return Object.keys(this._catalogs);
        },

        get: function (id) {
            // do introspection here and return a promise

            var self = this;
            var defer = _q.defer();

            // load catalog only when requested
            if (id in this._catalogs) {

                defer.resolve(self._catalogs[id]);
                return defer.promise;

            } else {

                var catalog = new Catalog(self.server, id);
                catalog.introspect().then(function (schemas) {
                    self._catalogs[id] = catalog;
                    defer.resolve(catalog);
                }, function (response) {
                    defer.reject(response);
                });

                return defer.promise;
            }
        }
    };

    /******************************************************/
    /* Catalog                                            */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Server} server the server object.
     * @param {String} id the catalog id.
     * @desc
     * Constructor for the Catalog.
     */
    function Catalog(server, id) {

        this.server = server;
        this.id = id;
        this.uri = server.uri + "/catalog/" + id;
        this.schemas = new _Schemas();
    }

    Catalog.prototype = {
        constructor: Catalog,

        delete: function () {

        },

        introspect: function () {
            // load all schemas
            var self = this;
            return _http.get(this.uri + "/schema").then(function (response) {
                var jsonSchemas = response.data;
                for (var s in jsonSchemas.schemas) {
                    self.schemas.push(new Schema(self, jsonSchemas.schemas[s]));
                }

                // all schemas created
                // build foreign keys for each table in each schema
                var schemaNames = self.schemas.names();
                for (var s = 0; s < schemaNames.length; s++) {
                    var schema = self.schemas.get(schemaNames[s]);
                    var tables = schema.tables.names();
                    for (var t = 0; t < tables.length; t++) {
                        var table = schema.tables.get(tables[t]);
                        table.buildForeignKeys();
                    }
                }

                return self.schemas;
            }, function (response) {
                // this is not a valid catalog
                return _q.reject(response);
            });
        }

    };

    /******************************************************/
    /* Schemas                                            */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Schemas.
     */
    function _Schemas() {
        this._schemas = {};
    }

    _Schemas.prototype = {
        constructor: _Schemas,

        push: function(schema) {
            this._schemas[schema.name] = schema;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._schemas).length;
        },

        all: function() {
            var array = [];
            for (var key in this._schemas) {
                array.push(this._schemas[key]);
            }
            return array;
        },

        names: function () {
            return Object.keys(this._schemas);
        },

        get: function (name) {
            if (!name in this._schemas) {
                // TODO schema not found, throw error
            }

            return this._schemas[name];
        }
    };


    /******************************************************/
    /* Schema                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Catalog} catalog the catalog object.
     * @param {String} jsonSchema json of the schema.
     * @desc
     * Constructor for the Catalog.
     */
    function Schema(catalog, jsonSchema) {

        this.catalog = catalog;
        this.name = jsonSchema.schema_name;
        this.uri = catalog.uri + "/schema/" + _fixedEncodeURIComponent(this.name); // TODO needed?

        // build tables
        this.tables = new _Tables();
        for (var key in jsonSchema.tables) {
            var jsonTable = jsonSchema.tables[key];
            this.tables.push(new Table(this, jsonTable));
        }

        // build annotations
        this.annotations = new _Annotations();
        for (var uri in jsonSchema.annotations) {
            var jsonAnnotation = jsonSchema.annotations[uri];
            this.annotations.push(new Annotation("schema", uri, jsonAnnotation));
        }

    }

    Schema.prototype = {
        constructor: Schema,

        delete: function () {

        }

    };

    /******************************************************/
    /* Tables                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for the Tables.
     */
    function _Tables() {
        this._tables = {};
    }

    _Tables.prototype = {
        constructor: _Tables,

        push: function(table) {
            this._tables[table.name] = table;
        },

        all: function() {
            var array = [];
            for (var key in this._tables) {
                array.push(this._tables[key]);
            }
            return array;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._tables).length;
        },

        names: function () {
            return Object.keys(this._tables);
        },

        get: function (name) {
            if (!name in this._tables) {
                // TODO table not found, throw error
            }

            return this._tables[name];
        }

    };

    /******************************************************/
    /* Table                                              */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Schema} schema the schema object.
     * @param {String} jsonTable the json of the table.
     * @desc
     * Constructor for Table.
     */
    function Table(schema, jsonTable) {

        this.schema = schema;
        this.name = jsonTable.table_name;
        this.jsonTable = jsonTable;
        //this.uri = schema.catalog.uri + "/entity/" + _fixedEncodeURIComponent(schema.name) + ":" + _fixedEncodeURIComponent(jsonTable.table_name);

        this.entity = new _Entity(this);

        this.columns = new _Columns();
        for (var i = 0; i < jsonTable.column_definitions.length; i++) {
            var jsonColumn = jsonTable.column_definitions[i];
            this.columns.push(new Column(this, i, jsonColumn));
        }

        this.keys = new _Keys();
        for (var i = 0; i < jsonTable.keys.length; i++) {
            var jsonKey = jsonTable.keys[i];
            this.keys.push(new Key(this, jsonKey));
        }

        this.foreignKeys = new _ForeignKeys();

        this.annotations = new _Annotations();
        for (var uri in jsonTable.annotations) {
            var jsonAnnotation = jsonTable.annotations[uri];
            this.annotations.push(new Annotation("table", uri, jsonAnnotation));
        }
    }

    Table.prototype = {
        constructor: Table,

        delete: function () {

        },

        buildForeignKeys: function() {
            // this should be built on the second pass after introspection
            // so we already have all the keys and columns for all tables
            this.foreignKeys = new _ForeignKeys();
            for (var i = 0; i < this.jsonTable.foreign_keys.length; i++) {
                var jsonFKs = this.jsonTable.foreign_keys[i];
                this.foreignKeys.push(new ForeignKeyRef(this, jsonFKs));
            }
        }

    };


    /******************************************************/
    /* Entity                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Entity.
     */
    function _Entity(table) {
        this._table = table;
    }

    _Entity.prototype = {
        constructor: _Entity,

        // filter: Negation|Conjunction|Disjunction|UnaryPredicate|BinaryPredicate or null
        // limit: limit number of rows or null
        // columns: array of Column, limit returned rows with selected columns only.
        get: function(filter, limit, columns) {

            var interf = (columns === undefined) ? "entity" : "attribute";

            var uri = this._table.schema.catalog.uri + "/" + interf + "/" +
                    _fixedEncodeURIComponent(this._table.schema.name) + ":" +
                    _fixedEncodeURIComponent(this._table.name);

            if (filter !== undefined && filter !== null) {
                uri = uri + _filterToUri(filter);
            }

            // selected columns only
            if (columns !== undefined) {
                for (var c = 0; c < columns.length; c++) {
                    var col = columns[c].name;
                    if (c === 0)
                        uri = uri + "/" + col;
                    else
                        uri = uri + "," + col;
                }
            }

            if (limit !== undefined && limit !== null) {
                uri = uri + "?limit=" + limit;
            }


            return _http.get(uri).then(function(response) {
                return response.data;
            }, function(response) {
                return _q.reject(response.data);
            });
        },

        delete: function (filter) {

        },

        put: function (rowset) {

        },

        post: function (rowsets, defaults) { // create new entities
            var uri = this._table.schema.catalog.uri + "/entity/" +
                _fixedEncodeURIComponent(this._table.schema.name) + ":" +
                _fixedEncodeURIComponent(this._table.name);

            if (typeof defaults !== 'undefined') {
                for (var i = 0; i < defaults.length; i++) {
                    if (i === 0) {
                        uri = uri + "?defaults=" + _fixedEncodeURIComponent(defaults[i]);
                    } else {
                        uri = uri + "," + _fixedEncodeURIComponent(defaults[i]);
                    }
                }
            }

            return _http.post(uri, rowsets).then(function(response) {
               return response.data;
            }, function(response) {
                return _q.reject(response);
            });
        }

    };


    /******************************************************/
    /* Columns                                            */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Columns.
     */
    function _Columns() {
        this._columns = {};
    }

    _Columns.prototype = {
        constructor: _Columns,

        push: function(column) {
            this._columns[column.name] = column;
        },

        all: function() {
            var array = [];
            for (var key in this._columns) {
                array.push(this._columns[key]);
            }
            return array;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._columns).length;
        },

        names: function () {
            return Object.keys(this._columns);
        },

        get: function (name) {
            if (!name in this._columns) {
                // TODO not found, throw error
            }
            return this._columns[name];
        },

        getByPosition: function (pos) {

        }
    };

    /******************************************************/
    /* Column                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table the table object.
     * @param {int} index column position in the table.
     * @param {String} jsonColumn the json column.
     * @desc
     * Constructor for Column.
     */
    function Column(table, index, jsonColumn) {

        this.table = table;
        this.name = jsonColumn.name;
        this.index = index;
        this.type = new Type(jsonColumn.type.typename);
        this.annotations = new _Annotations();
        for (var uri in jsonColumn.annotations) {
            var jsonAnnotation = jsonColumn.annotations[uri];
            this.annotations.push(new Annotation("column", uri, jsonAnnotation));
        }
    }

    Column.prototype = {
        constructor: Column,

        delete: function () {

        },

        equals: function(column) {
            return (column.table.schema.name === this.table.schema.name &&
                column.table.name === this.table.name &&
                column.name === this.name);
        }

    };

    /******************************************************/
    /* Annotations                                        */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Annotations.
     */
    function _Annotations() {
        this._annotations = {};
    }

    _Annotations.prototype = {
        constructor: _Annotations,

        push: function(annotation) {
            this._annotations[annotation.uri] = annotation;
        },

        all: function() {
            var array = [];
            for (var key in this._annotations) {
                array.push(this._annotations[key]);
            }
            return array;
        },

        create: function () {

        },

        length: function () {
            return Object.keys(this._annotations).length;
        },

        names: function () {
            return Object.keys(this._annotations);
        },

        get: function (uri) {
            if (!uri in this._annotations) {
                // TODO table not found, throw error
            }

            return this._annotations[uri];
        }
    };

    /******************************************************/
    /* Annotation                                         */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {String} subject subject of the annotation: schema|table|column|key|foreignkeyref.
     * @param {String} uri uri id of the annotation.
     * @param {String} jsonAnnotation json of annotation.
     * @desc
     * Constructor for Annotation.
     */
    function Annotation(subject, uri, jsonAnnotation) {

        this.subject = subject;
        this.uri = uri;
        this.content = jsonAnnotation;
    }

    Annotation.prototype = {
        constructor: Annotation,

        delete: function () {

        }
    };

    /******************************************************/
    /* Key                                                */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @desc
     * Constructor for Keys.
     */
    function _Keys() {
        this._keys = [];
    }

    _Keys.prototype = {
        constructor: _Keys,

        push: function(key) {
            this._keys.push(key);
        },

        all: function() {
            return this._keys;
        },

        create: function () {

        },

        length: function () {
            return this._keys.length;
        },

        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._keys.length; i++) {
                sets.push(this._keys[i].colset);
            }
            return sets;
        },

        get: function (colset) {
            // find Key with the same colset
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (colset.equals(key.colset)) {
                    return key;
                }
            }
            return null;
        }
    };

    /******************************************************/
    /* Key                                                */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Table} table the table object.
     * @param {String} jsonKey json key.
     * @desc
     * Constructor for Key.
     */
    function Key(table, jsonKey) {

        this.table = table;

        var uniqueColumns = [];
        for (var i = 0; i < jsonKey.unique_columns.length; i++) {
            // find corresponding column objects
            uniqueColumns.push(table.columns.get(jsonKey.unique_columns[i]));
        }
        this.colset = new ColSet(uniqueColumns);

        this.annotations = new _Annotations();
        for (var uri in jsonKey.annotations) {
            var jsonAnnotation = jsonKey.annotations[uri];
            this.annotations.push(new Annotation("key", uri, jsonAnnotation));
        }
    }


    /******************************************************/
    /* ColSet                                             */
    /******************************************************/

    /**
     * @memberof ERMrest
     * @constructor
     * @param {Array} columns an array of Column objects.
     * @desc
     * Constructor for ColSet, a set of Column objects.
     */
    function ColSet(columns) {

        this.columns = columns;
    }

    ColSet.prototype = {
        constructor: ColSet,

        length: function () {
            return this.columns.length;
        },

        equals: function (colset) {
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
                        if (colA.equals(colB)){
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

    /******************************************************/
    /* Mapping                                            */
    /* mathematical functional map,                       */
    /* i.e. a mathematical set of (from -> to)            */
    /* column pairings                                    */
    /******************************************************/

    function Mapping(from, to) { // both array of 'Column' objects
        this._from = from;
        this._to = to;
    }

    Mapping.prototype = {
        constructor: Mapping,

        length: function () {
            return this._from.length;
        },

        domain: function () {
            return from;
        },

        get: function (fromCol) {
            for (var i = 0; i < this._from.length; i++) {
                if (fromCol.equals(this._from[i])) {
                    return this._to[i];
                }
            }
            return null; // no mapping found
        }
    };


    function _ForeignKeys() {
        this._foreignKeys = []; // array of ForeignKeyRef
        this._mappings = []; // array of Mapping
    }

    _ForeignKeys.prototype = {
        constructor: _ForeignKeys,

        push: function(foreignKeyRef) {
            this._foreignKeys.push(foreignKeyRef);
            this._mappings.push(foreignKeyRef.mapping);
        },

        // return an array of all foreign key references
        all: function() {
            return this._foreignKeys;
        },

        colsets: function () {
            var sets = [];
            for (var i = 0; i < this._foreignKeys.length; i++) {
                sets.push(this._foreignKeys[i].colset);
            }
            return sets;
        },

        create: function () {

        },

        length: function () {
            return this._foreignKeys.length;
        },

        mappings: function () {
            return this._mappings;
        },

        //get: function (mapping) { // TODO?
        //},

        get: function (colset) {
            // find ForeignKeyRef with the same colset
            for (var i = 0; i < this._foreignKeys.length; i++) {
                var fkr = this._foreignKeys[i];
                if (colset.equals(fkr.colset)) {
                    return fkr;
                }
            }
            return null;
        }
    };


    /******************************************************/
    /* ForeignKeyRef                                      */
    /******************************************************/

    function ForeignKeyRef(table, jsonFKR) {
        //.columns : colset of referencing columns (foreign_key_columns, self table)
        //.key : key being referenced (referenced_columns, another table)
        //.mapping
        //.delete()
        //.annotations.create( annotationParams ) -> annotation
        //.annotations.length() -> count
        //.annotations.names() -> sequence of uri
        //.annotation.get( uri ) -> annotation

        var catalog = table.schema.catalog;

        // create ColSet for foreign key columns
        var fkCols = jsonFKR.foreign_key_columns;
        var foreignKeyCols = [];
        for (var i = 0; i < fkCols.length; i++) {
            foreignKeyCols.push(table.columns.get(fkCols[i].column_name)); // "Column" object
        }
        this.colset = new ColSet(foreignKeyCols);

        // find corresponding Key from referenced columns
        // ** all the tables in the catalog must have been created at this point
        var refCols = jsonFKR.referenced_columns;
        var referencedCols = [];
        for (var j = 0; j < refCols.length; j++) {
            var col = catalog.schemas.get(refCols[j].schema_name).tables.get(refCols[j].table_name).columns.get(refCols[j].column_name);
            referencedCols.push(col);
        }
        // find key from referencedCols
        // use index 0 since all refCols should be of the same schema:table
        this.key = catalog.schemas.get(refCols[0].schema_name).tables.get(refCols[0].table_name).keys.get(new ColSet(referencedCols));

        // assign mapping
        this.mapping = new Mapping(foreignKeyCols, referencedCols);

        this.annotations = new _Annotations();
        for (var uri in jsonFKR.annotations) {
            var jsonAnnotation = jsonFKR.annotations[uri];
            this.annotations.push(new Annotation("foreignkeyref", uri, jsonAnnotation));
        }

    }

    ForeignKeyRef.prototype = {
        constructor: ForeignKeyRef,

        delete: function () {

        },

        // returns rowset of the referenced key's table
        getDomainValues: function (limit, columns) {
            if (limit === undefined)
                limit = null;
            return this.key.table.entity.get(null, limit, this.key.colset.columns); // async call, returns promise
        }

    };


    /******************************************************/
    /* Type                                               */
    /******************************************************/

    function Type(name) {
        //.name
        //.is_array : boolean
        //.base_type
        this.name = name;
    }

    Type.prototype = {
        constructor: Type,

        is_array: function () {

        }
    };


    return module;
})();
