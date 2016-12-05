/* This config tests navbar functionalities with:
 - No headTitle
 - navbarBrandImage
 - navbarBrandText
 - signUpURL
 - profileURL
*/

var chaiseConfig = {
    name: "navebar",
    layout: 'list',
    confirmDelete: true,
    customCSS: '/assets/css/chaise.css',
    navbarBrand: 'test123',
    navbarBrandImage: 'test123.jpg',
    navbarBrandText: 'test123',
    headTitle: 'this one should be ignored in favor of navbarBrandText',
    logoutURL: 'test123',
    profileURL: 'test123l;akjdf;lakdsjf',
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
    showDeleteButton: true,
    tour: {
      pickRandom: false,
      searchInputAttribute: "Data",
      searchChosenAttribute: "Data Type",
      searchInputValue: "micro",
      extraAttribute: "Mouse Anatomic Source",
      chosenAttribute: "Data Type",
      chosenValue: "Expression microarray - gene"
   },
   signUpURL: 'test123.coma;lksjf;laksj',
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
