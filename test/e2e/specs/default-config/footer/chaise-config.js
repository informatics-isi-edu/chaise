var chaiseConfig = {
    name: "Footer",
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
