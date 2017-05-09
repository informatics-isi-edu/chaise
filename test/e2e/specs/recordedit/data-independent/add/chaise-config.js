/* This config tests functionalities with:
 - headTitle
 - customCSS
*/

var chaiseConfig = {
    name: "recordedit add",
    headTitle: 'some sample title 23423lkj42;l31j4',
    customCSS: '/path/to/custom/css',
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
