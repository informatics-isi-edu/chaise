# Annotation Contexts Used By Chaise

This document describes the annotation "contexts" used by Chaise. For more on annotation
contexts see the [ERMrest user documentation on annotations](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md).

|              | compact         | compact/brief | detailed        | entry | entry/edit | entry/create | filter | name | * |
|--------------|-----------------|---------------|-----------------|-------|------------|--------------|--------|------|---|
| [recordset](https://github.com/informatics-isi-edu/chaise/blob/master/recordset/readme.md)    | Pertains to the data that loads inside the recordset table       | -             | -        | -     | -          | -            | -      | -    | - |
| [record](https://github.com/informatics-isi-edu/chaise/blob/master/record/readme.md)   | General case that is used if `compact/brief` is not defined.       | Pertains to the data inside the related tables that are loaded after the record. Inherits from `compact` if not defined.             | Pertains to the record itself and the way that the record data will be displayed on the page.         | -     | -          | -            | -      | -    | - |
| [recordedit](https://github.com/informatics-isi-edu/chaise/blob/master/recordedit/readme.md)   | -       | -             | -        | General case that is used during creation if  `entry/create` is not defined and used for editing if `entry/edit` is not defined.    | Modifies the form that shows for editing. Inherits from `entry` if not defined.          | Modifies the form that shows for creation. Inherits from `entry` if not defined.            | -      | -    | - |
| [viewer](https://github.com/informatics-isi-edu/chaise/blob/master/viewer/readme.md)       | -       | -             | -        | -     | -          | -            | -      | -    | - |

More information about what each context does for each app can be found in each
Chaise app's readme.md file.
