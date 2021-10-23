This document contains deprecated chaise-config parameters.

- Refer to [chaise-config.d](chaise-config.md) for currently supported parameters.
- Refer to [chaise-config-change-logs.md](chaise-config-change-logs.md) for complete list of changes.


## Table of Contents

* [Login Configuration:](#login-configuration)
   * [profileURL](#profileURL)
* [Search Application](#search-application)
   * [sidebarPosition](#sidebarPosition)
   * [attributesSidebarHeading](#attributesSidebarHeading)
   * [hideSearchTextFacet](hidesearchtextfacet)


### Login Configuration:

 #### profileURL
 When a user is logged in, the navbar displays the user's username. Use this parameter to specify what the username in the navbar should link to (e.g. `https://app.globus.org/account` if your deployment uses Globus authentication). If profileURL is unspecified, the navbar will display the username as regular text.
   - Type: String - URL
   - Default value: N/A
   - Sample syntax:
     ```
     profileURL: "<your-url>"
     ```

### Search Application:

 #### sidebarPosition
 Applies to the Search app only. If \<value\> is "left", the sidebar will be on the left and the main content will shift left correspondingly. If \<value\> is "right", the sidebar will be on the right.
   - Type: String - `"right"` or `"left"`
   - Default value: `"right"`
   - Sample syntax:
     ```
     "sidebarPosition": "left"
     ```

 #### attributesSidebarHeading
 Applies to Search app only. Use this parameter to customize the heading displayed in at the top of the Attributes sidebar (usually the first sidebar that appears when the Search app loads).
   - Type: String
   - Default value: `"Choose Attributes"`
   - Sample syntax:
     ```
     "attributesSidebarHeading": "Attributes"
     ```
     
 #### hideSearchTextFacet
 Whether the search box for attributes names and values should be hidden
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     hideSearchTextFacet: true
     ```
