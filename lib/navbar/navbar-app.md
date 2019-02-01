# Use navbar app in external html pages

## Dependencies
Include the following 3 dependencies in the <head> tag of the html page where the login app is to be included
Note: Change these paths based on the position of the chaise folder.
```html
<head>
<script src="./chaise/chaise-config.js"></script>
<script src="./chaise/scripts/vendor/angular.js"></script>
<script src="./chaise/lib/navbar/navbar.app.js"></script>
</head>
```
## Using the <navbar> directive
1. Check the sample HTML file present at(./chaise/liv/navbar/sample-navbar.html) for using the navbar app.
2. Add the following directive wherever you want to see the navbar app in your html body.
```html
<navbar></navbar>
```

## Sample HTML Pages
1. /chaise/lib/navbar/sample-navbar.html
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
