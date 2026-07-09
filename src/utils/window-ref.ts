import { ViewerConfig } from '@isrd-isi-edu/chaise/src/models/viewer';

/**
 * load-error info recorded on window.__chaisePerf
 */
export interface ChaisePerfError {
  milestone: 'navbar' | 'main' | 'full' | 'submit';
  status?: string;
  code?: number;
  message?: string;
}

/**
 * recordset-only detail marks that back the canonical milestones
 * (recordset fullPageLoad = max of the two below).
 */
export interface ChaisePerfRecordsetDetail {
  allFacetsLoaded?: number;
  allAggregatesLoaded?: number;
}

/**
 * page-load milestones in ms, recorded only when chaiseConfig.performanceLogging is on.
 * navbarLoad, mainDataLoad, and fullPageLoad are the canonical milestones every measured app
 * records (with app-specific meaning); detail holds app-specific extras.
 */
export interface ChaisePerfMarks {
  navbarLoad?: number;
  mainDataLoad?: number;
  fullPageLoad?: number;
  error?: ChaisePerfError;
  detail?: {
    recordset?: ChaisePerfRecordsetDetail;
  };
}

// exporting so third-party apps can customize this
export interface ICustomWindow extends Window {
  // WID
  name: string;
  // ERMrset object that is attached to window in ermrestjs:
  ERMrest: any;
  // momentJS library object attached for easy access
  moment: any;
  // the build variables (ermrestjs expects this property)
  chaiseBuildVariables: any;
  // chaiseConfig is attached to the window with the chaise-config.js file
  chaiseConfig: any;
  // googleDatasetConfig is attached to the window with the google-dataset-config.js file
  googleDatasetConfig: any;
  dcctx: {
    // the object that will be logged with every request:
    contextHeaderParams: {
      cid: string;
      pid: string;
      wid: string;
    };
    // TODO are these needed at all (we're not attaching them):
    // the settings that all chaise apps (including deriva webapps) honor
    settings?: {
      hideNavbar: boolean;
      appTitle: string;
      overrideHeadTitle: boolean;
      overrideImagePreviewBehavior: boolean;
      overrideDownloadClickBehavior: boolean;
      overrideExternalLinkBehavior: boolean;
      openLinksInTab: boolean;
    };
  };
  // this is the callback that is used in recordedit to communicate with
  // the parent that the update request is done and therefore the caller
  // needs to be updated/refreshed
  updated: any;
  /**
   * used in record page to help data-modelers with writing the annotation
   */
  defaultExportTemplate: any;
  /**
   * the config file of viewer app
   */
  viewerConfigs: ViewerConfig;
  /**
   * timing marks read by the deriva-load-testing tool
   */
  __chaisePerf?: ChaisePerfMarks;
}

declare let window: ICustomWindow;

export const windowRef = window;

export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
}
