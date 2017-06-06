(function() {
  'use strict';

  angular.module('chaise.markdown', [])
    .directive('markdownPreview', ['$uibModal', '$window', '$http', function($uibModal, $window, $http) {

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
                if (textInput == ' ')
                  return;

                function modalBox(params) {
                  var modalInstance = $uibModal.open({
                    animation: false,
                    controller: "NewMarkdownPreviewController",
                    controllerAs: "ctrl",
                    resolve: {
                      params: params
                    },
                    // size: "sm",
                    templateUrl: "../common/templates/markdownPreview.modal.html"
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
    .controller('NewMarkdownPreviewController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', function MarkdownPreviewController($scope, $uibModalInstance, DataUtils, params, Session) {
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
