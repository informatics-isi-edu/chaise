// A value provider to hold the authenticated user's data
(function() {
    'use strict';

    angular.module('chaise.viewer')

    // Name and role are populated based on the data received from the server.session call
    // name: grabbed from the session.client object in this order: display_name, full_name, then email
    // role: determined based on the session.attributes array
    // info: used to hold the session.client object
    .value('user', {name: null, role: null, session: null});
})();
