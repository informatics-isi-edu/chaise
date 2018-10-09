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
    maxRelatedTablesOpen: 8,
    resolverImplicitCatalog: false,
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
                name: "RecordEdit",
                children: [
                    {
                        name: "Add Records",
                        url: "/chaise/recordedit/#1/isa:dataset",
                        children: [
                            {
                                name: "Edit Existing Record",
                                url: "/chaise/recordedit/#1/isa:dataset/id=5776",
                                newTab: false
                            }
                        ]
                    }
                ]
            }
        ]
    }
};
