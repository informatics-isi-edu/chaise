(function () {
    'use strict';

    angular.module('chaise.ellipses', [])


        .directive('ellipses', ['$sce', function($sce) {

            return {
                restrict: 'E',
                templateUrl: '../common/templates/ellipses.html',
                scope: {
                    content: '=',
                    isHtml: "="
                },
                link: function (scope) {

                    scope.max = 300;

                    scope.toPresentation = function(text, isHtml) {
                        if (!isHtml) {
                            if (text.length > scope.max)
                                return text.substring(0, scope.max - 1);
                            else
                                return text;
                        } else {
                            return $sce.trustAsHtml(text)
                        }
                    };

                    scope.contentx = scope.toPresentation(scope.content, scope.isHtml);

                    scope.overflow = scope.content.length > scope.max;

                    scope.readmore = function() {
                        scope.contentx = (scope.isHtml? $sce.trustAsHtml(scope.content) : scope.content);
                        scope.overflow = false;
                    }
                }
            };
        }])


})();
