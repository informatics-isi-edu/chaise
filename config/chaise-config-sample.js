// Configure deployment-specific data here

var chaiseConfig = {
    name: "Sample",
    defaultCatalog: "1",
    resolverImplicitCatalog: "1",
    allowErrorDismissal: true,
    confirmDelete: true,
    headTitle: 'Chaise',
    customCSS: '/assets/css/chaise.css',
    navbarBrand: '/',
    navbarBrandImage: null,
    logoutURL: '/image-annotation',
    // signUpURL: '', The URL at a which a user can create a new account
    dataBrowser: '',
    shareCite: {
        acls: {
          show: ["*"],  // [] <- hide
          enable: ["*"] // [] <- disable
        }
    },
    editRecord: true,
    deleteRecord: true,
    maxRecordsetRowHeight: 160,
    navbarBanner: [
        {
            markdownPattern: "This is a development version of Chaise",
            // // to make the banner dismissible:
            // dismissible: true,
            // // to ensure showing the banner only to certain users:
            // acls: {
            //     show: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d"],
            // },
            // // to make sure banner is added below the banner (by default it will be added to top):
            // position: "bottom",
            // // (optional) a class name using `chaise-navbar-banner-container-<key>` will be added to the banner container
            // // to allow CSS customizations
            // key: "some-custom-name"
        }
    ],
    navbarMenu: {
        // The optional newTab property can be defined at any level. If undefined at root, newTab is treated as true
        // Each child menu item checks for a newTab property on itself, if nothing is set, the child inherits from it's parent.
        newTab: true,
        children: [
            // {
            //     // This "Search" menu item has 2 nested dropdowns.
            //     // Use the "name" key to label a menu item.
            //     // Use the "children" key to specify dropdowns; you can nest as many dropdowns as you need.
            //     nameMarkdownPattern: "Search",
            //     children: [
            //         {
            //             nameMarkdownPattern: "Search 1",
            //             children: [
            //                 {
            //                     nameMarkdownPattern: "Search 1.1",
            //                     urlPattern: "/chaise/recordset/#1/YOUR_SCHEMA:YOUR_TABLE"
            //                 }
            //             ]
            //         }
            //     ]
            // },
            // {
            //     // This "Create" menu item doesn't have any dropdowns.
            //     // Use the "url" key to specify this menu item's url
            //     // URLs can be absolute or relative to the document root.
            //     nameMarkdownPattern: "Create",
            //     urlPattern: "/chaise/recordedit/#1/YOUR_SCHEMA:YOUR_TABLE",
            //     // Define globus groups or users that can see and and be able to click the link or navigate the submenu
            //     // If either array, `show` or `enable`, or both are missing, `["*"]` will be used as the default
            //     // An empty array (`[]`) will hide the link or disable it for everyone
            //     acls: {
            //          show: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d", ...],  // isrd-testers group
            //          enable: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d", ...]
            //      }
            // },
            // {
            //     // URLs support templating primarily for catalog substition
            //     nameMarkdownPattern: "Create",
            //     urlPattern: "/chaise/recordedit/#{{$catalog.snapshot}}/YOUR_SCHEMA:YOUR_TABLE"
            // },
            // {
            //     // set header to true to create an unclickable bold menu option with class `chaise-dropdown-header`
            //     nameMarkdownPattern: "A header",
            //     type: "header"
            // }
        ]
    },
    footerMarkdown: "**Please check** [Privacy Policy](/privacy-policy/){target='_blank'}",
    configRules: [
        {
            host: ["www.rebuildingakidney.org", "staging.rebuildingakidney.org", "dev.rebuildingakidney.org"], // array of host names
            config: {
                headTitle: "RBK/GUDMAP",
                navbarBrand: "/resources/"
            }
        }, {
            host: ["www.gudmap.org", "staging.gudmap.org", "dev.gudmap.org"], // array of host names
            config: {
                headTitle: "GUDMAP/RBK",
                navbarBrand: "/"
            }
        }
    ],
    templating: {
        engine: 'handlebars'
    }
};
