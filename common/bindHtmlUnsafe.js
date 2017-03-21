(function() {
    'use strict';

    angular.module('chaise.html', [])
        .directive('bindHtmlUnsafe', function( $parse, $compile ) {
            return function( $scope, $element, $attrs ) {
                // TODO: Not sure if compile needs to be wrapped in a try/catch
                var compile = function( newHTML ) {
                    // try {
                    newHTML = $compile(newHTML)($scope);
                    $element.html('').append(newHTML);
                    // } catch (e) {
                    //    ErrorService.catchAll(e);
                    // }
                }
                };

                var htmlName = $attrs.bindHtmlUnsafe;

                $scope.$watch(htmlName, function( newHTML ) {
                    if(!newHTML) return;
                    compile(newHTML);
                });

            };
        });
})()
