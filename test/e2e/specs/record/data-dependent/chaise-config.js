// Configure deployment-specific data here

var chaiseConfig = {
    name: "record data dependent",
    headTitle: 'Chaise',
    customCSS: '/assets/css/chaise.css',
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
