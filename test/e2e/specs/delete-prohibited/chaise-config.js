// Configure deployment-specific data here

var chaiseConfig = {
    name: "Delete Prohibited",
    dataBrowser: "",
    editRecord: true,
    deleteRecord: false
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
