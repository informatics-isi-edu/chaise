# Google Dataset Search support


## Description


[Google Dataset Search](https://datasetsearch.research.google.com/) is a search engine from Google that helps researchers locate online data that is freely available for use. Google Dataset Search relies on exposed crawlable structured data via schema.org markup, using the [schema.org Dataset](https://schema.org/Dataset) class. In order for our pages to pop up in the search results, we need to add markup in the JSON-LD format. Examples of this markup can be found [here](https://developers.google.com/search/docs/data-types/dataset#example) and also below.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Sales of the leading ice cream brands of the U.S. 2020",
  "description": "This graph shows the sales of the leading ice cream brands of the United States in 2020. Ben &amp;amp; Jerry&amp;#039;s was the top ranked ice cream brand of the United States with about 863.1 million U.S. dollars worth of sales for the 52 weeks ended November 1, 2020. Total ice cream category sales amounted to about 6.97 billion U.S. dollars. Despite being far from the top brand, consumers stated that they regularly purchase Breyers above any other brand. Ice cream is a part of the frozen dessert category and serves as an indulgent snack for those with a sweet tooth. Ice cream comes in a large variety of styles ranging from regular ice cream to low-fat ice cream. There are fruity and creamy options available or a combination of both.",
  "url": "https://www.statista.com/statistics/190426/top-ice-cream-brands-in-the-united-states/",
  "keywords": [
    "sales",
    "ice cream",
    "ice cream brands",
    "brands"
  ],
  "temporalCoverage": "52 weeks ended Novmeber 1, 2020",
  "creator": {
    "@type": "Organization",
    "url": "https://www.statista.com"
  }
}
</script>
```


## How to enable it

1. Setup the [annotation](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#tag-2021-google-dataset) correctly using pattern expansion. ERMrestJS validates the generated JSON-LD and any incorrect attributes are discarded and the rest is appended to the `<head>` tag. Check the browser console for any logs about any issues discovered during the validation of JSON-LD.

2. For more fine grain control of cases where JSON-LD should be added, a config file called [`google-dataset-config.js`](https://github.com/informatics-isi-edu/chaise/blob/master/google-dataset-config-sample.js) is used to specify the cases that should contain the JSON-LD. It can be plugged in similar to chaise-config.js. JSON-LD will only be appended when the row in question is in the config (if it exists for the table) and the annotation is setup correctly as well.  This is an optional step and if no config file exists then the JSON-LD will still be appended if the annotation is setup correctly. Example below:

```javascript
var googleDatasetConfigs = {
    "2": {
        "Protocol": {
            "Protocol": {
                "columns": [
                    "RID"
                ],
                "values": [
                    "N-H98J","N-H98R","N-H990","N-H99G","N-H996","N-H99J","N-H99P","N-H9A8"
                ]
            }
        },
        "Common": {
            "Collection": {
                "columns": [
                    "RID"
                ],
                "values": [
                    "Q-3K5E","R-ZD4C","16-26EY","16-QKNG","16-WHS4","16-WMM4","17-DSBR"
                ]
            },
            "Gene": {
                "columns": [
                    "RID"
                ],
                "values": [
                    "Q-3TNA","Q-5CPA"
                ]
            }
        }
    }
}
```

3. Verify that the JSON-LD is appended to `<head>` by inspecting the `<head>` tag or using the Chrome extension [Structured Data Testing](https://chrome.google.com/webstore/detail/structured-data-testing-t/kfdjeigpgagildmolfanniafmplnplpl?hl=en). This extension also shows warnings and/or errors(if any) in the structured data.

4. Use [Google Search Console](https://developers.google.com/search/blog/2019/05/monitoring-structured-data-with-search-console) to stay updated about any issues with the structured data.