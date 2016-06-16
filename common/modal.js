(function () {
    'use strict';

    angular.module('chaise.modal', [])

    .controller('ConfirmDeleteController', function ConfirmDeleteController($uibModalInstance, params) {
        // TODO: Figure out how to handle when user doesn't pass in params dependency.
        // When user doesn't pass in params, modal throws an unknown provider error.

        // Would prefer to do inline dependency annotation but then the controller complains if
        // user doesn't pass in params.

        // Implicit dependency injection works if whether user passes in param or not.
        // But then this controller would get mangled if we ever minify this code.
        var vm = this;
        vm.ok = ok;
        vm.cancel = cancel;

        function ok() {
            $uibModalInstance.close();
            if (params.ok) {
            // When modal is instantiated, user can pass in a params obj to tell
            // us what to do after user clicks the positive/affirmative button (e.g. "OK" or "Delete").
                params.ok();
            }
        }

        function cancel() {
            $uibModalInstance.dismiss('cancel');
            if (params.cancel) {
                params.cancel();
            }
        }
    });
})();
