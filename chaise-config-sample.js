// Configure deployment-specific data here

var chaiseConfig = {
    layout: 'list',
    confirmDelete: true,
    headTitle: 'Chaise',
    customCSS: '/assets/css/chaise.css',
    navbarBrand: '/',
    navbarBrandImage: null,
    logoutURL: '/image-annotation',
    dataBrowser: '/',
    maxColumns: 6,
    showUnfilteredResults: false,
    defaultAnnotationColor: 'red',
    feedbackURL: 'http://goo.gl/forms/f30sfheh4H',
    helpURL: '/help/using-the-data-browser/',
    showBadgeCounts: false,
    recordUiGridEnabled: false,
    recordUiGridExportCSVEnabled: true,
    recordUiGridExportPDFEnabled: true,
    editRecord: true,
    tour: {
      pickRandom: false,
      searchInputAttribute: "Data",
      searchChosenAttribute: "Data Type",
      searchInputValue: "micro",
      extraAttribute: "Mouse Anatomic Source",
      chosenAttribute: "Data Type",
      chosenValue: "Expression microarray - gene"
    }
};

// Specify the layout of the navigation menu at the top of all Chaise apps
var navbar_menu = [
    // {
    //     // This "Search" menu item has 2 nested dropdowns.
    //     // Use the "name" key to label a menu item.
    //     // Use the "children" key to specify dropdowns; you can nest as many dropdowns as you need.
    //     name: "Search",
    //     children: [
    //         {
    //             name: "Search 1",
    //             children: [
    //                 {
    //                     name: "Search 1.1",
    //                     url: "/chaise/search/#1/YOUR_CATALOG:YOUR_SCHEMA"
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     // This "Create" menu item doesn't have any dropdowns.
    //     // Use the "url" key to specify this menu item's url and to signal that it doesn't have any children.
    //     // URLs can be absolute or relative to the document root.
    //     name: "Create",
    //     url: "/chaise/recordedit/#1/YOUR_CATALOG:YOUR_SCHEMA"
    // }
];

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
