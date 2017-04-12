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
                        
                        // Bind change event file input
                        scope.fileEl
                            .bind('change', function (event) {

                                // set the reference value object with selected file, fileName
                                // and also create an Upload object and save it as hatracObj in the value object
                                scope.value.file = event.target.files[0];
                                scope.value.hatracObj = new ERMrest.Upload(scope.value.file, {
                                        baseURL:  window.location.protocol + "//" + window.location.host + "/hatrac/",
                                        column: scope.column
                                    });
                                scope.value.fileName = scope.value.file.name;
                                scope.$apply();
                            });

                    }, 10);


                    scope.clear = function() {
                        scope.value.fileName = "";
                        delete scope.value.file;
                        delete scope.value.hatracObj;
                        scope.fileEl.val("");
                    };
                }
            };
        }])


})();