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
* [Viewer Configuration:](#viewer-configuration)
   * [defaultAnnotationColor](#defaultannotationcolor)
   * [userGroups](#usergroups)


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


### Viewer Configuration:
 #### defaultAnnotationColor
 In `/chaise/viewer`, annotations' borders and colors will default to this value.
   - Type: String - red|orange|gold|green|blue|purple
   - Default behavior: red will be used
   - Sample syntax:
     ```
     defaultAnnotationColor: purple
     ```

 #### userGroups
 For Viewer app only. The Viewer app assigns an authenticated user one of three permission levels depending on the user's Globus memberships. The permission levels, from highest to lowest, are `curator`, `annotator`, then `user`. The default Globus group IDs that determine who's a `curator`, `annotator`, or `user` are set by [RBK](https://github.com/informatics-isi-edu/rbk-project). To override these default group IDs for each permission level, you may specify your own via this `userGroups` setting.
   - Type: Object
   - Default behavior: The default Globus group IDs are set by RBK
   - Sample syntax:
     ```
     userGroups: {
       curators: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67",
       annotators: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67",
       user: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67"
     }
     ```
