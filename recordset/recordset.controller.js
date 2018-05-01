(function() {
    'use strict';

    angular.module('chaise.recordset')

    // Register the recordset controller
    .controller('recordsetController', ['context', 'DataUtils', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$document', '$log', '$rootScope', '$scope', '$timeout', '$window', function(context, DataUtils, recordsetModel, Session, UiUtils, UriUtils, $document, $log, $rootScope, $scope, $timeout, $window) {

        $scope.vm = recordsetModel;
        recordsetModel.RECORDEDIT_MAX_ROWS = 200;
        $scope.navbarBrand = (chaiseConfig['navbarBrand'] !== undefined? chaiseConfig.navbarBrand : "");
        $scope.navbarBrandImage = (chaiseConfig['navbarBrandImage'] !== undefined? chaiseConfig.navbarBrandImage : "");
        $scope.navbarBrandText = (chaiseConfig['navbarBrandText'] !== undefined? chaiseConfig.navbarBrandText : "Chaise");

        function updateLocation() {
            $window.scrollTo(0, 0);
            $window.location.replace($scope.permalink());
            $rootScope.location = $window.location.href;
        }

        $rootScope.$on('reference-modified', function() {
            updateLocation();
        });

        $scope.permalink = function() {

            // before run, use window location
            if (!recordsetModel.reference) {
                return $window.location.href;
            }

            //var url = context.mainURI;
            var url = context.chaiseBaseURL + "#" + UriUtils.fixedEncodeURIComponent(recordsetModel.reference.location.catalog) + "/" +
                recordsetModel.reference.location.compactPath;

            // add sort modifier
            if (recordsetModel.reference.location.sort)
                url = url + recordsetModel.reference.location.sort;

            // add paging modifier
            if (recordsetModel.reference.location.paging)
                url = url + recordsetModel.reference.location.paging;

            // add ermrestjs supported queryParams
            if (recordsetModel.reference.location.queryParamsString) {
                url = url + "?" + recordsetModel.reference.location.queryParamsString;
            }

            return url;
        };

        $scope.edit = function() {
            var link = recordsetModel.page.reference.contextualize.entryEdit.appLink;
            // TODO ermrestJS needs to handle the case when no limit is defined in the URL
            if (link.indexOf("?limit=") === -1 || link.indexOf("&limit=") === -1)
                link = link + (link.indexOf('?') === -1 ? "?limit=" : "&limit=" ) + recordsetModel.pageLimit;

            return link;
        };

        $scope.create = function() {
            // TODO: Generate a unique id for this request
            // append it to the URL
            // var referrer_id = 'recordset-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            // addRecordRequests[referrer_id] = 0;

            // open a new tab
            var newRef = recordsetModel.reference.unfilteredReference.contextualize.entryCreate;
            var appLink = newRef.appLink;
            // appLink = appLink + (appLink.indexOf("?") === -1 ? "?" : "&") + 'invalidate=' + UriUtils.fixedEncodeURIComponent(referrer_id);

            return appLink;
        };

        // fetches the height of navbar, bookmark container, and view
        // also fetches the main container for defining the dynamic height
        function fetchMainElements() {
            var elements = {};
            try {
                // get document height
                elements.docHeight = $document[0].documentElement.offsetHeight
                // get navbar height
                elements.navbarHeight = $document[0].getElementById('mainnav').offsetHeight;
                // get bookmark container height
                elements.bookmarkHeight = $document[0].getElementById('bookmark-container').offsetHeight;
                // get recordset main container
                if (chaiseConfig.showFaceting) {
                    elements.container = $document[0].getElementsByClassName("recordset-container with-faceting")[0].getElementsByClassName('main-container')[0];
                } else {
                    elements.container = $document[0].getElementById('main-content');
                }
            } catch (error) {
                $log.warn(error);
            }
            return elements;
        }

        // fetches the height of navbar, bookmark container, and view
        // also fetches the faceting container for defining the dynamic height
        function fetchFacetingElements() {
            var elements = {};
            try {
                // get document height
                elements.docHeight = $document[0].documentElement.offsetHeight;
                // get navbar height
                elements.navbarHeight = $document[0].getElementById('mainnav').offsetHeight;
                // get bookmark container height
                elements.bookmarkHeight = $document[0].getElementById('bookmark-container').offsetHeight;
                // get recordset main container
                elements.container = $document[0].getElementsByClassName('faceting-container')[0];
            } catch (error) {
                $log.warn(error);
            }
            return elements;
        }

        function setRecordsetHeight() {
            var elements = fetchMainElements();
            // if these 2 values are not set yet, don't set the height
            if (elements.navbarHeight && elements.bookmarkHeight) {
                UiUtils.setDisplayContainerHeight(elements);
                // no need to fetch and verify the faceting elements (navbar and bookmark are the same container as the ones used in main elements function)
                if (chaiseConfig.showFaceting) UiUtils.setDisplayContainerHeight(fetchFacetingElements());
            }
        }

        function fetchBodyElements() {
            var elements = {};
            try {
                /**** used for main-body height calculation ****/
                // get footer height
                elements.footerHeight = $document[0].getElementById('footer').offsetHeight;
                // get main container height
                elements.mainContainerHeight = $document[0].getElementsByClassName('main-container')[0].offsetHeight;
                // get recordedit main body
                elements.body = $document[0].getElementsByClassName('main-body')[0];

                // get recordset controls height
                var controlsHeight = $document[0].getElementById('recordset-controls-container').offsetHeight;
                // get facet filters container height
                var filtersHeight = $document[0].getElementById('facet-filters-container').offsetHeight;
                // get table height
                var tableHeight = $document[0].getElementById('recordset-table-container').offsetHeight;
                // get paging height
                // account for margins applied
                var pagerHeight = $document[0].getElementById('pager-container').offsetHeight + 70;
                console.log("controls height: ", controlsHeight);
                console.log("filters height: ", filtersHeight);
                console.log("table height: ", tableHeight);
                console.log("pager height: ", pagerHeight);
                elements.initialInnerHeight = controlsHeight + filtersHeight + tableHeight + pagerHeight;
            } catch(error) {
                $log.warn(error)
            }
            return elements;
        }

        function setMainBodyHeight() {
            var elements = fetchBodyElements();

            UiUtils.setDisplayBodyHeight(elements);
        }

        function setMainHeights() {
            setRecordsetHeight();
            $timeout(setMainBodyHeight, 0);
        }

        $scope.$watch(function() {
            return recordsetModel.hasLoaded && recordsetModel.initialized;
        }, function (newValue, oldValue) {
            if (newValue) {
                setMainHeights();
            }
        });

        angular.element($window).bind('resize', function(){
            if (recordsetModel.hasLoaded && recordsetModel.initialized ) {
                setMainHeights();
                $scope.$digest();
            }
        });

    }]);
})();
