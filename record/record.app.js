(function() {
    'use strict';

    angular.module('chaise.record', [
        'ngSanitize',
        'ngCookies',
        'chaise.delete',
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.record.display',
        'chaise.record.table',
        'chaise.html',
        'chaise.utils',
        'ermrestjs',
        'ui.bootstrap'
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

    .run(['constants', 'DataUtils', 'ERMrest', 'ErrorService', 'headInjector', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window',
        function runApp(constants, DataUtils, ERMrest, ErrorService, headInjector, Session, UiUtils, UriUtils, $log, $rootScope, $window) {
        // try {
        var session,
            context = {};

        UriUtils.setOrigin();
        headInjector.addTitle();
        headInjector.addCustomCSS();

        $rootScope.modifyRecord = chaiseConfig.editRecord === false ? false : true;
        $rootScope.showDeleteButton = chaiseConfig.deleteRecord === true ? true : false;

        var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        context = $rootScope.context = UriUtils.parseURLFragment($window.location, context);

        // The context object won't change unless the app is reloaded
        context.appName = "record";

        DataUtils.verify(context.filter, 'No filter was defined. Cannot find a record without a filter.');

        ERMrest.appLinkFn(UriUtils.appTagToURL);
        Session.getSession().then(function getSession(_session) {
            session = _session;

            return ERMrest.resolve(ermrestUri, {cid: context.appName});
        }, function(exception){
            // do nothing but return without a session
            return ERMrest.resolve(ermrestUri, {cid: context.appName});
        }).then(function getReference(reference) {
            // if the user can fetch the reference, they can see the content for the rest of the page
            // set loading to force the loading text to appear and to prevent the on focus from firing while code is initializing
            $rootScope.loading = true;
            // $rootScope.reference != reference after contextualization
            $rootScope.reference = reference.contextualize.detailed;
            $rootScope.reference.session = session;

            $log.info("Reference: ", $rootScope.reference);

            // There should only ever be one entity related to this reference
            return $rootScope.reference.read(1);
        }, function error(exception) {
            throw exception;
        }).then(function getPage(page) {
            $log.info("Page: ", page);

            if (page.tuples.length < 1) {
                var noDataError = ErrorService.noRecordError(context.filter.filters);
                throw noDataError;
            }

            var tuple = $rootScope.tuple = page.tuples[0];
            // Used directly in the record-display directive
            $rootScope.recordDisplayname = tuple.displayname;

            // related references
            $rootScope.relatedReferences = $rootScope.reference.related(tuple);

            // Collate tuple.isHTML and tuple.values into an array of objects
            // i.e. {isHTML: false, value: 'sample'}
            $rootScope.recordValues = [];
            tuple.values.forEach(function(value, index) {
                $rootScope.recordValues.push({
                    isHTML: tuple.isHTML[index],
                    value: value
                });
            });

            $rootScope.columns = $rootScope.reference.columns;

            $rootScope.tableModels = [];
            $rootScope.lastRendered = null;

            for (var i = 0; i < $rootScope.relatedReferences.length; i++) {
                $rootScope.relatedReferences[i] = $rootScope.relatedReferences[i].contextualize.compactBrief;

                var pageSize;
                if ($rootScope.relatedReferences[i].display.defaultPageSize) {
                    pageSize = $rootScope.relatedReferences[i].display.defaultPageSize;
                } else {
                    pageSize = constants.defaultPageSize;
                }

                (function(i) {
                    $rootScope.relatedReferences[i].read(pageSize).then(function (page) {
                        var model = {
                            reference: $rootScope.relatedReferences[i],
                            columns: $rootScope.relatedReferences[i].columns,
                            page: page,
                            pageLimit: ($rootScope.relatedReferences[i].display.defaultPageSize ? $rootScope.relatedReferences[i].display.defaultPageSize : constants.defaultPageSize),
                            hasNext: page.hasNext,      // used to determine if a link should be shown
                            hasLoaded: true,            // used to determine if the current table and next table should be rendered
                            open: true,                 // to define if the accordion is open or closed
                            enableSort: true,           // allow sorting on table
                            sortby: null,               // column name, user selected or null
                            sortOrder: null,            // asc (default) or desc
                            rowValues: [],              // array of rows values
                            search: null,                // search term
                            displayType: $rootScope.relatedReferences[i].display.type,
                            context: "compact/brief",
                            fromTuple: $rootScope.tuple
                        };
                        model.rowValues = DataUtils.getRowValuesFromPage(page);
                        model.config = {
                            viewable: true,
                            editable: $rootScope.modifyRecord,
                            deletable: $rootScope.modifyRecord && $rootScope.showDeleteButton,
                            selectable: false
                        };
                        $rootScope.tableModels[i] = model;
                    }, function readFail(error) {
                        var model = {
                            hasLoaded: true
                        };
                        $rootScope.tableModels[i] = model;
                        throw error;
                    }).catch(function(e) {
                        // The .catch from the outer promise won't catch errors from this closure
                        // so a .catch needs to be appended here.
                        throw e;
                    });
                })(i);
            }
        }).catch(function genericCatch(exception) {
            throw exception;
        });
    // } catch (exception) {
    //     throw exception;
    // }

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
