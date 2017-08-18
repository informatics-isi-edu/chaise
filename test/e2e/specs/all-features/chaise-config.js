// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features",
    editRecord: true,
    deleteRecord: true,
    // configuration for navbar spec with base condig
    navbarBrand: 'test123',
    navbarBrandImage: '../images/genetic-data.png',
    navbarBrandText: 'test123',
    headTitle: 'this one should be ignored in favor of navbarBrandText',
    // config for biewer spec
    customCSS: '/path/to/custom/css',
    maxRelatedTablesOpen: 5,
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
