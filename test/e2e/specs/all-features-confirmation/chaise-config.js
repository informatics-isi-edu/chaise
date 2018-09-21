// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features with Delete Confirmation Dialog",
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true,
    defaultCatalog: 1,
    maxRelatedTablesOpen: 6,
    allowErrorDismissal : true,
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
                       url: "/chaise/recordset/#1/isa:dataset"
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
                       url: "/chaise/recordedit/#1/isa:dataset",
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
