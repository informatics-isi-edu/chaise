var dataImport = require('./import.js');

var configuration = require('./config/sample.json');  //Mandatory
var ermRestUrl = "https://dev.isrd.isi.edu/ermrest/"; //Mandatory
var authCookie = "ermrest=C6KFIQn2JS37CGovofWnjKfu;" ;  //Mandatory

dataImport.importData({
	testConfiguration: configuration.dataSetup,
	url: ermRestUrl,
	authCookie: authCookie
}).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
