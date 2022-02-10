import { windowRef } from '@chaise/utils/window-ref';

export const appTagMapping = {
  "tag:isrd.isi.edu,2016:chaise:record": "/record",
  "tag:isrd.isi.edu,2016:chaise:detailed": "/detailed",
  "tag:isrd.isi.edu,2016:chaise:viewer": "/viewer",
  "tag:isrd.isi.edu,2016:chaise:search": "/search",
  "tag:isrd.isi.edu,2016:chaise:recordset": "/recordset",
  "tag:isrd.isi.edu,2016:chaise:recordedit": "/recordedit"
};

export const appContextMapping = {
  "detailed": "/record",
  "compact": "/recordset",
  "edit": "/recordedit",
  "entry": "/recordedit",
  "*": "/record"
};

export const chaiseConfigPropertyNames = [
  "ermrestLocation", "showAllAttributes", "headTitle", "customCSS", "navbarBrand", "navbarBrandText",
  "navbarBrandImage", "logoutURL", "maxRecordsetRowHeight", "dataBrowser", "defaultAnnotationColor",
  "confirmDelete", "hideSearchTextFacet", "editRecord", "deleteRecord", "defaultCatalog", "defaultTables",
  "signUpURL", "profileURL", "navbarMenu", "sidebarPosition", "attributesSidebarHeading", "userGroups",
  "allowErrorDismissal", "footerMarkdown", "maxRelatedTablesOpen", "showFaceting", "hideTableOfContents",
  "showExportButton", "resolverImplicitCatalog", "disableDefaultExport", "exportServicePath", "assetDownloadPolicyURL",
  "includeCanonicalTag", "systemColumnsDisplayCompact", "systemColumnsDisplayDetailed", "systemColumnsDisplayEntry",
  "logClientActions", "disableExternalLinkModal", "internalHosts", "hideGoToRID", "showWriterEmptyRelatedOnLoad", "configRules"
];

export const defaultChaiseConfig = {
  "internalHosts": [windowRef.location.host],
  "ermrestLocation": windowRef.location.origin + "/ermrest",
  "headTitle": "Chaise",
  "navbarBrandText": "Chaise",
  "logoutURL": "/",
  "dataBrowser": "/",
  "maxRecordsetRowHeight": 160,
  "confirmDelete": true,
  "deleteRecord": false,
  "signUpURL": "",
  "profileURL": "",
  "allowErrorDismissal": false,
  "showFaceting": false,
  "hideTableOfContents": false,
  "showExportButton": false,
  "navbarMenu": {},
  "navbarBrand": "",
  "disableDefaultExport": false,
  "exportServicePath": "/deriva/export",
  "disableExternalLinkModal": false,
  "logClientActions": true,
  "hideGoToRID": false,
  "showWriterEmptyRelatedOnLoad": null,
  "shareCiteAcls": {
    "show": ["*"],
    "enable": ["*"]
  }
};

export const errorNames = {
  unauthorized: "Unauthorized",
  forbidden: "Forbidden",
  conflict: "Conflict",
  notFound: "Record Not Found",
  multipleRecords: "Multiple Records Found",
  noDataMessage: "No entity exists",
  multipleDataErrorCode: "Multiple Records Found",
  facetFilterMissing: "No filter or facet was defined.",
  multipleDataMessage: "There are more than 1 record found for the filters provided."
};

export const errorMessages = {
  unauthorized: "Unauthorized",
  forbidden: "Forbidden",
  notFound: "No data",
  multipleRecords: "Multiple Records Found",
  noDataMessage: 'The record does not exist or may be hidden. <br> If you continue to face this issue, please contact the system administrator.',
  multipleDataErrorCode: "Multiple Records Found",
  multipleDataMessage: "There are more than 1 record found for the filters provided.",
  facetFilterMissing: "No filtering criteria was specified to identify a specific record.",
  unauthorizedAssetRetrieval: "You must be logged in and authorized to download this asset.",
  forbiddenAssetRetrieval: " is logged in but not authorized to download this asset.",
  differentUserConflict1: "Continuing on this page requires that you be logged in as ",
  differentUserConflict2: ". However, you are currently logged in as ",
  anonUserConflict: "Your session has expired. Continuing on this page requires that you be logged in as ",
  systemAdminMessage: "An unexpected error has occurred. Try clearing your cache. <br> If you continue to face this issue, please contact the system administrator.",
  viewerOSDFailed: "Couldn't process the image. <br> If you continue to face this issue, please contact the system administrator.",
  viewerScreenshotFailed: "Couldn't process the screenshot."
};

// NOTE: this global variable is defined in webpack,
//       but we have to declare it here so typescript doesn't complain about it
declare var CHAISE_BUILD_VARIABLES : {
  BUILD_VERSION: string,
  CHAISE_BASE_PATH: string,
  ERMRESTJS_BASE_PATH: string,
  OSD_VIEWER_BASE_PATH: string
};
export const BUILD_VARIABLES = CHAISE_BUILD_VARIABLES;
