# Schema Annotations

**Chaise** is using the following current [schema annotations keys](https://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/model/naming.md#schema-annotations):

 - **comment**: contains a JSON array

It is expected in the future that key to be renamed to some useful URL.

The below tables explains the meaning of the possible values for the key.

- **_comment_** _key_ _values_

| Value | Meaning |
|-------|---------|
| exclude | The schema is "excluded" from the catalog. None of its tables will be displayed in the list of the available tables. | 
| default | By default (when the schema name is not specified in the URL or in the _chaise-config.js_ file), the tables of that schema will be used. | 

## Examples

Set the _legacy_ schema as the default one:

    PUT /ermrest/catalog/1/schema/legacy/annotation/comment HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    ["default"]
    
Exclude the tables of the _Microscopy_ schema:

    PUT /ermrest/catalog/1/schema/Microscopy/annotation/comment HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    ["exclude"]
    
# Table Annotations

**Chaise** is using the following current [table annotations keys](https://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/model/naming.md#table-annotations):

 - **comment**: contains a JSON array
 - **description**: contains a JSON object
 - **facet**: contains a JSON string

It is expected in the future these keys to be renamed to some useful URLs.

The below tables explains the meaning of the possible values for the two keys.

- **_comment_** _key_ _values_

| Value | Meaning |
|-------|---------|
| association | The table has a FOREIGN KEY to the dataset table. The rest of its columns are vocabulary terms. |
| default | By default (when the table name does not appear in the URL), this table will be displayed in the summary page. |
| download | The table has a column that is a FOREIGN KEY to a table containing an URL of the file to be downloaded. |
| exclude | The table is "excluded" from the schema. It will not be displayed in the list of the available tables. | 
| geo | The table has GEO (Gene Expression Omnibus) columns referring URLs to a public functional genomics data repository. |
| image | The table has a column that is a FOREIGN KEY to a table containing the image file. The images are displayed as tiles. |
| nested | The table has a FOREIGN KEY column to a parent table. It will not be displayed in the list of the available tables. | 
| preview | The table has a column that is a FOREIGN KEY to a table containing the 3-D image file. The images will be rendered with a 3-D viewer. |
| reference | The table has columns with external references links. | 

- **_description_** _key_ _values_

| Value | Meaning |
|-------|---------|
| display | The name with which the table will be displayed. | 
| enlarge_url | The URL of the 3-D viewer. | 
| preview_url | The URL of the 3-D preview (view on load). | 
| viewer_url | The URL of the 3-D viewer. | 
| top_columns | An array containing the columns to be displayed in the summary table. | 
| sortedBy | The default column by which the search results will be sorted. | 
| sortOrder | The order by which the search results will be sorted. Valid values are **asc** and **desc**. The default is **asc**. | 

- **facet** _key_ _values_

| Value | Meaning |
|-------|---------|
| hidden | All the table columns will not be displayed in the facets sidebar. | 

## Examples

Set the _dataset_ table as the default one:

    PUT /ermrest/catalog/1/schema/legacy/table/dataset/annotation/comment HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    ["default"]
    
Display the _dataset_ table as _FaceBase 1 Data_:

    PUT /ermrest/catalog/1/schema/legacy/table/dataset/annotation/description HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    {"display": "FaceBase 1 Data"}
    
# Column Annotations

**Chaise** is using the following current [column annotations keys](https://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/model/naming.md#column-annotations):

 - **comment**: contains a JSON array
 - **description**: contains a JSON object
 - **facet**: contains a JSON string
 - **facetOrder**: contains an integer

It is expected in the future these keys to be renamed to some useful URLs.

The below tables explains the meaning of the possible values for the two keys.

- **_comment_** _key_ _values_

| Value | Meaning |
|-------|---------|
| bottom | The column will not appear in the summary view. | 
| dataset | The column belongs to an association table and contains the reference to the dataset table. | 
| download | The column represents a file to be downloaded. | 
| html | The column value will be rendered as an HTML text. | 
| hidden | The column will not be displayed at all (nor in the summary view, nor in the detail view). | 
| image | The column belongs to an association table and contains the reference to an image file. | 
| name | The column contains the name of a file. | 
| orderby | The column will be used in sorting the results. It is useful for sorting the files size, such that the displayed thumbnail will be selected based on the minimum file size. | 
| preview | The column represents the value of a 3-D preview file (view on load). | 
| summary | The column will be displayed in the summary view, but not in the detail view. | 
| text | The presentation of the column values will be a text box. | 
| thumbnail | The column contains the URL to an image file. It will be displayed as a thumbnail in the summary page. On clicking on it, the detail page will be displayed. | 
| title | The column will be displayed as a title in the summary page. Clicking on it, will display the detail page. | 
| top | The column will be displayed in the summary page. | 
| type | The column contains the type of a file (image/gif, image/jpeg, image/png, image/tiff). | 
| unsortable | The column will be excluded from the drop down list of sort columns. | 
| url | The column will be displayed as an URL link. | 
| viewer | The column represents the value of a 3-D image file. | 

- **_description_** _key_ _values_

| Value | Meaning |
|-------|---------|
| display | The name with which the column will be displayed. | 
| rank | The column by whose values it will be sorted. | 
| url_pattern | The column contains an URL with the **{value}** and/or **{encode.value}** patterns. The URL will be build by replacing the **{value}** and **{encode.value}** patterns with the column value, respectively encoded URI value of the column. Example of url_pattern value: ```"http://www.ncbi.nlm.nih.gov/pubmed/{value}"``` or ```"http://www.ncbi.nlm.nih.gov/guide/{encode.value}"``` | 
| url_text | The text that will be displayed by a column that represents an URL link. | 

- **facet** _key_ _values_

| Value | Meaning |
|-------|---------|
| hidden | The column will not be displayed in the facets sidebar. | 

- **facetOrder** _key_ _values_

| Value | Meaning |
|-------|---------|
| \<integer> | The position of the facet in the facets sidebar. | 

## Examples

Display the _geo_gds_ column as a link:

    PUT /ermrest/catalog/1/schema/legacy/table/dataset_geo/column/geo_gds/annotation/comment HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    ["url"]
    
Display the _geo_gds_ column as _GEO Curated_:

    PUT /ermrest/catalog/1/schema/legacy/table/dataset_geo/column/geo_gds/annotation/description HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    {"display": "GEO Curated"}
    
Display the _organism_ column in the first position of the facets:

    PUT /ermrest/catalog/1/schema/legacy/table/dataset_organism/column/organism/annotation/facetOrder HTTP/1.1
    Host: www.example.com
    Content-Type: text/csv
    Accept: text/csv

    1
    
# Foreign Key Annotations

**Chaise** is using the following current [foreign key annotations](https://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/model/naming.md#foreign-key-annotations):

 - **comment**: contains a JSON array

It is expected in the future that key to be renamed to some useful URL.

The below table explains the meaning of the possible values for the key.

- **_comment_** _key_ _values_

| Value | Meaning |
|-------|---------|
| thumbnail | The column of the _from\_table_ is a reference to the column of the _to\_table_. The _to\_table_ table contains thumbnail entities. | 
