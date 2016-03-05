'use strict';

var ermrestTourController = angular.module('ermrestTourController', []);

ermrestTourController.controller('ermrestTourController', ['$scope', '$interval', 'FacetsData', 'FacetsService', 'ermrest',
  function($scope, $interval, FacetsData, FacetsService, ermrest) {
    $scope.FacetsData = FacetsData;
    var vm = this; //viewModel
    vm.progress = false;

    /**
     * @desc changes the page to its initial state, creates steps ,and starts the tour.
     */
    vm.startTour = function startTour($event) {
      vm.progress = true;

      $scope.facetResults.resetSearch($event);

      var addStepsInterval = $interval(function () { // not the best solution
        if(!$("#navcontainer a:visible:not(.view-attr)").length){
          return;
        }
        restartTour(); // in tour.js file

        vm.progress = false;
        $interval.cancel(addStepsInterval);
      }, 1000);
    };

  }
]);
