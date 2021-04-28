(function() {
    'use strict';

    angular.module('chaise.viewer')

    .constant('viewerConstant', {
        DEFAULT_PAGE_SIZE: 25,
        DEFAULT_IIIF_VERSION: "2",
        osdViewer: {
            IMAGE_URL_QPARAM: "url",
            CHANNEL_NUMBER_QPARAM: "channelNumber",
            CHANNEL_NAME_QPARAM: "channelName",
            PSEUDO_COLOR_QPARAM: "pseudoColor",
            PIXEL_PER_METER_QPARAM: "meterScaleInPixels",
            WATERMARK_QPARAM: "waterMark",
            IS_RGB_QPARAM: "isRGB",
            CHANNEL_CONFIG_QPARAM: "channelConfig",
            CHANNEL_QPARAMS: [
                "aliasName", "channelName", "pseudoColor", "isRGB"
            ],
            OTHER_QPARAMS: [
                "waterMark", "meterScaleInPixels", "scale", "x", "y", "z",
                "ignoreReferencePoint", "ignoreDimension", "enableSVGStrokeWidth", "zoomLineThickness",
                "showHistogram"
            ],
            CHANNEL_CONFIG: {
                FORMAT_NAME: "channel-parameters",
                FORMAT_VERSION: "1.0",
                NAME_ATTR: "name",
                VERSION_ATTR: "version",
                CONFIG_ATTR: "config"
            }
        },
        annotation: {
            SEARCH_LOG_TIMEOUT: 2000,
            LINE_THICKNESS_LOG_TIMEOUT: 1000
        }
    })

    .constant("defaultViewerConfig", {
        image: {},
        processed_image: {},
        image_annotation: {},
        image_channel: {}
    })

    .factory("viewerConfig", ['DataUtils', 'defaultViewerConfig', 'UriUtils', '$window', function (DataUtils, defaultViewerConfig, UriUtils, $window) {
            var all_configs = (typeof viewerConfigs == "object") ? viewerConfigs : null,
                _config = null;

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
                return _getConfigAttr("image");
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
        'AlertsService', 'annotationCreateForm', 'annotationEditForm', 'AnnotationsService',
        'ConfigUtils', 'context', 'DataUtils', 'ERMrest',  'Errors', 'ErrorService',
        'logService', 'Session', 'recordCreate', 'UriUtils', 'viewerConfig', 'viewerConstant',
        '$q', '$rootScope',
        function (AlertsService, annotationCreateForm, annotationEditForm, AnnotationsService,
                  ConfigUtils, context, DataUtils, ERMrest, Errors, ErrorService,
                  logService, Session, recordCreate, UriUtils, viewerConfig, viewerConstant,
                  $q, $rootScope) {

        var annotConfig = viewerConfig.getAnnotationConfig(),
            imageConfig = viewerConfig.getImageConfig(),
            pImageConfig = viewerConfig.getProcesssedImageConfig(),
            channelConfig = viewerConfig.getChannelConfig();

        var osdConstant = viewerConstant.osdViewer,
            URLQParamAttr = viewerConstant.osdViewer.IMAGE_URL_QPARAM;

        // used for log purposes
        // initialized by _createProcessedImageReference
        var zPlaneLogStack, zPlaneSetLogStackPath, zPlaneEntityLogStackPath;
        // initialized by _readImageChannelTable
        var channelSetLogStack, channelSetLogStackPath;

        // used for generating the request to the processed image table.
        // initialized by _createProcessedImageReference
        var processedImageReference;

        var channelConfigFormatVersion = channelConfig.channel_config_format_version;
        if (!DataUtils.isNoneEmptyString(channelConfigFormatVersion)) {
            channelConfigFormatVersion = osdConstant.CHANNEL_CONFIG.FORMAT_VERSION;
        }

        var encode = UriUtils.fixedEncodeURIComponent;

        /**
         * same logic as OSD viewer
         */
        function _isURLAnnotation(url) {
            return url.indexOf(".svg") != -1 || url.indexOf(annotConfig.overlay_hatrac_path) != -1;
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

        function _isAppropriateChannelConfig (obj) {
            var ch = osdConstant.CHANNEL_CONFIG;
            return DataUtils.isObjectAndNotNull(obj) && // is a not-null object
                   ch.CONFIG_ATTR in obj && // has config attr
                   obj[ch.NAME_ATTR] === ch.FORMAT_NAME && // name attr is correct
                   obj[ch.VERSION_ATTR] === channelConfigFormatVersion; // version attr is correct
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
                channels: [],
                annotationSetURLs: [],
                zPlane: {
                    count: 1,
                    minZIndex: null,
                    maxZIndex: null
                },
                acls: {
                    mainImage: {
                        canUpdateDefaultZIndex: false
                    }
                },
                isProcessed: true
            };

            if (DataUtils.isNoneEmptyString(imageURI)) {
                if (imageURI.indexOf("?") === -1) {
                    imageURI = "?" + imageURI;
                }
                imageURIQueryParams = UriUtils.getQueryParams(imageURI, true);
            }

            // both are empty
            if (!DataUtils.isNonEmptyObject(pageQueryParams) &&  !DataUtils.isNonEmptyObject(imageURIQueryParams)) {
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
                osdViewerParams.mainImage.info.push({url: url, channelNumber: index});
                var channel = {};

                // find the defined channelInfo
                osdConstant.CHANNEL_QPARAMS.forEach(function (qp) {
                    channel[qp] = _getQueryParamByIndex(usedQParams[qp], index);
                });

                // if any of the channel properties were defined
                if (DataUtils.isNonEmptyObject(channel)) {
                    channel.channelNumber = index;
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
         *   channelList: [{channelNumber, channelName, isRGB, pseudoColor, acls: {canUpdateConfig}}],
         * }
         *
         */
        function _readImageChannelTable() {
            console.log("reading channel table");
            var defer = $q.defer(), channelList = [], channelURLs = [];

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

                channelSetLogStackPath = logService.getStackPath("", logService.logStackPaths.CHANNEL_SET);
                channelSetLogStack = logService.getStackObject(
                    logService.getStackNode(
                        logService.logStackTypes.CHANNEL,
                        ref.table,
                        {}
                    )
                );
                var logObj = {
                    action: logService.getActionString(logService.logActions.LOAD, channelSetLogStackPath),
                    stack: channelSetLogStack
                };

                // the callback that will be used for populating the result values
                var cb = function (page) {
                    for (var i = 0; i < page.tuples.length; i++) {
                        var t = page.tuples[i];


                        var pseudoColor = t.data[channelConfig.pseudo_color_column_name],
                            channelName = t.data[channelConfig.channel_name_column_name],
                            channelNumber = t.data[channelConfig.channel_number_column_name],
                            channelConfigs = t.data[channelConfig.channel_config_column_name],
                            hasConfig = false;

                        // create the channel info
                        var res = {};

                        res.acls = {
                            canUpdateConfig: t.canUpdate && t.checkPermissions("column_update", channelConfig.channel_config_column_name)
                        };

                        res[osdConstant.CHANNEL_NUMBER_QPARAM] = channelNumber; // not-null

                        res[osdConstant.CHANNEL_NAME_QPARAM] = DataUtils.isNoneEmptyString(channelName) ? channelName : channelList.length;

                        res[osdConstant.PSEUDO_COLOR_QPARAM] = DataUtils.isNoneEmptyString(pseudoColor) ? pseudoColor : null;

                        var isRGB = t.data[channelConfig.is_rgb_column_name];
                        res[osdConstant.IS_RGB_QPARAM] = (typeof isRGB === "boolean") ? isRGB : null;

                        // config
                        channelConfigs = DataUtils.isObjectAndNotNull(channelConfigs) ? channelConfigs : [];
                        if (Array.isArray(channelConfigs)) {
                            channelConfigs = channelConfigs.filter(_isAppropriateChannelConfig);
                            if (channelConfigs.length > 0) {
                                channelConfigs = channelConfigs[0];
                                hasConfig = true;
                            }
                        } else if (_isAppropriateChannelConfig(channelConfigs)) {
                            hasConfig = true;
                        }
                        if (hasConfig) {
                            res[osdConstant.CHANNEL_CONFIG_QPARAM] = channelConfigs[osdConstant.CHANNEL_CONFIG.CONFIG_ATTR];
                        }

                        channelList.push(res);

                        // if any of the urls are null, then none of the values are valid
                        var channelURL = t.data[channelConfig.image_url_column_name];
                        if (DataUtils.isNoneEmptyString(channelURL)) {
                            channelURLs.push({channelNumber: channelNumber, url: channelURL});
                        } else {
                            hasNull = true;
                        }
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(channelConfig.column_order);

                // send request to server
                return _readPageByPage(ref, viewerConstant.DEFAULT_PAGE_SIZE, logObj, true, cb);
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
         * used for default z
         * returns [{url, channelNumber}]
         */
        function _readProcessedImageTable(pImageReference) {
            console.log("reading processed image table");
            var defer = $q.defer(), mainImageInfo = [];


            // TODO does this make sense?
            var url = pImageReference.location.uri;
            url += "&" + encode(pImageConfig.z_index_column_name);
            url += "=" + encode(context.defaultZIndex);

            var hasNull = false;
            ERMrest.resolve(url, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                if (!ref) {
                    return false;
                }


                var stack = logService.addExtraInfoToStack(zPlaneLogStack, {"z_index": context.defaultZIndex, "default_z": true});
                var logObj = {
                    action: logService.getActionString(logService.logActions.LOAD, zPlaneEntityLogStackPath),
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
                        res.channelNumber = t.data[pImageConfig.channel_number_column_name];
                        mainImageInfo.push(res);
                    }
                }

                // make sure it's properly sorted
                ref = ref.contextualize.compact.sort(pImageConfig.column_order);

                // send request to server
                return _readPageByPage(ref, viewerConstant.DEFAULT_PAGE_SIZE, logObj, false, cb);
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
            var imageURL = data[pImageConfig.image_url_column_name];

            // if any of the urls are null, then none of the values are valid
            if (!DataUtils.isNoneEmptyString(imageURL)) {
                return null;
            }

            var displayMethod = data[pImageConfig.display_method_column_name];
            if (displayMethod in pImageConfig.image_url_pattern) {
                imageURL = UriUtils.getAbsoluteURL(imageURL);

                var iiifVersion = viewerConstant.DEFAULT_IIIF_VERSION;
                if (DataUtils.isNoneEmptyString(pImageConfig.iiif_version)) {
                    iiifVersion = pImageConfig.iiif_version;
                }

                imageURL = ERMrest.renderHandlebarsTemplate(pImageConfig.image_url_pattern[displayMethod], {"url": imageURL, "iiif_version": iiifVersion});
            }

            return imageURL;
        }

        /**
         * Send request to image annotation table and populates the values in the $rootScope
         */
        function readAllAnnotations (isDuringInitialization) {
            console.log("fetching annotations for zIndex=" + context.defaultZIndex);
            var defer = $q.defer();

            // TODO should be done in ermrestjs
            var imageAnnotationURL = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
            imageAnnotationURL += encode(annotConfig.schema_name) + ":";
            imageAnnotationURL += encode(annotConfig.table_name) + "/";
            imageAnnotationURL += encode(annotConfig.reference_image_column_name);
            imageAnnotationURL += "=" + encode(context.imageID);
            if (context.defaultZIndex != null) {
                imageAnnotationURL += "&" + encode(annotConfig.z_index_column_name);
                imageAnnotationURL += "=" + encode(context.defaultZIndex);
            }

            ERMrest.resolve(imageAnnotationURL, ConfigUtils.getContextHeaderParams()).then(function (ref) {

                if (!ref) {
                    // TODO should be changed to say annotation
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
                    annotationCreateForm.columnModels = [];
                    annotationCreateForm.reference.columns.forEach(function (column) {
                        // remove the invisible (asset, image, z-index, channels) columns
                        if (invisibleColumns.indexOf(column.name) !== -1) return;

                        annotationCreateForm.columnModels.push(recordCreate.columnToColumnModel(column));
                    });
                }

                if ($rootScope.canUpdate) {
                    annotationEditForm.reference = ref;
                    annotationEditForm.columnModels = [];
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
                    stack: AnnotationsService.getAnnotationLogStack(null, {"z_index": context.defaultZIndex, "default_z": isDuringInitialization})
                };

                var cb = function (page) {
                    $rootScope.annotationTuples = $rootScope.annotationTuples.concat(page.tuples);

                    page.tuples.forEach(function (tuple) {
                        if(tuple.data && tuple.data[annotConfig.overlay_column_name]){
                            $rootScope.annotationURLs.push(tuple.data[annotConfig.overlay_column_name]);

                            if (isDuringInitialization) {
                                $rootScope.hideAnnotationSidebar = false;
                            }
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
         * populate the variables that are used in different places
         */
        function _createProcessedImageReference() {
            var defer = $q.defer();
            var path = encode(pImageConfig.schema_name) + ":";
            path += encode(pImageConfig.table_name) + "/";
            path += encode(pImageConfig.reference_image_column_name);
            path += "=" + encode(context.imageID);
            var url = context.serviceURL + "/catalog/" + context.catalogID + "/entity/" + path;

            ERMrest.resolve(url, ConfigUtils.getContextHeaderParams()).then(function (res) {
                if (!res) {
                    return false;
                }

                processedImageReference = res.contextualize.compact;

                zPlaneSetLogStackPath = logService.getStackPath("", logService.logStackPaths.Z_PLANE_SET);
                zPlaneEntityLogStackPath = logService.getStackPath("", logService.logStackPaths.Z_PLANE_ENTITY);
                zPlaneLogStack = logService.getStackObject(
                    logService.getStackNode(
                        logService.logStackTypes.Z_PLANE,
                        processedImageReference.table,
                        {}
                    )
                );

                defer.resolve();
            }).catch(function (err) {
                defer.reject(err);
            });

            return defer.promise;
        }

        function _createProcessedImageAttributeGroupReference(beforeValue, afterValue) {
            var pImageRef = processedImageReference;

            var context = "compact",
                table = pImageRef.table,
                catalog = pImageRef.table.schema.catalog,
                zIndexColName = pImageConfig.z_index_column_name,
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
            var sortObj = [{"column": pImageConfig.z_index_column_name, "descending": false}];

            // attach the path
            var locationPath = pImageRef.location.ermrestCompactPath;

            var loc = new ERMrest.AttributeGroupLocation(
                pImageRef.location.service,
                catalog.id,
                locationPath,
                null, //search object
                sortObj,
                afterObject,
                beforeObject
            );

            return new ERMrest.AttributeGroupReference(keyColumns, aggregateColumns, loc, catalog, table, context);
        }

        function _processAttributeGroupPage(page) {
            var res = [],
                zIndexColName = pImageConfig.z_index_column_name,
                imagesArrayName = "images";

            for (var i = 0; i < page.tuples.length; i++) {
                var data = page.tuples[i].data, imgInfo = [];

                // TODO if any of the data is null, the whole thing should be empty?
                if (!data) {
                    return [];
                }

                // TODO should we check for z_index not being null?
                if (data[zIndexColName] == null) {
                    return [];
                }

                // TODO should we make sure the array image data is not empty?
                if (!Array.isArray(data[imagesArrayName]) || data[imagesArrayName].length === 0) {
                    return [];
                }

                for (var j = 0; j < data[imagesArrayName].length; j++) {
                    var d = data[imagesArrayName][j];

                    var imageURL = _createImageURL(d);
                    if (!DataUtils.isNoneEmptyString(imageURL)) {
                        return [];
                    }

                    imgInfo.push({
                        channelNumber: d[pImageConfig.channel_number_column_name],
                        url: imageURL
                    });
                }

                res.push({
                    zIndex: data[zIndexColName],
                    info: imgInfo
                });
            }
            return res;
        }

        /**
         * The request used to reload the list based on new page information
         */
        function fetchZPlaneList(requestID, pageSize, beforeValue, afterValue, reloadCauses) {
            console.log("fetching zplane page", requestID, pageSize, beforeValue, afterValue);
            var defer = $q.defer();

            var ref = _createProcessedImageAttributeGroupReference(beforeValue, afterValue);

            // TODO we don't have queueing mechanism in osd viewer, so we can just set the time here
            var stack = logService.addCausesToStack(zPlaneLogStack, reloadCauses, ERMrest.getElapsedTime());

            var extraInfo = {
                "page_size": pageSize
            };

            // if page-size changes or next page, it will be after
            // otherwise it will be before
            if (afterValue != null) {
                extraInfo.z_index = afterValue;
            } else {
                extraInfo.z_index = beforeValue;
            }

            stack = logService.addExtraInfoToStack(stack, extraInfo);
            var logObj = {
                action: logService.getActionString(logService.logActions.RELOAD, zPlaneSetLogStackPath),
                stack: stack
            };
            ref.read(pageSize, logObj).then(function (page) {
                var res = _processAttributeGroupPage(page);
                if (res == null || res.length == 0) {
                    return defer.resolve([]), defer.promise;
                }

                defer.resolve({
                    requestID: requestID,
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
         * After fetching the images before and after the inptu z index, this function combines the two array, by taking the second half from the before array and first half from the after array. The size of the array returned is equal to the pagesize
         * @param {object} beforeImages
         * @param {object} afterImages
         * @param {integer} pageSize
         */
        function getCenterList(beforeImages, afterImages, pageSize) {
            var images = [];
            var lenBI = beforeImages.length;
            var lenAI = afterImages.length;
            var half = parseInt(pageSize / 2);
            var hasNext = true;
            var hasPrevious = true;

            if (lenBI + lenAI < pageSize) {
                images = beforeImages.concat(afterImages);
                hasNext = false;
                hasPrevious = false;
            } else if (lenBI <= half) {
                // if the content in before images is less than half the page size, more content would be needed from the after images
                images = beforeImages.concat(afterImages.slice(0, pageSize - lenBI));
                // there are no indexes before the first BI
                hasPrevious = false;
            } else if (lenAI <= half) {
                // if the content in after images is less than half the page size, more content would be needed from the before images
                images = beforeImages.slice(lenBI - (pageSize - lenAI), lenBI);
                images = images.concat(afterImages);
                // there are no indexes after the last AI
                hasNext = false;
            } else {
                images = beforeImages.concat(afterImages.slice(0, half));
                images = images.slice(images.length - pageSize, images.length);
            }

            var res = {
                images: images,
                hasNext: hasNext,
                hasPrevious: hasPrevious
            }
            return res;
        }

        /**
         * this function finds the location(position) of the image having the z index closest to the input z index
         * @param {object} images
         * @param {integer} inputZIndex
         */
        function getActiveZIndex (images, inputZIndex) {
            // TODO find a better negation value
            if (images.length == 0) {
                return -1;
            }

            var res = 0, found = (inputZIndex == images[0].zIndex);

            for (var i = 1; i < images.length; i++) {
                found = found || (inputZIndex == images[i].zIndex);
                res = Math.abs(inputZIndex - images[i].zIndex) < Math.abs(images[res].zIndex - inputZIndex) ? i : res;
            }

            return res;
        }

        function fetchZPlaneListByZIndex(requestID, pageSize, zIndex, source) {
            console.log(requestID, pageSize, zIndex);
            var defer = $q.defer();

            zIndex = parseInt(zIndex);

            // before includes the z_index as well: @before(zIndex+1)
            var beforeRef = _createProcessedImageAttributeGroupReference(
                zIndex + 1,
                null
            );

            // after will only include what's after: @after(zIndex)
            var afterRef = _createProcessedImageAttributeGroupReference(
                null,
                zIndex
            );

            var beforeImages, beforePage, afterImages, afterPage;
            var stack = logService.addExtraInfoToStack(zPlaneLogStack, {
                "page_size": pageSize,
                "z_index": zIndex
            });


            var logObj = {
                action: logService.getActionString(
                    source + logService.logActions.VIEWER_LOAD_BEFORE,
                    zPlaneSetLogStackPath
                ),
                stack: stack
            };

            beforeRef.read(pageSize, logObj, true).then(function (page1) {
                beforePage = page1;
                beforeImages = _processAttributeGroupPage(page1);

                logObj = {
                    action: logService.getActionString(
                        source + logService.logActions.VIEWER_LOAD_AFTER,
                        zPlaneSetLogStackPath
                    ),
                    stack: stack
                };
                return afterRef.read(pageSize, logObj, true);
            }).then(function (page2) {
                var res = []; // what will be sent to osd viewer

                afterPage = page2;
                afterImages = _processAttributeGroupPage(page2);

                res = getCenterList(beforeImages, afterImages, pageSize);

                defer.resolve({
                    requestID: requestID,
                    images: res.images,
                    hasPrevious: res.hasPrevious,
                    hasNext: res.hasNext,
                    updateMainImage: true,
                    inputZIndex: zIndex,
                    mainImageIndex: getActiveZIndex(res.images, zIndex)
                });
            }).catch(function (err) {
                defer.reject(err)
            });

            return defer.promise;
        }

        /**
         * 1. read the image_channel info
         */
        function loadImageMetadata() {
            var channelURLs = [];
            var defer = $q.defer();

            // first read the channel info
            _readImageChannelTable().then(function (res) {
                $rootScope.osdViewerParameters.channels = res.channelList;

                // backward compatibility
                channelURLs = res.channelURLs;

                return _createProcessedImageReference();
            }).then(function () {

                // read the main image (processed data)
                return _readProcessedImageTable(processedImageReference);
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
                var zIndexCol = processedImageReference.columns.find(function (col) {
                    return col.name === pImageConfig.z_index_column_name;
                });

                if (zIndexCol != null) {
                    var logObj = {
                        action: logService.getActionString(logService.logActions.COUNT, zPlaneSetLogStackPath),
                        stack: zPlaneLogStack
                    };
                    return processedImageReference.getAggregates([
                        zIndexCol.aggregate.countDistinctAgg,
                        zIndexCol.aggregate.minAgg,
                        zIndexCol.aggregate.maxAgg
                    ], logObj);
                }
                return null;
            }).then(function (res) {
                if (res != null && Array.isArray(res) && res.length == 3) {
                    $rootScope.osdViewerParameters.zPlane.count = res[0];
                    $rootScope.osdViewerParameters.zPlane.minZIndex = res[1];
                    $rootScope.osdViewerParameters.zPlane.maxZIndex = res[2];
                }

                defer.resolve();
            }).catch(function (err) {
                // just log the error and resolve with empty array
                console.error("error while getting channel info: ", err);
                defer.resolve();
            });

            return defer.promise
        }

        /**
         * Update the value of default_z with the given zIndex
         * @param {Integer} zIndex -  the new default_z value
         */
        function updateDefaultZIndex(zIndex) {
            var defer = $q.defer();

            Session.validateSessionBeforeMutation(function () {

                var ref = $rootScope.reference.contextualize.entryEdit;

                // NOTE using a private API
                var page = ERMrest._createPage(ref, null, [$rootScope.tuple.data],false, false);
                page.tuples[0].data[imageConfig.default_z_index_column_name] = zIndex;

                var stack = logService.addExtraInfoToStack(null, {
                    "updated_vals": {
                        "cols": [imageConfig.default_z_index_column_name],
                        "vals": [[zIndex]]
                    }
                });
                var logObj = {
                    action: logService.getActionString(logService.logActions.UPDATE),
                    stack: stack
                };
                ref.update(page.tuples, logObj).then(function () {
                    AlertsService.addAlert("Default Z index value has been updated.", "success");
                    defer.resolve();
                }).catch(function (exception) {
                    Session.validateSession().then(function (session) {
                        if (!session && exception instanceof ERMrest.ConflictError) {
                            // login in a modal should show (Session timed out)
                            throw new ERMrest.UnauthorizedError();
                        }

                        if (exception instanceof ERMrest.NoDataChangedError) {
                            // TODO should we show a warning or something?
                            // do nothing
                        } else if (exception instanceof Errors.DifferentUserConflictError) {
                            ErrorService.handleException(exception, true);
                        } else {
                            AlertsService.addAlert(exception.message, 'error' );
                        }

                        defer.resolve();
                    });
                })
            });

            return defer.promise;
        }

        /**
         * The expected input format: [{channelNumber: , settings: }]]
         * TODO this function is not using ermrestjs and directly sending a request
         * to ermrest. we should be able to improve this later.
         *
         */
        function updateChannelConfig(data) {
            var url, payload = [], defer = $q.defer();

            url = context.serviceURL + "/catalog/" + context.catalogID + "/attributegroup/";
            url += UriUtils.fixedEncodeURIComponent(channelConfig.schema_name) + ":";
            url += UriUtils.fixedEncodeURIComponent(channelConfig.table_name) + "/";
            url += UriUtils.fixedEncodeURIComponent(channelConfig.reference_image_column_name) + ",";
            url += UriUtils.fixedEncodeURIComponent(channelConfig.channel_number_column_name) + ";";
            url += UriUtils.fixedEncodeURIComponent(channelConfig.channel_config_column_name);

            var ch = osdConstant.CHANNEL_CONFIG;
            data.forEach(function (d) {
                var saved = {};
                saved[channelConfig.reference_image_column_name] = context.imageID;
                saved[channelConfig.channel_number_column_name] = d.channelNumber;
                var config = {};
                config[ch.NAME_ATTR] = ch.FORMAT_NAME;
                config[ch.VERSION_ATTR] = channelConfigFormatVersion;
                config[ch.CONFIG_ATTR] = d.channelConfig;
                saved[channelConfig.channel_config_column_name] = config;
                payload.push(saved);
            });

            var headers = {};
            var stack = logService.addExtraInfoToStack(channelSetLogStack, {
                "num_updated": data.length,
                "updated_keys": {
                    "cols": [channelConfig.channel_number_column_name],
                    "vals": data.map(function (d) {
                        return [d.channelNumber];
                    })
                }
            });
            headers[ERMrest.contextHeaderName] = {
                catalog: context.catalogID,
                schema_table: channelConfig.schema_name + ":" + channelConfig.table_name,
                action: logService.getActionString(logService.logActions.UPDATE, channelSetLogStackPath),
                stack: stack
            };

            ConfigUtils.getHTTPService().put(url, payload, {headers: headers}).then(function (response) {
                AlertsService.addAlert("Channel settings have been updated.", "success");
                defer.resolve(true);
            }).catch(function (error) {
                Session.validateSession().then(function (session) {
                    var exception = ERMrest.responseToError(error);
                    if (!session && exception instanceof ERMrest.ConflictError) {
                        // login in a modal should show (Session timed out)
                        throw new ERMrest.UnauthorizedError();
                    }

                    if (exception instanceof Errors.DifferentUserConflictError) {
                        ErrorService.handleException(exception, true);
                    } else {
                        AlertsService.addAlert(exception.message, 'error' );
                    }

                    defer.resolve(false);
                });
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
            readAllAnnotations: readAllAnnotations,
            hasURLQueryParam: hasURLQueryParam,
            initializeOSDParams: initializeOSDParams,
            loadImageMetadata: loadImageMetadata,
            fetchZPlaneList: fetchZPlaneList,
            fetchZPlaneListByZIndex: fetchZPlaneListByZIndex,
            updateDefaultZIndex: updateDefaultZIndex,
            updateChannelConfig: updateChannelConfig
        };

    }]);

})();
