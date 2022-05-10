# React Developer Guide
This is a guide for people who develop Chaise using ReactJS/TypeScript.

## Table of contents

- [Reading Material](#reading-material)
- [Idioms](#idioms)
  * [General](#general)
  * [React/TypeScript](#react-typescript)
  * [Lint](#lint)
  * [CSS/SCSS](#css-scss)
- [Folder structure](#folder-structure)
- [Building and installation](#building-and-installation)
    + [Make targets](#make-targets)
    + [NPM](#npm)
- [Structure of an App](#structure-of-an-app)
  * [Main HTML](#main-html)
  * [App Wrapper](#app-wrapper)
  * [Context](#context)
  * [Error Provider](#error-provider)
  * [Alerts Provider](#alerts-provider)
  * [Chaise Navbar](#chaise-navbar)
- [Error handling](#error-handling)
  * [How it works](#how-it-works)
    + [Error provider](#error-provider)
    + [Global handler (catch-all)](#global-handler-catch-all)
    + [Local handler](#local-handler)
      - [Multiple errors on the page](#multiple-errors-on-the-page)
  * [Guidelines](#guidelines)
    + [Development vs. Production](#development-vs-production)
    + [Error boundary](#error-boundary)
  * [Guidelines for promise chains](#guidelines-for-promise-chains)

## Reading Material
- [Intro to React, Redux, and TypeScript](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12)
- [Code style](https://github.com/typescript-cheatsheets/react)


## Idioms

### General
- Use semilicon everywhere. Eventhough it's not needed, for consistency, use semicolon after each line.
- Stick with the indentation size of 2. If a file is not using size 2, just change the whole file.
- File names should be all lower case and use kebab case (`-` should be used to break words).

### React/TypeScript

- Use functional components in most cases (class component should only be considered for special cases.)
- Use PascalCase for type names, class names, and enum values.
- Use camelCase for function names.
- Use camelCase for property names and local variables.
- Use `_` as a prefix for private properties and functions.
- Use whole words in names when possible.
- Avoid using `any` type as much as you can.
- Part of the build process defines an alias, called `@chaise`, to reference the `src` folder in the Chaise repo. This alias should be used instead of doing relative imports.
- Create a `type` for `props` of components.

- Regarding [Render logic](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12/#/36),
  - It must be “pure“, without any “side effects”
    - No AJAX calls, mutating data, random values
    - Rendering should only be based on current props and state
  - Render any dependent items into temporary variables, such as conditional components or lists.

- Regarding `useState` and `setState` hooks:
  - Creating callbacks “closes over” variable values at time of render
    - Can cause bugs due to “stale state” if not careful!
  - Be careful with multiple update calls in a row!
  - `setState` can accept an “updater” callback instead of a value.
    - Updater will be called with the latest value as its argument, and should return a new value. Safer to use this if multiple updates depend on each other
    - Also can avoid having to capture value from parent scope

  ```typescript
  // ❌ Two bugs here!
  // 1) "Closed over" old value of `counter`
  // 2) Updates will be batched together
  const onClick = () => {
    setCounter(counter + 1);
    setCounter(counter + 1);
  }

  const onClickFixed = () => {
    // ✅ Can pass an "updater" function to setState,
    // which gets the latest value as its argument
    setCounter(prevCounter => prevCounter + 1);
    setCounter(prevCounter => prevCounter + 1);
  };
  ```
- List items must have keys, which tell React list item   identity
  - Should be unique per list
  - Ideally, use item IDs
  - Fallback, use array indices, but only if data won’t reorder

- Take a look at `example.tsx` for a sample react component.

- Since we're using [`StrictMode`](https://reactjs.org/docs/strict-mode.html), React will double-invoke the functions related to rendering content to find issues. So to debug the performance and rendering issues we should make asure that will always using production mode.

### Lint
- Make sure the `ESLint` extension is installed for Visual Studio Code.

- Makefile commands:

  ```
  make lint
  make lint-w-warn
  ```

- You can ask linter to escape a file or line, but you should not use this unless
  you're 100% sure what you're doing is correct:

  ```
  // to ignore the rule for the next line:
  // eslint-disable-next-line NAME_OF_THE_RULE

  // to ignore the rule for the whole file:
  /* eslint NAME_OF_THE_RULE: 0 */
  ```

- Using the previously described method you can also change rules locally, but
  we recommend against.


### CSS/SCSS

- General purpose styles should be part of the `app.scss` (or included as part of `app.scss`.)
- Styles specific to a components should be inlcuded in a separate file and imported in the component tsx file.
- It's better if you use classes instead of ids for writing css rules.
- Use `-` to break the words in your name. Avoid using camelCase or `_`.
- Use names that are meaningful and can be easily understood without knowing the whole page. Try to convey what an ID or class is about while being as brief as possible.
- Avoid adding duplicated rules. If there's a rule in a file that is applied to the element that you're trying to add a new style to, add it there.
- Avoid using `!important` as much as you can (Unless there's a bootstrap rule that you're trying to override.)
- Comment your rule to make it easier for others to figure out why a rule was added.
- If you're doing some calculations don't just use the end result. Right the calculations so later we can easily figure out why you chose that value.
- Use variables if you're using the same value more than once and these values should be the same all the times (Just because you're using value `10` in two different rules doesn't mean they should share the same variable. Use a variable if these two rules MUST be using the same value. So if later you changed one to `20`, the other one should be updated as well).


## Folder structure

The following is the overall structure of the project:

```
.
├── src
│   ├── assets
│   │   └── scss
│   │       ├── app.scss
│   │       └── _<comp>.scss
│   ├── components
│   │   └── <comp>.tsx
│   ├── hooks
│   │   └── <feature>.ts
│   ├── libs
│   │   └── <library>.tsx
│   ├── models
│   │   └── <feature>.ts
│   ├── pages
│   │   ├── <app>.tsx
│   │   └── main.html
│   ├── providers
│   │   └── <feeature>.tsx
│   ├── services
│   │   └── <feature>.ts
│   ├── utils
│   │   └── <function>.ts
│   └── vendor
├── webpack
│   ├── app.config.js
│   ├── lib.config.js
│   └── main.configjs
├── Makefile
└── package.json
```

- `assets`: This folder is used to house all the fonts, images, and SCSS files. The component specific SCSS files should have the same name as their component file.
- `components`: Each app will rely on similar components for functionality and display purposes. If there is a need to reuse code, even if that's in only 2 places, a common component should be extracted and placed in the components folder.
- `libs`: Independent applications that may be used in non-React environments outside of Chaise.
- `models`: The models or types that are
- `providers`: Providers are a way to have a consistent state that can be accessed by any component at any level of the parent/child component hierarchy. Providers make use of React hooks to manage the app state.
- `services`: Services are used for common functionality like interacting with the server, configuring the application, managing the user session, and more. These functional services provide a scope that is shared throughout the service that each function can interact with.
- `utils`: Utilities are intended to be collections of functions exported individually that are then imported as needed in other places.


## Building and installation

This section will focus on more advanced details related to installation. Please refer to the installation guide in the `user-docs` folder for general information. The build process uses Makefile to simplify what needs to be called from the command line to get started. `Make` will manage dependency installation (through `npm`) and the react build process (using `webpack`).

#### Make targets
The following are all the Makefile targets related to installation:

- `install`:  This target is designed for deployment environments, where we want to make sure we can install from scratch without any hiccups and errors. That's why we're always doing a clean installation (`npm ci`) as part of this command, which will ensure that the dependencies are installed based on what's encoded in the `package-lock.json` (without fetching new versions from the upstream). While developing features in Chaise, you should only run this command during the first installation or when `package-lock.json` has been modified.
- `install-wo-deps`: Designed for development purposes, will only build and install Chaise.
- `install-w-config`: The same as `install`, but will also `rsync` the configuration files.
- `install-wo-deps-w-config`: The same as `install-wo-deps`, but will also `rsync` the configuration files.

#### NPM
This section will go over how we think the NPM modules should be managed.

- Ensure the latest stable node and npm versions are used.
- Only use `make install` when the `package-lock.json` has been changed (or when doing a clean install).
- Use `make install-wo-deps` while developing.
- Avoid using `npm install`.
- `pacakge-lock.json` should not be changed. If you noticed a change in your branch, consult with the main contributors.
- Only for main contributors: If we want to upgrade the dependencies or install a new package, we should,
  - Ensure the used node and npm versions are updated and the latest stable.
  - Run `npm install` to sync `package-lock.json` with `package.json`
  - Double-check the changes to `pacakge-lock.json`



## Structure of an App
Since Chaise is a collection of multiple single page apps (`recordset`, `record`, `recordedit`, etc.), app setup will be very similar. This similar structure allowed us to factor out a lot of that common setup code into difrerent bits described below.

### Main HTML
The instantiation and bundle of dependencies should be almost the same for each app. The build process using webpack will generate the outer HTML based on `pages/main.html`. Each app attaches to the element with `id` equal to `chaise-app-root` defined in `main.html`.

### App Wrapper
Each app in Chaise is instantiated and configured the same way as far as creating the outer HTML and <head> tag, wrapping the app in the proper providers, configuring Chaise and ermrestJS, and fetching the session. To help manage parts of this, we created a component called `AppWrapper` to wrap each app for setup and configuration.

### Context
For state sharing between components, Chaise is using the built in useContext hook. Each application has it's own top level context with each component defining it's own context as needed (like alerts and errors).

### Error Provider
To handle global errors, the app wrapper adds an `ErrorProvider` to handle the error state and an `ErrorBoundary` to catch the errors. Each app only needs to throw errors to let the global handler decide what to do with them.

### Alerts Provider
Alerts also has it's own provider created to have consistent state at the app level when trying to show alerts from sub components of the app. The provider here acts like a service that handles the functionality surrounding alerts. This provider also allows for showing alerts in multiple places without having duplicate alerts show in the wrong contexts.

### Chaise Navbar
The navbar for each Chaise app is the same style. It is loaded as part of the configuration phase in app wrapper. All apps in Chaise can decide to show or hide the navbar as part of defining the `AppWrapper` component.


## Error handling

This section focuses on error handling practices that we should follow while migrating from AngularJS to React.

In the AngularJS implementation of Chaise, we rely on `window.onerror` and `$exceptionHandler` to catch any asynchronous or synchronous errors that might happen while processing the page.

Both of the mentioned methods are working as a "catch-all" where we're calling the `handleException` function in `ErrorService`. This function can handle both expected/known errors (e.g. 403 from a read request), or unexpected/unknown errors (e.g. JavaScript errors because of programmatic mistakes).

Therefore the general guideline regardless of the asynchronous or synchronous nature of the error was:
- If you want a local treatment of errors, catch the errors locally.
- Otherwise throw the error (which means the "catch-all" logic would handle it properly).

This is not fully the case anymore. In React, any synchronous error that happens during the rendering of a component will break the whole app, and to avoid that we need to make some modifications to our error handling logic.
### How it works

The following is how error handling should work in Chaise using React:

#### Error provider

- To make sure we can call the error handler from anywhere in the page structure, we've created an `ErrorProvider` that uses `ErorrContext`. This will allow us to store the state of errors. This way,
  - We can use the `useError` costom hook which gives use a `dispatchError` that can be used for "throwing" the error.
  - The logic to show a proper error message or UX behavior based on the error object will be part of the error provider.
  - The error modal component can use the `error` returned from `useError` to determine whether it should show any errors or not.

#### Global handler (catch-all)

- The whole app should be wrapped in an error boundary. This will ensure that even if there's an unexpected error, we can show the error modal to users (and also log the error).
- `error` and `unhandledrejection` event listeners must be defined in the app component, so we can `dispatchError` the unhandled errors.

Based on this, the following is how each app should roughly look like:
```tsx
const RecordSetApp = () : JSX.Element => {
  const { dispatchError } = useError();
  ...

  useEffect(() => {
    /**
     * global error handler for uncaught errors
    */
    window.addEventListener("error", (event) => {
      dispatchError(...);
    });
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      dispatchError(...);
    });

    ...
  });

  ...

  const errorFallback = ({error}: FallbackProps) => {
    // log the error
    ...

    // dispatchError the error
    dispatchError(...);

    // the error modal will be displayed so there's no need for the fallback
    return null;
  }


  return (
    <ErrorBoundary FallbackComponent={errorFallback}>
      ...
    </ErrorBoundary>
  )
}
```

#### Local handler

- We should not let any error be unhandled. All errors should be caught.
  - If we don't want to do anything specific for the error, we should dispatchError the caught error.
    ```tsx
    // async errors:
    reference.read(pageSize, logObject).then(function (page) {
      ...
    }).catch(function (err) {
      // do the local handling if we have to
      ...

      // dispatchError the error
      dispatchError(...);
    });

    // sync errors:
    try {
      // some function call that is error prone
      ...
    } catch (exp) {
      // do the local handling if we have to
      ...

      // dispatchError the error
      dispatchError(...);
    }
    ```


  - If we want a local treatment for errors, we can wrap the component in an error boundary like the example in [here](#error-boundary). This will allow us to offer an alternative UI.


##### Multiple errors on the page

Since our apps are complicated and can have multiple components that behave somewhat independently (and in an asynchronous fashion), there might be a case that the page throws multiple errors. As soon as an error is thrown, we're dispatchErroring it to the error service and the error service will display it right away. If in this state (while we're showing the error) another error is dispatchErrored, the error handler is going to act differently depending on the type of the error. In general, we can categorize errors in the following categories:

1. Blocking errors: When we encounter such errors, we cannot simply recover the app state. In this case, the error popup is supposed to block the user from interacting with the page and offer a way to get out of the broken state. The actions in this type of error are usually redirecting the user to a completely different location, or the same page with different settings.

2. Non-blocking errors: These errors don't affect the overall state of the app, and users can simply dismiss them. For example, a 409 error while trying to delete a row.

Therefore,

1. If the displayed error is a blocking error, we should just swallow the newer error. All of our blocking errors offer a way to get out of the error state, either by removing part of the URL or completely redirecting to another location. Therefore even if we mask all the errors except one, users can still get out of the error state.

2. If the displayed error is non-blocking, we cannot simply swallow the other errors. If users dismiss the error modal, then the page will be in an error state without users realizing it. Therefore we should keep track of all the errors. This way after dismissing the first error we can display the other one. The same two rules should apply depending on whether the error can be dismissed or not.

> If any of these errors is a 401, since we have special handling for it, it should just show on top of everything else. 401 errors will trigger the login modal which can completely change the state of the app and most probably fix all the other issues on the page.

While discussing this, we also talked about the possibility of combining all the errors into one. To make this work, we have to make sure the error message and actions that we offer are well-designed for any combination of errors. This seems unnecessarily complex given that we have a lot of different error types in ERMrestJS and Chaise, that's why we are not going to pursue this.

### Guidelines

#### Development vs. Production

React will behave differently in case of errors in development and production modes. As it is [described here](https://github.com/facebook/react/issues/10384#issuecomment-334142138), React is rethrowing an error and doesn't allow you to swallow an error in development mode. Since our whole error handling logic rely on this, make sure you're using production mode while testing error handling.


#### Error boundary

As we mentioned JavaScript errors in any part of the UI will break the whole app. To solve this problem, React 16 introduces a new concept of [error boundaries](https://reactjs.org/docs/error-boundaries.html).

Error boundaries are React components that catch JavaScript errors anywhere in their child component tree, log those errors, and display a fallback UI instead of the component tree that crashed. Error boundaries catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them.

Error boundaries do not catch errors for:
  - Event handlers
  - Asynchronous code (e.g. setTimeout or requestAnimationFrame callbacks)
  - Server-side rendering
  - Errors thrown in the error boundary itself (rather than its children)

That being said, instead of just using the built-in error boundary class component, we're using [react-error-boundary](https://github.com/bvaughn/react-error-boundary) instead. With this component,

- We can use error boundaries in functional components.
- We can use the `useError` hook to manually call the error boundary in order to offer a uniform error handling for a component (we can catch the errors in async calls that the error boundary doesn't support and manually call the error boundary logic).

Therefore, if we want uniform error handling for a component, we should use `react-error-boundary`.

```tsx
const ParentComponent = () : JSX.Element => {

  const fallbackComp = ({error}: FallbackProps) => {
    // dispatchError the error message
    // return a fallback component
  }

  return (
    <ErrorBoundary
      FallbackComponent={fallbackComp}
    >
      <ChildComponent/>
    </ErrorBoundary>
  )
}

// a component that might throw some errors
function ChildComponent = (): JSX.Element => {
  const handleError = useErrorHandler();
  ...

  // somewhere in a async call
  somePromise.then({
    ...
  }).catch(function (err) {
    // call the closest error boundary
    handleError(err);
  })

  ...
}
```

### Guidelines for promise chains

The general guidelines for handling errors in promises are:
- do not let your handlers "silence" any unhandled errors, _always_ throw an unhandled error so that later catch blocks may handle it;
- when you do not have any (or any _more_) catch blocks, dispatchError the unhandled error so that the general exception handler service can handle it.
- reject is a callback function that gets carried out after the promise is rejected, whereas throw cannot be used asynchronously. If you chose to use reject, your code will continue to run normally in an asynchronous fashion whereas throw will prioritize completing the resolver function (this function will run immediately).

#### Promise with success, reject, and catch handlers

One style when working with a single promise is to use success, reject, and "catch" handlers. The `catch` function is just syntactic sugar for `then(null, function)` where the success handler is not given.

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
    // again as a general practice, conclude by dispatchErroring unhandled error
    dispatchError(...);
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

#### Promise with success and catch handlers

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
    // as a general practice, conclude by dispatchErroring unhandled error
    dispatchError(...);
  }
);
```

#### Promise chaining with single catch

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
    // then make sure to dispatchError the error again, as usual.
    dispatchError(...);
  }
);
```

#### Promise chaining with interleaved catches

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

    // if the error could not be recovered, then you will need to
    // throw the error again so that the next reject/catch handler will
    // process it, and so that it will skip any success handlers.
    throw err;

    // if the error was recovered, you may need to return something
    // based on what the next success handler expects. Otherwise, you can
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

    // as usual, if the error could not be handled in this block, dispatchError it
    dispatchError(...);
  }
);
```
