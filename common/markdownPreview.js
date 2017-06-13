/**
* @desc
* The markdownPreview directive can be used to display a modal preview box with
* transformed markdown. It calls ERMrest.renderMarkdown() to perform markdown to
* HTML transformtaion. The output of this public function is then bound to page
* through ng-bind-html.
* The markdownPreview directive can be used as an element tag (<markdown-preview></markdown-preview>)
* or an attribute (<div markdown-preview></div>). Link function checks for class "live-preview" to identify
* click event, therefore this should be added in html markup.
* It accepts the following attribute:
* @param {String} textinput The Markdown to transform
* @example <a href class="live-preview"  markdown-preview textinput="form.recordEditModel.rows[rowIndex][column.name]">Live Preview</a>
* @example <markdown-preview class="live-preview" textinput="form.recordEditModel.rows[rowIndex][column.name]">Click</markdown-preview>
*/

(function() {
  'use strict';

  angular.module('chaise.markdown', [])
    .directive('markdownPreview', ['$uibModal', 'ERMrest', '$sce', function($uibModal, ERMrest, $sce) {

      return {
        restrict: 'EA',
        scope: {
          textinput: '=textinput'
        },
        link: function(scope, elem, attr) {

          elem.on('click', function(e) {
            scope.$apply(function() {
              if (angular.element(e.target).hasClass('live-preview')) {
                var result;
                var textInput = scope.textinput;

                angular.isUndefinedOrNull = function(val) {
                  return val == '' || angular.isUndefined(val) || val === null
                }

                function modalBox(params) {
                  var modalInstance = $uibModal.open({
                    animation: false,
                    controller: "MarkdownPreviewController",
                    controllerAs: "ctrl",
                    resolve: {
                      params: params
                    },
                    size: "lg",
                    template: '<div class="modal-header"> \
                                  <button class="btn btn-default pull-right modal-close" type="button" ng-click="ctrl.cancel()">X</button> \
                                  <h3 class="modal-title">{{ctrl.params.heading}}</h3> \
                               </div> \
                                <div class="modal-body"> \
                                    <div class="outer-table"> \
                                      <div style="padding:10px" ng-bind-html="ctrl.params.markdownOut" class="markdown-container"></div> \
                                    </div> \
                                </div> '
                  });
                }

                if (angular.isUndefinedOrNull(textInput))
                  return;
                result = ERMrest.renderMarkdown(textInput);
                if (angular.isUndefinedOrNull(result)) {
                  scope.heading = 'Error!'
                  scope.markdownOut = '<p style="color:red;">An error was encountered during preview!';
                } else {
                  scope.heading = 'Markdown Preview'
                  scope.markdownOut = $sce.trustAsHtml(result);
                }
                modalBox(scope);
              }
            });
          });
        }
      };
    }])
    .controller('MarkdownPreviewController', ['$scope', '$uibModalInstance', 'params', function MarkdownPreviewController($scope, $uibModalInstance, params) {
      var vm = this;

      vm.params = params;
      vm.ok = ok;
      vm.cancel = cancel;
      function ok(tuple) {
        $uibModalInstance.close(tuple);
      }
      function cancel() {
        $uibModalInstance.dismiss("cancel");
      }
    }])
})();
