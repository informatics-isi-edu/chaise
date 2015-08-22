# Configuration

**Chaise** is using a set of default configuration parameters. You can overwrite them through the _chaise-config.js_ file and/or the search parameters in the URL.
The URL search parameters take precedence over the _chaise-config.js_ parameters, which at their turn take precedence over the default ones.

The below table explains the usage of them:

| Parameter | Values | Default Value | chaise-config.js | URL | Remarks |
|-----------|--------|---------------|------------------|-----|---------|
| catalog | A catalog id | 1 | "catalog": \<id\> | catalog=\<id\> | The catalog id has a numeric value |
| schema | A schema name | N/A | "schema": \<name\> | schema=\<name\> | A default value can be established through the [schema annotation default keys](https://github.com/informatics-isi-edu/chaise/blob/master/doc/annotation.md#schema-annotations). <br> A random schema of the catalog is selected if it is not specified otherwise. |
| authnProvider | session <br> goauth <br> globusonline | goauth | "authnProvider": \<value\> | N/A | The _ermrest_config.json_ file must be configured adequately for the used authnProvider. |
| layout | list <br> table <br> card | list | "layout": \<value\> | layout=\<value\> | The view the summary page will be rendered. |

