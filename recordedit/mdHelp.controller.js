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
        'ui.bootstrap',
        'chaise.footer'
    ]).controller('mdHelpController',[function() {
        var ctrl = this;
        ctrl.hdr1 = "Raw";
        ctrl.hdr2 = "Raw (Alternative)";
        ctrl.hdr3 = "Output";
        ctrl.img = "../images/USC-Shield.png";
    }])
})();
