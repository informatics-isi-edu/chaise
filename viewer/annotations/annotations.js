// A value to hold the rows of the annotation table
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .value('annotations', [])

    .value('annotationCreateForm', {
        reference: null,
        columnModels: []
    })

    .value('annotationEditForm', {
        reference: null,
        columnModels: []
    });
})();
