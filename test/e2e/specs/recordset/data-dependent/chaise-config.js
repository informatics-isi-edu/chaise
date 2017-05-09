/* This config tests functionalities with:
 - headTitle
 - customCSS
*/

var chaiseConfig = {
    name: "recordset presentation",
    headTitle: 'some sample title 23423lkj42;l31j4',
    customCSS: '/path/to/custom/css',
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true,
    defaultCatalog: 1,
    defaultTables: {
        "1": {
            "schema": "isa",
            "table": "dataset"
        }
    }
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
