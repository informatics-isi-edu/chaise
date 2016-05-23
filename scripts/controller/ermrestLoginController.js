'use strict';

/* Controllers */

var ermLoginController = angular.module('ermLoginController', []);

ermLoginController.controller('LoginCtrl', ['$scope', 'ermrest',
                                           function($scope, ermrest) {
	if (HOME == null) {
		initLocation();
	}
	
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
	}
	loadApplicationHeaderAndFooter();
	setNavbarBrand();

	this.login = function login() {
		var params = $scope.getParameters();
		//console.log(JSON.stringify(params, null, 4));
		submitLogin($scope.username, $scope.password, params['referrer'], params['action'], params['text'], params['password']);
	};
	this.cancelLogin = function cancelLogin() {
		window.location = '#/retrieve';
	};
	this.checkLogin = function checkLogin(keyCode) {
		if (keyCode == 13 && $scope.username && $scope.password) {
			this.login();
		}
	};
	this.disableLoginButton = function disableLoginButton() {
		return (!$scope.username || !$scope.password);
	};
	
	$scope.getReferrer = function getReferrer() {
		var referrer = null;
		var query = decodeURIComponent(window.location.search);
		if (query.length > 0) {
			query = query.substring(1);
		}
		var parameters = query.split('&');
		$.each(parameters, function(i, parameter) {
			var item = parameter.split('=');
			if ([item[0]] == 'referrer') {
				item.shift();
				referrer = item.join('=');
			}
		});
		return referrer;
	};
	
	$scope.getParameters = function getParameters() {
		var result = {};
		//var query = decodeURIComponent(window.location.search);
		var query = window.location.search;
		if (query.length > 0) {
			query = query.substring(1);
		}
		var parameters = query.split('&');
		$.each(parameters, function(i, parameter) {
			var item = parameter.split('=');
			if ([item[0]] == 'referrer') {
				result['referrer'] = decodeURIComponent(item[1]);
			} else if ([item[0]] == 'method') {
				result['method'] = item[1];
			} else if ([item[0]] == 'action') {
				result['action'] = decodeURIComponent(item[1]);
			} else if ([item[0]] == 'text') {
				result['text'] = decodeURIComponent(item[1]);
			} else if ([item[0]] == 'hidden') {
				result['password'] = decodeURIComponent(item[1]);
			}
		});
		return result;
	};
	
}]);

