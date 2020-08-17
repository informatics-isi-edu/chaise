// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features with Delete Confirmation Dialog",
    editRecord: true,
    deleteRecord: true,
    CONFIRMDELETE: true, //testing case-insensitive properties as well
    deFAuLtCaTAlog: 1, //testing case-insensitive properties as well
    maxRelatedTablesOpen: 6,
    maxRecordsetRowHeight: false, // triggers (ignores) some logic in ellipsis.js. Tests view buttons having proper links
    allowErrorDismissal : true,
    resolverImplicitCatalog: 2, // in parallel config mode, this config is used first with catalog Id
    systemcolumnsdisplaycompact: ['RCB', 'RMT'], //testing case-insensitive properties as well
    SystemColumnsDisplayDetailed: true, //testing case-insensitive properties as well
    systemColumnsDisplayENTRY: ['RCB', 'RMB', 'RMT'], //testing case-insensitive properties as well
    disableExternalLinkModal: true,
    logClientActions: false,
    footerMarkdown:"**Please check** [Privacy Policy](/privacy-policy/){target='_blank'}",
    defaultTables: {
        "1": {
            "schema": "isa",
            "table": "dataset"
        }
    },
    // configuration for navbar spec with no logo or brand text
    headTitle: 'show me on the navbar!',
    navbarMenu: {
       children: [
           {
               name: "Search",
               url: "/chaise/search/#1/isa:dataset"
           },
           {
               name: "RecordSets",
               children: [
                   {
                       name: "Dataset",
                       url: "/chaise/recordset/#{{$catalog.id}}/isa:dataset"
                   },
                   {
                       name: "File",
                       url: "/chaise/recordset/#1/isa:file"
                   }
               ]
           },
           {
               name: "RecordEdit",
               children: [
                   {
                       name: "Add Records",
                       newTab: false,
                       children: [
                           {
                               name: "Edit Existing Record",
                               url: "/chaise/recordedit/#1/isa:dataset/id=5776",
                           }
                       ]
                   }
               ]
           }
       ]
   }
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
