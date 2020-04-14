(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'user', 'image', 'annotations', 'AlertsService', 'ERMrest', '$window', '$q', function(context, user, image, annotations, AlertsService, ERMrest, $window, $q) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        var table = null;

        // function drawAnnotation() {
        //     iframe.postMessage({messageType: 'drawAnnotation'}, origin);
        // }

        function createAnnotation(newAnnotation) {
            if (newAnnotation.anatomy == 'No Anatomy') {
                newAnnotation.anatomy = null;
            }

            newAnnotation = [{
                "image_id": context.imageID,
                "anatomy": newAnnotation.anatomy,
                "author": user.session.client,
                "context_uri": iframe.location.href,
                "coords": [
                    newAnnotation.shape.geometry.x,
                    newAnnotation.shape.geometry.y,
                    newAnnotation.shape.geometry.width,
                    newAnnotation.shape.geometry.height
                ],
                "description": newAnnotation.description,
                "type": newAnnotation.type,
                "config": newAnnotation.config
            }];

            if (!table) table = context.schema.tables.get('annotation');
            return table.entity.post(newAnnotation, ['id', 'created', 'last_modified']).then(function success(annotation) {
                // table.entity.post returns an array of objects
                var _annotation = annotation[0];
                _annotation.table = table.name;
                annotations.push(_annotation);
                iframe.postMessage({messageType: 'createAnnotation', content: _annotation}, origin);
                return _annotation;
            }, function error(response) {
                AlertsService.addAlert(response, 'error');
                console.log(response);
            });
        }

        function cancelNewAnnotation() {
            iframe.postMessage({messageType: 'cancelAnnotationCreation'}, origin);
        }

        /**
         * checkEntryExist - checks whether the table has created an entry with the combination of keys
         * @param {string} imageID 
         * @param {string} anatomyID 
         * @return {boolean} whether table has the entry
         */
        function checkEntryExist(imageID, anatomyID){
            var defer = $q.defer();
            var uri = context.serviceURL + "/catalog/" + context.catalogID + "/entity/" + context.schemaName + ":Image_Annotation/Image=" + encodeURIComponent(imageID) + "&Anatomy="+ encodeURIComponent(anatomyID);

            ERMrest.resolve(uri, { cid: context.cid, pid: context.pid, wid: context.wid }).then(function(ref){
                 //TODO needs proper logging parameter
                return ref.contextualize.detailed.read(1, context.logObject, true, true);
            })
            .then(function(page){
                defer.resolve(page);
            })
            .catch(function(err){
                defer.reject(err);
            });

            return defer.promise;
        }

        function removeEntry(imageID, anatomyID){
            var defer = $q.defer();
            var uri = context.serviceURL + "/catalog/" + context.catalogID + "/entity/" + context.schemaName + ":Image_Annotation/Image=" + encodeURIComponent(imageID) + "&Anatomy="+ encodeURIComponent(anatomyID);
            var reference; 

            ERMrest.resolve(uri, { cid: context.cid, pid: context.pid, wid: context.wid }).then(function(ref){
                 //TODO needs proper logging parameter
                reference = ref;
                return reference.contextualize.detailed.read(1, context.logObject, true, true);
            })
            .then(function(page){
                reference.delete(context.logObject).then(function deleteSuccess(){
                    console.log("delete success");
                }, function deleteFail(){
                    console.log("delete failed");
                });
                // defer.resolve(page);
            })
            .catch(function(err){
                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * send saving result to openseadragon 
         * @param {} result 
         */
        function notifySaveResult(result) {
            iframe.postMessage({messageType: 'notifySaveResult', content: result}, origin);
        }

        function updateAnnotation(annotation) {
            if (annotation.anatomy == 'No Anatomy') {
                annotation.anatomy = null;
            }

            var annArray = [];
            annArray.push(annotation);

            // Update in ERMrest
            if (!table) table = context.schema.tables.get('annotation');
            table.entity.put(annArray).then(function success(response) {
                if (response[0]) {
                    // Returns an array of objects that were updated
                    var _annotation = response[0]
                    // Update in Annotorious
                    iframe.postMessage({messageType: 'updateAnnotation', content: _annotation}, origin);
                }
            }, function error(response) {
                AlertsService.addAlert(response, 'error');
                console.log(response);
            });
        }

        function deleteAnnotation(annotation) {
            // Delete from ERMrest
            if (!table) table = context.schema.tables.get('annotation');
            var deleteFilter = new ERMrest.BinaryPredicate(table.columns.get('id'), ERMrest.OPERATOR.EQUAL, annotation.id);
            table.entity.delete(deleteFilter).then(function success(response) {
                // Delete from the 'annotations' provider
                var index = annotations.indexOf(annotation);
                annotations.splice(index, 1);

                iframe.postMessage({messageType: 'deleteAnnotation', content: annotation}, origin);
            }, function error(response) {
                AlertsService.addAlert(response, 'error');
                console.log(response);
            });
        }

        function centerAnnotation(annotation) {
            iframe.postMessage({messageType: 'centerAnnotation', content: annotation}, origin);
        }

        function syncVisibility() {
            iframe.postMessage({messageType: 'syncVisibility', content: annotations}, origin);
        }

        function highlightAnnotation(data){
            iframe.postMessage({messageType: 'highlightAnnotation', content: data}, origin);
        }

        function changeAnnotationVisibility(data){
            iframe.postMessage({messageType: 'changeAnnotationVisibility', content: data}, origin);
        }

        function changeAllAnnotationVisibility(data){
            iframe.postMessage({messageType: 'changeAllAnnotationVisibility', content: data}, origin);
        }

        function changeStrokeScale(scale){
            iframe.postMessage({messageType: 'changeStrokeScale', content: scale}, origin);
        }

        function drawAnnotation(data){
            iframe.postMessage({messageType: 'drawAnnotationMode', content: data}, origin);
        }

        function changeGroupInfo(data){
            iframe.postMessage({messageType: 'changeGroupInfo', content: data}, origin);
        }

        function addNewTerm(data){
            iframe.postMessage({messageType: 'addNewTerm', content: data}, origin);
        }

        function saveAnnotationRecord(data){
            iframe.postMessage({messageType: 'saveAnnotationRecord', content: data}, origin);
        }

        return {
            drawAnnotation: drawAnnotation,
            createAnnotation: createAnnotation,
            cancelNewAnnotation: cancelNewAnnotation,
            checkEntryExist : checkEntryExist,
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation,
            centerAnnotation: centerAnnotation,
            syncVisibility: syncVisibility,
            highlightAnnotation : highlightAnnotation,
            changeAnnotationVisibility : changeAnnotationVisibility,
            changeAllAnnotationVisibility : changeAllAnnotationVisibility,
            changeStrokeScale : changeStrokeScale,
            changeGroupInfo : changeGroupInfo,
            addNewTerm : addNewTerm,
            notifySaveResult : notifySaveResult,
            removeEntry : removeEntry,
            saveAnnotationRecord : saveAnnotationRecord
        };

    }]);
})();
