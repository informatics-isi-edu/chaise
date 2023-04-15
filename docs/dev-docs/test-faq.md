# FAQs related to E2E testing using Protractor and Jasmine

***

* **element vs. executeScript**

     > The protractor element selector behaves differently from the executeScript jQuery function in one very important way. With the **element** selector, you get the position of that element on the document by it's x,y coordinates. This has caused some issues with elements getting scrolled behind the navbar that are no longer clickable because the click action targets the navbar. With **executeScript**, you are given the element that you selected rather than the position of that element. This allows actions to be performed on that element when it is hidden behind other elements on the page (maybe because of a scroll event).

* **ignoreSynchronization**

     > The `browser.ignoreSynchronization` option can be set to `true` to force code execution to wait until $http requests have returned from the server. Set this option to false to allow code execution to continue while $http requests are being performed. This is useful for testing if buttons are disabled during code execution.

***

* **Page being automatically reloaded during test ? I am writing test for recordset in Chaise. But after page is loaded, the address bar is updated with extra “/” after “#”.So the original url `http://…/#1234/schema:table` which becomes `http://…/#/1234/schema:table`, and that causes app to throw error.**

     >  This issue has been documented [here](https://github.com/informatics-isi-edu/chaise/issues/582). It happens because of the default angular routing. Protractor depends on it. We are not using the default angular routing in Chaise and Protractor tries to use that when we are changing the location using `browser.get`. For now you just want to get rid of the explicit routing that has been added in your apps.

***

* **Test Failed: "defer.fulfill" is not a function**

    > This is mostyl because of a newer version of the promise library [Q](https://www.npmjs.com/package/q). We have fixed the version to `^1.4.1`. If you face issues with any other modules, just try to fix their version numbers in the `package.json` to the last stable version.

***

* **Installation issues: saying selenium not found or unable to run tests because of selenium issue or some other module issue**

   > Run `make update-webdriver` and make sure the webdriver has been successfuly installed (it might fail on the first attempt if you're connected to VPN).

***

* **Error while clicking a button or finding an element, saying unable to find element/element is not clickable ?**

   > Most of the times when you're trying to look for an element which is rendered as a result of some AJAX or asynchronous operation, you should either wait for it to be rendered or add a delay. Waiting for an element to be visible with a timeout is stable and achievable. This can be done using `browser.wait` and can be seen in action [here](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/specs/record/helpers.js#L195)

****

* **Failed: Error while waiting for Protractor to sync with the page: "[ng:test] no injector found for element argument to getTestability.http://errors.angularjs.org/1.5.5/ng/test**

   > You will get this error when you don't explicitly call `browser.get(browser.params.url || "");` in the beforeAll section of your test-case. You should always have a browser.get as Protractor doesn't understands which page should it run the tests against. You can refer a sample [here](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/specs/navbar/data-dependent/00-navbar.spec.js#L8)
