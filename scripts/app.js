'use strict';

/* App Module */

var ermrestApp = angular.module('ermrestApp', [
  'ngRoute',
  'ngSanitize',
  'ngGrid',
  'rzModule',
  'ermGridController',
  'ermDiscoverController',
  'ermLoginController',
  'ermLogoutController'
]);

ermrestApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/login', {
        templateUrl: 'views/ermlogin.html'//,
        //controller: 'LoginCtrl'
      }).
      when('/logout', {
        templateUrl: 'views/ermlogout.html',
        //controller: 'LogoutCtrl'
      }).
      when('/grid', {
          templateUrl: 'views/ermgrid.html'//,
          //controller: 'GridListCtrl'
        }).
        when('/discover', {
            templateUrl: 'views/ermdiscover.html'//,
            //controller: 'DiscoverListCtrl'
          }).
      otherwise({
        redirectTo: '/discover'
      });
  }]);
