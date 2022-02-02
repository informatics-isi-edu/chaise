# Error handling in React

This document focuses on error handling practices that we should follow while migrating from AngularJS to React.

In the AngularJS implementation of Chaise, we rely on `window.onerror` and `$exceptionHandler` to catch any asynchronous or synchronous errors that might happen while processing the page.

Both of the mentioned methods are working as a "catch-all" where we're calling the `handleException` function in `ErrorService`. This function can handle both expected/known errors (e.g. 403 from a read request), or unexpected/unknown errors (e.g. JavaScript errors because of programmatic mistakes).

Therefore the general guideline regardless of asynchronous or synchronous nature of the error was:
- If you want a local treatment of errors, catch the errors locally.
- Otherwise throw the error (which means the "catch-all" logic would handle it properly).

This is not fully the case anymore. In React, any synchronous error that happens during the rendering of a component will break the whole app, and to avoid that we need to make some modifications to our error handling logic.
## How it works

The following is how error handling should work in Chaise using React:

### Error service

- To make sure we can call the error handler from anywhere in the page structure, we will use `redux`. This will allow us to store the state of errors. This way,
  - We can `dispatch` a message to show the error.
  - The logic to show a proper error message or UX behavior based on the error object will be part of the error reducer.
  - The error modal component can use the `error` in redux store to determine whether it should show any errors or not.

### Global handler (catch-all)

- The whole app should be wrapped in an error boundary. This will ensure that even if there's an unexpected error, we can show the error modal to users (and also log the error).
- `error` and `unhandledrejection` event listeners must be defined in the app component, so we can `dispatch` the unhandled errors.

Based on this, the following is how each app should roughly look like:
```tsx
const RecordSetApp = () : JSX.Element => {
  ...

  useEffect(() => {
    /**
     * global error handler for uncaught errors
    */
    window.addEventListener("error", (event) => {
      dispatch(...);
    });
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      dispatch(...);
    });

    ...
  });

  ...

  const errorFallback = ({error}: FallbackProps) => {
    // log the error
    ...

    // dispatch the error
    dispatch(...);

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

### Local handler

- We should not let any error be unhandled. All errors should be caught.
  - If we don't want to do anything specific for the error, we should dispatch the caught error.
  - If we want a local treatment for errors, we can wrap the component in an error boundary. This will allow us to offer an alternative UI.

## Guidelines

### Development vs. Production

React will behave differently in case of errors in development and production modes. As it is [described here](https://github.com/facebook/react/issues/10384#issuecomment-334142138), React is rethrowing an error and doesn't allow you to swallow an error in development mode. Since our whole error handling logic rely on this, make sure you're using production mode while testing error handling.


### Error boundary

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
    // dispatch the error message
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
- when you do not have any (or any _more_) catch blocks, dispatch the unhandled error so that the general exception handler service can handle it.
- reject is a callback function that gets carried out after the promise is rejected, whereas throw cannot be used asynchronously. If you chose to use reject, your code will continue to run normally in an asynchronous fashion whereas throw will prioritize completing the resolver function (this function will run immediately).

### Promise with success, reject, and catch handlers

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
    // again as a general practice, conclude by dispatching unhandled error
    dispatch(...);
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
    // as a general practice, conclude by dispatching unhandled error
    dispatch(...);
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
    // then make sure to dispatch the error again, as usual.
    dispatch(...);
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

    // as usual, if the error could not be handled in this block, dispatch it
    dispatch(...);
  }
);
```
