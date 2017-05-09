/* This config tests navbar functionalities with:
 - No headTitle
 - navbarBrandImage
 - navbarBrandText
 - signUpURL
 - profileURL
*/

var chaiseConfig = {
    name: "navbar base",
    navbarBrand: 'test123',
    navbarBrandImage: 'test123.jpg',
    navbarBrandText: 'test123',
    headTitle: 'this one should be ignored in favor of navbarBrandText',
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
