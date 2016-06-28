var configuration = {
	catalogId: 1,          // Mandatory
	url: "https://dev.isrd.isi.edu/ermrest/", // Ermrest API Url from where you want to download data
	schemaName: "legacy",   // Optional: Will download the defailt catalog if not provided
	authCookie: "ermrest_cookie", //Optional: Ermrest cookie
	folderName: "export01"  // Optional: To specify an explicit folder name inside the schema and data folder where the content will be 
							// exported to avoid conflicts with existing names
};

require('./export.js').download(configuration);


