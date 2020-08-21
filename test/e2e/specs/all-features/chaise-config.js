// Configure deployment-specific data here

var chaiseConfig = {
    name: "All Features",
    editRecord: true,
    deleteRecord: true,
    // configuration for navbar spec with base condig
    navbarBrand: 'test123',
    navbarBrandImage: '../images/genetic-data.png',
    navbarBrandText: 'test123',
    headTitle: 'this one should be ignored in favor of navbarBrandText',
    // config for biewer spec
    customCSS: '/path/to/custom/css',
    maxRelatedTablesOpen: 11,
    resolverImplicitCatalog: null,
    disableDefaultExport: true,
    disableExternalLinkModal: true,
    logClientActions: false,
    navbarMenu: {
        children: [
            {
                name: "Search",
                url: "/chaise/search/#1/isa:dataset"
            },
            {
                name: "Recordsets",
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
                name: "RecordEdit",
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
                        name: "Edit Existing Record",
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
    }
};
