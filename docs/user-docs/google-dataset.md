## Description


Google Dataset Search is a search engine from Google that helps researchers locate online data that is freely available for use. Google Dataset Search relies on exposed crawlable structured data via schema.org markup, using the schema.org [Dataset](https://schema.org/Dataset) class. In order for our pages to pop up in the search results, we need to add markup in the JSON-LD format. 


## How to enable it

1. Setup the [annotation](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#tag-2021-google-dataset) correctly using pattern expansion.
3. For more fine grain control of cases where JSON-LD should be added, a config file called google-dataset-config.js is used to specify the cases that should contain the JSON-LD. It can be plugged in similar to chaise-config.js. JSON-LD will only be appended when the row in question is in the config (if it exists for the table) and the annotation is setup correctly as well.  This is an optional step and if no config file exists then the JSON-LD will still be appended if the annotation is setup correctly.
3. Validation is performed on the generated JSON-LD and any incorrect attributes are discarded and the rest is appended to the <head> tag. Check the browser console for any logs about any issues discovered during the validation of JSON-LD.
4. Verify that the JSON-LD is appended to <head> by inspecting the <head> tag or using the Chrome extension [Structured Data Testing](https://chrome.google.com/webstore/detail/structured-data-testing-t/kfdjeigpgagildmolfanniafmplnplpl?hl=en). This extension also shows warnings and/or errors(if any) in the structured data.
