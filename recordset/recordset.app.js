(function() {
    'use strict';

    // The Chaise RecordSet module
    angular.module('chaise.recordset', [
        'chaise.authen',
        'chaise.errors',
        'chaise.faceting',
        'chaise.footer',
        'chaise.html',
        'chaise.inputs',
        'chaise.modal',
        'chaise.navbar',
        'chaise.record.table',
        'chaise.resizable',
        'chaise.utils',
        'ermrestjs',
        'ngCookies',
        'ngSanitize',
        'ngAnimate',
        'duScroll',
        'ui.bootstrap'])

    .config(['$cookiesProvider', function($cookiesProvider) {
        $cookiesProvider.defaults.path = '/';
    }])

    // Register the 'context' object which can be accessed by config and other
    // services.
    .constant('context', {
        appName:'recordset',
        mainURI: null,  // the main URL portion up to filters (without modifiers)
        catalogID: null,
        tableName: null,
        chaiseBaseURL: null
    })

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

    // Register the 'recordsetModel' object, which can be accessed by other
    // services, but cannot be access by providers (and config, apparently).
    .value('recordsetModel', {
        hasLoaded: false,
        reference: null,
        tableDisplayName: null,
        columns: [],
        sortby: null,       // column name, user selected or null
        sortOrder: null,    // asc (default) or desc
        enableAutoSearch: true,
        enableSort: true,   // allow sorting
        page: null,         // current page
        rowValues: [],      // array of rows values, each value has this structure {isHTML:boolean, value:value}
        selectedRows: [],   // array of selected rows
        search: null,       // search term
        pageLimit: 25,      // number of rows per page
        config: {}
    })

    // Register work to be performed after loading all modules
    .run(['AlertsService', 'context', 'DataUtils', 'ERMrest', 'FunctionUtils', 'headInjector', 'MathUtils', 'messageMap', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', 'modalBox', 'logActions',
        function(AlertsService, context, DataUtils, ERMrest, FunctionUtils, headInjector, MathUtils, messageMap, recordsetModel, Session, UiUtils, UriUtils, $log, $rootScope, $window, modalBox, logActions) {
        try {
            var session;

            headInjector.setupHead();

            UriUtils.setOrigin();

            context.chaiseBaseURL = $window.location.href.replace($window.location.hash, '');
            var modifyEnabled = chaiseConfig.editRecord === false ? false : true;
            var deleteEnabled = chaiseConfig.deleteRecord === true ? true : false;
            var showFaceting = chaiseConfig.showFaceting === true ? true : false;

            recordsetModel.config = {
                viewable: true,
                editable: modifyEnabled,
                deletable: modifyEnabled && deleteEnabled,
                selectMode: modalBox.noSelect,
                showFaceting: showFaceting,
                facetPanelOpen: showFaceting
            };

            $rootScope.alerts = AlertsService.alerts;

            $rootScope.location = $window.location.href;
            recordsetModel.hasLoaded = false;
            $rootScope.context = context;

            context.pageId = MathUtils.uuid();

            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);


            FunctionUtils.registerErmrestCallbacks();

            // Subscribe to on change event for session
            var subId = Session.subscribeOnChange(function() {

                // Unsubscribe onchange event to avoid this function getting called again
                Session.unsubscribeOnChange(subId);

                ERMrest.resolve(ermrestUri, { cid: context.appName, pid: context.pageId, wid: $window.name }).then(function getReference(reference) {
                    session = Session.getSessionValue();
                    if (!session && Session.showPreviousSessionAlert()) AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);

                    var location = reference.location;

                    // only allowing single column sort here
                    if (location.sortObject) {
                        recordsetModel.sortby = location.sortObject[0].column;
                        recordsetModel.sortOrder = (location.sortObject[0].descending ? "desc" : "asc");
                    }
                    context.catalogID = reference.table.schema.catalog.id;
                    context.tableName = reference.table.name;

                    recordsetModel.reference = reference.contextualize.compact;
                    recordsetModel.context = "compact";
                    recordsetModel.reference.session = session;
                    recordsetModel.tableComment = recordsetModel.reference.table.comment;

                    $log.info("Reference:", recordsetModel.reference);

                    if (location.queryParams.limit) {
                        recordsetModel.pageLimit = parseInt(location.queryParams.limit);
                    } else if (recordsetModel.reference.display.defaultPageSize) {
                        recordsetModel.pageLimit = recordsetModel.reference.display.defaultPageSize;
                    } else {
                        recordsetModel.pageLimit = 25;
                    }
                    recordsetModel.tableDisplayName = recordsetModel.reference.displayname;

                    recordsetModel.search = recordsetModel.reference.location.searchTerm;

                    recordsetModel.logObject = {action: logActions.recordsetLoad};

                    recordsetModel.readyToInitialize = true;
                 }).catch(function genericCatch(exception) {
                     $log.warn(exception);
                     recordsetModel.hasLoaded = true;
                     if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
                         exception.errorData.redirectUrl = UriUtils.createRedirectLinkFromPath(exception.errorData.redirectPath);
                     }
                     throw exception;
                 });

            });

            /**
             * Whenever recordset updates the url (no reloading and no history stack),
             * it saves the location in $rootScope.location.
             * When address bar is changed, this code compares the address bar location
             * with the last save recordset location. If it's the same, the change of url was
             * done internally, do not refresh page. If not, the change was done manually
             * outside recordset, refresh page.
             */
            UriUtils.setLocationChangeHandling();


            // This is to allow the dropdown button to open at the top/bottom depending on the space available
            UiUtils.setBootstrapDropdownButtonBehavior();
        } catch (exception) {
            // pass to error handler
            throw exception;
        }
    }]);

})();
