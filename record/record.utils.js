(function() {
    'use strict';

    angular.module('chaise.record')

    .factory('constants', [function(){
        return {
            defaultPageSize: 25,
            MAX_CONCURENT_REQUEST: 6
        };
    }])

    .factory('recordAppUtils',
             ['constants', 'DataUtils', 'Errors', '$log', 'logActions', 'modalBox', '$q', 'recordTableUtils', '$rootScope',
             function (constants, DataUtils, Errors, $log, logActions, modalBox, $q, recordTableUtils, $rootScope) {

        /**
         * returns true if we have free slots for requests.
         * @private
         */
        function _haveFreeSlot() {
            var res = $rootScope.recordFlowControl.occupiedSlots < $rootScope.recordFlowControl.maxRequests;
            if (!res) {
                $log.debug("No free slot available.");
            }
            return res;
        }

        /**
         * @private
         * Flow-control logic for record app.
         * This will go through different sections of the page and will update them
         * if it's needed to.
         */
        function _processRequests(isUpdate) {
            if (!_haveFreeSlot() || $rootScope.pauseRequests) return;

            if ($rootScope.isMainDirty) {
                readMainEntity().then(function (tuple) {
                    $rootScope.isMainDirty = false;
                    _processRequests(isUpdate);
                }).catch(genericErrorCatch);
                return;
            }

            var i = 0, model, logObject;

            // inline entities
            for (i = 0; i < $rootScope.columnModels.length && $rootScope.hasInline; i++) {
                model = $rootScope.columnModels[i];
                if (!model.isInline || !model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                model.tableModel.logObject = _getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordInlineUpdate : logActions.recordInlineRead);
                recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate);
            }

            // main aggregates
            if ($rootScope.hasAggregate) {
                readMainAggregates(isUpdate);
            }

            // related entites
            for (i = 0; i < $rootScope.relatedTableModels.length; i++) {
                model = $rootScope.relatedTableModels[i];
                if (!model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                model.tableModel.logObject = _getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordRelatedUpdate : logActions.recordRelatedRead);
                recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate);
            }

            // aggregates in inline
            for (i = 0; i < $rootScope.columnModels.length && $rootScope.hasInline; i++) {
                model = $rootScope.columnModels[i];
                if (!model.isInline || model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                logObject = _getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordInlineAggregateUpdate : logActions.recordInlineAggregate);
                recordTableUtils.updateColumnAggregates(model.tableModel, _processRequests, logObject, !isUpdate);
            }

            // aggregates in related
            for (i = 0; i < $rootScope.relatedTableModels.length; i++) {
                model = $rootScope.relatedTableModels[i];
                if (model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                logObject = _getTableModelLogObject(model.tableModel, isUpdate ? logActions.recordRelatedAggregateUpdate : logActions.recordRelatedAggregate);
                recordTableUtils.updateColumnAggregates(model.tableModel, _processRequests, logObject, !isUpdate);
            }
        }

        /**
         * Read data for the main entity
         * @returns {Promise} It will be resolved with Page object.
         */
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

        /**
         * @private
         * creates the read request for aggregate columns of the main entity
         */
        function readMainAggregates(isUpdate) {
            $rootScope.columnModels.forEach(function (model, index) {
                if (!model.isAggregate || !_haveFreeSlot() || !model.dirtyResult) return;
                $rootScope.recordFlowControl.occupiedSlots++;
                model.dirtyResult = false;
                _readMainColumnAggregate(model.column, index, $rootScope.recordFlowControl.counter).then(function (res) {
                    $rootScope.recordFlowControl.occupiedSlots--;
                    model.dirtyResult = !res;
                    _processRequests(isUpdate);
                }).catch(genericErrorCatch);
            });
        }

        /**
         * @private
         * Generate request for each individual aggregate columns.
         * Returns a promise. The resolved value denotes the success or failure.
         */
        function _readMainColumnAggregate(column, index, current) {
            var defer = $q.defer();
            var logObject = column.reference.defaultLogInfo;
            logObject.action = logActions.recordAggregate;
            logObject.referrer = $rootScope.reference.defaultLogInfo;

            column.getAggregatedValue($rootScope.page, logObject).then(function (values) {
                if ($rootScope.recordFlowControl.counter !== current) {
                    return defer.resolve(false);
                }
                $rootScope.recordValues[index] = values[0];
                return defer.resolve(true);
            }).catch(function (err) {
                if ($rootScope.recordFlowControl.counter !== current) {
                    return defer.resolve(false);
                }
                return defer.reject(err);
            });
            return defer.promise;
        }

        /**
         * sets the flag and calls the flow-control function to update the record page.
         * @param  {Boolean} isUpdate indicates that the function has been triggered for update and not load.
         */
        function updateRecordPage(isUpdate) {
            if (!isUpdate) {
                $rootScope.recordFlowControl.occupiedSlots = 0;
                $rootScope.recordFlowControl.counter = 0;
            }
            $rootScope.recordFlowControl.counter++;

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

            _processRequests(isUpdate);
        }


        /**
         * will pause the requests that are pending for updating the page.
         * Currently it's only setting a variable, but we might want to add
         * more logic later.
         */
        function pauseUpdateRecordPage() {
            $rootScope.pauseRequests = true;
        }

        /**
         * Resume the requests after pausing
         */
        function resumeUpdateRecordPage() {
            if (!$rootScope.pauseRequests) return;
            $rootScope.pauseRequests = false;
            _processRequests(true);
        }

        /**
         * The genetic error catch for record app.
         * @param  {object} exception error object
         */
        function genericErrorCatch(exception) {
            if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
                var redirectLink = UriUtils.createRedirectLinkFromPath(exception.errorData.redirectPath);
                exception.errorData.redirectUrl = redirectLink.replace('record', 'recordset');
            }
            throw exception;
        }

        /**
         * Given reference of related or inline, will create appropriate table model.
         * @param  {ERMrest.Reference} reference Reference object.
         * @param  {string} context   the context string
         * @param  {ERMrest.tuple} fromTuple the main tuple
         */
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
                },
                flowControlObject: $rootScope.recordFlowControl
            };
        }

        /**
         * @private
         * Returns appropriate log object, for the related or inline table model.
         */
        function _getTableModelLogObject(tableModel, action) {
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

        function FlowControlObject (maxRequests) {
            maxRequests = maxRequests || constants.MAX_CONCURENT_REQUEST;
            recordTableUtils.FlowControlObject.call(this, maxRequests);
        }

        return {
            updateRecordPage: updateRecordPage,
            genericErrorCatch: genericErrorCatch,
            readMainEntity: readMainEntity,
            getTableModel: getTableModel,
            FlowControlObject: FlowControlObject,
            pauseUpdateRecordPage: pauseUpdateRecordPage,
            resumeUpdateRecordPage: resumeUpdateRecordPage
        };
    }]);

})();
