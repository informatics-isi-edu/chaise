# Use login app in external html pages

## Dependencies
Include the following 3 dependencies in the <head> tag of the html page where the login app is to be included
Note: Change these paths based on the position of the chaise folder.
```html
<head>
<script src="./chaise/chaise-config.js"></script>
<script src="./chaise/scripts/vendor/angular.js"></script>
<script src="./chaise/loginApp/login.app.js"></script>
</head>
```
## Using the <login> directive
1. Check the sample HTML file present at(./chaise/loginApp/login.html) for using the login app.
2. Add the following directive wherever you want to see the login app in your html body.
```html
<login></login>
```

## Note
1. The bootstrap and jQuery versions of the html page might be different from the ones used in Chaise. This might produce some inconsistent behavior in the html page.
2. Some css classes from the app.css file in chaise, which is a dependency for the login app, might conflict with the css classes on the target html page