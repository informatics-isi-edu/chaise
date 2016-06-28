## Data Import and Export Tool

The data import and export utility allows to create new catalog, schemas, tables and entities as well as export them.

### Import

To import data you need to provide a configuration that specifies the content to be created, Ermrest API Url and AuthCookie. This could be declared like this

```javascript
var configuration = {
	configuration : {
	{
	    "catalog": {
	        //"id": 1  //existing id of a catalog
	    },
	    "schema": {
	        "name": "product",
	        "createNew": true, // change this to false to avoid creating new schema
	        "path": "./schema/product.json" // path of the schema json file in data_setup folder
	    },
	    "tables": {
	        "createNew": true, // Mention this to be true to allow creating new tables
	    },
	    "entities": {
	        "createNew": true, // Mention this to be true to allow creating new entities
	        "path": "./data/product", // This is the path from where the json for the entities will be picked for import
	    },

	},
	url: "https://dev.isrd.isi.edu/ermrest/",  //Ermrest API url
	authCookie: "ermrest_cookie;" // Ermrest Authentication cookie to create data
}
```

Once you've your configuration you just need to require the `import.js` file in your script and call the `importData` function. Here's how your code would look like if you have already declared the configuration variable mentioned above

```javascript
var dataImport = require('./import.js');
dataImport.importData(configuration).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
```

If you don't plan on writing your own script then you can always use the [importUsageSample.js](/test/e2e/data_setup/importUsageSample.js) and replace the configuration with your values. Then just run the file using node.js

```sh
node test/e2e/data_setup/importUsageSample.js
```

### Export

To export an existing catalog and its default schema you cn use `export.js` utility. It will download the schema information and save it in the schema folder with its name in a specific folder if provided.

```javascript
var dataExport = require('./export.js');

dataExport.download({
	catalogId: 1,          // Mandatory
	url: "https://dev.isrd.isi.edu/ermrest/", // Ermrest API Url from where you want to download data
	authCookie: "ermrest_cookie;", // Ermrest Authentication cookie to download data
	schemaName: "legacy",   // Optional: Will download the defailt catalog if not provided
	folderName: "export01"  // Optional: To specify an explicit folder name inside the schema and data folder where the content will be 
							// exported to avoid conflicts with existing names
}).then(function(data) {
	console.log("Data imported with catalogId " + data.catalogId);
}, function(err) {
	console.log("Unable to import data");
	console.dir(err);
});
```

If you don't plan on writing your own script then you can always use the [exportUsageSample.js]() and replace the *catalogId*, *schemaName* and *folderName* parameters. Then just run the file using node.js

```sh
node test/e2e/data_setup/exportUsageSample.js
```

``` 
