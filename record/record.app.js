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

    .factory('constants', [function(){
        return {
            defaultPageSize: 25,
            MAX_CONCURENT_REQUEST: 4
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

    .factory('recordAppUtils',
             ['constants', 'DataUtils', 'Errors', '$log', 'logActions', 'modalBox', '$q', 'recordTableUtils', '$rootScope',
             function (constants, DataUtils, Errors, $log, logActions, modalBox, $q, recordTableUtils, $rootScope) {

        function haveFreeSlot() {
            var res = $rootScope.occupiedSlots < constants.MAX_CONCURENT_REQUEST;
            if (!res) {
                $log.debug("No free slot available.");
            }
            return res;
        }

        function processRequests(isUpdate) {
            if (!haveFreeSlot()) return;

            if ($rootScope.isMainDirty) {
                readMainEntity().then(function (tuple) {
                    $rootScope.isMainDirty = false;
                    processRequests(isUpdate);
                }).catch(genericErrorCatch);
                return;
            }

            var i = 0, model, logObject;

            // inline entities
            for (i = 0; i < $rootScope.columnModels.length && $rootScope.hasInline; i++) {
                model = $rootScope.columnModels[i];
                if (!model.isInline || !model.tableModel.dirtyResult) continue;
                if (!haveFreeSlot()) return;
                model.tableModel.logObject = getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordInlineUpdate : logActions.recordInlineRead);
                recordTableUtils.updateMainEntity(model.tableModel, processRequests, !isUpdate);
            }

            // main aggregates
            if ($rootScope.hasAggregate) {
                readMainAggregates(isUpdate);
            }

            // related entites
            for (i = 0; i < $rootScope.relatedTableModels.length; i++) {
                model = $rootScope.relatedTableModels[i];
                if (!model.tableModel.dirtyResult) continue;
                if (!haveFreeSlot()) return;
                model.tableModel.logObject = getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordRelatedUpdate : logActions.recordRelatedRead);
                recordTableUtils.updateMainEntity(model.tableModel, processRequests, !isUpdate);
            }

            // aggregates in inline
            for (i = 0; i < $rootScope.columnModels.length && $rootScope.hasInline; i++) {
                model = $rootScope.columnModels[i];
                if (!model.isInline || model.tableModel.dirtyResult) continue;
                if (!haveFreeSlot()) return;
                console.log("getting aggregates in inline");
                logObject = getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordInlineAggregateUpdate : logActions.recordInlineAggregate);
                recordTableUtils.updateColumnAggregates(model.tableModel, processRequests, logObject, !isUpdate);
            }

            // aggregates in related
            for (i = 0; i < $rootScope.relatedTableModels.length; i++) {
                model = $rootScope.relatedTableModels[i];
                if (model.tableModel.dirtyResult) continue;
                if (!haveFreeSlot()) return;
                console.log("getting aggregates in related");
                logObject = getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordRelatedAggregateUpdate : logActions.recordRelatedAggregate);
                recordTableUtils.updateColumnAggregates(model.tableModel, processRequests, logObject, !isUpdate);
            }
        }

        function readMainEntity() {
            var defer = $q.defer();

            $rootScope.reference.read(1, {action: logActions.recordRead}).then(function (page) {
                $log.info("Page: ", page);

                /*
                *  recordSetLink should be used to present user with  an option in case of no data found/more data found(>1)
                *  This could be link to RECORDSET or SEARCH.
                */
                var recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
                var tableDisplayName = page.reference.displayname.value;
                if (page.tuples.length < 1) {
                    throw new Errors.noRecordError({}, tableDisplayName, recordSetLink);
                }
                else if(page.hasNext || page.hasPrevious){
                    throw new Errors.multipleRecordError(tableDisplayName, recordSetLink);
                }

                $rootScope.page = page;
                var tuple = $rootScope.tuple = page.tuples[0];

                // Used directly in the record-display directive
                $rootScope.recordDisplayname = tuple.displayname;

                // Collate tuple.isHTML and tuple.values into an array of objects
                // i.e. {isHTML: false, value: 'sample'}
                $rootScope.recordValues = [];
                tuple.values.forEach(function(value, index) {
                    $rootScope.recordValues.push({
                        isHTML: tuple.isHTML[index],
                        value: value
                    });
                });

                $rootScope.displayReady = true;
                defer.resolve(page);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        function readMainAggregates(isUpdate) {
            $rootScope.columnModels.forEach(function (model, index) {
                if (!model.isAggregate || !haveFreeSlot() || !model.dirtyResult) return;
                $rootScope.occupiedSlots++;
                model.dirtyResult = false;
                readMainColumnAggregate(model.column, index, $rootScope.counter).then(function (res) {
                    $rootScope.occupiedSlots--;
                    model.dirtyResult = !res;
                    processRequests(isUpdate);
                }).catch(genericErrorCatch);
            });
        }

        function readMainColumnAggregate(column, index, current) {
            var defer = $q.defer();
            var logObject = column.reference.defaultLogInfo;
            logObject.action = logActions.recordAggregate;
            logObject.referrer = $rootScope.reference.defaultLogInfo;

            column.getAggregatedValue($rootScope.page, logObject).then(function (values) {
                if ($rootScope.counter !== current) {
                    return defer.resolve(false);
                }
                $rootScope.recordValues[index] = values[0];
                return defer.resolve(true);
            }).catch(function (err) {
                if ($rootScope.counter !== current) {
                    return defer.resolve(false);
                }
                return defer.reject(err);
            });
            return defer.promise;
        }

        function updateRecordPage(isUpdate) {
            if (!DataUtils.isInteger($rootScope.occupiedSlots)) {
                $rootScope.occupiedSlots = 0;
            }
            if (!DataUtils.isInteger($rootScope.counter)) {
                $rootScope.counter = 0;
            }
            $rootScope.counter++;

            $rootScope.columnModels.forEach(function (m) {
                if (m.isAggregate) {
                    m.dirtyResult = true;
                } else if (m.isInline) {
                    m.tableModel.dirtyResult = true;
                }
            });
            $rootScope.relatedTableModels.forEach(function (m) {
                m.tableModel.dirtyResult = true;
            });

            processRequests(isUpdate);
        }

        function genericErrorCatch(exception) {
            if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
                var redirectLink = UriUtils.createRedirectLinkFromPath(exception.errorData.redirectPath);
                exception.errorData.redirectUrl = redirectLink.replace('record', 'recordset');
            }
            throw exception;
        }

        function getTableModel (reference, context, fromTuple) {
            return {
                reference: reference,
                pageLimit: getPageSize(reference),
                displayType: reference.display.type,
                fromTuple: fromTuple,
                context: context,
                enableSort: true,
                rowValues: [],
                selectedRows: [],//TODO migth not be needed
                dirtyResult: true,
                config: {
                    viewable: true,
                    editable: $rootScope.modifyRecord,
                    deletable: $rootScope.modifyRecord && $rootScope.showDeleteButton,
                    selectMode: modalBox.noSelect
                }
            };
        }

        function getTableModelLogObject(tableModel, action) {
            var logObject = tableModel.reference.defaultLogInfo;
            logObject.referrer = $rootScope.reference.defaultLogInfo;
            logObject.action = action;
            return logObject;
        }

        /**
         * @private
         * returns page size of the display attribute in the object.
         * @param {ERMrest.Reference} reference Object reference that has the display attribute
         */
        function getPageSize(reference){
            return ((!angular.isUndefined(reference) && reference.display.defaultPageSize) ? reference.display.defaultPageSize:constants.defaultPageSize);
        }

        return {
            updateRecordPage: updateRecordPage,
            genericErrorCatch: genericErrorCatch,
            readMainEntity: readMainEntity,
            getTableModel: getTableModel
        };
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
