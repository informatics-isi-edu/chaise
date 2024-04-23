
# Writing Protractor End to End Test Cases

In this section we have summarized all the resources that you need for writing test cases alongside different issues that we have faced. Please make sure to follow the given instructions.

## Useful Links

Protractor uses [Jasmine](http://jasmine.github.io/) for its test syntax. As in unit testing, a test file is comprised of one or more `it` blocks that describe the requirements of your application. `it` blocks are made of *commands* and *expectations*. Commands tell Protractor to do something with the application such as navigate to a page or click on a button. Expectations tell Protractor to assert something about the application's state, such as the value of a field or the current URL.

Check out the [Angular Docs](https://docs.angularjs.org/guide/e2e-testing) for more on testing your Angular app with Protractor. See the [Protractor docs](https://angular.github.io/protractor/#/tutorial) for more information on Protractor as well.

There is also an [Angular testing cheat sheet](https://spagettikoodi.wordpress.com/2015/01/14/angular-testing-cheat-sheet/) that will help you get around the syntax for assertions.

There're tons of features that Protractor supports but here we are going to discuss one which allows for data creation utilities.

## Test Idioms

- Try to keep your schema definitions as simple as possible. It only needs to cover the cases that you want to test. Avoid duplicating other existing schemas/tables.
- Don't rely on ERMrestJS heuristics for the parts of the code that you are not testing, and define annotations. The heuristics change more regularly than the annotation won't. For example if you are testing the presentation of record app, define your own visible-columns and visible-foreignkeys annotation.
- Be specific about the scenario that you are testing. If you want to test a very specific scenario, you don't have to test all the other features. For instance, if you want to test recordset page in a specific scenario, you don't have to test all the facet data and main data (The more general case should already be tested and should be separate from this specific test).
- Use names that describe the situation you are trying to recreate. For instance if you are testing the annotations and you want to create a table with annotation 'x' just name the table `table_w_x`. This way we can easily look at the schema and understand which cases are covered in that schema.
- If your test case is related to one of the currently implemented test specs,
	- If they can share the same schema, you can modify its schema to cover your case too and add your test case to the corresponding test spec (Instead of creating a new configuration and test spec).
	- (More applicable in ERMrestJS)Although it's preferable to not modify other schemas and create your very own schema that covers some specific test cases.
- If you have multiple expect in your `it`, make sure they have their own error message.

- Separate specific test cases into different `it` functions.
	- In E2E tests you might find some test units that are huge, previously they were written that way because of the promise chaining. But you actually can break the chain, and resume again in the next spec. To do so, you should use `done`. Use your judgement on when you should break the test into different `it`s.
		```javascript
		// before breaking the chain:

		it ("test", function () {
		   doTest().then(function () {
			  // test feature 1
			  return doOne();
		   }).then(function () {
			  // test feature 2 that is dependent on feature 1
			  return doTwo();
		   }).then(function () {
			  // test feature 3 that is dependent on feature 2
			  return doThree();
		   }).then(function () {
		      // test feature 4
		   }).catch(function () {
			  console.log("something bad happened");
		   });
		});

		// the better version:

		it ("test1", function (done) {
		   doTest().then(function () {
			  // test feature 1
			  return doOne();
		   }).then(function () {
			  // test feature 2
			  return doTwo();
		   }).then(function () {
			  done();
		   }).catch(function (err) {
			  done.fail(err);
		   });
		});

		it ("test2", function (done) {
		   doTest().then(function () {
			  // test feature 3
			  return doThree();
		   }).then(function () {
			  // test feature 4
			  done();
		   }).catch(function (err) {
			  done.fail(err);
		   });
		});
		```

## Test FAQ


- **element vs. executeScript**

  - The protractor element selector behaves differently from the executeScript jQuery function in one very important way. With the **element** selector, you get the position of that element on the document by it's x,y coordinates. This has caused some issues with elements getting scrolled behind the navbar that are no longer clickable because the click action targets the navbar. With **executeScript**, you are given the element that you selected rather than the position of that element. This allows actions to be performed on that element when it is hidden behind other elements on the page (maybe because of a scroll event).

- **ignoreSynchronization**

  - The `browser.ignoreSynchronization` option can be set to `true` to force code execution to wait until `$http` requests have returned from the server. Set this option to false to allow code execution to continue while $http requests are being performed. This is useful for testing if buttons are disabled during code execution.

- **Page being automatically reloaded during test ? I am writing test for recordset in Chaise. But after page is loaded, the address bar is updated with extra “/” after “#”.So the original url `http://…/#1234/schema:table` which becomes `http://…/#/1234/schema:table`, and that causes app to throw error.**

  - This issue has been documented [here](https://github.com/informatics-isi-edu/chaise/issues/582). It happens because of the default angular routing. Protractor depends on it. We are not using the default angular routing in Chaise and Protractor tries to use that when we are changing the location using `browser.get`. For now you just want to get rid of the explicit routing that has been added in your apps.

- **Test Failed: "defer.fulfill" is not a function**

  - This is mostyl because of a newer version of the promise library [Q](https://www.npmjs.com/package/q). We have fixed the version to `^1.4.1`. If you face issues with any other modules, just try to fix their version numbers in the `package.json` to the last stable version.

- **Installation issues: saying selenium not found or unable to run tests because of selenium issue or some other module issue**

  - Run `make update-webdriver` and make sure the webdriver has been successfuly installed (it might fail on the first attempt if you're connected to VPN).

- **Error while clicking a button or finding an element, saying unable to find element/element is not clickable ?**

  - Most of the times when you're trying to look for an element which is rendered as a result of some AJAX or asynchronous operation, you should either wait for it to be rendered or add a delay. Waiting for an element to be visible with a timeout is stable and achievable. This can be done using `browser.wait` and can be seen in action [here](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/specs/record/helpers.js#L195)


- **Failed: Error while waiting for Protractor to sync with the page: "[ng:test] no injector found for element argument to getTestability.http://errors.angularjs.org/1.5.5/ng/test**

  - You will get this error when you don't explicitly call `browser.get(browser.params.url || "");` in the beforeAll section of your test-case. You should always have a browser.get as Protractor doesn't understands which page should it run the tests against. You can refer a sample [here](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/specs/navbar/data-dependent/00-navbar.spec.js#L8)


## Page Object Pattern [chaise.page.js](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/utils/protractor/chaise.page.js)

To write the tests, usually one has to first find the DOM elements on the page, then perform some actions on the elements, finally expect (assert) the correct result will show up. There are two logics here, DOM finding and expectation. To separate concerns, most DOM finding logic is put into a **Page Object** file "chaise.page.js". So in ".spec.js" files where the tests (expectations) are written, more effort can be focused on the expectation logic.

## Expectations

Expectations should use [Jasmine matchers](https://jasmine.github.io/api/2.6/matchers.html). One thing to note with matchers is that a custom message can be attached to each matcher, `expect(value).toBe(expected_value, failure message)`. This should be done as often as possible to provide a point of contact to look at when debugging errors in test cases.


## Expected Conditions

When writing tests, there will be times where the spec will attempt to run before the elements are available in the DOM. Having tests fail because an element isn't visible has been a sporadic but common enough issue. Protractor has a library called [Expected Conditions](http://www.protractortest.org/#/api?view=ProtractorExpectedConditions) that allows for waiting for a certain part of the DOM to be available before continuing to run tests.


## Clicking Elements

Whenever you want to click an element, make sure that you don't trigger the click function on the element directly. This is because, if the element is not in the sight of browser, it will err out saying unable to find the element and will never get clicked.

A workaround for this situation is to scroll the page to the element position and then click. `chaise.page.js` has a function to do this. It accepts a WebElement

```js

var chaisePage = require('chaise.page.js');

var elem = element.all(by.css('.add-button')).first();

chaisePage.clickButton(elem);

```

## Synchronization Issues

Currently Chaise is not using Angular router, thus we can't use Protractor [Synchronization](https://github.com/angular/protractor/blob/9891d430aff477c5feb80ae01b48356866820132/lib/protractor.js#L158).

Setting it to `true` means that subsequent additions/injections to the the control flow don't also add browser.waitForAngular.

Synchronization makes protractor wait for Angular promises to resolve and causes the url's to be scrambled. Chaise uses the `#` delimiter to determine url parameters to be sent to Ermrest. Thus, enabling synchronization, changes the url, appending an extra / after the `#` symbol.

Thus a correct url like this
`https://dev.isrd.isi.edu/chaise/record/#1/legacy:dataset/id=1580`

changes to

`https://dev.isrd.isi.edu/chaise/record/#/1/legacy:dataset/id=1580`

Thus, the parser is unable to parse it. To avoid this we simply disable synchronization in the start of testcases.

```js
beforeAll(function () {
	browser.ignoreSynchronization=true;
	browser.get(browser.params.url);
});
```

## Waiting For Elements To Be Visible

Disabling synchronization has its own issues. Protractor by default waits for the Angular to be done with displaying data or complete http call. With disabled synchronization we need to add logic to handle situations which need the page/element/data to be visible before running the asserts.

In such cases you might just be tempted to put in a `browser.sleep(2000)` to allow everything to get back on track.

You shouldn't be using `browser.sleep` functions as they are brittle. Sleeps put your tests at the mercy of changes in your test environments (network speed, machine performance etc). They make your tests slower. From a maintainability point of view they are ambiguous to someone else reading your code. Why were the put there? Is the sleep long enough? They are an acceptance that you don't really know what is going on with your code and in my opinion should be banned (or at least you should try your best to resist the quick win they give you!).

A simple workaround is to use [browser.wait](http://www.protractortest.org/#/api?view=webdriver.WebDriver.prototype.wait) in conjunction with other parameters such as a timeout/element/variable/functions.

To wait for elements to be visible/rendered we can simply use following syntax

```js
chaisePage.waitForElement(element(by.id("some-id"), 5000).then(function() {
   console.log("Element found");
}, function(err) {
   console.log("Element not found");
});
```

## Waiting For Url To Change

This can be useful when you want to wait for the URL to change in case of form submissions or link clicks.

```js
var url = "http://dev.isrd.isi.edu/chaise/search";
chaisePage.waitForUrl(url, 5000).then(function() {
   console.log("Redirected to url");
}, function(err) {
   console.log("Unable to redirect to url");
});
```

### Detecting CI Environment

There're scenarios where you might need to determine which environment are your tests running; CI or locally. To determine that you can simply refer the variable `process.env.CI`. If it is true then the environment is CI else it is something else.

```js
if (process.env.CI) {
   // DO something CI specific
} else {
  // DO something specific to local environment
}
```

### Setting Webauthn Cookies in Test Cases

You can always change the user authentication cookie in your tests. To do so, first you need to have the **webauthn** cookie.

Now you need to put this code in your test to set the cookie and then redirect the user to specific page on success. The `performLogin(cookie)` function accepts a cookie and returns a promise. On successful completion of login the promise is resolved.

```js
var chaisePage = require('YOU_PATH/chaise.page.js');

describe("Setting Login cookie", function() {
   beforeAll(function(done) {
      chaisePage.performLogin(COOKIE).then(function() {
         // Successfully set the user cookie
         // Add your code to redirect the user to another page on beforeAll
      }, function(err) {
         // Unable to set the cookie
      });
   });
});

});
```

You should try to put the performLogin function inside an `it` statement or `beforeAll`/`beforeEach` statement, so that it is executed in the flow of test.

**NOTE**: Our CI environment doesn't uses HTTPS for CHAISE. When we setup the cookie we set the secure flag in the path for cookie depending on environment. [Reference](http://resources.infosecinstitute.com/securing-cookies-httponly-secure-flags/#gref)

## Asynchronous actions

Currently the asynchronous actions are implemented with promise manager of Selenium.
The alternate approach to this can be the use of `async/await`.

We shouldn't be using both the approaches together as the behaviour is unpredicatable. For adding `async/await` couple of things to keep in mind:
1. Make sure you disabled control flow / promise manager. Mixing awaits with enabled control flow may lead to unpredictable results.
2. Do not forget to prepend ALL your async actions with await (usually this is all protractor api methods). If you will forgot to do this - action without await won't be queued with other actions, so order of actions will be broken. [Source](https://stackoverflow.com/questions/44691940/explain-about-async-await-in-protractor/44701633#44701633)

**NOTE**: Currently `async/await` is only used for viewport in [deriva-webapps](https://github.com/informatics-isi-edu/deriva-webapps/blob/c7ca3e890c7bf73b23c49ac4cbff5ee2733fa93c/test/e2e/utils/common/deriva-webapps.js#L73).

