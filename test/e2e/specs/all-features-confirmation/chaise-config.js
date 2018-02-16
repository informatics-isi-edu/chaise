// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features with Delete Confirmation Dialog",
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true,
    defaultCatalog: 1,
    maxRelatedTablesOpen: 6,
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
       newTab: true,
       children: [
           {
               name: "Search",
               url: "/chaise/search/#1/legacy:dataset",
               newTab: false
           },
           {
               name: "RecordEdit",
               children: [
                   {
                       name: "Add Records",
                       children: [
                           {
                               name: "Edit Existing Record",
                               url: "/chaise/recordedit/#1/legacy:dataset/id=5776",
                               newTab: true
                           }
                       ]
                   }
               ],
               newTab: true
           }
       ]
   }
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
