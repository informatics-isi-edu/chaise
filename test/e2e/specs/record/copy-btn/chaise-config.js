// Configure deployment-specific data here

var chaiseConfig = {
    name: "copy button test",
    headTitle: 'Copy Button test',
    editRecord: true,
    deleteRecord: true
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
