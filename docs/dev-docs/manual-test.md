# Manual Tests

## General
- Navigate to app with user not logged in
   - make sure alert to login shows up (may have local storage set, so clear it first)
## Login link for 404 error
- Navigate to app with user not logged in
   - An error pop-up should appear with login link and ask the user to check the availability after logging in.
        > No matching record found for the given filter or facet.
           You are not authorized to perform this action. [Please login]() to continue.

## Record (url to page pending..)
- Making sure markdown displayed entities show properly
- Single lists don't have a bullet before the only item
- ToC scroll is working appropriately.
   - scrolls related tables
   - top scrolls to top
   - Main scrolls to top

## Recordset - Tooltip on Column Headers

### Auto placement of tooltips
- By default, the tooltips on column headers should appear on top-center
- For the rightmost column if the tooltip text(comment) is too long then the tooltip should be placed on top-right
[(Right-most-column-tooltip)](https://dev.isrd.isi.edu/~dsingh/wiki-images/right-most-column-tooltip.png)
- Similarly, for other columns too if the tooltip text is long and they appear on the left or right edge of the window then their tooltip should be placed on top-left or top-right respectively
([Default tooltip](https://dev.isrd.isi.edu/~dsingh/wiki-images/top-center-arrow.png),
[Long text on the leftmost column](https://dev.isrd.isi.edu/~dsingh/wiki-images/top-left-arrow.png),
[Long text on the rightmost column](https://dev.isrd.isi.edu/~dsingh/wiki-images/top-right-arrow.png))

- Make sure the tooltip does not flicker or overlap the header text if the text is too long.

### Test Setup
- Run the "make testmanually" command in Chaise. This will set up a recordset table named Accommodation with long tooltips on the last column (Number of Rooms) and the "Operation Since" column.
- Manually check the position of the tooltips by hovering over these columns and resizing the window so that these columns are on the window margins.
- End the test spec by pressing ^D in the terminal
- The test spec is present at "chaise/test/manual/specs/recordset.spec.js"
- The tooltip text can be changed at "chaise/test/manual/data_setup/schema/product-recordset.json"

## Recordset - auto truncation of cell content
- by default, `maxRecordsetRowHeight` is set to 160 pixels
- this causes cells with content larger than the default height to be truncated and show "...more" text

### Test Setup
- Run the "make testmanually" command in Chaise. This will set up a recordset table named Accommodation with long text in 2 columns, "Summary" and "Description"
- Maunually check that those 2 columns are truncated and have the "...more" hyperlink. Click that and make sure the column expands to show the full text. Click "...less" and make sure it properly truncates again.
- End the test spec by pressing ^D in the terminal
- The test spec is present at "chaise/test/manual/specs/recordset.spec.js"
- The tooltip text can be changed at "chaise/test/manual/data_setup/schema/product-recordset.json"


## Recordset with Faceting Functionality

### UI/UX Correctness
- Making sure facets open smoothly and border is highlighted when focused.
- clicking facet name in chiclets focuses facet.
- Spinners are showing/hiding properly.
- The height of facet should remain fixed upon changing the data.
- Left panel should be draggable (should adjust the width accordingly).
- Left panel should be scrollable with scrollbar present in that DOM element (all places with faceting)
- pagination buttons should be visible.
- Selected are always visible in facet (not in show more)
- No value vs. empty in tables
- show more is showing the same list.

### Data Correctness
- The last facet that you have changed should not be updated.
- Verify that min/max are updated appropriately.
- Make sure create/download/permalink work with and without faceting.
- Make sure edit/delete work with and without faceting.
- Changing filter, should remove the pagination.
- Main Search: add search. change search. clear search. Search + facet.
- Facet search:
  - add search, change another facet. Then go to show more.
  - search, select, change search and make sure that selected is shown.
- Range picker:
  - User should not be able to add duplicate filters.
  - User can submit just min or just max (should be in e2e).
  - Make sure integer/float/date/timestamp validators are working properly.
    - min and max values. validate the type. min should be less than max.
    - Removing the value, should remove the error message.
- Make sure count is updated.
- System columns:
  - RID is integer scalar (range)
  - RCB, RMB are text scalar (choice)
  - RCT, RMT are timestamp scalar (range)

### Flow Control

#### Expected Behaviour

The recordset page with faceting is written in a way that it won't block users from generating new requests (via select/deselecting facets, add/remove search, etc.) but it will only issue maximum of four requests at a time. The way it works is that it will keep generating new requests as long as we have empty slot. When a result comes back, if it is a stale result (it is based on previous state of the page) we will generate another new request. This will keep continuing untill every piece of the page has been updated.

Recordset will generate request to ermrset for different sections of the page. The following is a priority list of these sections:

1. Main table result.
2. Each facet data, from top to bottom.
3. Total count of values in the database.

This means that we will only update the "total count", if we got the updated data for all the facets and main table.

#### Before Testing

1. For testing this feature, make sure that you have `debug:true` in your `chaise-config.js` to be able to look at the logs that we generate (You can also use the `network` tab in browsers to look at the actual ermrest requests).

    - If you're using chrome make sure that it's showing [verbose](https://dev.isrd.isi.edu/~ashafaei/wiki-images/verbose.png) logs.

2. It's better if you throttle your network speed ([chrome](https://developers.google.com/web/tools/chrome-devtools/network-performance/network-conditions)/[firefox](https://blog.nightly.mozilla.org/2016/11/07/simulate-slow-connections-with-the-network-throttling-tool/)) to simulate slower networks and make the flow-control more visible.


#### Test Scenarios

Based on these descriptions, in each scenario you should confirm the following:


1. We're not generating more than 4 requests at a time.
2. We're not showing stale data to the users.
3. Main result has priority over facets.
4. Priority of facets are determined based on their position in the page (top to bottom).
5. We're updating count after updating all the facets.
6. We're not blocking users from generating requests and are sending them as soon as user requested.

You can test this feature on any data that you feel more comfortable with, but make sure that you are testing all of the following scenarios:

1. When page has more than 4 facets open.
2. Combination of search on the main page, facets, and search on a facet.
3. Combination of filters on different facets.

# Testing file upload edge cases
In [ErmrestDataUtils](https://github.com/informatics-isi-edu/ErmrestDataUtils), there is a `testScripts` folder. navigate to that folder and run `node createUpload.js`. This will create a temporary catalog which includes only the file upload table to test against.

## Test priviledges
 - Verify that files uploaded by another user that you don't have permission to read, will properly create a new version of that file in hatrac.
   1. Need to have 2 user accounts. One cannot be a part of any of the globus groups that we rely on to set blanket permissions (`isrd-staff`, `isrd-testers`).
      - `curl -H 'cookie: webauthn=<admin-cookie-here>' -X PUT -H "Content-Type: application/json" -d '[<user-2-globus-id>]' -i "https://dev.isrd.isi.edu/hatrac/js;acl/subtree-create"`
   2. User 1 creates file1 in hatrac
   3. user 2 doesn't have permission to update that object in hatrac
   4. user 2 tries to upload the same exact file to the same namespace in hatrac
      - should get 403
   5. change permissions on hatrac obj to include update for user 2
      - `curl -H 'cookie: webauthn=<admin-cookie-here>' -X PUT -H "Content-Type: application/json" -d '[<user-2-globus-id>]' -i "https://dev.isrd.isi.edu/hatrac/js/chaise/<timestamp_txt-value>/<id-value>/<object-id>;acl/update"`
   6. user 2 tries to upload same exact file to the same namespace again
   7. navigate to hatrac folder and verify a new version was created
      - ssh to `dev.isrd.isi.edu`
      - `cd /var/www/hatrac/js/chaise/<timestamp_txt-value>/<id-value>/`
      - `ls -al` to list all contents and file sizes

# Testing Session Timed out (and different user) data mutation events
The UX currently doesn't update the user when their session state has changed. In some cases a user could log in and navigate to a page that allows create or update, then have their log in status change prior to submitting the data to be mutated. They could have had their session time out (treated as an anonymous user) or changed to a  different user entirely. This pertains to create/update in `recordedit`, pure and binary add in `record`, and anywhere that we show tables with shows thatcan be deleted.

## Testing workflow
For each of the pages listed below, the following should be done to verify that the appropriate errors occur and dialogs are shown: 

 - Navigate to a creation form that requires a user to be logged in ([Example](https://dev.rebuildingakidney.org/chaise/recordedit/#2/RNASeq:Study))
   - fill in the required fields
   - open another tab and log out of the application
   - go back to original tab and submit the data
   - a login dialog should be shown instead of an error
   - login to a **different** user
   - now the "Unexpected Change of Login Status" error dialog should be shown
   - in another tab, log out again
   - go back to the original tab and click "continue" as if the login state was fixed
   - a different error dialog with the same title, "Unexpected Change of Login Status", should be shown
   - click the "login" button and log in as the orignial user
   - the data should submit properly after that

 - Navigate to a record page that requires a user to be logged in to mutate one of the related entities ([Example](https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Gene_Expression:Specimen/RID=N-GXA4))
   - click "add record" for a related entity that is pure and binary. The "Anatomical Source" related entity should be pure and binary
   - select 1 or more rows to link to the specimen
   - open another tab and log out of the application
   - then login to a **different** user
   - go back to the original tab and submit the selected rows
   - the "Unexpected Change of Login Status" error dialog should be shown with a continue button
   - in another tab, log out again and log back in as the original user
   - go back to the original tab and click "continue" once the login state has been resolved
   - the rows should be properly added after clicking continue
   
 - Navigate to a page with rows that can be deleted ([Example](https://dev.rebuildingakidney.org/~jchudy/chaise/recordset/#2/Gene_Expression:Specimen/))
   - open another tab and log out of the application
   - go back to the original tab and delete one of the rows
   - a login dialog should be shown instead of an error
   - login to a **different** user
   - now the "Unexpected Change of Login Status" error dialog should be shown
   - in another tab, log out again and log back in as the original user
   - go back to the original tab and click "continue" once the login state has been resolved
   - either the confirm dialog will show, or the row will be deleted
     - hopefully you followed the link above and removed a row on dev :)

# Testing row level security

## Testing with one entity
Follow this [link](https://dev.gpcrconsortium.org/chaise/recordedit/#1/assets:cpm/id=30?invalidate=5841355026245247) and submit the page. You should not be able to change that entity. You should be presented with an error message saying: `Editing records for table: cpm is not allowed.`

## Testing with multiple entities.
Follow this [link](https://dev.gpcrconsortium.org/chaise/recordedit/#1/assets:cpm@sort(last_modified_timestamp::desc::,id)?limit=25) and submit the page. You should be able to change entities with Site name as USC. The 2 entities associated with iHuman shouldn't be editable.

What should appear is a page of results with multiple tables. The first table should be those entities that have successfully been updated, whereas the second table presents the data that couldn't be updated. The first table should have entities with the `Site name` `USC`. The second table should have entities with the `Site name` `iHuman`.

# Testing UX that relies on data or model change events

## Share dialog stale warning 
The share dialog has an alert warning that shows when the user is viewing stale data. This can happen if the current record's values are updated after you laoded the record page or the model itself has changed. The data changed event is test in the e2e tests. The model change event requires manual testing. This can be tested on any table on `dev.isrd` as long as you can modify that table's model. [Here](https://github.com/informatics-isi-edu/chaise/wiki/Ermrest-Howto-(set-ACL,-cookies)#add-column-to-existing-table) is a template for the curl command.

# Testing assets

## asset hosted on www (different origin)
When an asset is hosted on a differet origin, a modal dialog stating you will be redirected will be shown. Follow [this link](https://dev.gudmap.org/chaise/record/#2/Common:Publication/RID=17-EZ6C) to see an asset on a different origin to test this functionality.

## asset with permission to access required
When an asset requires login, it should have the proper class attached to it. This is done automatically for the default asset presentation in ermrestJS. The class is called `asset-permission`. Follow [this link](https://dev.rebuildingakidney.org/chaise/record/#2/RNASeq:File/RID=16-1YDJ) and try to download the asset without being logged in. You should see a modal dialog that looks like an error that suggests you should login. After logging in, try downloading the asset again with a user with the proper permission to view it. Then try the same with a user who can't view the asset and verify the proper 403 modal is shown instead.
