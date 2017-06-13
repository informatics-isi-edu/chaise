/**
     * @directive
     * @usage: ELement or Atrribute
     * @scope {Object} textinput The Markdown to transform
     * @output {modal} A modal with markdown preview
     * @desc Input that is needed to be transformed shall be paased to textinput attribute. Directive link function calls ERMrest.renderMarkdown() for the msrkdown generation.
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
