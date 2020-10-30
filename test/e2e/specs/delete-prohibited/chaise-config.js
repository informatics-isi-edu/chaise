// Configure deployment-specific data here

var chaiseConfig = {
    name: "Delete Prohibited",
    editRecord: true,
    deleteRecord: false,
    showFaceting: true,
    navbarBrandText: 'test123',
    navbarBrandImage: '../images/genetic-data.png',
    maxRecordsetRowHeight: 100,
    disableExternalLinkModal: true,
    logClientActions: false,
    hideTableOfContents: true,
    resolverImplicitCatalog: 4 // when run in parallel config mode, this config runs for catalogId 4 in travis
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
