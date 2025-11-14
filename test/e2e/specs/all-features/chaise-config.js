// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features",
    editRecord: true,
    deleteRecord: true,
    // configuration for navbar spec with base condig
    navbarBrand: '/testpage/',
    navbarBrandImage: '../images/genetic-data.png',
    navbarBrandText: 'test123',
    headTitle: 'this one should be ignored in favor of navbarBrandText',
    // config for biewer spec
    customCSS: '/path/to/custom/css',
    resolverImplicitCatalog: null,
    disableDefaultExport: true,
    disableExternalLinkModal: true,
    showWriterEmptyRelatedOnLoad: false,
    facetPanelDisplay: {
        open: ["compact/select/association"]
    },
    logClientActions: false,
    hideRecordeditLeaveAlert: true,
    templating: {
      site_var: {
        groups: {
          'testers': 'https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d'
        }
      }
    },
    navbarMenu: {
        children: [
            {
                name: "Search",
                url: "/chaise/search/#1/isa:dataset"
            },
            {
                name: "Recordsets",
                // tests markdownName is prefered
                markdownName: "Test Recordsets",
                children: [
                    {
                        name: "Dataset",
                        url: "/chaise/recordset/#1/isa:dataset"
                    },
                    {
                        name: "File",
                        url: "/chaise/recordset/#1/isa:file"
                    }
                ]
            },
            {
                name: "Records",
                url: "/chaise/search/#1/isa:dataset",
                acls: {
                    show: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d"],
                    enable: []
                }
            },
            {
                // should bold value instead of showing ** before and after
                markdownName: "**Recordedit**",
                children: [
                    {
                        name: "For Mutating Data",
                        header: true
                    },
                    {
                        name: "Add Records",
                        url: "/chaise/recordedit/#1/isa:dataset",
                        acls: {
                            show: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d"],
                            enable: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d"]
                        }
                    },
                    {
                        nameMarkdownPattern: "Edit Existing Record {{#if (isUserInAcl $site_var.groups.testers)}}(tester){{/if}}",
                        url: "/chaise/recordedit/#1/isa:dataset/id=5776",
                        newTab: false,
                        acls: {
                            show: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d"],
                            enable: []
                        }
                    },
                    {
                        name: "Edit Records",
                        newTab: false,
                        acls: {
                            show: ["https://auth.globus.org/9d596ac6-22b9-11e6-b519-22000aef184d"],
                            enable: []
                        },
                        children: [
                            {
                                name: "Edit Record 1200",
                                url: "/chaise/recordedit/#1/isa:dataset/id=1200",
                                newTab: false
                            },
                            {
                                name: "Edit Record 1201",
                                url: "/chaise/recordedit/#1/isa:dataset/id=1201",
                                newTab: false
                            }
                        ]
                    },
                    {
                        name: "Help with Editing",
                        url: "mailto:support@isrd.isi.edu.test",
                        newTab: true
                    },
                    {
                        name: "No Show",
                        url: "/chaise/record/#1/isa:dataset/id=404",
                        newTab: false,
                        acls: {
                            show: [],
                            enable: []
                        }
                    }
                ]
            }
        ]
    },
    asciiTextValidation: true,
   hideGoToSnapshot: true,
};
