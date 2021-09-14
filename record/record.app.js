(function() {
    'use strict';

/* Configuration of the Record App */
    angular.module('chaise.configure-record', ['chaise.config'])

    .constant('settings', {
        appName: "record",
        appTitle: "Record",
        overrideHeadTitle: true,
        overrideDownloadClickBehavior: true,
        overrideExternalLinkBehavior: true
    })

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("record"), ["chaise.record"]);
            });
        });
    }]);

/* Record App */
    angular.module('chaise.record', [
        'ngSanitize',
        'ngCookies',
        'ngAnimate',
        'duScroll',
        'chaise.alerts',
        'chaise.delete',
        'chaise.errors',
        'chaise.export',
        'chaise.faceting',
        'chaise.inputs',
        'chaise.modal',
        'chaise.navbar',
        'chaise.record.display',
        'chaise.record.table',
        'chaise.html',
        'chaise.utils',
        'ermrestjs',
        'ui.bootstrap',
        'chaise.footer',
        'chaise.resizable',
        'chaise.upload',
        'chaise.recordcreate'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    .run(['AlertsService', 'ConfigUtils', 'DataUtils', 'ERMrest', 'FunctionUtils', 'headInjector', 'logService', 'MathUtils', 'messageMap', 'recordAppUtils', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$timeout', '$window',
        function runApp(AlertsService, ConfigUtils, DataUtils, ERMrest, FunctionUtils, headInjector, logService, MathUtils, messageMap, recordAppUtils, Session, UiUtils, UriUtils, $log, $rootScope, $timeout, $window) {

        var session,
            errorData = {};

        var context = ConfigUtils.getContextJSON(),
            chaiseConfig = ConfigUtils.getConfigJSON();

        context.chaiseBaseURL = UriUtils.chaiseBaseURL();

        $rootScope.displayReady = false;
        $rootScope.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app

        UriUtils.setOrigin();

        // NOTE: default to false until we know a user is logged in and they can modify the main record and modify at least 1 of the related tables
        $rootScope.showEmptyRelatedTables = false;
        $rootScope.modifyRecord = chaiseConfig.editRecord === false ? false : true;
        $rootScope.showDeleteButton = chaiseConfig.deleteRecord === true ? true : false;

        var res = UriUtils.chaiseURItoErmrestURI($window.location, true);
        var ermrestUri = res.ermrestUri,
            pcid = res.pcid,
            ppid = res.ppid,
            paction = res.paction,
            isQueryParameter = res.isQueryParameter;

        context.catalogID = res.catalogId;

        FunctionUtils.registerErmrestCallbacks();

        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function() {

            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            ERMrest.resolve(ermrestUri, ConfigUtils.getContextHeaderParams()).then(function getReference(reference) {
                $rootScope.savedQuery = ConfigUtils.initializeSavingQueries(reference);
                context.filter = reference.location.filter;
                context.facets = reference.location.facets;

                DataUtils.verify((context.filter || context.facets), 'No filter or facet was defined. Cannot find a record without a filter or facet.');

                session = Session.getSessionValue();
                if (!session && Session.showPreviousSessionAlert()) AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);

                // 'promptlogin' query parameter comes from static generated chaise record pages
                if (!session && UriUtils.getQueryParam($window.location.href, "promptlogin")) {
                    Session.loginInAPopUp(logService.logActions.LOGIN_WARNING);
                }

                // $rootScope.reference != reference after contextualization
                $rootScope.reference = reference.contextualize.detailed;
                $rootScope.reference.session = session;

                // send string to prepend to "headTitle"
                // <table-name>: pending... until we get row information back
                headInjector.updateHeadTitle(
                    DataUtils.getDisplaynameInnerText($rootScope.reference.displayname) +
                    ": pending..."
                );

                $log.info("Reference: ", $rootScope.reference);

                var logObj = {};
                if (pcid) logObj.pcid = pcid;
                if (ppid) logObj.ppid = ppid;
                if (paction) logObj.paction = paction;
                if (isQueryParameter) logObj.cqp = 1;


                $rootScope.logStackPath = logService.logStackPaths.ENTITY;
                $rootScope.logStack = [
                    logService.getStackNode(
                        logService.logStackTypes.ENTITY,
                        $rootScope.reference.table,
                        $rootScope.reference.filterLogInfo
                    )
                ];
                $rootScope.reloadCauses = [];

                return recordAppUtils.readMainEntity(false, logObj);
            }).then(function (page) {
                var tuple = page.tuples[0];
                // send string to prepend to "headTitle"
                // <table-name>: <row-name>
                headInjector.updateHeadTitle(
                    DataUtils.getDisplaynameInnerText($rootScope.reference.displayname) +
                    ": " +
                    DataUtils.getDisplaynameInnerText(tuple.displayname)
                );

                // update the window location with tuple to remove query params (namely ppid and pcid)
                // and also change the url to always be based on RID
                var url = tuple.reference.contextualize.detailed.appLink;
                url = url.substring(0, url.lastIndexOf("?"));

                // add hideNavbar param back if true
                if (context.hideNavbar) url += "?hideNavbar=" + context.hideNavbar;
                $window.history.replaceState({}, '', url);

                // populate the google dataset metadata
                recordAppUtils.attachGoogleDatasetJsonLd(tuple);

                // NOTE: when the read is called, reference.activeList will be generated
                // autmoatically but we want to make sure that urls are generated using tuple,
                // so the links are based on facet. We might be able to improve this and avoid
                // duplicated logic.
                var activeList = $rootScope.reference.generateActiveList(tuple);

                // requestModels is used to generate the secondary requests that the page needs.
                $rootScope.requestModels = [];
                activeList.requests.forEach(function (req) {
                    var m = {
                        activeListModel: req,
                        processed: false
                    };

                    if (req.entityset || req.aggregate) {
                        var extra = {
                            source: req.column.compressedDataSource,
                            entity: req.column.isEntityMode,
                        };
                        if (req.aggregate) {
                            extra.agg = req.column.aggregateFn;
                        }

                        // these attributes are used for logging purposes
                        m.logStack = logService.getStackObject(
                            logService.getStackNode(logService.logStackTypes.PSEUDO_COLUMN, req.column.table, extra)
                        );
                        m.logStackPath = logService.getStackPath("", logService.logStackPaths.PSEUDO_COLUMN);
                        m.reloadCauses = [];
                        m.reloadStartTime = -1;

                        // to avoid computing this multiple times
                        // this reference is going to be used for getting the values
                        if (req.entityset) {
                            m.reference = req.column.reference.contextualize.compactBrief;
                        }

                    }

                    $rootScope.requestModels.push(m);
                });

                // related references
                var related = $rootScope.reference.related;

                var columns = $rootScope.reference.columns, model;

                $log.info("default export template is accessible through `defaultExportTemplate` variable. To get the string value of it call `angular.toJson(defaultExportTemplate, 1)`");
                $window.defaultExportTemplate = $rootScope.reference.defaultExportTemplate;

                $rootScope.recordFlowControl = new recordAppUtils.FlowControlObject();

                $rootScope.hasAggregate = false;
                $rootScope.hasInline = false;
                $rootScope.columnModels = [];
                columns.forEach(function (col, index) {
                    model = {};


                    // inline
                    if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
                        var reference = col.reference.contextualize.compactBriefInline;
                        model = {
                            tableError: false,
                            isInline: true,
                            isTableDisplay: reference.display.type == 'table',
                            displayname: reference.displayname,
                            // whether we should do the waitfor logic:
                            hasWaitFor: col.hasWaitFor,
                            // to show the loader or not:
                            isLoading: col.hasWaitFor,
                            // this indicates that we got the waitfor data:
                            // only if w got the waitfor data, and the main data we can popuplate the tableMarkdownContent value
                            waitForDataLoaded: !col.hasWaitFor,
                            // this indicates that the tableMarkdownContent has been initialized:
                            // we should not show the related table before initialzing the tableMarkdownContent
                            tableMarkdownContentInitialized: false,
                            tableMarkdownContent: null,
                            tableModel: recordAppUtils.getTableModel(reference, index, true)
                        };
                        $rootScope.hasInline = true;
                    }
                    // columns that are relying on aggregates or are aggregate themselves
                    else if (col.hasWaitFor || !col.isUnique) {
                        model = {
                            columnError: false,
                            isLoading: true,
                            hasWaitForOrNotUnique: true
                        };
                    }

                    model.column = col;
                    model.baseTableName = $rootScope.reference.displayname;
                    $rootScope.columnModels.push(model);
                });

                var cutOff = chaiseConfig.maxRelatedTablesOpen > 0? chaiseConfig.maxRelatedTablesOpen : Infinity;
                var openByDefault = related.length > cutOff ? false:true;
                $rootScope.relatedTableModels = [];
                $rootScope.lastRendered = null;
                related.forEach(function (ref, index) {
                    ref = ref.contextualize.compactBrief;
                    // user can modify the current record page and can modify at least 1 of the related tables
                    if (!$rootScope.showEmptyRelatedTables && $rootScope.modifyRecord && ref.canCreate) {
                        $rootScope.showEmptyRelatedTables = true;
                    }

                    $rootScope.relatedTableModels.push({
                        open: openByDefault,
                        isTableDisplay: ref.display.type == 'table',
                        displayname: ref.displayname,
                        // whether we should do the waitfor logic:
                        hasWaitFor: ref.display.sourceHasWaitFor,
                        // to show the loader or not (currently not used in index.html.in but added for consistency):
                        isLoading: ref.display.sourceHasWaitFor,
                        // this indicates that we got the waitfor data:
                        // only if w got the waitfor data, and the main data we can popuplate the tableMarkdownContent value
                        waitForDataLoaded: false,
                        // this indicates that the tableMarkdownContent has been initialized:
                        // we should not show the related table before initialzing the tableMarkdownContent
                        tableMarkdownContentInitialized: false,
                        tableMarkdownContent: null,
                        tableModel: recordAppUtils.getTableModel(ref, index),
                        baseTableName: $rootScope.reference.displayname
                    });
                });

                // chaiseConfig.showWriterEmptyRelatedOnLoad takes precedence over heuristics above for $rootScope.showEmptyRelatedTables when true or false
                // showWriterEmptyRelatedOnLoad only applies to users with write permissions for current table
                if ($rootScope.reference.canCreate && typeof chaiseConfig.showWriterEmptyRelatedOnLoad === "boolean") {
                    $rootScope.showEmptyRelatedTables = chaiseConfig.showWriterEmptyRelatedOnLoad;
                }

                $rootScope.loading = related.length > 0;
                $timeout(function () {
                    recordAppUtils.updateRecordPage(false);
                });

            }).catch(recordAppUtils.genericErrorCatch);

        });

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
