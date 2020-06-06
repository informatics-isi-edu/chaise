# Use login app in external HTML pages

This documentation focuses on login and how it can be used in external HTML pages.

## Table of Contents
- [How to add navbar app](#how-to-add-navbar-app)
  * [1. Install Chaise](#1-install-chaise)
  * [2. Include Chaise dependencies](#2-include-chaise-dependencies)
    + [2.1. Prefetch Chaise dependencies](#21-prefetch-chaise-dependencies-optional)
    + [2.2. Prefetch custom styles](#22-prefetch-custom-styles-optional)
  * [3. Use navbar](#3-use-navbar)
- [Sample HTML page](#sample-html-page)
- [Notes](#notes)

## How to add login app

To add login app to any non-Chaise web-page, you need to follow these steps.

### 1. Install Chaise

Make sure Chaise is properly installed. The next steps (and login app) are assuming that Chaise is installed and deployed on the server. For more information about how to install Chaise please refer to [installation document](installation.md).

### 2. Include Chaise dependencies

You need to include `login.app.js` that is part of Chaise in your HTML page. The rest of dependencies will be dynamically fetched by `login.app.js`. Since this might drastically affect the performance, we suggest doing the next steps to prefetch them.

```html
<head>
    <script src="/chaise/lib/login/login.app.js"></script>
</head>
```

#### 2.1. Prefetch Chaise dependencies (optional)

Login app has more dependencies that, if not included, are fetched dynamically. Hence it's highly recommended that you prefetch these dependencies.  To make it simpler, during installation, Chaise creates the list of dependencies in the `dist/chaise-dependencies.html` file.  So you need to include the contents of this file in your HTML.

```html
<head>
    <!-- TODO add the contents of dist/chaise-dependencies.html here -->
    <script src="/chaise/lib/login/login.app.js"></script>
</head>
```

The position of where you're adding these include statements is very important. It HAS TO be BEFORE `login.app.js`.  Adding them after `login.app.js` defeats the purpose of prefetching and actually causes duplicated fetching.

You should not copy the contents of `dist/chaise-dependencies.html` manually and this should be part of the automated process of building Chaise and your other apps (Since the list generation is controlled by Chaise, we might update the list and therefore you should make sure you're always getting the latest list of dependencies.)  

If you're using [Jekyll](https://jekyllrb.com), the following are the steps on how you can achieve this:

1. After `make install` is done in Chaise, copy the `dist/chaise-dependencies.html` file into your `_includes` folder.
    - As it was mentioned, this part MUST be part of your automated build process, and should not be done manually.
    - `dist` folder is created by `make install` in your speicified build target (by default it's `/var/www/html/chaise/`), so you have to make sure `make install` is done before copying the file.
    - `_includes` folder [is specific to Jekyll](https://jekyllrb.com/docs/includes/). You should be able to find it in the root location of your Jekyll website.

2. Include the file using `%include` statement:
    ```html
    <head>
        {% include chaise-dependencies.html %}
        <script src="/chaise/lib/login/login.app.js"></script>
    </head>
    ```

#### 2.2. Prefetch custom styles (optional)

If you define `customCSS` property in your [chaise-config](chaise-config.md), Chaise will fetch it during the runtime. To increase the performance, you can prefetch this file by including it in your HTML file. So

```html
<head>
    <!-- TODO include your customCSS file here -->
    <!-- TODO add the contents of dist/chaise-dependencies.html here -->
    <script src="/chaise/lib/login/login.app.js"></script>
</head>
```
If you want to prefetch it, the include statement MUST be added before the content of `dist/chaise-dependencies.html` .

### 3. Use login

After installing Chaise and including the dependencies, you can now use login by including the directive in your HTML:

```html
<body>
    <login></login>
</body>
```

## Sample HTML page
 If you want to look at a sample HTML page, you can take a look at [sample-login.html file in Chaise](https://github.com/informatics-isi-edu/chaise/blob/master/lib/login/sample-login.html).

 [This](https://github.com/informatics-isi-edu/chaise/blob/master/lib/login/sample-loginOnRbk.html) is the RBK home page with the login app in the login. The styling of this page will be a little off as there are conflicts in the CSS classes used on this page and in chaise. These CSS rule conflicts will have to be resolved manually on the RBK home page by either changing the common class names like header and footer or overriding the chaise styles.

## Notes

1. The bootstrap and jQuery versions of the HTML page might be different from the ones used in Chaise. This might produce some inconsistent behavior on the HTML page.

2. Regardless of prefetching or allowing Login app to include the dependencies for you, it will fetch ERMrestJS. This might cause some issues if your page is already including ERMrestJS. It's better if you let Login app include it for you.

3. Some CSS classes in Chaise might conflict with the ones used in your HTML page.
