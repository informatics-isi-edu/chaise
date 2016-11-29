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

                    // 1em = 14px
                    // 7.25em = 101.5px
                    scope.maxHeight = "7.25em";

                    scope.readmore = function(index) {
                        if (scope.hideContent) {
                            scope.hideContent = false;
                            scope.linkText = "less";
                        } else {
                            scope.hideContent = true;
                            scope.linkText = "more";
                        }
                    };

                    $timeout(function() {
                        for (var i = 0; i < element[0].children.length; i++) {
                            if (element[0].children[i].children[0].offsetHeight > 100) {
                                scope.overflow[i] = true;
                                scope.hideContent = true;
                            } else {
                                scope.overflow[i] = false;
                            }
                        }
                    }, 0);

                }
            };
        }])


})();
