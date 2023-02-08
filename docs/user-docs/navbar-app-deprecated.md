# Use the AngularJS navbar app on external HTML pages

This documentation focuses on navbar and how it can be used in external HTML pages.

> This document focuses on deprecated AngularJS implementation. For the new implementation please refer to [this document](navbar-app.md).

## Table of Contents
- [How to add navbar app](#how-to-add-navbar-app)
  - [1. Install Chaise](#1-install-chaise)
  - [2. Include Chaise dependencies](#2-include-chaise-dependencies)
    - [2.1. Prefetch Chaise dependencies (optional)](#21-prefetch-chaise-dependencies-optional)
    - [2.2. Prefetch custom styles (optional)](#22-prefetch-custom-styles-optional)
  - [3. Use navbar](#3-use-navbar)
- [Sample HTML page](#sample-html-page)
- [4. Configuring Navbar](#4-configuring-navbar)
- [5. How to customize navbar UI](#5-how-to-customize-navbar-ui)
- [Notes](#notes)

## How to add navbar app

To add navbar app to any non-Chaise web-page, you need to follow these steps.

### 1. Install Chaise

Make sure Chaise is properly installed. The next steps (and navbar app) are assuming that Chaise is installed and deployed on the server. For more information about how to install Chaise please refer to [installation document](installation.md).

### 2. Include Chaise dependencies

You need to include `navbar.app.js` that is part of Chaise in your HTML page. The rest of dependencies will be dynamically fetched by `navbar.app.js`. Since this might drastically affect the performance, we suggest doing the next steps to prefetch them.

```html
<head>
    <script src="/chaise/lib/navbar/navbar.app.js"></script>
</head>
```

#### 2.1. Prefetch Chaise dependencies (optional)

Navbar app has more dependencies that, if not included, are fetched dynamically. Hence it's highly recommended that you prefetch these dependencies.  To make it simpler, during installation, Chaise creates the list of dependencies in the `dist/chaise-dependencies.html` file.  So you need to include the contents of this file in your HTML.

```html
<head>
    <!-- TODO add the contents of dist/chaise-dependencies.html here -->
    <script src="/chaise/lib/navbar/navbar.app.js"></script>
</head>
```

The position of where you're adding these include statements is very important. It HAS TO be BEFORE `navbar.app.js`.  Adding them after `navbar.app.js` defeats the purpose of prefetching and actually causes duplicated fetching.

You should not copy the contents of `dist/chaise-dependencies.html` manually and this should be part of the automated process of building Chaise and your other apps (Since the list generation is controlled by Chaise, we might update the list and therefore you should make sure you're always getting the latest list of dependencies.)

If you're using [Jekyll](https://jekyllrb.com), the following are the steps on how you can achieve this:

1. Make sure `make dist` and `make deploy` is done in Chaise.
    - This will create the `dist` folder in your specified build target (by default it's `/var/www/html/chaise`).
    - It will also generate the `dist/chaise-dependencies.html`.


2. Copy the `dist/chaise-dependencies.html` file into your `_includes` folder.
    - As it was mentioned, this MUST be part of your automated build process that is responsible for building Chaise, and should not be done manually.
    - `_includes` folder [is specific to Jekyll](https://jekyllrb.com/docs/includes/). You should be able to find it in the root location of your Jekyll website repository.


3. Include the file using `%include` statement:
    ```html
    <head>
        {% include chaise-dependencies.html %}
        <script src="/chaise/lib/navbar/navbar.app.js"></script>
    </head>
    ```


4. Build your Jekyll site as you normally would (using `jekyll build` or `jekyll serve` commands.)
    - As you most probably might know, this MUST be part of your automated build process, and should not be done manually. You just have to make sure that copying of `chaise-dependencies.html` is done prior to rebuilding the Jekyll site.

#### 2.2. Prefetch custom styles (optional)

If you define `customCSS` property in your [chaise-config](chaise-config.md), Chaise will fetch it during the runtime. To increase the performance, you can prefetch this file by including it in your HTML file. So

```html
<head>
    <!-- TODO include your customCSS file here -->
    <!-- TODO add the contents of dist/chaise-dependencies.html here -->
    <script src="/chaise/lib/navbar/navbar.app.js"></script>
</head>
```
If you want to prefetch it, the include statement MUST be added before the content of `dist/chaise-dependencies.html` .

### 3. Use navbar

After installing Chaise and including the dependencies, you can now use navbar by including the directive in your HTML:

```html
<body>
    <navbar></navbar>
</body>
```

## Sample HTML page
 If you want to look at a sample HTML page, you can take a look at [sample-navbar.html file in Chaise](https://github.com/informatics-isi-edu/chaise/blob/master/lib/navbar/sample-navbar.html).

## 4. Configuring Navbar

The navbar app can be customized by defining different properties in the "chaise-config". Please refer to [chaise-config document](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/chaise-config.md#navbar-configuration) for complete list of properties that are supported.


The `navbarMenu` property is the most complex of the above properties. This parameter is used to customize the menu items displayed in the navbar at the top of all Chaise apps by supplying an object with links and/or dropdown menus. Consult the [chaise-config-sample.js](https://github.com/informatics-isi-edu/chaise/blob/master/chaise-config-sample.js) file for more details about format.
 - Each option has an optional newTab property that can be defined at any level. If undefined at root, newTab is treated as true. Each child menu item checks for a newTab property on itself, if nothing is set, the child inherits from it's parent.
 - Each option accepts an 'acls' object that has two attribute arrays ('show' and 'enable') used to define lists of globus groups or users that can see and click that link.
 - The url property of each menu object allows for templating of the catalog id parameter.
   - More info can be found in the [templating document](https://github.com/informatics-isi-edu/ermrestjs/blob/master/docs/user-docs/mustache-templating.md)
 - The header property of each menu object will create an unclickable bold header with class chaise-dropdown-header when set to `true`.

## 5. How to customize navbar UI

With the current HTML structure, it is possible to apply different styles to customize the appearance. Overriding these selectors can help -

```css
/* change the navbar background color */
.navbar-inverse {
    background-color: YOUR_VALUE;
}
```

```css
/* change the brand text color */
.navbar-inverse .navbar-brand, .navbar-inverse .navbar-nav.navbar-right > li > a {
    color: YOUR_VALUE;
}
```

```css
/* change the color of options */
   .navbar-inverse .navbar-nav>li>a {color: YOUR_VALUE; font-size: YOUR_VALUE;}
   .navbar-inverse .navbar-nav>li>a:hover {color: YOUR_VALUE;}
   .navbar-inverse .navbar-nav>li>a:visited {color: YOUR_VALUE;
}
```

```css
/* change the minimum height of navbar */
.navbar {
	  min-height: YOUR_VALUE;
}
```

```css
/* we get a vertical navbar when the width is lesser than the content, you can change the max-height of that navbar after which we will see a scrollbar to ensure it doesn’t take over the entire page (default if not customized is 340px) */
.navbar-collapse {
	  max-height: YOUR_VALUE;
}
```

## Notes

1. Some CSS rules in Chaise might conflict with the ones used in your HTML page. Also the CSS rules that you have on your static page might affect navbar. So if you're seeing some wierd UIs, it could be because of these clashing rules. When navbar app is completely loaded, the following is the rough structure of the elements that it will create. If you have some CSS rules that apply to these elements, they will also apply to navbar and can cause issues:
    ```html
    <navbar class="ng-scope ng-isolate-scope">
      <header lass="row">
        <nav id="mainnav" class="navbar navbar-inverse">
          <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed">
              <span class="sr-only">Toggle navigation</span>
              <span class="md-chevron-down"></span>
              MENU
            </button>
            <a class="navbar-brand">
              <!-- the navbar brand and logo -->
            </a>
          </div>

          <div class="collapse navbar-collapse navbar-inverse" id="fb-navbar-main-collapse">
            <ul id="navbar-menu" class="nav navbar-nav">
              <!-- menu options -->
            </ul>

            <!-- other parts of navbar (login, profile, search by rid, etc) -->

          </div>
        </nav>
      </header>
    </navbar>
    ```



1. The bootstrap and jQuery versions of the HTML page might be different from the ones used in Chaise. This might produce some inconsistent behavior on the HTML page.

2. Regardless of prefetching or allowing Navbar app to include the dependencies for you, it will fetch ERMrestJS. This might cause some issues if your page is already including ERMrestJS. It's better if you let Navbar app include it for you.

4. Since navbar is going to take some time to load, if you want to make sure you're showing navbar and the rest of the page together, you can use the following class names:
    - `wait-for-navbar`: This class should be used on an element that is wrapping the entire content of your page (including navbar). Chaise will set a `visibility:hidden` on this element and will only set it to `visibility:visible` when the navbar is loaded.

    - `wait-for-navbar-loader`: If you want to display a loader while the navbar is loading, make sure your loader is using this class name. Chaise will set a `visibility:visible` on this element to ensure that it's visible on load. When the navbar finished loading, chaise will set the `visibility:hidden` to hide the loader.
    ```html
    <div class="wait-for-navbar">
        <div class="wait-for-navbar-loader">some loader</div>
        <navbar></navbar>
        <!-- your main content should be here -->
    </div>
    ```
