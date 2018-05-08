(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', 'DataUtils', 'ErrorService', 'logActions', 'MathUtils', 'messageMap', 'modalBox', 'recordCreate', 'UiUtils', 'UriUtils', '$cookies', '$document', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function RecordController(AlertsService, DataUtils, ErrorService, logActions, MathUtils, messageMap, modalBox, recordCreate, UiUtils, UriUtils, $cookies, $document, $log, $rootScope, $scope, $timeout, $window) {
        var vm = this;

        var mainContainerEl = angular.element(document.getElementsByClassName('main-container')[0]);
        var mainBodyEl;
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};
        var context = $rootScope.context;
        var completed = {};
        var modalUpdate = false;
        vm.alerts = AlertsService.alerts;
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        vm.rowFocus = {};
        vm.sidePanToggleBtnIndicator = "Show";

        $scope.recordSidePanOpen = chaiseConfig.hideTableOfContents === true ? false : true;

        vm.gotoRelatedTable = function(sectionId, index) {
            var safeSectionId = vm.makeSafeIdAttr(sectionId);
            var pageSection = "rt-heading-" + safeSectionId;

            $rootScope.tableModels[index].open = true;
            vm.rowFocus[index] = false;
            var el = angular.element(document.getElementById(pageSection));
            mainContainerEl.scrollToElementAnimated(el, 40).then(function () {
                $timeout(function () {
                    el.addClass("rowFocus");
                }, 100);
                $timeout(function () {
                    el.removeClass('rowFocus');
                }, 1600);
            });
        };

        vm.togglePan = function() {
            $scope.recordSidePanOpen = !$scope.recordSidePanOpen;
        };

        vm.canCreate = function() {
            return ($rootScope.reference && $rootScope.reference.canCreate && $rootScope.modifyRecord);
        };

        vm.createRecord = function() {
            $window.location.href = $rootScope.reference.table.reference.contextualize.entryCreate.appLink;
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
            $window.location.href = $rootScope.reference.contextualize.entryCreate.appLink + "?copy=true&limit=1";
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

        vm.permalink = function getPermalink() {
            return $window.location.href;
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

        vm.showRelatedTable = function(i) {
            var isFirst = false, prevTableHasLoaded = false;
            if ($rootScope.tableModels && $rootScope.tableModels[i]) {
                if (i === 0) {
                    $rootScope.lastRendered = 0;
                    isFirst = true;
                } else if ($rootScope.tableModels[i-1]) {
                    prevTableHasLoaded = $rootScope.tableModels[i-1].hasLoaded;
                    if ($rootScope.lastRendered == (i-1)) {
                        $rootScope.lastRendered = i;
                    }
                }

                if ($rootScope.lastRendered == $rootScope.relatedReferences.length-1) {
                    $rootScope.loading = false;
                }

                if ($rootScope.showEmptyRelatedTables) {
                    return isFirst || prevTableHasLoaded;
                }

                if ((isFirst || prevTableHasLoaded) && $rootScope.tableModels[i].rowValues && $rootScope.tableModels[i].rowValues.length > 0) {
                    return (i == $rootScope.lastRendered);
                }
                return false;
            }
        };

        vm.noVisibleRelatedTables = function () {
            if ($rootScope.tableModels) {
                return !$rootScope.tableModels.some(function (tm, index) {
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
            if(angular.isUndefined(ref))
            return false;
           return (ref.canUpdate && $rootScope.modifyRecord);
        };

        vm.canCreateRelated = function(relatedRef) {
            if(angular.isUndefined(relatedRef) || !$rootScope.modifyRecord) return false;

            // we are not supporting add in this case
            if (relatedRef.pseudoColumn && !relatedRef.pseudoColumn.isInboundForeignKey) return false;

            var ref = (relatedRef.derivedAssociationReference ? relatedRef.derivedAssociationReference : relatedRef);
            return ref.canCreate;
        };

        // Send user to RecordEdit to create a new row in this related table
        function onSuccess (){
            AlertsService.addAlert("Your data has been submitted. Showing you the result set...","success");
            vm.resultset = true;
            onfocusEventCall(true);
        }

        vm.addRelatedRecord = function(ref) {
            // 1. Pluck required values from the ref into cookie obj by getting the values of the keys that form this FK relationship
            // Another option is just passing the column name,
            // but if the column is not in the list of visible columns in entry/create that can cause problems.
            // This will work even if the column is not visible in the create mode.
            var cookie = {
                rowname: $rootScope.recordDisplayname, // used for display value
                columnName: ref.origColumnName, // used to find the column that this blongs to
                constraintName: ref.origFKR.name, // used for attaching the foreignkey data
                origUrl: $rootScope.reference.uri // used for getting foreignkey data
            };
            var mapping = ref.contextualize.entryCreate.origFKR.mapping;

            // Get the column pair that form this FKR between this related table and the main entity
            cookie.keys = {};
            mapping._from.forEach(function (fromColumn, i) {
                var toColumn = mapping._to[i];
                // Assign the column value into cookie
                cookie.keys[fromColumn.name] = $rootScope.tuple.data[toColumn.name];
            });

            if(ref.derivedAssociationReference){
                recordCreate.addRelatedRecordFact(true, ref, 0, cookie, vm.editMode, vm.formContainer, vm.readyToSubmit, vm.recordsetLink, vm.submissionButtonDisabled, $rootScope.reference, $rootScope.tuples, $rootScope.session, $rootScope.context.queryParams, onSuccess);
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

        /**
        * readUpdatedTable(refObj, dataModel, idx, isModalUpdate) returns model object with all updated component values
        * @param {object} refObj Reference object with component details
        * @param {object} dataModel Contains value that is bind to the table columns
        * @param {int} idx Index of each reference
        * @param {bool} isModalUpdate if update happens through modal pop up
        */
        function readUpdatedTable(refObj, dataModel, idx, isModalUpdate){
            var errorData = {};
            if (isModalUpdate || completed[refObj.uri] || updated[refObj.location.schemaName + ":" + refObj.location.tableName]) {
                delete updated[refObj.location.schemaName + ":" + refObj.location.tableName];

                (function (i) {
                    refObj.read(dataModel.pageLimit, {action: logActions.recordRelatedUpdate}).then(function (page) {
                        dataModel.page = page;
                        dataModel.rowValues = DataUtils.getRowValuesFromPage(page);
                    }).catch(function (error) {
                        errorData.redirectUrl = $rootScope.reference.unfilteredReference.contextualize.compact.appLink;
                        errorData.gotoTableDisplayname = $rootScope.reference.displayname.value;
                        error.errorData = errorData;
                        throw error;
                    });
                })(i);
            }
        }

        // When page gets focus, check cookie for completed requests
        // re-read the records for that table
        $window.onfocus = function() {
            onfocusEventCall(false);
        }

        var onfocusEventCall = function(isModalUpdate) {
            if ($rootScope.loading === false) {
                var idxInbFk;
                completed = { };
                for (var id in addRecordRequests) {
                    var cookie = $cookies.getObject(id);
                    if (cookie) { // add request has been completed
                        console.log('Cookie found', cookie);
                        completed[addRecordRequests[id]] = true;

                        // remove cookie and request
                        $cookies.remove(id);
                        delete addRecordRequests[id];
                    } else {
                        console.log('Could not find cookie', cookie);
                    }
                }
                // read updated tables
                if (isModalUpdate || Object.keys(completed).length > 0 || updated !== {}) {
                    for (var i = 0; i < $rootScope.inboundFKCols.length; i++) {
                        idxInbFk = $rootScope.inboundFKColsIdx[i];
                        readUpdatedTable($rootScope.inboundFKCols[i].reference, $rootScope.colTableModels[idxInbFk], idxInbFk, isModalUpdate);
                    }
                    for (var i = 0; i < $rootScope.relatedReferences.length; i++) {
                        readUpdatedTable($rootScope.relatedReferences[i], $rootScope.tableModels[i], i, isModalUpdate);
                    }
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
                elements.bookmarkHeight = $document[0].getElementById('bookmark-container').offsetHeight;
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
            if(elements.navbarHeight && elements.bookmarkHeight) {
                UiUtils.setDisplayContainerHeight(elements);
            }
        };

        // watch for the display to be ready before setting the main container height
        $scope.$watch(function() {
            return $rootScope.displayReady;
        }, function (newValue, oldValue) {
            if (newValue) {
                $timeout(setMainContainerHeight, 0);
            }
        });

        // watch for the main body size to change
        $scope.$watch(function() {
            return mainBodyEl && mainBodyEl[0].offsetHeight;
        }, function (newValue, oldValue) {
            if (newValue) {
                $timeout(function () {
                    UiUtils.setFooterStyle(0);
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
