(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('viewerAppUtils', [
        'annotationCreateForm', 'annotationEditForm', 'AnnotationsService', 'ConfigUtils', 'context', 'ERMrest', 'logService', 'recordCreate', 'UriUtils', 'viewerConstant', 
        '$q', '$rootScope', 
        function (annotationCreateForm, annotationEditForm, AnnotationsService, ConfigUtils, context, ERMrest, logService, recordCreate, UriUtils, viewerConstant, 
                  $q, $rootScope) {
        
        var annotConstant = viewerConstant.annotation;

        /** TODO should we move this to osd viewer?
         * if we cannot show any annotation on the image (osd doesn't support it), 
         *  - disable the annotation list
         *  - don't even send a request to database
         */
        function canOSDShowAnnotation(osdViewerQueryParams) {
            var res = false;

            if (!osdViewerQueryParams) {
                return res;
            }
            osdViewerQueryParams.split('&').forEach(function (queryStr) {
                var qpart = queryStr.split("=");
                if (qpart.length != 2 || qpart[0] !== "url") return;
                
                if (qpart[1].indexOf("info.json") != -1) {
                    res = true;
                }
            });
            
            return res;
        }
        
        function readAllAnnotations () {
            var defer = $q.defer();
            
            // TODO should be done in ermrestjs
            var imageAnnotationURL = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
            imageAnnotationURL += UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATION_TABLE_SCHEMA_NAME) + ":";
            imageAnnotationURL += UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATION_TABLE_NAME) + "/";
            imageAnnotationURL += UriUtils.fixedEncodeURIComponent(annotConstant.REFERENCE_IMAGE_COLUMN_NAME);
            imageAnnotationURL += "=" + UriUtils.fixedEncodeURIComponent(context.imageID);

            ERMrest.resolve(imageAnnotationURL, ConfigUtils.getContextHeaderParams()).then(function (ref) {
            
                if (!ref) {
                    $rootScope.canCreate = false;
                    $rootScope.canUpdate = false;
                    $rootScope.canDelete = false;
                    return false;
                }
                
                // since we use this for populating edit form, we want this in edit context
                ref = ref.contextualize.entryEdit;

                // TODO we might be able to refactor this
                // attach to the $rootScope so it can be used in annotations.controller
                $rootScope.annotationEditReference = ref;

                $rootScope.canCreate = ref.canCreate || false;
                $rootScope.canUpdate = ref.canUpdate || false;
                $rootScope.canDelete = ref.canDelete || false;

                ref.session = $rootScope.session;

                // TODO create and edit should be refactored to reuse the same code
                // create the edit and create forms
                var invisibleColumns = [
                    annotConstant.OVERLAY_COLUMN_NAME,
                    annotConstant.REFERENCE_IMAGE_VISIBLE_COLUMN_NAME,
                    annotConstant.Z_INDEX_COLUMN_NAME,
                    annotConstant.CHANNELS_COLUMN_NAME
                ];
                if ($rootScope.canCreate) {
                    annotationCreateForm.reference = ref.contextualize.entryCreate;
                    annotationCreateForm.reference.columns.forEach(function (column) {
                        // remove the invisible (asset, image, z-index, channels) columns
                        if (invisibleColumns.indexOf(column.name) !== -1) return;

                        annotationCreateForm.columnModels.push(recordCreate.columnToColumnModel(column));
                    });
                }

                if ($rootScope.canUpdate) {
                    annotationEditForm.reference = ref;
                    annotationEditForm.reference.columns.forEach(function (column) {
                        // remove the invisible (asset, image, z-index, channels) columns
                        if (invisibleColumns.indexOf(column.name) !== -1) return;

                        annotationEditForm.columnModels.push(recordCreate.columnToColumnModel(column));
                    });
                }
                
                // TODO not used
                $rootScope.showColumnSpinner = [{}];
                
                $rootScope.annotationTuples = [];
                $rootScope.annotationURLs = [];

                // using edit, because the tuples are used in edit context (for populating edit form)
                return _readAnnotations(ref);
            }).then(function (res) {
                defer.resolve(res);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }
        
        /**
         * read all the annotaitons on the image.
         * depending on the number of annotations in db, it might send multiple requests
         */ 
        function _readAnnotations (ref) {
            var defer = $q.defer();
            var logObj = {
                action: AnnotationsService.getAnnotationLogAction(logService.logActions.VIEWER_ANNOT_LOAD),
                stack: AnnotationsService.getAnnotationLogStack()
            };

            ref.read(annotConstant.PAGE_COUNT, logObj, false, true).then(function (page){
                if (page && page.length > 0) {
                    $rootScope.annotationTuples = $rootScope.annotationTuples.concat(page.tuples);
                    
                    page.tuples.forEach(function (tuple) {
                        if(tuple.data && tuple.data[annotConstant.OVERLAY_COLUMN_NAME]){
                            $rootScope.annotationURLs.push(tuple.data[annotConstant.OVERLAY_COLUMN_NAME]);
                            
                            $rootScope.hideAnnotationSidebar = false;
                        }
                    });
                } else {
                    return false;
                }
                
                if (page.hasNext) {
                    return _readAnnotations(page.next);
                }
                return true;
            }).then(function (res) {
                defer.resolve(res);
            }).catch(function (err) {
                defer.reject(err);
            });
            
            return defer.promise;
        }
        
        return {
            readAllAnnotations: readAllAnnotations,
            canOSDShowAnnotation: canOSDShowAnnotation
        };
        
    }]);
    
})();
