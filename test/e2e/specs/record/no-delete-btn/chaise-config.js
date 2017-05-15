// Configure deployment-specific data here

var chaiseConfig = {
    name: "record no delete btn",
    headTitle: 'Chaise',
    dataBrowser: '',
    editRecord: true,
    deleteRecord: false
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
