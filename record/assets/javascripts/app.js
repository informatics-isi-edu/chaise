// Chaise Record App

var chaiseRecordApp = angular.module("chaiseRecordApp", ['ngResource', 'ngRoute', 'ui.bootstrap','ui.grid', 'ui.grid.resizeColumns', 'ui.grid.pinning', 'ui.grid.selection', 'ui.grid.moveColumns', 'ui.grid.exporter', 'ui.grid.grouping', 'ui.grid.infiniteScroll', 'ngCookies', 'ngSanitize', 'chaise.utils']);

// Refreshes page when fragment identifier changes
setTimeout(function(){

    window.onhashchange = function() {

        if (window.location.hash != '#undefined') {
            location.reload();
        } else {
            history.pushState("", document.title, window.location.pathname);
            location.reload();
        }

        function goBack() {
            window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
            window.location.lasthash.pop();
        }
    }

}, 0);

/*
 ____                  _
/ ___|  ___ _ ____   _(_) ___ ___  ___
\___ \ / _ \ '__\ \ / / |/ __/ _ \/ __|
 ___) |  __/ |   \ V /| | (_|  __/\__ \
|____/ \___|_|    \_/ |_|\___\___||___/

*/

chaiseRecordApp.service('configService', function() {
    this.CR_BASE_URL = window.location.origin + '/ermrest/catalog/';
    if (chaiseConfig['ermrestLocation'] != null) {
        this.CR_BASE_URL = chaiseConfig['ermrestLocation'] + '/ermrest/catalog/';
    }
    this.TABLE_THRESHOLD = 0;
    if (chaiseConfig['tableThreshold'] != null) {
        this.TABLE_THRESHOLD = chaiseConfig['tableThreshold'];
    }
    
    // dynamic load the custom CSS file defined in chaise-config.js
    if (chaiseConfig['customCSS'] !== undefined) {
    	var fileref = document.createElement("link");
    	fileref.setAttribute("rel", "stylesheet");
    	fileref.setAttribute("type", "text/css");
    	fileref.setAttribute("href", chaiseConfig['customCSS']);
    	document.getElementsByTagName("head")[0].appendChild(fileref);
    }
    	

    // set the navbar-header text
    if (chaiseConfig['navbarBrandText'] !== undefined) {
        document.getElementById('navbarBrandText').innerHTML = chaiseConfig['navbarBrandText'];
    } else {
        document.getElementById('navbarBrandText').innerHTML= 'Chaise';
    }
    // set the navbar-header image
    if (chaiseConfig['navbarBrandImage'] !== undefined) {
        document.getElementById('navbarBrandImage').setAttribute('src',chaiseConfig['navbarBrandImage']);
    }
    // set the navbar-header link
    if (chaiseConfig['navbarBrand'] !== undefined) {
        $($('.navbar-brand', $('#header'))[0]).attr('href', chaiseConfig['navbarBrand']);
    }

	
	if (chaiseConfig['headTitle'] !== undefined) {
		var title = document.createElement("title");
		title.innerHTML = chaiseConfig['headTitle'];
		document.getElementsByTagName("head")[0].appendChild(title);
	}
});

// REST API for Ermrest
chaiseRecordApp.service('ermrestService', ['$http', '$rootScope', '$sce', 'schemaService', 'spinnerService', 'notFoundService', 'configService', 'UriUtils', function($http, $rootScope, $sce, schemaService, spinnerService, notFoundService, configService, UriUtils){

    // Get the entity in JSON format
    // Note: By this point,the schema should be loaded already
    this.getEntity = function(schemaName, tableName, keys, onSuccess){

        // Start spinner
        spinnerService.show('Loading...');

        // Reference to service
        var self = this;

        // Make sure the schema is loaded
        if (!schemaService.schemas){
            return;
        }

        // Only continue if tableName is valid
        if (!schemaService.isValidTable(schemaName, tableName)){
            notFoundService.show("We're sorry, the tablename '" + tableName + "' does not exist. Please try again!");
            return;
        }

        var schema = schemaService.schemas[schemaName];

        // Build the entity path.
        var path            = configService.CR_BASE_URL + schema.cid + '/entity/' + UriUtils.fixedEncodeURIComponent(schema.schema_name) + ':' + UriUtils.fixedEncodeURIComponent(tableName) + '/' + self.buildPredicate(keys);
        var aggregatePath   = configService.CR_BASE_URL + schema.cid + '/aggregate/' + UriUtils.fixedEncodeURIComponent(schema.schema_name) + ':' + UriUtils.fixedEncodeURIComponent(tableName) + '/' + self.buildPredicate(keys);

        // Execute API Request to get main entity
        $http.get(path).success(function(data, status, headers, config) {

            // If entity was NOT found, it's because no entity match the keys that were provided
            if (data.length == 0){
                notFoundService.show("We're sorry, an entity with keys '" + JSON.stringify(keys) + "' does not exist. Please try again!");
                return;
            }

            // Extract the first entity
            var entity          = data[0];

            entity.sequences = []; // array of sequence columns
            entity.colTooltips = {}; // column tool tips

            // apply sequence formatting & get column tooltips
            var columnDefinitions = schema.tables[tableName].column_definitions;
            for (var i = 0; i < columnDefinitions.length; i++) {
                var cdAnnotation = columnDefinitions[i].annotations;
                if (cdAnnotation['tag:isrd.isi.edu,2016:sequence'] !== undefined && entity[columnDefinitions[i].name] !== null) {
                    entity.sequences.push(columnDefinitions[i].name);
                    var len = cdAnnotation['tag:isrd.isi.edu,2016:sequence']['subseq-length'];
                    var spacer = cdAnnotation['tag:isrd.isi.edu,2016:sequence']['separator'];

                    // format column value
                    var text = entity[columnDefinitions[i].name];
                    var chunks = text.match(new RegExp(".{1," + len + "}", "g"));
                    text = "";
                    for (var j = 0; j < chunks.length; j++) {
                        if (text === "") {
                            text = chunks[j];
                        }
                        else {
                            text = text + spacer + chunks[j];
                        }
                    }
                    entity[columnDefinitions[i].name] = text;
                }

                // tooltips
                if (columnDefinitions[i].comment != null) {
                    entity.colTooltips[columnDefinitions[i].name] = columnDefinitions[i].comment;
                }
            }

            self.patternInterpretationForTable(schemaName, tableName, data);

            entity.foreignTables    = [];
            entity.embedTables      = {};
            entity.associations     = [];
            // Data use by helper methods
            entity.internal         = { schemaName: schemaName, tableName: tableName, path: path, aggregatePath: aggregatePath, displayTitle: '', displayTableName: tableName};

            // SET ENTITY DISPLAY TITLE
            entity.internal.displayTitle = self.getEntityTitle(entity);

            // get table display name
            var annotations = schemaService.schemas[schemaName].tables[tableName].annotations;
            if (annotations['tag:misd.isi.edu,2015:display'] !== undefined &&
                annotations['tag:misd.isi.edu,2015:display'].name !== undefined) {
                entity.internal.displayTableName = annotations['tag:misd.isi.edu,2015:display'].name;
            }

            // GET ENTITY REFERENCES TABLE
            var foreignTables   = self.getForeignTablesForEntity(entity);
            var tablesLoaded    = 0;

            // For each of the table references, we'll execute an API request
            for (var i = 0; i < foreignTables.length; i++){
                var ft = foreignTables[i];

                // If initialLoad is true, then we load the entities, else we load the aggregate (count)
                var ermrestPath = (ft.initialLoad) ? ft.path : ft.aggregatePath;

                // Need to preserve ft variable in a closure
                (function(ft){

                    // TODO: Lazy load nested entities
                    // Execute API request to get related entities information
                    $http.get(ermrestPath).success(function(data, status, headers, config) {
                        var elements              = data;

                        // If the elements doesn't return an empty array, continue
                        if (elements.length > 0){

                            // Base on the annotation, treat the reference differently
                            // Get the elements annotations from the schema
                            var annotations =  schemaService.schemas[ft.displaySchemaName].tables[ft.displayTableName].annotations;
                            var urlAnnotations = schemaService.schemas[ft.displaySchemaName].tables[ft.displayTableName].annotations['tag:misd.isi.edu,2015:url'];

                            // process url annotation :
                            // embed iFrame and related download files
                            if (urlAnnotations !== undefined && urlAnnotations !== null && urlAnnotations !== {}) {

                                var cdef = schemaService.schemas[ft.displaySchemaName].tables[ft.displayTableName].column_definitions;

                                var annotations = null;
                                if (Array.isArray(urlAnnotations)){
                                    annotations = urlAnnotations;
                                } else {
                                    annotations = [urlAnnotations];
                                }

                                // for each item under url annotation ["download" | "embed" | "link" | "thumbnail"]
                                for (var i = 0; i < annotations.length; i++) {
                                    var anno = annotations[i];

                                    if (anno !== undefined && anno.presentation === 'embed') {

                                        var rows = [];

                                        for (var e = 0; e < elements.length; e++) {
                                            var element = elements[e];

                                            var urlPattern = anno.url;
                                            for (var c = 0; c < cdef.length; c++) {
                                                var cname = cdef[c].name;
                                                var search = "{" + cname + "}";
                                                urlPattern = urlPattern.replace(new RegExp(search, 'g'), element[cname]);
                                            }

                                            var caption = "";
                                            if (anno.caption !== undefined) {
                                                caption = anno.caption;
                                                for (c = 0; c < cdef.length; c++) {
                                                    cname = cdef[c].name;
                                                    search = "{" + cname + "}";
                                                    caption = caption.replace(new RegExp(search, 'g'), element[cname]);
                                                }
                                            }

                                            var width = "100%";
                                            if (anno.width !== undefined) {
                                                if (typeof anno.width === "string") { // column name
                                                    width = element[anno.width]; // value in a column
                                                } else if (typeof anno.width === "number") {
                                                    width = anno.width;
                                                }
                                            }

                                            var height = "400";
                                            if (anno.height !== undefined) {
                                                if (typeof anno.height === "string") { // column name
                                                    height = element[anno.height]; // value in a column
                                                } else if (typeof anno.height === "number") {
                                                    height = anno.height;
                                                }
                                            }

                                            rows.push({uri: $sce.trustAsResourceUrl(urlPattern), caption: caption, width: width, height: height});
                                        }

                                        entity.embedTables[ft.title] = rows;

                                    } else if (anno !== undefined && anno.presentation === 'download') {

                                        // TODO we are handling downloads for iFrame items only right now
                                        // TODO therefore download should come after 'embed'
                                        // downloadable files for each embed element
                                        var downloadPatterns = (anno.url.constructor === Array ? anno.url : [anno.url]);
                                        var captionPatterns = (anno.caption.constructor === Array ? anno.caption : [anno.caption]);

                                        // for each table row
                                        for (e = 0; e < elements.length; e++) {
                                            element = elements[e];

                                            // for each download pattern
                                            var files = [];
                                            for (var p = 0; p < downloadPatterns.length; p++) {

                                                var downloadPattern = downloadPatterns[p];
                                                var captionPattern = captionPatterns[p];

                                                for (var c = 0; c < cdef.length; c++) {
                                                    var cname = cdef[c].name;
                                                    var search = "{" + cname + "}";
                                                    downloadPattern = downloadPattern.replace(new RegExp(search, 'g'), element[cname]);
                                                    captionPattern = captionPattern.replace(new RegExp(search, 'g'), element[cname]);
                                                }

                                                files.push({"url": $sce.trustAsResourceUrl(downloadPattern), "caption": captionPattern});
                                            }

                                            // each row (iFrame)'s files
                                            entity.embedTables[ft.title][e].files = files;

                                        }
                                    }
                                }
                            // If annotations is 'download', store it in the entity's 'files' atributes
                            } else if (annotations.comment !== undefined && annotations.comment.indexOf('download') > -1){
                                entity['files']         = elements;

                            // If annotations is 'previews', store it in the entity's 'previews' atributes
                            } else if (annotations.comment !== undefined && annotations.comment.indexOf('preview') > -1){
                                entity['previews']      = elements;

                            // If annotations is 'images', store it in the entity's 'images' atributes
                            } else if (annotations.comment !== undefined && annotations.comment.indexOf('image') > -1){
                                entity['images']        = elements;
                            // If the annotation is an 'association', then collapse the array of objects into an array of values
                            // Association scenario #1: If table connects to a vocabulary table
                            } else if (ft.vocabularyTable != undefined){
                                // elements (i.e [{'term':'P0'}], [{'term':'microCT images'}], etc)
                                var terms = [];
                                // conveft  [{ 'term':'P0', 'term':'P323', 'term':'weg33k'}] -> [{ vocab: 'P0', link: ''} , { vocab: 'P323', link: ''}, { vocab: 'weg33k', link: '' }]
                                for (var j = 0; j < elements.length; j++){
                                    var reference   = elements[j];
                                    var term        = {};
                                    term.vocab      = elements[j].term,
                                    term.link       = self.getEntityLink(ft.schemaName, ft['referencedTableName'], { 'term': term.vocab }),
                                    terms.push(term);
                                }

                                var formattedAssoication    = {
                                                                'tableName':            ft['tableName'],
                                                                'terms':                terms,
                                                                'referencedTableName':  ft['referencedTableName']
                                                            };

                                entity.associations.push(formattedAssoication);

                            // Else, append the 'formattedForeignTable' to the entity's elements
                            } else{

                                // SWAP FORGEIN KEY ID WITH VOCABULARY
                                var formattedForeignTable     = {
                                                                'title':                ft['title'],
                                                                'displaySchemaName':    ft['displaySchemaName'],
                                                                'displayTableName':     ft['displayTableName'], // the title of nested tables
                                                                'tableName':            ft['tableName'], // the table the nested entities belong to
                                                                'schemaName':           ft['schemaName'],
                                                                'list':                 [], // list of nested entities
                                                                'referencedTableName':  ft['referencedTableName'],
                                                                'transpose':            elements[0]['row_count'] <= configService.TABLE_THRESHOLD,
                                                                'open':                 false,
                                                                'path':                 ft['path'], // ermrest path to load elements
                                                                'count':                elements[0]['row_count']
                                                            };

                                entity.foreignTables.push(formattedForeignTable);
                            }
                        }

                        tablesLoaded++;

                        entity.foreignTables.sort(function(ft1, ft2) { // sort by title, must use same order in index.html
                            return ft1.title.localeCompare(ft2.title);
                        });

                        // Once all the request have been made, invoke the onSuccess callback
                        if (tablesLoaded == foreignTables.length){
                            onSuccess(entity);

                            // Hide spinner
                            spinnerService.hide();
                        }

                    }).
                    error(function(data, status, headers, config) {
                        console.log("Error querying collections", data);
                        notFoundService.show("We're sorry, we ran into an internal server error when querying for entity renferences");
                        spinnerService.hide();
                    });

                }(ft));
            }

            // If there are no tables to load, call success callback
            if (foreignTables.length == 0){
                onSuccess(entity);

                // Hide spinner
                spinnerService.hide();
            }

        }).error(function(data, status, headers, config) {
            console.log("Error querying collections", data);
            notFoundService.show("We're sorry, we could not find a match with the keys you provided");
            spinnerService.hide();
        });

    };


    // Load nested entities for a given entity
    this.loadReferencesForEntity = function(entity, index){

        // Only load foreignTables if it hasn't been loaded yet
        if (entity.foreignTables[index].loaded){
            return;
        }

        // Start spinner
        spinnerService.show('Loading...');

        var ft = entity.foreignTables[index];
        entity.foreignTables[index].loaded = true;

        var self = this;

        // Execute API request to get related entities information
        $http.get(ft.path).success(function(data, status, headers, config) {
            // If refernce table is a binary table that refernces a more
            // If reference table is a binary table that references a more complex table, bump the complex table up
            // If reference table is a complex table, swap vocab
            var references = data;
            self.processForeignKeyRefencesForTable(ft.tableName, ft.schemaName, ft, references);
            if (references.length > 0)
                self.patternInterpretationForTable(ft.schemaName, ft.tableName, references); // this will overwrite reference _link with annotation _link

            // get display columns
            // this is a list of key values of column names and display column names
            // where hidden columns are omitted
            var displayColumns = schemaService.getDisplayColumns(ft.schemaName, ft.tableName);

            if (references.length > 0) {

                // get actual columns
                var actualColumns = Object.keys(references[0]);

                // remove hidden columns and update column display name
                for (var i = 0; i < actualColumns.length; i++) {
                    var col = actualColumns[i];

                    if (col.endsWith('_link')) {
                        var subCol = col.substring(0, col.length - 5); // col name without _link

                        // if hidden, delete
                        if (!displayColumns.hasOwnProperty(subCol)) {
                            for (var j = 0; j < references.length; j++) {
                                delete references[j][col];
                            }
                        }
                        // rename col_link if col display name is different
                        else if (displayColumns[subCol] !== subCol) {
                            // if display name is different from column name
                            // update display name
                            for (var j = 0; j < references.length; j++) {
                                references[j][displayColumns[subCol] + '_link'] = references[j][col];
                                delete references[j][col];
                            }
                        }
                    } else if (!displayColumns.hasOwnProperty(col)) {
                        // if hidden column, delete
                        for (var j = 0; j < references.length; j++) {
                            delete references[j][col];
                        }
                    } else if (displayColumns[col] !== col) {
                        // if display name is different from column name
                        // update display name
                        for (var j = 0; j < references.length; j++) {
                            references[j][displayColumns[col]] = references[j][col];
                            delete references[j][col];
                        }
                    }
                }
            }

            entity.foreignTables[index].list        = references;

            if (references.length > 0){
                entity.foreignTables[index].keys =  Object.keys(references[0]);
            }

            // Hide spinner
            spinnerService.hide();
        }).error (function(data, status, headers, config) {
            // Hide spinner
            spinnerService.hide();
        });

    };

    // If the reference table has a column that links to a vocabulary table, swape
    this.processForeignKeyRefencesForTable = function(parentTableName, ftSchema, foreignTable, references){

        // TODO: Delete parent table name
        var foreignKeys = schemaService.schemas[ftSchema].tables[foreignTable.tableName].foreign_keys;
        var self        = this;

        // For each foreign key
        for (var i = 0; i < foreignKeys.length; i++){
            var fk                  = foreignKeys[i];
            var foreignKeyColumn    = fk.foreign_key_columns[0].column_name; // i.e. cleavagesite (column)
            var referenceTable      = fk.referenced_columns[0].table_name; // i.e cleavagesite (table)
            var referenceSchema     = fk.referenced_columns[0].schema_name;
            var referenceColumn     = fk.referenced_columns[0].column_name; // i.e. id (column)

            // If the table we're referencing is a vocabulary table, then query all vocab terms
            if (schemaService.isVocabularyTable(referenceSchema, referenceTable)){

                // i.e.https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/legacy:target/id=110/construct/cleavagesite
                var path = foreignTable.path + '/' + referenceTable;

                // Need to preserve foreignKeyColumn, referenceTable variable in a closure
                (function(foreignKeyColumn, referenceTable){

                    // Execute GET request to fetch all terms
                    $http.get(path).success(function(data, status, headers, config) {
                        var vocabs      = data;

                        // Don't continue if vocabs is empty
                        if (vocabs.length == 0){
                            return;
                        }

                        var vocabDict   = {};

                        // Convert [ {"id":21,"name":"HA-10His-PP "}, {"id":22,"name":"HAFlag"} ] => { 21: { "vocab" :"HA-10His-PP", "link": "" }, 22: { "vocab": "HAFlag",  "link": "" }  }
                        for (var j = 0; j < vocabs.length; j++){
                            var vocab = vocabs[j];
                            var keys  =  self.getEntityKeys(vocab, referenceTable);

                            // ASSUMPTION: VOCABULARY PRIMARY KEY IS 'ID' and TERM COLUMN IS 'NAME'
                            vocabDict[vocab['id']]   = {
                                                            'vocab':    vocab['name'],
                                                            'link':     self.getEntityLink(referenceSchema, referenceTable, keys)
                                                        };
                        }

                        // Iterate through each reference, swapping id with vocabulary term
                        // This is the value we want to replace i.e. id 12 -> name "Precision"
                        for (var k = 0; k < references.length; k++){
                            var reference       = references[k];
                            var rValue          = reference[foreignKeyColumn];

                            // Skip if reference[foreignKeyColumn] is undefined
                            if (foreignKeyColumn === undefined || vocabDict[rValue] === undefined){
                                continue;
                            }
                            references[k][foreignKeyColumn]             = vocabDict[rValue]['vocab']; // i.e. vocabDict[21]['vocab']
                            references[k][foreignKeyColumn + '_link']   = vocabDict[rValue]['link']; // i.e. vocabDict[21]['link']

                        }

                    });

                }(foreignKeyColumn, referenceTable));

            // Else table is a reference to a complex table, set links
            } else{

                // For each reference
                for (var j = 0; j < references.length; j++){
                    var reference           = references[j];
                    var keys                = {};
                    keys[referenceColumn]  = reference[foreignKeyColumn];

                    // Do not create links for null values
                    if (keys[referenceColumn] == null){
                        continue;
                    }
                    references[j][foreignKeyColumn + '_link'] = self.getEntityLink(referenceSchema, referenceTable, keys);
                }
            }

        }

        var primaryKeys = schemaService.schemas[foreignTable.schemaName].tables[foreignTable.tableName].keys;

        // For each primary key
        for (var i = 0; i < primaryKeys.length; i++){
            var pk = primaryKeys[i].unique_columns[0]; // i.e. id

            // For each reference, create a link for the primary key
            for (var j = 0; j < references.length; j++){
                var reference               = references[j];
                var keys                    = {};
                keys[pk]                    = reference[pk];
                references[j][pk + '_link'] = self.getEntityLink(foreignTable.schemaName, foreignTable.tableName, keys);
            }
        }

    };

    // if table has columns with url pattern, add to data as col_link
    this.patternInterpretationForTable = function(schemaName, tableName, references) {
        var urlInterp = schemaService.getColumnInterpretations(schemaName, tableName);
        var columns = Object.keys(references[0]);

        var originals = []; // keep original col values if has caption (so original value is used in other column caption)
        for (var col in urlInterp) {
            var uriPattern = urlInterp[col].uriPattern;
            var caption = urlInterp[col].captionPattern;

            if (uriPattern === "auto_link") { // link url is same as column value
                for (var row = 0; row < references.length; row++) {
                    references[row][col + '_link'] = references[row][col];
                }
            } else {

                for (row = 0; row < references.length; row++) {

                    // replace each col used in the pattern
                    var link = uriPattern;
                    for (c = 0; c < columns.length; c++) {
                        col2 = columns[c];
                        // replace {col} with col value
                        search = "{" + col2 + "}";
                        link = link.replace(new RegExp(search, 'g'), references[row][col2]);
                    }
                    references[row][col + '_link'] = link;
                }
            }


            if (caption !== null) {
                for (var row = 0; row < references.length; row++) {
                    if (references[row][col] !== null) { // leave null values alone
                        // save original
                        originals[col] = [];
                        originals[col][row] = references[row][col]; // NOTE 'originals' structure is { col : [rows...] }

                        // replace each col used in the pattern
                        var cap = caption;
                        for (var c = 0; c < columns.length; c++) {
                            var col2 = columns[c];

                            // replace {col} with col value
                            var search = "{" + col2 + "}";
                            if (originals[col2] !== undefined && originals[col2][row] !== undefined) // col values modified
                                cap = cap.replace(new RegExp(search, 'g'), originals[col2][row]);
                            else
                                cap = cap.replace(new RegExp(search, 'g'), references[row][col2]);
                        }

                        references[row][col] = cap; // overwrite existing col value with caption
                    }
                }
            }
        }
    };

    // Get the entity display title
    this.getEntityTitle = function(entity){

        var entityTableSchema = schemaService.schemas[entity.internal.schemaName].tables[entity.internal.tableName];
        var validTitleColumns = ['name', 'label', 'title'];

        // NOTE: We're prioritizing title annotation over

        // Inspect each column in the table schema to find the one with the annotation 'title'
        for (var c in entityTableSchema.column_definitions){

            var cd          = entityTableSchema.column_definitions[c];
            var cn          = cd.name.toLowerCase();
            var annotations = cd.annotations ? cd.annotations.comment : undefined;

            // If the annotation is a 'title' return it
            if ((annotations != null && annotations.indexOf('title') > -1)){
                var title = entity[cd.name];

                // Remove the entity attribute, because
                delete entity[cd.name];

                return title;
            }
        }

        // No columns with the annotation 'title' was found, iterate through valid title columns and see if the entity has those columns
        for (var i = 0; i < validTitleColumns.length; i++){

            var title = entity[validTitleColumns[i]];

            if (title != undefined){

                delete entity[validTitleColumns[i]];

                return title;
            }

        }

        return null;
    };

    // Get the entity keys and associated values
    this.getEntityKeys = function(entity, tableName){

        var keys = schemaService.schemas[entity.internal.schemaName].tables[tableName].keys;
        var entityKeys = {};

        // For each key
        for (var i = 0; i < keys.length; i++){
            var k           = keys[i].unique_columns[0]; // i.e. term, id, username
            entityKeys[k]   = entity[k];
        }

        return entityKeys;
    };

    // Get the Chaise Detail lin for entity, keys are the key value pair to search for
    this.getEntityLink = function(schemaName, tableName, keys){
        return window.location.href.replace(window.location.hash, '') + '#' + schemaService.schemas[schemaName].cid + '/' +  UriUtils.fixedEncodeURIComponent(schemaName) + ':' + UriUtils.fixedEncodeURIComponent(tableName)+ '/' + this.buildPredicate(keys);
    };

    // Scan through schema to find related tables
    // Include tables with outbound foregin key (construct), to entity (target). If the foreign table (construct) is an 'asssociation' table, we will go another level deep and get all associations
    this.getForeignTablesForEntity = function(entity){

        // Goes through every table in the schema, looking for a forgein_key_column: table_name that matches entity table name
        var foreignTables = [];

        // EACH SCHEMA
        for (var schemaName in schemaService.schemas) {
        	var schema = schemaService.schemas[schemaName];

        	// EACH TABLE
        	for (var tableKey in schema.tables){
	            var tableSchema             = schema.tables[tableKey];
	            var referencedColumnMatch   = false; // if our table name is part of foreign key -> reference columns

	            // skip table if hidden
	            if (tableSchema.annotations['tag:misd.isi.edu,2015:hidden'] !== undefined) {
	                continue;
	            }

	            // EACH FOREIGN KEY SET
	            for (var i = 0; i < tableSchema.foreign_keys.length; i++){
	                var fk =  tableSchema.foreign_keys[i];

	                // GET TABLE FROM ONE OF THE REFERENCED COLUMNS
                    // all columns should be under same table
                    var rc = fk.referenced_columns[0];

                    // TODO: ENCODE TABLE NAMES
                    // If a reference column table name matches our table name, then it has an outbound forgein key to entity. i.e. construct -> target (entity)
                    if (rc.schema_name == entity.internal.schemaName &&
                         rc.table_name == entity.internal.tableName){
                        referencedColumnMatch = true;

                        // get table display name
                        var title = tableKey;
                        if (tableSchema.annotations['tag:misd.isi.edu,2015:display'] !== undefined &&
                            tableSchema.annotations['tag:misd.isi.edu,2015:display'].name !== undefined) {
                            title = tableSchema.annotations['tag:misd.isi.edu,2015:display'].name;
                        }
                        var foreignTable = {
                                                    'title':                title,
                                                    'displaySchemaName':    schemaName,
                                                    'displayTableName':     tableKey,
                                                    'tableName':            tableKey,
                                                    'schemaName':           schemaName,
                                                    'referencedTableName':  rc.table_name,
                                                    'initialLoad':          false, // should fetch entities on page load
                                                    'loaded':               false, // already loaded entities
                                                    'path':                 entity.internal.path + '/' + schemaName + ":" + tableKey,
                                                    'aggregatePath':        entity.internal.aggregatePath + '/' + schemaName + ":" + tableKey + '/row_count:=cnt(*)'
                                                };

                        // Get the references annotations from the schema
                        var annotations =  tableSchema.annotations.comment;

                        // If table is download, preview, or images, initially load them
                        if (annotations !== undefined && (annotations.indexOf('download') > -1 || annotations.indexOf('preview') > -1 || annotations.indexOf('image') > -1)){
                            foreignTable.initialLoad = true;
                        }

                        // if table is embed, initially load them
                        var urlAnnotations = tableSchema.annotations['tag:misd.isi.edu,2015:url'];

                        if (urlAnnotations !== undefined && urlAnnotations !== null && urlAnnotations !== {}) {
                            var annotations = [];
                            if (Array.isArray(urlAnnotations)) { // array
                                annotations = urlAnnotations;
                            } else { // object
                                annotations = [urlAnnotations];
                            }
                            for (var j = 0; j < urlAnnotations.length; j++) {
                                var annotation = annotations[j];
                                if (annotation.presentation !== undefined && annotation.presentation === 'embed') {
                                    foreignTable.initialLoad = true;
                                    break;
                                }
                            }
                        }

                        // If this is a binary table, switch the path to bring out the referenced table instead

                        //  If foreign table it's a binary table, continue
                        if (schemaService.isBinaryTable(schemaName, foreignTable.tableName)){
                            var parentTableName     = entity.internal.tableName;
                            // parentTableName = person,  foreignTable.tableName = project member, referenceTableName project
                            var referenceTable  = schemaService.getReferencedTable(parentTableName, schemaName, foreignTable.tableName);
                            var referenceTableName = referenceTable.table;
                            var referenceSchemaName = referenceTable.schema;

                            if (schemaService.isVocabularyTable(referenceSchemaName, referenceTableName)){
                                // CASE A: If foreign table references a vocabulary table, set vocabularyTable varialbe to true (dataset_mouse_mutation -> mouse_mutation)
                                foreignTable.vocabularyTable            = true;
                                foreignTable.initialLoad                = true; // vocabulary tables should be initially loaded
                                foreignTable.referencedTableName        = referenceTableName;
                                foreignTable.path                       += '/'+ referenceSchemaName + ":" + referenceTableName;
                            } else if (schemaService.isComplexTable(referenceSchemaName, referenceTableName)){
                                // CASE B: If foreign table references a complex table, switch the path to be the table it references (project member -> project)

                                // ERmrest/project_member/project
                                foreignTable.path   += '/'+ referenceSchemaName + ":" + referenceTableName;
                                foreignTable.schemaName = referenceSchemaName;
                                foreignTable.tableName = referenceTableName;
                            }

                        }

                        foreignTables.push(foreignTable);


                    } // found match
	            } // for each foreign key
	        } // for each table
        } // for each schema

        return foreignTables;

    };

    // Build ermrest predicate base on JSON params
    this.buildPredicate = function(params){

        // Build an array of predicates for the Ermrest Filter lanaguage
        var predicates = [];

        // TODO this doesn't work when value is an uri
        for (var key in params){
            var predicate   = UriUtils.fixedEncodeURIComponent(key) + '=';
            // Do not encoude already encoded string
            predicate       += params[key].toString().indexOf('%') > -1 ? params[key] : UriUtils.fixedEncodeURIComponent(params[key]);

            predicates.push(predicate);
        }
        // Join predicates with a conjunctive filter '&'
        return predicates.join('&');
    };



}]);

// Service use to introspect scheam
chaiseRecordApp.service('schemaService', ['$http',  '$rootScope', 'spinnerService', 'notFoundService', 'configService', function($http, $rootScope, spinnerService, notFoundService, configService){

    var schemas; // list of schemas

    this.initSchemas = function(cid, onSuccess) {

        // Build the schema path
        var path = configService.CR_BASE_URL + cid + '/schema';

        // Reference to service
        var self = this;

        // Execute API Request tog get schema
        $http.get(path).success(function(data, status, headers, config) {
            // Set schemas
            self.schemas    = data.schemas;
            for (var key in self.schemas) {
                self.schemas[key].cid = cid;
            }

            onSuccess(data);
        }).
        error(function(data, status, headers, config) {
            console.log("Error querying schemas", data);
            if (status == 401) {
                var url =  window.location.origin + '/ermrest/authn/preauth?referrer=' + encodeSafeURIComponent(window.location.href);
                ERMREST.GET(url, 'application/x-www-form-urlencoded; charset=UTF-8', successLogin, errorLogin, null);
            } else {
                notFoundService.show("We're sorry, the catalogue id " + cid + " does not exist. Please try again!");
            }
        });
    };

    // For a given nested entity, get the parent column name
    this.getParentColumnName = function(schemaName, parentTableName, tableName){
        // Inspect the table foreignKeys
        var foreignKeys = this.schemas[schemaName].tables[tableName].foreign_keys;

        // If a reference to parentTableName match, return the column name use to associate the parent table
        for (var i = 0; i < foreignKeys.length; i++){
            var fk                  = foreignKeys[i];
            var referencedColumns   = fk.referenced_columns;

            if (referencedColumns == undefined || referencedColumns.length == 0){
                continue;
            }

            for (var j = 0; j < referencedColumns.length; j++){
                var rc = referencedColumns[j];
                if (rc.table_name == parentTableName){
                    return rc.column_name;
                }
            }
        }

        return '';
    };

    // Get the referenced table name that is NOT referencing the parent table
    this.getReferencedTable = function(parentTableName, schemaName, tableName){
        // Inspect the table foreignKeys
        var foreignKeys = this.schemas[schemaName].tables[tableName].foreign_keys;

        // If a reference to parentTableName match, return the column name use to associate the parent table
        for (var i = 0; i < foreignKeys.length; i++){
            var fk                  = foreignKeys[i];
            var referencedColumns   = fk.referenced_columns;

            if (referencedColumns == undefined || referencedColumns.length == 0){
                continue;
            }

            for (var j = 0; j < referencedColumns.length; j++){
                var rc = referencedColumns[j];
                if (rc.table_name != parentTableName){
                    var res = {schema:rc.schema_name, table:rc.table_name};
                    return res;
                }
            }
        }

        return '';
    };

    // Valid if table name is part of schema
    this.isValidTable = function(schemaName, tableName){
        // Iterate through the tables defined in the schema to find a match with tableName
        var match = false;
        for (var t in this.schemas[schemaName].tables){
            // If there is a match
            if (t == tableName){
                match = true;
                break;
            }
        }

        return match;
    };

    // Return if a table is vocabulary table (< 3 columns)
    this.isVocabularyTable = function(schemaName, tableName){
        // First check if it's a valid table
        if (!this.isValidTable(schemaName, tableName)){
            return false;
        }

        // It's a vocabulary table if the table columns < 3
        var table = this.schemas[schemaName].tables[tableName];
        return table.column_definitions.length < 3;
    };

    // Return if a table is a binary table (2 columns)
    this.isBinaryTable = function(schemaName, tableName){
        // First check if it's a valid table
        if (!this.isValidTable(schemaName, tableName)){
            return false;
        }

        // It's a vocabulary table if the table columns < 3
        var table = this.schemas[schemaName].tables[tableName];
        return (table.column_definitions.length == 2 && table.foreign_keys.length == 2);
    };

    // Return if a table is a complex table (> 2 columns)
    this.isComplexTable = function(schemaName, tableName){
        // First check if it's a valid table
        if (!this.isValidTable(schemaName, tableName)){
            return false;
        }

        // It's a complex table if the table columns < 2
        var table = this.schemas[schemaName].tables[tableName];
        return table.column_definitions.length > 2;
    };

    // Returns if a column is hidden
    this.isHiddenColumn = function(schemaName, tableName, columnName){

        var columnDefinitions = this.schemas[schemaName].tables[tableName].column_definitions;

        // Look for the column defition
        for (var i = 0; i < columnDefinitions.length; i++){

            var cd = columnDefinitions[i];

            // Column definition found
            if (cd.name == columnName){

                // If hidden annotation is present, column is hidden
                if (cd.annotations['tag:misd.isi.edu,2015:hidden'] !== undefined){
                    return true;
                } else{
                    return false;
                }
            }
        }

    };

    // get display column name
    this.getColumnDisplayName = function(schemaName, tableName, columnName){
        var columnDefinitions = this.schemas[schemaName].tables[tableName].column_definitions;

        // Look for the column defition
        for (var i = 0; i < columnDefinitions.length; i++){

            var cd = columnDefinitions[i];

            // Column definition found
            if (cd.name == columnName){

                // If hidden annotation is present, column is hidden
                if (cd.annotations['tag:misd.isi.edu,2015:display'] !== undefined && cd.annotations['tag:misd.isi.edu,2015:display'].name !== undefined) {
                    return cd.annotations['tag:misd.isi.edu,2015:display'].name;
                } else{
                    return columnName;
                }
            }
        }
    };

    // returns a list of key values of column names and display column names
    // where hidden columns are omitted
    this.getDisplayColumns = function(schemaName, tableName) {

        var columns = [];

        var columnDefinitions = this.schemas[schemaName].tables[tableName].column_definitions;

        for (var i = 0; i < columnDefinitions.length; i++) {
            var cd = columnDefinitions[i];

            // If hidden annotation is present, next
            if (cd.annotations['tag:misd.isi.edu,2015:hidden'] === undefined){
                // if column has a display name
                if (cd.annotations['tag:misd.isi.edu,2015:display'] !== undefined && cd.annotations['tag:misd.isi.edu,2015:display'].name !== undefined) {
                    columns[cd.name] = cd.annotations['tag:misd.isi.edu,2015:display'].name;
                } else {
                    columns[cd.name] = cd.name;
                }
            }
        }

        return columns;
    };

    // returns a set of <col_name, {uri_pattern, caption_pattern}>
    this.getColumnInterpretations = function(schemaName, tableName) {
        var interp = {};

        var columnDefinitions = this.schemas[schemaName].tables[tableName].column_definitions;

        for (var i = 0; i < columnDefinitions.length; i++) {
            var cd = columnDefinitions[i];

            var pattern = null;
            var caption = null;

            // If column has interpretation
            if (cd.annotations['tag:misd.isi.edu,2015:url'] !== undefined){
                var urlAnnotations = cd.annotations['tag:misd.isi.edu,2015:url'];
                var anno = null;
                if (Array.isArray(urlAnnotations)) {

                    // the length of the array should be 1
                    // only pattern/caption is used for column right now
                    anno = urlAnnotations[0];

                } else { // object
                    anno = urlAnnotations;
                }

                if (anno === null || anno === {} || Object.getOwnPropertyNames(anno).length === 0) {
                    pattern = "auto_link"; // we shouldn't be using auto link anymore, always define pattern
                } else if (anno.url !== undefined) {
                    pattern = anno.url;
                }

                if (anno !== null && anno.caption !== undefined) {
                    caption = anno.caption;
                }

                interp[cd.name] = {uriPattern: pattern, captionPattern: caption};


            }
        }

        return interp;
    }
}]);


// Service for spinner
chaiseRecordApp.service('spinnerService', ['$rootScope', function($rootScope){

    // Show spinner with a message
    this.show = function(msg){
        $rootScope.spinnerVisible   = true;
        $rootScope.spinnerText      = msg;
    };

    // Hide spinner
    this.hide = function(){
        $rootScope.spinnerVisible   = false;
    };

}]);

// Service for not found
chaiseRecordApp.service('notFoundService', ['$rootScope', function($rootScope){

    // Show not found with rootScope
    this.show = function(msg){
        $rootScope.notFoundVisible  = true;
        $rootScope.notFoundText     = msg;
    };

    // Hide not found
    this.hide = function(){
        $rootScope.notFoundVisible = false;
    };

}]);

// Helper service for utilties methods
chaiseRecordApp.service('locationService', function(){


    // Return the has params in an JSON object
    this.getHashParams = function () {
        var hashParams = {};

        // "6/legacy:target/id=110"
        var path                    = window.location.hash.substring(1);
        var params                  = path.split('/');
        var namespace               = params[1].split(':');

        hashParams['catalogueId']   = decodeURIComponent(params[0]);
        hashParams['schemaName']    = decodeURIComponent(namespace[0]);
        hashParams['tableName']     = decodeURIComponent(namespace[1]);
        hashParams['keys']          = this.convertParamsToObject(params[2]);

        return hashParams;
    };

     //
    this.convertParamsToObject = function(params){
        var obj = {};
        var predicates = params.split('&');

        for (var i = 0; i < predicates.length; i++){
            var key = predicates[i].split('=');
            obj[decodeURIComponent(key[0])] = decodeURIComponent(key[1]);
        }

        // Join predicates with a conjunctive filter '&'
        return obj;

    };
});

/***
  ____            _             _ _
 / ___|___  _ __ | |_ _ __ ___ | | | ___ _ __ ___
| |   / _ \| '_ \| __| '__/ _ \| | |/ _ \ '__/ __|
| |__| (_) | | | | |_| | | (_) | | |  __/ |  \__ \
 \____\___/|_| |_|\__|_|  \___/|_|_|\___|_|  |___/

***/

// Header Controller
chaiseRecordApp.controller('HeaderCtrl', ['$rootScope', '$scope', function($rootScope, $scope){
    HOME = window.location.origin;
    $scope.active = "Home";
    getSession();

    // Determines wheather the page is active
    // $scope.isActive = function(page){
    //     return  $location.path() == page;
    // };

}]);

// Detail controller
chaiseRecordApp.controller('DetailCtrl', ['$rootScope', '$scope', '$sce', 'spinnerService', 'ermrestService', 'schemaService', 'locationService', 'notFoundService', function($rootScope, $scope, $sce, spinnerService, ermrestService, schemaService, locationService, notFoundService){
    // C: Catalogue id
    // T: Table name
    // K: Key

    $scope.chaiseConfig = chaiseConfig;

    // Set up the parameters base on url
    var params      = locationService.getHashParams();
    // var params      = $location.search();  query parameters
    var cid         = params['catalogueId'];
    var tableName   = params['tableName'];
    var schemaName  = params['schemaName'];
    var keys        = params['keys'];

    // cid
    var cidRegex = /^[0-9]+$/;
    var tableNameRegex = /^[\s0-9a-zA-z_-]+$/;

    $scope.reloadPage = function(url){
        setTimeout(function(){
            location.reload();
        }, 500);
    };

    // Validation
    if (cid == undefined){
        notFoundService.show("Please provide a catalogue id");

    } else if (!cidRegex.test(cid)){

        notFoundService.show("'" + cid + "' is an invalid catalogue id. Please try again!");

    } else if (tableName == undefined){

        notFoundService.show("Please provide a table name");

    } else if (!tableNameRegex.test(tableName)){

        notFoundService.show("'" + tableName + "' is an invalid table name. Please try again!");

    } else if (Object.keys(keys).length === 0){

        notFoundService.show("Please provide keys to search for an entity");

    // Data is valid!
    } else{

        schemaService.initSchemas(cid, function(data) {
            // Call the ermrestService to get entity through catalogue id, tableName, and col=val parameters
            ermrestService.getEntity(schemaName, tableName, keys, function(data){
                if (data['previews']) {
                    var origin = window.location.protocol + "//" + window.location.hostname; // TBD: portno?
                    for (var i = 0, len = data['previews'].length; i < len; i++) {
                        preview = data['previews'][i];
                        preview.embedUrl = origin + '/_viewer/xtk/view_on_load.html?url=' + preview.preview;
                        preview.enlargeUrl = origin + '/_viewer/xtk/view.html?url=' + preview.preview;
                        $sce.trustAsResourceUrl(preview.embedUrl);
                    }
                }
                $scope.entity = data;
            });
        });

    }

    $scope.permanentLink = function(){
        return window.location.href;
    };

    // When the accordion for foreign table is clicked
    $scope.foreignTableToggle = function(index){
        ermrestService.loadReferencesForEntity($scope.entity, index);
    };

    $scope.isExternalUrl = function(url) {
        return (url.indexOf(window.location.origin) === -1);
    }

}]);

chaiseRecordApp.controller('DetailTablesCtrl', ['$scope', '$http', '$q','$timeout', 'uiGridConstants','ermrestService', 'schemaService', function ($scope, $http, $q, $timeout, uiGridConstants, ermrestService, schemaService)
{
    $scope.view = [];
    $scope.data = [];
    $scope.columns = [];
    $scope.transposedData = [];
    $scope.transposedColumns = [];
    $scope.columnMetadata = {};
    $scope.firstPage = 1;
    $scope.lastPage = 1;

    // base gridOptions
    $scope.gridOptions = {};
    $scope.gridOptions.data = 'view';
    $scope.gridOptions.rowHeight = 65;
    $scope.gridOptions.enableColumnResizing = true;
    $scope.gridOptions.enableFiltering = true;
    $scope.gridOptions.enableGridMenu = true;
    $scope.gridOptions.showGridFooter = true;
    $scope.gridOptions.showColumnFooter = false;
    $scope.gridOptions.minRowsToShow = $scope.ft.count > 10 ? 10 : $scope.ft.count;
    $scope.gridOptions.enableGridMenu = true;
    $scope.gridOptions.enableSelectAll = true;
    $scope.gridOptions.flatEntityAccess = true;
    //$scope.gridOptions.infiniteScrollUp = true;
    //$scope.gridOptions.infiniteScrollDown = true;
    //$scope.gridOptions.infiniteScrollRowsFromEnd= 40;

    // csv export options
    $scope.gridOptions.exporterMenuCsv = (chaiseConfig['recordUiGridExportCsvEnabled'] == true);
    if ($scope.gridOptions.exporterMenuCsv) {
        $scope.gridOptions.exporterCsvFilename = $scope.ft.title + '.csv';
        $scope.gridOptions.exporterCsvLinkElement = angular.element(document.querySelectorAll(".custom-csv-link-location"));
    }
    // pdf export options
    $scope.gridOptions.exporterMenuPdf = (chaiseConfig['recordUiGridExportPdfEnabled'] == true);
    if ($scope.gridOptions.exporterMenuPdf) {
        $scope.gridOptions.exporterPdfDefaultStyle = {fontSize: 9};
        //$scope.gridOptions.exporterPdfTableStyle = {margin: [10, 10, 10, 10]};
        $scope.gridOptions.exporterPdfTableHeaderStyle = {fontSize: 10, bold: true, italics: true, color: 'red'};
        $scope.gridOptions.exporterPdfHeader = {text: $scope.ft.title, style: 'headerStyle'};
        $scope.gridOptions.exporterPdfFooter = function (currentPage, pageCount) {
            return {text: currentPage.toString() + ' of ' + pageCount.toString(), style: 'footerStyle'};
        };
        $scope.gridOptions.exporterPdfCustomFormatter = function (docDefinition) {
            docDefinition.styles.headerStyle = {fontSize: 22, bold: true};
            docDefinition.styles.footerStyle = {fontSize: 10, bold: true};
            return docDefinition;
        };
        $scope.gridOptions.exporterPdfOrientation = 'landscape';
        $scope.gridOptions.exporterPdfPageSize = 'A4';
    }

    $scope.gridOptions.onRegisterApi = function ( gridApi ) {
        $scope.gridApi = gridApi;
        $timeout(function() {
            $scope.gridApi.core.handleWindowResize();
        });
        //gridApi.infiniteScroll.on.needLoadMoreData($scope, $scope.getDataDown);
        //gridApi.infiniteScroll.on.needLoadMoreDataTop($scope, $scope.getDataUp);
    };

    $scope.initUIGrid = function()
    {
        var entity = $scope.ft;
        var displayName;
        var columnType;
        var columnDefinitions = schemaService.schemas[entity.schemaName].tables[entity.tableName].column_definitions;
        angular.forEach(columnDefinitions, function (column, i) {
            // Only include column if it is not hidden
            if (!schemaService.isHiddenColumn(entity.schemaName,entity.tableName,column.name)){
                displayName = schemaService.getColumnDisplayName(entity.schemaName,entity.tableName,column.name);
                columnType = $scope.mapColumnDisplayType(column.type.typename);
                $scope.columnMetadata[column.name] = {displayName:displayName};
                $scope.columns.push({name: column.name,
                                     displayName: displayName,
                                     type:columnType,
                                     headerTooltip:true,
                                     cellTooltip:true,
                                     groupingShowAggregationMenu: false, //(columnType == 'number'),
                                     width:120})
            }
        });
        $scope.gridOptions.columnDefs = $scope.columns;

        var canceler = $q.defer();
        $http.get(entity.path, {timeout: canceler.promise})
            .success(function (data) {
                $scope.data = data;
                $scope.view = $scope.data;
            });

        $scope.$on('$destroy', function(){
            canceler.resolve();  // Aborts the $http request if it isn't finished.
        });
    };

    $scope.transposeToggle = function(entity, transpose)
    {
        entity.transpose = transpose;
        if (transpose && $scope.transposedData.length == 0) {
            var values = [];
            var transposedRecords = {};
            $scope.transposedColumns.push({
                name: '0',
                displayName: 'Field Name',
                headerTooltip:true,
                cellTooltip:true,
                width: 150,
                type: 'string'
            });
            angular.forEach($scope.data, function (value, key) {
                $scope.transposedColumns.push({
                    name: (key + 1).toString(),
                    displayName: 'Record ' + (key + 1).toString(), // should be pkey but what about composites?
                    headerTooltip:true,
                    cellTooltip:true,
                    width: 150,
                    type: 'string'
                });

                var i = 0;
                angular.forEach(value, function (inner, index) {
                    if ($scope.columnMetadata[index] !== undefined) {
                        transposedRecords[i] = transposedRecords[i] || {0:$scope.columnMetadata[index].displayName};
                        values[index] = values[index] || [];
                        values[index].push(inner);
                        transposedRecords[i][key + 1] = values[index][key];
                        i++;
                    }
                });
            });
            $scope.transposedData = Object.keys(transposedRecords).map(function(k) { return transposedRecords[k] });
        }

        if (transpose) {
            $scope.gridOptions.enableFiltering = false;
            $scope.gridOptions.enableColumnMenus = false;
            $scope.gridOptions.columnDefs = $scope.transposedColumns;
            $scope.view  = $scope.transposedData;
        } else {
            $scope.gridOptions.enableFiltering = true;
            $scope.gridOptions.enableColumnMenus = true;
            $scope.gridOptions.columnDefs = $scope.columns;
            $scope.view = $scope.data;
        }
        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
    };

    $scope.mapColumnDisplayType = function(type)
    {
        /*
        from angular ui-grid docs:

        columnDefs.type : the type of the column, used in sorting. If not provided then the grid will guess the type.

        Add this only if the grid guessing is not to your satisfaction. One of:

        'string'
        'boolean'
        'number'
        'date'
        'object'
        'numberStr' Note that if you choose date, your dates should be in a javascript date type
         */

        // this mapping code is likely imperfect, but its a decent start
        var mappedType;
        if (type == 'boolean') {
            mappedType = 'boolean';
        } else if ((type.indexOf('time')!=-1) || (type.indexOf('date')!=-1)) {
            mappedType = 'date';
        } else if ((type.indexOf('int')!=-1) || (type.indexOf('serial')!=-1) || (type.indexOf('numeric')!=-1) ||
                   (type.indexOf('real')!=-1) || (type.indexOf('double')!=-1) || (type.indexOf('float')!=-1) ) {
            mappedType = 'number';
        } else {
            mappedType = 'string';
        }
        //console.log("Mapped an ermrest type [%s] to an angular ui-grid type [%s]", type, mappedType);
        return mappedType;
    };
/*
    $scope.getFirstData = function() {
        var promise = $q.defer();
        $http.get(entity.path)
            .success(function(data) {
                var newData = $scope.getPage(data, $scope.lastPage);
                $scope.data = $scope.data.concat(newData);
                promise.resolve();
        });
        return promise.promise;
    };

    $scope.getDataUp = function() {
        var promise = $q.defer();
        $http.get(entity.path)
        .success(function(data) {
          $scope.firstPage--;
          var newData = $scope.getPage(data, $scope.firstPage);
          $scope.gridApi.infiniteScroll.saveScrollPercentage();
          $scope.data = newData.concat($scope.data);
          $scope.gridApi.infiniteScroll.dataLoaded($scope.firstPage > 0, $scope.lastPage < 4).then(function() {$scope.checkDataLength('down');}).then(function() {
            promise.resolve();
          });
        })
        .error(function(error) {
            $scope.gridApi.infiniteScroll.dataLoaded();
            promise.reject();
        });
        return promise.promise;
    };

    $scope.getDataDown = function() {
        var promise = $q.defer();
        $http.get(entity.path)
            .success(function(data) {
                $scope.lastPage++;
                var newData = $scope.getPage(data, $scope.lastPage);
                $scope.gridApi.infiniteScroll.saveScrollPercentage();
                $scope.data = $scope.data.concat(newData);
                $scope.gridApi.infiniteScroll.dataLoaded($scope.firstPage > 0, $scope.lastPage < 4).then(function() {$scope.checkDataLength('up');}).then(function() {
                    promise.resolve();
                });
            })
            .error(function(error) {
                $scope.gridApi.infiniteScroll.dataLoaded();
                promise.reject();
            });
        return promise.promise;
    };

    $scope.checkDataLength = function( discardDirection) {
        // work out whether we need to discard a page, if so discard from the direction passed in
        if( $scope.lastPage - $scope.firstPage > 3 ){
          // we want to remove a page
          $scope.gridApi.infiniteScroll.saveScrollPercentage();

          if( discardDirection === 'up' ){
            $scope.data = $scope.data.slice(100);
            $scope.firstPage++;
            $timeout(function() {
              // wait for grid to ingest data changes
              $scope.gridApi.infiniteScroll.dataRemovedTop($scope.firstPage > 0, $scope.lastPage < 4);
            });
          } else {
            $scope.data = $scope.data.slice(0, 400);
            $scope.lastPage--;
            $timeout(function() {
              // wait for grid to ingest data changes
              $scope.gridApi.infiniteScroll.dataRemovedBottom($scope.firstPage > 0, $scope.lastPage < 4);
            });
          }
        }
    };

    $scope.getPage = function(data, page) {
        var res = [];
        for (var i = (page * 100); i < (page + 1) * 100 && i < data.length; ++i) {
            res.push(data[i]);
        }
        return res;
    };

    $scope.reset = function() {
        $scope.firstPage = 2;
        $scope.lastPage = 2;

        // turn off the infinite scroll handling up and down
        $scope.gridApi.infiniteScroll.setScrollDirections( false, false );
        $scope.data = [];

        $scope.getFirstData().then(function(){
            $timeout(function() {
                // timeout needed to allow digest cycle to complete,and grid to finish ingesting the data
                $scope.gridApi.infiniteScroll.resetScroll( $scope.firstPage > 0, $scope.lastPage < 4 );
            });
        });
    };

    $scope.getFirstData().then(function(){
        $timeout(function() {
            // timeout needed to allow digest cycle to complete,and grid to finish ingesting the data
            // you need to call resetData once you've loaded your data if you want to enable scroll up,
            // it adjusts the scroll position down one pixel so that we can generate scroll up events
            $scope.gridApi.infiniteScroll.resetScroll( $scope.firstPage > 0, $scope.lastPage < 4 );
        });
    });
*/
}]);

// Images controller
chaiseRecordApp.controller('ImagesCtrl', ['$scope', function($scope){
    // When ng-repeat has been finished, apply jQuery UI to entity-images
    $scope.$on('ngRepeatFinished', function(){

        // var previews = jQuery('#previews').slippry({
        //   // general elements & wrapper
        //   slippryWrapper: '<div class="slippry_box previews" />',
        // });

        var thumbs = jQuery('#entity-images').slippry({
          // general elements & wrapper
          slippryWrapper: '<div class="slippry_box entity-image" />'
        });

        jQuery(document).on('click', '.thumbs a', function (e){
            e.preventDefault();
            thumbs.goToSlide(jQuery(this).data('att-slide'));
            return false;
        });

        // Make sure the thumbnails aren't hidden after the lightbox dismisses
        jQuery('.image-thumbnail').fancybox({
            afterClose:function(){
               jQuery('.image-thumbnail').show();
            }
        });
    });
}]);

// When the slippry images have been loaded
chaiseRecordApp.directive('slippryimageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            element.bind('load', function() {
                // Find the image with the longest height, then set the sliprry box's height to be the height of that image
                var maxImageHeight = 0;

                jQuery('#entity-images li img').each(function(){
                    if ($(this).height() > maxImageHeight){
                        maxImageHeight = $(this).height();
                    }
                });

                jQuery('.slippry_box').css('height', maxImageHeight + 'px');

            });
        }
    };
});

chaiseRecordApp.controller('NestedTablesCtrl', ['$scope', function($scope){
    // When ng-repeat has been finished, fixed header to nested tables
    $scope.$on('ngRepeatFinished', function(){
        $('.table.nested').floatThead({
            scrollContainer: function($table){
                return $table.closest('.wrapper');
            }
        });

    });

    $scope.isExternalUrl = function(url) {
        return (url.indexOf(window.location.origin) === -1);
    }
}]);

/*
 _____ _ _ _
|  ___(_) | |_ ___ _ __ ___
| |_  | | | __/ _ \ '__/ __|
|  _| | | | ||  __/ |  \__ \
|_|   |_|_|\__\___|_|  |___/

*/

// Return an entity object who's values are not arrays with objects, also remove title from entity
chaiseRecordApp.filter('filteredEntity', ['schemaService', function(schemaService){
    return function(entity){
        var filteredEntity = {};

        for (var key in entity){
            var value = entity[key];
            // Only insert values into filteredEntity if
            // * value is not an array OR it is an array, it's elements is greater than 0, and it's elements are not an object
            // * key is not 'interal' or 'embedTables'
            // * key does not end with "_link" (for pattern linking of another column)
            // * key is not colTooltips
            if (value !== null &&
                (!Array.isArray(value) || (Array.isArray(value) && value.length > 0 && typeof(value[0]) != 'object')) &&
                key != 'internal' && key != 'embedTables' && !key.match(".*_link") &&
                key != 'colTooltips'){

                // use display column name as key
                // TODO inefficient to do this for each column?
                var newKey = schemaService.getColumnDisplayName(entity.internal.schemaName, entity.internal.tableName, key);

                // Only include column (key) if column is not hidden
                if (!schemaService.isHiddenColumn(entity.internal.schemaName, entity.internal.tableName, key)){
                    filteredEntity[newKey] = entity[key];
                }
            }
        }

        return filteredEntity;

    };
}]);

// Removes underscores from input
chaiseRecordApp.filter('removeUnderScores', function(){
    return function(input){
        return input.replace(/_/g, ' ');
    };
});


// If value is array -> stringify arrays
chaiseRecordApp.filter('sanitizeValue', function($sce){
    return function(value){

        var emails  = /([a-zA-Z0-9_\.]+@[a-zA-Z_\.]+\.(edu|com|net|gov|io))/gim;

        if (Array.isArray(value)){

            return value.join(', ');

        } else if (value === null){

            return 'N/A';

        } else if (typeof value == "string" && value.match(emails)) {

            value = value.replace(emails, '<a href=\"mailto:$1\">$1</a>');
            return $sce.trustAsHtml(value);

        } else{
            return value;
        }

    };
});

chaiseRecordApp.filter('uri', function($sce){
    return function(value){

        return $sce.trustAsHtml(value);

    };
});

// Input: MIME type, Output: Uri to image preview
// http://www.yolinux.com/TUTORIALS/LinuxTutorialMimeTypesAndApplications.html
chaiseRecordApp.filter('iconPreviewUri', function(){
    return function(input){
            var preview = 'assets/images/FilePreviews/';
            switch (input){
                // Folder
                case 'application/x-gzip':
                case 'application/zip':
                    preview += 'folder.png';
                    break;
                // Image
                case 'image/bmp':
                case 'image/jpeg':
                case 'image/pjpeg':
                case 'image/png':
                case 'image/tiff':
                case 'image/x-tiff':
                case 'image/gif':
                case 'application/dicom':
                case 'image/x.nifti':
                    preview += 'image.png';
                    break;
                // Video
                case 'video/quicktime':
                case 'video/mp4':
                case 'application/x-shockwave-flash':
                case 'video/mpeg':
                case 'video/x-mpeg':
                    preview += 'video.png';
                    break;
                // Audio
                case 'audio/mpeg3':
                case 'audio/x-mpeg-3':
                case 'audio/wav':
                case 'audio/x-wav':
                case 'audio/x-ms-wma':
                case 'audio/flac':
                case 'audio/ogg':
                case 'application/ogg':
                case 'audio/midi':
                case 'audio/x-midi':
                    preview += 'audio.png';
                    break;
                // Text
                case 'text/plain':
                case 'application/pdf':
                case 'application/msword':
                case 'application/rtf':
                    preview += 'text.png';
                    break;
                default:
                    preview += 'default.png';
                    break;
        }
        return preview;
    };
});

// Input: bytes. Output: H human readable file size description
chaiseRecordApp.filter('filesize', function(){
    return function(input){
        return filesize(parseInt(input, 10));
    };
});

// remove columns with _link ending
chaiseRecordApp.filter('notHyperLink', function () {
    return function (cols) {
        var result = [];
        if (cols !== undefined) {
            for (var i = 0; i < cols.length; i++) {
                if (!cols[i].match(".*_link")) {
                    result.push(cols[i]);
                }
            }
        }
        return result;

    }
});

/*
 ____  _               _   _
|  _ \(_)_ __ ___  ___| |_(_)_   _____  ___
| | | | | '__/ _ \/ __| __| \ \ / / _ \/ __|
| |_| | | | |  __/ (__| |_| |\ V /  __/\__ \
|____/|_|_|  \___|\___|\__|_| \_/ \___||___/

*/

// Will call ngRepeatFinished when last ng-repeat element has been rendered
chaiseRecordApp.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    };
});
