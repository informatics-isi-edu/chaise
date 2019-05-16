# Developer Guide

This is a guide for people who develop Chaise. Because this is not an exhaustive guide, consider looking through @johnpapa's [Angular 1 style guide](https://github.com/johnpapa/angular-styleguide/tree/master/a1) to understand the spirit and conventions of Angular development. We also have our own [Chaise style guide](https://github.com/informatics-isi-edu/chaise/blob/master/docs/dev-docs/style-guide.md), that explains the use of different libraries (bootstrap) and other HTML and CSS combinations.

## General

### Extracting `common` code
- When writing functionality that can already be found in another part of Chaise, that's usually a good candidate for pulling this functionality out and into the `chaise/common` folder. Instead of refactoring the common functionality out of an app, a good practice is to simply copy the existing functionality into the `common` folder and then have the existing functionality call the code in `chaise/common`. Actual refactoring will occur in a later cycle. This minimizes disruptions to existing apps and encourages code reuse.
- An example: I'm working on a Feature X for the RecordEdit app, and this function has been already been written into the Search app. Instead of duplicating the function in both apps, I copy the code for Feature X from Search into `chaise/common` and genericize the function as necessary. In Data Entry, I simply call the code in `chaise/common` to get Feature X. In Search, the function's body is replaced with a call to the Feature X function in `chaise/common`.

### Session
The Navbar fetches the session object for information to display in the Navbar. Each app needs to also individually fetch the session so that we can make sure the session is available before trying to do anything with the reference.
NOTE: This was causing a race condition before when we were relying on the session being fetched in the navbar and attaching it to $rootScope.


### Use variable vs string in lookup
The purpose of using variables or enumeration is to avoid rewriting (or copy-and-pasting) the same string in multiple places.
- if you have more than one call site in more than one script, then define the variable in the utilities.js script and add it to the module (e.g., module._tag_default = "tag:...default") and it may then be used by code in different ermrestjs scripts (e.g., referencing module._tag_default somewhere). Note that this is not being added to the public interface. Code outside of the various ermrestjs scripts are not intended to use these variables. Hence we follow the underscore prefix convention _variableName, which by convention indicates that the variable should be considered private to the module and clients are at least warned not to use it.
- Example: The `messageMap` constant can be used to store and display user-facing messages in Chaise.

[Ermrestjs#68](https://github.com/informatics-isi-edu/ermrestjs/issues/68) contains detail discussion related to this topic.

### Naming Conventions
There are a few naming conventions that are being used across the apps. This pertains to variables, module names, and file names.
- File names should be written in camel case (camelCase) with identifying information separated by `.` (`*.controller.js`, `*.app.js`, `*.html`).
- Angular modules need to be defined like the following `chaise.*`. Chaise identifies the set of apps it applies to and the `*` is that modules purpose in chaise.
- Service, Factory, Provider, Controller, and other angular classes should be defined with camel case text leading with a capital letter. For example: `ErrorDialogController` is the convention for naming controllers. Don't shorten the text to `ctrl` because we should be using controller as syntax and want to have a more readable structure to our code.
- Variables should follow a similar naming convention using camel case text. Variables and functions that are prefixed with an underscore `_`, should be treated as private variables and used with caution.
- Folder names should be different from file names. Of course folders don't have an extension so it's more apparent that they are folders, but developers should use `-` separated names for folders, i.e. `common\templates\data-link`.

## Angular-related
* Use `controllerAs` syntax instead of `$scope` whenever possible and refrain from using `$rootscope`
* Angular allows for users to define a module and later extend that module with new **services**, **controllers**, **factories**, **providers**, and so on. These other components should be defined in separate files to avoid having one single `*.app.js` file.

### Angular Developer Guides
- [View Templating](https://code.angularjs.org/1.6.9/docs/guide/templates)
- [Data Binding with Templates](https://code.angularjs.org/1.6.9/docs/guide/databinding) ([tutorial](https://www.w3schools.com/angular/angular_databinding.asp))
- [Modules](https://code.angularjs.org/1.6.9/docs/guide/module) ([tutorial](https://www.w3schools.com/angular/angular_modules.asp))
- [Directives](https://code.angularjs.org/1.6.9/docs/guide/directive) ([tutorial](https://www.w3schools.com/angular/angular_directives.asp))
- [Dependency Injection](https://code.angularjs.org/1.6.9/docs/guide/di)
- [Services and Factories](https://code.angularjs.org/1.6.9/docs/guide/services) ([tutorial](https://www.w3schools.com/angular/angular_services.asp))
- [App Bootstrapping](https://code.angularjs.org/1.6.9/docs/guide/bootstrap)

### One-Time Binding
- Use one-time binding for improved performance.
- If you know an Angular expression won't change its value after the first digest (e.g. displaying an ERMrest table name), prepend the binding with `::` to benefit from one-time binding. For more details about this, see the One-Time Binding section of the [doc on Angular expressions](https://docs.angularjs.org/guide/expression).

### Common Config
We have a configuration app that is loaded into the DOM before each of our angular apps to do some setup before attaching the app instance. More info can be found in the [Config app guide](https://github.com/informatics-isi-edu/chaise/blob/master/docs/dev-docs/config-app.md).

## Error Handling

### Guidelines for promise chains

The general guidelines for handling errors in promises are that:
- do not let your handlers "silence" any unhandled errors, _always_ throw an unhandled error so that later catch blocks may handle it;
- even when you do not have any (or any _more_) catch blocks, throw an unhandled error so that the general exception handler service can handle it.
- reject is a callback function that gets carried out after the promise is rejected, whereas throw cannot be used asynchronously. If you chose to use reject, your code will continue to run normally in asynchronous fashion whereas throw will prioritize completing the resolver function (this function will run immediately).

### Promise with success, reject, and catch handlers

One style when working with a single promise is to use success, reject, and "catch" handlers. The `catch` function is just a syntactic sugar for `then(null, function)` where the success handler is not given.

```javascript
promise.then(
  function(result) {
    // this handler will get called if the promise was resolved
    ...
  },
  function(err){
    // this handler will get called if the promise was rejected
    ...
    // as a general practice, conclude by throwing any unhandled error
    throw err;
  }
).catch(
  function(err) {
    // this handler will get called if:
    //   - the success handler threw an exception, or...
    //   - the previous reject handler threw an exception
    // this can be useful for adding some common error handling logic
    // for errors that could be raised by either of the previous handlers
    ...
    // again as a general practice, conclude by throwing unhandled error
    // this will be caught and handled by app-wide exceptionHandler function
    throw err;
  }
);
```

The above convention should run logically like the following:

```python
try:
  resp = http.method()
  if resp.status = 200
    handle_success();
  else
    handle_reject();
except my_errors:
  handle_my_errors();
```

### Promise with success and catch handlers

An alternate style for working with a single promise is to use only success and catch handlers. One advantage of this style is that a single reject handler defined in the `catch` block will handle _both_ a rejected promise or any exceptions thrown by the success block.

```javascript
promise.then(
  function(result) {
    // this handler will get called if the promise was resolved
    ...
  }
).catch(
  function(err) {
    // this handler will get called if:
    //  - the original promise was rejected, OR...
    //  - the success handler threw an exception
    ...
    // as a general practice, conclude by throwing any unhandled error
    throw err;
  }
);
```

### Promise chaining with single catch

One style for handling errors in a promise chain is to first chain all of your success blocks and then conclude with a catch for your particular errors. The advantage of this style is that it is relatively easy to read and is logically similar to a try/catch block that has (depending on the language, one or more) type-specific catch block(s) at the end.

```javascript
promise.then(
  function(result) {
    // handle the first response
    ...
  }
).then(
  function(result) {
    // handle the next response
    ...
  }
).then(
  function(result) {
    // handle the next response
    ...
  }
).catch(
  function(err) {
    // handle any upstream errors from any of the promises being rejected or
    // any exceptions thrown within any of the success handlers.

    // you might want conditional checks for different categories of error
    // conditions. This is actually true of any error handling blocks of course,
    // but in this example it is particularly worth noting.
    if (...) {
      // handle error case 1
      ...
      return; // if you resolved the error, return
    }
    if (...) {
      // handle error case 2
      ...
      return; // if you resolved the error, return
    }
    // if none of the above error handling blocks resolved the error.
    // then make sure to throw the error again, as usual.
    throw err;
  }
);
```

### Promise chaining with interleaved catches

When it is possible to recover from an error, you may want to interleave catch blocks so that subsequent success blocks may execute.

```javascript
promise.then(
  function(result) {
    // handle the first response
    ...
  }
).catch(
  function(err) {
    // handle a recoverable error
    ...

    // if the error could not be recovered from, then you will need to
    // throw the error again so that the next reject/catch handler will
    // process it, and so that it will skip any success handlers.
    throw err;

    // if the error was recovered from, you may need to return something
    // based on what the next success handler expects. Otherwise you can
    // return without a return parameter or technically the function could
    // terminate without any return statement (again, so long as the next
    // success handler is expecting no required parameters). In this example,
    // the next handler expects a result.
    return recovered_result;
  }
).then(
  function(result) {
    // handle the next response
    ...
  }
).then(
  function(result) {
    // handle the next response
    ...
  }
).catch(
  function(err) {
    // handle any upstream errors that were not previously recovered from.
    ...

    // as usual, if the error could not be handled in this block, throw it again.
    throw err;
  }
);
```

### Guideline for $exceptionHandler

The angularJS global exception handler, `$exceptionHandler`, is used as the final catch for exceptions in the `chaise` applications. Any exceptions that need to be handled in a common way should throw and exception and leave it to the angular service to catch them. A function is registered with `$exceptionHandler` to manage how we want general cases to be handled.

### Special Case: $uibModal
The promise used to create an instance of $uibModal is rejected if the user dismisses the modal. Unless you have logic for when the modal is dismissed, there's no need to attach an error callback to this promise. There's also no need to add a `.catch()` because `$exceptionHandler` will handle any errors in the success callback.

### Guidelines for synchronous try/catch blocks

This section is deprecated. We now rely on a registered function with the global exception handler in angular JS ($exceptionHandler).

~~There are essentially two rules here:~~
~~- always be specific about what error conditions you are catching; and~~
~~- make sure that you throw unhandled exceptions.~~

### Guideline for Angular components

Angular has a common exception handler service, `$exceptionHandler`. For reference:
- [Official guide](https://docs.angularjs.org/api/ng/service/$exceptionHandler)
- [Unofficial style guide](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#exception-handling)

Chaise overrides the default implementation of the `$exceptionHandler` service. All or almost all of Chaise should be implemented within the Angular framework and therefore uncaught exceptions from any function, callback, promise chain etc., will be caught and handled by the common `$exceptionHandler` service function.

### Guidelines for non-Angular asynchronous event-handling functions

In general, we should only implement event-handling functions within the Angular framework. However, in the event that we must implement an event-handler outside of Angular, `window.onerror` will handle this.

### Guideline for window.onerror

The `window.onerror` handler may be called by the browser for many error conditions outside of the scope of our applications. There are also known browser compatibility issues at the time of writing this guideline.

### References
- This old article discussed issues with window.onerror. https://danlimerick.wordpress.com/2014/01/18/how-to-catch-javascript-errors-with-window-onerror-even-on-chrome-and-firefox/
- This article summarizes window.onerror support for each browser and provide an example to wrap a function so the exception can be logged. Maybe we can use the same method? https://blog.sentry.io/2016/01/04/client-javascript-reporting-window-onerror.html
