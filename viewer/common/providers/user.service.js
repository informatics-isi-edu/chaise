(function() {
    'use strict';

    angular.module('chaise.viewer')

    .service('UserService', ['user', 'context', function UserService(user, context) {
        function setUser() {
            var groups = context.groups;
            var session = context.session;
            var attributes = session.attributes;

            user.name = session.client;

            if (attributes.indexOf(groups.curators) > -1) {
                return user.role = 'curator';
            } else if (attributes.indexOf(groups.annotators) > -1) {
                return user.role = 'annotator';
            } else if (attributes.indexOf(groups.users) > -1) {
                return user.role = 'user';
            }
        }

        return {
            setUser: setUser
        };
    }]);
})();
