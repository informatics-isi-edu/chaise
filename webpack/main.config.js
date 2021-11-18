var getAppConfig = require('./app.config');
var getLibConfig = require('./lib.config');

module.exports = [
  getAppConfig("recordset"), getLibConfig("navbar"),
];
