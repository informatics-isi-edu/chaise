# Release Notes

This document is a summary of code changes in Chaise. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Fixed]`: bug fixes.
  - `[No changes]` means that Chaise hasn't been changed in the described duration.

# 1//24
  - [Fixed] Recordset might not display all content with "show more" not displayed with images that take a long time to load
  - [Improved] Recordedit app performance improved
  - [Added] Show a spinner when adding more forms in recordedit app using the clone button
  - [Changed] Set all input in recordedit app to allow for selecting some (or all) inputs to set a value for

# 9/12/23
  - [Fixed] Enter does not submit recordedit form
  - [Added] Typeahead search dropdown added to recordedit app for foreign key inputs
  - [Improved] Tooltip support in chaise improved to properly allow for markdown content
  - [Added] Iframe inputs in recordedit app

# 7/24/23
  - [Improved] Record app performance improved
  - [Added] Saved Queries feature added to Recordset.

# 6/27/23
  - [Chaned] Change behavior of chaise-config properties, ermrestLocation, defaultCatalog, and defaultTables.

# 4/5/23
  - [Changed] Recordedit app migrated to ReactJS. AngularJS version of both removed.

# 2/1/23
  - [Changed] Limit the number of displayed selected items in facet panel

# 12/15/22
  - [Fixed] Fixed a bug when using the set all input to clear all foreign keys wouldn't clear data submitted to the database.
  - [Fixed] Login flow was not working properly for some edge cases after ReactJS migration of Authn Service.

# 11/17/22
  - [Changed] Record and Help apps migrated to ReactJS. AngularJS version of both removed.
  - [Changed] Navbar and Login apps migrated to ReactJS. ANgularJS version of both removed.
  - [Added] Bulk delete button added to recordedit.

# 10/31/22
  - [No changes]

# 9/12/22
  - [Changed] Replaced use of glyphicons with fontawesome.

# 8/22/22
  - [Added] Tooltips have displayname in code blocks for better viewing.
  - [Changed] Recordset app migrated to ReactJS. AngularJS version of recordset removed.

# 7/31/22
  - [No changes]

# 6/29/22
  - [Improved] Precision for float and timestamp facets.
  - [Fixed] Links in navbar prepended with `mailto` were prepended with `unsafe`.

# 5/26/22
  - [Fixed] Bug in viewer app that didn't save the pseudoColor configuration changes.
  - [Changed] Make `install` target changed to `deploy`.

# 4/21/22
  - [Added] Dynamic ACL support to annotation list in viewer app.
  - [Added] Chaise config property, `facetPanelDisplay`, added to give control over which context the facet panel should be open or closed.
  - [Improved] Session information stored in templating improved to communnicate if it's an ID or globus group.
  - [Changed] Moment and protactor versions updated.
  - [Fixed] Handle empty color input like other inputs.

# 3/10/22
  - [Fixed] An issue with empty related tables not showing properly on page load when a user could add to them.

# 2/16/22
  - [Added] Pure and Binary batch unlink added to record app.
  - [Changed] Chaise uses `link` and `unlink` for pure and binary assocation functions.

# 1/14/22
  - [Added] Logging for saved queries.
  - [Fixed] Bug in navbar click events that prevented new tabs from being opened via middle mouse click.

# 12/9/21
  - [Improved] Build process with make and github actions.
  - [Added] Add record button disabled if key information not set. Not null filter checked in foreign key popup and add pure and binary.

# 11/30/21
  - [No changes]

# 10/20/21
  - [Added] Chaise config property `loggedInMenu` support for customizing the login dropdown.
  - [Fixed] A bug that would not allow the facet modal to be submitted with no options selected.
  - [Added] Chaise config property `navbarBanner` support for customizing banners above/below the navbar.
  - [Improved] Saved Query functionality improved including default values and checking for existing saved queries.

# 9/17/21
  - [Added] Prompt user for login if `promptlogin` query parameter is included in the url.
  - [Fixed] A bug with the side panel resizing wouldn't cause the top panel to also resize.

# 8/27/21
  - [Improved] Display of unordered list in main section of record app.
  - [Added] Horizontal scrollbar to the top of recordset tables (all apps).
  - [Changed] Row count will be hidden if property is defiend in display annotation.
  - [Improved] Export dropdown improved with heuristics if the content is malformed or empty.
  - [Added] Support for chaise config property, `termsAndConditionsConfig`.
  - [Added] Support to consume augmented facet blobs.
  - [Added] Saved queries and favorites added.
  - [Fixed] Bug in favorites that caused them to go out of sync with show more.

# 7/22/21
  - [Fixed] Bug with dynamic ACLs not using `trs` and `tcrs` properly.
  - [Added] Dataset JSON-LD added to <head> tag.

# 6/23/21
  - [Improved] Navbar submenus will open left instead of right if they would go off screen.
  - [Fixed] Navbar being placed behind the login modal popup.

# 5/27/21
  - [Fixed] Responsive button in navbar fixed to better show navbar vertically on smaller displays.

# 4/29/21
  - [Improved] Dynamic ACL support added to each app to better communicate user permissions.
  - [Added] Chaise config property `showWriterEmptyRelatedOnLoad` added to show empty related tables to writer on record page load.

# 3/18/21
  - [Added] Viewer app lets user change the default z-index to show when image is loaded.
  - [Fixed] A bug in recordedit that submitted improper value for float columns when the value was cleared.
  - [Improved] Behavior of links in viewer app improved when in an iframe.

# 2/19/21
  - [Changed] Github actions used instead of `travis-ci` for automated testing.
  - [Added] Fullscreen button for iframes that opens the content of the iframe in a new tab.
  - [Added] Support to hide column headers in record app.
  - [Added] Viewer app allows for jumping to specific z0-index of the image.

# 1/28/21
  - [Added] Multi-Z support added to viewer app.
  - [Added] Proper configuration mechanism added to viewer app.
  - [Added] Class added to make iframes more responsive.

# 12/9/20
  - [Added] Color picker input added to Recordedit.
  - [Improved] Boolean input shows values from preformat annotation instead of just `true` or `false`.
  - [Improved] RID search input will check if the RID exists before trying to navigate.
  - [Added] Viewer annotation help page added.
  - [Improved] Text used in head titles (browser tabs) includes more descriptive information.
 
# 11/30/20
  - [Added] Chaise config property `shareCiteAcls`.
  - [Improve] Query parameter support in viewer app that are sent to OSD viewer.
  - [Changed] Resultset view of Recordedit uses `entryCompact` context and removed pseudocolumns from that view.
  - [Added] Dynamic multi channel support to viewer app.
  - [Improved] Viewer app configuration updated to fall back to certain columnns if they are missing from the query parameters.

# 10/22/20
  - [Improved] Navbar menu to allow for markdown names.

# 9/28/20
  - [Improved] Domain filter support to allow for `cfacets` syntax.
  - [Added] Inline tooltip for recordset app added.
  - [Improved] Navbar dropdown menus will scroll if the content does not fit in the viewport.

# 8/31/20
  - [Improved] Print layout for record page.
  - [Improved] The UI for viewer app has some more improvements. Communication with OSD viewer has been made more robust.
  - [Changed] Deprecated the following chaise-config properties: catalog, schema, layout, recordResource, facetPolicy, feedbackURL, helpURL, showBadgeCounts, tableThreshold, showAllAttributes, maxColumns, showUnfilteredResults, searchPageSize
  - [Improved] Logging for "View" button in action column.
  - [Added] Configuration for headers added to the dropdowns in navbar menu.
  - [Added] Proper log support for viewer app.
  - [Fixed] Bug fixes in viewer regarding the scroll, panel button, and spinner wrongly showing
  - [Added] RID search input in navbar
  - [Fixed] Bug in recordedit where foreign key inputs was ignoring falsy values when they were valid (`0` and `false` for example).

# 7/27/20
  - [Improved] The annotation feature of viewer app was improved to allow for further manipulation of the annotations.

# 6/23/20
  - [Changed] Viewer app build process.
  - [Improved] Test cases based on more changes made to ermrestJS.

# 5/27/20
  - [Changed] Repeater clauses in HTML no longer use track by so ellipsis logic is rerendered each time new data is received.
  - [Changed] Updated the configuration in one of the test configurations to properly test when then ellipsis feature is off.
  - [Fixed] Improper permissions check for copy button.
  - [Improved] Make process for building each app.

# 4/30/20
  - [Improved] Improved the workflow of creating and editing data after a timeout or logout occurs
  - [Fixed] Channel list was not displaying properly for Open Seadragon viewer.
  - [Fixed] Odd behavior when copying rows in recordedit related to file pickers.
  - [Fixed] Incorrect links for view details and edit links in recordset table after searching or paging.
  - [Improved] The loading of navbar app to be smoother and reduced the number of extra dependencies being loaded.

# 3/24/20
  - [Fixed] Sorting in page limit dropdown to have values in correct order when a custom page limit is defined
  - [Fixed] Bug that caused the select all button to be clipped by the table row border when the column text is too long
  - [Added] Pseudo-column support in templating environment for record page for visible-columns, visible-foreign-keys, and citation annotations
  - [Improved] Flow control logic for record app including adding an active list which allows for some pseudo data to be deleted until other requests return first.
  - [Fixed] Bug in ellipsis logic pertaining to aggregate values.

# 2/28/20
  - [Improved] logging in chaise was improved to reflect more detailed information about the requests sent to the database and html interactions made by the user
  - [Improved] truncation for text/images in table cells works more consistently now
  - [Changed] tooltip on explore button and related table links
  - [Added] tooltips on related table options in the Table of Contents panel
  - [Changed] Default option in export dropdown renamed to "search results (csv)"
  - [Fixed] Globus links in profile modal were no longer working
  - [Fixed] Styles in profile modal for scrolling. citation dialog for proper text wrapping

# 1/29/20
  - [Added] navbar menu options have an `acls` object to control showing and enabling links for specific users or groups
  - [Improved] viewer app with more filetypes supported and an overlayed annotation list
  - [Fixed] range picker was not clearing first option if selected in some cases when trying to reset facet state

# 12/17/19
  - [Fixed] boolean dropdowns were being clipped at the end of the recordedit form
  - [Fixed] recordedit would sometimes throw an error on page resize

# 11/25/19
  - [Improved] npm packages to be more concise and only install those that are used for dev.
  - [Fixed] race condition that caused terminal error when aggregates were fetched for a very large table with many columns.
  - [Added] autoscroll query parameter to scroll to inline or related section in record app on page load.
  - [Change] Table of Contents will show on page load to prevent content shifting.
  - [Improved] logic for setting the main container height. Improved performance and consistency at page load time.
  - [Improved] "Displaying X of Y records" text so page doesn't jump when data loads.
  - [Improved] buttons in action column to be more consistent with row data.
  - [Improved] client action logging that doesn't interact with ermrest.
  - [Fixed] broken validators for float and integer inputs.
  - [Improved] search box placeholder display to represent columns that are used during search.

# 10/18/19
  - [Changed] record and recordset app based on the mitigation workshop.
  - [Changed] recordedit app and all recordset popups to be aligned with the new design.
  - [Added] a new mechanism to log the user interactions with Chaise that do not involve ermrest.
  - [Changed] markdown renderer to attach a class that will attach an external link icon to all the links outside the current origin.
  - [Added] clear control in all input types.
  - [Improved] recordset popups to be more responsive.
  - [Changed] the design and behavior of boolean inputs in recordedit.
  - [Fixed] spacing issues in recordedit.
  - [Fixed] histogram facets being renderred larger than expected.
  - [Fixed] navbar flashes black when a different color is set to override the default.
  - [Improved] function used in navbar app that relied on jQuery (removed jQuery).
  - [Improved] the behavior of scrollbar and sticky areas in all three apps.

# 09/31/19
  - [Added] version tag to the document <head> to properly cache templates
  - [Fixed] Pure and Binary add could fail and user won't see error message

# 06/01/19

  - N/A (This is the starting point of writing this summary.)
