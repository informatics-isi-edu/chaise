import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

export const IS_DEV_MODE = process.env.NODE_ENV === 'development';

export const APP_TAG_MAPPING = {
  'tag:isrd.isi.edu,2016:chaise:record': 'record',
  'tag:isrd.isi.edu,2016:chaise:detailed': 'detailed',
  'tag:isrd.isi.edu,2016:chaise:viewer': 'viewer',
  'tag:isrd.isi.edu,2016:chaise:recordset': 'recordset',
  'tag:isrd.isi.edu,2016:chaise:recordedit': 'recordedit',
};

export const APP_CONTEXT_MAPPING = {
  detailed: 'record',
  compact: 'recordset',
  edit: 'recordedit',
  entry: 'recordedit',
  '*': 'record',
};

export const CHAISE_CONFIG_PROPERTY_NAMES = [
  'ermrestLocation', 'showAllAttributes', 'headTitle', 'customCSS', 'navbarBrand', 'navbarBrandText',
  'navbarBrandImage', 'logoutURL', 'maxRecordsetRowHeight', 'dataBrowser', 'defaultAnnotationColor',
  'confirmDelete', 'hideSearchTextFacet', 'editRecord', 'deleteRecord', 'defaultCatalog', 'defaultTable',
  'signUpURL', 'navbarBanner', 'navbarMenu', 'sidebarPosition', 'attributesSidebarHeading', 'userGroups',
  'allowErrorDismissal', 'footerMarkdown', 'hideTableOfContents',
  'resolverImplicitCatalog', 'disableDefaultExport', 'exportServicePath', 'assetDownloadPolicyURL',
  'includeCanonicalTag', 'systemColumnsDisplayCompact', 'systemColumnsDisplayDetailed', 'systemColumnsDisplayEntry',
  'logClientActions', 'disableExternalLinkModal', 'internalHosts', 'hideGoToRID', 'showWriterEmptyRelatedOnLoad',
  'showSavedQueryUI', 'savedQueryConfig', 'termsAndConditionsConfig', 'loggedInMenu', 'facetPanelDisplay', 'configRules',
  'debug', 'templating', 'hideRecordeditLeaveAlert', 'shareCite', 'exportConfigsSubmenu', 'asciiTextValidation',
];

/**
 * The properties that are only allowed in chaise-config.js file
 */
export const CHAISE_CONFIG_STATIC_PROPERTIES = [
  'ermrestLocation', 'defaultCatalog'
];

export const DEFAULT_CHAISE_CONFIG = {
  internalHosts: [windowRef.location.host],
  ermrestLocation: `${windowRef.location.origin}/ermrest`,
  headTitle: 'Chaise',
  navbarBrandText: 'Chaise',
  logoutURL: '/',
  dataBrowser: '/',
  maxRecordsetRowHeight: 160,
  confirmDelete: true,
  editRecord: true,
  deleteRecord: true,
  signUpURL: '',
  allowErrorDismissal: false,
  hideTableOfContents: false,
  navbarBanner: {},
  navbarMenu: {},
  navbarBrand: '',
  termsAndConditionsConfig: null,
  disableDefaultExport: false,
  exportServicePath: '/deriva/export',
  disableExternalLinkModal: false,
  logClientActions: true,
  hideGoToRID: false,
  showWriterEmptyRelatedOnLoad: null,
  savedQueryConfig: null,
  loggedInMenu: {},
  facetPanelDisplay: {},
  shareCite: {
    acls: {
      show: ['*'],
      enable: ['*'],
    }
  },
  templating: {
    engine: 'mustache'
  },
  hideRecordeditLeaveAlert: false,
  exportConfigsSubmenu: {
    acls: {
      show: [],
      enable: []
    }
  },
  asciiTextValidation: false
};

export const dataFormats = {
  placeholder: {
    date: 'YYYY-MM-DD',
    time: 'HH:MM:SS'
  },
  date: 'YYYY-MM-DD',
  time: ['H:m:s', 'H:m', 'H'],
  time12: 'hh:mm:ss', // used for displaying values in recordedit properly
  time24: 'HH:mm:ss',
  timestamp: 'YYYY-MM-DDTHH:mm:ss',
  datetime: {
    display: 'YYYY-MM-DD HH:mm:ss',
    displayZ: 'YYYY-MM-DD HH:mm:ssZ',
    return: 'YYYY-MM-DDTHH:mm:ssZ', // the format that the database returns when there are no fractional seconds to show
    submission: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  },
  regexp: {
    integer: /^\-?\d+$/,
    float: /^\-?(\d+)?((\.)?\d+)?$/
  }
}

export const defaultDisplayname = {
  null: '<i>No value </i>',
  empty: '<i>Empty</i>',
  notNull: '<i>All records with value </i>'
}

export const errorNames = {
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  conflict: 'Conflict',
  notFound: 'Record Not Found',
  multipleRecords: 'Multiple Records Found',
  noDataMessage: 'No entity exists',
  multipleDataErrorCode: 'Multiple Records Found',
  facetFilterMissing: 'No filter or facet was defined.',
  multipleDataMessage: 'There are more than 1 record found for the filters provided.',
  invalidHelpPage: 'Help Page Not Found',
  limitedBrowserSupport: 'Limited Browser Support'
};

export const errorMessages = {
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  notFound: 'No data',
  multipleRecords: 'Multiple Records Found',
  noDataMessage: 'The record does not exist or may be hidden. <br> If you continue to face this issue, please contact the system administrator.',
  multipleDataErrorCode: 'Multiple Records Found',
  multipleDataMessage: 'There are more than 1 record found for the filters provided.',
  facetFilterMissing: 'No filtering criteria was specified to identify a specific record.',
  unauthorizedAssetRetrieval: 'You must be logged in and authorized to download this asset.',
  forbiddenAssetRetrieval: ' is logged in but not authorized to download this asset.',
  differentUserConflict1: 'Continuing on this page requires that you be logged in as ',
  differentUserConflict2: '. However, you are currently logged in as ',
  anonUserConflict: 'Your session has expired. Continuing on this page requires that you be logged in as ',
  systemAdminMessage: 'An unexpected error has occurred. Try clearing your cache. <br> If you continue to face this issue, please contact the system administrator.',
  viewerOSDFailed: 'Couldn\'t process the image. <br> If you continue to face this issue, please contact the system administrator.',
  viewerScreenshotFailed: 'Couldn\'t process the screenshot.',
  invalidHelpPage: 'The requested help page cannot be found.'
};

export const BODY_CLASS_NAMES = {
  self: 'chaise-body',
  mac: 'chaise-mac',
  firefox: 'chaise-firefox',
  safari: 'chaise-safari',
  iframe: 'chaise-iframe'
};

export const QUERY_PARAMS = {
  PROMPT_LOGIN: 'promptlogin',
  SCROLL_TO: 'scrollTo',
};

// these are the captured as `cid` value in logs
export enum APP_NAMES {
  HELP = 'help',
  LOGIN = 'login',
  NAVBAR = 'navbar',
  RECORD = 'record',
  RECORDEDIT = 'recordedit',
  RECORDSET = 'recordset',
  VIEWER = 'viewer'
}

export const CLASS_NAMES = {
  CONTENT_LOADED: '-chaise-post-load',
  HIDDEN: 'forced-hidden',
  IMAGE_PREVIEW: 'chaise-image-preview',
  IMAGE_PREVIEW_ZOOMED_IN: 'zoomed-in',
  COMMENT: 'chaise-comment',
  COMMENT_IS_HTML: 'chaise-comment-html',
  SCROLLABLE_APP_CONTENT_CONTAINER: 'app-content-container-scrollable',
};

export const ID_NAMES = {
  APP_ROOT: 'chaise-app-root',
  VIEWER_ANNOTATION_FORM: 'viewer-annotation-form'
};

export const DEFAULT_DISPLAYNAME = {
  null: '<i>No value </i>',
  empty: '<i>Empty</i>',
  notNull: '<i>All records with value </i>'
};

export const CUSTOM_EVENTS = {
  ADD_INTEND: 'add-intend',
  FORCE_UPDATE_RECORDSET: 'force-update-recordset-data',
  RELATED_TABLE_PAGING_SUCCESS: 'related-table-paging-success',
  ROW_DELETE_SUCCESS: 'row-delete-success',
  ROW_EDIT_INTEND: 'row-edit-intend',
};

export const HELP_PAGES_FOLDER_LOCATION = 'help-docs';

export const HELP_PAGES : {
  [name: string]: {
    /**
     * the title of page (what users see)
     */
    title: string,
    /**
     * what should be used as the query parameter to find the page.
     */
    location: string,
    /**
     * whether this is a built-in component or a markdown help page.
     */
    isComponent: boolean
  }
} = {
  MARKDOWN_HELP: {
    title: 'Markdown Help',
    location: 'chaise/markdown-help',
    isComponent: true
  },
  SWITCH_USER_ACCOUNTS: {
    title: 'Switch User Accounts',
    location: 'chaise/switch-user-accounts',
    isComponent: true
  },
  VIEWER_ANNOTATION: {
    title: 'Viewer Annotation',
    location: 'chaise/viewer-annotation',
    isComponent: false
  },
  FACET_PANEL: {
    title: 'Filter panel',
    location: 'chaise/facet-panel',
    isComponent: false
  }
};

// NOTE: this should be added to windowRef similar to "isSafari" if this check is needed elsewhere
const isIEOrEdge = /msie\s|trident\/|edge\//i.test(windowRef.navigator.userAgent);
export const URL_PATH_LENGTH_LIMIT = (isIEOrEdge) ? 2000 : 4000;

export const RECORDEDIT_MAX_ROWS = 200;
export const FACET_PANEL_DEFAULT_PAGE_SIZE = 10;
export const RECORDSET_DEFAULT_PAGE_SIZE = 25;
export const RELATED_TABLE_DEFAULT_PAGE_SIZE = 25;

export const VIEWER_CONSTANT = {
  DEFAULT_PAGE_SIZE: 25,
  DEFAULT_IIIF_VERSION: '2',
  OSD_VIEWER: {
    IMAGE_URL_QPARAM: 'url',
    CHANNEL_NUMBER_QPARAM: 'channelNumber',
    CHANNEL_NAME_QPARAM: 'channelName',
    PSEUDO_COLOR_QPARAM: 'pseudoColor',
    PIXEL_PER_METER_QPARAM: 'meterScaleInPixels',
    WATERMARK_QPARAM: 'waterMark',
    IS_RGB_QPARAM: 'isRGB',
    CHANNEL_CONFIG_QPARAM: 'channelConfig',
    CHANNEL_QPARAMS: [
      'aliasName', 'channelName', 'pseudoColor', 'isRGB'
    ],
    OTHER_QPARAMS: [
      'waterMark', 'meterScaleInPixels', 'scale', 'x', 'y', 'z',
      'ignoreReferencePoint', 'ignoreDimension', 'enableSVGStrokeWidth', 'zoomLineThickness',
      'showHistogram'
    ],
    CHANNEL_CONFIG: {
      FORMAT_NAME: 'channel-parameters',
      FORMAT_VERSION: '1.0',
      NAME_ATTR: 'name',
      VERSION_ATTR: 'version',
      CONFIG_ATTR: 'config'
    },
    NEW_ANNOTATION: {
      SVG_ID: 'NEW_SVG',
      GROUP_ID: 'NEW_GROUP'
    }
  },
  ANNOTATIONS: {
    SEARCH_LOG_TIMEOUT: 2000,
    LINE_THICKNESS_LOG_TIMEOUT: 1000
  }
};


// TODO if chaise is not built how we expect, this value will be undefiend.
//      we might be able to enforce this during the npm install command of chaise
// if (typeof CHAISE_BUILD_VARIABLES !== 'object') {
//   CHAISE_BUILD_VARIABLES = {
//     BUILD_VERSION: '', // TODO is this even needed?
//     CHAISE_BASE_PATH: '/chaise/',
//     ERMRESTJS_BASE_PATH: '/ermrestjs/',
//     OSD_VIEWER_BASE_PATH: '/openseadragon-viewer/'
//   };
// }

// NOTE: this global variable is defined in webpack,
//       but we have to declare it here so typescript doesn't complain about it
declare let CHAISE_BUILD_VARIABLES: {
  BUILD_VERSION: string,
  CHAISE_BASE_PATH: string,
  ERMRESTJS_BASE_PATH: string,
  OSD_VIEWER_BASE_PATH?: string
};

export const BUILD_VARIABLES = CHAISE_BUILD_VARIABLES;

// attach build variables to the window object (ermrestjs uses this value)
windowRef.chaiseBuildVariables = CHAISE_BUILD_VARIABLES;
