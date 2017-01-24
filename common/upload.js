(function () {
    'use strict';

    angular.module('chaise.upload', [])


        .directive('upload', [ '$timeout', function($timeout) {

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/upload.html',
                scope: {
                    column: '=',
                    values: '='
                },
                link: function (scope, element,attrs, ngModel) {
                    scope.fileName = "";

                    $timeout(function() {

                        angular.element(elem.querySelector('input[type="file"]'))
                            .bind('change', function (event) {
                                scope.file = event.target.files[0];
                                scope.fileName = scope.file.name;
                                scope.$apply();
                            });

                    }, 10);

                }
            };
        }])


})();