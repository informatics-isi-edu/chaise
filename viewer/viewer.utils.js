(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('viewerAppUtils', [
        'annotationCreateForm', 'annotationEditForm', 'AnnotationsService', 'ConfigUtils', 'context', 'DataUtils', 'ERMrest', 'logService', 'recordCreate', 'UriUtils', 'viewerConstant',
        '$q', '$rootScope',
        function (annotationCreateForm, annotationEditForm, AnnotationsService, ConfigUtils, context, DataUtils, ERMrest, logService, recordCreate, UriUtils, viewerConstant,
                  $q, $rootScope) {

        var annotConstant = viewerConstant.annotation,
            osdConstant = viewerConstant.osdViewer,
            channelConstant = viewerConstant.channel;

        /**
         * @private
         * add channel query parameters that are in src to dest
         */
        function _addChannelParams(dest, src) {
            osdConstant.CHANNEL_QPARAMS.forEach(function (qp) {
                if (qp in src) {
                    dest[qp] = src[qp];
                }
            });
        }

        /**
         * Whether a given queryParams has url.
         * If lookForAnnotation is passed, it will also check for the url value being annotation.
         * @param {Object} queryParams - query params object
         * @param {Boolean=} lookForAnnotation - if true, will also check for annotation
         * @returns {Boolean}
         */
        function hasURLQueryParam(queryParams, lookForAnnotation) {
            if (!(osdConstant.IMAGE_URL_QPARAM in queryParams)) {
                return false;
            }

            // see if any of the urls are for annotation
            // NOTE we're using the same logic as osd viewer, if that one changed, we should this as well
            for (var queryKey in queryParams[osdConstant.IMAGE_URL_QPARAM]) {
                var url = queryParams[osdConstant.IMAGE_URL_QPARAM][queryKey];
                if (url.indexOf(".svg") != -1 || url.indexOf(annotConstant.OVERLAY_HATRAC_PATH) != -1) {
                    // found a url query parameter that is annotation
                    if (lookForAnnotation) return true;
                } else {
                    // found a url query parameter that is not annotation
                    if (!lookForAnnotation) return true;
                }
            }

            return false;
        }

        /**
         * Using what's in the query parameters and the value of Image.uri,
         * create a queryParams object that will be sent to osd viewer.
         * The logic is as follows:
         * regarding channel info (url, aliasName, channelName, pseudoColor, isRGB)
         *   - if url is defined on query parameter, get all the channel info from query parameter.
         *   - otherwise, if url is defined on imageURI, get all the channel info from imageURI.
         *   - otherwise, add a signal so we can fetch the channel info later.
         * regarding the rest of query params:
         *   - if defined on query parameter, use it.
         *   - otherwise if defined on imageURI, use it.
         */
        function populateOSDViewerQueryParams (pageQueryParams, imageURI) {
            var imageURIQueryParams = {},
                readChannelInfo = true, osdViewerQueryParams = {},
                urlQParam = osdConstant.IMAGE_URL_QPARAM;

            if (DataUtils.isNoneEmptyString(imageURI)) {
                if (imageURI.indexOf("?") === -1) {
                    imageURI = "?" + imageURI;
                }
                imageURIQueryParams = UriUtils.getQueryParams(imageURI, true);
            }

            // get all the channel query parameters  from the page query paramter
            if (hasURLQueryParam(pageQueryParams)) {
                readChannelInfo = false;
                _addChannelParams(osdViewerQueryParams, pageQueryParams);
            }
            // get all the channel query parameters from image
            else if (hasURLQueryParam(imageURIQueryParams)) {
                readChannelInfo = false;
                _addChannelParams(osdViewerQueryParams, imageURIQueryParams)
            }

            // add the rest of query parameters
            osdConstant.OTHER_QPARAMS.forEach(function (qp) {

                if (qp in imageURIQueryParams) {
                    osdViewerQueryParams[qp] = imageURIQueryParams[qp];
                } else if (qp in pageQueryParams) {
                    osdViewerQueryParams[qp] = pageQueryParams[qp];
                }
            });

            return {
                osdViewerQueryParams: osdViewerQueryParams,
                readChannelInfo: readChannelInfo
            }
        }

        /**
         * Send request to image channel table and returns a promise that is resolved
         * by an array containing the channel information that can be used to send to osd viewer.
         */
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

                var hasNull = false;

                // the callback that will be used for populating the result values
                var cb = function (page) {
                    for (var i = 0; i < page.tuples.length; i++) {
                        var t = page.tuples[i];

                        var channelURL = t.data[channelConstant.IMAGE_URL_COLUMN_NAME];

                        // if any of the urls are null, then none of the values are valid
                        if (!DataUtils.isNoneEmptyString(channelURL)) {
                            hasNull = true;
                            return false;
                        }
                        var pseudoColor = t.data[channelConstant.PSEUDO_COLOR_COLUMN_NAME];
                        var channelName = t.data[channelConstant.CHANNEL_NAME_COLUMN_NAME];

                        // create the channel info
                        var res = {};
                        res[osdConstant.IMAGE_URL_QPARAM] = channelURL;
                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;
                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : "";
                        res[osdConstant.IS_RGB_QPARAM] = t.data[channelConstant.IS_RGB_COLUMN_NAME] == true ? "true" : "false";
                        channelList.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.sort(channelConstant.CHANNEL_TABLE_COLUMN_ORDER);

                // send request to server
                return _readPageByPage(ref, channelConstant.PAGE_COUNT, logObj, cb);
            }).then(function () {
                defer.resolve(channelList);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * Send request to image annotation table and populates the values in the $rootScope
         */
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

                    return true;
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

        /**
         * since we don't know the size of our requests, this will make sure the
         * requests are done in batches until all the values are processed.
         */
        function _readPageByPage (ref, pageSize, logObj, cb) {
            var defer = $q.defer();
            ref.read(pageSize, logObj, false, true).then(function (page){
                if (page && page.length > 0) {
                    var cb_res = cb(page);
                    if (cb_res === false) {
                        return false;
                    }
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
            populateOSDViewerQueryParams: populateOSDViewerQueryParams,
            getChannelInfo: getChannelInfo,
            readAllAnnotations: readAllAnnotations,
            hasURLQueryParam: hasURLQueryParam
        };

    }]);

})();
