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
                    scope.fileEl;

                    $timeout(function() {

                        scope.fileEl = angular.element(element[0].querySelector('input[type="file"]'));

                        scope.fileElId = Math.round(Math.random() * 100000);

                        scope.fileEl
                            .bind('change', function (event) {
                                scope.file = event.target.files[0];
                                scope.fileName = scope.file.name;
                                scope.$apply();
                            });

                    }, 10);


                    scope.clear = function() {
                        scope.fileName = "";
                        scope.file = "";
                        scope.fileEl.val("");
                    };

                }
            };
        }])


})();