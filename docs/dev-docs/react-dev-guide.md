# React Developer Guide
This is a guide for people who develop Chaise using ReactJS.


## Table of Contents
- [Reading Material](#reading-material)
- [React Practices](#react-practices)
  - [Parent/child component communication](#parentchild-component-communication)
  - [Building and Installing](#building-and-installing)
    - [Make Targets](#make-targets)
    - [NPM](#npm)
  - [Lint](#lint)
  - [Code Style](#code-style)
  - [CSS and Styles](#css-and-styles)
  - [Importing Dependencies](#importing-dependencies)
  - [Immutability of Objects](#immutability-of-objects)
- [Structure of an App](#structure-of-an-app)
  - [Main HTML](#main-html)
  - [App Wrapper](#app-wrapper)
  - [Context](#context)
  - [Error Provider](#error-provider)
  - [Alerts Provider](#alerts-provider)
  - [Chaise Navbar](#chaise-navbar)
- [Common Functionality](#common-functionality)
  - [Components](#components)
  - [Providers](#providers)
  - [Services](#services)
  - [Utilities](#utilities)
- [Typescript](#typescript)
  - [Models](#models)
  

## Reading Material
- [Intro to React, Redux, and TypeScript](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12)
- [Code style](https://github.com/typescript-cheatsheets/react)


## React Practices
(NOTE: this section needs to be reorganized, maybe combine with react development practices?)
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

### Building and Installing
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

### Code style
1. Use semilicon everywhere. Eventhough it's not needed, for consistency, use semicolon after each line.
2. Stick with the indentation size of 2. If a file is not using size 2, just change the whole file.
3. Only use functional components (no class component)
4. Use PascalCase for type names, class names, and enum values.
5. Use camelCase for function names.
6. Use camelCase for property names and local variables.
7. Use `_` as a prefix for private properties and functions.
8. Use whole words in names when possible.

### CSS and Styles
General styles should be included as part of the build process in the <head> tag. More specific styles that are meant to be reused for a specific component should be imported at the top of the component file. Styles used only once for a specific element should be inline or factored out into that component's specific CSS document.

### Importing dependencies
Part of the build process defines an alias, called `@chaise`, to reference the `src` folder in the Chaise repo. This alias should be used instead of doing relative imports.

### Immutability of Objects
TODO
  

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


## Common Functionality
There are different folders in the project for where to define new functionality based on what purpose that functionality is trying to provide.

### Components
Each app will rely on similar components for functionality and display purposes. If there is a need to reuse code, even if that's in only 2 places, a common component should be extracted and placed in the components folder.

### Providers
Providers are a way to have a consistent state that can be accessed by any component at any level of the parent/child component hierarchy. Providers make use of React hooks to manage the app state.

### Services
Services are used for common functionality like interacting with the server, configuring the application, managing the user session, and more. These functional services provide a scope that is shared throughout the service that each function can interact with.

### Utilities
Utilities are intended to be collections of functions exported individually that are then imported as needed in other places.


## Typescript
The application is written with typescript to have better control over the way code is used. More about typescript can be found in the [documentation](www.insert.hyperlink.here.com)

### Models
To manaage more complex objects in typescript (instead of blindly using `any` type), models for different common objects are defined in the `models` folder.
