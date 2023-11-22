import React from 'react';

// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import ViewerConfigService from '@isrd-isi-edu/chaise/src/services/viewer-config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import ViewerAnnotationService from '@isrd-isi-edu/chaise/src/services/viewer-annotation';

// utils
import { VIEWER_CONSTANT } from '@isrd-isi-edu/chaise/src/utils/constants';
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { fixedEncodeURIComponent, getAbsoluteURL, getQueryParams } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

// used for log purposes
// initialized by _createProcessedImageReference
let zPlaneLogStack: any, zPlaneSetLogStackPath: string, zPlaneEntityLogStackPath: string;
// initialized by _readImageChannelTable
let channelSetLogStack: any, channelSetLogStackPath: string;

// used for generating the request to the processed image table.
// initialized by _createProcessedImageReference
let processedImageReference: any;

export const getOSDViewerIframe = (): HTMLIFrameElement => {
  return document.querySelector('iframe#osd-viewer-iframe') as HTMLIFrameElement;
}

/**
 * Whether a given queryParams has url.
 * If lookForAnnotation is passed, it will also check for the url value being annotation.
 * @param {Object} queryParams - query params object
 * @param {Boolean=} lookForAnnotation - if true, will also check for annotation
 * @returns {Boolean}
 */
export const hasURLQueryParam = (queryParams: any, lookForAnnotation?: boolean, imageURLs?: string[], annotationURLs?: string[]) => {
  const URLQParamAttr = VIEWER_CONSTANT.OSD_VIEWER.IMAGE_URL_QPARAM;

  if (!(URLQParamAttr in queryParams)) {
    return false;
  }

  const urlQParam = queryParams[URLQParamAttr];
  let res, i;

  const checkURL = (url: string) => {
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
      return lookForAnnotation !== true;
    }
    return false;
  }

  if (typeof urlQParam === 'string') {
    return checkURL(urlQParam) === true;
  }

  let finalRes = false;
  if (Array.isArray(urlQParam)) {
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
export const initializeOSDParams = (pageQueryParams: any, imageURI: string, defaultZIndex?: number) => {
  const osdConstant = VIEWER_CONSTANT.OSD_VIEWER;

  let imageURIQueryParams: any = {};
  const osdViewerParams: any = {
    mainImage: { zIndex: defaultZIndex, info: [] },
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

  if (isStringAndNotEmpty(imageURI)) {
    if (imageURI.indexOf('?') === -1) {
      imageURI = '?' + imageURI;
    }
    imageURIQueryParams = getQueryParams(imageURI, true);
  }

  // both are empty
  if (!isStringAndNotEmpty(pageQueryParams) && !isStringAndNotEmpty(imageURIQueryParams)) {
    return {
      osdViewerParams: osdViewerParams,
      loadImageMetadata: true
    };
  }

  let usedQParams: any = null;
  const imageURLs: string[] = [];

  // get all the channel query parameters from the page query paramter
  if (hasURLQueryParam(pageQueryParams, false, imageURLs, osdViewerParams.annotationSetURLs)) {
    usedQParams = pageQueryParams;
  }
  // get all the channel query parameters from image
  else if (hasURLQueryParam(imageURIQueryParams, false, imageURLs, osdViewerParams.annotationSetURLs)) {
    usedQParams = imageURIQueryParams;
  }

  // populate mainImage info and channels if the array is not empty
  imageURLs.forEach((url, index) => {
    osdViewerParams.mainImage.info.push({ url, channelNumber: index });
    const channel: any = {};

    // find the defined channelInfo
    osdConstant.CHANNEL_QPARAMS.forEach((qp) => {
      channel[qp] = _getQueryParamByIndex(usedQParams[qp], index);
    });

    // if any of the channel properties were defined
    if (isStringAndNotEmpty(channel)) {
      channel.channelNumber = index;
      osdViewerParams.channels.push(channel);
    }
  });

  // add the rest of query parameters
  osdConstant.OTHER_QPARAMS.forEach((qp) => {
    if (qp in imageURIQueryParams) {
      osdViewerParams[qp] = imageURIQueryParams[qp];
    } else if (qp in pageQueryParams) {
      osdViewerParams[qp] = pageQueryParams[qp];
    }
  });

  return {
    osdViewerParams: osdViewerParams,
    loadImageMetadata: !isObjectAndNotNull(usedQParams)
  };
}

/**
 * load the image metadata. The following is the order of events
 * 1. read the image channel table to find the channel information.
 * 2. read the processed images.
 * 3. get the z-index information (min, max, count)
 * @param osdViewerParameters
 * @param imageID
 * @param defaultZIndex
 * @returns
 */
export const loadImageMetadata = (
  osdViewerParameters: React.MutableRefObject<any>,
  viewerLogStack: any,
  viewerLogStackPath: string,
  imageID: string,
  defaultZIndex?: number,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let channelURLs: string[] = [];

    // first read the channel info
    _readImageChannelTable(imageID, viewerLogStack, viewerLogStackPath).then(function (res) {
      osdViewerParameters.current.channels = res.channelList;

      // backward compatibility
      channelURLs = res.channelURLs;

      return _createProcessedImageReference(imageID, viewerLogStack, viewerLogStackPath);
    }).then(function () {

      // read the main image (processed data)
      return _readProcessedImageTable(processedImageReference, defaultZIndex);
    }).then(function (mainImageInfo) {
      if (mainImageInfo.length === 0) {
        // backward compatibility
        if (channelURLs.length > 0) {
          mainImageInfo = channelURLs;
        } else {
          return null;
        }
      }

      osdViewerParameters.current.mainImage = {
        zIndex: defaultZIndex,
        info: mainImageInfo
      };

      // then read the aggregate number of Zs
      const zIndexCol = processedImageReference.columns.find((col: any) => {
        return col.name === ViewerConfigService.processsedImageConfig.z_index_column_name;
      });

      if (zIndexCol !== null) {
        const logObj = {
          action: LogService.getActionString(LogActions.COUNT, zPlaneSetLogStackPath),
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
      // we're asking for three aggregate functions, so we have to make sure we've got all
      if (res !== null && Array.isArray(res) && res.length === 3) {
        osdViewerParameters.current.zPlane.count = res[0];
        osdViewerParameters.current.zPlane.minZIndex = res[1];
        osdViewerParameters.current.zPlane.maxZIndex = res[2];
      }

      resolve();
    }).catch(function (err) {
      // just log the error and resolve with empty array
      $log.error('error while getting channel info: ', err);
      resolve();
    });
  });
}


export type ReadAllAnnotationResultType = {
  annotationTuples: any[],
  annotationURLs: string[],
  canUpdateAnnotation: boolean,
  canCreateAnnotation: boolean,
  annotationEditReference: any,
  annotationCreateReference: any
};

/**
 * Send request to image annotation table and populates the values in the $rootScope
 */
export const readAllAnnotations = (
  isDuringInitialization: boolean,
  imageID: string,
  defaultZIndex?: number
): Promise<ReadAllAnnotationResultType> => {
  const res: ReadAllAnnotationResultType = {
    annotationTuples: [],
    annotationURLs: [],
    canUpdateAnnotation: false,
    canCreateAnnotation: false,
    annotationEditReference: null,
    annotationCreateReference: null
  }

  return new Promise((resolve) => {
    $log.log(`fetching annotations for zIndex=${defaultZIndex}`);

    const annotConfig = ViewerConfigService.annotationConfig;

    // TODO should be done in ermrestjs
    let imageAnnotationURL = [
      `${ConfigService.chaiseConfig.ermrestLocation}/catalog/${ConfigService.catalogID}/entity`,
      `${fixedEncodeURIComponent(annotConfig.schema_name)}:${fixedEncodeURIComponent(annotConfig.table_name)}`,
      `${fixedEncodeURIComponent(annotConfig.reference_image_column_name)}=${fixedEncodeURIComponent(imageID)}`
    ].join('/');

    if (defaultZIndex !== undefined) {
      imageAnnotationURL += `&${fixedEncodeURIComponent(annotConfig.z_index_column_name)}=${fixedEncodeURIComponent(defaultZIndex.toString())}`;
    }

    ConfigService.ERMrest.resolve(imageAnnotationURL, ConfigService.contextHeaderParams).then((ref: any) => {
      if (!ref) {
        return true;
      }

      // since we use this for populating edit form, we want this in edit context
      ref = ref.contextualize.entryEdit;

      res.canCreateAnnotation = ref.canCreate;

      res.annotationEditReference = ref;
      res.annotationCreateReference = ref.contextualize.entryCreate;

      const logObj = {
        action: ViewerAnnotationService.getAnnotationLogAction(LogActions.LOAD),
        stack: ViewerAnnotationService.getAnnotationLogStack(undefined, { 'z_index': defaultZIndex, 'default_z': isDuringInitialization })
      };

      // using edit and attributegroup, because the tuples are used in edit context (for populating edit form)
      // we need dynamic acls for: update/delete of each row, update of columns in edit mode
      // that's why we're asking for tcrs
      return _readPageByPage(
        ref,
        VIEWER_CONSTANT.DEFAULT_PAGE_SIZE,
        logObj,
        false,
        true,
        (page: any) => {
          res.annotationTuples = res.annotationTuples.concat(page.tuples);

          page.tuples.forEach(function (tuple: any) {
            if (tuple.data && tuple.data[annotConfig.overlay_column_name]) {
              res.annotationURLs.push(tuple.data[annotConfig.overlay_column_name]);
            }
          });

          return true;
        }
      )
    }).then(() => {
      resolve(res);
    }).catch((err: any) => {
      // just log the error and resolve with empty array
      console.error('error while getting annotations:');
      console.error(err);
      resolve(res);
    });

  });
}

/**
 * The request used to reload the list based on new page information (for next/previous actions)
 *
 * @param requestID the id that osd-viewer returns to find which request this belongs to
 * @param pageSize the size of the z-plane
 * @param beforeValue if this is for a previous page request, this will encode the first value in the current list
 * @param afterValue if this is for a next page request, this will encode the last value in the current list
 * @param reloadCauses used for log purposes
 * @returns
 */
export const fetchZPlaneList = (requestID: any, pageSize: number, beforeValue: any, afterValue: any, reloadCauses: any) => {
  return new Promise((resolve, reject) => {
    $log.log('fetching zplane page', requestID, pageSize, beforeValue, afterValue);

    const ref = _createProcessedImageAttributeGroupReference(beforeValue, afterValue);

    // we don't have queueing mechanism in osd viewer, so we can just set the time here
    let stack = LogService.addCausesToStack(zPlaneLogStack, reloadCauses, ConfigService.ERMrest.getElapsedTime());

    const extraInfo = {
      'page_size': pageSize,
      // if page-size changes or next page, it will be after
      // otherwise it will be before
      'z_index': (afterValue !== null && afterValue !== undefined) ? afterValue : beforeValue
    };

    stack = LogService.addExtraInfoToStack(stack, extraInfo);
    const logObj = {
      action: LogService.getActionString(LogActions.RELOAD, zPlaneSetLogStackPath),
      stack: stack
    };
    ref.read(pageSize, logObj).then(function (page: any) {
      const res = _processAttributeGroupPage(page);
      if (res === undefined || res === null || res.length === 0) {
        resolve([]);
        return;
      }

      resolve({
        requestID: requestID,
        images: res,
        hasPrevious: page.hasPrevious,
        hasNext: page.hasNext
      });
    }).catch((err: any) => reject(err));
  });
}

/**
 * given a z-index, send two requests to find images before and after the z-index.
 * used by osd-viewer to populate the z-plane.
 *
 * @param requestID the id that osd-viewer returns to find which request this belongs to
 * @param pageSize the size of the z-plane
 * @param zIndex the z-index of interest
 * @param source used for log purposes
 * @returns
 */
export const fetchZPlaneListByZIndex = (requestID: any, pageSize: number, zIndex: any, source: any) => {
  return new Promise((resolve, reject) => {
    zIndex = parseInt(zIndex);

    // before includes the z_index as well: @before(zIndex+1)
    const beforeRef = _createProcessedImageAttributeGroupReference(
      zIndex + 1,
      null
    );

    // after will only include what's after: @after(zIndex)
    const afterRef = _createProcessedImageAttributeGroupReference(
      null,
      zIndex
    );

    let beforeImages: any, afterImages: any, logObj;
    const stack = LogService.addExtraInfoToStack(zPlaneLogStack, {
      'page_size': pageSize,
      'z_index': zIndex
    });

    logObj = {
      action: LogService.getActionString(
        source + LogActions.VIEWER_LOAD_BEFORE,
        zPlaneSetLogStackPath
      ),
      stack: stack
    };

    beforeRef.read(pageSize, logObj, true).then(function (page1: any) {
      beforeImages = _processAttributeGroupPage(page1);

      logObj = {
        action: LogService.getActionString(
          source + LogActions.VIEWER_LOAD_AFTER,
          zPlaneSetLogStackPath
        ),
        stack: stack
      };
      return afterRef.read(pageSize, logObj, true);
    }).then(function (page2: any) {
      afterImages = _processAttributeGroupPage(page2);

      const res = _getCenterList(beforeImages, afterImages, pageSize);

      resolve({
        requestID: requestID,
        images: res.images,
        hasPrevious: res.hasPrevious,
        hasNext: res.hasNext,
        updateMainImage: true,
        inputZIndex: zIndex,
        mainImageIndex: _getActiveZIndex(res.images, zIndex)
      });
    }).catch((err: any) => reject(err));
  });
}


/**
 * Update the value of default_z with the given zIndex
 * TODO changes from angularjs version:
 *  - validateSessionBeforeMutation should be called prior to calling this function.
 *  - for success: addAlert('Default Z index value has been updated.', 'success'); should be called outside of this function.
 *  - for reject: the repainting to unauthorized should be done outside
 * @param zIndex the new value
 */
export const updateDefaultZIndex = (mainImageReference: any, imageID: string, zIndex: number | string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const zIndexColumnName = ViewerConfigService.imageConfig.default_z_index_column_name!;

    const tableName = mainImageReference.table.name,
      schemaName = mainImageReference.table.schema.name;

    const url = [
      `${ConfigService.chaiseConfig.ermrestLocation}/catalog/${ConfigService.catalogID}/attributegroup`,
      `${fixedEncodeURIComponent(schemaName)}:${fixedEncodeURIComponent(tableName)}`,
      `RID;${fixedEncodeURIComponent(zIndexColumnName)}`
    ].join('/');

    const payload: any = { RID: imageID };
    payload[zIndexColumnName] = zIndex;

    const headers: any = {};
    const stack = LogService.addExtraInfoToStack(null, {
      'num_updated': 1,
      'updated_keys': {
        'cols': ['RID'],
        'vals': [[imageID]]
      },
      'updated_vals': {
        'cols': [zIndexColumnName],
        'vals': [[zIndex]]
      }
    });
    headers[ConfigService.ERMrest.contextHeaderName] = {
      catalog: ConfigService.catalogID,
      schema_table: schemaName + ':' + tableName,
      action: LogService.getActionString(LogActions.UPDATE),
      stack: stack
    };

    /**
     * NOTE: The update function only works for visible columns,
     * we cannot assume that default_z is visible, that's why
     * we're sending a direct put request.
     */
    ConfigService.http.put(url, [payload], { headers: headers }).then(() => {
      resolve();
    }).catch((err: any) => reject(err));
  });
}

/**
* The expected input format: [{channelNumber: , channelConfig: , pseudoColor}]]
* NOTE this function is not using ermrestjs and directly sending a request
* to ermrest. This is because we cannot assume the config column is visible,
* while the Reference.update only allows updating of the visible columns.
* we should be able to improve this later.
*
* NOTE the caller should show the success alert and repaint the authn errors
*
*/
export const updateChannelConfig = (data: any, imageID: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const payload: any = [];

    const channelConfig = ViewerConfigService.channelConfig;

    const url = [
      `${ConfigService.chaiseConfig.ermrestLocation}/catalog/${ConfigService.catalogID}/attributegroup/`,
      `${fixedEncodeURIComponent(channelConfig.schema_name)}:${fixedEncodeURIComponent(channelConfig.table_name)}/`,
      `${fixedEncodeURIComponent(channelConfig.reference_image_column_name)},`,
      `${fixedEncodeURIComponent(channelConfig.channel_number_column_name)};`,
      `${fixedEncodeURIComponent(channelConfig.channel_config_column_name)},`,
      `${fixedEncodeURIComponent(channelConfig.pseudo_color_column_name)}`,

    ].join('');

    const ch = VIEWER_CONSTANT.OSD_VIEWER.CHANNEL_CONFIG;
    data.forEach((d: any) => {
      const saved: any = {};
      saved[channelConfig.reference_image_column_name] = imageID;
      saved[channelConfig.channel_number_column_name] = d.channelNumber;
      if (d.pseudoColor) {
        saved[channelConfig.pseudo_color_column_name] = d.pseudoColor;
      }
      const config: any = {};
      config[ch.NAME_ATTR] = ch.FORMAT_NAME;
      config[ch.VERSION_ATTR] = _getChannelConfigFormatVersion();
      config[ch.CONFIG_ATTR] = d.channelConfig;
      saved[channelConfig.channel_config_column_name] = config;
      payload.push(saved);
    });

    const headers: any = {};
    const stack = LogService.addExtraInfoToStack(channelSetLogStack, {
      'num_updated': data.length,
      'updated_keys': {
        'cols': [channelConfig.channel_number_column_name],
        'vals': data.map((d: any) => {
          return [d.channelNumber];
        })
      }
    });
    headers[ConfigService.ERMrest.contextHeaderName] = {
      catalog: ConfigService.catalogID,
      schema_table: channelConfig.schema_name + ':' + channelConfig.table_name,
      action: LogService.getActionString(LogActions.UPDATE, channelSetLogStackPath),
      stack: stack
    };

    ConfigService.http.put(url, payload, { headers: headers }).then(() => {
      resolve();
    }).catch((err: any) => reject(err));
  });
}

// --------------- local helper functions -------------------- //

/**
 * return the image url that should be used
 */
const _createImageURL = (data: { [name: string]: string }) => {
  const pImageConfig = ViewerConfigService.processsedImageConfig;
  let imageURL = data[pImageConfig.image_url_column_name];

  // if any of the urls are null, then none of the values are valid
  if (!isStringAndNotEmpty(imageURL)) {
    return null;
  }

  if (!pImageConfig.display_method_column_name || !pImageConfig.image_url_pattern) {
    return imageURL;
  }

  const displayMethod = data[pImageConfig.display_method_column_name];
  if (displayMethod in pImageConfig.image_url_pattern) {
    const absImageURL = getAbsoluteURL(imageURL);

    let iiifVersion: string | number = VIEWER_CONSTANT.DEFAULT_IIIF_VERSION;
    if (isStringAndNotEmpty(pImageConfig.iiif_version) || typeof pImageConfig.iiif_version === 'number') {
      iiifVersion = pImageConfig.iiif_version!;
    }

    imageURL = ConfigService.ERMrest.renderHandlebarsTemplate(
      pImageConfig.image_url_pattern[displayMethod],
      {
        '_url': imageURL,
        'url': absImageURL,
        '_iiif_version': iiifVersion,
        'iiif_version': iiifVersion
      }
    );
  }

  return imageURL;
}

const _getChannelConfigFormatVersion = () => {
  let res = ViewerConfigService.channelConfig.channel_config_format_version;
  if (!isStringAndNotEmpty(res)) {
    res = VIEWER_CONSTANT.OSD_VIEWER.CHANNEL_CONFIG.FORMAT_VERSION;
  }
  return res;
}

/**
* Send request to image channel table and returns a promise that is resolved
* returns {
*   channelURLs: [{url, channelNumber}], // used for backward compatibility
*   channelList: [{channelNumber, channelName, isRGB, pseudoColor, acls: {canUpdateConfig}}],
* }
*
*/
const _readImageChannelTable = async (imageID: string, viewerLogStack: any, viewerLogStackPath: string): Promise<{
  channelURLs: string[],
  channelList: any[],
}> => {
  return new Promise((resolve, reject) => {
    console.log('reading channel table');
    const channelList: any[] = [], channelURLs: any[] = [];

    const channelConfig = ViewerConfigService.channelConfig;
    const osdConstant = VIEWER_CONSTANT.OSD_VIEWER;

    // TODO should be done in ermrestjs
    const imageChannelURL = [
      `${ConfigService.chaiseConfig.ermrestLocation}/catalog/${ConfigService.catalogID}/entity`,
      `${fixedEncodeURIComponent(channelConfig.schema_name)}:${fixedEncodeURIComponent(channelConfig.table_name)}`,
      `${fixedEncodeURIComponent(channelConfig.reference_image_column_name)}=${fixedEncodeURIComponent(imageID)}`
    ].join('/');

    let hasNull = false;
    ConfigService.ERMrest.resolve(imageChannelURL, ConfigService.contextHeaderParams).then((ref: any) => {
      if (!ref) {
        return false;
      }

      channelSetLogStackPath = LogService.getStackPath(viewerLogStackPath, LogStackPaths.CHANNEL_SET);
      channelSetLogStack = LogService.getStackObject(
        LogService.getStackNode(
          LogStackTypes.CHANNEL,
          ref.table,
          {}
        ),
        viewerLogStack
      );
      const logObj = {
        action: LogService.getActionString(LogActions.LOAD, channelSetLogStackPath),
        stack: channelSetLogStack
      };

      // make sure it's properly sorted
      ref = ref.contextualize.compact.sort(channelConfig.column_order);

      // send request to server
      // since we want to check the ACL for updating the channel config we have to ask for TCRS
      // NOTE we cannot ask for entity since we want the TCRS info
      return _readPageByPage(
        ref,
        VIEWER_CONSTANT.DEFAULT_PAGE_SIZE,
        logObj,
        false,
        true,
        (page: any) => {
          for (let i = 0; i < page.tuples.length; i++) {
            const t = page.tuples[i];

            const pseudoColor = t.data[channelConfig.pseudo_color_column_name],
              channelName = t.data[channelConfig.channel_name_column_name],
              channelNumber = t.data[channelConfig.channel_number_column_name];

            let channelConfigs = t.data[channelConfig.channel_config_column_name],
              hasConfig = false

            // create the channel info
            let res: any = {};

            res.acls = {
              canUpdateConfig: t.canUpdate && t.checkPermissions('column_update', channelConfig.channel_config_column_name)
            };

            res[osdConstant.CHANNEL_NUMBER_QPARAM] = channelNumber; // not-null

            res[osdConstant.CHANNEL_NAME_QPARAM] = isStringAndNotEmpty(channelName) ? channelName : channelList.length;

            res[osdConstant.PSEUDO_COLOR_QPARAM] = isStringAndNotEmpty(pseudoColor) ? pseudoColor : null;

            const isRGB = t.data[channelConfig.is_rgb_column_name];
            res[osdConstant.IS_RGB_QPARAM] = (typeof isRGB === 'boolean') ? isRGB : null;

            // config
            channelConfigs = isObjectAndNotNull(channelConfigs) ? channelConfigs : [];
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
            if (channelConfig.image_url_column_name) {
              const channelURL = t.data[channelConfig.image_url_column_name];
              if (isStringAndNotEmpty(channelURL)) {
                channelURLs.push({ channelNumber: channelNumber, url: channelURL });
              } else {
                hasNull = true;
              }
            }
          }

          return true;
        }
      );
    }).then(() => {
      resolve({
        // backward compatibility
        // if any of the urls are null, we shouldn't use any of the urls
        channelURLs: hasNull ? [] : channelURLs,
        channelList
      });
    }).catch((err: any) => reject(err));
  });
}

/**
         * Send request to processed image table and returns a promise that is resolved
         * used for default z
         * returns [{url, channelNumber}]
         */
function _readProcessedImageTable(pImageReference: any, defaultZIndex?: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    $log.log('reading processed image table');
    const pImageConfig = ViewerConfigService.processsedImageConfig;
    const mainImageInfo: any = [];

    // TODO does this make sense?
    let url = pImageReference.location.uri;
    if (defaultZIndex !== undefined && pImageConfig.z_index_column_name) {
      url += '&' + fixedEncodeURIComponent(pImageConfig.z_index_column_name);
      url += '=' + fixedEncodeURIComponent(defaultZIndex.toString());
    }


    let hasNull = false;
    ConfigService.ERMrest.resolve(url, ConfigService.contextHeaderParams).then((ref: any) => {
      if (!ref) {
        return false;
      }

      const logObj = {
        action: LogService.getActionString(LogActions.LOAD, zPlaneEntityLogStackPath),
        stack: defaultZIndex !== undefined ?
          LogService.addExtraInfoToStack(zPlaneLogStack, { 'z_index': defaultZIndex, 'default_z': true }) : zPlaneLogStack
      };

      // make sure it's properly sorted
      ref = ref.contextualize.compact.sort(pImageConfig.column_order);

      // send request to server
      return _readPageByPage(
        ref,
        VIEWER_CONSTANT.DEFAULT_PAGE_SIZE,
        logObj,
        false,
        false,
        (page: any) => {
          for (let i = 0; i < page.tuples.length && !hasNull; i++) {
            const t = page.tuples[i];
            const imageURL = _createImageURL(t.data);

            // if any of the urls are null, then none of the values are valid
            if (!isStringAndNotEmpty(imageURL)) {
              hasNull = true;
              return false;
            }

            mainImageInfo.push({
              url: imageURL,
              channelNumber: t.data[pImageConfig.channel_number_column_name]
            });
          }
          return true;
        }
      );
    }).then(function () {
      resolve(hasNull ? [] : mainImageInfo);
    }).catch((err: any) => reject(err));
  });
}

/**
 * populate the variables that are used in different places
 */
const _createProcessedImageReference = (imageID: string, viewerLogStack: any, viewerLogStackPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {

    const pImageConfig = ViewerConfigService.processsedImageConfig;

    const url = [
      `${ConfigService.chaiseConfig.ermrestLocation}/catalog/${ConfigService.catalogID}/entity`,
      `${fixedEncodeURIComponent(pImageConfig.schema_name)}:${fixedEncodeURIComponent(pImageConfig.table_name)}`,
      `${fixedEncodeURIComponent(pImageConfig.reference_image_column_name)}=${fixedEncodeURIComponent(imageID)}`
    ].join('/');

    ConfigService.ERMrest.resolve(url, ConfigService.contextHeaderParams).then((res: any) => {
      if (!res) {
        return false;
      }

      processedImageReference = res.contextualize.compact;

      zPlaneSetLogStackPath = LogService.getStackPath(viewerLogStackPath, LogStackPaths.Z_PLANE_SET);
      zPlaneEntityLogStackPath = LogService.getStackPath(viewerLogStackPath, LogStackPaths.Z_PLANE_ENTITY);
      zPlaneLogStack = LogService.getStackObject(
        LogService.getStackNode(
          LogStackTypes.Z_PLANE,
          processedImageReference.table,
          {}
        ),
        viewerLogStack
      );

      resolve();
    }).catch((err: any) => reject(err));

  });
}

const _createProcessedImageAttributeGroupReference = (beforeValue: any, afterValue: any) => {
  const pImageRef = processedImageReference;
  const pImageConfig = ViewerConfigService.processsedImageConfig;

  const context = 'compact',
    table = pImageRef.table,
    catalog = pImageRef.table.schema.catalog,
    zIndexColName = pImageConfig.z_index_column_name!,
    imagesArrayName = 'images';

  // group by Z_Index
  const keyColumns = [
    new ConfigService.ERMrest.AttributeGroupColumn(null, fixedEncodeURIComponent(zIndexColName), null, 'z_index', 'int4', '', true, true)
  ];

  // porject the image data
  const aggregateColumns = [
    new ConfigService.ERMrest.AttributeGroupColumn(imagesArrayName, 'array(*)', null, imagesArrayName, 'markdown', '', false, false)
  ]

  // get it from the input
  let afterObject = null, beforeObject = null;
  if (beforeValue !== null && beforeValue !== undefined) {
    beforeObject = [beforeValue];
  }
  if (afterValue !== null && afterValue !== undefined) {
    afterObject = [afterValue];
  }

  // sort by Z_Index
  const sortObj = [{ 'column': pImageConfig.z_index_column_name, 'descending': false }];


  const loc = new ConfigService.ERMrest.AttributeGroupLocation(
    pImageRef.location.service,
    catalog,
    pImageRef.location.ermrestCompactPath,
    null, //search object
    sortObj,
    afterObject,
    beforeObject
  );

  return new ConfigService.ERMrest.AttributeGroupReference(keyColumns, aggregateColumns, loc, catalog, table, context);
}

const _processAttributeGroupPage = (page: any) => {
  const pImageConfig = ViewerConfigService.processsedImageConfig;

  const res = [],
    zIndexColName = pImageConfig.z_index_column_name!,
    imagesArrayName = 'images';

  for (let i = 0; i < page.tuples.length; i++) {
    const data = page.tuples[i].data, imgInfo = [];

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

    for (let j = 0; j < data[imagesArrayName].length; j++) {
      const d = data[imagesArrayName][j];

      const imageURL = _createImageURL(d);
      if (!isStringAndNotEmpty(imageURL)) {
        return [];
      }

      imgInfo.push({
        channelNumber: d[pImageConfig.channel_number_column_name],
        url: imageURL
      });
    }

    res.push({
      zIndex: data[zIndexColName],
      /**
       * since we're using array(*), the images are not sorted
       * so we have to make sure they are sorted based on channelNumber
       */
      info: imgInfo.sort(function (a, b) {
        return a.channelNumber - b.channelNumber;
      })
    });
  }
  return res;
}

/**
 * since we don't know the size of our requests, this will make sure the
 * requests are done in batches until all the values are processed.
 */
const _readPageByPage = async (ref: any, pageSize: number, logObj: any, useEntity: boolean, getTCRS: boolean, cb: (page: any) => boolean) => {

  return new Promise((resolve, reject) => {
    ref.read(pageSize, logObj, useEntity, true, false, getTCRS).then(function (page: any) {
      if (page && page.length > 0) {
        if (cb(page) === false) {
          return false;
        }
      } else {
        return false;
      }

      if (page.hasNext) {
        return _readPageByPage(page.next, pageSize, logObj, useEntity, getTCRS, cb);
      }
      return true;
    }).then((res: boolean) => resolve(res)).catch((err: any) => reject(err));
  });
}
/**
 * same logic as OSD viewer
 */
const _isURLAnnotation = (url: string) => {
  return url.indexOf('.svg') !== -1 || url.indexOf(ViewerConfigService.annotationConfig.overlay_hatrac_path) !== -1;
}

const _sanitizeQueryParamValue = (v: any) => {
  return v === 'null' ? null : v;
}

const _getQueryParamByIndex = (qParamVal: any, i: number) => {

  if (typeof qParamVal === 'string') {
    return i === 0 ? _sanitizeQueryParamValue(qParamVal) : null;
  }
  if (Array.isArray(qParamVal)) {
    return i < qParamVal.length ? _sanitizeQueryParamValue(qParamVal[i]) : null;
  }
  return null;
}

const _isAppropriateChannelConfig = (obj: any) => {
  const ch = VIEWER_CONSTANT.OSD_VIEWER.CHANNEL_CONFIG;
  return isObjectAndNotNull(obj) && // is a not-null object
    ch.CONFIG_ATTR in obj && // has config attr
    obj[ch.NAME_ATTR] === ch.FORMAT_NAME && // name attr is correct
    obj[ch.VERSION_ATTR] === ViewerConfigService.channelConfig.channel_config_format_version; // version attr is correct
}

/**
 * After fetching the images before and after the inptu z index,
 * this function combines the two array,
 * by taking the second half from the before array and first half from the after array.
 * The size of the array returned is equal to the pagesize
 */
const _getCenterList = (beforeImages: any[], afterImages: any[], pageSize: number): {
  images: any[],
  hasNext: boolean,
  hasPrevious: boolean
} => {
  let images = [];
  const lenBI = beforeImages.length;
  const lenAI = afterImages.length;
  const half = Math.floor(pageSize / 2);
  let hasNext = true;
  let hasPrevious = true;

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

  return { images, hasNext, hasPrevious };
}

/**
 * this function finds the location(position) of the image having the z index closest to the input z index
 */
const _getActiveZIndex = (images: any[], inputZIndex: number) => {
  // TODO find a better negation value
  if (images.length === 0) {
    return -1;
  }
  let res = 0, found = (inputZIndex == images[0].zIndex);
  for (let i = 1; i < images.length; i++) {
    found = found || (inputZIndex == images[i].zIndex);
    res = Math.abs(inputZIndex - images[i].zIndex) < Math.abs(images[res].zIndex - inputZIndex) ? i : res;
  }

  return res;
}
