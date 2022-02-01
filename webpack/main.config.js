var getAppConfig = require('./app.config');
var getLibConfig = require('./lib.config');

// if NODE_DEV defined properly, uset it. otherwise set it to production.
var nodeDevs = ['production', 'development'];
var mode = process.env.NODE_ENV;
if (nodeDevs.indexOf(mode) == -1) {
  mode = nodeDevs[0];
}

console.log("webpack mode: "+ mode);
module.exports = [
  getAppConfig("recordset", "", mode), getLibConfig("navbar", "", mode),
];
