# Configuration App

> This app is only needed for the Chaise apps that rely on chaise-config attributes (or is using any of the chaise/common components that rely on them).

Since chaise-config can be configured through annotation, we had to make a http request to get its value from the catalog annotation. This means that the chaise-config will be available during the runtime and after an asynchronous call. Because of this we had to delay the loading of Chaise apps and introduce an extra app which its whole purpose is populating the necessary configuration variables.

The following is how you should define the configuration app:

- Create a new app that uses the `chaise.config` module.
- Define the constant `appName` attribute that `chasie.config` will use.
- In the run-block of this configuration app, bootstrap your app after the configuration is done.

```javascript

// define the configure-appname app which is using the chaise.config
angular.module('chaise.configure-<APP_NAME>', ['chaise.config'])

// this constant is used for `cid` (e.g. recordset)
.constant('appName', '<APP_NAME>')

.run(['$rootScope', function ($rootScope) {
    $rootScope.$on("configuration-done", function () {
        angular.element(document).ready(function(){
            // attach the actual app to the given element.
            angular.bootstrap(document.getElementById("<APP_NAME>"), ["chaise.<APP_NAME>"]);
        });
    });
}]);
```


This will delay your app until the configuration is completely done. To make sure that this works, your HTML structure should be like the following:

```html
<html lang="en" id="<APP_NAME>">
    <body>
        <div class="configure-container" ng-app="chaise.configure-<APP>">
            <loading-spinner></loading-spinner>
        </div>
        <div class="app-container" ng-controller="<APP_CONTROLLER> as ctrl">
            <!-- Main content -->
        </div>
    </body>
</html>    
```

With these css rules

```css
html .app-container {
    display: none;
}

html.ng-scope .app-container {
    display: block;
}

html.ng-scope .configure-container {
    display: none;
}
```

This will,
  - Ensure that the `chaise.configure-<APP>` is the first app that will be loaded.
  - Hide the main content and show a loading spinner while getting the catalog annotation.
