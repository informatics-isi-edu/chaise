# Release Notes

This document is a summary of code changes in Chaise. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Fixed]`: bug fixes.
  - `[No changes]` means that Chaise hasn't been changed in the described duration.

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
