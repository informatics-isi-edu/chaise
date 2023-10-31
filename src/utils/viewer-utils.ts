import React from 'react';

// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ViewerConfigService } from '@isrd-isi-edu/chaise/src/services/viewer-config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { VIEWER_CONSTANT } from '@isrd-isi-edu/chaise/src/utils/constants';
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { fixedEncodeURIComponent, getQueryParams } from '@isrd-isi-edu/chaise/src/utils/uri-utils';



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
export const initializeOSDParams = (pageQueryParams: any, imageURI: string, defaultZIndex?: string) => {
  const osdConstant = VIEWER_CONSTANT.OSD_VIEWER;

  let imageURIQueryParams: any = {};
  let osdViewerParams: any = {
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
    let channel: any = {};

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
    loadImageMetadata: usedQParams == null
  };
}

export const loadImageMetadata = (osdViewerParameters: React.MutableRefObject<any>) => {
  // TODO
}

/**
 * Send request to image annotation table and populates the values in the $rootScope
 */
export const readAllAnnotations = (isDuringInitialization: boolean) => {
  // TODO
}

/**
* Send request to image channel table and returns a promise that is resolved
* returns {
*   channelURLs: [{url, channelNumber}], // used for backward compatibility
*   channelList: [{channelNumber, channelName, isRGB, pseudoColor, acls: {canUpdateConfig}}],
* }
*
*/
const _readImageChannelTable = async (imageID: string): Promise<{
  channelURLs: string[],
  channelList: any[],
  channelSetLogStackPath: string,
  channelSetLogStack: any,
}> => {
  return new Promise((resolve, reject) => {
    console.log('reading channel table');
    const channelList: any[] = [], channelURLs: any[] = [];
    let channelSetLogStackPath: string, channelSetLogStack: any;

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

      channelSetLogStackPath = LogService.getStackPath('', LogStackPaths.CHANNEL_SET);
      channelSetLogStack = LogService.getStackObject(
        LogService.getStackNode(
          LogStackTypes.CHANNEL,
          ref.table,
          {}
        )
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
        channelList,
        channelSetLogStackPath,
        channelSetLogStack
      });
    }).catch((err: any) => reject(err));
  });
}

/**
 * since we don't know the size of our requests, this will make sure the
 * requests are done in batches until all the values are processed.
 */
const _readPageByPage = async (ref: any, pageSize: number, logObj: any, useEntity: boolean, getTCRS: boolean, cb: (page: any) => boolean) => {

  return new Promise((resolve, reject) => {
    ref.read(pageSize, logObj, useEntity, true, false, getTCRS).then(function (page) {
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
