// Configure deployment-specific data here

var chaiseConfig = {
     name: "Default Config",
     logClientActions: false
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
