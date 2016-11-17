(function () {
    'use strict';

    angular.module('chaise.ellipses', [])


        .directive('ellipses', ['$sce', '$timeout', function($sce, $timeout) {

            return {
                restrict: 'E',
                templateUrl: '../common/templates/ellipses.html',
                scope: {
                    content: '=',
                    isHtml: "="
                },
                link: function (scope, element) {

                    scope.overflow = false;
                    scope.linkText = "more";

                    // 1em = 14px
                    // 7.25em = 101.5px
                    scope.maxHeight = "7.25em";
                    scope.showMore = false;

                    scope.readmore = function() {
                        if (scope.overflow) {
                            scope.overflow = false;
                            scope.linkText = "less";
                        } else {
                            scope.overflow = true;
                            scope.linkText = "more";
                        }
                    }

                    $timeout(function() {
                        if (element.children().first().prop('offsetHeight') > 100) {
                            scope.overflow = true;
                            scope.showMore = true;
                        } else {
                            scope.overflow = false;
                        }
                    }, 0);

                }
            };
        }])


})();
