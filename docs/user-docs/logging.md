# Logging

By providing `Deriva-Client-Context` header in ermrset requests we can log extra objects alongside the request. ERMrest will log the provided object in the `dcctx` attribute of logs. For example the following is a line from `/var/log/messages` file in dev.isrd:

```
Jan 24 16:29:50 dev.isrd.isi.edu ermrest[4313.139635548755712]:
{
  "elapsed":0.014,
  "req":"OSGHMz7JSySiS0Y5UOLA6w",
  "scheme":"https",
  "host":"dev.isrd.isi.edu",
  "status":"304 Not Modified",
  "method":"GET",
  "path":"/ermrest/catalog/1/attributegroup/M:=isa:dataset/F5:=left(thumbnail)=(isa:file:id)/$M/F4:=left(owner)=(isa:person:name)/$M/F3:=left(gene_summary)=(vocabulary:gene_summary:id)/$M/F2:=left(status)=(isa:dataset_status:id)/$M/F1:=left(project)=(isa:project:id)/$M/release_date,id;M:=array(M:*),F5:=array(F5:*),F4:=array(F4:*),F3:=array(F3:*),F2:=array(F2:*),F1:=array(F1:*)@sort(release_date::desc::,id)?limit=26", "client":"128.9.184.94",
  "referrer":"https://dev.isrd.isi.edu/~ashafaei/chaise/recordset/",
  "agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
  "track":"f671a1bf.559966234faaf",
  "dcctx":{
    "wid":"2d1a297p1l3t24942o261ot1",
    "cid":"recordset",
    "schema_table":"isa:dataset",
    "pid":"1fyj2i5t2ew02qg41xuc2mxf",
    "page_size":25,
    "action":"recordset/main/load"
 }
}
```

You can see the `dcctx` attribute. This belongs to the request for showing the entities in the recordset app.

## Attributes
The following are the default attributes that you can find on all the requests:

- `cid`: The app name (record, recordset, recordedit).
- `wid`: The window id (randomly generated).
- `pid`: The page id (randomly generated).
- `catalog`: The catalog id.
- `schema_table`: The `schema:table` combination.
- `action`: A pre-defined string that implies what the request was for. Refer to [the action list](#action-list) for more information.
- `elapsed_s`: A value set to determine the elapsed time since the ermrestJS http service has been available. This will always be in seconds

The following are the optional attributes that you might find on requests:
- `ppid` and `pcid`: The parent `pid` and `pcid`. These two attributes will be available only on a number of requests. It will indicate which app and page led to this current request. These are the requests that might have `ppid` and `pcid`.
  - recordset: First read of the main entity.
  - record: First read of the main entity.
  - recordedit: The create/edit request (the request generated when user clicks on submit).
  - viewer: First read of the main entity.
- `facet`: If url contains filter, this attributes gives you the [facet](https://github.com/informatics-isi-edu/ermrestjs/wiki/Facets-JSON-Structure) equivalent of that filter.
- `filter`: If we couldn't represent the given filter in terms of facet. This will be just a simple string.
- `cfacet`: If url contains custom-facets (`*::cfacets::`), this attribute will be equal to one. In this case one of the following attributes will be available:
  - `cfacet_str`: the displayname of custom-facet (if provided in url).
  - `cfacet_path`: the ERMrest path that was sent with the custom-facet.
- `page_size`: The number of entities that we requested.
- `source`: The source path of facet. You will find this attribute in the requests that belong to a facet.
- `column`: The column that is used for faceting. It will be attached to scalar facet requests.
- `referrer`: It's an object that has `schema_table` and `facet`/`filter`/`cfacet_str`/`cfacet_path` as its attributes. This attribute is available on the request that needs to capture their parent context, which are
  - record page: Any secondary request (related entities and aggregate columns). The `referrer` for these request is the main table of the page.
  - record page: The first request generated after clicking on "add" pure and binary association entity. `referrer` will be the main entity.
  - recordedit page: The request for getting the pre-filled value of foreign key. `referrer` is the main entity.
  - recordset page: Any request for getting the facet data. The `referrer` is the main entity and it will include all the selected facets and filters.
- `t`: If this attribute exists and its value is `1`, then the given object is truncated since it was lengthy. Refer to [truncation](#truncation) for more information.
- `template`: This object will only be available for export request. It's an object with only `displayname` and `type` attributes.
- `cqp` (chaise query parameter): When a user uses a link that includes the `?` instead of the `#`. These urls are only used to help with google indexing and should be used only for navigating users from search engines to chaise apps.

## Action List

The table below summarizes all the requests that we currently are logging in chaise and their respective `action`.

| App                                                 | Description                                           | Action                                       | Extra                        | Notes                                                                                                                                                 | Change                        |
|-----------------------------------------------------|-------------------------------------------------------|----------------------------------------------|------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------|
| chaise-wide (record, recordset, recordedit, viewer) | get catalog snapshot  information                               | model/snaptime                                |                              |                                                                                                                                                       | [added (4/18/19)](#041819) [updated (10/??/19)](#10??19)    |
|                                                     | get catalog schemas information                       | model/schema                                 |                              |                                                                                                                                                       | [added (4/18/19)](#041819)    |
|                                                     |                                                       |                                              |                              |                                                                                                                                                       |                               |
| record                                              | load main entity                                      | record/main                                  | ppid, pcid                   |                                                                                                                                                       | [bug fix (4/18/19)](#041819)  |
|                                                     | load aggregates in main entity                        | record/aggregate                             | referrer                     |                                                                                                                                                       | [bug fix (4/18/19)](#041819)  |
|                                                     | load inline entities                                  | record/inline                                | referrer                     |                                                                                                                                                       | [bug fix (4/18/19)](#041819)  |
|                                                     | load aggregates in inline entities                    | record/inline/aggregate                      | referrer                     |                                                                                                                                                       | [bug fix (4/18/19)](#041819)  |
|                                                     | load related entities                                 | record/related                               | referrer                     |                                                                                                                                                       | [bug fix (4/18/19)](#041819)  |
|                                                     | load aggregates in related entities                   | record/related/aggregate                     | referrer                     |                                                                                                                                                       | [bug fix (4/18/19)](#041819)  |
|                                                     | update main entity                                    | record/main/update                           |                              | due to change made to any of related entities                                                                                                         |                               |
|                                                     | update aggregates in main entity                      | record/aggregate/update                      | referrer                     | due to change made to any of related entities                                                                                                         |                               |
|                                                     | update inline entities                                | record/inline/update                         | referrer                     | due to change made to any of related entities                                                                                                         |                               |
|                                                     | update aggregates in inline entities                  | record/inline/aggregate/update               | referrer                     | due to change made to any of related entities                                                                                                         |                               |
|                                                     | update related entities                               | record/related/update                        | referrer                     | due to change made to any of related entities                                                                                                         |                               |
|                                                     | update aggregates in related entities                 | record/related/aggregate/update              | referrer                     | due to change made to any of related entities                                                                                                         |                               |
|                                                     | read association values to add                        | pre-create/prefill/association               | referrer                     | due to click on "add" in the inline/related section entity for pure and binary associative relationship                                               |                               |
|                                                     | read existing values in association table             | pre-create/prefill/association/disabled      | referrer                     | the request explained in previous row will return all the possible values to add. With this request, we know which rows should be disabled in the UI. | [bug fix (03/08/19)](#030819) |
|                                                     | create association entities                           | create/prefill/association                   | referrer                     | due to click on "submit" button on the modal for adding pure and binary association relationship.                                                     |                               |
|                                                     |                                                       |                                              |                              |                                                                                                                                                       |                               |
| recordedit                                          | create new entities                                   | create/new                                   | page_size, ppid, pcid        |                                                                                                                                                       |                               |
|                                                     | read the foreign key values that must be pre-filled   | pre-create/prefill                           | referrer                     | when user ends up in recordedit after clicking on "add" in a related entity. This request is for pre-filling the fk values.                           |                               |
|                                                     | create new records with foreign key pre-filled values | create/prefill                               | ppid, pcid                   | the create request that is paired with the previous explained action in this table. due to click on the "submit" button.                              |                               |
|                                                     | read the current row for copy                         | pre-create/copy                              |                              |                                                                                                                                                       |                               |
|                                                     | create record from copy                               | create/copy                                  | page_size, ppid, pcid        | due to click on "submit" button.                                                                                                                      |                               |
|                                                     | creating row by clicking on add in fk modal           | create/modal                                 | page_size, ppid, pcid        | when user clicks on "+" button in the foreign key modal picker and then end up creating new rows in the opened tab. due to click on "submit" button.  |                               |
|                                                     | read entities to be updated                           | pre-update                                   |                              | page_size is inaccurate                                                                                                                               |                               |
|                                                     | update entities                                       | update                                       | page_size, ppid, pcid        | due to click on "submit" button.                                                                                                                      |                               |
|                                                     | get default value for fks                             | default                                      |                              |                                                                                                                                                       | [changed (4/18/19)](#041819)  |
|                                                     |                                                       |                                              |                              |                                                                                                                                                       |                               |
| recordset                                           | recordset main data read on load                      | recordset/main/load                          | page_size, ppid, pcid        |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset main data read on update                    | recordset/main/update                        |                              |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset main data read on page change               | recordset/main/page                          | sort, page, type             |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset main data read on sort change               | recordset/main/sort                          | sort                         |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset main data read on limit change              | recordset/main/limit                         |                              |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset main data read on facet change              | recordset/main/facet                         |                              |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset get main count                              | recordset/main/count                         |                              |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset get aggregated values                       | recordset/main/aggregate                     |                              |                                                                                                                                                       |                               |
| chaise-wide except viewer                           | recordset                                             | recordset/main/`<ANY_SUBACTION>`/correct-page |                              | please refer to change log for more information.                                                                                                      | [added (7/12/19)](#071219)    |
| chaise-wide except viewer                           | recordset read facet                                  | recordset/facet                              | referrer, source, column     | facet/filter state are only reported inside the referrer                                                                                              |                               |
| chaise-wide except viewer                           | recordset initialize preselected entity facets        | recordset/facet/init                         | referrer, source             | facet/filterstate are only reported inside the referrer                                                                                               | [added (4/18/19)](#041819)    |
| chaise-wide except viewer                           | recordset get buckets for a facet                     | recordset/facet/histogram                    | referrer, source, column     | facet/filter state are only reported inside the referrer                                                                                              | [added (4/18/19)](#041819)    |
| chaise-wide except viewer                           | recordset click on show details                       | recordset/viewmore                           | referrer, source, column     | facet/filter state are only reported inside the referrer                                                                                              |                               |
|                                                     |                                                       |                                              |                              |                                                                                                                                                       |                               |
| record                                              | export                                                | export                                       | template (displayname, type) |                                                                                                                                                       | [changed (4/18/19)](#041819)  |
|                                                     |                                                       |                                              |                              |                                                                                                                                                       |                               |
| record                                              | delete from record                                    | delete/record                                |                              |                                                                                                                                                       |                               |
| recordedit                                          | delete from recordedit                                | delete/recordedit                            |                              |                                                                                                                                                       |                               |
| recordset                                           | delete row from recordset table                       | delete/recordset                             |                              |                                                                                                                                                       |                               |
| record                                              | delete related entity rows                            | delete/record/related                        |                              |                                                                                                                                                       | [changed (4/18/19)](#041819)  |
|                                                     |                                                       |                                              |                              |                                                                                                                                                       |                               |
| viewer                                              | main request                                          | main                                         | ppid, pcid                   |                                                                                                                                                       | [added (4/18/19)](#041819)    |
|                                                     | get annotation table                                  | annotation                                   |                              |                                                                                                                                                       | [added (4/18/19)](#041819)    |
|                                                     | get annotation comments                               | comment                                      |                              |                                                                                                                                                       | [added (4/18/19)](#041819)    |
|                                                     | get anatomy data                                      | anatomy                                      |                              |                                                                                                                                                       | [added (4/18/19)](#041819)    |

## Client Button Action List
The following table will include the actions that are triggered when the user clicks on buttons or other elements on the page that don't send a request to the server. We make a head request as part of this click event to store the log info.

Each head request for the below client action events will be made to the same path in ermrest, namely `.../ermrest/client_action`. To figure out which table or record the action was performed on, locate the server request sent on page load associated with the same `pid`.

### Button Action Attributes
The default attributes that you can find on all client action requests are the same as the ones define above in [attributes](#attributes). The only difference for the default attributes is that `action` will be from the list below.

The following are the optional attributes that you might find on requests:
- `facet`: If url contains filter, this attributes gives you the [facet](https://github.com/informatics-isi-edu/ermrestjs/wiki/Facets-JSON-Structure) equivalent of that filter.
  - recordedit page: facet is used for `update/remove` to notify which form was removed from being edited
  - facet "show more" (all 3 apps): In each case, the "Show More" dialog will be for a specific facet which is constrained by all other facets and the main entity that this facet is a part of.
- `column`: The column that is used for faceting for faceting popups. The column that is being acted on in recordedit when using multi select/set functionality.
- `referrer`: It's an object that has `schema_table`, `facet`, and `source` as its attributes. This attribute is available on the request that needs to capture their parent context, which are
  - record page:
    - Any client actions taken to interact with related entities sections (inline or below). The `referrer` for these actions is the main table of the page.
    - Each action in Pure and binary popup, points to main table of page.
    - Each action in facet popup from Pure and binary popup, points to main table for pure and binary popup.
  - recordedit page: Each action taken on a foreign key picker row. Includes the select/set all input actions and the foreign key popup dialog actions. `referrer` is the main entity for the create/edit form.
  - facet "show more" (all 3 apps): In each case, the "Show More" dialog will be for a specific facet. `referrer` pertains to the main table of the page "show more" was clicked on.

| App                                | Description (button name)  | Action                      | Extra                 | Notes                                                                                                                          | Change                        |
|------------------------------------|----------------------------|-----------------------------|-----------------------|--------------------------------------------------------------------------------------------------------------------------------|-------------------------------|
| record/recordset                   | delete clicked             | delete/intend               | facet                 | Delete was clicked from the main record page and confirm delete was shown. (use cid to determine app)                          |                               |
| record/recordset                   | confirm delete cancelled   | delete/cancel               | facet                 | User closed the confirm delete modal without deleting (facet attribute included when record app)                               |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| recordset/record                   | export dropdown            | export/open                 |                       | Dropdown was opened (record request will include extra attribute, facet)                                                       |                               |
| recordset                          | copy permalink             | permalink/lclick            |                       | User left clicked on permalink button (copies link to clipboard)                                                               |                               |
| recordset                          | permalink                  | permalink/rclick            |                       | User right clicked on permalink button and opened the context menu (we can't track which action was clicked)                   |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| record                             | show empty sections        | show-empty/show             |                       | "Show empty sections" button clicked in submenu bar                                                                            |                               |
| record                             | hide empty sections        | show-empty/hide             |                       | "Hide empty sections" button clicked in submenu bar                                                                            |                               |
| record                             | share popup                | share                       |                       | Share dialog was opened                                                                                                        |                               |
| record                             | copy live link             | share/live                  |                       | Live link was copied to clipboard                                                                                              |                               |
| record                             | copy version link          | share/version               |                       | Versioned link was copied to clipboard                                                                                         |                               |
| record                             | cite, download bibtex      | cite/bibtex                 |                       | Bibtex citation downloaded                                                                                                     |                               |
| record                             | Scroll top clicked         | scroll-top                  |                       | Bottom right, "Scroll to top" button clicked                                                                                   |                               |
| record                             | ToC panel open             | toc/show                    |                       | "Show side panel" button clicked                                                                                               |                               |
| record                             | ToC panel collapse         | toc/hide                    |                       | "Hide panel" button clicked                                                                                                    |                               |
| record                             | Scroll top clicked         | toc/scroll-top              |                       | first heading in Table of contents clicked (Summary)                                                                           |                               |
| record                             | ToC panel options selected | toc/scroll-to               |                       | Related table heading clicked in Table of contents                                                                             |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| record                             | toggle related table open  | related/open                |                       | Related table section toggled open                                                                                             |                               |
| record                             | toggle related table close | related/close               |                       | Related table section toggled close                                                                                            |                               |
| record                             | items per page dropdown    | related/page-size           |                       | Dropdown was opened for related table. Selecting a page size will trigger a read request.                                      |                               |
| record                             | Table mode                 | related/display/table       |                       | User changed display format to show table display (user does not have permission to edit)                                      |                               |
| record                             | Custom mode                | related/display/mkdn        |                       | User changed display format to show markdown display (for both edit and not edit permission)                                   |                               |
| record                             | Edit mode                  | related/display/edit        |                       | User changed display format to show table display (user has permission to edit)                                                |                               |
| record                             | row delete clicked         | related/delete/intend       | facet                 | Delete was clicked from related table and confirm delete was shown (for both edit and not edit permission)                     |                               |
| record                             | confirm delete cancelled   | related/delete/cancel       | facet                 | User closed the confirm delete modal without deleting                                                                          |                               |
| record                             | row unlink clicked         | related/unlink/intend       | facet                 | Unlink was clicked from related table and confirm unlink was shown (for both edit and not edit permission)                     |                               |
| record                             | confirm unlink cancelled   | related/unlink/cancel       | facet                 | User closed the confirm unlink modal without unlinking                                                                         |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| record                             | items per page dropdown    | inline/page-size            |                       | Dropdown was opened for inline related table. Selecting a page size will trigger a read request.                               |                               |
| record                             | Table mode                 | inline/display/table        |                       | User changed display format to show table display (user does not have permission to edit)                                      |                               |
| record                             | Custom mode                | inline/display/mkdn         |                       | User changed display format to show markdown display (for both edit and not edit permission)                                   |                               |
| record                             | Edit mode                  | inline/display/edit         |                       | User changed display format to show table display (user has permission to edit)                                                |                               |
| record                             | row delete clicked         | inline/delete/intend        | facet                 | Delete was clicked from inline related table and confirm delete was shown (for both edit and not edit permission)              |                               |
| record                             | confirm delete cancelled   | inline/delete/cancel        | facet                 | User closed the confirm delete modal without deleting                                                                          |                               |
| record                             | row unlink clicked         | inline/unlink/intend        | facet                 | Unlink was clicked from inline related table and confirm unlink was shown (for both edit and not edit permission)              |                               |
| record                             | confirm unlink cancelled   | inline/unlink/cancel        | facet                 | User closed the confirm unlink modal without unlinking                                                                         |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| recordedit                         | Add 1 record               | create/clone                |                       | User cloned 1 form                                                                                                             |                               |
| recordedit                         | Add x records              | create/clone-x              | x                     | User cloned more than 1 form                                                                                                   |                               |
| recordedit                         | remove form                | create/remove               |                       | 1 form was removed from being created                                                                                          |                               |
| recordedit                         | open set all               | create/set-all/open         | column                | set all row opened, referrer used for FK rows (pencil icon button)                                                             |                               |
| recordedit                         | close set all              | create/set-all/close        | column                | set all row closed, referrer used for FK rows (chevron up icon button)                                                         |                               |
| recordedit                         | cancel set all             | create/set-all/cancel       | column                | set all row closed, referrer used for FK rows ("Cancel" button)                                                                |                               |
| recordedit                         | apply set all              | create/set-all/apply        | column                | set all row applied, referrer used for FK rows ("Apply All" button)                                                            |                               |
| recordedit                         | clear all                  | create/set-all/clear        | column                | set all row cleared, referrer used for FK rows ("Clear All" button)                                                            |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| recordedit                         | remove form                | update/remove               | facet                 | 1 form was removed from being updated                                                                                          |                               |
| recordedit                         | open set all               | update/set-all/open         | column                | set all row opened, referrer used for FK rows (pencil icon button)                                                             |                               |
| recordedit                         | close set all              | update/set-all/close        | column                | set all row closed, referrer used for FK rows (chevron up icon button)                                                         |                               |
| recordedit                         | cancel set all             | update/set-all/cancel       | column                | set all row closed, referrer used for FK rows ("Cancel" button)                                                                |                               |
| recordedit                         | apply set all              | update/set-all/apply        | column                | set all row applied, referrer used for FK rows ("Apply All" button)                                                            |                               |
| recordedit                         | clear all                  | update/set-all/clear        | column                | set all row cleared, referrer used for FK rows ("Clear All" button)                                                            |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| navbar                             | branding link clicked      | branding                    |                       | branding logo in the top left clicked                                                                                          |                               |
| navbar                             | user dropdown menu         | user                        |                       | user dropdown menu was opened (no `catalog` or `schema_table`)                                                                 |                               |
| navbar                             | My profile                 | user/profile                |                       | My Profile button in top right dropdown to view profile details (no `catalog` or `schema_table`)                               |                               |
| navbar                             | Navbar menu dropdown       | menu/submenu                | name                  | Navbar dropdown menu was opened (applies to top level and each nested sub menu)                                                |                               |
| navbar                             | Navbar menu internal link  | menu/internal               | name                  | Navbar menu option was selected that redirects to static/internal resource (same domain)                                       |                               |
| navbar                             | Navbar menu external link  | menu/external               | name                  | Navbar menu option was selected that redirects to an external resource (different domain)                                      |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| recordset                          | facet panel open           | panel/show                  |                       | "Show filter panel" button in recordset app clicked                                                                            |                               |
| recordset                          | facet panel close          | panel/hide                  |                       | "Hide panel" button in recordset app clicked                                                                                   |                               |
| recordset                          | items per page dropdown    | page-size                   |                       | Dropdown was opened. Selecting a page size will trigger a read request                                                         |                               |
| recordset                          | items per page dropdown    | facet/page-size             |                       | In facet "show more" popup, dropdown was opened. Selecting a page size will trigger a read request                             |                               |
| recordset                          | All on page                | facet/all                   |                       | In facet "show more" popup, "All on page" button clicked                                                                       |                               |
| recordset                          | None on page               | facet/none                  |                       | In facet "show more" popup, "None on page" button clicked                                                                      |                               |
| recordset                          | Reset selection            | facet/reset                 |                       | In facet "show more" popup, "Reset selection" button clicked to remove selections                                              |                               |
| recordset                          | Modal closed               | facet/cancel                |                       | In facet "show more" popup, modal closed with no selection made                                                                |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| record                             | facet panel open           | pb/panel/show               |                       | In pure & binary "Add record" popup, "Show filter panel" button clicked                                                        |                               |
| record                             | facet panel close          | pb/panel/hide               |                       | In pure & binary "Add record" popup, "Hide panel" button clicked                                                               |                               |
| record                             | items per page dropdown    | pb/page-size                |                       | In pure & binary "Add record" popup, dropdown was opened. Selecting a page size will trigger a read request                    |                               |
| record                             | All on page                | pb/all                      |                       | In pure & binary "Add record" popup, "All on page" button clicked                                                              |                               |
| record                             | None on page               | pb/none                     |                       | In pure & binary "Add record" popup, "None on page" button clicked                                                             |                               |
| record                             | Reset selection            | pb/reset                    |                       | In pure & binary "Add record" popup, "Reset selection" button clicked to remove selections                                     |                               |
| record                             | Modal closed               | pb/cancel                   |                       | In pure & binary "Add record" popup, modal closed with no selection made                                                       |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| record                             | items per page dropdown    | pb/facet/page-size          |                       | In pure & binary "Add record" popup, then in facet "show more" popup, dropdown was opened                                      |                               |
| record                             | All on page                | pb/facet/all                |                       | In pure & binary "Add record" popup, then in facet "show more" popup, "All on page" button clicked                             |                               |
| record                             | None on page               | pb/facet/none               |                       | In pure & binary "Add record" popup, then in facet "show more" popup, "None on page" button clicked                            |                               |
| record                             | Reset selection            | pb/facet/reset              |                       | In pure & binary "Add record" popup, then in facet "show more" popup, "Reset selection" button clicked to remove selections    |                               |
| record                             | Modal closed               | pb/facet/cancel             |                       | In pure & binary "Add record" popup, then in facet "show more" popup, modal closed with no selection made                      |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| recordedit                         | facet panel open           | fk/panel/show               |                       | In foreign key popup, "Show filter panel" button clicked                                                                       |                               |
| recordedit                         | facet panel closed         | fk/panel/hide               |                       | In foreign key popup, "Hide panel" button clicked                                                                              |                               |
| recordedit                         | items per page dropdown    | fk/page-size                |                       | In foreign key popup, dropdown was opened. Selecting a page size will trigger a read request                                   |                               |
| recordedit                         | Modal closed               | fk/cancel                   |                       | In foreign key popup, modal closed with no selection made                                                                      |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |
| recordedit                         | items per page dropdown    | fk/facet/page-size          |                       | In foreign key popup, then in facet "show more" popup, dropdown was opened. Selecting a page size will trigger a read request  |                               |
| recordedit                         | All on page                | fk/facet/all                |                       | In foreign key popup, then in facet "show more" popup, "All on page" button clicked                                            |                               |
| recordedit                         | None on page               | fk/facet/none               |                       | In foreign key popup, then in facet "show more" popup, "None on page" button clicked                                           |                               |
| recordedit                         | Reset selection            | fk/facet/reset              |                       | In foreign key popup, then in facet "show more" popup, "Reset selection" button clicked to remove all selections               |                               |
| recordedit                         | Modal closed               | fk/facet/cancel             |                       | In foreign key popup, then in facet "show more" popup, modal closed with no selection made                                     |                               |
|                   &ensp;           |                            |                             |                       |                                                                                                                                |                               |


## Error Log

Currently we're only logging terminal errors (we might want to change that to log 5xx errors too). To find the errors in log, you can search for `terminal_error` path. This is what a error log would look like:

```
{
   e: 1,
   message: "ERROR MESSAGE",
   name: "ERROR TITLE"
}
```


## Truncation

The object that we want to log might be lengthy. So we should truncate this object if it's exceeding the maximum length (we're currently limiting it to 6500). An object with `t:1` indicates that some attributes have been truncated.
The truncation is done based on a set priority. We keep adding more and more attributes and as soon as we hit the limit, we're going to return that object. Attributes are added in the following order (attribute one has more priority over the next and so on):
 - cid, pid, wid, schema_table, catalog, cfacet, cqp, ppid, pcid
 - template
 - referrer
 - source
 - column
 - cfacet_str
 - cfacet_path
 - filter
 - facet

For example, assume that we were trying to send the following object and it's lengthy.

```
{
    "cid": <value>, "pid": <value>, "wid": <value>,
    "catalog": <value>, "schema_table": <value>,
    "referrer": {"schema_table": <value>, "facet": <referrer-facet-obj>},
    "facet": <facet-obj>,
    "source": <source-obj>
}
```

We're going to include `cid`, `pid`, `wid`, `catalog`, `schema_table`, and `t` (with value 1) first. Then we're going to go based on the priority list and try to add each attribute. So we're going to add `referrer`'s `facet` step by step. As soon as we hit the limit, we're going to return that partial object. otherwise we're going to continue to `source` and then `facet`.



## Analysis

In this section we're going to mention some of the patterns that you can use to process the logs.

#### Asset Download & CSV Default Export

Since the asset download and also the default CSV export requests are simple redirects to the location, we cannot pass `dcctx` to the header. Instead, we're sending these query parameters:

- `uinit=1`: To signal that this is chaise/ermrestjs that has generated the link.
- `cid`: The `cid` of the app that user found the link from.


The following url patterns are what's unique about each of these requests and you can use for your analysis:

- Asset download: `?limit=none&accept=csv&uinit=1&cid=`

- CSV default export: `uinit=1&cid=`

## PCID list

The following is the list of `PCID`'s that will be present on main entity requests in the chaise apps. `CID` will always represent what app the request was made from, `PCID` will represent what app the user navigated from when the main entity request was triggered.

 - `record`
 - `recordset`
 - `recordedit`
 - `navbar`
 - `navbar/record`
 - `navbar/recordset`
 - `navbar/recordedit`

If the user clicked on a link in the navbar, the `PCID` will properly denote what app the user came from that had the navbar present. A static page that uses the navbar app, will set the `PCID` as `navbar`. Otherwise the appname will be appended (i.e.   `navbar/<appname>`). This is true for the [deriva-webapps](https://github.com/informatics-isi-edu/deriva-webapps/wiki/Logging-in-WebApps#pcid-list) as well.


## Change Log

### 10/??/19

#### Commit Links
 - (pending, changes in branch)

##### Changed
 - changed model/catalog -> model/snaptime

##### Added
 - [Button Action List](#button-action-list)

### 07/16/19

##### Commit Links
 - [chaise](https://github.com/informatics-isi-edu/chaise/commit/65de409b3229533be76a1537d55a83a9bec84bb3)

###### Added
 - Added `pcid` and `ppid` to navbar links that are for the same origin/host.

### 07/12/19

##### Commit Links
  - [ermrestjs](https://github.com/informatics-isi-edu/ermrestjs/commit/df91573fac7ae59eee0e6bf73f7023de899de3d4)

###### Added
  - Added specific action for the `recordset/main/<ANY_SUBACTION>/correct-page`. This action will indicate that users went to a page with `@before` in url AND there is less data than limit implies (beginning of set) OR we got the right set of data but there's no previous set (beginning of set), and then chaise tried again without `@before` in url. This action is used for the second request that is trying the main request again without `@before`.

### 05/06/19

###### Commit Links
 - [chaise](https://github.com/informatics-isi-edu/chaise/commit/8dc53a5e61e3b32dfae3279bb000baf9b2f51fb1)

###### Added
  - We are going to send `cid`, `wid`, and `pid` headers with authen requests from now on.

### 04/18/19

###### Commit Links
 - [chaise](https://github.com/informatics-isi-edu/chaise/commit/777febb1811620522344314e383238ece936047f)
 - [ermrestjs](https://github.com/informatics-isi-edu/ermrestjs/commit/af7ac83359647e232dbb5385ec25be7add7dc89e)

###### Changed
- Changed the action for removing related entity rows from `delete/recordset/related` to `delete/record/related`.
- Fixed a bug that would cause record load requests to be reported as update.
- Fixed the issue of reporting both load and update requests of record page as `record/main`. Now they are being logged with proper action.
  - Impact: We cannot determine the number of record page loads prior to this fix. This only affects deployments that allow their users to create new records since the update request would only fire if the user updates any of the related entities.
- `recordset/export` was used as action for export from both record and recordset which is changed to `export`.
- Changed the `template` object that is reported with `export` action to only include the `displayname` and `type`.
- Instead of logging the whole template document in the `export` action, we're just going to include `displayname` and `type`.
  ```
  {
    "action": "export",
    "template": {
        "displayname": "sample template",
        "type": "BAG"
    }
  }
  ```
- Fixed the action of scalar column requests.
- Changed the `recordedit/default` action to `default`.

###### Added
- Added proper `dcctx` logging to viewer app.
- `ppid` and `pcid` has been added to the main request of each app which shows the parent `pid` and `cid`.
- New actions have been attached to schema (`"model/schema"`) and catalog (`"model/catalog"`) requests.
- `catalog` has been added to all the requests.
- `column` has been added to requests for getting a scalar facet data.
-  If there are preselected facets, in entity mode we have to get the row-name corresponding to the selected value. Customized action (`recordset/facet/init`) has been added for this request.
- Added proper action `recordset/facet/histogram` to the request for getting buckets of a range picker facet.
- Added `cfacet`, `cfacet_str`, and `cfacet_path`.
- Added `cqp` attribute to track urls that are using `?` (query parameter) instead of `#` (hash fragment).

### 03/08/19

###### Commit Links
 - [chaise](https://github.com/informatics-isi-edu/chaise/commit/05108d07e37c1579b28ccfc58916db486f379005)

###### Changed
 - We realized that the first request of adding pure and binary is not using the correct action. It was using the `recordset/main/load`. We changed it to use the appropriate `pre-create/prefill/association` action with `referred` information.
