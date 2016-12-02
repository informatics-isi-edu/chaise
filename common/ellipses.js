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

                    // 1em = 14px
                    // 7.25em = 101.5px
                    var maxHeight = 160;
                    
                    scope.readmore = function() {
                        if (scope.overflow) {
                            scope.overflow = false;
                            scope.linkText = "less";
                            scope.maxHeightStyle =  { };
                        } else {
                            scope.overflow = true;
                            scope.linkText = "more";
                            scope.maxHeightStyle =  { "max-height": maxHeight + "px" };
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
                                    scope.maxHeightStyle =  { "max-height": maxHeight + "px" };
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
            };
        }])


})();