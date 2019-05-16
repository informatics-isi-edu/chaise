
# Writing End to End Test Cases

In this section we have summarized all the resources that you need for writing test cases alongside different issues that we have faced. Please make sure to follow the given instructions.

## Test Idioms

Please follow [this link](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/dev-docs/test-idioms.md) to access the Test idioms document. This document includes the best practices for writing test cases in both Chaise and ERMrestJS.

## Test FAQ

You can find the complete list of test FAQs in [here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/dev-docs/test-faq.md).

## Page Object Pattern [chaise.page.js](https://github.com/informatics-isi-edu/chaise/blob/master/test/e2e/utils/chaise.page.js)

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

### Detecting Travis Environment

There're scenarios where you might need to determine which environment are your tests running; TRAVIS or locally. To determine that you can simply refer the variable `process.env.TRAVIS`. If it is true then the environment is Travis else it is something else.

```js
if (process.env.TRAVIS) {
   // DO something Travis specific
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

**NOTE**: Our Travis environment doesn't uses HTTPS for CHAISE. When we setup the cookie we set the secure flag in the path for cookie depending on environment. [Reference](http://resources.infosecinstitute.com/securing-cookies-httponly-secure-flags/#gref)
