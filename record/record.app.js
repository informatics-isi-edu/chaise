(function() {
    'use strict';

    angular.module('chaise.record', [
        'ngSanitize',
        'ngCookies',
        'ngAnimate',
        'duScroll',
        'chaise.alerts',
        'chaise.delete',
        'chaise.errors',
        'chaise.faceting',
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

    .run(['AlertsService', 'DataUtils', 'ERMrest', 'FunctionUtils', 'headInjector', '$log', 'MathUtils', 'messageMap', 'recordAppUtils',  '$rootScope', 'Session', '$timeout', 'UiUtils', 'UriUtils', '$window',
        function runApp(AlertsService, DataUtils, ERMrest, FunctionUtils, headInjector, $log, MathUtils, messageMap, recordAppUtils, $rootScope, Session, $timeout, UiUtils, UriUtils , $window) {

        var session,
            context = {},
            errorData = {};
        $rootScope.displayReady = false;
        $rootScope.showSpinner = false; // this property is set from common modules for controlling the spinner at a global level that is out of the scope of the app

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

        FunctionUtils.registerErmrestCallbacks();

        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function() {

            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            ERMrest.resolve(ermrestUri, { cid: context.appName, pid: context.pageId, wid: $window.name }).then(function getReference(reference) {
                context.filter = reference.location.filter;
                context.facets = reference.location.facets;

                DataUtils.verify((context.filter || context.facets), 'No filter or facet was defined. Cannot find a record without a filter or facet.');

                session = Session.getSessionValue();
                if (!session && Session.showPreviousSessionAlert()) AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);

                // $rootScope.reference != reference after contextualization
                $rootScope.reference = reference.contextualize.detailed;
                $rootScope.reference.session = session;
                $log.info("Reference: ", $rootScope.reference);

                return recordAppUtils.readMainEntity();
            }).then(function (page) {
                var tuple = page.tuples[0];

                // related references
                var related = $rootScope.reference.related(tuple);

                var columns = $rootScope.reference.generateColumnsList(tuple), model;

                $rootScope.hasAggregate = false;
                $rootScope.hasInline = false;
                $rootScope.columnModels = [];
                columns.forEach(function (col, index) {
                    model = {};

                    // aggregate
                    if (col.isPathColumn && col.hasAggregate) {
                        model = {
                            isAggregate: true,
                            dirtyResult: true
                        };
                        $rootScope.hasAggregate = true;
                    }

                    // inline
                    else if (col.isInboundForeignKey || (col.isPathColumn && col.hasPath && !col.isUnique && !col.hasAggregate)) {
                        var reference = col.reference.contextualize.compactBriefInline;
                        model = {
                            isInline: true,
                            displayType: reference.display.type,
                            displayname: reference.displayname,
                            tableModel: recordAppUtils.getTableModel(reference, "compact/brief/inline")
                        };
                        $rootScope.hasInline = true;
                    }

                    model.column = col;
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
                        displayType: ref.display.type,
                        displayname: ref.displayname,
                        tableModel: recordAppUtils.getTableModel(ref, "compact/brief", $rootScope.tuple)
                    });
                });

                $rootScope.loading = related.length > 0;
                $timeout(function () {
                    recordAppUtils.updateRecordPage();
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
