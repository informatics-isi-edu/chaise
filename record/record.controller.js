(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', 'ConfigUtils', 'DataUtils', 'ERMrest', 'ErrorService', 'logActions', 'MathUtils', 'messageMap', 'modalBox', 'modalUtils', 'recordAppUtils', 'recordCreate', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function RecordController(AlertsService, ConfigUtils, DataUtils, ERMrest, ErrorService, logActions, MathUtils, messageMap, modalBox, modalUtils, recordAppUtils, recordCreate, UiUtils, UriUtils, $cookies, $document, $log, $rootScope, $scope, $timeout, $window) {
        var vm = this;

        var mainContainerEl = angular.element(document.getElementsByClassName('main-container')[0]);
        var mainBodyEl;
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};
        var completed = {};
        var modalUpdate = false;
        vm.alerts = AlertsService.alerts;
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        vm.rowFocus = {};
        vm.sidePanToggleBtnIndicator = "Show";

        var chaiseConfig = ConfigUtils.getConfigJSON();

        vm.tooltip = messageMap.tooltip;
        vm.queryTimeoutTooltip = messageMap.queryTimeoutTooltip;
        vm.gotoInlineTable = function(sectionId, index) {
            var safeSectionId = vm.makeSafeIdAttr(sectionId);
            var pageSection = "entity-" + safeSectionId;

            vm.rowFocus[index] = false;
            var el = angular.element(document.getElementById(pageSection)).parent();
            mainContainerEl.scrollToElementAnimated(el, 40).then(function () {
                $timeout(function () {
                    el.addClass("row-focus");
                }, 100);
                $timeout(function () {
                    el.removeClass('row-focus');
                }, 1600);
            });
        };
        vm.gotoRelatedTable = function(sectionId, index) {
            var safeSectionId = vm.makeSafeIdAttr(sectionId);
            var pageSection = "rt-heading-" + safeSectionId;

            $rootScope.relatedTableModels[index].open = true;
            vm.rowFocus[index] = false;
            var el = angular.element(document.getElementById(pageSection));
            mainContainerEl.scrollToElementAnimated(el, 40).then(function () {
                $timeout(function () {
                    el.addClass("row-focus");
                }, 100);
                $timeout(function () {
                    el.removeClass('row-focus');
                }, 1600);
            });
        };

        vm.versionDisplay = function () {
            return UiUtils.humanizeTimestamp($rootScope.reference.location.versionAsMillis);
        }

        vm.versionDate = function () {
            return UiUtils.versionDate($rootScope.reference.location.versionAsMillis);
        }

        vm.togglePan = function() {
            $scope.recordSidePanOpen = !$scope.recordSidePanOpen;
        };

        vm.canCreate = function() {
            return ($rootScope.reference && $rootScope.reference.canCreate && $rootScope.modifyRecord);
        };

        // TODO change this to reference.unfilteredReference.contextualize...
        vm.createRecord = function() {
            $window.location.href = $rootScope.reference.table.reference.contextualize.entryCreate.appLink;
        };

        vm.referenceTableApplink = function() {
            return $rootScope.reference.unfilteredReference.contextualize.compact.appLink;
        };

        vm.canEdit = function() {
            var canEdit = ($rootScope.reference && $rootScope.reference.canUpdate && $rootScope.modifyRecord);
            // If user can edit this record (canEdit === true), then change showEmptyRelatedTables.
            // Otherwise, canEdit will be undefined, so no need to change anything b/c showEmptyRelatedTables is already false.

            return canEdit;
        };

        vm.editRecord = function() {
            $window.location.href = $rootScope.reference.contextualize.entryEdit.appLink;
        };

        vm.copyRecord = function() {
            var appLink = $rootScope.reference.contextualize.entryCreate.appLink;
            var separator = "?";
            // if appLink already has query params, add &
            // NOTE: With the ppid and pcid implementation appLink will always have
            // that, this is just to avoid further changes if we reverted that change.
            if (appLink.indexOf("?") !== -1) {
                separator = "&";
            }

            $window.location.href = appLink + separator + "copy=true&limit=1";
        };

        vm.canDelete = function() {
            return ($rootScope.reference && $rootScope.reference.canDelete && $rootScope.modifyRecord && $rootScope.showDeleteButton);
        };

        vm.deleteRecord = function() {
            var errorData = {};
            $rootScope.reference.delete({action: logActions.recordDelete}).then(function deleteSuccess() {
                // Get an appLink from a reference to the table that the existing reference came from
                var unfilteredRefAppLink = $rootScope.reference.table.reference.contextualize.compact.appLink;
                $rootScope.showSpinner = false;
                $window.location.href = unfilteredRefAppLink;
            }, function deleteFail(error) {
                $rootScope.showSpinner = false;
                errorData.redirectUrl = $rootScope.reference.unfilteredReference.contextualize.compact.appLink;
                errorData.gotoTableDisplayname = $rootScope.reference.displayname.value;
                error.errorData = errorData;
                ErrorService.handleException(error, true); // call error module with isDismissible = True
            });
        };

        vm.sharePopup = function() {
            var tuple = $rootScope.tuple;
            var ref = $rootScope.reference;
            var refTable = ref.table;

            var params = {
                citation: tuple.citation,
                displayname: refTable.name+'_'+tuple.uniqueId
            }

            var versionString = "@" + (ref.location.version || refTable.schema.catalog.snaptime);
            params.permalink = UriUtils.resolvePermalink(tuple, ref);
            params.versionLink = UriUtils.resolvePermalink(tuple, ref, versionString);
            params.versionDateRelative = UiUtils.humanizeTimestamp(ERMrest.versionDecodeBase32(refTable.schema.catalog.snaptime));
            params.versionDate = UiUtils.versionDate(ERMrest.versionDecodeBase32(refTable.schema.catalog.snaptime));

            refTable.schema.catalog.currentSnaptime().then(function (snaptime) {
                // if current fetched snpatime doesn't match old snaptime, show a warning
                params.showVersionWarning = (snaptime !== refTable.schema.catalog.snaptime);
            }).finally(function() {
                modalUtils.showModal({
                    templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/shareCitation.modal.html",
                    controller: "ShareCitationController",
                    windowClass: "chaise-share-citation",
                    controllerAs: "ctrl",
                    resolve: {
                        params: params
                    }
                }, false, false, false); // not defining any extra callbacks
            });
        };

        vm.toRecordSet = function(ref) {
          // Search app might be broken and should not be linked from here.
            var appUrl = ref.appLink,
                recordSetUrl;
            if(appUrl.search("/search/") > 0){
              recordSetUrl = appUrl.replace("/search/", "/recordset/");
            } else{
              recordSetUrl = appUrl;
            }
            return $window.location.href = recordSetUrl;
        };

        /**
         * Make sure we're showing related tables from top to bottom.
         * If the previous one has not been loaded yet, it should return false.
         * @param  {integer} i related table index
         * @return {boolean}   whether to show related table or not
         */
        vm.showRelatedTable = function(i) {
            if (!$rootScope.relatedTableModels) return false;

            var tableModel = $rootScope.relatedTableModels[i].tableModel;
            var canShow = function () {
                if (!tableModel.initialized) {
                  return false;
                }

                if (i === 0 || $rootScope.lastRendered === i-1)  {
                    $rootScope.lastRendered = i;

                    // don't show the loading if it's done
                    if ($rootScope.loading && $rootScope.lastRendered === $rootScope.relatedTableModels.length-1) {
                        $timeout(function () {
                            $rootScope.loading = false;
                        });
                    }

                    return true;
                }

                return false;
            };

            if (canShow()) {
                return $rootScope.showEmptyRelatedTables || tableModel.rowValues.length > 0;
            }
            return false;
        };

        vm.showInlineTable = function (i) {
            var cm = $rootScope.columnModels[i];
            return cm.isInline && ($rootScope.showEmptyRelatedTables || cm.tableModel.rowValues.length > 0);
        };

        /**
         * allow related table markdown display if all the following are true:
         *  - reference.display.type is `markdown`
         *  - related table has data.
         *  - related table's page.content is not empty string
         *
         * we are going to show the markdown display if the result if this function
         * is true and the related table model is in markdown mode.
         * @param  {integer} i related table index
         * @return {boolean}   whether to show related table markdown or not.
         */
        vm.allowRelatedTableMarkdown = function (i) {
            if (!$rootScope.relatedTableModels) return false;

            var tm = $rootScope.relatedTableModels[i].tableModel;
            return tm.reference.display.type == 'markdown' && tm.page && tm.page.content != '' && tm.page.tuples.length > 0;
        };

        vm.noVisibleRelatedTables = function () {
            if ($rootScope.relatedTableModels) {
                return !$rootScope.relatedTableModels.some(function (tm, index) {
                    return vm.showRelatedTable(index);
                });
            }
            return true;
        };

        vm.toggleRelatedTableDisplayType = function(dataModel) {
            if (dataModel.displayType == 'markdown') {
                dataModel.displayType = 'table';
            } else {
                dataModel.displayType = 'markdown';
            }
        };

        vm.toggleRelatedTables = function() {
            $rootScope.showEmptyRelatedTables = !$rootScope.showEmptyRelatedTables;
            // NOTE: there's a case where clicking the button to toggle this doesn't re-paint the footer until the mouse "moves"
            // having this $timeout triggers the function after the digest cycle which is after the elements have finished showing/hidingbased on the above flag
            $timeout(function () {
                UiUtils.setFooterStyle(0);
            }, 0);
        };

        vm.canEditRelated = function(ref) {
           if(angular.isUndefined(ref)) return false;
           return (ref.canUpdate && $rootScope.modifyRecord);
        };

        vm.canCreateRelated = function(relatedRef) {
            if(angular.isUndefined(relatedRef) || !$rootScope.modifyRecord) {
                return false;
            }

            // we are not supporting add in this case
            if (relatedRef.pseudoColumn && !relatedRef.pseudoColumn.isInboundForeignKey) {
                return false;
            }

            var ref = (relatedRef.derivedAssociationReference ? relatedRef.derivedAssociationReference : relatedRef);
            return ref.canCreate;
        };

        // Send user to RecordEdit to create a new row in this related table
        function onSuccess (){
            AlertsService.addAlert("Your data has been submitted. Showing you the result set...","success");
            vm.resultset = true;
            onfocusEventCall(true);
        }

        function onModalClose () {
            recordAppUtils.resumeUpdateRecordPage();
        }

        /**
         * Whether we can pre-fill the foreignkey value given origFKR as the foreignkey
         * relationship between parent and related table.
         *
         * A foreignkey can only prefilled if it's a superset of the origFKR,
         * and extra columns are not-null.
         *
         * By superset we mean that it must include all the columns of origFKR and
         * the mapping must be exactly the same as origFKR. So for example if origFKR
         * is T1(c1,c2) -> T2(v1,v2), the candidate foreignkey must have at least
         * c1 and c2, and in its definition c1 must map to v1 and c2 must map to v2.
         * It could also have any extra not-null columns.
         *
         * NOTE: Technically we can prefill all the foreignkeys that are supserset
         * of "key" definitions that are in origFKR (assuming extra columns are not-null).
         * For example assuming origFKR is T1(RID, c1) -> T2(RID, v1). A foreignkey definied as
         * T1(RID, c2) -> T2(RID, v2) could be prefilled (assuming c2 is not-null).
         * Since the RID alone is defining the one-to-one relation between the current
         * row and the rows that we want to add for the related table.
         * For now, we decided to not do this complete check and just stick with
         * foreignkeys that are supserset of the origFKR.
         *
         *
         * NOTE: recordedit will prefill all the foreignkeys that their constituent
         * columns are prefilled. Therefore we don't need to send the foreignkey
         * constraint names that must be prefilled and we can only send the "keys" attribute.
         * Recordedit page can easily deduce the foreignkey values and rowname itself.
         * Although in that case recordedit is going to create different references for
         * each foreignkeys eventhough they are referring to the same row of data.
         * So instead of multiple reads, we just have to read the parent record once
         * and use that data for all the foreignkeys that can be prefilled.
         * For this reason, I didn't remove passing of constraintNames for now.
         *
         * @param  {Object} fk foreignkey object that we want to test
         * @return {boolean} whether it can be prefilled
         */
        function foreignKeyCanBePrefilled(fk, origFKR) {
            // origFKR will be added by default
           if (fk === origFKR) return true;

           // if fk is not from the same table, or is shorter
           if (fk.colset.length < origFKR.length) return false;
           if (fk.colset.columns[0].table.name !== origFKR.colset.columns[0].table.name) return false;

           var len = 0;
           for (var i = 0; i < fk.colset.length(); i++) {
               var fkCol = fk.colset.columns[i];
               var origCol = origFKR.colset.columns.find(function (col) {
                   return col.name === fkCol.name;
               });

               // same column
               if (origCol) {
                   // it must map to the same column
                   if (fk.mapping.get(fkCol).name !== origFKR.mapping.get(origCol).name) {
                       return false;
                   }

                   len++; // count number of columns that overlap
               } else if (fkCol.nullok) {
                   return false;
               }
           }

           // the foriegnkey must be superset of the origFKR
           return len == origFKR.key.colset.length();
        }

        function getPrefillCookieObject(ref) {
            var origTable;
            if (ref.derivedAssociationReference) {
                // add association relies on the object that this returns for
                // prefilling the data.
                origTable = ref.derivedAssociationReference.table;
            } else {
                // we should contextualize to make sure the same table is shown in create mode
                origTable = ref.contextualize.entryCreate.table;
            }

            var prefilledFks = [], keys = {};
            origTable.foreignKeys.all().forEach(function (fk) {
                if (!foreignKeyCanBePrefilled(fk, ref.origFKR)) return;
                prefilledFks.push(fk.name);

                // add foreign key column data
                fk.mapping._from.forEach(function (fromColumn, i) {
                    keys[fromColumn.name] = $rootScope.tuple.data[fk.mapping._to[i].name];
                })
            });

            return {
                rowname: $rootScope.recordDisplayname, // the displayed value in the form
                origUrl: $rootScope.reference.uri, // used for reading the actual foreign key data
                constraintNames: prefilledFks, // the foreignkey columns that should be prefileld
                keys: keys // raw values of the foreign key columns
            };
        }

        vm.addRelatedRecord = function(ref) {
            var cookie = getPrefillCookieObject(ref);

            if(ref.derivedAssociationReference){
                recordAppUtils.pauseUpdateRecordPage();
                recordCreate.addRelatedRecordFact(true, ref, 0, cookie, vm.editMode, vm.formContainer, vm.readyToSubmit, vm.recordsetLink, vm.submissionButtonDisabled, $rootScope.reference, $rootScope.tuples, $rootScope.session, ConfigUtils.getContextJSON().queryParams, onSuccess, onModalClose);
                return;
            }

            // 2. Generate a unique cookie name and set it to expire after 24hrs.
            var COOKIE_NAME = 'recordedit-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            $cookies.putObject(COOKIE_NAME, cookie, {
                expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
            });

            // Generate a unique id for this request
            // append it to the URL
            var referrer_id = 'recordedit-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            addRecordRequests[referrer_id] = ref.uri;

            // 3. Get appLink, append ?prefill=[COOKIE_NAME]&referrer=[referrer_id]
            var appLink = ref.unfilteredReference.contextualize.entryCreate.appLink;
            appLink = appLink + (appLink.indexOf("?") === -1? "?" : "&") +
                'prefill=' + UriUtils.fixedEncodeURIComponent(COOKIE_NAME) +
                '&invalidate=' + UriUtils.fixedEncodeURIComponent(referrer_id);

            // 4. Redirect to the url in a new tab
            $window.open(appLink, '_blank');
        };

        $scope.$on("edit-request", function(event, args) {
            editRecordRequests[args.id] = {"schema": args.schema, "table": args.table};
        });

        $scope.$on('record-deleted', function (event, args) {
            recordAppUtils.updateRecordPage(true);
        });

        // When page gets focus, check cookie for completed requests
        // re-read the records for that table
        $window.onfocus = function() {
            onfocusEventCall(false);
        }

        var onfocusEventCall = function(isModalUpdate) {
            if ($rootScope.loading === false) {
                var idxInbFk;
                completed = {};
                for (var id in addRecordRequests) {
                    var cookie = $cookies.getObject(id);
                    if (cookie) { // add request has been completed
                        console.log('Cookie found for the id=' + id);
                        completed[addRecordRequests[id]] = true;

                        // remove cookie and request
                        $cookies.remove(id);
                        delete addRecordRequests[id];
                    } else {
                        console.log('Could not find cookie', cookie);
                    }
                }
                // read updated tables
                if (isModalUpdate || Object.keys(completed).length > 0 || Object.keys(updated).length > 0) {
                    updated = {};
                    //NOTE we're updating the whole page
                    recordAppUtils.updateRecordPage(true);
                }
            }

        };
        // function called from form.controller.js to notify record that an entity was just updated
        window.updated = function(id) {
            updated[editRecordRequests[id].schema + ":" + editRecordRequests[id].table] = true;
            delete editRecordRequests[id];
        }

        /*** Container Heights and other styling ***/
        // fetches the height of navbar, bookmark container, and view
        // also fetches the main container for defining the dynamic height
        function fetchContainerElements() {
            var elements = {};
            try {
                // get document height
                elements.docHeight = $document[0].documentElement.offsetHeight
                // get navbar height
                elements.navbarHeight = $document[0].getElementById('mainnav').offsetHeight;
                // get bookmark container height
                elements.bookmarkHeight = $document[0].getElementById('top-panel-container').offsetHeight;
                // get record main container
                elements.container = $document[0].getElementById('main-content');
            } catch (error) {
                $log.warn(error);
            }
            return elements;
        };

        function setMainContainerHeight() {
            var elements = fetchContainerElements();
            // if these values are not set yet, don't set the height
            if(elements.navbarHeight !== undefined && elements.bookmarkHeight) {
                UiUtils.setDisplayContainerHeight(elements);
            }
        };

        // watch for the display to be ready before setting the main container height
        $scope.$watch(function() {
            return $rootScope.displayReady;
        }, function (newValue, oldValue) {
            if (newValue) {
                $rootScope.recordSidePanOpen = (chaiseConfig.hideTableOfContents === true || $rootScope.reference.display.collapseToc === true) ? false : true;
                $rootScope.hideColumnHeaders = $rootScope.reference.display.hideColumnHeaders;
                $timeout(setMainContainerHeight, 0);
            }
        });

        vm.stickLoading = false;
        function setLoadingTextStyle() {
            var mainContainerHeight = $document[0].getElementsByClassName('main-container')[0].offsetHeight;
            if (mainBodyEl[0].offsetHeight >= mainContainerHeight) {
                vm.stickLoading = true;
            }
        };

        // watch for the main body size to change
        $scope.$watch(function() {
            return mainBodyEl && mainBodyEl[0].offsetHeight;
        }, function (newValue, oldValue) {
            if (newValue) {
                $timeout(function () {
                    UiUtils.setFooterStyle(0);
                    setLoadingTextStyle();
                }, 0);
            }
        });

        // change the main container height whenever the DOM resizes
        angular.element($window).bind('resize', function(){
            if ($rootScope.displayReady) {
                setMainContainerHeight();
                UiUtils.setFooterStyle(0);
                $scope.$digest();
            }
        });

        $timeout(function () {
            mainBodyEl = $document[0].getElementsByClassName('main-body');
        }, 0);

        /*** scroll to events ***/
        // scroll to top button
        $scope.scrollToTop = function () {
            mainContainerEl.scrollTo(0,0, 500);
        };

        mainContainerEl.on('scroll', $scope.$apply.bind($scope, function () {
            if (mainContainerEl.scrollTop() > 300) {
              $scope.showTopBtn = true;
            } else {
              $scope.showTopBtn = false;
            }
        }));
    }]);
})();
