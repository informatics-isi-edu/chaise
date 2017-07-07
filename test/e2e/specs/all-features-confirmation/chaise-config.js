// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features with Delete Confirmation Dialog",
    editRecord: true,
    deleteRecord: true,
    confirmDelete: true,
    defaultCatalog: 1,
    footerMarkdown:"**Please check** [Privacy Policy](/privacy-policy/){target='_blank'}",
    defaultTables: {
        "1": {
            "schema": "isa",
            "table": "dataset"
        }
    }
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
