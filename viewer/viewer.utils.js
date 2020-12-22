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
            URLQParamAttr = viewerConstant.osdViewer.IMAGE_URL_QPARAM,
            encode = UriUtils.fixedEncodeURIComponent;

        /**
         * same logic as OSD viewer
         */
        function _isURLAnnotation(url) {
            return url.indexOf(".svg") != -1 || url.indexOf(annotConstant.OVERLAY_HATRAC_PATH) != -1;
        }

        function _getQueryParamByIndex(qParamVal, i) {
            var _sanitizeVal = function (v) {
                return v === "null" ? null : v;
            };

            if (typeof qParamVal === "string") {
                return i === 0 ? _sanitizeVal(qParamVal) : null;
            }
            if (Array.isArray(qParamVal)) {
                return i < qParamVal.length ? _sanitizeVal(qParamVal[i]) : null;
            }
            return null;
        }

        /**
         * Whether a given queryParams has url.
         * If lookForAnnotation is passed, it will also check for the url value being annotation.
         * @param {Object} queryParams - query params object
         * @param {Boolean=} lookForAnnotation - if true, will also check for annotation
         * @returns {Boolean}
         */
        function hasURLQueryParam(queryParams, lookForAnnotation, imageURLs, annotationURLs) {
            if (!(URLQParamAttr in queryParams)) {
                return false;
            }

            var urlQParam = queryParams[URLQParamAttr], res, i;

            var checkURL = function (url) {
                // see if any of the urls are for annotation
                // NOTE we're using the same logic as osd viewer, if that one changed, we should this as well
                if (_isURLAnnotation(url)) {
                    if (Array.isArray(annotationURLs)) {
                        annotationURLs.push(url);
                    }

                    // found a url query parameter that is annotation
                    return lookForAnnotation === true;
                } else {
                    if (Array.isArray(imageURLs)) {
                        imageURLs.push(url);
                    }

                    // found a url query parameter that is not annotation
                    return lookForAnnotation != true;
                }
                return false;
            }

            if (typeof urlQParam === "string") {
                return checkURL(urlQParam) === true;
            }

            var finalRes = false;
            if (Array.isArray(urlQParam)){
                for (i = 0; i < urlQParam.length; i++) {
                    res = checkURL(urlQParam[i]);
                    if (res && !finalRes) {
                        // if we want to capture the urls, we shouldn't return the result right away
                        if (Array.isArray(imageURLs) || Array.isArray(annotationURLs)) {
                            finalRes = res;
                        } else {
                            return res;
                        }
                    }
                }
            }

            return finalRes;
        }

        /**
         * TODO
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
        function initializeOSDParams (pageQueryParams, imageURI) {
            var loadImageMetadata = true, imageURIQueryParams = {};
            var  osdViewerParams = {
                mainImage: {zIndex: context.defaultZIndex, info: []},
                zPlaneList: [],
                channels: [],
                annotationSetURLs: [],
                zPlaneTotalCount: 1,
                isProcessed: true
            };

            if (DataUtils.isNoneEmptyString(imageURI)) {
                if (imageURI.indexOf("?") === -1) {
                    imageURI = "?" + imageURI;
                }
                imageURIQueryParams = UriUtils.getQueryParams(imageURI, true);
            }

            // both are empty
            if (!DataUtils.isNonEmptyObject(pageQueryParams) &&  !DataUtils.isNonEmptyObject(pageQueryParams)) {
                return {
                    osdViewerParams: osdViewerParams,
                    loadImageMetadata: true
                };
            }

            var usedQParams = null, imageURLs = [];

            // get all the channel query parameters from the page query paramter
            if (hasURLQueryParam(pageQueryParams, false, imageURLs, osdViewerParams.annotationSetURLs)) {
                usedQParams = pageQueryParams;
            }
            // get all the channel query parameters from image
            else if (hasURLQueryParam(imageURIQueryParams, false, imageURLs, osdViewerParams.annotationSetURLs)) {
                usedQParams = imageURIQueryParams;
            }

            // populate mainImage info and channels if the array is not empty
            imageURLs.forEach(function (url, index) {
                osdViewerParams.mainImage.info.push(url);
                var channel = {};

                // find the defined channelInfo
                osdConstant.CHANNEL_QPARAMS.forEach(function (qp) {
                    channel[qp] = _getQueryParamByIndex(usedQParams[qp], index);
                });

                // if any of the channel properties were defined
                if (DataUtils.isNonEmptyObject(channel)) {
                    osdViewerParams.channels.push(channel);
                }
            });

            // add the rest of query parameters
            osdConstant.OTHER_QPARAMS.forEach(function (qp) {
                if (qp in imageURIQueryParams) {
                    osdViewerParams[qp] = imageURIQueryParams[qp];
                } else if (qp in pageQueryParams) {
                    osdViewerParams[qp] = pageQueryParams[qp];
                }
            });

            return {
                osdViewerParams: osdViewerParams,
                loadImageMetadata: usedQParams == null
            };
        }

        /**
         * Send request to image channel table and returns a promise that is resolved
         * returns {
         *   channelURLs: [{url, channelNumber}], // used for backward compatibility
         *   channelList: [{channelNumber, channelName, isRGB, pseudoColor}]
         * }
         *
         */
        function _readImageChannelTable() {
            console.log("reading channel table");
            var defer = $q.defer(), channelList = [], channelURLs = [];

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


                        var pseudoColor = t.data[channelConstant.PSEUDO_COLOR_COLUMN_NAME],
                            channelName = t.data[channelConstant.CHANNEL_NAME_COLUMN_NAME],
                            channelNumber = t.data[channelConstant.CHANNEL_NUMBER_COLUMN_NAME];

                        // create the channel info
                        var res = {};
                        res[osdConstant.CHANNEL_NUMBER_QPARAM] = channelNumber; // not-null
                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;
                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : null;
                        // null should be treated the same as true
                        res[osdConstant.IS_RGB_QPARAM] = t.data[channelConstant.IS_RGB_COLUMN_NAME] === false ? false : true;
                        channelList.push(res);

                        // if any of the urls are null, then none of the values are valid
                        var channelURL = t.data[channelConstant.IMAGE_URL_COLUMN_NAME];
                        if (DataUtils.isNoneEmptyString(channelURL)) {
                            channelURLs.push({channelNumber: channelNumber, url: channelURL});
                        } else {
                            hasNull = true;
                        }
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(channelConstant.CHANNEL_TABLE_COLUMN_ORDER);

                // send request to server
                return _readPageByPage(ref, channelConstant.PAGE_SIZE, logObj, true, cb);
            }).then(function () {
                // if any of the urls are null, we shouldn't use any of the urls
                if (hasNull) {
                    channelURLs = [];
                }
                defer.resolve({
                    channelURLs: channelURLs, // backward compatibility
                    channelList: channelList
                });
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        /**
         * Send request to processed image table and returns a promise that is resolved
         * returns [{url, channelNumber}]
         */
        function _readProcessedImageTable(pImageReference) {
            console.log("reading processed image table");
            var defer = $q.defer(), mainImageInfo = [];


            // TODO does this make sense?
            var url = pImageReference.location.uri;
            url += "&" + encode(pImageConstant.Z_INDEX_COLUMN_NAME);
            url += "=" + encode(context.defaultZIndex);

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
                        var imageURL = _createImageURL(t.data);

                        // if any of the urls are null, then none of the values are valid
                        if (!DataUtils.isNoneEmptyString(imageURL)) {
                            hasNull = true;
                            return false;
                        }

                        var res = {};
                        res.url = imageURL;
                        res.channelNumber = t.data[pImageConstant.CHANNEL_NUMBER_COLUMN_NAME];
                        mainImageInfo.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(pImageConstant.COLUMN_ORDER);

                // send request to server
                return _readPageByPage(ref, pImageConstant.PAGE_SIZE, logObj, false, cb);
            }).then(function () {
                if (hasNull) {
                    mainImageInfo = [];
                }

                defer.resolve(mainImageInfo);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        function _createImageURL(data) {
            var imageURL = data[pImageConstant.IMAGE_URL_COLUMN_NAME];

            // if any of the urls are null, then none of the values are valid
            if (!DataUtils.isNoneEmptyString(imageURL)) {
                return null;
            }

            // for different methods we might have to format the url
            var displayMethod = data[pImageConstant.DISPLAY_METHOD_COLUMN_NAME];
            if (displayMethod in pImageConstant.IMAGE_URL_PATTERN) {
                imageURL = UriUtils.getAbsoluteURL(imageURL);

                imageURL = ERMrest.renderHandlebarsTemplate(pImageConstant.IMAGE_URL_PATTERN[displayMethod], {"url": imageURL, "iiif_version": pImageConstant.IIIF_VERSION});
            }

            return imageURL;
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
                defer.reject(err);
            });

            return defer.promise;
        }

        function _createProcessedImageReference() {
            var defer = $q.defer();
            var path = encode(pImageConstant.PROCESSED_IMAGE_TABLE_SCHEMA_NAME) + ":";
            path += encode(pImageConstant.PROCESSED_IMAGE_TABLE_NAME) + "/";
            path += encode(pImageConstant.REFERENCE_IMAGE_COLUMN_NAME);
            path += "=" + encode(context.imageID);
            var url = context.serviceURL + "/catalog/" + context.catalogID + "/entity/" + path;

            ERMrest.resolve(url, ConfigUtils.getContextHeaderParams()).then(function (res) {
                if (!res) {
                    return false;
                }
                defer.resolve(res.contextualize.compact);
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        function fetchZPlaneList(pageSize, beforeValue, afterValue) {
            console.log("fetching zplane page");
            var defer = $q.defer(),
                pImageRef = $rootScope.processedImageReference;

            var context = "compact",
                table = pImageRef.table,
                catalog = pImageRef.table.schema.catalog,
                zIndexColName = pImageConstant.Z_INDEX_COLUMN_NAME,
                imagesArrayName = "images";

            // group by Z_Index
            var keyColumns = [
                new ERMrest.AttributeGroupColumn(null, encode(zIndexColName), null, "z_index", "int4", "", true, true)
            ];

            // porject the image data
            var aggregateColumns = [
                new ERMrest.AttributeGroupColumn(imagesArrayName, "array(*)", null, imagesArrayName, "markdown", "", false, false)
            ]

            // get it from the input
            var afterObject = null, beforeObject = null;
            if (beforeValue != null) {
                beforeObject = [beforeValue];
            }
            if (afterValue != null) {
                afterObject = [afterValue];
            }

            // sort by Z_Index
            var sortObj = [{"column": pImageConstant.Z_INDEX_COLUMN_NAME, "descending": false}];
            var loc = new ERMrest.AttributeGroupLocation(
                pImageRef.location.service,
                catalog.id,
                pImageRef.location.ermrestCompactPath,
                null, //search object
                sortObj,
                afterObject,
                beforeObject
            );

            var ref = new ERMrest.AttributeGroupReference(keyColumns, aggregateColumns, loc, catalog, table, context);

            // log object
            var logObj = {};
            ref.read(pageSize, logObj).then(function (page) {
                var res = [];
                for (var i = 0; i < page.tuples.length; i++) {
                    var data = page.tuples[i].data, imgInfo = [];

                    // TODO if any of the data is null, the whole thing should be empty?
                    if (!data) {
                        return defer.resolve([]), defer.promise;
                    }

                    // TODO should we check for z_index not being null?
                    if (data[zIndexColName] == null) {
                        return defer.resolve([]), defer.promise;
                    }

                    // TODO should we make sure the array image data is not empty?
                    if (!Array.isArray(data[imagesArrayName]) || data[imagesArrayName].length === 0) {
                        return defer.resolve([]), defer.promise;
                    }

                    for (var j = 0; j < data[imagesArrayName].length; j++) {
                        var d = data[imagesArrayName][j];

                        var imageURL = _createImageURL(d);
                        if (!DataUtils.isNoneEmptyString(imageURL)) {
                            return defer.resolve([]), defer.promise;
                        }

                        imgInfo.push({
                            channelNumber: d[pImageConstant.CHANNEL_NUMBER_COLUMN_NAME],
                            url: imageURL
                        });
                    }

                    res.push({
                        zIndex: data[zIndexColName],
                        info: imgInfo
                    });
                }

                defer.resolve({
                    images: res,
                    hasPrevious: page.hasPrevious,
                    hasNext: page.hasNext
                });
            }).catch(function (err) {
                defer.reject(err);
            })

            return defer.promise;
        }

        /**
         * 1. read the image_channel info
         */
        function loadImageMetadata() {
            var channelURLs = [];
            var defer = $q.defer(), pImageReference;

            // first read the channel info
            _readImageChannelTable().then(function (res) {
                $rootScope.osdViewerParameters.channels = res.channelList;

                // backward compatibility
                channelURLs = res.channelURLs;

                return _createProcessedImageReference();
            }).then(function (res) {
                // needed this for creating the attributegroup reference
                $rootScope.processedImageReference = res;

                // needed for doing the aggregate
                pImageReference = res;

                // read the main image (processed data)
                return _readProcessedImageTable(pImageReference);
            }).then (function (mainImageInfo) {
                if (mainImageInfo.length == 0) {
                    // TODO backward compatibility
                    if (channelURLs.length > 0) {
                        mainImageInfo = channelURLs;
                    } else {
                        return null;
                    }
                }

                $rootScope.osdViewerParameters.mainImage = {
                    zIndex: context.defaultZIndex,
                    info: mainImageInfo
                };

                // then read the aggregate number of Zs
                var zIndexCol = pImageReference.columns.find(function (col) {
                    return col.name === pImageConstant.Z_INDEX_COLUMN_NAME;
                });

                if (zIndexCol != null) {
                    // TODO log object
                    return pImageReference.getAggregates([zIndexCol.aggregate.countDistinctAgg]);
                }
                return null;
            }).then(function (res) {
                if (res != null && Array.isArray(res) && res.length == 1) {
                    $rootScope.osdViewerParameters.zPlaneTotalCount = res[0];
                }

                defer.resolve();
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise
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
            readAllAnnotations: readAllAnnotations,
            hasURLQueryParam: hasURLQueryParam,
            initializeOSDParams: initializeOSDParams,
            loadImageMetadata: loadImageMetadata,
            fetchZPlaneList: fetchZPlaneList
        };

    }]);

})();
