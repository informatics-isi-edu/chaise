(function() {
    'use strict';
    angular.module('chaise.mdHelp', [
        'chaise.authen',
        'chaise.filters',
        'chaise.alerts',
        'chaise.modal',
        'chaise.errors',
        'chaise.utils',
        'chaise.navbar',
        'ermrestjs',
        'ngSanitize',
        'ui.bootstrap'
    ]).controller('mdHelpController',[function() {
        var ctrl = this;
        ctrl.hdg1 = "Raw";
        ctrl.img = "../images/USC-Shield.png";
    }])
})();
