// models
import { LogActions, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { ViewerAnnotationModal } from '@isrd-isi-edu/chaise/src/models/viewer';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { getOSDViewerIframe } from '@isrd-isi-edu/chaise/src/utils/viewer-utils';



export default class ViewerAnnotationService {
  private static _annotationURLs: string[];
  private static _annotationTuples: any[];
  private static _annotationsRecieved: boolean;
  private static _annotationEditReference: any;
  private static _annotationCreateReference: any;

  static setAnnotations(tuples: any[], urls: string[], annotationEditReference: any, annotationCreateReference: any) {
    ViewerAnnotationService._annotationTuples = tuples;
    ViewerAnnotationService._annotationURLs = urls;
    ViewerAnnotationService._annotationEditReference = annotationEditReference;
    ViewerAnnotationService._annotationCreateReference = annotationCreateReference;
    ViewerAnnotationService._annotationsRecieved = true;
  }

  static clearPreviousAnnotations() {
    ViewerAnnotationService._annotationTuples = [];
    ViewerAnnotationService._annotationURLs = [];
    ViewerAnnotationService._annotationsRecieved = false;
  }

  static get annotationURLs() {
    return ViewerAnnotationService._annotationURLs;
  }

  static get annotationTuples() {
    return ViewerAnnotationService._annotationTuples;
  }

  static get annotationEditReference() {
    return ViewerAnnotationService._annotationEditReference;
  }

  static get annotationCreateReference() {
    return ViewerAnnotationService._annotationCreateReference;
  }

  /**
   * whether we have the annotation information or not
   */
  static get annotationsRecieved() {
    return ViewerAnnotationService._annotationsRecieved;
  }

  /**
   * Given the action and item, log the client action
   * if item is not passed, it will create the log based on annotation list
   */
  static logAnnotationClientAction(action: string, item?: ViewerAnnotationModal, extraInfo?: any) {
    let commonLogInfo = null;
    if (ViewerAnnotationService.annotationEditReference) {
      commonLogInfo = ViewerAnnotationService.annotationEditReference.defaultLogInfo;
    }
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
  static getAnnotationLogStackPath(item?: ViewerAnnotationModal) {
    if (item) {
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
  static getAnnotationLogAction(action: string, item?: ViewerAnnotationModal) {
    return LogService.getActionString(action, ViewerAnnotationService.getAnnotationLogStackPath(item));
  }

  /**
   * Get the log stack of an annotation (or the whole annotation list)
   * if item is not passed, we will return the stack that can be used for the whole annotation panel
   * @param {Object=} item any of the annotationModels object
   * @param {Object=} extraInfo - if we want to log extra information
   */
  static getAnnotationLogStack(item?: ViewerAnnotationModal, extraInfo?: any) {
    let stackNode;
    if (item) {
      stackNode = item.logStackNode;
    } else {
      let table, fileInfo;
      if (ViewerAnnotationService.annotationEditReference) {
        table = ViewerAnnotationService.annotationEditReference.table;
      } else {
        fileInfo = { 'file': 1 };
      }
      stackNode = LogService.getStackNode(LogStackTypes.ANNOTATION, table, fileInfo);
    }

    const obj = LogService.getStackObject(stackNode);
    if (extraInfo) {
      return LogService.addExtraInfoToStack(obj, extraInfo);
    }
    return obj;
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

  static startAnnotationCreate(data: any) {
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
