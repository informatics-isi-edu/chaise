/* stackoverflow dynamic-content-single-page-application-seo */
var page = require('webpage').create(),
    system = require('system');
    // server = require('webserver').create();

// don't need phantomJS server here since we are relying on express web server in express_web.js
// var service = server.listen(3000, function (request, response) {
    var lastReceived = new Date().getTime();
    var requestCount = 0;
    var responseCount = 0;
    var requestIds = [];
    var startTime = new Date().getTime();

    page.onResourceReceived = function (response) {
        if(requestIds.indexOf(response.id) !== -1) {
            lastReceived = new Date().getTime();
            responseCount++;
            requestIds[requestIds.indexOf(response.id)] = null;
        }
    };
    page.onResourceRequested = function (request) {
        if(requestIds.indexOf(request.id) === -1) {
            requestIds.push(request.id);
            requestCount++;
        }
    };

    // Open the page
    page.open("https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Gene_Expression:Specimen/RID=N-GXA4", function (status) {
    // page.open(system.args[1], function (status) {
        if (status !== 'success') {
            console.log('Unable to post!');
        } else {
            response.statusCode = 200;
            response.headers = {
                'Cache': 'no-cache',
                'Content-Type': 'text/plain;charset=utf-8'
            };
            // TODO: do something on the page and generate `result`
            response.write();
            response.close();
        }
    });
    var checkComplete = function () {
        // Once all requests finish, we wait 5 seconds before stopping the check
        // don't return until all requests are finished
        if((new Date().getTime() - lastReceived > 5000 && requestCount === responseCount))  {
            clearInterval(checkCompleteInterval);
            console.log(page.content);
            phantom.exit();
        }
    }
    // Let us check to see if the page is finished rendering
    var checkCompleteInterval = setInterval(checkComplete, 1);
// });
