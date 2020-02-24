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
                recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate, true, _afterUpdateRelatedEntity(model));
            }

            // main aggregates
            readMainAggregates(isUpdate);

            // related entites
            for (i = 0; i < $rootScope.relatedTableModels.length; i++) {
                model = $rootScope.relatedTableModels[i];
                if (!model.tableModel.dirtyResult) continue;
                if (!_haveFreeSlot()) return;
                recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate, true, _afterUpdateRelatedEntity(model));
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
         * When the data for inline or related entities are loaded,
         * - if there's no wait for, or waitfor is loaded: sets the pageContent value.
         * - otherwise it will not do anyting.
         */
        function _afterUpdateRelatedEntity(model) {
            return function (tableModel) {
                if (!model.hasWaitFor || model.waitForDataLoaded) {
                    model.pageContentInitialized = true;
                    model.pageContent = tableModel.page.getContent($rootScope.templateVariables);
                }
            };
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

            var causes = (Array.isArray($rootScope.reloadCauses) && $rootScope.reloadCauses.length > 0) ? $rootScope.reloadCauses : [];
            if (causes.length > 0) {
                logObj.stack = logService.addCausesToStack(logObj.stack, causes, $rootScope.reloadStartTime);
            }

            $rootScope.citationReady = false;
            (function (requestCauses, reloadStartTime) {
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

                    //whether citation is waiting for other data or we can show it on load
                    $rootScope.citationReady = ($rootScope.tuple.citation === null) || ($rootScope.tuple.citation.hasWaitFor);

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

                    $rootScope.templateVariables = tuple.templateVariables.values;
                    $rootScope.aggregateResults = new Array(1);

                    $rootScope.displayReady = true;

                    if (isUpdate) {
                        $rootScope.aggregateModels.forEach(function (agg, i) {
                            agg.processed = false;
                            agg.reloadCauses = requestCauses;
                            if (!Number.isInteger(agg.reloadStartTime) || agg.reloadStartTime === -1) {
                                agg.reloadStartTime = ERMrest.getElapsedTime();
                            }
                        });
                    }

                    $rootScope.reloadCauses = [];
                    $rootScope.reloadStartTime = -1;

                    defer.resolve(page);
                }).catch(function (err) {
                    defer.reject(err);
                });
            })(causes, $rootScope.reloadStartTime);


            return defer.promise;
        }

        /**
         * @private
         * creates the read request for aggregate columns of the main entity
         */
        function readMainAggregates(isUpdate) {
            $rootScope.aggregateModels.forEach(function (aggModel, index) {
                if (!_haveFreeSlot() || aggModel.processed) return;

                $rootScope.recordFlowControl.occupiedSlots++;
                aggModel.processed = true;

                _readMainColumnAggregate(aggModel, isUpdate, $rootScope.recordFlowControl.counter).then(function (res) {
                    $rootScope.recordFlowControl.occupiedSlots--;

                    $rootScope.aggregateModels[index].processed = res;
                }).catch(function (err) {
                    throw err;
                });
            });
        }

        /**
         * @private
         * Generate request for each individual aggregate columns.
         * Returns a promise. The resolved value denotes the success or failure.
         */
        function _readMainColumnAggregate(aggModel, isUpdate, current) {
            var defer = $q.defer();
            var agg = aggModel.model;

            // show spinner for all the dependent columns
            agg.objects.forEach(function (obj) {
                if (obj.column || obj.inline) {
                    $rootScope.columnModels[obj.index].isLoading = true;
                } else if (obj.related) {
                    $rootScope.relatedTableModels[obj.index].isLoading = true;
                }
            });

            var action = isUpdate ? logService.logActions.RELOAD : logService.logActions.LOAD;
            var stackPath = logService.getStackPath("", logService.logStackPaths.PSEUDO_COLUMN), stack = agg.logStack;
            if (Array.isArray(agg.reloadCauses) && agg.reloadCauses.length > 0) {
                stack = logService.addCausesToStack(stack, agg.reloadCauses, agg.reloadStartTime);
            }
            var logObj = {
                action: logService.getActionString(action, stackPath),
                stack: stack
            };
            agg.column.getAggregatedValue($rootScope.page, logObj).then(function (values) {
                if ($rootScope.recordFlowControl.counter !== current) {
                    return defer.resolve(false), defer.promise;
                }

                // use the returned value (assumption is that values is an array of 0)
                var val = values[0];

                //update the templateVariables
                var sourceDefinitions = $rootScope.reference.table.sourceDefinitions;
                if (agg.objects.length > 0 && Array.isArray(sourceDefinitions)) {
                    sourceDefinitions.forEach(function (k) {
                        if (val.templateVariables["$self"]) {
                            vm.templateVariables[k] = val.templateVariables["$self"];
                        }
                        if (val.templateVariables["$_self"]) {
                            vm.templateVariables["_" + k] = val.templateVariables["$_self"];
                        }
                    });
                }

                //update the aggregateResults
                $rootScope.aggregateResults[agg.columnName] = val;

                // attach the value if all has been returned
                agg.objects.forEach(function (obj) {
                    var hasAll
                    if (obj.citation) { // this means that the citation is available and not null
                        hasAll = $root.tuple.citation.waitFor.every(function (c) {
                            return c.isUnique || c.name in $rootScope.aggregateResults;
                        });
                        if (hasAll) {
                            // we just need to set this flag
                            $rootScope.citationReady = true;
                        }
                        return;
                    } else if (obj.column) {
                        var cmodel = $rootScope.columnModels[obj.index];
                        var hasAll = cmodel.column.waitFor.every(function (col) {
                            return col.isUnique || col.name in $rootScope.aggregateResults;
                        });
                        if (!(hasAll && (cmodel.column.name in $rootScope.aggregateResults || cmodel.column.isUnique))) return;

                        var displayValue = cmodel.column.sourceFormatPresentation(
                            $rootScope.templateVariables,
                            $rootScope.aggregateResults[cmodel.column.name],
                            $rootScope.tuple
                        );

                        cmodel.isLoading = false;
                        $rootScope.recordValues[obj.index] = displayValue;
                    } else if (obj.inline || obj.related) {
                        var model = obj.inline ? $rootScope.columnModels[obj.index] : $rootScope.relatedTableModels[obj.index];
                        var ref = model.tableModel.reference;
                        var hasAll = ref.sourceWaitFor.every(function (col) {
                            return col.isUnique || col.name in $rootScope.aggregateResults;
                        });

                        model.isLoading = false;
                        model.waitForDataLoaded = true;
                        // if the page data is already fetched, we can just popuplate the pageContent value.
                        if (model.tableModel.page && !model.tableModel.dirtyResult) {
                            model.pageContent = model.tableModel.page.getContent($rootScope.templateVariables);
                            model.pageContentInitialized = true;
                        }
                    }
                });

                // clear the causes
                agg.reloadCauses = [];
                agg.reloadStartTime = -1;

                return defer.resolve(true), defer.promise;
            }).catch(function (err) {
                if ($rootScope.recordFlowControl.counter !== current) {
                    return defer.resolve(false), defer.promise;
                }

                agg.objects.forEach(function (obj) {

                    //remove the spinner from the dependent columns
                    if (obj.column || obj.inline) {
                        $rootScope.columnModels[obj.index].isLoading = false;
                    } else if (obj.related) {
                        $rootScope.relatedTableModels[obj.index].isLoading = false;
                    }

                    if (!obj.column) return;

                    // show the timeout error in dependent models
                    if (err instanceof ERMrest.QueryTimeoutError) {
                        // TODO what about inline and related ones that timed out?
                        $rootScope.columnModels[obj.index].columnError = true;
                        return defer.resolve(true), defer.promise;
                    }

                });

                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * Given an object and cause string, will add it to the list of reloadCauses of the object.
         * It will also take care of adding reloadStartTime if it's necessary.
         * reloadStartTime captures the time that the model becomes dirty.
         */
        function _addCauseToModel(obj, cause) {
            // the time that will be logged with the request
            if (!Number.isInteger(obj.reloadStartTime) || obj.reloadStartTime === -1) {
                obj.reloadStartTime = ERMrest.getElapsedTime();
            }

            if (cause && obj.reloadCauses.indexOf(cause) === -1) {
                obj.reloadCauses.push(cause);
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

                _addCauseToModel($rootScope, cause);
            }
            $rootScope.recordFlowControl.counter++;

            $rootScope.columnModels.forEach(function (m) {
                if (m.isInline) {
                    m.tableModel.dirtyResult = true;
                    _addCauseToModel(m.tableModel, cause);
                }
            })

            $rootScope.relatedTableModels.forEach(function (m) {
                m.tableModel.dirtyResult = true;
                _addCauseToModel(m.tableModel, cause);
            });


            // update the cause list
            var uc = logService.reloadCauses;
            var selfCause = {};
            selfCause[uc.RELATED_CREATE] = selfCause[uc.RELATED_INLINE_CREATE] = uc.ENTITY_CREATE;
            selfCause[uc.RELATED_DELETE] = selfCause[uc.RELATED_INLINE_DELETE] = uc.ENTITY_DELETE;
            selfCause[uc.RELATED_UPDATE] = selfCause[uc.RELATED_INLINE_UPDATE] = uc.ENTITY_UPDATE;
            if (Array.isArray(changedContainers)) {
                changedContainers.forEach(function (container) {
                    var c;

                    // add it to main causes
                    _addCauseToModel($rootScope, container.cause);

                    // add it to inline related
                    $rootScope.columnModels.forEach(function (m, index) {
                        if (!m.isInline) return;

                        c = container.cause;
                        if (container.isInline && container.index === index) {
                            c = selfCause[c];
                        }

                        _addCauseToModel(m.tableModel, c);
                    });

                    // add it to related
                    $rootScope.relatedTableModels.forEach(function (m, index) {
                        var c = container.cause;
                        if (!container.isInline && container.index === index) {
                            c = selfCause[c];
                        }

                        _addCauseToModel(m.tableModel, c);
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
                reloadCauses: [], // might not be needed
                reloadStartTime: -1,
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
