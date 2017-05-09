/* This config tests functionalities with:
 - headTitle
 - customCSS
*/

var chaiseConfig = {
    name: "viewer",
    headTitle: 'some sample title 23423lkj42;l31j4',
    customCSS: '/path/to/custom/css'
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
