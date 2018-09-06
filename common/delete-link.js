/**
* @desc
* The deleteLink directive can be used to display a UI control that performs your
* chosen deletion routine. If the confirmDelete property of chaise-config.js is
* true or undefined, the directive will display a modal and, if the user clicks
* the affirmative button, run the provided callback to delete your resource. If
* confirmDelete is false, the directive simply runs the provided callback when
* the user clicks the UI control.
* The deleteLink directive can be used as an element tag (<delete-link></delete-link>)
* or an attribute (<div delete-link></div>). It accepts the following attributes:
* @param {Function} callback - The function to delete your resource (required)
* @param {String} display ["text"] — Can be either "button" or "text". "Button" displays
* a button link. "Text" displays an anchor link.
* @param {Boolean} icon [false] - If true, the UI control will be prepended with
* a trash can icon (specifically, Bootstrap's .glypicon-trash icon).
* @param {String} label - If defined, this is the text to display on the UI control.
* @param {String} button-size - Customize with 'xs', 'sm', or 'lg'. If undefined, the
* default is the regular Bootstrap button size.
* @example <delete-link button-size="sm" icon="true" display="button" callback="ctrl.removeItem(item);"></delete-link>
*/

(function() {
    'use strict';
    angular.module('chaise.delete', ['chaise.utils'])
    .directive('deleteLink', ['modalUtils', 'UriUtils', '$rootScope', function(modalUtils, UriUtils, $rootScope) {
        var chaiseConfig = Object.assign({}, $rootScope.chaiseConfig);
        var TEMPLATES_PATH = UriUtils.chaiseDeploymentPath() + 'common/templates/delete-link/';
        var CONFIRM_DELETE =  (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) ? true : false;

        return {
            restrict: 'EA',
            scope: {
                icon: '=',
                label: '@',
                display: '@',
                callback: '&',
                buttonSize: '@'
            },
            link: function(scope) {
                scope.deleteFn = function deleteFn() {
                    if (!CONFIRM_DELETE) {
                        scope.$root.showSpinner = true;
                        return scope.callback();
                    }

                    modalUtils.showModal({
                        templateUrl: TEMPLATES_PATH + 'confirm_delete.modal.html',
                        controller: 'ConfirmDeleteController',
                        controllerAs: 'ctrl',
                        size: 'sm'
                    }, function onSuccess() {
                        scope.$root.showSpinner = true;
                        return scope.callback();
                    }, false, false);
                }
            },
            templateUrl: function(elem, attrs) {
                if (attrs.display == 'button') {
                    return TEMPLATES_PATH + 'delete-btn.html';
                }
                return TEMPLATES_PATH + 'delete-link.html';
            }
        };
    }]);
})();
