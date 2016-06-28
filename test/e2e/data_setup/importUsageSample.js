var configuration = {
	configuration: require('./config/sample.json').dataSetup,
	url: "https://dev.isrd.isi.edu/ermrest/";,
	authCookie: "ermrest_cookie;"
};

var dataImport = require('./import.js');

dataImport.importData(configuration).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
