// Configure deployment-specific data here

var chaiseConfig = {
    name: "recordedit edit",
    headTitle: 'Chaise',
    dataBrowser: '',
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
