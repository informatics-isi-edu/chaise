# Use navbar app in external html pages

## Dependencies
Include the following 3 dependencies in the <head> tag of the html page where the login app is to be included.

Note: Change these paths based on the location of the chaise folder relative to your html page.
```html
<head>
<script src="/chaise/chaise-config.js"></script>
<script src="/chaise/scripts/vendor/angular.js"></script>
<script src="/chaise/lib/navbar/navbar.app.js"></script>
</head>
```
## Using the <navbar> directive
1. Check the sample HTML file present at(/chaise/liv/navbar/sample-navbar.html) for using the navbar app.
2. Add the following directive wherever you want to see the navbar app in your html body.
```html
<navbar></navbar>
```
3. If chaise is not installed on the parent directory of your deployment (chaise is installed in `example.com/path-to/chaise/`), make sure you have `chaiseBasePath` defined in your chaise-config file as `/path-to/chaise/`.

## Sample HTML Pages
1. `/chaise/lib/navbar/sample-navbar.html`:
    This is a simple html page with the navbar app at the top of the page. This includes the 3 dependencies required for the navbar app in the header and the <navbar> directive in the body in the header section.

## Note
1. This app is only intended to work if the html page is present at the same level as the chaise project directory.
```
ermrestjs/*
chaise/*
sample-navbar.html
```

2. The bootstrap and jQuery versions of the html page might be different from the ones used in Chaise. This might produce some inconsistent behavior in the html page.

3. Some css classes from the app.css file in chaise, which is a dependency for the login app, might conflict with the css classes on the target html page

4. Since navbar is going to take some time to load, if you want to make sure you're showing navbar and the rest of the page together, you can use the following class names:
  - `wait-for-navbar`: This class should be used on an element that is wrapping the main content of your page.
  - `wait-for-navbar-loader`: If you want to display a loader while the navbar is loading, make sure your loader is using this class name.
  ```html
  <div class="wait-for-navbar">
    <div class="wait-for-navbar-loader">some loader</div>
    <navbar></navbar>
    <!-- your main content should be here -->
  </div>
  ```
