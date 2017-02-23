(function () {
    'use strict';

    angular.module('chaise.upload', ['ermrestjs'])


        .directive('upload', [ '$timeout', 'ERMrest', function($timeout, ERMrest) {

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/upload.html',
                scope: {
                    column: '=',
                    values: '=',
                    value: '='
                },
                link: function (scope, element,attrs, ngModel) {
                    scope.fileEl;
                    scope.fileElId = "fileInput" +  Math.round(Math.random() * 100000);

                    $timeout(function() {

                        scope.fileEl = angular.element(element[0].querySelector('input[type="file"]'));
                        
                        scope.fileEl
                            .bind('change', function (event) {
                                scope.value.file = event.target.files[0];
                                scope.value.hatracObj = new ERMrest.Upload(scope.value.file, { url: 'https://dev.isrd.isi.edu/hatrac/test1' });
                                scope.value.fileName = scope.value.file.name;
                                scope.$apply();
                            });

                    }, 10);


                    scope.clear = function() {
                        scope.value.fileName = "";
                        delete scope.value.file;
                        scope.fileEl.val("");
                    };

                }
            };
        }])


})();