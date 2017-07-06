var chaiseConfig = {
    name: "Footer",
    apps:['recordedit','recordset'],
    footerMarkdown:"**Please check** [Privacy Policy](/privacy-policy/){target='_blank'}"
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
