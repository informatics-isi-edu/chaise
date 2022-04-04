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
   * [navbarBanner](#navbarbanner)
   * [navbarBrand](#navbarbrand)
   * [navbarBrandText](#navbarbrandtext)
   * [navbarBrandImage](#navbarbrandimage)
   * [navbarMenu](#navbarmenu)
 * [Login Configuration:](#login-configuration)
   * [logoutURL](#logouturl)
   * [dataBrowser](#databrowser)
   * [signUpURL](#signupurl)
   * [termsAndConditionsConfig](#termsandconditionsconfig)
   * [loggedInMenu](#loggedinmenu)
 * [Display Configuration:](#display-configuration)
   * [customCSS](#customcss)
   * [maxRecordsetRowHeight](#maxrecordsetrowheight)
   * [confirmDelete](#confirmdelete)
   * [editRecord](#editRecord)
   * [deleteRecord](#deleteRecord)
   * [allowErrorDismissal](#allowerrordismissal)
   * [maxRelatedTablesOpen](#maxrelatedtablesopen)
   * [showWriterEmptyRelatedOnLoad](#showwriteremptyrelatedonload)
   * [showFaceting](#showfaceting)
   * [hideTableOfContents](#hidetableofcontents)
   * [disableExternalLinkModal](#disableexternallinkmodal)
   * [hideGoToRID](#hidegotorid)
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
   - Default behavior:	"Chaise" will be used
   - Sample syntax:
     ```
     headTitle: "Chaise development"
     ```

 #### navbarBanner
 Use this parameter to define banners that will be displayed on top or below the banner.
   - Type: Object or array of objects.
   - Default behavior:	no banner will be shown
   - General syntax:
      - One banner:
        ```
        navbarBanner: {
          markdownPattern: <markdown-pattern>,
          dismissible: <boolean>,
          position: <position>,
          key: <key-string>,
          acls: [
            show: <group-list>
          ]
        }
        ```
      - Multiple banners:
        ```
        navbarBanner: [
          {
            {
              markdownPattern: <markdown-pattern>,
              dismissible: <boolean>,
              position: <position>,
              key: <key-string>,
              acls: [
                show: <group-list>
              ]
            },
            ...
          }
        ]
        ```


   - Attributes:
     - `markdownPattern`: String - What should be displayed in the banner. If results in an empty string, the banner will be ignored.
     - `dismissible`: Boolean (_optional_) - Whether users should be able to dismiss the banner.
     - `position`: `"bottom"` or `"top"` (_optional_) - By default the banner will be displayed above the banner and using this attribute you can change that.
     - `key`: String (_optional_) - Used in the `class` attribute that is attached to the banner using the `chaise-navbar-banner-container-<key>` format. For instance if the `key` is defined as `"feedback"`, you can use `.chaise-navbar-banner-container-feedback` to refer to this banner.
     - `acls`: Object _optional_ - has one attribute array (`show`) used to define lists of globus groups or users that can see the banner.  If missing, `["*"]` will be used as the default. An empty array (`[]`) will hide the banner for everyone.
   - Sample syntax:
     ```
     navbarBanner: {
       markdownPattern: "Let us know how you use and what you think of this data repository. [Please fill out the survey](https://survey.com)!"
     }
     ```
 #### navbarBrand
 The URL for the branding logo in the top navigation bar.
   - Type: String - URL
   - Sample syntax:
     ```
     navbarBrand: "/"
     ```

 #### navbarBrandText
 The value to be displayed in the navigation bar.
   - Type: String
   - Default behavior:	"Chaise" will be used
   - Sample syntax:
     ```
     navbarBrandText: "Chaise development"
     ```

 #### navbarBrandImage
 The URL for an image to be displayed in the navigation bar.
   - Type: String - URL
   - Sample syntax:
     ```
     navbarBrandImage: "../images/logo.png"
     ```

 #### navbarMenu
 Use this parameter to customize the menu items displayed in the navbar at the top of all Chaise apps by supplying an object with your links and/or dropdown menus. Consult the `chaise-config-sample.js` file for more details about format.
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
   - `navbarMenu` attributes
     - `acls`: Object _optional_ - has two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click that link. Define this property here in `navbarMenu` to have all children and children of children inherit the same link functionality. If either array, `show` or `enable`, or both are missing, `["*"]` will be used as the default. An empty array (`[]`) will hide the link or disable it for everyone
     - `newTab`: Boolean _optional_ - set to `true` to open the link in a new tab. Define this property here in `navbarMenu` to have all children and children of children inherit the same link functionality. If undefined at root, `newTab` is treated as `true`.
     - `children`: Array - used to specify dropdowns, you can nest as many dropdowns as you need.
   - `menuOption` attributes
     - `name`: String - label of the menu item
     - `markdownName`: String - use this to override the `name` property and add markdown styling to the label of the menu item. Can be used to attach a class for CSS styles to be applied to, read more in the [markdown document](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/markdown-formatting.md).
     - `url`: String - this menu item's url. URLs can be absolute or relative to the document root. URLs support templating primarily for catalog substition.
     - `children`: Array - used to specify dropdowns, you can nest as many dropdowns as you need.
     - `acls`: Object _optional_ - has two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click that link. Follows the same rules for defaults defined above.
     - `newTab`: Boolean _optional_ - set to `true` to open the link in a new tab. Each child menu item checks for a `newTab` property on itself, if nothing is set, the child inherits from it's parent.
     - `header`: Boolean _optional_ - set to true to create an un-clickable bold menu option with class `chaise-dropdown-header`
   - Sample syntax:
     ```
     navbarMenu: {
         newTab: false,
         children: [
             {"name": "Search","children": [
                 {"name": "Gene Expression Data", "children": [
                     {"name": "Genes", "url": "/chaise/recordset/#2/Common:Gene"},
                     {"name": "Sequencing Data (GUDMAP pre-2018)", "children": [
                         {"name": "Series", "url": "/chaise/recordset/#2/Legacy_RNASeq:Series"},
                         {"name": "Samples", "url": "/chaise/recordset/#2/Legacy_RNASeq:Sample"},
                         {"name": "Protocols", "url": "/chaise/recordset/#2/Legacy_RNASeq:Protocol"}
                     ]},
                     {"name": "Specimens", "url": "/chaise/recordset/#2/Gene_Expression:Specimen"}
                 ]},
                 {"name": "Cell & Animal Models", "children": [
                     {"name": "Parental Cell Lines", "url": "/chaise/recordset/#2/Cell_Line:Parental_Cell_Line"},
                     {"name": "Mouse Strains", "url": "/chaise/recordset/#2/Cell_Line:Mouse_Strain"}
                 ]}
             ]},
             {"name": "Create", "children": [
                 {"name": "Protocol", "children": [
                     {"name": "Protocol", "url": "/chaise/recordedit/#2/Protocol:Protocol"},
                     {"name": "Subject", "url": "/chaise/recordedit/#2/Protocol:Subject"},
                     {"name": "Keyword", "url": "/chaise/recordedit/#2/Vocabulary:Keyword"}
                 ]}
             ]},
             {"name": "Help", "children": [
                 {"name": "Using the Data Browser", "url": "https://github.com/informatics-isi-edu/gudmap-rbk/wiki/Using-the-GUDMAP-RBK-Data-Browser"},
                 {"name": "Submitting Data", "url": "https://github.com/informatics-isi-edu/gudmap-rbk/wiki"},
                 {"name": "Create Citable Datasets", "url": "https://github.com/informatics-isi-edu/gudmap-rbk/wiki/Create-citable-datasets"},
                 {"name": "Cite Consortium Data", "url": "/about/usage.html"}
             ]}
         ]
     }
     ```

### Login Configuration:
 #### logoutURL
 The URL to the logout page, root if not defined.
   - Type: String - URL
   - Default behavior: assumed that the logout page is at the root
   - Sample syntax:
     ```
     logoutURL: "/"
     ```

 #### dataBrowser
 The URL to continue after a logout. Also used when an error is thrown and we don't know where to redirect the user.
   - Type: String - URL
   - Default behavior: navigate the user to the root of the server (homepage) on logout
   - Sample syntax:
     ```
     dataBrowser: "/"
     ```

 #### signUpURL
 Use this parameter to specify what the "Sign Up" link in the navbar should link to. If `signUpURL` is unspecified, the navbar will not display a "Sign Up" link.
   - Type: String - URL
   - Default behavior: no signup link will be shown
   - Sample syntax:
     ```
     signUpURL: "<your-url>"
     ```

 #### termsAndConditionsConfig
 Use this property to enforce joining a globus group before continuing use of the application as a logged in user. This config property defaults to `null` when undefined. If the property is not an object containing all of the above 3 properties, this will be set to `null`.
   - Type: Object
   - Default behavior: group inclusion check won't be enforced to continue login
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
   - Sample syntax:
     ```
     termsAndConditionsConfig: {
        groupId: "https://auth.globus.org/962d5add-ff9a-11eb-8932-d71f8cc57c67",
        joinUrl: "https://app.globus.org/groups/962d5add-ff9a-11eb-8932-d71f8cc57c67/join",
        groupName: "Josh test group"
     }
     ```

 #### loggedInMenu
 Use this parameter to customize the menu items displayed in the navbar under the login dropdown after a user has logged into the system by supplying an object with your links and/or dropdown menus.
   - Type: Object
   - Default behavior: The user's full name will be shown. Upon clicking, a dropdown menu will appear with a "My Profile" link that opens a modal popup to see information about the logged in user. The other dropdown menu option will be "Logout".
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
       ] || <menuOption>,
       acls: { show: [], enable:[] },
       newTab: <true|false>
     }
     ```
   - loggedInMenu attributes:
     - `menuOptions`: Array || Object - If defined as an Array, the array replaces the dropdown menu with the listed `menuOption` objects. Each `menuOption` is required to have a `nameMarkdownPattern` defined and should have a `type` defined to properly display the option. If no type is defined, the type will try to be inferred by checking for `children` or `urlPattern`. If both are defined, `children` is preferred and the type is set to `menu`. If defined as an Object, the Object is assumed to be a `menuOption` and will be used to replace the display and dropdown functionality. The same types listed below are allowed except for the `menu` type.
     - `displayNameMarkdownPattern`: String _optional_ - The visual presentation of the login display in the right hand corner of the navigation bar. Will be computed by performing [Pattern Expansion](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#pattern-expansion) on the pattern to obtain a markdown-formatted text value which will be rendered using a markdown renderer.
     - `acls`: Object _optional_ - has two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click the links in the dropdown menu. Define this property here in `loggedInMenu` to have all children and children of children inherit the same link functionality. If either array, `show` or `enable`, or both are missing, `["*"]` will be used as the default. An empty array (`[]`) will hide the link or disable it for everyone
     - `newTab`: Boolean _optional_ - set to `true` to have links in the dropdown menu open in a new tab. Define this property here in `loggedInMenu` to have all children and children of children inherit the same link functionality. If undefined at root, `newTab` is treated as `true`.
   - `menuOption` attributes
     - `type`: String - set the type of the menu option to change how it is displayed. Types include: `menu`, `url`, `header`, `my_profile`, `logout`. More info for each type can be found below.
     - `nameMarkdownPattern`: String _required_ - label of the menu item. Will be computed by performing [Pattern Expansion](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/annotation.md#pattern-expansion) on the pattern to obtain a markdown-formatted text value which will be rendered using a markdown renderer. Replaces the `name` and `markdownName` properties defined for `navbarMenu`.
     - `urlPattern`: String - this menu item's url. URLs can be absolute or relative to the document root. URLs support templating primarily for catalog substition. Replaces the `url` property of `navbarMenu`.
     - `children`: Array - used to specify dropdowns, you can nest as many dropdowns as you need.
     - `acls`: Object _optional_ - has two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click that link. Follows the same rules for defaults defined above.
     - `newTab`: Boolean _optional_ - set to `true` to open the link in a new tab. Each child menu item checks for a `newTab` property on itself, if nothing is set, the child inherits from it's parent.
   - Values allowed for `type` attribute
     - `menu`: display the menu item with a sub menu. Valid if children Array is defined and length is greater than 0.
     - `url`: display the menu item as a url link. Valid if `urlPattern` evaluates into a non `null` value
     - `header`: display the menu item as an unclickable header with bold text
     - `my_profile`: display the existing "My Profile" menu item that opens the profile modal. If not defined in the list, "My Profile" menu item will not be shown
     - `logout`: display the existing "Log Out" menu item that logs the user out. If not defined in the list, the "Log Out" menu item will not be shown
   - Sample syntax:
     ```
     loggedInMenu: {
       menuOptions: [
         { nameMarkdownPattern: "User Profile", type: "my_profile" },
         { nameMarkdownPattern: "CFDE User Profile", type: "url", urlPattern: "/chaise/record/#registry/CFDE:user_profile/id={{#encode $session.id}}{{/encode}}" },
         { nameMarkdownPattern: "Logout", type: "logout" }
       ],
       displayNameMarkdownPattern: "{{$session.display_name}}"
     }
     ```

### Display Configuration:
 #### customCSS
 The URL for a style sheet file to be applied to the application header (`<head>` tag). This is typically a relative URL to a dedicated stylesheet in the CSS folder of the related static site repo (For example, in RBK, it's `/assets/css/chaise.css` in the rbk-www repo). More information can be found [here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/custom-css.md).
   - Type: String - URL
   - Sample syntax:
     ```
     customCSS: "/assets/css/chaise.css"
     ```

 #### maxRecordsetRowHeight
 Set this property to false if you don't want content to be clipped in tables else set it to a number which represents the maximum row height when not expanded.
   - Type: Boolean || Number
   - Default behavior: 160 will be used if no value is supplied
   - Sample syntax:
     ```
     maxRecordsetRowHeight: 200
     ```

 #### confirmDelete
 If `false`, the user will not be prompted by a modal when deleting an item
   - Type: Boolean
   - Default behavior: user will be prompted with a dialog to confirm they want to delete
   - Sample syntax:
     ```
     confirmDelete: false
     ```

 #### editRecord
 If not present or equal to `true`, the recordedit page allows for inserting records and editing records. The record page will have an edit button for both of these cases as well. If equal to `false`, a dialog appears on recordedit that disallows use of the app for both create and edit, and the create/edit button does not appear in the record app.
   - Type: Boolean
   - Default behavior: Allows for inserting and editing records through the recordedit page
   - Sample syntax:
     ```
     editRecord: false
     ```

 #### deleteRecord
 If present and equal to `true`, the recordedit page will show delete button if editRecord is also true, and record page will show delete button if this is true. Otherwise, hide delete buttons.
   - Type: Boolean
   - Default behavior: recordset and record page will not show a delete buttons
   - Sample syntax:
     ```
     deleteRecord: true
     ```

 #### allowErrorDismissal
 Set this property to `true` if you want to allow dismissable error message dialogs. This property when defined as `true` will cause a degraded UX experience that will prevent future errors from being thrown and other functionality might not behave as expected. This should ONLY be used in development environments.
   - Type: Boolean
   - Default behavior: All terminal error message display an error message dialog that is not dismissable
   - Sample syntax:
     ```
     allowErrorDismissal: true
     ```

 #### maxRelatedTablesOpen
 It defines maximum number of expanded related table on a page during initial loading. If related tables exceed this value then all of them shall be collapsed.
   - Type: Integer
   - Default behavior: all related tables will be expanded on load
   - Sample syntax:
     ```
     maxRelatedTablesOpen: 5
     ```

 #### showWriterEmptyRelatedOnLoad
 This property only applies to users with write permission to the main record being viewed. Set to `false` to hide all empty related tables on record page load ignoring the heuristics defined for writers. Set to `true` to show all empty related tables on record page load ignoring the heuristics.
   - Type: Boolean
   - Default behavior: the heuristics to show empty related tables based on the user being able to write to at least one of them will be used
   - Sample syntax:
     ```
     showWriterEmptyRelatedOnLoad: false
     ```

 #### showFaceting
 If `true`, shows the faceting panel on the recordset app.
   - Type: Boolean
   - Default behavior: the faceting panel will not be available on recordset page
   - Sample syntax:
     ```
     showFaceting: true
     ```

 #### hideTableOfContents
 If true, hides the table of contents panel on the record app.
   - Type: Boolean
   - Default behavior:  table of contents will be visible
   - Sample syntax:
     ```
     hideTableOfContents: true
     ```

 #### disableExternalLinkModal
 Set this to true to disable the external link notification.
   - Type: Boolean
   - Default behavior: a notification that you are navigating to an external page in 5 seconds will show
   - Sample syntax:
     ```
     disableExternalLinkModal: true
     ```

 #### hideGoToRID
 Use this property to hide the RID search box in the navbar. The RID search box is present in the navbar when `resolverImplicitCatalog !== null` (meaning the resolver is in use) and `hideGoToRID !== true`
   - Type: Boolean
   - Default behavior: the RID search box will show in the navbar to the left of the login button or the logged in user information
   - Sample syntax:
     ```
     hideGoToRID: true
     ```

### Export Configuration:
 #### disableDefaultExport
 When the export annotation is missing from table and schema, ermrestjs will use the heuristics to generate a default export template. Set this attribute to `true` to avoid using the heuristics.
   - Type: Boolean
   - Default behavior:  ermrestjs will use the heuristics to generate a default export template
   - Sample syntax:
     ```
     disableDefaultExport: true
     ```

 #### exportServicePath
 You can use this variable to switch between different export services that might be available in the deployment.
   - Type: String
   - Default behavior: "/deriva/export/" will be used as the defailt path
   - Sample syntax:
     ```
     exportServicePath: "/deriva/export/"
     ```

### Share and Cite Configuration:
 #### resolverImplicitCatalog
 Set to a catalog id, `N`, if your resolver accepts `/id/X` instead of `/id/N/X` and you prefer to share records with this shorter URL. If the property is `null`, the resolver functionality will be turned off and the default permalink will be used. Anything else will be ignored and the default behavior will be applied which is to always use the catalog-qualified form, `/id/N/X`.
   - Type: String
   - Default behavior: assume the resolver service uses the catalog-qualified form, `/id/N/X`
   - Sample syntax:
     ```
     resolverImplicitCatalog: "1"
     ```

 #### shareCiteAcls
 Use this property to show/hide or enable/disable the button used to open the share and cite dialog on Record app. The accepted values for the array for both show and enable are `"*"` or any valid globus group key. If either key/value pair is undefined in the object, it will default to `["*"]`. Consult the chaise-config-sample.js file for more details.
system columns:
   - Type: Object
   - Default behavior: the share cite button is viewable and enabled for everyone
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
   - Default behavior: system columns will be displayed based on how ermrest returns the set of all columns
   - Sample syntax:
     ```
     systemColumnsDisplayCompact: ["RMB", "RMT"]
     ```

 #### systemColumnsDisplayDetailed
 See above description for `systemColumnsDisplayCompact`. This property behaves the same way except only for the detailed context.
   - Type: Boolean || Array
   - Default behavior: system columns will be displayed based on how ermrest returns the set of all columns
   - Sample syntax:
     ```
     systemColumnsDisplayDetailed: true
     ```

 #### systemColumnsDisplayEntry
 See above description for `systemColumnsDisplayCompact`. This property behaves the same way except only for the entry contexts.
   - Type: Boolean || Array
   - Default behavior: system columns will be displayed based on how ermrest returns the set of all columns
   - Sample syntax:
     ```
     systemColumnsDisplayEntry: ["RMT", "RCT"]
     ```

### System Configuration:
 #### internalHosts
 If external link notification is enabled, Chaise will use this array to determine whether the current host is external. List any hostnames that should be considered internal. If defined, `<current hostname>` will not be automatically added to the list.
   - Type: Array
   - Default behavior: the current hostname will be treated as an internal host
   - Sample syntax:
     ```
     internaleHosts: ["dev.rebuildingakidney.org", "dev.gudmap.org"]
     ```

 #### includeCanonicalTag
 This variable can be used to force chaise to include a tag in the tag that defines the canonical link for each of the entities and other resource pages.
   - Type: Boolean
   - Default behavior: canonical tag will not be included
   - Sample syntax:
     ```
     includeCanonicalTag: true
     ```

 #### logClientActions
 Set this to `false` to disable the logging of client side actions which occurs when users interact with the app in ways that don't generate a request to the database.
   - Type: Boolean
   - Default behavior: client actions that don't normally interact with the database will be logged
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
   - Sample syntax:
     ```
     configRules: [
         {
             host: ["www.rebuildingakidney.org", "staging.rebuildingakidney.org", "dev.rebuildingakidney.org"],
             config: {
                 headTitle: "RBK",
                 navbarBrand: "/resources/"
             }
         }, {
             host: ["www.gudmap.org", "staging.gudmap.org", "dev.gudmap.org"],
             config: {
                 headTitle: "GUDMAP",
                 navbarBrand: "/"
             }
         }
     ]
     ```

 #### savedQueryConfig
 Use this property to define the path to the saved query table for the saved query feature. The `storageTable` is required to be an object with 3 properties, `catalog`, `schema`, and `table`. This config property defaults to null when undefined. If `savedQueryConfig` is not an object with an object containing all of the above 3 properties, this will be set to `null`. The `defaultName` object has 3 properties that can be defined to change when a simplified default name syntax is applied.
   - Type: Object
   - Default behavior: the saved query feature will be turned off
   - General syntax:
     ```
     savedQueryConfig: {
       storageTable: {
         catalog: <catalog id>
         schema: <schema name>
         table: <table name>
       },
       defaultName: {
           facetChoiceLimit: <int>,
           facetTextLimit: <int>,
           totalTextLimit: <int>,
       }
     }
     ```
   - `storageTable` attributes
     - `catalog`: String - catalog id
     - `schema`: String - schema name
     - `table`: String - table name
   - `defaultName` attributes
     - `facetChoiceLimit`: Set this value to define when to show a compressed facet syntax based on how many choices are selected. By default this value is 5. Set this to 0 to always show the compressed syntax.
     - `facetTextLimit`: Set this value to define when to show a compressed facet syntax based on the total string length of the facet choices when appended together. By default this value is 60. Set this to 0 to always show the compressed syntax.
     - `totalTextLimit`: Set this value to define when to show a shortened facet syntax based on the total string length of all facets text when appended together. By default this value is 200. Set this to 0 to always show the further shortened syntax.
   - Sample syntax:
     ```
     savedQueryConfig: {
        storageTable: {
            catalog: "73448",
            schema: "faceting",
            table: "saved_query"
        },
        defaultName: {
            facetChoiceLimit: 2,
            facetTextLimit: 40,
            totalTextLimit: 150,
        }
     }
     ```

### Other Configuration:
 #### footerMarkdown
 If present, it creates a footer at the bottom of the app with the markdown text.
   - Type: String
   - Default behavior: no footer will be shown
   - Sample syntax:
     ```
     footerMarkdown: "* Please check [Privacy Policy](/privacy-policy/){target='_blank'}"
     ```

 #### assetDownloadPolicyURL
 Set this property to the url that points to the download policy for when an asset is fetched but the user is unauthorized to fetch that asset.
   - Type: String - URL
   - Default behavior: no asset policy link will be shown in the error modal
   - Sample syntax:
     ```
     assetDownloadPolicyURL: "<your url>"
     ```
