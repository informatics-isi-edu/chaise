# Release Notes

This document is a summary of code changes in Chaise. This is the vocabulary used to introduce the changes:
  - `[Added]`: newly added features.
  - `[Improved]`: additions made to an existence feature.
  - `[Changed]`: modifications to existing features.
  - `[Fixed]`: bug fixes.
  - `[No changes]` means that Chaise hasn't been changed in the described duration.

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
