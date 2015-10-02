// Examples

// one level -> big construct table
//     -> inbound/outbound forgein key
//     -> nested forgein table inline into construct 
    
// Invalid

// file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#1/legacy:tom/username=efef
// file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#1/legacy:person/username=efef

// Valid

// - file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#1/legacy:person/username=Jim%20F.%20Brinkley
    // https://vm-dev-030.misd.isi.edu/chaise/detail/index.html#1/legacy:person/username=Jim%20F.%20Brinkley
// - file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#1/legacy:mouse_gene/term=ABCA4
// - file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#1/legacy:dataset/accession=FB00000177
// - file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#6/legacy:construct/id=1243
// - file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#6/legacy:target/id=110
// file:///Users/bennettl/Desktop/Project/Chaise/record/index.html#6/legacy:construct/id=1243




// Ermrest

// - curl -k -H "Accept: application/json" https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/aggregate/construct/a:=cnt(*)
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/aggregate/construct/a:=cnt(*)"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/aggregate/construct/total_rows_yo:=cnt(*)"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/aggregate/construct/cnt(*)"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/aggregate/construct/"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/construct"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/construct/id=1243"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/construct/id=1243"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/target"
// - curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/target/id=90"


var CR_BASE_URL = 'http://dev.facebase.org/ermrest/catalog/';
var chaiseRecordApp = angular.module("chaiseRecordApp", ['ngResource', 'ngRoute', 'ngAnimate', 'ui.bootstrap', 'ngCookies', 'ngSanitize']);

/*
  ____             __ _       
 / ___|___  _ __  / _(_) __ _ 
| |   / _ \| '_ \| |_| |/ _` |
| |__| (_) | | | |  _| | (_| |
 \____\___/|_| |_|_| |_|\__, |
                        |___/ 
*/

document.onmouseover = function() {
    //User's mouse is inside the page.
    window.innerDocClick = true;
}

document.onmouseleave = function() {
    //User's mouse has left the page.
    window.innerDocClick = false;
}


window.onhashchange = function() {
    if (window.innerDocClick) {
        window.innerDocClick = false;
    } else {
        if (window.location.hash != '#undefined') {
            location.reload();
        } else {
            history.pushState("", document.title, window.location.pathname);
            location.reload();
        }
    }

    function goBack() {
        window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
        //blah blah blah
        window.location.lasthash.pop();
    }
}


// chaiseRecordApp.config(['$locationProvider', function($locationProvider) {
//     $locationProvider.html5Mode({rewriteLinks: false});
// }]);

/*
 ____                  _               
/ ___|  ___ _ ____   _(_) ___ ___  ___ 
\___ \ / _ \ '__\ \ / / |/ __/ _ \/ __|
 ___) |  __/ |   \ V /| | (_|  __/\__ \
|____/ \___|_|    \_/ |_|\___\___||___/

*/

// REST API for Ermrest
chaiseRecordApp.service('ermrestService', ['$http', '$rootScope', 'schemaService', 'spinnerService', 'notFoundService', function($http, $rootScope, schemaService, spinnerService, notFoundService){

    // Get the entity in JSON format
    // Note: By this point,the schema should be loaded already
    this.getEntity = function(tableName, keys, nested, onSuccess){
        
        // Start spinner
        spinnerService.show('Loading...');

        // Reference to service
        var self = this;

        // Make sure the schema is loaded
        if (!schemaService.schema){
            return;
        }

        // Only continue if tableName is valid
        if (!schemaService.isValidTable(tableName)){
            notFoundService.show("We're sorry, the tablename '" + tableName + "' does not exist. Please try again!");
            return;
        }
              
        // Build the entity path
        var path = CR_BASE_URL + schemaService.schema.cid + '/entity/' + tableName + '/' + self.buildPredicate(keys);

        // Execute API Request to get main entity
        $http.get(path).success(function(data, status, headers, config) {
        
            // If entity was NOT found, it's because no entity match the keys that were provided
            if (data.length == 0){
                notFoundService.show("We're sorry, an entity with keys '" + JSON.stringify(keys) + "' does not exist. Please try again!");
                return;
            }

            // Extract the first entity
            var entity          = data[0];

            // If nested == false, then we're only interested in the entity and not any nested tables, references, or associations
            if (!nested){
                var keys = { id: entity.id };
                entity.link         = self.getEntityLink(tableName, keys);
                onSuccess(entity);
                return;
            }

            entity.references   = [];
            entity.associations = [];
            // Data use by helper methods
            entity.internal     = { tableName: tableName, path: path, displayTitle: '' };

            // console.log('entity', entity);

            // SET ENTITY DISPLAY TITLE
            entity.internal.displayTitle = self.getEntityTitle(entity);

            // GET ENTITY REFERENCES TABLE
            var foreignTables = self.getForeignTablesForEntity(entity);

            // For each of the table references, we'll execute an API request
            for (var i = 0; i < foreignTables.length; i++){
                var rt          = foreignTables[i];
                var counter     = 0;

                // Need to preserve rt variable in a closure
                (function(rt){

                    // Execute API request to get related entities information
                    $http.get(rt.path).success(function(data, status, headers, config) {
                        var references              = data;

                        // If the references doesn't return an empty array, continue
                        if (references.length > 0){

                            // Get the references annotations from the schema
                            var annotations =  schemaService.schema.tables[rt['displayTableName']].annotations;

                            // Base on the annotation, treat the reference differently
                            // If annotations is 'download', store it in the entity's 'files' atributes
                            if (annotations.comment !== undefined && annotations.comment.indexOf('download') > -1){
                                entity['files']         = references;

                            // If annotations is 'previews', store it in the entity's 'previews' atributes
                            } else if (annotations.comment !== undefined && annotations.comment.indexOf('preview') > -1){
                                entity['previews']      = references;

                            // If annotations is 'images', store it in the entity's 'images' atributes
                            } else if (annotations.comment !== undefined && annotations.comment.indexOf('image') > -1){
                                entity['images']        = references;

                            // If the annotation is an 'association', then collapse the array of objects into an array of values
                            // Association scenario #1: If table connects to a vocabulary table
                            } else if (rt.vocabularyTable != undefined){
                                // references (i.e [{'term':'P0'}], [{'term':'microCT images'}], etc)
                                var terms = [];
                                // convert  [{ 'term':'P0', 'term':'P323', 'term':'weg33k'}] -> [{ vocab: 'P0', link: ''} , { vocab: 'P323', link: ''}, { vocab: 'weg33k', link: '' }]
                                for (var j = 0; j < references.length; j++){
                                    var reference   = references[j];
                                    var term        = {};
                                    term.vocab      = references[j].term,
                                    term.link       = self.getEntityLink(rt['referencedTableName'], { 'term': term.vocab }),
                                    terms.push(term);
                                }

                                var formattedAssoication    = { 
                                                                'tableName':            rt['tableName'],
                                                                'terms':                terms,
                                                                'referencedTableName':  rt['referencedTableName']
                                                            };

                                                            // console.log(formattedAssoication);

                                entity.associations.push(formattedAssoication);

                            // Else, append the 'formattedReference' to the entity's references
                            } else{

                                // If refernce table is a binary table that refernces a more 
                                // If reference table is a binary table that references a more complex table, bump the complex table up
                                // If reference table is a complex table, swap vocab

                                self.processForeignKeyRefencesForTables(tableName, rt, references);
                                
                                // SWAP FORGEIN KEY ID WITH VOCABULARY
                                var formattedReference     = { 
                                                                'displayTableName':     rt['displayTableName'], // the title of nested tables
                                                                'tableName':            rt['tableName'], // the table the nested entities belong to
                                                                'list':                 references, // list of nested entities
                                                                'referencedTableName':  rt['referencedTableName'],
                                                                'transpose':            false,
                                                                'open':                 true
                                                            };

                                // Set the keys for the referenced, will be used as headers for transpose tables
                                if (references.length > 0){
                                    formattedReference.keys =  Object.keys(references[0]);
                                }

                                entity.references.push(formattedReference);
                            }
                        }
                        
                        counter++;

                        // Once all the request have been made, invoke the onSuccess callback
                        if (counter == foreignTables.length){
                            onSuccess(entity);

                            // Hide spinner
                            spinnerService.hide();

                            console.log('entity', entity);
                        }

                    }).
                    error(function(data, status, headers, config) {
                        console.log("Error querying collections", data);
                        notFoundService.show("We're sorry, we ran into an internal server error when querying for entity renferences");
                        spinnerService.hide();
                    });

                }(rt));
            }

        }).error(function(data, status, headers, config) {
            console.log("Error querying collections", data);
            notFoundService.show("We're sorry, we could not find a match with the keys you provided");
            spinnerService.hide();
        });
       
    };

    // If the reference table has a column that links to a vocabulary table, swape
    this.processForeignKeyRefencesForTables = function(parentTableName, rt, references){
        var self = this;

        // For each reference
        for (var j = 0; j < references.length; j++){
            var reference = references[j];

            // Delete that key that connects the reference to the parent (i.e. construct reference should delete target column)
            // First check if the (parent) tableName exists, and delete it if it does
            if (reference[parentTableName] != undefined){
                delete reference[parentTableName];
            // If it doesn't find the column value connecting to the parent table, then delete that
            } else{
                var parentColumnKey = schemaService.getParentColumnName(parentTableName, rt['tableName']);
                delete reference[parentColumnKey];
            }

            // SWAP FORGEIN KEY ID WITH VOCABULARY
            // Inspect every key in the reference, and if they link to a vocabulary table, swap it with a vocabulary term
            for (var rKey in reference){
                var rValue = reference[rKey];

                // Only continue if reference key has a value
                if (rValue == null){
                    continue;
                }
                // ASSUMPTION: Assumes key is id, but can be something else!!!
                var keys = { 'id': rValue };

                if (schemaService.isVocabularyTable(rKey)){

                    // Only get the entity, not any nested tables
                    // curl -k -H "Accept: application/json" "https://vm-dev-030.misd.isi.edu/ermrest/catalog/6/entity/cleavagesite/id=12"
                    // Need to preserve j and rKey variable in a closure
                    (function(j, rKey){
                        self.getEntity(rKey, keys, false, function(data){
                            var vocabEntity = data;
                            // ASSUMPTION: Assumes key is name, but can be something else!!!
                            // This is the value we want to replace i.e. id 12 -> name "Precision"
                            references[j][rKey] = vocabEntity['name'];
                            // Will set a link to the entity
                            references[j][rKey + '_link'] = vocabEntity['link'];
                        });
                    }(j,rKey));

                // Else it's an 'id' key or reference to table, place a link to it
                } else if (rKey.toLowerCase() == 'id' || schemaService.isValidTable(rKey)){
                    // If the key is id, set the table name to the reference table's table name (construct), else the table name is key (i.e. cleavagesite)
                    var tableName = (rKey.toLowerCase() == 'id') ? rt['tableName'] : rKey;

                    // Mock entity object with params
                    references[j][rKey + '_link'] = self.getEntityLink(tableName, keys);
                }
            }
        }
    };

    // Get the entity display title
    this.getEntityTitle = function(entity){

        var entityTableSchema = schemaService.schema.tables[entity.internal.tableName];
        var validTitleColumns = ['name', 'label', 'title', 'term', 'username', 'filename'];

        // Inspect each column in the table schema to find the one with the annotation 'title'
        for (var c in entityTableSchema.column_definitions){

            var cd      = entityTableSchema.column_definitions[c];
            var cn      = cd.name.toLowerCase();
            var annotations = cd.annotations.comment;
            
            // If the annotation is a 'title'
            if (annotations != null && annotations.indexOf('title') > -1){
            
                return entity[cd.name];

            // If column name fits the array in validTitleColumns
            } else if (validTitleColumns.indexOf(cn) > -1){
                return entity[cd.name];
            }
        }

        return null;
    };

    // Get the Chaise Detail lin for entity, keys are the key value pair to search for
    this.getEntityLink = function(tableName, keys){
        return window.location.href.replace(window.location.hash, '') + '#' + schemaService.schema.cid + '/' +  schemaService.schema.schema_name + ':' + tableName+ '/' + this.buildPredicate(keys);
    };

    // Scan through schema to find related tables
    // Include tables with outbound foregin key (construct), to entity (target). If the foreign table (construct) is an 'asssociation' table, we will go another level deep and get all associations 
    this.getForeignTablesForEntity = function(entity){

        // Goes through every table in the schema, looking for a forgein_key_column: table_name that matches entity table name
        var foreignTables = [];

        // EACH TABLE
        for (var tableKey in schemaService.schema.tables){
            var tableSchema             = schemaService.schema.tables[tableKey];
            var referencedColumnMatch   = false; // if our table name is part of foreign key -> reference columns

            // EACH FORGEIN KEY 
            for (var i = 0; i < tableSchema.foreign_keys.length; i++){
               var fk =  tableSchema.foreign_keys[i];

                // EACH REFERENCED COLUMNS
                for (var j = 0; j < fk.referenced_columns.length; j++){
                    var rc = fk.referenced_columns[j];

                    // If a reference column table name matches our table name, then it has an outbound forgein key to entity. i.e. construct -> target (entity)
                    if (rc.table_name == entity.internal.tableName){
                        referencedColumnMatch = true;

                        var foreignTable = {

                                                    'displayTableName':     tableKey,
                                                    'tableName':            tableKey,
                                                    'referencedTableName':  rc.table_name,
                                                    'path':                 entity.internal.path + '/' + tableKey
                                                };
                        // If this is a binary table, switch the path to bring out the referenced table instead

                        //  If foreign table it's a binary table, continue
                        if (schemaService.isBinaryTable(foreignTable.tableName)){
                            var parentTableName     = entity.internal.tableName;
                            // ASSUMPTION: Column name = tablename
                            var referenceTableName  = schemaService.getReferencedColumnName(parentTableName, foreignTable.tableName); 

                           
                            // CASE A: If foreign table references a vocabulary table, set vocabularyTable varialbe to true (dataset_mouse_mutation -> mouse_mutation)
                            if (schemaService.isVocabularyTable(referenceTableName)){
                                foreignTable.vocabularyTable            = true;
                                foreignTable.referencedTableName        = referenceTableName;
                                foreignTable.path                       += '/'+ referenceTableName;
                            // CASE B: If foreign table references a complex table, switch the path to be the table it references (project member -> project)
                            } else if (schemaService.isComplexTable(referenceTableName)){
                                foreignTable.path   += '/'+ referenceTableName;
                                foreignTable.tableName = referenceTableName;
                            }

                        }

                        foreignTables.push(foreignTable);


                    }
                }
            }
        }

        return foreignTables;

    };

    // Build ermrest predicate base on JSON params
    this.buildPredicate = function(params){

        // Build an array of predicates for the Ermrest Filter lanaguage
        var predicates = [];

        for (var key in params){
            var predicate   = encodeURIComponent(key) + '=';
            // Do not encoude already encoded string
            predicate       += params[key].toString().indexOf('%') > -1 ? params[key] : encodeURIComponent(params[key]);
             
            predicates.push(predicate);
        }
        // Join predicates with a conjunctive filter '&'
        return predicates.join('&');
    };

   

}]);

// Service use to introspect scheam
chaiseRecordApp.service('schemaService', ['$http',  '$rootScope', 'spinnerService', 'notFoundService', function($http, $rootScope, spinnerService, notFoundService){
    
    var schema  = {};

    // Get the catalogue's schema
    this.getSchema = function(cid, schemaName, onSuccess){
        
        // Start spinner
        spinnerService.show('Loading...');

        // Build the schema path
        var path = CR_BASE_URL + cid + '/schema';
        
        // Reference to service
        var self = this;

        // Execute API Request tog get schema
        $http.get(path).success(function(data, status, headers, config) {
            // console.log('scheams', data.schemas);
            // Set schema
            self.schema     = data.schemas[schemaName];
            self.schema.cid = cid;

            spinnerService.hide();
            onSuccess(data);

        // window.location.href = '#' + '1';
        // replace(window.location.hash, '') + '#' + schemaService.schema.cid + '/' +  schemaService.schema.schema_name + ':' + tableName+ '/' + this.buildPredicate(keys);

            console.log('schema', self.schema);
        }).
        error(function(data, status, headers, config) {
            console.log("Error querying schema", data);
            notFoundService.show("We're sorry, the catalogue id " + cid + " does not exist. Please try again!");
            spinnerService.hide();
        });
    };


    // For a given nested entity, get the parent column name
    this.getParentColumnName = function(parentTableName, tableName){
        // Inspect the table foreignKeys
        var foreignKeys = this.schema.tables[tableName].foreign_keys;

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

    // Get the referenced column name that is NOT referencing the parentTableName
    this.getReferencedColumnName = function(parentTableName, tableName){
        // Inspect the table foreignKeys
        var foreignKeys = this.schema.tables[tableName].foreign_keys;

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
                    return rc.table_name;
                }
            }
        }

        return '';
    };

    // Valid if table name is part of schema
    this.isValidTable = function(tableName){
        // Iterate through the tables defined in the schema to find a match with tableName        
        var match = false;
        for (var t in this.schema.tables){
            // If there is a match
            if (t == tableName){
                match = true;
                break;
            }
        }

        return match;
    };

    // Return if a table is vocabulary table (< 3 columns)
    this.isVocabularyTable = function(tableName){
        // First check if it's a valid table
        if (!this.isValidTable(tableName)){
            return false;
        }

        // It's a vocabulary table if the table columns < 3
        var table = this.schema.tables[tableName];
        return table.column_definitions.length < 3;
    };

    // Return if a table is a binary table (2 columns)
    this.isBinaryTable = function(tableName){
        // First check if it's a valid table
        if (!this.isValidTable(tableName)){
            return false;
        }

        // It's a vocabulary table if the table columns < 3
        var table = this.schema.tables[tableName];
        return table.column_definitions.length == 2;
    };

    // Return if a table is a complex table (> 2 columns)
    this.isComplexTable = function(tableName){
        // First check if it's a valid table
        if (!this.isValidTable(tableName)){
            return false;
        }

        // It's a complex table if the table columns < 2
        var table = this.schema.tables[tableName];
        return table.column_definitions.length > 2;
    };

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

        hashParams['catalogueId']   = params[0];
        hashParams['schemaName']    = namespace[0];
        hashParams['tableName']     = namespace[1];
        hashParams['keys']          = this.convertParamsToObject(params[2]);

        return hashParams;
    };

     // 
    this.convertParamsToObject = function(params){
        var obj = {};
        var predicates = params.split('&');

        for (var i = 0; i < predicates.length; i++){
            var key = predicates[i].split('=');
            obj[key[0]] = key[1];
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

    $scope.active = "Home";

    // Determines wheather the page is active
    // $scope.isActive = function(page){
    //     return  $location.path() == page;
    // };

}]);

// Detail controller
chaiseRecordApp.controller('DetailCtrl', ['$rootScope', '$scope','ermrestService', 'schemaService', 'locationService', 'notFoundService', function($rootScope, $scope, ermrestService, schemaService, locationService, notFoundService){
    // C: Catalogue id
    // T: Table name
    // K: Key

    // Set up the parameters base on url
    var params      = locationService.getHashParams(); 
    // var params      = $location.search();  query parameters
    var cid         = params['catalogueId'];
    var tableName   = params['tableName'];
    var schema      = params['schemaName'];
    var keys        = params['keys'];

    // cid 
    var cidRegex = /^[0-9]+$/;
    var tableNameRegex = /^[0-9a-zA-z_-]+$/;

    // catalogueId = 1;
    // tableName = 'person';
    // schemaName = 'legacy';
    // keys { username = 'Jim F. Brinkley' } ;

    $scope.reloadPage = function(url){
        location.reload();
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

        // Call Ermrest service to get schema
        schemaService.getSchema(cid, schema, function(data){

            // Call the ermrestService to get entity through catalogue id, tableName, and col=val parameters
            ermrestService.getEntity(tableName, keys, true, function(data){
                // console.log('data is ', data);
                $scope.entity = data;
            });
        });
    }

    $scope.$watch('entity.open', function(isOpen){
        if (isOpen) {
          console.log('First group was opened'); 
        }    
    });

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
          slippryWrapper: '<div class="slippry_box entity-image" />',
        });

        jQuery(document).on('click', '.thumbs a', function (e){
            e.preventDefault();
            // console.log('data slide', jQuery(this).data('att-slide'));
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

chaiseRecordApp.controller('NestedTablesCtrl', ['$scope', function($scope){
    // When ng-repeat has been finished, fixed header to nested tables
    $scope.$on('ngRepeatFinished', function(){
        $('.table.nested').floatThead({
            scrollContainer: function($table){
                return $table.closest('.wrapper');
            }
        });

    });
}]);


/*
 _____ _ _ _                
|  ___(_) | |_ ___ _ __ ___ 
| |_  | | | __/ _ \ '__/ __|
|  _| | | | ||  __/ |  \__ \
|_|   |_|_|\__\___|_|  |___/

*/

// Return an entity object who's values are not arrays with objects, also remove title from entity
chaiseRecordApp.filter('filteredEntity', function(){
    return function(input){
        var filteredEntity = {};

        for (var key in input){
            var value = input[key];
            // Only insert values into filteredEntity if value is not an array OR it is an array, it's elements is greater than 0, and it's elements are not an object AND if the key is not 'interal'
            if ((!Array.isArray(value) || (Array.isArray(value) && value.length > 0 && typeof(value[0]) != 'object')) && key != 'internal'){
                filteredEntity[key] = input[key];
            }
        }

        return filteredEntity;

    };
});

// Removes underscores from input
chaiseRecordApp.filter('removeUnderScores', function(){
    return function(input){
        //console.log('input ' + input);
        return input.replace(/_/g, ' ');
    };
});


// If value is url -> wraps it in an <a> 
// If value is array -> stringify arrays
chaiseRecordApp.filter('sanitizeValue', function($sce){
    return function(value){

        var urls    = /(\b(https?|ftp):\/\/[A-Z0-9+&@#\/%?=~_|!:,.;-]*[-A-Z0-9+&@#\/%=~_|])/gim;
        var emails  = /([a-zA-Z0-9_\.]+@[a-zA-Z_\.]+\.(edu|com|net|gov|io))/gim;

        if (Array.isArray(value)){
      
            return value.join(', ');

        } else if (value === null){
      
            return 'N/A';

        } else if (typeof value == "string" && value.match(urls)) {
            
            value = value.replace(urls, '<a href="$1" target="_blank">$1</a>');
            return $sce.trustAsHtml(value);

        } else if (typeof value == "string" && value.match(emails)) {
            
            value = value.replace(emails, '<a href=\"mailto:$1\">$1</a>');
            return $sce.trustAsHtml(value);

        } else{
            return value;
        }

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
