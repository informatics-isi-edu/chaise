'use strict';

/* App Module */

var facebaseApp = angular.module('facebaseApp', [
  'ngRoute',
  'ngSanitize',
  'ngGrid',
  'rzModule',
  'facetsControllers'
]);

facebaseApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/login', {
        templateUrl: 'templates/login.html'//,
        //controller: 'LoginCtrl'
      }).
      when('/logout', {
        templateUrl: 'templates/logout.html',
        controller: 'LogoutCtrl'
      }).
      when('/facets', {
        templateUrl: 'templates/facets.html'//,
        //controller: 'FacetListCtrl'
      }).
      when('/facets/:facet', {
        templateUrl: 'templates/facet-refine.html'//,
        //controller: 'FacetRefineCtrl'
      }).
      otherwise({
        redirectTo: '/facets'
      });
  }]);
