// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features with Delete Confirmation Dialog",
    editRecord: true,
    deleteRecord: true,
    CONFIRMDELETE: false, //testing case-insensitive properties
    confirmDelete: true, //testing case-insensitive properties, this one is used over the previous one
    dataBrowser: '/',
    deFAuLtCaTAlog: 1, //testing case-insensitive properties
    maxRecordsetRowHeight: false, // triggers (ignores) some logic in ellipsis.js. Tests view buttons having proper links
    allowErrorDismissal : true,
    resolverImplicitCatalog: 2, // in parallel config mode, this config is used first with catalog Id
    systemcolumnsdisplaycompact: ['RCB', 'RMT'], //testing case-insensitive properties
    SystemColumnsDisplayDetailed: true, //testing case-insensitive properties
    systemColumnsDisplayENTRY: ['RCB', 'RMB', 'RMT'], //testing case-insensitive properties
    disableExternalLinkModal: true,
    logClientActions: false,
    footerMarkdown:"**Please check** [Privacy Policy](/privacy-policy/){target='_blank'}",
    defaultTables: {
        "1": {
            "schema": "isa",
            "table": "dataset"
        }
    },
    shareCiteAcls: {
        show: ["*"],
        enable: ["*"]
    },
    loggedInMenu: {
        menuOptions: [
            // override my profile name
            { nameMarkdownPattern: "User Profile", type: "my_profile" },
            { nameMarkdownPattern: "More Links (broken)", type: "menu", children: []},
            { nameMarkdownPattern: "More Links", type: "menu", children: [
                { nameMarkdownPattern: "Nested Profile (broken)", type: "url" },
                { nameMarkdownPattern: "Nested Profile Link", urlPattern: "/chaise/record/#registry/CFDE:user_profile/id={{#encode $session.client.id}}{{/encode}}", type: "url" },
            ]},
            { nameMarkdownPattern: "Disabled Link", acls: { enable: []}, urlPattern: "/chaise/record/#registry/CFDE:user_profile/id={{#encode $session.client.id}}{{/encode}}", type: "url" },
            { nameMarkdownPattern: "Logout", type: "logout" }
        ],
        displayNameMarkdownPattern: "{{{$session.client.display_name}}}"
    },
    // configuration for navbar spec with no logo or brand text
    headTitle: 'show me on the navbar!',
    navbarBanner: [
        {
            markdownPattern: "banner 1",
            dismissible: true,
            key: "banner-1-custom-key"
        },
        {
            markdownPattern: "banner 2",
            key: "banner-2-custom-key"
        },
        {
            markdownPattern: "banner 3 (hidden)",
            acls: {
                show: []
            },
            key: "banner-3-custom-key"
        },
        {
            markdownPattern: "banner 4",
            dismissible: true,
            position: "bottom",
            key: "banner-4-custom-key"
        }
    ],
    navbarMenu: {
       children: [
           {
               name: "Search",
               url: "/chaise/search/#1/isa:dataset"
           },
           {
               name: "RecordSets",
               children: [
                   {
                       name: "Dataset",
                       url: "/chaise/recordset/#{{$catalog.id}}/isa:dataset"
                   },
                   {
                       name: "File",
                       url: "/chaise/recordset/#1/isa:file"
                   }
               ]
           },
           {
               name: "RecordEdit",
               children: [
                   {
                       name: "Add Records",
                       newTab: false,
                       children: [
                           {
                               name: "Edit Existing Record",
                               url: "/chaise/recordedit/#1/isa:dataset/id=5776",
                           }
                       ]
                   }
               ]
           }
       ]
   }
};

if (typeof module === 'object' && module.exports && typeof require === 'function') {
    exports.config = chaiseConfig;
}
