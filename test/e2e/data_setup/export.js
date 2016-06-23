
var request = require('request'), fs = require('fs');

var ermrestURL = "https://dev.isrd.isi.edu/ermrest/";
var authCookie = "";
var dataSetupCode = require('./import.js');

var download = function (catalogId) {
  catalogId = catalogId || 1;
  // Fetches the schemas for the catalogId
  // and sets the defaultSchema and defaultTable in browser parameters
  dataSetupCode.introspect({
    url: ermrestURL,
    catalogId: catalogId,
    authCookie: authCookie
  }).then(function(schema) {
    fs.writeFile(__dirname + '/schema/' + schema.name + "1.json", JSON.stringify(schema.content, undefined, 2) , function(err) {
      if (err) throw err;

      request = request.defaults({
        headers: {'cookie': authCookie }
      });

      console.log(schema.name);

      exportEntities = function(table) {
        request
          .get(ermrestURL + 'catalog/' + catalogId + '/entity/' + schema.name + ':' + table)
          .pipe(fs.createWriteStream(__dirname + '/data/' + schema.name + '/' + table + '.json'));
      };

      if (!fs.existsSync(__dirname + '/data/' + schema.name )){
        fs.mkdirSync(__dirname + '/data/' + schema.name );
      }

      for(var k  in schema.content.tables) {
        exportEntities(k);
      }

    });

  
  }, function(err) {
    throw new Error("Unable to fetch schemas");
  });

};

download();







