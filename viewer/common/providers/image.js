// A value to hold the row from the image table inside an object
(function() {
    'use strict';

    angular.module('chaise.viewer')
    
    // Wrap the image in an "entity" object so that Angular can watch the
    // "entity" object for changes. Set a "data" member inside so that the views
    // won't freak out when a template expression attempts to find something
    // in "data" on load.
    .value('image', {entity: {data:{}}});
})();
