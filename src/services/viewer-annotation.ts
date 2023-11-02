// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { getOSDViewerIframe } from '@isrd-isi-edu/chaise/src/utils/viewer-utils';



export default class ViewerAnnotationService {
  private static _annotationURLs: string[];
  private static _annotationTuples: any[];

  static initialize(tuples: any[], urls: string[]) {
    ViewerAnnotationService._annotationTuples = tuples;
    ViewerAnnotationService._annotationURLs = urls;
  }

  static get annotationURLs() {
    return ViewerAnnotationService._annotationURLs;
  }

  static get annotationTuples() {
    return ViewerAnnotationService._annotationTuples;
  }

  /**
   * Given the action and item, log the client action
   * if item is not passed, it will create the log based on annotation list
   * @param {String} action - the actions string
   * @param {Object=}
   */
  static logAnnotationClientAction(action: string, item?: any, extraInfo?: any) {
    const commonLogInfo = null;
    // TODO
    // if ($rootScope.annotationEditReference) {
    //   commonLogInfo = $rootScope.annotationEditReference.defaultLogInfo;
    // }
    LogService.logClientAction({
      action: ViewerAnnotationService.getAnnotationLogAction(action, item),
      stack: ViewerAnnotationService.getAnnotationLogStack(item, extraInfo)
    }, commonLogInfo);
  }

  /**
   * Get the log stack path of an annotation (or the whole annotation list)
   * if item is not passed, we will return the log stack path string that can be used for the whole annotation panel
   * @param {string}
   * @param {Object=}
   */
  static getAnnotationLogStackPath(item?: any) {
    if (item) {
      // TODO this doesn't look correct
      return LogService.getStackPath(null, LogStackPaths.ANNOTATION_ENTITY);
    } else {
      return LogService.getStackPath(null, LogStackPaths.ANNOTATION_SET);
    }
  }


  /**
   * Get the log action string of an annotation (or the whole annotation list)
   * if item is not passed, we will return the action string that can be used for the whole annotation panel
   * @param {string}
   * @param {Object=}
   */
  static getAnnotationLogAction(action: string, item?: any) {
    return LogService.getActionString(action, ViewerAnnotationService.getAnnotationLogStackPath(item));
  }

  /**
   * Get the log stack of an annotation (or the whole annotation list)
   * if item is not passed, we will return the stack that can be used for the whole annotation panel
   * @param {Object=} item any of the annotationModels object
   * @param {Object=} extraInfo - if we want to log extra information
   */
  static getAnnotationLogStack(item?: any, extraInfo?: any) {
    let stackNode;
    if (item) {
      stackNode = item.logStackNode;
    } else {
      let table, fileInfo;
      // TODO
      // if ($rootScope.annotationEditReference) {
      //   table = $rootScope.annotationEditReference.table;
      // } else {
      //   fileInfo = { "file": 1 }
      // }
      stackNode = LogService.getStackNode(LogStackTypes.ANNOTATION, table, fileInfo);
    }

    const obj = LogService.getStackObject(stackNode);
    if (extraInfo) {
      return LogService.addExtraInfoToStack(obj, extraInfo);
    }
    return obj;
  }

  static removeEntry(item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!item.tuple || !item.tuple.reference) {
        reject('given item didn\'t have proper tuple');
        return;
      }

      const logObj = {
        action: ViewerAnnotationService.getAnnotationLogAction(LogActions.DELETE, item),
        stack: ViewerAnnotationService.getAnnotationLogStack(item)
      };
      item.tuple.reference.delete(null, logObj).then(() => resolve()).catch((err: any) => reject(err));
    });
  }


  static changeSVGId(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('changeSVGId', data);
  }

  static highlightAnnotation(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('highlightAnnotation', data);
  }

  static changeAnnotationVisibility(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('changeAnnotationVisibility', data);
  }

  static changeAllAnnotationVisibility(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('changeAllAnnotationVisibility', data);
  }

  static changeStrokeScale(scale: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('changeStrokeScale', scale);
  }

  static drawAnnotation(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('drawAnnotationMode', data);
  }

  static changeGroupInfo(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('changeGroupInfo', data);
  }

  static addNewTerm(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('addNewTerm', data);
  }

  static removeSVG(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('removeSVG', data);
  }

  static saveAnnotationRecord(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('saveAnnotationRecord', data);
  }

  static loadAnnotations() {
    ViewerAnnotationService._sendMessageToOSDViewer('loadAnnotations', ViewerAnnotationService._annotationURLs);
  }

  static startAnnotationChange(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('startAnnotationChange', data);
  }

  static discardAnnotationChange(data: any) {
    ViewerAnnotationService._sendMessageToOSDViewer('discardAnnotationChange', data);
  }

  static _sendMessageToOSDViewer(messageType: string, content: any) {
    getOSDViewerIframe().contentWindow!.postMessage({ messageType, content }, origin);
  }



}
