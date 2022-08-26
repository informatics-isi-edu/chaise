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
    showWriterEmptyRelatedOnLoad: true,
    loggedInMenu: {
        menuOptions: { nameMarkdownPattern: "Outbound Profile Link", urlPattern: "/", newTab: true, type: "url" }
    },
    navbarBanner: {
        markdownPattern: "This is a banner with [link](https://example.com)"
    },
    resolverImplicitCatalog: 1 // when run in parallel config mode, this config runs for catalogId 4 in ci
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
