'use strict';

/* App Module */

var facebaseApp = angular.module('facebaseApp', [
  'ngRoute',
  'ngSanitize',
  'ngGrid',
  'rzModule',
  'fbGridController',
  'fbDiscoverController',
  'fbLoginController',
  'fbLogoutController'
]);

facebaseApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/login', {
        templateUrl: 'views/fblogin.html'//,
        //controller: 'LoginCtrl'
      }).
      when('/logout', {
        templateUrl: 'views/fblogout.html',
        //controller: 'LogoutCtrl'
      }).
      when('/grid', {
          templateUrl: 'views/fbgrid.html'//,
          //controller: 'GridListCtrl'
        }).
        when('/discover', {
            templateUrl: 'views/fbdiscover.html'//,
            //controller: 'DiscoverListCtrl'
          }).
      otherwise({
        redirectTo: '/discover'
      });
  }]);
