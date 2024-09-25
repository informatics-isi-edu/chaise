This document contains deprecated chaise-config parameters.

- Refer to [chaise-config.d](chaise-config.md) for currently supported parameters.
- Refer to [chaise-config-change-logs.md](chaise-config-change-logs.md) for complete list of changes.


## Table of Contents

* [General Configuration:](#general-configuration)
* [Login Configuration:](#login-configuration)
   * [profileURL](#profileURL)
* [Display Configuration:](#display-configuration)
   * [maxRelatedTablesOpen](#maxrelatedtablesopen)
   * [showFaceting](#showfaceting)
* [Share and Cite Configuration:](#share-and-cite-configuration)
   * [shareCiteAcls](#shareciteacls)
* [Search Application](#search-application)
   * [sidebarPosition](#sidebarPosition)
   * [attributesSidebarHeading](#attributesSidebarHeading)
   * [hideSearchTextFacet](hidesearchtextfacet)
* [Viewer Configuration:](#viewer-configuration)
   * [defaultAnnotationColor](#defaultannotationcolor)
   * [userGroups](#usergroups)


### General Configuration:

 #### defaultTables

 > Replaced by [`defaultTable`](chaise-config.md#defaulttable) property.

 Use this parameter to specify for each catalog `N`, which table Chaise shows by default.
   - Type: Object
   - General syntax:
     ```
     defaultTables: {
       N: {
         schema: <schema name>,
         table: <table name>
       }
     }
     ```
   - Sample syntax:
     ```
     defaultTables: {
       1: {
         schema: "isa",
         table: "dataset"
       }, ...
     }
     ```


### Login Configuration:

 #### profileURL
 When a user is logged in, the navbar displays the user's username. Use this parameter to specify what the username in the navbar should link to (e.g. `https://app.globus.org/account` if your deployment uses Globus authentication). If profileURL is unspecified, the navbar will display the username as regular text.
   - Type: String - URL
   - Default value: N/A
   - Sample syntax:
     ```
     profileURL: "<your-url>"
     ```

### Display Configuration:

#### maxRelatedTablesOpen
 It defines maximum number of expanded related table on a page during initial loading. If related tables exceed this value then all of them shall be collapsed.
   - Type: Integer
   - Default behavior: all related tables will be expanded on load
   - Sample syntax:
     ```
     maxRelatedTablesOpen: 5
     ```

#### showFaceting

 If `true`, shows the faceting panel on the recordset app.

> Now faceting panel is displayed by default. If you would like to disable it use the new `maxFacetDepth` property of [`facetPanelDisplay`](chaise-config.md#facetpaneldisplay).


   - Type: Boolean
   - Default behavior: the faceting panel will not be available on recordset page
   - Sample syntax:
     ```
     showFaceting: true
     ```

### Share and Cite Configuration:

 #### shareCiteAcls
Use this property to show/hide or enable/disable the button used to open the share and cite dialog on Record app. The accepted values for the array for both show and enable are `"*"` or any valid globus group key.

  > Please use the new [`shareCite`](chaise-config.md#sharecite) property instead of this deprecated property.

  - Type: Object
   - Default behavior: the share cite button is viewable and enabled for everyone
   - Sample syntax:
     ```
     "shareCiteAcls": {
       "show": ["*"],
       "enable": ["*"]
     }
     ```
   - Notes:
      - You can use `"shareCiteAcls": true` as a shorthand syntax for `"shareCiteAcls": {"show": ["*"], "enable": ["*"]}` which means showing and enabling for all users (the default behavior).
      - You can use `"shareCiteAcls": false` as a shorthand syntax for `"shareCiteAcls": {"show": [], "enable": []}` which means hiding for all users.
      - If either key/value pair is undefined in the object, it will default to `["*"]`. For instance if you just want to enable this feature for specific users, you could just do `{"enable": ["more-privilidged-users"]}` and chaise will add the `"show": ["*"]` for you.

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
