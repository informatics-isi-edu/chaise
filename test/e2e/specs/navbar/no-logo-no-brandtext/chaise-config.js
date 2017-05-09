/* This config tests navbar functionalities with:
 - No navbarBrandImage
 - No navbarBrandText
 - No profileURL
 - No signUpURL
 - A specified headTitle
*/


var chaiseConfig = {
    name: "navbar no logo",
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
