(function () {
    'use strict';

    angular.module('chaise.ellipses', [])


        .directive('ellipses', ['$sce', '$timeout', function($sce, $timeout) {

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/ellipses.html',
                scope: {
                    rowValues: '='
                },
                link: function (scope, element) {
                    scope.overflow = []; // for each cell in the row

                    scope.hideContent = false;
                    scope.linkText = "more";
                    scope.maxHeightStyle = { };

                    for (var i = 0; i < element[0].children.length; i++) {
                        scope.overflow[i] = false;
                    }

                    // If chaiseconfig contains maxRecordSetHeight then only apply more-less styling
                    if (chaiseConfig.maxRecordsetRowHeight != false ) {

                        // 1em = 14px
                        // 7.25em = 101.5px
                        var moreButtonHeight = 20;
                        var maxHeight = chaiseConfig.maxRecordsetRowHeight || 160;
                        var maxHeightStyle = { "max-height": (maxHeight - moreButtonHeight) + "px" }

                        scope.readmore = function() {
                            if (scope.hideContent) {
                                scope.hideContent = false;
                                scope.linkText = "less";
                                scope.maxHeightStyle =  { };
                            } else {
                                scope.hideContent = true;
                                scope.linkText = "more";
                                scope.maxHeightStyle =  maxHeightStyle;
                            }
                        }

                        var timerCount = 0, containsOverflow = false, oldHeights = [];

                        function resizeRow() {
                            if (containsOverflow == false && timerCount ++ < 500) {
                                
                                for (var i = 0; i < element[0].children.length; i++) {
                                    var height = element[0].children[i].children[0].clientHeight;
                                    if (height < oldHeights[i]) continue;
                                    if (height > maxHeight) {
                                        scope.overflow[i] = true;
                                        scope.hideContent = true;
                                        containsOverflow = true;
                                        scope.maxHeightStyle =  maxHeightStyle;
                                    } else {
                                        scope.overflow[i] = false;
                                    }
                                }
                                $timeout(function() {
                                    resizeRow();
                                }, 50);
                            }
                        };      

                        resizeRow();
                    }
                }
            };
        }])


})();