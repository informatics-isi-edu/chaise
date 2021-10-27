# Developer Guide

This is a guide for people who develop Chaise.  We also have our own [Chaise style guide](https://github.com/informatics-isi-edu/chaise/blob/master/docs/dev-docs/style-guide.md), that explains the use of different libraries (bootstrap) and other HTML and CSS combinations.

## Table of Contents
- [CSS and SASS](#css-and-sass)
  - [Useful links](#useful-links)
  - [SCSS structure](#scss-structure)
  - [Idioms](#idioms)
- [AngularJS-related](#angularjs-related)
  * [AngularJS Developer Guides](#angularjs-developer-guides)
  * [One-Time Binding](#one-time-binding)
- [General](#general)
  * [Extracting `common` code](#extracting-common-code)
  * [Session](#session)
  * [Use variable vs string in lookup](#use-variable-vs-string-in-lookup)
  * [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)
  * [Guidelines for promise chains](#guidelines-for-promise-chains)
  * [Promise with success, reject, and catch handlers](#promise-with-success-reject-and-catch-handlers)
  * [Promise with success and catch handlers](#promise-with-success-and-catch-handlers)
  * [Promise chaining with single catch](#promise-chaining-with-single-catch)
  * [Promise chaining with interleaved catches](#promise-chaining-with-interleaved-catches)
  * [How It Works](#how-it-works)
- [Config App](#config-app)

## CSS and SASS

As part of your task you might need to modify some of the existing styles or add new ones.

### Useful links
To make sure you're familiar with both CSS and SASS. The following are some guides that you can use:
  - [W3schools CSS tutorial](https://www.w3schools.com/css/): this is a good starting point for refreshing your CSS knowledge.
  - [MDN CSS reference](https://developer.mozilla.org/en-US/docs/Web/CSS): a very thorough CSS reference that you can use to learn more about different CSS features.
  - [caniuse.com](https://caniuse.com/): can be used to quickly figure out if a feature can be used based on our browser support or not.
  - [Sass basics](https://sass-lang.com/guide): a very good starting point for learning Sass basics (we're using SCSS syntax.)
  - [Guide to Chrome DevTools](https://www.keycdn.com/blog/chrome-devtools): Very useful for CSS debugging.
  - [Glyph-icons](https://css-tricks.com/snippets/html/glyphs/) : An amazing comprehensive guide to include any glyphs in your css code
  - [CSS Printing Guide - 1](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/) : A-Z about CSS print rules
  - [CSS Printing Guide - 2](https://www.smashingmagazine.com/2015/01/designing-for-print-with-css/) : Essentials for CSS Print rules
    (part - 2)
  - [Overriding inline styles](https://css-tricks.com/override-inline-styles-with-css/) : Inline styles have the highest priority but they
    too can be overwritten when the element is accessed as shown in the document.
  - [Important Information on CSS position](https://css-tricks.com/almanac/properties/p/position/) : Adding scrolling to a collapsible navbar can be
    tricky. This link explains how you can add scrolling without affecting any level of dropdown menus.
  - [Calculating position of element](https://javascript.info/size-and-scroll) : This link gives an in-depth understanding of how we can manually
    calculate the position of any element dynamically in the DOM

### Useful CSS rules
How each browser renders printing styles is different from the other. Mac and Windows behave differently for the same browser type (Firefox, Chrome, etc). Hence we need to keep in mind the following while writing print rules in css.

  - If table borders or other line elements are not visible in the print preview or the PDF, check if there exists any overriding
    bootstrap rules. These bootstrap rules could be a `background-color`, `background-border`, etc. and they always take precedence over the custom css rules that are defined in the @media-print section of the css file.

  - If yes, then we must override those rules with `!important` to get the desired effect.

  - A new class has been defined to apply custom styling to the case of Firefox browser in combination with MacOs which can be found here
    : (https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/custom-css.md)

  - Use the print mode in the rendering tab to see how the document looks when printed in Chrome browser. On Firefox, this can be achieved
    by clicking on a small page icon in the "Inspect Element mode".

  - The print preview that is seen when doing a `Ctrl-P` on Windows or a `Cmd-P` on Mac doesn't necessarily give you the right picture of
    the document to be printed. To view what will be printed, either save to PDF file or chose to switch to the 'Print mode' as described above.

  - Scrolling can be persisted by using the `scrolling : scroll` option.

### SCSS structure

Since we're using Sass3+, we're using the SCSS syntax. On of the advantages of Sass in general is the fact that you can easily break your stylesheets into different sections and then merge them together. In Chaise, the `*.scss` files that start with `_` are not meant to be on their own and are only meant to be included (imported) in other files. These files are generally supposed to cover a well-contained feature of UI element. For example `_buttons.scss` contains all the styles related to buttons. The main file that will be compiled in the end is `app.scss` which will be compiled into `app.css` and used in Chaise. You don't need to compile the file manually yourself as make commands will do that automatically for you.

### Idioms

If you want to add a new style, make sure you're following these rules:

- It's better if you use classes instead of ids for writing css rules.
- Use `-` to break the words in your name. Avoid using camelCase or `_`.
- Follow the indentation that the file has. Don't mix different indentations together.
- Use names that are meaningful and can be easily understood without knowing the whole page. Try to convey what an ID or class is about while being as brief as possible.
- Avoid adding duplicated rules. If there's a rule in a file that is applied to the element that you're trying to add a new style to, add it there.
- Avoid using `!important` as much as you can (Unless there's a bootstrap rule that you're trying to override.)
- Comment your rule to make it easier for others to figure out why a rule was added.
- If you're doing some calculations don't just use the end result. Right the calculations so later we can easily figure out why you chose that value.
- Use variables if you're using the same value more than once and these values should be the same all the times (Just because you're using value `10` in two different rules doesn't mean they should share the same variable. Use a variable if these two rules MUST be using the same value. So if later you changed one to `20`, the other one should be updated as well).


## AngularJS-related

Because this is not an exhaustive guide, consider looking through @johnpapa's [AngularJS style guide](https://github.com/johnpapa/angular-styleguide/tree/master/a1) to understand the spirit and conventions of AngularJS development. The following are a few notable points that should be followed:

* Use `controllerAs` syntax instead of `$scope` whenever possible and refrain from using `$rootscope`
* AngularJS allows for users to define a module and later extend that module with new **services**, **controllers**, **factories**, **providers**, and so on. These other components should be defined in separate files to avoid having one single `*.app.js` file.

### AngularJS Developer Guides

- [View Templating](https://code.angularjs.org/1.6.9/docs/guide/templates)
- [Data Binding with Templates](https://code.angularjs.org/1.6.9/docs/guide/databinding) ([tutorial](https://www.w3schools.com/angular/angular_databinding.asp))
- [Modules](https://code.angularjs.org/1.6.9/docs/guide/module) ([tutorial](https://www.w3schools.com/angular/angular_modules.asp))
- [Directives](https://code.angularjs.org/1.6.9/docs/guide/directive) ([tutorial](https://www.w3schools.com/angular/angular_directives.asp))
- [Dependency Injection](https://code.angularjs.org/1.6.9/docs/guide/di)
- [Services and Factories](https://code.angularjs.org/1.6.9/docs/guide/services) ([tutorial](https://www.w3schools.com/angular/angular_services.asp))
- [App Bootstrapping](https://code.angularjs.org/1.6.9/docs/guide/bootstrap)

### One-Time Binding
- Use one-time binding for improved performance.
- If you know an AngularJS expression won't change its value after the first digest (e.g. displaying an ERMrest table name), prepend the binding with `::` to benefit from one-time binding. For more details about this, see the One-Time Binding section of the [doc on AngularJS expressions](https://docs.angularjs.org/guide/expression).

## General

### Extracting `common` code
- When writing functionality that can already be found in another part of Chaise, that's usually a good candidate for pulling this functionality out and into the `chaise/common` folder. Instead of refactoring the common functionality out of an app, a good practice is to simply copy the existing functionality into the `common` folder and then have the existing functionality call the code in `chaise/common`. Actual refactoring will occur in a later cycle. This minimizes disruptions to existing apps and encourages code reuse.
- An example: I'm working on a Feature X for the RecordEdit app, and this function has been already been written into the Search app. Instead of duplicating the function in both apps, I copy the code for Feature X from Search into `chaise/common` and genericize the function as necessary. In Data Entry, I simply call the code in `chaise/common` to get Feature X. In Search, the function's body is replaced with a call to the Feature X function in `chaise/common`.

### Session
The Navbar fetches the session object for information to display in the Navbar. Each app needs to also individually fetch the session so that we can make sure the session is available before trying to do anything with the reference.
NOTE: This was causing a race condition before when we were relying on the session being fetched in the navbar and attaching it to $rootScope.


### Use variable vs string in lookup
The purpose of using variables or enumeration is to avoid rewriting (or copy-and-pasting) the same string in multiple places.
- if you have more than one call site in more than one script, then define the variable in the utilities.js script and add it to the module (e.g., module._tag_default = "tag:...default") and it may then be used by code in different ERMrestJS scripts (e.g., referencing module._tag_default somewhere). Note that this is not being added to the public interface. Code outside of the various ERMrestJS scripts are not intended to use these variables. Hence we follow the underscore prefix convention (\__variableName_), which by convention indicates that the variable should be considered private to the module and clients are at least warned not to use it.
- Example: The `messageMap` constant can be used to store and display user-facing messages in Chaise. [ERMrestJS#68](https://github.com/informatics-isi-edu/ermrestjs/issues/68) contains detail discussion related to this topic.

### Naming Conventions

#### Chaise
There are a few naming conventions that are being used across the apps. This pertains to variables, module names, and file names.
- File names should be written in camel case (camelCase) with identifying information separated by `.` (`*.controller.js`, `*.app.js`, `*.html`).
- AngularJS modules need to be defined like the following `chaise.*`. Chaise identifies the set of apps it applies to and the `*` is that modules purpose in Chaise.
- Service, Factory, Provider, Controller, and other angular classes should be defined with camel case text leading with a capital letter. For example: `ErrorDialogController` is the convention for naming controllers. Don't shorten the text to `ctrl` because we should be using controller as syntax and want to have a more readable structure to our code.
- Variables should follow a similar naming convention using camel case text. Variables and functions that are prefixed with an underscore, should be treated as private variables and used with caution.
- Folder names should be different from file names. Of course folders don't have an extension so it's more apparent that they are folders, but developers should use `-` separated names for folders, i.e. `common\templates\data-link`.
- Chaise config properties are technically case-insensitive, but to make the documents easier to read we are writing them as camel case in code and documentation.

#### ERMrestJS
- Related to annotations,
  - All the keys and properties are case sensitive and written in lower case.
  - Annotation keys are using kebab case (dash case).
  - Annotation properties are using snake case.
  - Properties that are enforcing a boolean state should be defined based on the oposite default value. For example if a button is displayed by default and we want to add a property to force its state, we have to add `hide_button`.
- Related to markdown and templating:
  - The helper functions are case sensitive and using came case.

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

### How It Works

This section will provide more information on how the error handling has been implemented in Chaise.

#### $exceptionHandler

AngularJS has a common exception handler service, `$exceptionHandler`. For reference:
- [Official guide](https://docs.angularjs.org/api/ng/service/$exceptionHandler)
- [Unofficial style guide](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md#exception-handling)

The AngularJS global exception handler, `$exceptionHandler`, is used as the final catch for exceptions in the Chaise applications. Any exceptions that need to be handled in a common way should throw the exception and leave it to the AngularJS service to catch them. A function is registered with `$exceptionHandler` to manage how we want general cases to be handled.

#### Special Case: $uibModal
The promise used to create an instance of $uibModal is rejected if the user dismisses the modal. Unless you have logic for when the modal is dismissed, there's no need to attach an error callback to this promise. There's also no need to add a `.catch()` because `$exceptionHandler` will handle any errors in the success callback.

#### Synchronous try/catch blocks

Any unhandled exception will be handled by the `$exceptionHandler`. So we should always be specific about what error conditions that we are catching; and make sure that you throw unhandled exceptions.

#### non-AngularJS asynchronous event-handling functions

In general, we should only implement event-handling functions within the AngularJS framework. However, in the event that we must implement an event-handler outside of AngularJS, `window.onerror` will handle this.

The `window.onerror` handler may be called by the browser for many error conditions outside of the scope of our applications. There are also known browser compatibility issues at the time of writing this guideline. The following are some references related to `window.onerror`:

- This old article discussed issues with window.onerror. https://danlimerick.wordpress.com/2014/01/18/how-to-catch-javascript-errors-with-window-onerror-even-on-chrome-and-firefox/
- This article summarizes window.onerror support for each browser and provide an example to wrap a function so the exception can be logged. Maybe we can use the same method? https://blog.sentry.io/2016/01/04/client-javascript-reporting-window-onerror.html

## Config App
We have a configuration app that is loaded into the DOM before each of our angular apps to do some setup before attaching the app instance. More info can be found in the [Config app guide](https://github.com/informatics-isi-edu/chaise/blob/master/docs/dev-docs/config-app.md).
