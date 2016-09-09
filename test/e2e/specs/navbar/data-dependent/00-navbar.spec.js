describe('Navbar ', function() {
    var navbar, menu, EC = protractor.ExpectedConditions;
    var expectedMenu = require(process.env.PWD + '/test/e2e/specs/navbar/data-dependent/chaise-config.js').navbarMenu;

    beforeAll(function (done) {
        browser.get(browser.params.url || "");
        // browser.get(process.env.CHAISE_BASE_URL + '/chaise-config.js');
        navbar = element(by.id('mainnav'));
        menu = element(by.id('navbar-menu'));
        browser.wait(EC.presenceOf(navbar), 5000).then(function () {
            done();
        });
    });

    it('should be visible', function() {
        expect(navbar.isDisplayed()).toBeTruthy();
    });

    it('should have generate the correct # of list items', function() {
        // var nodesInDOM = navbar.element(by.id('navbar-menu')).all(by.tagName('li'));
        var nodesInDOM = menu.all(by.tagName('li'));
        var counter = 0;
        function countNodes(array) {
            array.forEach(function(element) {
                counter++;
                if (element.children) {
                    countNodes(element.children);
                }
            });
            return counter;
        }
        countNodes(expectedMenu);

        nodesInDOM.count().then(function(count) {
            expect(count).toEqual(counter);
        });
    });

    it('should display the appropriate dropdowns at the appropriate levels', function() {
        // Assign this array to var navbar_menu inside your local chaise-config.js
        // TODO: Still need to figure out w/ Chirag whether this assignment is necessary..
        var sampleMenu = [
            {
                "name": "Search",
                "url": "/chaise/search/#1/legacy:dataset"
            },
            {
                "name": "RecordEdit",
                "children": [
                    {
                        "name": "Add Records",
                        "children": [
                            {
                                "name": "Edit Existing Record",
                                "url": "/chaise/recordedit/#1/legacy:dataset/id=5776"
                            }
                        ]
                    }
                ]
            }
        ];
        var topLevel = element.all(by.css('ul#navbar-menu > li'));
        topLevel.count().then(function(count) {
            expect(count).toEqual(2);
        });
    });
});
