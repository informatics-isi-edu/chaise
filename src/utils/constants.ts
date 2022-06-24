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
  'confirmDelete', 'hideSearchTextFacet', 'editRecord', 'deleteRecord', 'defaultCatalog', 'defaultTables',
  'signUpURL', 'navbarBanner', 'navbarMenu', 'sidebarPosition', 'attributesSidebarHeading', 'userGroups',
  'allowErrorDismissal', 'footerMarkdown', 'maxRelatedTablesOpen', 'showFaceting', 'hideTableOfContents',
  'resolverImplicitCatalog', 'disableDefaultExport', 'exportServicePath', 'assetDownloadPolicyURL',
  'includeCanonicalTag', 'systemColumnsDisplayCompact', 'systemColumnsDisplayDetailed', 'systemColumnsDisplayEntry',
  'logClientActions', 'disableExternalLinkModal', 'internalHosts', 'hideGoToRID', 'showWriterEmptyRelatedOnLoad',
  'showSavedQueryUI', 'savedQueryConfig', 'termsAndConditionsConfig', 'loggedInMenu', 'facetPanelDisplay', 'configRules',
];

export const DEFAULT_CHAISE_CONFIG = {
  internalHosts: [window.location.host],
  ermrestLocation: `${window.location.origin}/ermrest`,
  headTitle: 'Chaise',
  navbarBrandText: 'Chaise',
  logoutURL: '/',
  dataBrowser: '/',
  maxRecordsetRowHeight: 160,
  confirmDelete: true,
  deleteRecord: false,
  signUpURL: '',
  allowErrorDismissal: false,
  showFaceting: false,
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
  shareCiteAcls: {
    show: ['*'],
    enable: ['*'],
  },
};

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
};

export const BODY_CLASS_NAMES = {
  self: 'chaise-body',
  mac: 'chaise-mac',
  firefox: 'chaise-firefox',
  iframe: 'chaise-iframe',
};

export const DEFAULT_DISPLAYNAME = {
  null: '<i>No value </i>',
  empty: '<i>Empty</i>',
  notNull: '<i>All records with value </i>'
};

const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
export const URL_PATH_LENGTH_LIMIT = (isIEOrEdge) ? 2000 : 4000;

export const RECORDEDIT_MAX_ROWS = 200;

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
