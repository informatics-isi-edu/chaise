(function() {
    'use strict';

    angular.module('chaise.viewer')

    .constant('viewerConstant', {
        DEFAULT_PAGE_SIZE: 25,
        DEFAULT_IIIF_VERSION: "2",
        osdViewer: {
            IMAGE_URL_QPARAM: "url",
            CHANNEL_NAME_QPARAM: "channelName",
            PSEUDO_COLOR_QPARAM: "pseudoColor",
            PIXEL_PER_METER_QPARAM: "meterScaleInPixels",
            WATERMARK_QPARAM: "waterMark",
            IS_RGB_QPARAM: "isRGB",
            CHANNEL_QPARAMS: [
                "url", "aliasName", "channelName", "pseudoColor", "isRGB"
            ],
            OTHER_QPARAMS: [
                "waterMark", "meterScaleInPixels", "scale", "x", "y", "z",
                "ignoreReferencePoint", "ignoreDimension", "enableSVGStrokeWidth", "zoomLineThickness"
            ]
        },
        annotation: {
            SEARCH_LOG_TIMEOUT: 2000,
            LINE_THICKNESS_LOG_TIMEOUT: 1000
        }
    })

    .constant("defaultViewerConfig", {
        main_image: {},
        processed_image: {},
        image_annotation: {},
        image_channel: {}
    })

    .factory("viewerConfig", ['DataUtils', 'defaultViewerConfig', 'UriUtils', '$window', function (DataUtils, defaultViewerConfig, UriUtils, $window) {
            var all_configs = viewerConfigs, _config = null;

            function _findConfig(configName) {
                if (configName in all_configs) {
                    var cnf = all_configs[configName];
                    if (typeof cnf == "string") {
                        return _findConfig(cnf);
                    }
                    return cnf;
                }
                return null;
            }

            function _getConfigAttr(attr) {
                var cnf = getConfigJSON();
                if (cnf && attr in cnf) {
                    return cnf[attr];
                }
                return {};
            }

            function getConfigJSON() {
                // if already computed, just return it
                if (_config != null) {
                    return _config;
                }

                // find the config that is defined in the viewer-config.js
                var definedConfig = null;
                if (DataUtils.isObjectAndNotNull(all_configs)) {
                    var configName = UriUtils.getQueryParam($window.location.href, 'config');

                    // if the config name is not passed, or wasn't defined in the config, use the default
                    if (!DataUtils.isNoneEmptyString(configName) || !(configName in all_configs)) {
                        configName = "*";
                    }

                    definedConfig = _findConfig(configName);
                }

                if (definedConfig == null) {
                    console.log("couldn't find the appropriate viewer-config");
                    _config = defaultViewerConfig;
                    return _config;
                }

                // TODO validate the config
                // TODO support case insensitive and ignore _ stuff..

                _config = definedConfig;
                return _config;
            }

            function getImageConfig() {
                return _getConfigAttr("main_image");
            }

            function getProcesssedImageConfig() {
                return _getConfigAttr("processed_image");
            }

            function getChannelConfig() {
                return _getConfigAttr("image_channel");
            }

            function getAnnotationConfig() {
                return _getConfigAttr("image_annotation");
            }

            return {
                getConfigJSON: getConfigJSON,
                getImageConfig: getImageConfig,
                getProcesssedImageConfig: getProcesssedImageConfig,
                getChannelConfig: getChannelConfig,
                getAnnotationConfig: getAnnotationConfig
            };
    }])

    .factory('viewerAppUtils', [
        'annotationCreateForm', 'annotationEditForm', 'AnnotationsService', 'ConfigUtils', 'context', 'DataUtils', 'ERMrest', 'logService', 'recordCreate', 'UriUtils', 'viewerConfig', 'viewerConstant',
        '$q', '$rootScope',
        function (annotationCreateForm, annotationEditForm, AnnotationsService, ConfigUtils, context, DataUtils, ERMrest, logService, recordCreate, UriUtils, viewerConfig, viewerConstant,
                  $q, $rootScope) {

        var annotConfig = viewerConfig.getAnnotationConfig(),
            pImageConfig = viewerConfig.getProcesssedImageConfig(),
            channelConfig = viewerConfig.getChannelConfig();

        var osdConstant = viewerConstant.osdViewer,
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
                if (url.indexOf(".svg") != -1 || url.indexOf(annotConfig.overlay_hatrac_path) != -1) {
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
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConfig.schema_name) + ":";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConfig.table_name) + "/";
            imageChannelURL += UriUtils.fixedEncodeURIComponent(channelConfig.reference_image_column_name);
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

                        var channelURL = t.data[channelConfig.image_url_column_name];

                        // if any of the urls are null, then none of the values are valid
                        if (!DataUtils.isNoneEmptyString(channelURL)) {
                            hasNull = true;
                            return false;
                        }
                        var pseudoColor = t.data[channelConfig.pseudo_color_column_name];
                        var channelName = t.data[channelConfig.channel_name_column_name];

                        // create the channel info
                        var res = {};
                        res[URLQParamAttr] = channelURL;
                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;
                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : "null";
                        var isRGB = t.data[channelConfig.is_rgb_column_name];
                        res[osdConstant.IS_RGB_QPARAM] = (typeof isRGB === "boolean") ? isRGB.toString() : "null";
                        channelList.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(channelConfig.column_order);

                // send request to server
                return _readPageByPage(ref, viewerConstant.DEFAULT_PAGE_SIZE, logObj, true, cb);
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
            url += encode(pImageConfig.schema_name) + ":";
            url += encode(pImageConfig.table_name) + "/";
            url += encode(pImageConfig.reference_image_column_name);
            url += "=" + encode(context.imageID);

            if (context.defaultZIndex != null) {
                url += "&" + encode(pImageConfig.z_index_column_name);
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
                        var channelURL = t.data[pImageConfig.image_url_column_name];

                        // if any of the urls are null, then none of the values are valid
                        if (!DataUtils.isNoneEmptyString(channelURL)) {
                            hasNull = true;
                            return false;
                        }

                        // for different methods we might have to format the url
                        var displayMethod = t.data[pImageConfig.display_method_column_name];
                        if (displayMethod in pImageConfig.image_url_pattern) {
                            channelURL = UriUtils.getAbsoluteURL(channelURL);

                            var iiifVersion = viewerConstant.DEFAULT_IIIF_VERSION;
                            if (DataUtils.isNoneEmptyString(pImageConfig.iiif_version)) {
                                iiifVersion = pImageConfig.iiif_version;
                            }

                            channelURL = ERMrest.renderHandlebarsTemplate(pImageConfig.image_url_pattern[displayMethod], {"url": channelURL, "iiif_version": iiifVersion});
                        }

                        // get the channel extra data
                        var channelData = {};
                        var channelVisColName = pImageConfig.channel_visible_column_name;
                        if (t.linkedData && (channelVisColName in t.linkedData) && DataUtils.isObjectAndNotNull(t.linkedData[channelVisColName])) {
                            channelData = t.linkedData[channelVisColName];
                        }

                        var channelName = channelData[channelConfig.channel_name_column_name];
                        var pseudoColor = channelData[channelConfig.pseudo_color_column_name];

                        // create the channel info
                        var res = {};
                        res[URLQParamAttr] = channelURL;
                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;
                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : "null";
                        // null should be treated the same as true
                        res[osdConstant.IS_RGB_QPARAM] = channelData[channelConfig.is_rgb_column_name] === false ? "false" : "true";
                        channelList.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(pImageConfig.column_order);

                // send request to server
                return _readPageByPage(ref, viewerConstant.DEFAULT_PAGE_SIZE, logObj, false, cb);
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
            imageAnnotationURL += encode(annotConfig.schema_name) + ":";
            imageAnnotationURL += encode(annotConfig.table_name) + "/";
            imageAnnotationURL += encode(annotConfig.reference_image_column_name);
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
                    annotConfig.overlay_column_name,
                    annotConfig.reference_image_visible_column_name,
                    annotConfig.z_index_column_name,
                    annotConfig.channels_column_name
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
                        if(tuple.data && tuple.data[annotConfig.overlay_column_name]){
                            $rootScope.annotationURLs.push(tuple.data[annotConfig.overlay_column_name]);

                            $rootScope.hideAnnotationSidebar = false;
                        }
                    });

                    return true;
                }

                // using edit, because the tuples are used in edit context (for populating edit form)
                return _readPageByPage(ref, viewerConstant.DEFAULT_PAGE_SIZE, logObj, false, cb);
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
