/**footer diretive: to create page footer
 * styleing is controoled dynamically based on scroll height. If these is scroll on the page then footer is 'relative'
 * else it is 'absolute'.
 * @example <footer></footer>
 */

(function() {
    'use strict';

    angular.module('chaise.footer', [])
        .directive('footer', ['ERMrest', '$timeout', function(ERMrest, $timeout) {

            return {
                restrict: 'E',
                scope: {},
                templateUrl: '../common/templates/footer.html',
                link: function(scope, ele) {
                    var footerText = chaiseConfig.footerMarkdown;
                    angular.isUndefinedOrNull = function(val) {
                        return val == '' || angular.isUndefined(val) || val === null
                    }

                    if (!angular.isUndefinedOrNull(footerText)) {
                        ERMrest._onload().then(function() {
                            scope.privacyResult = ERMrest.renderMarkdown(footerText);
                        });
                    }
                }
            };
        }])
})();
