# Error handling


## Previous guidelines

- Regarding async calls or different parts of the code:
  - Handle errors localy if you want a local treatment of errors.
  - Otherwise just throw the error

- Catch all logic: If AngularJS encountered an error, it will call the catch-all logic. This error could be because of an expected/known error in the code (403 from a read request for example), or an unexpected/unkown error (syntax error because of a programmer mistake)


## New guideline

- Regarding async calls or different parts of the code:
  - Handle errors localy if you want a local treatment of errors (through ErroBoundary or just a customize behavior)
  - Otherwise catch the errors and manually call the error service

- app-wide ErrorBoundary logic: Ensures the app doesn't crash because of an unexpected error. Instead will show a proper error popup to the users and potentially allows a way to get out of the error state.

- Error service: Ensures proper error handling for expected/known errors.



The issue with error boundary:

Error boundaries do not catch errors for:
- Event handlers
- Asynchronous code (e.g. setTimeout or requestAnimationFrame callbacks)
- Server side rendering
- Errors thrown in the error boundary itself (rather than its children)

----------------------------------------------

1. If an error happens in the "render" function of a react component, it will break the whole app. To avoid that, you can wrap the component in an error boundary. This way you can offer an alternative component to let users know what went wrong and potentially log the error. If our goal is to log without any UI element, we can do `window.onerror`.

2. If any of the following errors is thrown:
    - Event handlers
    - Asynchronous code (e.g. setTimeout or requestAnimationFrame callbacks)
    - Server side rendering

  The app can properly render the UI and continue without any issues. To catch these errors globally we would have to do `window.onerror`.

‌Because of this,
 - We should wrap the whole app in a error boundary to ensure the app doesn't fully break.
 - We should use `window.onerror` to catch all the unhandeled errors. It should call the error service that we have to show the error.
 - We should not let any error be unhandeled while rendering a function, while it's safe to just throw an error in a async call...
   -> But I think as a rule it's better if we just say that you should always call the global handler




