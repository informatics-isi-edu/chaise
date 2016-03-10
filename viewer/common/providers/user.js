// A value provider to hold the authenticated user's data
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .value('user', {name: null, role: null});
})();
