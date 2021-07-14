# Google Dataset Search support

- Google Dataset Search is a search engine from Google that helps researchers locate online data that is freely available for use. Google Dataset Search relies on exposed crawlable structured data via schema.org markup, using the schema.org dataset class https://schema.org/Dataset. In order for our pages to put up in the search results, we need to add markup in the JSON-LD format. 


- The JSON-LD will be based on the annotation called tag:isrd.isi.edu,2021:google-dataset https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#tag-2021-google-dataset . Using pattern expansion inside the annotation, the attributes of the JSON-LD will be populated.

- For more fine grain control of cases where JSON-LD should be added, a config file called google-dataset-config.js is used to specify the records that should contain the JSON-LD. It can be plugged in similar to chaise-config.js. JSON-LD will only be appended when the RID is in the config (if it exists for the table) and the annotation is setup correctly as well.


- Validation is performed on the generated JSON-LD and any incorrect attributes are discarded and the rest is appended to the <head> tag. Validation failures that will lead to JSON-LD not being appended - 
  1. Incorrect value of `@context`
  2. Incorrect value of `@type`
  3. Missing or incorrect value of mandatory attribute `name`
  4. Missing or incorrect value of mandatory attribute `description`
   
  In all remaining scenarios, the problematic attribute will simply be ignored and the reason for that will be logged in the console. 

- The resulting JSON-LD can be seen by inspecting the page and checking the <head> tag or by using the Chrome extension Structured Data Testing that shows the structured data added to a page. This extension also shows warnings and/or errors(if any) in the structured data.