// Configure deployment-specific data here

var chaiseConfig = {
    headTitle: 'Copy Button test',
    navbarBrandText: 'Copy Button Test',
    navbarBrand: '/',
    feedbackURL: 'http://goo.gl/forms/f30sfheh4H',
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true,
    showBadgeCounts: false,
    recordUiGridEnabled: false,
    recordUiGridExportCSVEnabled: true,
    recordUiGridExportPDFEnabled: true,
    showUnfilteredResults: true
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
