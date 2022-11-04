## Features
* The page shows all the information for an entity including entities that are related to the main entity
  * The related entities are expanded by default to show the data
  * Related entities that don't have any defined values are not shown
  * Related entities have a link that points to a listing of the full set of data
* An `edit` button for modifying the current entity
* A `create` button for creating a new entity for the given `catalog/schema:table`
* A `permalink` button for sharing a link to the current page

### [Contexts](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#context-names)
The `detailed` context pertains to the record itself and the way that the record data will be displayed on the page.
The `compact` context pertains to the data inside the related tables that are loaded after the record itself. 
See additional information [here](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#context-names).

### [Annotations](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md)
The following annotations are used to affect how information is displayed:
* Table Display (`tag:isrd.isi.edu,2016:table-display`)
  * The `table-display` annotation can be used for a few different cases in record. Page size for `compact/brief` will affect the maximum number of results that show in the related entity tables.
  ```
    "tag:isrd.isi.edu,2016:table-display": {
      "compact": {
        "page_size": 5
      }
    }
  ```
  
* Display (`tag:misd.isi.edu,2015:display`)
  * The `display` annotation is used for setting a name for a schema/table/column to be displayed in the UI.
  
* Visible Columns (`tag:isrd.isi.edu,2016:visible-columns`)
  * The `visible-columns` annotation is used to define what columns to show in the UI for both contexts, `detailed` and `compact/brief`. It is also used to define the order in which the columns appear.
  ```
    "tag:isrd.isi.edu,2016:visible-columns" : {
      "detailed" : [<column-name1>, <column-name2>, ...]
    }
  ```
  
* Visible Foreign Keys (tag:isrd.isi.edu,2016:visible-foreign-keys)
  * The `visible-foreign-keys` annotation is used to determine the order of the related entities and their visibility.
  ```
    "tag:isrd.isi.edu,2016:visible-foreign-keys" : {
      "detailed" : [ 
        [<schema-name>, <foreign-key-name1>], 
        [<schema-name>, <foreign-key-name2>], 
        ... 
      ]
    }
  ```


### [Config Parameters](https://github.com/informatics-isi-edu/chaise/blob/master/doc/configuration.md)
The following config parameters are used by record:
* editRecord 
* defaultCatalog
* defaultTables
