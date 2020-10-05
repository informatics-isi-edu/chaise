(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('viewerAppUtils', [
        'annotationCreateForm', 'annotationEditForm', 'AnnotationsService', 'ConfigUtils', 'context', 'ERMrest', 'logService', 'recordCreate', 'UriUtils', 'viewerConstant',
        '$q', '$rootScope',
        function (annotationCreateForm, annotationEditForm, AnnotationsService, ConfigUtils, context, ERMrest, logService, recordCreate, UriUtils, viewerConstant,
                  $q, $rootScope) {

        var annotConstant = viewerConstant.annotation,
            channelConstant = viewerConstant.channel;

        function getChannelInfo() {
            var defer = $q.defer(), channelList = [];

            // TODO should be done in ermrestjs
            var imageChannelURL = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConstant.CHANNE_TABLE_SCHEMA_NAME) + ":";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConstant.CHANNEL_TABLE_NAME) + "/";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConstant.REFERENCE_IMAGE_COLUMN_NAME);
            imageChannelURL += "=" + UriUtils.fixedEncodeURIComponent(context.imageID);

            ERMrest.resolve(imageChannelURL, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                if (!ref) {
                    return false;
                }

                var stackPath = logService.getStackPath("", logService.logStackPaths.CHANNEL_SET);
                var logObj = {
                    action: logService.getActionString(logService.logActions.LOAD, stackPath),
                    stack: logService.getStackObject(logService.getStackNode(logService.logStackTypes.CHANNEL, ref.table))
                };

                var cb = function (page) {
                    channelList = page.tuples.map(function (t) {
                        // TODO what if name and url are not defined?
                        return {
                            url: t.data[channelConstant.IMAGE_URL_COLUMN_NAME],
                            channelName: t.data[channelConstant.CHANNEL_NAME_COLUMN_NAME],
                            channelRGB: t.data[channelConstant.PSEUDO_COLOR_COLUMN_NAME]
                        };
                    });
                }

                ref = ref.sort(channelConstant.CHANNEL_TABLE_COLUMN_ORDER);
                return _readPageByPage(ref, channelConstant.PAGE_COUNT, logObj, cb);
            }).then(function () {
                defer.resolve(channelList);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        function isAnnotationURL(url) {
            return url.indexOf(".svg") != -1 || url.indexOf(annotConstant.OVERLAY_HATRAC_PATH) != -1;
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

                var logObj = {
                    action: AnnotationsService.getAnnotationLogAction(logService.logActions.LOAD),
                    stack: AnnotationsService.getAnnotationLogStack()
                };

                var cb = function (page) {
                    $rootScope.annotationTuples = $rootScope.annotationTuples.concat(page.tuples);

                    page.tuples.forEach(function (tuple) {
                        if(tuple.data && tuple.data[annotConstant.OVERLAY_COLUMN_NAME]){
                            $rootScope.annotationURLs.push(tuple.data[annotConstant.OVERLAY_COLUMN_NAME]);

                            $rootScope.hideAnnotationSidebar = false;
                        }
                    });
                }

                // using edit, because the tuples are used in edit context (for populating edit form)
                return _readPageByPage(ref, annotConstant.PAGE_COUNT, logObj, cb);
            }).then(function (res) {
                defer.resolve(res);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        function _readPageByPage (ref, pageSize, logObj, cb) {
            var defer = $q.defer();
            ref.read(pageSize, logObj, false, true).then(function (page){
                if (page && page.length > 0) {
                    cb(page);
                } else {
                    return false;
                }

                if (page.hasNext) {
                    return _readPageByPage(page.next);
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
            getChannelInfo: getChannelInfo,
            readAllAnnotations: readAllAnnotations,
            isAnnotationURL: isAnnotationURL
        };

    }]);

})();
