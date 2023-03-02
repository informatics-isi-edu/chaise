# Use the login app on external HTML pages

This documentation focuses on the login app and how it can be used in external HTML pages.

This document will focus on the new implementation of the login app using React. You can find the document for deprecated AngularJS implementation [here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/login-app-deprecated.md).

## Table of Contents

* [How to add the login app](#how-to-add-the-login-app)
  + [1. Install Chaise](#1-install-chaise)
  + [2. Include login dependencies](#2-include-login-dependencies)
    - [2.1. Change the build process to prefetch dependencies (Preferred method)](#21-change-the-build-process-to-prefetch-dependencies-preferred-method)
      * [Example](#example)
    - [2.2. Dynamically fetch the dependencies](#22-dynamically-fetch-the-dependencies)
  + [3. Prefetch custom styles (optional)](#3-prefetch-custom-styles-optional)
  + [4. Use login](#4-use-login)
* [Notes](#notes)


## How to add the login app

You need to follow these steps to add the login app to any non-Chaise web page:

### 1. Install Chaise

Make sure Chaise is properly installed. The following steps (and the login app) assume that Chaise is installed and deployed on the server. For more information about how to install Chaise please refer to [installation document](installation.md).

### 2. Include login dependencies

For the login to work, we need to include several JavaScript and CSS files on the page. To do so, you can either change your build process to prefetch them or include a JavaScript file that will dynamically fetch them. The first method MUST be done after Chaise installation; otherwise, it would break the app. That's why we suggest doing it as part of the automated process of building Chaise and other apps.

While the second method seems more straightforward, it will drastically affect the UX by increasing the load time of the login. Therefore we recommend the first method.

#### 2.1. Change the build process to prefetch dependencies (Preferred method)

To summarize, after Chaise installation in your build scripts, you need to copy the contents of `lib/login/login-dependencies.html` into the HTML page that displays the login. This file won't be present in the Chaise repository folder, and you can only find this folder where you've deployed chaise (By default it should be under `/var/www/chaise/`).

```html
<head>
    <!-- other assets on the page -->

    <!-- TODO add the contents of /var/wwww/html/lib/login/login-dependencies.html here -->

    <!-- other assets on the page -->
</head>
```
We mentioned build scripts because you MUST NOT copy the contents of `lib/login/login-dependencies.html` manually, and this should be part of the automated process of building Chaise and your other apps.

> :warning: CAUTION :warning: Manually copying files will break the login app as the login dependencies will change over time. If you prefer to keep your build process the same, please consider [the second method](#22-dynamically-fetch-the-dependencies).

##### Example
The following is an example of how this can be achieved using [Jekyll](https://jekyllrb.com):

1. Make sure `make dist` and `make deploy` are done in Chaise.
    - This will create the `dist` folder in your specified build target (by default, it's `/var/www/html/chaise`).
    - It will also generate the `lib/login/login-dependencies.html` file.

2. Copy the `lib/login/login-dependencies.html` file into your `_includes` folder.
    - As we mentioned, this MUST be part of your automated build process and should not be done manually.
    - `_includes` folder [is specific to Jekyll](https://jekyllrb.com/docs/includes/). You should be able to find it in the root location of your Jekyll website repository.
    - As an example, the following is how one of our internal deployments is doing this:
      ```sh
      rsync -a   /home/${DEVUSER}/chaise/lib/login/login-dependencies.html   /home/${DEVUSER}/facebase-www/www/_includes/.
      ```

3. Include the file using `%include` statement:
    ```html
    <head>
        {% include login-dependencies.html %}
    </head>
    ```

4. Build your Jekyll site as you normally would (using `jekyll build` or `jekyll serve` commands.)

#### 2.2. Dynamically fetch the dependencies

To automatically fetch the dependencies, you must include the `/chaise/lib/login/login.dependencies.js` on your page.

```html
<head>
    <script src="/chaise/lib/login/login.dependencies.js"></script>
</head>
```

As we mentioned before, this can cause UX issues as it will increase the loading time of the login app.

### 3. Prefetch custom styles (optional)

If you define the `customCSS` property in your [chaise-config](chaise-config.md), Chaise will fetch it during the runtime. To increase the performance, you can prefetch this file by including it in your HTML file (this only needs to be done once and can be done manually). So

```html
<head>
    <!-- TODO include your customCSS file here -->
    <!-- TODO
      AUTOMATICALLY add the contents of lib/login/login-dependencies.html here
      OR
      <script src="/chaise/lib/login/login.dependencies.js"></script>
    -->
</head>
```
If you want to prefetch it, the include statement MUST be added before the content of `lib/login/login-dependencies.html` .

### 4. Use login

The login React app expects a `login` tag on the page and will populate the app inside it. So make sure you've included it on your page.

```html
<body>
  <!-- the rest of the page  -->
  <login></login>
  <!-- the rest of the page  -->
</body>
```

The login app is written to work mainly with the bootstrap default navbar UI, so we recommend following the same pattern:
```html
<body>
  <nav class="navbar-inverse navbar navbar-expand-lg">
    <a href="/" class="navbar-brand">
      <!-- the navbar brand and logo -->
    </a>
    <button class="navbar-toggler collapsed">
      Menu
    </button>
    <div class="navbar-collapse collapse">
      <div class="navbar-menu-options nav navbar-nav">
        <!-- menu options -->
      </div>
      <div class="login-menu-options nav navbar-nav navbar-right navbar-nav">
        <login></login>
      </div>
    </div>
  </nav>
  <!-- the rest of the page  -->
</body>
```

## Notes

1. Some CSS rules in Chaise might conflict with the ones used in your HTML page. Also, the CSS rules on your static page might affect the login. So if you're seeing some weird UIs, it could be because of these clashing rules.

2. The bootstrap version of the HTML page might differ from the ones used in Chaise. This might produce some inconsistent behavior on the HTML page.
