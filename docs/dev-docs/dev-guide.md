# Developer Guide
This is a guide for people who develop Chaise.

## Table of contents

- [Reading Material](#reading-material)
- [Idioms](#idioms)
  * [Naming conventions](#naming-conventions)
  * [General](#general-1)
  * [React/TypeScript](#reacttypescript-1)
  * [Lint](#lint)
  * [CSS/SCSS](#cssscss-1)
  * [Font Awesome](#font-awesome)
  * [Handling time](#handling-time)
- [Folder structure](#folder-structure)
- [Building and installation](#building-and-installation)
    + [Make targets](#make-targets)
    + [NPM](#npm)
- [Structure of an App](#structure-of-an-app)
- [Using Chaise through npm](#using-chaise-through-npm)
- [Error handling](#error-handling)
  * [How it works](#how-it-works)
  * [Guidelines](#guidelines)
  * [Guidelines for promise chains](#guidelines-for-promise-chains)
- [Context and provider pattern](#context-and-provider-pattern)
- [Performance](#performance)
  * [Debugging](#debugging)
  * [Memoization](#memoization)

## Reading Material
In this section, we've included all the guides and tools that we think are useful
for learning different concepts.

### General
- [caniuse.com](https://caniuse.com/): can be used to quickly figure out if a feature can be used based on our browser support or not.
- [Guide to Chrome DevTools](https://www.keycdn.com/blog/chrome-devtools): Very useful for debugging.

### React/TypeScript
- [Intro to React, Redux, and TypeScript](https://blog.isquaredsoftware.com/presentations/react-redux-ts-intro-2020-12)
- [Code style](https://github.com/typescript-cheatsheets/react)
- [React design patterns](https://blog.logrocket.com/react-component-design-patterns-2022/)

### CSS/SCSS

- [W3schools CSS tutorial](https://www.w3schools.com/css/): this is a good starting point for refreshing your CSS knowledge.
- [MDN CSS reference](https://developer.mozilla.org/en-US/docs/Web/CSS): a very thorough CSS reference that you can use to learn more about different CSS features.
- [Sass basics](https://sass-lang.com/guide): a very good starting point for learning Sass basics (we're using SCSS syntax.)
- [CSS Printing Guide - 1](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/) : A-Z about CSS print rules
- [CSS Printing Guide - 2](https://www.smashingmagazine.com/2015/01/designing-for-print-with-css/) : Essentials for CSS Print rules
  (part - 2)
- [Overriding inline styles](https://css-tricks.com/override-inline-styles-with-css/) : Inline styles have the highest priority, but they
  too can be overwritten when the element is accessed, as shown in the document.
- [Important Information on CSS position](https://css-tricks.com/almanac/properties/p/position/) : Adding scrolling to a collapsible navbar can be
  tricky. This link explains how you can add scrolling without affecting any level of dropdown menus.
- [Calculating position of element](https://javascript.info/size-and-scroll) : This link gives an in-depth understanding of how we can manually
  calculate the position of any element dynamically in the DOM

## Idioms

The rules that should be followed while writing code.

### Naming conventions

- Use kebab-case for filenames (all lower case with `-` for breaking words).
- Related to React/Typescript,
  - Use PascalCase for type names, class names, and enum values.
  - Use camelCase for function names.
  - Use camelCase for property names and local variables.
  - Use `_` as a prefix for private properties and functions.
  - Use whole words in names when possible.
- Related to SASS/SCSS,
  - Use kebab-case (all lower case with `-` for breaking words). Avoid using camelCase or `_`.
  - Use meaningful names that can be easily understood without knowing the whole page. Try to convey what an ID or class is about while being as brief as possible.
- Related to annotations,
  - All the keys and properties are case sensitive and written in lower case.
  - Annotation keys are using kebab-case (all lower case with `-` for breaking words).
  - Annotation properties use snake case (all lower case with `_` for breaking words).
  - Properties that enforce a boolean state should be defined based on the opposite default value. For example, if a button is displayed by default and we want to add a property to force its state, we have to add `hide_button`.
- Related to markdown and templating,
  - The helper functions are case sensitive and use camelCase.

### General
- Stick with the indentation size of 2. If a file is not using size 2, just change the whole file.
- Use single quotes (`'some string'`) for defining strings.
- Use semicolons everywhere. Even though it's unnecessary, use a semicolon after each line for consistency.

### React/TypeScript

- Use functional components in most cases (class components should only be considered for special cases.)
- Avoid using `any` type as much as you can.
- Don't use relative paths while importing. Instead, use the `@isrd-isi-edu/chaise` alias, which points to the root. For example:
  ```js
  import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
  ```
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
- When to use different React hooks, `useState`, `useRef`, and `useStateRef`
  - `useState`:
    - common to both `useState` and `useRef`, remembers it's value after a rerender of the component
    - used to bind component state with rendering the component
    - state update is asynchronous, the new state value won't be updated until after rerender
    - modifying the state will queue a rerender of the component which will have the new state value that was set before rerender
  - `useRef`:
    - common to both `useState` and `useRef`, remembers it's value after a rerender of the component
    - does not trigger rerenders of the component or `useEffect` of component
    - ref update is synchronous, meaning the new value is immediately available in other functions
    - better for accessing mutable values that are independent of the React component state
    - useful when mutating a value that is used in another function later in the stack before a rerender would occur
      - for instance, in a function used as a callback for a promise
    - `<ref>.current` is a mutable value 
  - `useStateRef`:
    - when a value is needed in functions and is used for triggering component rerenders, use this custom hook
    - intended to be synchronous
- Calling functions after `useState` update and browser repaint
  - When the set function of a `useState` hook is called, a browser repaint is triggered followed by each `useEffect` and `useLayoutEffect` being checked for changes
  - If a change occurred that triggers a `useEffect` or `useLayoutEffect` hook, the defined function for that hook will run after the browser repaint with the updated values for the `useState` hook.
  - This is useful for displaying feedback to the user before triggering some functionality that might take some time to process (cloning forms in recordedit or submitting many at once)
- List items must have keys, which tell React list item   identity
  - Should be unique per list
  - Ideally, use item IDs
  - Fallback, use array indices, but only if data won’t reorder

- Take a look at `example.tsx` for a sample react component.

- Since we're using [`StrictMode`](https://reactjs.org/docs/strict-mode.html), React will double-invoke the functions related to rendering content to find issues. So to debug the performance and rendering issues, we should make sure that we are always using production mode.

- While importing `react-bootstrap` components, import individual components using `react-bootstrap/Button` rather than the entire library ([source](https://react-bootstrap.github.io/getting-started/introduction/#importing-components)).
  ```ts
  // ❌ bad
  import { Button } from 'react-bootstrap';

  // ✅ good
  import Button from 'react-bootstrap/Button';
  ```

- Before implementing your special component take a look at `components` folder and see if any of the existing reusable components can satisfy your case. The following are list of more common components that we have:
 - `AppWrapper`: Wrapper for all the chaise-like application. Refer to [this section](#structure-of-an-app) for more information.
 - `DisplayValue`: This component can be used to inject HTML content into the DOM. Use this component instead of `dangerouslySetInnerHTML`.
 - `ChaiseTooltip`: Display toolips for elements.
 - `ClearInputBtn`: A clear button that should be attached to all inputs on the page.
 - `CondWrapper`: Can be used to conditionally add wrappers to another component.
 - `InputSwitch`: Display appropriate input for a given column.
 - `SearchInput`: Display a search input.
 - `Spinner`: A spinner to show progress on the page.
 - `SplitView`: Adds a resizable side panel to the page.
 - `Title`: Given a `displayname` object will return the proper title to be displayed on the page.

### Lint
- Make sure the `ESLint` extension is installed for Visual Studio Code.

- Makefile commands related to linter:
  - `make lint`: Run linter and only show the errors.
  - `make lint-w-warn`: Run linter and show both warning and errors.

- You can ask linter to escape a file or line, but you should not use this unless
  you're 100% sure what you're doing is correct:

  ```
  // to ignore the rule for the next line:
  // eslint-disable-next-line NAME_OF_THE_RULE

  // to ignore the rule for the whole file:
  /* eslint NAME_OF_THE_RULE: 0 */
  ```

- Using the previously described method, you can also change rules locally, but we generally recommend against it .

### CSS/SCSS

- General-purpose styles should be part of the `app.scss` (or included as part of `app.scss`.)
- Styles specific to a component should be included in a separate file and imported into the component TSX file.
- It's better if you use classes instead of ids for writing CSS rules.
- Avoid adding duplicated rules. If there's a rule in a file that is applied to the element that you're trying to add a new style to, add it there.
- Avoid using `!important` as much as you can (Unless there's a bootstrap rule that you're trying to override.)
- Comment your rule to make it easier for others to figure out why a rule was added.
- If you're doing some calculations, don't just use the end result. Right the calculations so later we can easily figure out why you chose that value.
- Use variables if you're using the same value more than once, and these values should be the same all the time (Just because you're using the value `10` in two different rules doesn't mean they should share the same variable. Use a variable if these two rules MUST be using the same value. So if later you changed one to `20`, the other one should be updated as well). The following is an example of using variables:
  ```scss
  $border-width: 2px;
  .chaise-btn {
    border: $border-width solid;
  }

  .chaise-btn-btn-group > > .chaise-btn:not(:first-child):not([disabled]) {
    margin-left: $border-width * -1;
  }
  ```
- If the variables you want to define are used in multiple places, add them to `variables.scss`. And make sure to use `@use` for using this variable in other places. For example:
  ```scss
  // _variables.scss
  $my-variable: 5px;

  // _file1.scss
  @use 'variables';

  .sample-element {
    margin-right: variables.$my-variable;
  }

  // _file2.scss
  @use 'variables';

  .another-element {
    margin-right: variables.$my-variable * -1;
  }
  ```
- You can also opt to define a map instead of simple variables. To do so,
  - Add a new file under `src/assets/scss/maps`, and define your map in there.
    ```scss
    // _my-new-map.scss
    $my-map: (
      'value1': #333,
      'value2': #ccc
    );
    ```
  - Import your file at the end of `src/assets/scss/_variables.scss`.
    ```scss
    // _variables.scss
    // ...

    @import 'maps/my-new-map';
    ```
  - Use `map-get` for accessing the map values:
    ```scss
    // _file.scss

    @use 'sass:map';
    @use 'variables';

    // ...
    .my-element {
      color: map-get(variables.$my-new-map, 'value1');
    }
    ```


- How each browser renders printing styles is different from the other. Mac and Windows behave differently for the same browser type (Firefox, Chrome, etc.). Hence we need to keep in mind the following while writing print rules in CSS.

  - If table borders or other line elements are not visible in the print preview or the PDF, check if there exists any overriding
    bootstrap rules. These bootstrap rules could be a `background-color`, `background-border`, etc., and they always take precedence over the custom CSS rules that are defined in the @media-print section of the CSS file.

  - If yes, we must override those rules with `!important` to get the desired effect.

  - A new class has been defined to apply custom styling to the case of Firefox browser in combination with MacOs, which can be found [here](../user-docs/custom-css.md).
  - Use the print mode in the rendering tab to see how the document looks when printed in the Chrome browser. On Firefox, this can be achieved
    by clicking on a small page icon in the "Inspect Element mode".

  - The print preview that is seen when doing a `Ctrl-P` on Windows or a `Cmd-P` on Mac doesn't necessarily give you the right picture of
    the document to be printed. To view what will be printed, either save to PDF file or chose to switch to the 'Print mode' as described above.

  - Scrolling can be persisted by using the `scrolling : scroll` option.

### Font Awesome

In font-awesome, each font/icon can either be solid, regular, or light. In some cases
only one version is available in the free, open-source version that we're using.

While using these types of fonts, the font-awesome website directs us to use `fa-solid` (`fas`)  for sold,
`fa-regular` (`far`) for regular, and `fa-light` (`fal`) for light. `fa-light` is not available in the free version, so
we should not use it at all. From the font-awesome source, the only difference between `fa-regular` and `fa-solid` is font-weight:

```css
.fa-regular, .fa-solid {
    font-family: "Font Awesome 6 Free";
}

.fa-regular {
    font-weight: 400;
}

.fa-solid {
    font-weight: 900;
}
```

This can cause some inconsistencies where `fa-regular`/`fa-solid` are used in places where we're
manually changing the `font-weight`. For example, assume the following icon is used.

```html
<span class="fa-solid fa-ellipsis-v some-icon"></span>
```
And we're using the following CSS rule

```css
.some-icon {
  font-weight: 400 !important;
}
```

Even though by using `fa-solid` we were meant to use the solid version of the font,
the CSS rule will make sure we're using the regular version instead. And in this
case, the regular version of `fa-ellipsis-v` is not available in the free version of font-awesome that we're using. So,
- We have to be careful where we're using font-awesome and avoid any manual changing
of `font-family` or `font-weight` and let font-awesome handle it for us.
- While changing font-awesome versions, we have to make sure the fonts that we're using
  are available. In some cases, we might want to change the font-weight group by
  updating the font-awesome classes that are used.

### Handling time

Regarding `timestamp` and `timestamptz` column types:

- A `timestamptz` value is stored as a single point in time in Postgres. When the value is retrieved, the value is in whatever time zone the database is in.
- A `timestamp` value is stored as a string with the date and time; time zone info will be dropped in Postgres.
- When submitting values for `timestamp` and `timestamptz` columns, the app should just submit the values as browser's local time.
- When displaying `timestamp` value, display whatever is in the database (the date and time, no need to convert to local time because there's no time zone info attached anyway)
- When displaying `timestamptz` value, convert that value to browser's local time.

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
│   ├── providers
│   │   └── <feeature>.tsx
│   ├── services
│   │   └── <feature>.ts
│   ├── utils
│   │   └── <function>.ts
│   └── vendor
├── webpack
│   ├── templates
│   ├── app.config.js
│   └── main.configjs
├── Makefile
└── package.json
```

- `assets`: This folder is used to house all the fonts, images, and SCSS files. The component-specific SCSS files should have the same name as their component file.
- `components`: Each app will rely on similar components for functionality and display purposes. If there is a need to reuse code, even if that's in only 2 places, a common component should be extracted and placed in the components folder.
- `libs`: Independent applications that may be used in non-React environments outside of Chaise.
- `models`: The models or types that are
- `providers`: Providers are a way to have a consistent state that can be accessed by any component at any level of the parent/child component hierarchy. Providers make use of React hooks to manage the app state.
- `services`: Services are used for common functionality like interacting with the server, configuring the application, managing the user session, and more. These functional services provide a scope that is shared throughout the service that each function can interact with.
- `utils`: Utilities are intended to be collections of functions exported individually that are then imported as needed in other places.


## Building and installation

This section will focus on more advanced details related to installation. Please refer to the installation guide in the `user-docs` folder for general information. The build process uses Makefile to simplify what needs to be called from the command line to get started. `Make` will manage dependency installation (through `npm`) and the react build process (using `webpack`).

#### Make targets

The following targers can be used for installing dependencies. Try to avoid directly calling `npm` and use these commands unless you want to add a new module or update the existing ones.

- `npm-install-modules`: Installs the dependencies needed for building the app in production mode.
- `npm-install-all-modules`: Install all the dependencies including the ones needed during development and testing. Since we had to patch webdriver-manager, this command will also call `patch-package` to apply the patch.

The following targets are designed for building chaise apps:

- `dist`: This target is designed for deployment environments, where we want to make sure we can install from scratch without any hiccups and errors. That's why we're always doing a clean installation (`npm ci`) as part of this command, which will ensure that the dependencies are installed based on what's encoded in the `package-lock.json` (without fetching new versions from the upstream). While developing features in Chaise, you should only run this command during the first installation or when `package-lock.json` has been modified.
- `dist-wo-deps`: Designed for development purposes, will only build and install Chaise.

The following are deploy targets:

- `deploy`: Deployed the built folders into the given location.
- `deploy-w-config`:  The same as `deploy`, but will also `rsync` the configuration files.

#### NPM
This section will go over how we think the NPM modules should be managed.

- Ensure the latest stable Node.js and NPM versions are used.
- Use `make npm-install-all-modules` to install all the NPM modules regardless of `NODE_ENV` value.
  - Useful when you first clone the repository, or want to download dependencies from scratch.
  - Use it yo update the installed dependencies based on the changes in `pacakge-lock.json` file.
  - his command will also call `patch-package` to apply the patches to dependencies. Refer to [patches folder](../../patches/README.md) for more information.
- Use `make dist-wo-deps` while developing so you don't have to install depenendencies for each build.
- Avoid using `npm install` (it can have unwanted side effects like updating `package-lock.json`).
  - `pacakge-lock.json` should not be changed. If you noticed a change in your branch, consult with the main contributors.
- Only for main contributors: If we want to upgrade the dependencies or install a new package, we should,
  - Ensure the used node and npm versions are updated and the latest stable.
  - Run `npm install --include=dev` to sync `package-lock.json` with `package.json`.
  - Double-check the changes to `package-lock.json`.
- Only for main contributors: to publish a new version of chaise to npm, we should,
  1. Update the `version` property in `package.json`.
  2. Update the `version` and `packages.version` properties in `package-lock.json`. Or run `npm install --include=dev`.
    - If you used `npm install` double-check the changes to `package-lock.json`.
  3. Push the changes to the main branch.
  4. After pushing the changes, `npm-publish.yml` GitHub workflow will detect the version change and properly publish the new version to npm.

## Structure of an App
Since Chaise is a collection of multiple single-page apps (`recordset`, `record`, `recordedit`, etc.), the app setup will be very similar. This similar structure allowed us to factor out a lot of that common setup code into different bits described below.

### Main HTML
The instantiation and bundle of dependencies should be the same for each app. The build process using webpack will generate the outer HTML based on `webpack/templates/main.html`. Each app attaches to the element with `id` equal to `chaise-app-root` defined in `main.html`.

### App Wrapper
Each app in Chaise is instantiated and configured the same way as far as creating the outer HTML and <head> tag, wrapping the app in the proper providers, configuring Chaise and ermrestJS, and fetching the session. To help manage parts of this, we created a component called `AppWrapper` to wrap each app for setup and configuration.

### Context
For state sharing between components, Chaise is using the built-in `useContext` hook. Each application has its top-level context, with each component defining its own context as needed (like alerts and errors).

### Error Provider
To handle global errors, the app wrapper adds an `ErrorProvider` to handle the error state and an `ErrorBoundary` to catch the errors. Each app only needs to throw errors to let the global handler decide what to do with them.

### Alerts Provider
`Alerts` also has its own provider created to have a consistent state at the app level when trying to show alerts from sub-components of the app. The provider here acts like a service that handles the functionality surrounding alerts. This provider also allows for showing alerts in multiple places without having duplicate alerts show in the wrong contexts.

### Authn Provider
`Authn` has its own provider that acts as a service to manage the logged in user and keep that user state consistent throughout the duration of using the app. Each app has to interact with the session to best inform the user of what actions they can take related to create, update and delete.

### Chaise Navbar
The navbar for each Chaise app is the same style. It is loaded as part of the configuration phase in the app wrapper. All apps in Chaise can decide to show or hide the navbar as part of defining the `AppWrapper` component.

### Buttons vs Links
We want to be aware of why we are using `<button>` or `<a>` tags. Generally we should use `<a>` for navigation when possible since this allows for other operating system and browser features. More details about which buttons and links are used for actions or navigation can be found in [this spreadsheet](https://docs.google.com/spreadsheets/d/1p7fI8Uput9nUuG1oc7m8ZfNwS0pu-HU70PmMDhcNmHM/edit#gid=0).

## Using Chaise through npm

Using npm, we can implement Chaise-like applications and use Chaise's existing code. This is how we're using Chaise to develop [`deriva-webapps`](https://github.com/informatics-isi-edu/deriva-webapps) React applications.

### 1. Install Chaise and dev dependencies

Just like any other npm packages, we first need to include the latest version of `@isrd-isi-edu/chaise` in `package.json`, or do

```sh
npm install --save @isrd-isi-edu/chaise
```

By doing so, npm will also install all the `dependencies` of Chaise, so you don't need to include `react`, react-boostrap`, and [other packages listed here](https://github.com/informatics-isi-edu/chaise/blob/master/package.json).


We recommend installing similar `devDependencies` as Chaise (e.g., `eslint`) to facilitate the development process.

### 2. Use AppWrapper for your app

To make the process of developing applications easier, we've implemented [the `AppWrapper` component](https://github.com/informatics-isi-edu/chaise/blob/master/src/components/app-wrapper.tsx). This component,

- Includes bootstrap and font-awesome styles, so you can use them freely in your components.
- Fetches the catalog and configures Chaise/ERMrestJS.
- Fetches the session and makes sure it's available throughout the app.
- Displays navbar and/or alerts based on the given parameters.
- Can override the behavior of download (to check before navigating) or external links (to open a modal before redirecting).

The following is a simple example of using it:

```tsx
import { createRoot } from 'react-dom/client';
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import { ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

const myappSettings = {
  appName: 'app/sample',
  appTitle: 'Sample App',
  overrideHeadTitle: false,
  overrideImagePreviewBehavior: false,
  overrideDownloadClickBehavior: false,
  overrideExternalLinkBehavior: false
};

const MyApp = (): JSX.Element => {
  return (
    <div>Hello world!</div>
  )
};

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={matrixSettings} includeNavbar displaySpinner ignoreHashChange>
    <MyApp />
  </AppWrapper>
);
```

> :warning: CAUTION :warning: In the following step we will go over how to use the existing webpack config. This config will use Chaise's HTML template. So you MUST use the `ID_NAMES.APP_ROOT` like above to refer to the proper container in the template.

### 3. Configure webpack and build

Chaise includes webpack configuration helper functions that should be used for building bundles. The function can be found under the `@isrd-isi-edu/chaise/webpack/app.config` location. The following is an example of doing this:

```tsx
const { getWebPackConfig } = require('@isrd-isi-edu/chaise/webpack/app.config');
const path = require('path');

// if NODE_DEV is defined properly, use it. Otherwise set it to production.
const nodeDevs = ['production', 'development'];
let mode = process.env.NODE_ENV;
if (nodeDevs.indexOf(mode) === -1) {
  mode = nodeDevs[0];
}

const rootFolderLocation = path.resolve(__dirname, '..');
const resolveAliases = { '@isrd-isi-edu/deriva-webapps': rootFolderLocation };

module.exports = (env) => {
  const WEBAPPS_BASE_PATH = env.BUILD_VARIABLES.WEBAPPS_BASE_PATH;
  return getWebPackConfig(
    [
      {
        appName: 'myapp',
        appTitle: 'MyApp',
        appConfigLocation: `${WEBAPPS_BASE_PATH}config/my-app-config.js`
      }
    ],
    mode,
    env,
    { rootFolderLocation, resolveAliases, urlBasePath: WEBAPPS_BASE_PATH }
  );
};
```

## Error handling

This section focuses on error handling practices that we should follow while migrating from AngularJS to React.

In the AngularJS implementation of Chaise, we rely on `window.onerror` and `$exceptionHandler` to catch any asynchronous or synchronous errors that might happen while processing the page.

Both of the mentioned methods are working as a "catch-all" where we're calling the `handleException` function in `ErrorService`. This function can handle both expected/known errors (e.g. 403 from a read request), or unexpected/unknown errors (e.g. JavaScript errors because of programmatic mistakes).

Therefore the general guideline, regardless of the asynchronous or synchronous nature of the error, was:
- If you want a local treatment of errors, catch the errors locally.
- Otherwise, throw the error (which means the "catch-all" logic would handle it properly).

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

## Context and provider pattern

Our apps heavily rely on [`Context`](https://reactjs.org/docs/context.html) to facilitate how components communicate. This helps us to avoid passing props on each level and instead use the [`useContext`](https://reactjs.org/docs/hooks-reference.html#usecontext) hook to access the context.

### How to implement

Before going through the providers that we've implemented for Chaise apps, let's go over the skeleton of how we're using `Context`. This example is just to demonstrate the concept. In a small example like the following, it's more efficient to just pass the props without using context/provider.

#### 1. Create context and Provider component

First we need to define the context and a provider to use it. The following is a simple example of this:

```tsx
// src/providers/counter.tsx

const CounterContext = React.createContext<{
  counter: number;
} | null>(null);

type CounterProviderProps = {
  children: React.ReactNode,
  initialCounter: number
};

export default function CounterProvider({
  children,
  initialCounter
}: CounterProviderProps): JSX.Element {

  const [counter, setCounter] = useState(initialCounter);

  const [lastModified, setLastModified] = useState<Date | null>(null);

  const addOneToCounter = () => {
    setLastModified(new Date());
    setCounter((counter) => counter + 1);
  }

  const providerValue = useMemo({
    counter,
    addOneToCounter,
    lastModified,
  }, [counter, lastModified])

  return <CounterContext.Provider value={providerValue}>{children}</CounterContext.Provider>
}
```

#### 2. Add custom hook

Now that we have the context, we need a way to access it. To do so, we create a custom hook:

```ts
// src/hooks/counter.ts

function useCounter() {
  const context = useContext(CounterContext);
  if (!context) {
    throw new Error('No CounterProvider found when calling CounterContext');
  }
  return context;
}

export default useCounter;
```

#### 3. Use provider in the parent

We cannot use the context and provider in the same component. The provider must be wrapping the parent component that will use the context. If there's a logical parent for your component, add the provider. In the example below, `Example` component will use the context, and `Container` is wrapping it.

```tsx
// src/components/container.tsx

const Container = () => {
  ...
  return (
    <CounterProvider>
       <CounterDisplay />
    </CounterProvider>
  )
};

export default Counter;
```

#### 4. Use custom hook to acces the context

To follow the previous example, the following is how `CounterDisplay` component would look like:

```tsx
// src/components/counter-display.tsx

const CounterDisplay = () => {
  const { counter } = useCounter();

  return (
    <span>{counter}</span>
  )
};

export default CounterDisplay;
```

As we mentioned in the previous step, the provider and `useContext` must be on two different levels. In some cases, there isn't a logical parent-child relationship. So instead, we define both in the same file and use the "Inner" suffix. For instance, assume that we didn't want the `Container`, then the following is how `counter-display.tsx` would look like:

```tsx
// src/components/counter-display.tsx

const CounterDisplay = () => {

  return (
    <CounterProvider>
       <CounterDisplayInner />
    </CounterProvider>
  )
};

const CounterDisplayInner = () => {
  const { counter } = useCounter();

  return (
    <span>{counter}</span>
  )
};

export default CounterDisplay;
```

## Performance

In this section, we should summarize everything related to performance. This includes how to debug performance issues and common practices to fix issues. 

### Debugging

Before jumping into solutions, consider debugging and finding the root of the problem. 

- You should install official [React developer tools](https://react.dev/learn/react-developer-tools). With this, you can look at components and see when/why each rerenders.
  - By default, the "Profiler" tab only works in development mode. To use this tab in the production mode, you need to uncomment the `'react-dom$': 'react-dom/profiling',` alias in the [app.config.js](https://github.com/informatics-isi-edu/chaise/blob/master/webpack/app.config.js) file.
- Installing in the `development` mode allows you to add break points in the code. You should also be mindful of the browser console, as React and other dependencies usually print warning/errors only in this mode. That being said, as we mentioned in [here](#development-vs-production), `development` has its downsides.

### Memoization

React always re-renders children when a parent component has to be re-rendered. But since we're using the provider pattern, the immediate relationship is unimportant. So, if we find any performance issues, it is probably related to redundant components rendering because of this. `memo`  lets us skip re-rendering a component when its props are unchanged. You can see how we've used it [here](https://github.com/informatics-isi-edu/chaise/pull/2341/commits/29720eb277faaa6fc768a912ffcf8a8ec4776980), which significantly improved the performance of record page.

That being said, performance-related changes applied incorrectly can even harm performance. Use `React.memo()` wisely. Don't use memoization if you can't quantify the performance gains.

Useful links:
- https://react.dev/reference/react/memo
- https://dmitripavlutin.com/use-react-memo-wisely/

