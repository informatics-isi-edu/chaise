import { windowRef } from 'Utils/window-ref';

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
