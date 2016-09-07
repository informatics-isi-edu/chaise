'use strict';

/* Controllers */

var ermLogoutController = angular.module('ermLogoutController', []);

ermLogoutController.controller('LogoutCtrl', ['$scope',
                                            function($scope) {
	$scope.webApp = '';
	if (chaiseConfig['customCSS'] !== undefined) {
		var fileref = document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", chaiseConfig['customCSS']);
		document.getElementsByTagName("head")[0].appendChild(fileref);
	}
	if (chaiseConfig['headTitle'] !== undefined) {
		var title = document.createElement("title");
		title.innerHTML = chaiseConfig['headTitle'];
		document.getElementsByTagName("head")[0].appendChild(title);
		$scope.webApp = 'of ' + chaiseConfig['headTitle'];
	}
	loadApplicationFooter();
}]);


