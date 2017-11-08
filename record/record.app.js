(function() {
    'use strict';

    angular.module('chaise.record', [
        'ngSanitize',
        'ngCookies',
        'chaise.alerts',
        'chaise.delete',
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.record.display',
        'chaise.record.table',
        'chaise.html',
        'chaise.utils',
        'ermrestjs',
        'ui.bootstrap',
        'chaise.footer',
        'chaise.upload',
        'chaise.recordcreate'
    ])

    .factory('constants', [function(){
        return {
            defaultPageSize: 25,
        };
    }])

    .config(['$cookiesProvider', function($cookiesProvider) {
        $cookiesProvider.defaults.path = '/';
    }])

    // Configure all tooltips to be attached to the body by default. To attach a
    // tooltip on the element instead, set the `tooltip-append-to-body` attribute
    // to `false` on the element.
    .config(['$uibTooltipProvider', function($uibTooltipProvider) {
        $uibTooltipProvider.options({appendToBody: true});
    }])

    //  Enable log system, if in debug mode
    .config(['$logProvider', function($logProvider) {
        $logProvider.debugEnabled(chaiseConfig.debug === true);
    }])

    .run(['constants', 'DataUtils', 'ERMrest', 'ErrorService', 'headInjector', 'MathUtils', 'modalBox', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', 'Errors',
        function runApp(constants, DataUtils, ERMrest, ErrorService, headInjector, MathUtils, modalBox, Session, UiUtils, UriUtils, $log, $rootScope, $window, Errors) {

        var session,
            context = {};
        $rootScope.displayReady = false;
        $rootScope.recDisplayReady = false;

        UriUtils.setOrigin();
        headInjector.setupHead();

        $rootScope.showEmptyRelatedTables = false;
        $rootScope.modifyRecord = chaiseConfig.editRecord === false ? false : true;
        $rootScope.showDeleteButton = chaiseConfig.deleteRecord === true ? true : false;

        var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        $rootScope.context = context;

        // The context object won't change unless the app is reloaded
        context.appName = "record";
        context.pageId = MathUtils.uuid();

        ERMrest.appLinkFn(UriUtils.appTagToURL);

        /**
        * getPageSize(obj) returms page size of the display attribute in the object.
        * @param {object} obj Object reference that has the display attribute
        */
        function getPageSize(obj){
            return ((!angular.isUndefined(obj) && obj.display.defaultPageSize)?obj.display.defaultPageSize:constants.defaultPageSize);
        }

        /**
        * getRelatedTableData(refObj, accordionOpen, callback) returns model object with all required component values
        * that is needed by <record-table>, <record-action-bar> and <record-display> diretives.
        * @param {object} refObj Reference object with component details
        * @param {bool} accordionOpen if paased as TRUE accordion should be expanded
        * @param {string} context  context for reading page reference
        * @param {callback} callback to be called after function processing
        */
        function getRelatedTableData(refObj, accordionOpen, context, callback){

            var pageSize = getPageSize(refObj);
            refObj.read(pageSize).then(function (page) {
                var model = {
                    reference: refObj,
                    columns: refObj.columns,
                    page: page,
                    pageLimit: pageSize,
                    hasNext: page.hasNext,      // used to determine if a link should be shown
                    hasLoaded: true,            // used to determine if the current table and next table should be rendered
                    open: accordionOpen,        // to define if the accordion is open or closed
                    enableSort: true,           // allow sorting on table
                    sortby: null,               // column name, user selected or null
                    sortOrder: null,            // asc (default) or desc
                    rowValues: [],              // array of rows values
                    selectedRows: [],           // array of selected rows, needs to be defined even if not used
                    search: null,                // search term
                    displayType: refObj.display.type,
                    context: context,
                    fromTuple: $rootScope.tuple
                };
                model.rowValues = DataUtils.getRowValuesFromPage(page);
                model.config = {
                    viewable: true,
                    editable: $rootScope.modifyRecord,
                    deletable: $rootScope.modifyRecord && $rootScope.showDeleteButton,
                    selectMode: modalBox.noSelect
                };
                // return model;
                callback(model);
                },function readFail(error) {
                    var model = {
                        hasLoaded: true
                    };
                    // return model;
                    callback(model);
                    throw error;
                }).catch(function(e) {
                    // The .catch from the outer promise won't catch errors from this closure
                    // so a .catch needs to be appended here.
                    throw e;
                });
        }
        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function() {

            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            ERMrest.resolve(ermrestUri, {cid: context.appName}).then(function getReference(reference) {
                context.filter = reference.location.filter;

                DataUtils.verify(context.filter, 'No filter was defined. Cannot find a record without a filter.');

                // if the user can fetch the reference, they can see the content for the rest of the page
                // set loading to force the loading text to appear and to prevent the on focus from firing while code is initializing
                session = Session.getSessionValue();

                // $rootScope.reference != reference after contextualization
                $rootScope.reference = reference.contextualize.detailed;
                $rootScope.reference.session = session;
                $log.info("Reference: ", $rootScope.reference);

                // There should only ever be one entity related to this reference, we are
                // reading 2 entities (the second is added in ermrest.read) and if we get
                // more than 1 entity then we throw a multipleRecordError.
                return $rootScope.reference.read(2);
            }, function error(exception) {
                throw exception;
            }).then(function getPage(page) {
                $log.info("Page: ", page);
                /*
                *  recordSetLink should be used to present user with  an option in case of no data found/more data found(>1)
                *  This could be link to RECORDSET or SEARCH.
                */
                var recordSetLink = page.reference.contextualize.compact.appLink;

                if (page.tuples.length < 1) {
                    throw new Errors.noRecordError(context.filter.filters, recordSetLink);
                }
                else if(page.tuples.length > 1){
                    $rootScope.displayReady = true;
                    throw new Errors.multipleRecordError(recordSetLink);
                }

                var tuple = $rootScope.tuple = page.tuples[0];
                // Used directly in the record-display directive
                $rootScope.recordDisplayname = tuple.displayname;

                // related references
                $rootScope.relatedReferences = $rootScope.reference.related(tuple);

                $rootScope.loading = $rootScope.relatedReferences.length > 0;

                // Collate tuple.isHTML and tuple.values into an array of objects
                // i.e. {isHTML: false, value: 'sample'}
                $rootScope.recordValues = [];
                tuple.values.forEach(function(value, index) {
                    $rootScope.recordValues.push({
                        isHTML: tuple.isHTML[index],
                        value: value
                    });
                });

                $rootScope.columns = $rootScope.reference.generateColumnsList(tuple);
                var allInbFKColsIdx = [];
                var allInbFKCols = $rootScope.columns.filter(function (o, i) {
                    if(o.isInboundForeignKey){
                        allInbFKColsIdx.push(i);
                        return o;
                    }
                });
                $rootScope.inboundFKCols = allInbFKCols;
                $rootScope.inboundFKColsIdx = allInbFKColsIdx;
                $rootScope.inbFKRef = allInbFKCols;
                if(allInbFKCols.length>0){

                    $rootScope.rtrefDisTypetable = [];
                    $rootScope.colTableModels = [];

                    for(var i =0;i<allInbFKCols.length;i++){
                        allInbFKCols[i].reference = allInbFKCols[i].reference.contextualize.compactBriefInline;
                        var ifkPageSize = getPageSize(allInbFKCols[i].reference);
                        (function(i) {
                            if (allInbFKCols[i].reference.canCreate && $rootScope.modifyRecord && !$rootScope.showEmptyRelatedTables) {
                                $rootScope.showEmptyRelatedTables = true;
                            }
                            getRelatedTableData(allInbFKCols[i].reference, true, "compact/brief/inline", function(model){

                                $rootScope.colTableModels[allInbFKColsIdx[i]] = model;
                                $rootScope.rtrefDisTypetable[allInbFKColsIdx[i]] = allInbFKCols[i].reference;
                                $rootScope.recDisplayReady =  (i==allInbFKCols.length-1)?true:false;

                            });
                        })(i);
                    }
                }else{
                    $rootScope.recDisplayReady =  true;
                }

                $rootScope.tableModels = [];
                $rootScope.lastRendered = null;
                var cutOff = chaiseConfig.maxRelatedTablesOpen > 0? chaiseConfig.maxRelatedTablesOpen : Infinity;
                var boolIsOpen = $rootScope.relatedReferences.length > cutOff ? false:true;

                for (var i = 0; i < $rootScope.relatedReferences.length; i++) {

                    $rootScope.relatedReferences[i] = $rootScope.relatedReferences[i].contextualize.compactBrief;
                    var pageSize = getPageSize($rootScope.relatedReferences[i]);
                    (function(i) {
                        if ($rootScope.relatedReferences[i].canCreate && $rootScope.modifyRecord && !$rootScope.showEmptyRelatedTables) {
                            $rootScope.showEmptyRelatedTables = true;
                        }
                        getRelatedTableData($rootScope.relatedReferences[i], boolIsOpen, "compact/brief", function(model){
                            $rootScope.tableModels[i] = model;
                            $rootScope.displayReady = true;
                        });
                    })(i);
                }
                if ($rootScope.relatedReferences.length == 0) {
                    $rootScope.displayReady = true;
                }
            }).catch(function genericCatch(exception) {
                throw exception;
            });

        })


        /**
         * it saves the location in $rootScope.location.
         * When address bar is changed, this code compares the address bar location
         * with the last save recordset location. If it's the same, the change of url was
         * done internally, do not refresh page. If not, the change was done manually
         * outside recordset, refresh page.
         *
         */
        UriUtils.setLocationChangeHandling();

        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();
    }]);
})();
