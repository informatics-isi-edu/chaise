// Configure deployment-specific data here

var chaiseConfig = {
    name: "Sample",
    layout: 'list',
    allowErrorDismissal: true,
    confirmDelete: true,
    headTitle: 'Chaise',
    customCSS: '/assets/css/chaise.css',
    navbarBrand: '/',
    navbarBrandImage: null,
    logoutURL: '/image-annotation',
    // signUpURL: '', The URL at a which a user can create a new account
    // profileURL: '', Globus deployments can use https://www.globus.org/app/account
    dataBrowser: '',
    maxColumns: 6,
    showUnfilteredResults: false,
    defaultAnnotationColor: 'red',
    feedbackURL: 'http://goo.gl/forms/f30sfheh4H',
    helpURL: '/help/using-the-data-browser/',
    showBadgeCounts: false,
    plotViewEnabled: false,
    recordUiGridEnabled: false,
    recordUiGridExportCSVEnabled: true,
    recordUiGridExportPDFEnabled: true,
    editRecord: true,
    deleteRecord: true,
    maxRecordsetRowHeight: 160,
    tour: {
      pickRandom: false,
      searchInputAttribute: "Data",
      searchChosenAttribute: "Data Type",
      searchInputValue: "micro",
      extraAttribute: "Mouse Anatomic Source",
      chosenAttribute: "Data Type",
      chosenValue: "Expression microarray - gene"
    },
    navbarMenu: {
        newTab: true,
        children: [
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
        ]
    },
    footerMarkdown:"**Please check** [Privacy Policy](/privacy-policy/){target='_blank'}",
    maxRelatedTablesOpen:15
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
