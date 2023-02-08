# Use the navbar app on external HTML pages

This documentation focuses on the navbar and how it can be used in external HTML pages.

> This document will focus on the new implementation of the navbar using React. You can find the document for deprecated AngularJS implementation [here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/navbar-app-deprecated.md). You can also jump to [Migrate from AngularJS](#migrate-from-angularjs) section for information about moving from AngularJS to React implementation.

## Table of Contents

* [How to add the navbar app](#how-to-add-the-navbar-app)
  + [1. Install Chaise](#1-install-chaise)
  + [2. Include navbar dependencies](#2-include-navbar-dependencies)
    - [2.1. Change the build process to prefetch dependencies (Preferred method)](#21-change-the-build-process-to-prefetch-dependencies-preferred-method)
      * [Example](#example)
    - [2.2. Dynamically fetch the dependencies](#22-dynamically-fetch-the-dependencies)
  + [3. Prefetch custom styles (optional)](#3-prefetch-custom-styles-optional)
  + [4. Use navbar](#4-use-navbar)
* [How to configure navbar](#how-to-configure-navbar)
* [How to customize navbar UI](#how-to-customize-navbar-ui)
* [Migrate from AngularJS](#migrate-from-angularjs)
* [Notes](#notes)

## How to add the navbar app

You need to follow these steps to add the navbar app to any non-Chaise web page:

### 1. Install Chaise

Make sure Chaise is properly installed. The following steps (and the navbar app) assume that Chaise is installed and deployed on the server. For more information about how to install Chaise please refer to [installation document](installation.md).

### 2. Include navbar dependencies

For the navbar to work, we need to include several JavaScript and CSS files on the page. To do so, you can either change your build process to prefetch them or include a JavaScript file that will dynamically fetch them. The first method MUST be done after Chaise installation; otherwise, it would break the app. That's why we suggest doing it as part of the automated process of building Chaise and other apps.

While the second method seems more straightforward, it will drastically affect the UX by increasing the load time of the navbar. Therefore we recommend the first method.

#### 2.1. Change the build process to prefetch dependencies (Preferred method)

To summarize, after Chaise installation in your build scripts, you need to copy the contents of `lib/navbar/navbar-dependencies.html` into the HTML page that displays the navbar.

```html
<head>
    <!-- other assets on the page -->

    <!-- TODO add the contents of lib/navbar/navbar-dependencies.html here -->

    <!-- other assets on the page -->
</head>
```
We mentioned build scripts because you MUST NOT copy the contents of `lib/navbar/navbar-dependencies.html` manually, and this should be part of the automated process of building Chaise and your other apps.

> :warning: CAUTION :warning: Manually copying files will break the navbar app as the navbar dependencies will change over time. If you prefer to keep your build process the same, please consider [the second method](#22-dynamically-fetch-the-dependencies).

##### Example
The following is an example of how this can be achieved using [Jekyll](https://jekyllrb.com):

1. Make sure `make dist` and `make deploy` are done in Chaise.
    - This will create the `dist` folder in your specified build target (by default, it's `/var/www/html/chaise`).
    - It will also generate the `lib/navbar/navbar-dependencies.html` file.

2. Copy the `lib/navbar/navbar-dependencies.html` file into your `_includes` folder.
    - As we mentioned, this MUST be part of your automated build process and should not be done manually.
    - `_includes` folder [is specific to Jekyll](https://jekyllrb.com/docs/includes/). You should be able to find it in the root location of your Jekyll website repository.
    - As an example, the following is how one of our internal deployments is doing this:
      ```sh
      rsync -a   /home/${DEVUSER}/chaise/lib/navbar/navbar-dependencies.html   /home/${DEVUSER}/facebase-www/www/_includes/.
      ```

3. Include the file using `%include` statement:
    ```html
    <head>
        {% include navbar-dependencies.html %}
    </head>
    ```

4. Build your Jekyll site as you normally would (using `jekyll build` or `jekyll serve` commands.)

#### 2.2. Dynamically fetch the dependencies

To automatically fetch the dependencies, you must include the `/chaise/lib/navbar/navbar.dependencies.js` on your page.

```html
<head>
    <script src="/chaise/lib/navbar/navbar.dependencies.js"></script>
</head>
```

As we mentioned before, this can cause UX issues as it will increase the loading time of the navbar app.

### 3. Prefetch custom styles (optional)

If you define the `customCSS` property in your [chaise-config](chaise-config.md), Chaise will fetch it during the runtime. To increase the performance, you can prefetch this file by including it in your HTML file (this only needs to be done once and can be done manually). So

```html
<head>
    <!-- TODO include your customCSS file here -->
    <!-- TODO
      AUTOMATICALLY add the contents of lib/navbar/navbar-dependencies.html here
      OR
      <script src="/chaise/lib/navbar/navbar.dependencies.js"></script>
    -->
</head>
```
If you want to prefetch it, the include statement MUST be added before the content of `lib/navbar/navbar-dependencies.html` .

### 4. Use navbar

The navbar React app expects a `navbar` tag on the page and will populate the app inside it. So make sure you've included it as the first element on the body of your page.

```html
<body>
    <navbar></navbar>
   <!-- the rest of the page  -->
</body>
```

## How to configure navbar

The navbar app can be customized by defining different properties in the "chaise-config". Please refer to [chaise-config document](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/chaise-config.md#navbar-configuration) for complete list of properties that are supported.


The `navbarMenu` property is the most complex of the above properties. This parameter is used to customize the menu items displayed in the navbar at the top of all Chaise apps by supplying an object with links and/or dropdown menus. Consult the [chaise-config-sample.js](https://github.com/informatics-isi-edu/chaise/blob/master/chaise-config-sample.js) file for more details about the format.
 - Each option has an optional newTab property that can be defined at any level. If undefined at root, newTab is treated as true. Each child menu item checks for a newTab property on itself; if nothing is set, the child inherits from its parent.
 - Each option accepts an 'acls' object with two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click that link.
 - The url property of each menu object allows for templating of the catalog id parameter.
   - More info can be found in the [templating document](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/mustache-templating.md)
 - The header property of each menu object will create an unclickable bold header with class chaise-dropdown-header when set to `true`.

## How to customize navbar UI

With the current HTML structure, it is possible to apply different styles to customize the appearance. The following are common rules that can be used to customize the UI and behavior of navbar:

1. Preserve space for navbar while its loading (to reduce the page shift):
    ```css
    navbar {
      height: YOUR_VALUE;
      background-color: YOUR_VALUE;
      display: block;
    }
    ```

2. Change the navbar background color:

    ```css
    /* change the navbar background color */
    .navbar-inverse {
      background-color: YOUR_VALUE;
    }
    ```

3. Change the brand text color:

    ```css
    /* change the brand text color */
    .navbar-inverse .navbar-brand{
      color: YOUR_VALUE;
    }
    ```
4. Change color of text on right side of navbar (login/signup links)

    ```css
    /* change color of text on right side of navbar (login/signup links) */
    .navbar-inverse .navbar-nav.navbar-right > div > a.nav-link {
      color: YOUR_VALUE;
    }
    ```

5. Change the color of first level navbar menu options

    ```css
    /* change the color of first level navbar menu options */
    .navbar .navbar-menu-options a.nav-link {color: YOUR_VALUE; font-size: YOUR_VALUE;}
    .navbar .navbar-menu-options a.nav-link:hover {color: YOUR_VALUE;}
    .navbar .navbar-menu-options a.nav-link:visited {color: YOUR_VALUE;}
    ```

6. Change the minimum height of navbar
    ```css
    /* change the minimum height of navbar */
    .navbar {
      min-height: YOUR_VALUE;
    }
    ```

7. We get a vertical navbar when the width is lesser than the content, you can change the max-height of that navbar after which we will see a scrollbar to ensure it doesn’t take over the entire page (default if not customized is 340px)

    ```css
    .navbar-collapse {
      max-height: YOUR_VALUE;
    }
    ```

## Migrate from AngularJS

The following are the major things that have changed from AngularJS to React:

1. If you're prefetching the dependencies:
   1. The include statements for prefetching dependencies are now under `lib/navbar/navbar-dependencies.html`. So in build recipes change the location like the following:
    ```diff
    - /dist/chaise-dependencies.html
    + /lib/navbar/navbar-dependencies.html
    ```
   2. While in AngularJS, you need to include a `navbar.app.js` regardless of prefetching dependencies, in React implementation, you don't need to include anything else if you're prefetching the dependencies. So in your HTML file:
   ```diff
   - <script src="/chaise/lib/navbar/navbar.app.js"></script>
   ```
2. If you don't want to change the build process to prefetch the dependencies:
   1. You need to include the `navbar.dependencies.js` file (notice that its name has been changed from `navbar.app.js`). In your HTML file:
   ```diff
   - <script src="/chaise/lib/navbar/navbar.app.js"></script>
   + <script src="/chaise/lib/navbar/navbar.dependencies.js"></script>
   ```
3. AngularJS implementation uses the Boostrap 3 version, while in React implementation, we use Bootstrap 5. As a result, you will notice changes on the page. The following are some of the most noticeable changes:
   - The navbar implementation has been changed, and we're no longer using `ul` or `li` for the menu options. Please refer to the previous section for more information.
   - The default color of links and buttons has been changed (Bootstrap 5 uses a less saturated blue color. Links also show the underline in the new version).
   - Bootstrap rules for `container` width and margin have changed.

## Notes

1. Some CSS rules in Chaise might conflict with the ones used in your HTML page. Also, the CSS rules on your static page might affect the navbar. So if you're seeing some weird UIs, it could be because of these clashing rules. When the navbar app is completely loaded, the following is the rough structure of the elements it will create. If you have some CSS rules that apply to these elements, they will also apply to the navbar and can cause issues:
    ```html
    <navbar>
      <div class="app-container">
        <div class="app-header-container">
          <header id="navheader">
            <nav id="mainnav" class="navbar-inverse navbar navbar-expand-lg navbar-dark">
              <a href="/" class="navbar-brand">
                <!-- the navbar brand and logo -->
              </a>
              <button class="navbar-toggler collapsed">
                Menu
              </button>
              <div class="navbar-collapse collapse">
                <div class="navbar-menu-options nav navbar-nav" id="menubarHeader">
                  <!-- menu options -->
                </div>
                <div class="login-menu-options nav navbar-nav navbar-right navbar-nav">
                  <!-- other parts of navbar (login, profile, search by rid, etc) -->
                </div>
              </div>
            </nav>
          </header>
        </div>
      </div>
    </navbar>
    ```

2. The bootstrap version of the HTML page might differ from the ones used in Chaise. This might produce some inconsistent behavior on the HTML page.
