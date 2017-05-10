// Configure deployment-specific data here

var chaiseConfig = {
    name: "recordedit delete record false",
    dataBrowser: '',
    editRecord: true,
    deleteRecord: false
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
