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
             ['constants', 'DataUtils', 'Errors', 'ErrorService', '$log', 'logService', 'messageMap', 'modalBox', '$q', 'recordsetDisplayModes', 'recordTableUtils', '$rootScope',
             function (constants, DataUtils, Errors, ErrorService, $log, logService, messageMap, modalBox, $q, recordsetDisplayModes, recordTableUtils, $rootScope) {

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
         * @param  {Boolean} isUpdate indicates that the function has been triggered for update and not load.
         */
        function _processRequests(isUpdate) {
            if (!_haveFreeSlot() || $rootScope.pauseRequests) return;
            isUpdate = (typeof isUpdate === "boolean") ? isUpdate : false;

            if ($rootScope.isMainDirty) {
                readMainEntity(isUpdate).then(function (tuple) {
                    $rootScope.isMainDirty = false;
                    _processRequests(isUpdate);
                }).catch(genericErrorCatch);
                return;
            }

            var i = 0, model;

            // inline entities
            for (i = 0; i < $rootScope.columnModels.length && $rootScope.hasInline; i++) {
                model = $rootScope.columnModels[i];
                if (!model.isInline || !model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate, true);
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
                recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate, true);
            }

            // aggregates in inline
            for (i = 0; i < $rootScope.columnModels.length && $rootScope.hasInline; i++) {
                model = $rootScope.columnModels[i];
                if (!model.isInline || model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                recordTableUtils.updateColumnAggregates(model.tableModel, _processRequests, !isUpdate);
            }

            // aggregates in related
            for (i = 0; i < $rootScope.relatedTableModels.length; i++) {
                model = $rootScope.relatedTableModels[i];
                if (model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                recordTableUtils.updateColumnAggregates(model.tableModel, _processRequests, !isUpdate);
            }
        }

        /**
         * Read data for the main entity
         * @param {boolean} isUpdate whether this is update request or load
         * @param  {Object} the extra information that we want to log with the main request
         * @returns {Promise} It will be resolved with Page object.
         */
        function readMainEntity(isUpdate, logObj) {
            var defer = $q.defer();

            logObj = logObj || {};
            var action = isUpdate ? logService.logActions.RELOAD : logService.logActions.LOAD;
            logObj.action = logService.getActionString(action);
            logObj.stack = logService.getStackObject();

            var causes = (Array.isArray($rootScope.updateCauses) && $rootScope.updateCauses.length > 0) ? $rootScope.updateCauses : [];
            if (causes.length > 0) {
                logObj.stack = logService.addCausesToStack(logObj.stack, causes, $rootScope.updateStartTime);
            }
            $rootScope.reference.read(1, logObj).then(function (page) {
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

                $rootScope.updateCauses = [];
                $rootScope.updateStartTime = -1;

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
                model.isLoading = true;
                _readMainColumnAggregate(model, index, isUpdate, $rootScope.recordFlowControl.counter).then(function (res) {
                    $rootScope.recordFlowControl.occupiedSlots--;
                    model.dirtyResult = !res;
                    model.columnError = false;
                    _processRequests(isUpdate);
                }).catch(function (err) {
                    model.isLoading = false;
                    if (err instanceof ERMrest.QueryTimeoutError) {
                        model.columnError = true;
                    } else {
                        if (DataUtils.isObjectAndKeyDefined(err.errorData, 'redirectPath')) {
                            var redirectLink = UriUtils.createRedirectLinkFromPath(err.errorData.redirectPath);
                            err.errorData.redirectUrl = redirectLink.replace('record', 'recordset');
                        }
                        throw err;
                    }
                });
            });
        }

        /**
         * @private
         * Generate request for each individual aggregate columns.
         * Returns a promise. The resolved value denotes the success or failure.
         */
        function _readMainColumnAggregate(columnModel, index, isUpdate, current) {
            var defer = $q.defer();

            var action = isUpdate ? logService.logActions.RELOAD : logService.logActions.LOAD;
            var stackPath = logService.getStackPath("", logService.logStackPaths.PSEUDO_COLUMN);
            var logObj = {
                action: logService.getActionString(action, stackPath),
                stack: columnModel.logStack
            };
            columnModel.column.getAggregatedValue($rootScope.page, logObj).then(function (values) {
                columnModel.isLoading = false;
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


        function addCauseToModel(obj, cause) {
            // the time that will be logged with the request
            if (!Number.isInteger(obj.updateStartTime) || obj.updateStartTime === -1) {
                obj.updateStartTime = ERMrest.getElapsedTime();
            }

            if (cause && obj.updateCauses.indexOf(cause) === -1) {
                obj.updateCauses.push(cause);
            }
        }

        /**
         * sets the flag and calls the flow-control function to update the record page.
         * @param  {Boolean} isUpdate indicates that the function has been triggered for update and not load.
         * @param  {String} cause the cause of this update (if it's update and not load)
         * @param  {Array} changedContainers If this function is called because of multiple
         *                  changes on the page, then we cannot use a single "cause" and instead
         *                  this attribute will return the different parts of the page that have caused this.
         *                  Each array is an object with `cause`, `index`, and `isInline` attributes.
         */
        function updateRecordPage(isUpdate, cause, changedContainers) {

            if (!isUpdate) {
                $rootScope.recordFlowControl.occupiedSlots = 0;
                $rootScope.recordFlowControl.counter = 0;
            } else {
                // we want to update the main entity on update
                $rootScope.isMainDirty = true;

                addCauseToModel($rootScope, cause);
            }
            $rootScope.recordFlowControl.counter++;


            $rootScope.columnModels.forEach(function (m) {
                if (m.isAggregate) {
                    m.dirtyResult = true;
                } else if (m.isInline) {
                    m.tableModel.dirtyResult = true;

                    addCauseToModel(m.tableModel, cause);
                }
            });

            $rootScope.relatedTableModels.forEach(function (m) {
                m.tableModel.dirtyResult = true;
                addCauseToModel(m.tableModel, cause);
            });


            // update the cause list
            var uc = logService.updateCauses;
            var selfCause = {};
            selfCause[uc.RELATED_CREATE] = selfCause[uc.RELATED_INLINE_CREATE] = uc.ENTITY_CREATE;
            selfCause[uc.RELATED_DELETE] = selfCause[uc.RELATED_INLINE_DELETE] = uc.ENTITY_DELETE;
            selfCause[uc.RELATED_UPDATE] = selfCause[uc.RELATED_INLINE_UPDATE] = uc.ENTITY_UPDATE;
            if (Array.isArray(changedContainers)) {
                changedContainers.forEach(function (container) {
                    var c;

                    // add it to main causes
                    addCauseToModel($rootScope, container.cause);

                    // add it to inline related
                    $rootScope.columnModels.forEach(function (m, index) {
                        if (!m.isInline) return;

                        c = container.cause;
                        if (container.isInline && container.index === index) {
                            c = selfCause[c];
                        }

                        addCauseToModel(m.tableModel, c);
                    });

                    // add it to related
                    $rootScope.relatedTableModels.forEach(function (m, index) {
                        var c = container.cause;
                        if (!container.isInline && container.index === index) {
                            c = selfCause[c];
                        }

                        addCauseToModel(m.tableModel, c);
                    });
                });
            }

            $rootScope.pauseRequests = false;
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
            // show modal with different text if 400 Query Timeout Error
            if (exception instanceof ERMrest.QueryTimeoutError) {
                exception.subMessage = exception.message;
                exception.message = "The main entity cannot be retrieved. Refresh the page later to try again.";
                ErrorService.handleException(exception, true);
            } else {
                if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectPath')) {
                    var redirectLink = UriUtils.createRedirectLinkFromPath(exception.errorData.redirectPath);
                    exception.errorData.redirectUrl = redirectLink.replace('record', 'recordset');
                }
                throw exception;
            }
        }

        /**
         * Given reference of related or inline, will create appropriate table model.
         * @param  {ERMrest.Reference} reference Reference object.
         * @param  {string} context   the context string
         * @param  {boolean} isInline whether the table is inline or not
         */
        function getTableModel (reference, index, isInline) {
            var stackNode = logService.getStackNode(
                logService.logStackTypes.RELATED,
                reference.table,
                {source: reference.compressedDataSource, entity: true}
            );
            var currentStackPath = isInline ? logService.logStackPaths.RELATED_INLINE : logService.logStackPaths.RELATED;
            var logStackPath = logService.getStackPath("", currentStackPath);

            return {
                parentReference: $rootScope.reference,
                parentTuple: $rootScope.tuple,
                reference: reference,
                pageLimit: getPageSize(reference),
                isTableDisplay: reference.display.type == 'table',
                enableSort: true,
                rowValues: [],
                selectedRows: [],//TODO migth not be needed
                dirtyResult: true,
                isLoading: true,
                tableError: false,
                config: {
                    viewable: true,
                    editable: $rootScope.modifyRecord,
                    deletable: $rootScope.modifyRecord && $rootScope.showDeleteButton,
                    selectMode: modalBox.noSelect,
                    displayMode: (isInline ? recordsetDisplayModes.inline : recordsetDisplayModes.related),
                    containerIndex: index // TODO (could be optimized) can this be done in a better way?
                },
                logStack: logService.getStackObject(stackNode),
                logStackPath: logStackPath,
                updateCauses: [], // might not be needed
                updateStartTime: -1,
                flowControlObject: $rootScope.recordFlowControl,
                queryTimeoutTooltip: messageMap.queryTimeoutTooltip
            };
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
