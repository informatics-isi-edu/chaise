// Configure deployment-specific data here

var chaiseConfig = {
    name: "Delete Prohibited",
    defaultCatalog: 'delete-prohibited-chrome',
    editRecord: true,
    deleteRecord: false,
    showFaceting: true,
    navbarBrandText: 'test123',
    navbarBrandImage: '../images/genetic-data.png',
    maxRecordsetRowHeight: 100,
    disableExternalLinkModal: true,
    logClientActions: false,
    hideRecordeditLeaveAlert: true,
    hideTableOfContents: true,
    showWriterEmptyRelatedOnLoad: true,
    loggedInMenu: {
        menuOptions: { nameMarkdownPattern: "Outbound Profile Link", urlPattern: "/", newTab: true, type: "url" }
    },
    navbarBanner: {
        markdownPattern: "This is a banner with [link](https://example.com)"
    }
};
