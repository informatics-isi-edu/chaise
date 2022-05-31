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
             ['constants', 'DataUtils', 'Errors', 'ErrorService', '$log', 'logService', 'messageMap', 'modalBox', '$q', 'recordsetDisplayModes', 'recordTableUtils', '$rootScope', 'UriUtils',
             function (constants, DataUtils, Errors, ErrorService, $log, logService, messageMap, modalBox, $q, recordsetDisplayModes, recordTableUtils, $rootScope, UriUtils) {

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

            var i = 0, model, reqModel, activeListModel;

            // requests (inline, aggrgates, entityset, related)
            // please refer to Reference.activeList documentation for the order of requests
            for (i = 0; i < $rootScope.requestModels.length; i++) {
                if (!_haveFreeSlot()) return;
                reqModel = $rootScope.requestModels[i];
                activeListModel = reqModel.activeListModel;

                if (reqModel.processed) continue;

                reqModel.processed = true;

                // inline
                if (activeListModel.inline) {
                    model = $rootScope.columnModels[activeListModel.index];
                    if (model.tableModel.dirtyResult) {
                        // will take care of adding to occpuied slots
                        recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate, true, _afterUpdateRelatedEntity(model));
                    }
                    continue;
                }

                // related
                if (activeListModel.related) {
                    model = $rootScope.relatedTableModels[activeListModel.index];
                    if (model.tableModel.dirtyResult) {
                        // will take care of adding to occpuied slots
                        recordTableUtils.updateMainEntity(model.tableModel, _processRequests, !isUpdate, true, _afterUpdateRelatedEntity(model));
                    }
                    continue;
                }

                // entityset or aggregate
                _updatePseudoColumn(reqModel, isUpdate, $rootScope.recordFlowControl.counter);
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
         * - if there's no wait for, or waitfor is loaded: sets the tableMarkdownContent value.
         * - otherwise it will not do anyting.
         */
        function _afterUpdateRelatedEntity(model) {
            return function (tableModel, res) {
                model.processed = !res;
                /*
                 * the returned `res` boolean indicates whether we should consider this response final or not.
                 * it doesn't necessarily mean that the response was successful, so we should not use the page blindly.
                 * If the request errored out (timeout or other types of error) tableModel.page will be undefined.
                 */
                if (res && tableModel.page && (!model.hasWaitFor || model.waitForDataLoaded)) {
                    model.tableMarkdownContentInitialized = true;
                    model.tableMarkdownContent = tableModel.page.getContent($rootScope.templateVariables);
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

            // clear the value of citation, so we can fetch it again.
            if (DataUtils.isObjectAndNotNull($rootScope.reference.citation)) {
                $rootScope.citationReady = false;
            } else {
                $rootScope.citationReady = true;
                $rootScope.citation = null;
            }

            logObj = logObj || {};
            var action = isUpdate ? logService.logActions.RELOAD : logService.logActions.LOAD;
            logObj.action = logService.getActionString(action);
            logObj.stack = logService.getStackObject();

            var causes = (Array.isArray($rootScope.reloadCauses) && $rootScope.reloadCauses.length > 0) ? $rootScope.reloadCauses : [];
            if (causes.length > 0) {
                logObj.stack = logService.addCausesToStack(logObj.stack, causes, $rootScope.reloadStartTime);
            }

            // making sure we're asking for TRS for the main entity
            $rootScope.reference.read(1, logObj, false, false, true).then(function (page) {
                $log.info("Page: ", page);

                var recordSetLink;
                var tableDisplayName = page.reference.displayname.value;
                if (page.tuples.length < 1) {
                    //  recordSetLink should be used to present user with an option in case of no data found
                    recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
                    throw new Errors.noRecordError({}, tableDisplayName, recordSetLink);
                }
                else if(page.hasNext || page.hasPrevious){
                    recordSetLink = page.reference.contextualize.compact.appLink;
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

                // the initial values for the templateVariables
                $rootScope.templateVariables = tuple.templateVariables.values;
                // the aggregate values
                $rootScope.aggregateResults = {};
                // indicator that the entityset values are fetched
                $rootScope.entitySetResults = {};

                //whether citation is waiting for other data or we can show it on load
                var citation = $rootScope.reference.citation;
                if (DataUtils.isObjectAndNotNull(citation)) {
                    $rootScope.citationReady = !citation.hasWaitFor;
                    if ($rootScope.citationReady) {
                        $rootScope.citation = citation.compute(tuple, $rootScope.templateVariables);
                    }
                } else {
                    $rootScope.citationReady = true;
                    $rootScope.citation = null;
                }

                $rootScope.displayReady = true;

                $rootScope.reloadCauses = [];
                $rootScope.reloadStartTime = -1;

                defer.resolve(page);
            }).catch(function (err) {
                defer.reject(err);
            });


            return defer.promise;
        }

        /**
         * @private
         * _processRequests calls this to fetch the value of pseudo-columns (aggregate and entityset)
         */
        function _updatePseudoColumn(reqModel, isUpdate, counter) {
            _readPseudoColumn(reqModel, isUpdate, $rootScope.recordFlowControl.counter).then(function (res) {
                $rootScope.recordFlowControl.occupiedSlots--;

                reqModel.processed = res;

                _processRequests(isUpdate);
            }).catch(function (err) {
                throw err;
            });
        }

        /**
         * @private
         * Generate request for each individual aggregate columns.
         * Returns a promise. The resolved value denotes the success or failure.
         */
        function _readPseudoColumn(recordModel, isUpdate, current) {
            var defer = $q.defer();
            var activeListModel = recordModel.activeListModel;

            // show spinner for all the dependent columns
            activeListModel.objects.forEach(function (obj) {
                if (obj.column || obj.inline) {
                    $rootScope.columnModels[obj.index].isLoading = true;
                } else if (obj.related) {
                    $rootScope.relatedTableModels[obj.index].isLoading = true;
                }
            });

            var action = isUpdate ? logService.logActions.RELOAD : logService.logActions.LOAD;
            var stack = recordModel.logStack;
            if (Array.isArray(recordModel.reloadCauses) && recordModel.reloadCauses.length > 0) {
                stack = logService.addCausesToStack(stack, recordModel.reloadCauses, recordModel.reloadStartTime);
            }
            var logObj = {
                action: logService.getActionString(action, recordModel.logStackPath),
                stack: recordModel.logStack
            };

            var cb;
            if (activeListModel.entityset) {
                cb = recordModel.reference.read(getPageSize(recordModel.reference), logObj);
            } else {
                cb = activeListModel.column.getAggregatedValue($rootScope.page, logObj);
            }

            cb.then(function (values) {
                if ($rootScope.recordFlowControl.counter !== current) {
                    return defer.resolve(false), defer.promise;
                }

                // remove the column error (they might retry)
                activeListModel.objects.forEach(function (obj) {
                    if (obj.column) {
                        $rootScope.columnModels[obj.index].columnError = false;
                    }
                })

                //update the templateVariables
                var sourceDefinitions = $rootScope.reference.table.sourceDefinitions;
                var sm = sourceDefinitions.sourceMapping[activeListModel.column.name];

                if (activeListModel.entityset) { // entitysets
                    // this check is unnecessary, otherwise ermrestjs wouldn't add them to the active list
                    // but for consistency I left this check here
                    // entitysets are fetched to be used in waitfor, so we don't need to do anything else with
                    // the returned object apart from updating the templateVariables
                    if (activeListModel.objects.length > 0 && Array.isArray(sm)) {
                        sm.forEach(function (k) {
                            // the returned values is a page object in this case
                            $rootScope.templateVariables[k] = values.templateVariables;
                        });
                    }

                    // update the entitySetResults (we're just using this to make sure it's done)
                    $rootScope.entitySetResults[activeListModel.column.name] = true;
                } else { // aggregates
                    // use the returned value (assumption is that values is an array of 0)
                    var val = values[0];

                    if (activeListModel.objects.length > 0 && Array.isArray(sm)) {
                        sm.forEach(function (k) {
                            if (val.templateVariables["$self"]) {
                                $rootScope.templateVariables[k] = val.templateVariables["$self"];
                            }
                            if (val.templateVariables["$_self"]) {
                                $rootScope.templateVariables["_" + k] = val.templateVariables["$_self"];
                            }
                        });
                    }

                    //update the aggregateResults
                    $rootScope.aggregateResults[activeListModel.column.name] = val;
                }

                // attach the value if all has been returned
                _attachPseudoColumnValue(activeListModel);

                // clear the causes
                recordModel.reloadCauses = [];
                recordModel.reloadStartTime = -1;

                return defer.resolve(true), defer.promise;
            }).catch(function (err) {
                if ($rootScope.recordFlowControl.counter !== current) {
                    return defer.resolve(false), defer.promise;
                }

                activeListModel.objects.forEach(function (obj) {

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
         * @private
         * This function is called inside `_readPseudoColumn`, after
         * the value is attached to the appropriate objects.
         * The purpose of this function is to show value of a model,
         * if all its dependencies are available.
         * @param {Object} activeListModel - the model that ermrestjs returns
         */
        function _attachPseudoColumnValue(activeListModel) {
            activeListModel.objects.forEach(function (obj) {
                var hasAll;
                if (obj.citation) {
                    // we don't need to validate the .citation here because obj.citation means that the citation is available and not null
                    hasAll = $rootScope.reference.citation.waitFor.every(function (c) {
                        return c.isUnique || c.name in $rootScope.aggregateResults || c.name in $rootScope.entitySetResults;
                    });

                    // if all the waitfor values are fetched, we can change the citation value
                    if (hasAll) {
                        $rootScope.citationReady = true;
                        $rootScope.citation = $rootScope.reference.citation.compute($rootScope.tuple, $rootScope.templateVariables);
                    }
                    return;
                } else if (obj.column) {
                    var cmodel = $rootScope.columnModels[obj.index];
                    var hasAll = cmodel.column.waitFor.every(function (col) {
                        return col.isUnique || col.name in $rootScope.aggregateResults || col.name in $rootScope.entitySetResults;
                    });
                    // we need the second check because ermrestjs is not adding the current column,
                    // NOTE I might be able to improve ermrestjs for this purpose
                    if (!(hasAll && (cmodel.column.name in $rootScope.aggregateResults || cmodel.column.name in $rootScope.entitySetResults || cmodel.column.isUnique))) return;

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
                    var hasAll = ref.display.sourceWaitFor.every(function (col) {
                        return col.isUnique || col.name in $rootScope.aggregateResults || col.name in $rootScope.entitySetResults;
                    });
                    if (!hasAll) return;

                    model.isLoading = false;
                    model.waitForDataLoaded = true;
                    // if the page data is already fetched, we can just popuplate the tableMarkdownContent value.
                    // otherwise we should just wait for the related/inline table data to get back to popuplate the tableMarkdownContent
                    if (model.tableModel.page && !model.tableModel.dirtyResult) {
                        model.tableMarkdownContent = model.tableModel.page.getContent($rootScope.templateVariables);
                        model.tableMarkdownContentInitialized = true;
                    }
                }
            });
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

                    if (m.hasWaitFor) {
                        m.isLoading = true;
                        m.waitForDataLoaded = false;
                    }

                    _addCauseToModel(m.tableModel, cause);
                } else if (m.requireSecondaryRequest) {
                    m.isLoading = true;
                }
            })

            $rootScope.relatedTableModels.forEach(function (m) {
                m.tableModel.dirtyResult = true;

                if (m.hasWaitFor) {
                    m.isLoading = true;
                    m.waitForDataLoaded = false;
                }

                _addCauseToModel(m.tableModel, cause);
            });

            $rootScope.requestModels.forEach(function (m) {
                m.processed = false;
                // the cause for related and inline are handled by columnModels and relatedTableModels
                if (m.activeListModel.entityset || m.activeListModel.aggregate) {
                    _addCauseToModel(m, cause);
                }
            });


            // update the cause list
            var uc = logService.reloadCauses;
            var selfCause = {};
            selfCause[uc.RELATED_BATCH_UNLINK] = selfCause[uc.RELATED_INLINE_BATCH_UNLINK] = uc.ENTITY_BATCH_UNLINK;
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

                    // add it to request models for aggregate and entity set
                    // the cause for related and inline are handled by columnModels and relatedTableModels
                    $rootScope.requestModels.forEach(function (m) {
                        if (m.activeListModel.entityset || m.activeListModel.aggregate) {
                            _addCauseToModel(m, container.cause);
                        }
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

        function attachGoogleDatasetJsonLd (tuple) {
            // check the googleDatasetConfig global variable
            // that is defined in google-dataset-config.js file
            var catalogID = tuple.reference.location.catalogId, //getting the catalog-id without version
                schemaName = tuple.reference.table.schema.name,
                tableName = tuple.reference.table.name;
            if (typeof googleDatasetConfig !== 'undefined') {
                var allowlist = getAllowListForCurrentHost(googleDatasetConfig);

                // if config is defined, but there's no allowlist for this host
                if (!DataUtils.isObjectAndNotNull(allowlist)) {
                    return;
                }

                if (DataUtils.isObjectAndNotNull(allowlist[catalogID]) &&
                    DataUtils.isObjectAndNotNull(allowlist[catalogID][schemaName]) &&
                    DataUtils.isObjectAndNotNull(allowlist[catalogID][schemaName][tableName])
                ) {
                    var currConfig = allowlist[catalogID][schemaName][tableName];
                    if (currConfig) {
                        var columns = currConfig.columns;
                        var allValuesArray = currConfig.values;

                        if (!Array.isArray(columns) || !Array.isArray(allValuesArray)) {
                            console.warn("Invalid google metadata config!");
                            return;
                        }

                        var matchFound = allValuesArray.some(function (v) {
                            // make sure the value is an array
                            var val = Array.isArray(v) ? v : [v];

                            // make sure we have value for all the columns
                            if (val.length != columns.length) {
                                console.warn("Invalid google metadata config!");
                                return false;
                            }

                            // all the values match
                            return columns.every(function (col, index) {
                                return tuple.data[col] == val[index];
                            });

                        });

                        // didn't find a match: don't add json-ld
                        if (!matchFound) {
                            return;
                        }
                    }
                }
            }

            // use ermrestjs and attach to dom if annotation exists
            var metadata = $rootScope.reference.googleDatasetMetadata;
            if (DataUtils.isObjectAndNotNull(metadata)) {
                metadata = metadata.compute(tuple, $rootScope.templateVariables);
                if (DataUtils.isObjectAndNotNull(metadata)) {
                    var script = document.createElement('script');
                    script.setAttribute('type', 'application/ld+json');
                    script.textContent = JSON.stringify(metadata);
                    document.head.appendChild(script);
                }
            }
        }

        function getAllowListForCurrentHost(config) {
            var result;
            if (Array.isArray(config.configRules)) {
                // loop through each config rule and look for a set that matches the current host
                config.configRules.forEach(function (ruleset) {
                    // we have 1 host
                    if (typeof ruleset.host == "string") {
                        var arr = [];
                        arr.push(ruleset.host);
                        ruleset.host = arr;
                    }
                    if (Array.isArray(ruleset.host)) {
                        for (var i=0; i<ruleset.host.length; i++) {
                            // if there is a config rule for the current host, overwrite the properties defined
                            // $window.location.host refers to the hostname and port (www.something.com:0000)
                            // $window.location.hostname refers to just the hostname (www.something.com)
                            if (ruleset.host[i] === window.location.hostname && (ruleset.config && typeof ruleset.config === "object")) {
                                result = ruleset.config;
                            }
                        }
                    }
                });
            }
            if(result && result.allowlist) {
                return result.allowlist;
            }
        }

        return {
            updateRecordPage: updateRecordPage,
            genericErrorCatch: genericErrorCatch,
            readMainEntity: readMainEntity,
            getTableModel: getTableModel,
            FlowControlObject: FlowControlObject,
            pauseUpdateRecordPage: pauseUpdateRecordPage,
            resumeUpdateRecordPage: resumeUpdateRecordPage,
            attachGoogleDatasetJsonLd: attachGoogleDatasetJsonLd
        };
    }]);

})();
