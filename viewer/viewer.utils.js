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
            pImageConstant = viewerConstant.processedImage,
            channelConstant = viewerConstant.channel,
            URLQParamAttr = viewerConstant.osdViewer.IMAGE_URL_QPARAM;

        var encode = UriUtils.fixedEncodeURIComponent;

        /**
         * @private
         * add channel query parameters that are in src to dest
         */
        function _addChannelParams(dest, src) {
            osdConstant.CHANNEL_QPARAMS.forEach(function (qp) {
                if (qp in src) {
                    // there might be annotation urls in dest
                    if (qp === URLQParamAttr && Array.isArray(dest[qp])) {
                        dest[qp] = dest[qp].concat(src[qp])
                        return;
                    }

                    dest[qp] = src[qp];
                }
            });
        }

        /**
         * Whether a given queryParams has url.
         * If lookForAnnotation is passed, it will also check for the url value being annotation.
         * @param {Object} queryParams - query params object
         * @param {Boolean=} lookForAnnotation - if true, will also check for annotation
         * @param {Object=} annotationQueryParams - pass an object so the function stores the annotation query params in there
         * @returns {Boolean}
         */
        function hasURLQueryParam(queryParams, lookForAnnotation, annotationQueryParams) {
            if (!(URLQParamAttr in queryParams)) {
                return false;
            }

            var urlQParam = queryParams[URLQParamAttr], res, i;

            var checkURL = function (url) {
                // see if any of the urls are for annotation
                // NOTE we're using the same logic as osd viewer, if that one changed, we should this as well
                if (url.indexOf(".svg") != -1 || url.indexOf(annotConstant.OVERLAY_HATRAC_PATH) != -1) {
                    // store the annotation urls
                    if (typeof annotationQueryParams === "object") {
                        if (!(URLQParamAttr in annotationQueryParams)) {
                            annotationQueryParams[URLQParamAttr] = []
                        }
                        annotationQueryParams[URLQParamAttr].push(url);
                    }

                    // found a url query parameter that is annotation
                    if (lookForAnnotation) return true;
                } else {
                    // found a url query parameter that is not annotation
                    if (!lookForAnnotation) return true;
                }
                return null;
            }

            if (typeof urlQParam === "string") {
                return checkURL(urlQParam) === true;
            }

            if (Array.isArray(urlQParam)){
                for (i = 0; i < urlQParam.length; i++) {
                    res = checkURL(urlQParam[i]);
                    if (typeof res === "boolean") {
                        return res;
                    }
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
            var readChannelInfo = true, osdViewerQueryParams = {}, imageURIQueryParams = {};

            if (DataUtils.isNoneEmptyString(imageURI)) {
                if (imageURI.indexOf("?") === -1) {
                    imageURI = "?" + imageURI;
                }
                imageURIQueryParams = UriUtils.getQueryParams(imageURI, true);
            }

            // get all the channel query parameters from the page query paramter
            if (hasURLQueryParam(pageQueryParams, false, osdViewerQueryParams)) {
                // the annotation urls might have been added
                osdViewerQueryParams = {};

                readChannelInfo = false;
                _addChannelParams(osdViewerQueryParams, pageQueryParams);
            }
            // get all the channel query parameters from image
            else if (hasURLQueryParam(imageURIQueryParams, false, osdViewerQueryParams)) {
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
         * NOTE added for backward compatibility and eventually should be removed
         */
        function _readImageChannelTable() {
            var defer = $q.defer(), channelList = [];

            // TODO should be done in ermrestjs
            var imageChannelURL = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConstant.CHANNE_TABLE_SCHEMA_NAME) + ":";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConstant.CHANNEL_TABLE_NAME) + "/";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConstant.REFERENCE_IMAGE_COLUMN_NAME);
            imageChannelURL += "=" + UriUtils.fixedEncodeURIComponent(context.imageID);

            var hasNull = false;
            ERMrest.resolve(imageChannelURL, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                if (!ref) {
                    return false;
                }

                var stackPath = logService.getStackPath("", logService.logStackPaths.CHANNEL_SET);
                var stack = logService.getStackObject(
                    logService.getStackNode(
                        logService.logStackTypes.CHANNEL,
                        ref.table,
                        { "z_index": context.defaultZIndex}
                    )
                );
                var logObj = {
                    action: logService.getActionString(logService.logActions.VIEWER_CHANNEL_DEFAULT_LOAD, stackPath),
                    stack: stack
                };

                // the callback that will be used for populating the result values
                var cb = function (page) {
                    for (var i = 0; i < page.tuples.length && !hasNull; i++) {
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
                        res[URLQParamAttr] = channelURL;
                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;
                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : "null";
                        var isRGB = t.data[channelConstant.IS_RGB_COLUMN_NAME];
                        res[osdConstant.IS_RGB_QPARAM] = (typeof isRGB === "boolean") ? isRGB.toString() : "null";
                        channelList.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(channelConstant.CHANNEL_TABLE_COLUMN_ORDER);

                // send request to server
                return _readPageByPage(ref, channelConstant.PAGE_SIZE, logObj, true, cb);
            }).then(function () {
                if (hasNull) {
                    channelList = [];
                }
                defer.resolve(channelList);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * Send request to processed image table and returns a promise that is resolved
         * by an array containing the channel information that can be used to send to osd viewer.
         */
        function _readProcessedImageTable() {
            var defer = $q.defer(), channelList = [];


            // TODO should be done in ermrestjs
            var url = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
            url += encode(pImageConstant.PROCESSED_IMAGE_TABLE_SCHEMA_NAME) + ":";
            url += encode(pImageConstant.PROCESSED_IMAGE_TABLE_NAME) + "/";
            url += encode(pImageConstant.REFERENCE_IMAGE_COLUMN_NAME);
            url += "=" + encode(context.imageID);

            if (context.defaultZIndex != null) {
                url += "&" + encode(pImageConstant.Z_INDEX_COLUMN_NAME);
                url += "=" + encode(context.defaultZIndex);
            }

            var hasNull = false;
            ERMrest.resolve(url, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                if (!ref) {
                    return false;
                }

                var stackPath = logService.getStackPath("", logService.logStackPaths.CHANNEL_SET);
                var stack = logService.getStackObject(
                    logService.getStackNode(
                        logService.logStackTypes.CHANNEL,
                        ref.table,
                        { "z_index": context.defaultZIndex}
                    )
                );
                var logObj = {
                    action: logService.getActionString(logService.logActions.LOAD, stackPath),
                    stack: stack
                };

                // the callback that will be used for populating the result values
                var cb = function (page) {

                    for (var i = 0; i < page.tuples.length && !hasNull; i++) {
                        var t = page.tuples[i];
                        var channelURL = t.data[pImageConstant.IMAGE_URL_COLUMN_NAME];

                        // if any of the urls are null, then none of the values are valid
                        if (!DataUtils.isNoneEmptyString(channelURL)) {
                            hasNull = true;
                            return false;
                        }

                        // for different methods we might have to format the url
                        var displayMethod = t.data[pImageConstant.DISPLAY_METHOD_COLUMN_NAME];
                        if (displayMethod in pImageConstant.IMAGE_URL_PATTERN) {
                            channelURL = UriUtils.getAbsoluteURL(channelURL);

                            channelURL = ERMrest.renderHandlebarsTemplate(pImageConstant.IMAGE_URL_PATTERN[displayMethod], {"url": channelURL, "iiif_version": pImageConstant.IIIF_VERSION});
                        }

                        // get the channel extra data
                        var channelData = {};
                        var channelVisColName = pImageConstant.CHANNEL_VISIBLE_COLUMN_NAME;
                        if (t.linkedData && (channelVisColName in t.linkedData) && DataUtils.isObjectAndNotNull(t.linkedData[channelVisColName])) {
                            channelData = t.linkedData[channelVisColName];
                        }

                        var channelName = channelData[channelConstant.CHANNEL_NAME_COLUMN_NAME];
                        var pseudoColor = channelData[channelConstant.PSEUDO_COLOR_COLUMN_NAME];

                        // create the channel info
                        var res = {};
                        res[URLQParamAttr] = channelURL;
                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;
                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : "null";
                        // null should be treated the same as true
                        res[osdConstant.IS_RGB_QPARAM] = channelData[channelConstant.IS_RGB_COLUMN_NAME] === false ? "false" : "true";
                        channelList.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(pImageConstant.COLUMN_ORDER);

                // send request to server
                return _readPageByPage(ref, pImageConstant.PAGE_SIZE, logObj, false, cb);
            }).then(function () {
                if (hasNull) {
                    channelList = [];
                }

                defer.resolve(channelList);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * first try the processedImage table and then the ImageChannel to get the channel info
         * that can be sent to osd viewer.
         */
        function getChannelInfo() {
            var defer = $q.defer();
            console.log("reading processed image");
            _readProcessedImageTable().then(function (res) {
                if (res.length !== 0) {
                    return res;
                }

                console.log("reading image channel");
                return _readImageChannelTable();
            }).then(function (channelList) {
                defer.resolve(channelList);
            }).catch(function (err) {
                // just log the error and resolve with empty array
                console.error("error while getting channel info: ", err);
                defer.resolve([]);
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
            imageAnnotationURL += encode(annotConstant.ANNOTATION_TABLE_SCHEMA_NAME) + ":";
            imageAnnotationURL += encode(annotConstant.ANNOTATION_TABLE_NAME) + "/";
            imageAnnotationURL += encode(annotConstant.REFERENCE_IMAGE_COLUMN_NAME);
            imageAnnotationURL += "=" + encode(context.imageID);

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
                return _readPageByPage(ref, annotConstant.PAGE_SIZE, logObj, false, cb);
            }).then(function (res) {
                defer.resolve(res);
            }).catch(function (err) {
                // just log the error and resolve with empty array
                console.error("error while getting annotations: ", err);
                $rootScope.annotationTuples = [];
                $rootScope.canCreate = false;
                defer.resolve(false);
            });

            return defer.promise;
        }

        /**
         * since we don't know the size of our requests, this will make sure the
         * requests are done in batches until all the values are processed.
         */
        function _readPageByPage (ref, pageSize, logObj, useEntity, cb) {
            var defer = $q.defer();
            ref.read(pageSize, logObj, useEntity, true).then(function (page){
                if (page && page.length > 0) {
                    var cb_res = cb(page);
                    if (cb_res === false) {
                        return false;
                    }
                } else {
                    return false;
                }

                if (page.hasNext) {
                    return _readPageByPage(page.next, pageSize, logObj, useEntity, cb);
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
