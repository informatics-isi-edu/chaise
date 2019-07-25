var templateApp = angular.module('templatingApp', [])

    .run(['$templateCache', '$templateRequest', '$timeout', function($templateCache, $templateRequest, $timeout) {
        console.log("Run block, cache size: ", $templateCache.info().size);
        console.log($templateCache.get("template.html"));
        console.log($templateCache.get("some-template.html"));

        // registers the template in this namespace
        $templateRequest('some-template.html').then(function (tpl) {
            console.log("in then callback");
            console.log(tpl);
            console.log($templateCache.get("some-template.html"));
        });

        $timeout(function (){
            console.log("in timeout");
            console.log($templateCache.info().size);
            console.log($templateCache.get("template.html"));
            console.log($templateCache.get("some-template.html")); // request to fetch sent, not available yet
        }, 0)
    }])

    .directive('extra', function () {
        return {
            restrict: 'E',
            templateUrl: 'template.html'
        }
    })

    .directive('extra2', ['$templateCache', function ($templateCache) {
        console.log("in directive 2 setup, no timeout");
        console.log($templateCache.get('some-template.html')); // request to fetch not sent yet
        return {
            restrict: 'E',
            template: $templateCache.get('some-template.html')
        }
    }])

    .directive('extra3', ['$templateCache', '$timeout', function ($templateCache, $timeout) {
        // causes compilation problem
        $timeout(function () {
            console.log("timeout in directive 3 setup");
            console.log($templateCache.get('some-template.html')); // request to fetch sent, not available yet
            return {
                restrict: 'E',
                template: $templateCache.get('some-template.html')
            }
        })
    }])

    .directive('extra4', ['$templateCache', '$timeout', function ($templateCache, $timeout) {
        // causes compilation problem
        $timeout(function () {
            console.log("timeout with delay in directive 4 setup");
            console.log($templateCache.get('some-template.html')); // now available
            return {
                restrict: 'E',
                template: $templateCache.get('some-template.html'),
                link: function () {

                }
            }
        }, 500)
    }]);
