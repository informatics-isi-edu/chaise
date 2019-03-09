# Use login app in external html pages

## Dependencies
Include the following 3 dependencies in the <head> tag of the html page where the login app is to be included
Note: Change these paths based on the position of the chaise folder.
```html
<head>
<script src="/chaise/chaise-config.js"></script>
<script src="/chaise/scripts/vendor/angular.js"></script>
<script src="/chaise/lib/login/login.app.js"></script>
</head>
```
## Using the <login> directive
1. Check the sample HTML file present at(/chaise/loginApp/login.html) for using the login app.
2. Add the following directive wherever you want to see the login app in your html body.
```html
<login></login>
```
3. If chaise is not installed on the parent directory of your deployment (chaise is installed in `example.com/path-to/chaise/`), make sure you have `chaiseBasePath` defined in your chaise-config file as `/path-to/chaise/`.

## Sample HTML Pages
1. /chaise/lib/login/sample-login.html
This is a simple html page with the login app in the navbar on the top-right. This includes the 3 dependencies required for the login app in the header and the <login> directive in the body in the header section.

2. /chaise/lib/login/sample-loginOnRbk.html
This is the RBK home page with the login app in the navbar. The styling of this page will be a little off as there are conflicts in the CSS classes used on this page and in chaise. These CSS rule conflicts will have to be resolved manually on the RBK home page by either changing the common class names like header and footer or overriding the chaise styles.

## Note
1. The bootstrap and jQuery versions of the html page might be different from the ones used in Chaise. This might produce some inconsistent behavior in the html page.
2. Some css classes from the app.css file in chaise, which is a dependency for the login app, might conflict with the css classes on the target html page
