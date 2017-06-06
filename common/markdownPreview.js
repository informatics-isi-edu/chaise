(function() {
  'use strict';

  angular.module('chaise.markdown', [])
    .directive('markdownPreview', ['$uibModal', '$http', function($uibModal, $http) {

      return {
        restrict: 'EA',
        scope: {
          textinput: '=textinput'
        },
        link: function(scope, elem, attr) {
          elem.on('click', function(e) {
            scope.$apply(function() {
              if (angular.element(e.target).hasClass('live-preview')) {

                var mdGitApi = 'https://api.github.com/markdown';
                var textInput = scope.textinput;
                angular.isUndefinedOrNull = function(val) {
                  return val == '' || angular.isUndefined(val) || val === null
                }

                if (angular.isUndefinedOrNull(textInput))
                  return;

                function modalBox(params) {
                  var modalInstance = $uibModal.open({
                    animation: false,
                    controller: "MarkdownPreviewController",
                    controllerAs: "ctrl",
                    resolve: {
                      params: params
                    },
                    // size: "sm",
                    // templateUrl: "../common/templates/markdownPreview.modal.html"
                    template: '<div class="modal-header"> \
                                  <button class="btn btn-default pull-right modal-close" type="button" ng-click="ctrl.cancel()">X</button> \
                                  <h3 class="modal-title">{{ctrl.params.heading}}</h3> \
                               </div> \
                                <div class="modal-body"> \
                                    <div class="outer-table"> \
                                      <div style="padding:10px" ng-bind-html="::ctrl.params.markdownOut"></div> \
                                    </div> \
                                </div> '
                  });
                }

                $http({
                  url: mdGitApi,
                  method: 'POST',
                  data: {
                    text: textInput,
                    mode: 'gfm'
                  }
                }).
                then(function(response) {
                  scope.heading = 'Markdown Preview'
                  scope.markdownOut = response.data;
                  modalBox(scope);
                }, function(response) {
                  scope.heading = 'Error!'
                  scope.markdownOut = "An error encountered during markdown preview! " + response.data.message;
                  modalBox(scope);
                });
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
