This document should be organized later, I just wanted to make sure the things that comes up during migration are documented.

# Reading Material

- [Intro to React, Redux, and TypeScript](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12)
- [Code style](https://github.com/typescript-cheatsheets/react)


# React

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

### Parent/child component communication

- Parents pass data as `props` to children
- Parents pass callbacks to children as props, children communicate to parent by running `props.somethingHappened(data)`



# Code style
1. Use semilicon everywhere. Eventhough it's not needed, for consistency, use semicolon after each line.
2. Stick with the indentation size of 2. If a file is not using size 2, just change the whole file.
3. Only use functional components (no class component)
4. Use PascalCase for type names, class names, and enum values.
5. Use camelCase for function names.
6. Use camelCase for property names and local variables.
7. Use `_` as a prefix for private properties and functions.
8. Use whole words in names when possible.



# Lint

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

# Installation

This section will focus on more advanced details related to installation. Please refer to the installation guide in the `user-docs` folder for general information.

## Make targets
The following are all the Makefile targets related to installation:

- `install`:  This target is designed for deployment environments, where we want to make sure we can install from scratch without any hiccups and errors. That's why we're always doing a clean installation (`npm ci`) as part of this command, which will ensure that the dependencies are installed based on what's encoded in the `package-lock.json` (without fetching new versions from the upstream). While developing features in Chaise, you should only run this command during the first installation or when `package-lock.json` has been modified.
- `install-wo-deps`: Designed for development purposes, will only build and install Chaise.
- `install-w-config`: The same as `install`, but will also `rsync` the configuration files.
- `install-wo-deps-w-config`: The same as `install-wo-deps`, but will also `rsync` the configuration files.

## NPM

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

