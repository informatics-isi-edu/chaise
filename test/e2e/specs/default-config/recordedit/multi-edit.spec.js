var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    schema_name: "multi-edit",
    tables: [
        {
          table_name: "multi-add-table",
          keys: [{ name: "id", value: "1000", operator: "=" },
                   { name: "id", value: "1001", operator: "=" }],
          rows: [
            {
              "int": {"value": "7", "input": "4"},
              "text": {"value": "test text", "input": "modified val"}
            },
            {
              "int": {"value": "12", "input": "66"},
              "text": {"value": "description", "input": "description 2"}
            }
          ],
          results: [
            ["4", "modified val"], 
            ["66", "description 2"] 
          ]
        },
        {
          table_name: "multi-add-table",
          keys: [{ name: "id", value: "1000", operator: "=" },
                   { name: "id", value: "1001", operator: "=" },
                   { name: "id", value: "1002", operator: "=" }],
          rows: [
            {
              "int": {"value": "4", "input": "5"},
              "text": {"value": "modified val", "input": "changed it again"}
            },
            {
              "int": {"value": "66", "input": "768"},
              "text": {"value": "description 2", "input": "description 3"}
            },
            {
              "int": {"value": "34", "input": "934"},
              "text": {"value": "just text", "input": "I am number 3"}
            }
          ],
          results: [
            ["5", "changed it again"],
            ["768", "description 3"],
            ["934", "I am number 3"]
          ]
        }
    ]
    
};

var i, j, k;

/*
{
  table_name: "table_w_multiple_assets",
  hasFile: true
  keys: [{name: "id", value:"1", operator:"="},{name: "id", value:"2", operator:"="}],
  rows: [],
  files: []
}
 */

describe('Edit multiple existing record,', function() {
  
    for (i = 0; i < testParams.tables.length; i++) {
      (function (tableParams, index, schemaName) {
        describe("when the user edits " + tableParams.keys.length + " records at a time " + (tableParams.tableParams? "with files" : "") +", ", function() {

            beforeAll(function () {
                var keys = [];
                tableParams.keys.forEach(function(key) {
                    keys.push(key.name + key.operator + key.value);
                });
                browser.ignoreSynchronization = true;
                browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/"+ schemaName +":" + tableParams.table_name + "/" + keys.join(";"));
            });

            it("should have the table displayname as part of the entity title.", function() {
                // if submit button is visible, this means the recordedit page has loaded
                chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                    expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe("Edit "+ tableParams.table_name +" Records");
                });
            });

            it("should change their values and show a resultset table with " + tableParams.keys.length + " entities.", function() {
              
              chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                  for (j = 0; j < tableParams.rows.length; j++) {
                    var row = tableParams.rows[j];
                    for (var key in row) {
                      var input = chaisePage.recordEditPage.getInputById(j, key);
                      // test current value
                      expect(input.getAttribute("value")).toBe(row[key].value);
                      
                      // change the value
                      chaisePage.recordEditPage.clearInput(input);
                      browser.sleep(10);
                      input.sendKeys(row[key].input);
                      
                      // test that value has changed
                      expect(input.getAttribute("value")).toBe(row[key].input);
                    }
                  }
              });

            });

            describe("Submit " + tableParams.keys.length + " records", function() {
                beforeAll(function(done) {
                    // submit form
                    chaisePage.recordEditPage.submitForm();
                    
                    // Make sure the table shows up with the expected # of rows
                    browser.wait(function() {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return (ct == tableParams.keys.length);
                        });
                    }, browser.params.defaultTimeout);
                    done();
                });

                it("should change the view to the resultset table and verify the count.", function(done) {

                    browser.driver.getCurrentUrl().then(function(url) {
                        expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);
                        done();
                    });
                });
                
                it("should have the correct title with correct uri", function() {
                  
                });
                
                it('should show correct table rows.', function () {
                  chaisePage.recordsetPage.getRows().then(function(rows) {
                      // same row count
                      browser.pause();
                      expect(rows.length).toBe(tableParams.results.length);
                      
                      for (j = 0; j < rows.length; j++) {
                          (function(index) {
                              rows[index].all(by.tagName("td")).then(function (cells) {
                                
                                // same column count
                                expect(cells.length).toBe(tableParams.results[index].length);
                                
                                var result;
                                
                                // cells is what is being shown
                                // tableParams.results is what we expect
                                for (k = 0; k < tableParams.results[index].length; k++) {
                                  result = tableParams.results[index][k];
                                  
                                  if (result.link) {
                                    expect(cells[k].element(by.tagName("a")).getAttribute("href")).toBe(result.link);
                                    expect(cells[k].element(by.tagName("a")).getText()).toBe(result.value);
                                  } else {
                                    expect(cells[k].getText()).toBe(result);
                                  }
                                }
                              });
                              
                          }(j));
                      };
                      
                  });
                });
            });
        });
        
      })(testParams.tables[i], i, testParams.schema_name);
    }
});
