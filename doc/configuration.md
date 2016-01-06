# Configuration

**Chaise** is using a set of default configuration parameters. You can overwrite them through the _chaise-config.js_ file and/or the search parameters in the URL.
The URL search parameters take precedence over the _chaise-config.js_ parameters, which at their turn take precedence over the default ones.

The below table explains the usage of them:

| Parameter | Values | Default Value | chaise-config.js | URL | Remarks |
|-----------|--------|---------------|------------------|-----|---------|
| catalog | A catalog id | 1 | "catalog":\<id\> | catalog=\<id\> | The catalog id has a numeric value |
| schema | A schema name | N/A | "schema":\<name\> | schema=\<name\> | A default value can be established through the [schema annotation default keys](https://github.com/informatics-isi-edu/chaise/blob/master/doc/annotation.md#schema-annotations). <br> A random schema of the catalog is selected if it is not specified otherwise. |
| authnProvider | session <br> goauth <br> globusonline | goauth | "authnProvider":\<value\> | N/A | The _ermrest_config.json_ file must be configured adequately for the used authnProvider. |
| layout | list <br> table <br> card | list | "layout":\<value\> | layout=\<value\> | The view the summary page will be rendered. |
| facetPolicy | on_demand | N/A | "facetPolicy":\<value\> | N/A | If present with the _on_demand_ value, requests (for facets count and for facets distinct values) will be issued only for the selected facets. <br> At start up, the facets with the "top" annotation will be selected.<br>  On demand, you can check also other facets. |
| feedbackURL | An URL for a form to provide feedback. | The FaceBase feedback form page. | "feedbackURL":\<URL\> | N/A | |
| helpURL | An URL for getting help using Chaise. | The URL for getting help in using the Data Browser of FaceBase. | "helpURL":\<URL\> | N/A | |
| ermrestLocation | The base URL for the ERMrest service | window.location.protocol + // + window.location.host | "ermrestLocation": \<URL\> | N/A | The location of the ERMrest service. |
| recordResource | The sub path for the record resource | /record | "recordResource":\<value\> | N/A | |
| showBadgeCounts | true <br> false | false | "showBadgeCounts":\<value\> | N/A | If true, facet counts will be displayed in the sidebar. |
