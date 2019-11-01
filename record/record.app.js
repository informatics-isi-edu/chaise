(function() {
    'use strict';

/* Configuration of the Record App */
    angular.module('chaise.configure-record', ['chaise.config'])

    .constant('appName', 'record')

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

    .run(['AlertsService', 'ConfigUtils', 'DataUtils', 'ERMrest', 'FunctionUtils', 'headInjector', 'MathUtils', 'messageMap', 'recordAppUtils', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$timeout', '$window',
        function runApp(AlertsService, ConfigUtils, DataUtils, ERMrest, FunctionUtils, headInjector, MathUtils, messageMap, recordAppUtils, Session, UiUtils, UriUtils, $log, $rootScope, $timeout, $window) {

        var session,
            errorData = {};

        var context = ConfigUtils.getContextJSON(),
            chaiseConfig = ConfigUtils.getConfigJSON();

        context.chaiseBaseURL = UriUtils.chaiseBaseURL();

        $rootScope.displayReady = false;
        $rootScope.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app

        UriUtils.setOrigin();

        $rootScope.showEmptyRelatedTables = false;
        $rootScope.modifyRecord = chaiseConfig.editRecord === false ? false : true;
        $rootScope.showDeleteButton = chaiseConfig.deleteRecord === true ? true : false;

        var res = UriUtils.chaiseURItoErmrestURI($window.location, true);
        var ermrestUri = res.ermrestUri,
            pcid = res.pcid,
            ppid = res.ppid,
            isQueryParameter = res.isQueryParameter;

        context.catalogID = res.catalogId;

        FunctionUtils.registerErmrestCallbacks();

        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function() {

            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            ERMrest.resolve(ermrestUri, { cid: context.cid, pid: context.pid, wid: context.wid }).then(function getReference(reference) {
                context.filter = reference.location.filter;
                context.facets = reference.location.facets;

                DataUtils.verify((context.filter || context.facets), 'No filter or facet was defined. Cannot find a record without a filter or facet.');

                session = Session.getSessionValue();
                if (!session && Session.showPreviousSessionAlert()) AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);

                // $rootScope.reference != reference after contextualization
                $rootScope.reference = reference.contextualize.detailed;
                $rootScope.reference.session = session;
                $log.info("Reference: ", $rootScope.reference);

                var logObj = {};
                if (pcid) logObj.pcid = pcid;
                if (ppid) logObj.ppid = ppid;
                if (isQueryParameter) logObj.cqp = 1;
                return recordAppUtils.readMainEntity(false, logObj);
            }).then(function (page) {
                var tuple = page.tuples[0];


                // update the window location with tuple to remove query params (namely ppid and pcid)
                // and also change the url to always be based on RID
                var url = tuple.reference.contextualize.detailed.appLink;
                url = url.substring(0, url.lastIndexOf("?"));

                // add hideNavbar param back if true
                if (context.hideNavbar) url += "?hideNavbar=" + context.hideNavbar;
                $window.history.replaceState('', '', url);

                // related references
                var related = $rootScope.reference.generateRelatedList(tuple);

                var columns = $rootScope.reference.generateColumnsList(tuple), model;

                $log.info("default export template is accessible through `defaultExportTemplate` variable. To get the string value of it call `angular.toJson(defaultExportTemplate, 1)`");
                $window.defaultExportTemplate = $rootScope.reference.defaultExportTemplate;

                $rootScope.recordFlowControl = new recordAppUtils.FlowControlObject();

                $rootScope.hasAggregate = false;
                $rootScope.hasInline = false;
                $rootScope.columnModels = [];
                columns.forEach(function (col, index) {
                    model = {};

                    // aggregate
                    if (col.isPathColumn && col.hasAggregate) {
                        model = {
                            columnError: false,
                            isLoading: true,
                            isAggregate: true,
                            dirtyResult: true
                        };
                        $rootScope.hasAggregate = true;
                    }

                    // inline
                    else if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
                        var reference = col.reference.contextualize.compactBriefInline;
                        model = {
                            tableError: false,
                            isInline: true,
                            isTableDisplay: reference.display.type == 'table',
                            displayname: reference.displayname,
                            tableModel: recordAppUtils.getTableModel(reference, "compact/brief/inline", $rootScope.tuple, $rootScope.reference)
                        };
                        $rootScope.hasInline = true;
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
                    if (!$rootScope.showEmptyRelatedTables && $rootScope.modifyRecord && ref.canCreate) {
                        $rootScope.showEmptyRelatedTables = true;
                    }

                    $rootScope.relatedTableModels.push({
                        open: openByDefault,
                        isTableDisplay: ref.display.type == 'table',
                        displayname: ref.displayname,
                        tableModel: recordAppUtils.getTableModel(ref, "compact/brief", $rootScope.tuple, $rootScope.reference),
                        baseTableName: $rootScope.reference.displayname
                    });
                });

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
