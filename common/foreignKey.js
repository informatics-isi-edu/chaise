(function() {
    "use strict";

    angular.module("chaise.foreignkey", [])
        .directive("foreignKeyDisplay", function() {
            return {
                restrict: 'A',
                require: "ngModel",
                link: function(scope, element, attrs, ngModel) {

                    ngModel.$formatters.push(function(value) {
                        if (value && value.tuple)
                            return value.tuple.displayname;
                    });

                    ngModel.$parsers.unshift(function(value) {
                        console.log(value);
                        return value;
                    });
                }
            }
        });
})()
