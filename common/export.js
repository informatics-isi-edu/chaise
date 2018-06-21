(function () {
    'use strict';

    angular.module('chaise.export', [])

    .directive('export', ['$http', function ($http) {
        return {
            restrict: 'AE',
            templateUrl: '../common/templates/export.html',
            scope: {
                reference: "<",
                hasValues: "<"
            },
            link: function (scope, element, attributes) {
                scope.isLoading = false;

                scope.submit = function () {
                    // set this to true to show the spinner, then set it to false.
                    scope.isLoading = true;


                    // TODO the logic goes here

                    // in here you have access to
                    console.log("reference:", scope.reference);

                    // scope.reference.location.ermrestCompactPath gives you the path
                    console.log("path: " + scope.reference.location.ermrestCompactPath);


                    /*
                     * I noticed that in search app we're using jquery, but you should
                     * avoid using it in conjunction with angularjs since it won't behave
                     * properly. You should use angularjs selectors instead of jquery.
                     * To make http calls you can use the $http. You can find examples of it
                     * in the code, but this is one sample example:
                     *
                     * $http.get(uri,headers).then(function (response) {
                     *      console.log("data:", response.data);
                     * }).catch(function (err) {
                     *      throw err;
                     * })
                     *
                     */

                    // this should be changed to false when you got the data
                    scope.isLoading = false;

                };
            }
        };
    }]);
})();
