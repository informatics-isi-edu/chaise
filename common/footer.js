/**
* @desc
* @param {String} textinput The Markdown to transform
* @example <a href class="live-preview"  markdown-preview textinput="form.recordEditModel.rows[rowIndex][column.name]">Live Preview</a>
* @example <markdown-preview class="live-preview" textinput="form.recordEditModel.rows[rowIndex][column.name]">Click</markdown-preview>
*/

(function() {
  'use strict';

  angular.module('chaise.footer', [])
    .directive('footer', ['ERMrest', '$sce','$window', '$document', '$timeout',function(ERMrest, $sce, $window, $document,$timeout) {

      return {
        restrict: 'E',
        scope: {},
        templateUrl: '../common/templates/footer.html',
        link: function(scope) {
                var footerText = chaiseConfig.footerMarkdown;
                angular.isUndefinedOrNull = function(val) {
                  return val == '' || angular.isUndefined(val) || val === null
                }
                $timeout(function(){
                if ($(document).height() > $(window).height()) { //scrolling
                    scope.posStyle = {
                        width: 'auto',
                        height: '30px',
                    	'background-color': '#f2f2f2',
                        right: 0,
                        bottom: '0',
                        left: '0',
                        position:'relative'
                    };
                }
                else{
                    scope.posStyle = {
                        width: 'auto',
                        height: '30px',
                    	'background-color': '#f2f2f2',
                        right: '0',
                        bottom: '0',
                        left: '0',
                        position:'absolute'
                    };
                }
                if (angular.isUndefinedOrNull(footerText))
                  scope.privacyResult = "**Default Privacy Policy**";
                else{
                    ERMrest._onload().then(function(){
                            scope.privacyResult = ERMrest.renderMarkdown(footerText);
                    })

            }
            // });
        },1000);
        }
      };
    }])
})();
