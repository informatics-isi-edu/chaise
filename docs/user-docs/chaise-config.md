# Configuration File: chaise-config.js

**Chaise** uses a set of default configuration parameters. You can overwrite them through the `chaise-config.js` file and/or the search parameters in the URL.

A Chaise deployment includes a sample config file ([chaise-config-sample.js](https://github.com/informatics-isi-edu/chaise/blob/master/chaise-config-sample.js)) at the root directory that you can edit and then rename to `chaise-config.js`.

Each chaise config property below can be defined in each place that we allow for a chaise configuration with a few exceptions noted below. Chaise config uses a set order for determining which chaise configuration's properties will be used. The order that the properties will be checked and then applied are as follows:
  1. Default values defined in [chaise configuration document](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/chaise-config.md).
  2. Any properties defined at the root of the object returned from [chaise-config.js](https://github.com/informatics-isi-edu/chaise/blob/master/chaise-config-sample.js).
  3. Any matching `configRules` in the order they appear in the `configRules` array. Properties in the last matching rule will take precedence
  4. Any properties defined at the root of the object returned from the "tag:isrd.isi.edu,2019:chaise-config" annotation.
  5. Step 3 from above, but with the `configRules` from the "tag:isrd.isi.edu,2019:chaise-config" annotation.

Notes: as the `configRules` are checked, properties set in step 2 will be overridden by properties defined in step 3 that have the same name. This allows the server wide configuration to be a base configuration for the chaise apps and allows for further configuration based on a combination of hostname and catalog id. This applies for step 4 and 5 as well when reading the values from the catalog annotation.

If a property appears in the same configuration twice, the property defined later will be used.

## Table of Contents:
 * [General Configuration:](#general-configuration)
   * [ermrestLocation](#ermrestlocation)
   * [defaultCatalog](#defaultcatalog)
   * [defaultTables](#defaulttables)
 * [Navbar Configuration:](#navbar-configuration)
   * [headTitle](#headtitle)
   * [navbarBrand](#navbarbrand)
   * [navbarBrandText](#navbarbrandtext)
   * [navbarBrandImage](#navbarbrandimage)
   * [navbarMenu](#navbarmenu)
 * [Login Configuration:](#login-configuration)
   * [logoutURL](#logouturl)
   * [dataBrowser](#databrowser)
   * [signUpURL](#signupurl)
   * [profileURL](#profileURL)
   * [termsAndConditionsConfig](termsandconditionsconfig)
   * [loggedInMenu](#loggedinmenu)
 * [Display Configuration:](#display-configuration)
   * [customCSS](#customcss)
   * [maxRecordsetRowHeight](#maxrecordsetrowheight)
   * [confirmDelete](#confirmdelete)
   * [hideSearchTextFacet](#hidesearchtextfacet)
   * [editRecord](#editRecord)
   * [deleteRecord](#deleteRecord)
   * [allowErrorDismissal](#allowerrordismissal)
   * [maxRelatedTablesOpen](#maxrelatedtablesopen)
   * [showWriterEmptyRelatedOnLoad](#showwriteremptyrelatedonload)
   * [showFaceting](#showfaceting)
   * [hideTableOfContents](#hidetableofcontents)
   * [disableExternalLinkModal](#disableexternallinkmodal)
   * [hideGoToRID](#hidegotorid)
 * [Viewer Configuration:](#viewer-configuration)
   * [defaultAnnotationColor](#defaultannotationcolor)
   * [userGroups](#usergroups)
 * [Export Configuration:](#export-configuration)
   * [disableDefaultExport](#disabledefaultexport)
   * [exportSerivePath](#exportservicepath)
 * [Share and Cite Configuration:](#share-and-cite-configuration)
   * [resolverImplicitCatalog](#resolverimplicitcatalog)
   * [shareCiteAcls](#shareciteacls)
 * [System Columns Configuration:](#system-columns-configuration)
   * [systemColumnsDisplayCompact](#systemcolumnsdisplaycompact)
   * [systemColumnsDisplayDetailed](#systemcolumnsdisplaydetailed)
   * [systemColumnsDisplayEntry](#systemcolumnsdisplayentry)
 * [System Configuration:](#system-configuration)
   * [internalHosts](#internalhosts)
   * [includeCanonicalTag](#includecanonicaltag)
   * [logClientActions](#logclientactions)
   * [configRules](#configrules)
   * [savedQueryConfig](#savedqueryconfig)
 * [Other Configuration:](#other-configuration)
   * [footerMarkdown](#footermarkdown)
   * [assetDownloadPolicyURL](#assetdownloadpolicyurl)

### General Configuration:
 #### ermrestLocation
 The location of the ERMrest service.
   - Type: String - URL
   - Default value:	`window.location.protocol + // + window.location.host + /ermrest`
   - Sample syntax:
     ```
     ermrestLocation: "www.isrd.isi.edu/ermrest"
     ```

 #### defaultCatalog
 Use this parameter to specify which catalog Chaise shows by default. When a user navigates to “/chaise/recordset” and omits the rest of the path, the `defaultCatalog` paired with `defaultTables` are used to generate a valid recordset link for the user. It is strongly recommended defining this in your `chaise-config.js` file. This property is used to fetch the catalog annotation information for pages that rely on `chaise-config.js` but don’t have a catalog id in the path. For example, the navbar on static pages uses this property to try to fetch a catalog annotation for configuring the navbar.
   - Type: String - Catalog ID
   - Default Value:	N/A
   - Sample syntax:
     ```
     defaultCatalog: "1"
     ```

 #### defaultTables
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
   - Default value: N/A
   - Sample syntax:
     ```
     defaultTables: {
       1: {
         schema: "isa",
         table: "dataset"
       }, ...
     }
     ```

### Navbar Configuration:
 #### headTitle
 The application name to display in the browser tab and browser history.
   - Type: String
   - Default value:	Chaise
   - Sample syntax:
     ```
     headTitle: "Chaise"
     ```

 #### navbarBrand
 The URL for the branding logo in the top navigation bar.
   - Type: String - URL
   - Default value:	N/A
   - Sample syntax:
     ```
     navbarBrand: "/"
     ```

 #### navbarBrandText
 The value to be displayed in the navigation bar.
   - Type: String
   - Default value:	Chaise
   - Sample syntax:
     ```
     navbarBrandText: "Chaise"
     ```

 #### navbarBrandImage
 The URL for an image to be displayed in the navigation bar.
   - Type: String - URL
   - Default value:	N/A
   - Sample syntax:
     ```
     navbarBrandImage: "../images/logo.png"
     ```

 #### navbarMenu
 Use this parameter to customize the menu items displayed in the navbar at the top of all Chaise apps by supplying an object with your links and/or dropdown menus. Each option accepts an 'acls' object that has two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click that link. The `url` property of each menu object allows for templating of the catalog id parameter using the pattern `{{$catalog.id}}`. The `header` property of each menu object will create an unclickable bold header with class `chaise-dropdown-header`. Consult the `chaise-config-sample.js` file for more details about format.
   - Type: Object
   - General syntax:
     ```
     navbarMenu: {
       acls: { show: [], enable:[] },
       newTab: <true|false>,
       children: [
         {
           name: <display name>,
           markdownName: <pattern>
           url: <pattern>,
           children: [ <menuOption>, ... ],
           acls: { show: [], enable:[] },
           newTab: <true|false>,
           header: <true|false>
         },
         <menuOption>,
         ...
       ],
     }
     ```
   - Default value:	N/A
   - Sample syntax:
     ```
     navbarMenu: "../images/logo.png"
     ```

### Login Configuration:
 #### logoutURL
 The URL to the logout page, root if not defined.
   - Type: String - URL
   - Default value: "/"
   - Sample syntax:
     ```
     logoutURL: "/"
     ```

 #### dataBrowser
 The URL to continue after a logout. Also used when an error is thrown and we don't know where to redirect the user.
   - Type: String - URL
   - Default value: "/"
   - Sample syntax:
     ```
     dataBrowser: "/"
     ```

 #### signUpURL
 Use this parameter to specify what the "Sign Up" link in the navbar should link to. If `signUpURL` is unspecified, the navbar will not display a "Sign Up" link.
   - Type: String - URL
   - Default value: N/A
   - Sample syntax:
     ```
     signUpURL: "<your-url>"
     ```

 #### profileURL
 When a user is logged in, the navbar displays the user's username. Use this parameter to specify what the username in the navbar should link to (e.g. `https://app.globus.org/account` if your deployment uses Globus authentication). If profileURL is unspecified, the navbar will display the username as regular text.
   - Type: String - URL
   - Default value: N/A
   - Sample syntax:
     ```
     profileURL: "<your-url>"
     ```

 #### termsAndConditionsConfig
 Use this property to enforce joining a globus group before continuing use of the application as a logged in user. This config property defaults to `null` when undefined. If the property is not an object containing all of the above 3 properties, this will be set to `null`.
   - Type: Object
   - General syntax:
     ```
     termsAndConditionsConfig: {
        groupId: <url>,
        joinUrl: <url>,
        groupName: <group displayname>
     }
     ```
   - `termsAndConditionsConfig` attributes
     - `groupId`: String - the identifier to the group (looks like a URL for globus groups, see example below)
     - `joinUrl`: String - URL to the join the required group
     - `groupName`: String - the name of the group as it appears in globus
   - Default value: null
   - Sample syntax:
     ```
     termsAndConditionsConfig: {
        groupId: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67",
        joinUrl: "https://app.globus.org/groups/962d5add-ff9a-11eb-8932-d71f8cc57c67/join",
        groupName: "Josh test group"
     }
     ```

 #### loggedInMenu
 Use this parameter to customize the menu items displayed in the navbar under the login dropdown after a user has logged into the system by supplying an object with your links and/or dropdown menus. Each option accepts an ‘acls’ object that has two attribute arrays (‘show’ and ‘enable’) used to define lists of globus groups or users that can see and click that link. The url property of each menu object allows for templating of the catalog id parameter using the pattern {{$catalog.id}}. The header property of each menu object will create an unclickable bold header with class chaise-dropdown-header. Consult the chaise-config-sample.js file for more details about format.
   - Type: Object
   - General syntax:
     ```
     loggedInMenu: {
       displayNameMarkdownPattern: <pattern>,
       menuOptions: [
         {
           nameMarkdownPattern: <pattern>,
           urlPattern: <pattern>,
           type: <menu|url|header|my_profile|logout>,
           children: [ <menuOption>, ... ],
           acls: { show: [], enable:[] },
           newTab: <true|false>
         },
         <menuOption>,
         ...
       ],
       acls: { show: [], enable:[] },
       newTab: <true|false>
     }
     ```
   - loggedInMenu attributes:
     - `{`... `"menuOptions":` `[` _menuOption_ `]` || _menuOption_ ...`}`: Describe this property
     - `{`... `"displayNameMarkdownPattern":` "" ...`}`:  The visual presentation of the login display SHOULD be computed by performing [Pattern Expansion](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#pattern-expansion) on pattern to obtain a markdown-formatted text value which MAY be rendered using a markdown-aware renderer.
     - acls
     - newTab
   - menuOption attributes
     - type
     - nameMarkdownPattern
     - urlPattern
     - children
     - acls
     - newTab
   - types
     - menu
     - url
     - header
     - my_profile
     - logout
   - Default value:	{}
   - Sample syntax:
     ```
     loggedInMenu: {
       menuOptions: [
         { nameMarkdownPattern: "User Profile", type: "my_profile" },
         {
           nameMarkdownPattern: "CFDE User Profile", "type": "url", urlPattern: "/chaise/record/#registry/CFDE:user_profile/id={{#encode $session.id}}{{/encode}}"
         },
         { nameMarkdownPattern: "Logout", type: "logout" }
       ],
       displayNameMarkdownPattern: "{{$session.displayName}}"
     }
     ```

### Display Configuration:
 #### customCSS
 The URL for a style sheet file to be applied to the application header (`<head>` tag). This is typically a relative URL to a dedicated stylesheet in the CSS folder of the related static site repo (For example, in RBK, it's `/assets/css/chaise.css` in the rbk-www repo). More information can be found [here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/custom-css.md).
   - Type: String - URL
   - Default value: N/A
   - Sample syntax:
     ```
     customCSS: "/assets/css/chaise.css"
     ```

 #### maxRecordsetRowHeight
 Set this property to false if you don't want content to be clipped in tables else set it to a number which represents the maximum row height when not expanded.
   - Type: Boolean || Number
   - Default value: 160
   - Sample syntax:
     ```
     maxRecordsetRowHeight: 200
     ```

 #### confirmDelete
 If `false`, the user will not be prompted by a modal when deleting an item
   - Type: Boolean
   - Default value: true
   - Sample syntax:
     ```
     confirmDelete: false
     ```

 #### hideSearchTextFacet
 Whether the search box for attributes names and values should be hidden
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     hideSearchTextFacet: true
     ```

 #### editRecord
 If not present or equal to `true`, the recordedit page allows for inserting records and editing records. The record page will have an edit button for both of these cases as well. If equal to `false`, a dialog appears on recordedit that disallows use of the app for both create and edit, and the create/edit button does not appear in the record app.
   - Type: Boolean
   - Default value: N/A
   - Sample syntax:
     ```
     editRecord: false
     ```

 #### deleteRecord
 If present and equal to `true`, the recordedit page will show delete button if editRecord is also true, and record page will show delete button if this is true. Otherwise, hide delete buttons.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     deleteRecord: true
     ```

 #### allowErrorDismissal
 All terminal error message display an error message dialog that is not dismissable by default. Set this property to `true` if you want to allow dismissable error message dialogs.
 This property when defined as `true` will cause a degraded UX experience that will prevent future errors from being thrown and other functionality might not behave as expected. This should ONLY be used in development environments.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     allowErrorDismissal: true
     ```

 #### maxRelatedTablesOpen
 It defines maximum number of expanded related table on a page during initial loading. If related tables exceed this value then all of them shall be collapsed.
   - Type: Integer
   - Default value: N/A
   - Sample syntax:
     ```
     maxRelatedTablesOpen: 5
     ```

 #### showWriterEmptyRelatedOnLoad
 This property only applies to users with write permission to the main record being viewed. Set to `false` to hide all empty related tables on record page load ignoring the heuristics defined for writers. Set to `true` to show all empty related tables on record page load ignoring the heuristics. If `not defined`, the heuristics to show empty related tables based on the user being able to write to at least one of them will be used instead.
   - Type: Boolean
   - Default value: N/A
   - Sample syntax:
     ```
     showWriterEmptyRelatedOnLoad: false
     ```

 #### showFaceting
 If `true`, shows the faceting panel on the recordset app.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     showFaceting: true
     ```

 #### hideTableOfContents
 If true, hides the table of contents panel on the record app. By default table of contents will be visible.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     hideTableOfContents: true
     ```

 #### disableExternalLinkModal
 Set this to false to disable the external link notification.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     disableExternalLinkModal: true
     ```

 #### hideGoToRID
 Use this property to hide the RID search box in the navbar. The RID search box is present in the navbar when `resolverImplicitCatalog !== null` (meaning the resolver is in use) and `hideGoToRID !== true`
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     hideGoToRID: true
     ```

### Viewer Configuration:
 #### defaultAnnotationColor
 In `/chaise/viewer`, annotations' borders and colors will default to this value.
   - Type: String - red|orange|gold|green|blue|purple
   - Default value: red
   - Sample syntax:
     ```
     defaultAnnotationColor: purple
     ```

 #### userGroups
 For Viewer app only. The Viewer app assigns an authenticated user one of three permission levels depending on the user's Globus memberships. The permission levels, from highest to lowest, are `curator`, `annotator`, then `user`. The default Globus group IDs that determine who's a `curator`, `annotator`, or `user` are set by [RBK](https://github.com/informatics-isi-edu/rbk-project). To override these default group IDs for each permission level, you may specify your own via this `userGroups` setting.
   - Type: Object
   - Default value: N/A
   - Sample syntax:
     ```
     userGroups: {
       curators: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67",
       annotators: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67",
       user: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67"
     }
     ```

### Export Configuration:
 #### disableDefaultExport
 When the export annotation is missing from table and schema, ermrestjs will use the heuristics to generate a default export template. Set this attribute to `true` to avoid using the heuristics.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     disableDefaultExport: true
     ```

 #### exportServicePath
 You can use this variable to switch between different export services that might be available in the deployment.
   - Type: String
   - Default value: "/deriva/export/"
   - Sample syntax:
     ```
     exportServicePath: "/deriva/export/"
     ```

### Share and Cite Configuration:
 #### resolverImplicitCatalog
 Set to a catalog id, `N`, if your resolver accepts `/id/X` instead of `/id/N/X` and you prefer to share records with this shorter URL. If the property is `null`, the resolver functionality will be turned off and the default permalink will be used. Anything else will be ignored and the default behavior will be applied which is to always use the catalog-qualified form, `/id/N/X`.
   - Type: String
   - Default value: N/A
   - Sample syntax:
     ```
     resolverImplicitCatalog: "1"
     ```

 #### shareCiteAcls
 Use this property to show/hide or enable/disable the button used to open the share and cite dialog on Record app. The accepted values for the array for both show and enable are `"*"` or any valid globus group key. If either key/value pair is undefined in the object, it will default to `["*"]`. Consult the chaise-config-sample.js file for more details.
system columns:					
   - Type: Object
   - Default value: {show: ["\*"], enable: ["\*"]}
   - Sample syntax:
     ```
     shareCiteAcls: {
       show: ["*"],
       enable: ["*"]
     }
     ```

### System Columns Configuration:
 #### systemColumnsDisplayCompact
 If set to `true`, apply the system columns heuristics when no visible columns list is defined. This will put the RID system column as the first self referencing key column. 'RCB', 'RMB', 'RCT', 'RMT' will be placed at the very end of the list respectively. If set to an array, only system columns in the array will be displayed in the order mentioned earlier. This applies to compact and all subcontexts.
   - Type: Boolean || Array
   - Default value: false
   - Sample syntax:
     ```
     systemColumnsDisplayCompact: ["RMB", "RMT"]
     ```

 #### systemColumnsDisplayDetailed
 See above description for `systemColumnsDisplayCompact`. This property behaves the same way except only for the detailed context.
   - Type: Boolean || Array
   - Default value: false
   - Sample syntax:
     ```
     systemColumnsDisplayDetailed: true
     ```

 #### systemColumnsDisplayEntry
 See above description for `systemColumnsDisplayCompact`. This property behaves the same way except only for the entry contexts.
   - Type: Boolean || Array
   - Default value: false
   - Sample syntax:
     ```
     systemColumnsDisplayEntry: ["RMT", "RCT"]
     ```

### System Configuration:
 #### internalHosts
 If external link notification is enabled, Chaise will use this array to determine whether the current host is external. List any hostnames that should be considered internal. If defined, `<current hostname>` will not be automatically added to the list.
   - Type: Array
   - Default value: [<current hostname>]
   - Sample syntax:
     ```
     internaleHosts: ["dev.rebuildingakidney.org", "dev.gudmap.org"]
     ```

 #### includeCanonicalTag
 This variable can be used to force chaise to include a tag in the tag that defines the canonical link for each of the entities and other resource pages.
   - Type: Boolean
   - Default value: false
   - Sample syntax:
     ```
     includeCanonicalTag: true
     ```

 #### logClientActions
 Set this to `false` to disable the logging of client side actions which occurs when users interact with the app in ways that don't generate a request to the database.
   - Type: Boolean
   - Default value: true
   - Sample syntax:
     ```
     logClientActions: false
     ```

 #### configRules
 Allows for host specific configuration rules. Each object in the array contains 2 properties, `host` and `config`. `host` is expected to be in the format of a single string value or an array of string values. `config` mimics the chaise-config properties. All chaise config properties can be defined in this block except this property (`configRules`).
   - Type: Array
   - General syntax:
     ```
     configRules: [
       {
         host: <host url> || [<host url>, <host url>],
         config: {}
       },
       { ... },
       ...
     ]
     ```
   - Default value: N/A
   - Sample syntax:
     ```
     configRules:
     ```

 #### savedQueryConfig
 Use this property to define the path to the saved query table for the saved query feature. The `storageTable` is required to be an object with 3 properties, `catalog`, `schema`, and `table`. This config property defaults to null when undefined. If the property is not an object with an object containing all of the above 3 properties, this will be set to `null`.
   - Type: Object
   - General syntax:
     ```
     savedQueryConfig: {
       storageTable: {
         catalog: <catalog id>
         schema: <schema name>
         table: <table name>
       }
     }
     ```
   - `storageTable` attributes
     - `catalog`: String - catalog id
     - `schema`: String - schema name
     - `table`: String - table name
   - Default value: null
   - Sample syntax:
     ```
     savedQueryConfig: {
        storageTable: {
            catalog: "73448",
            schema: "faceting",
            table: "saved_query"
        }
     }
     ```

### Other Configuration:
 #### footerMarkdown
 If present, it creates a footer at the bottom of the app with the markdown text.
   - Type: String
   - Default value: N/A
   - Sample syntax:
     ```
     footerMarkdown: "* Please check [Privacy Policy](/privacy-policy/){target='_blank'}"
     ```

 #### assetDownloadPolicyURL
 Set this property to the url that points to the download policy for when an asset is fetched but the user is unauthorized to fetch that asset.

   - Type: String - URL
   - Default value: N/A
   - Sample syntax:
     ```
     assetDownloadPolicyURL: "<your url>"
     ```
