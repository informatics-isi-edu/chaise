var fs = require('fs');
var config = require('../../../chaise-config-sample.js').config;

if (process.env.ERMREST_URL) {
	config.ermrestLocation = process.env.ERMREST_URL;
}

var str = "var chaiseConfig=" + JSON.stringify(config, undefined , 2) + ";";
fs.writeFile(__dirname + '/../../../chaise-config.js', str);

