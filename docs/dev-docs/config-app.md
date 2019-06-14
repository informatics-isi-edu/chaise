# Configuration App

> This app is only needed for the Chaise apps that rely on chaise-config attributes (or is using any of the chaise/common components that rely on them).

Since chaise-config can be configured through annotation, we had to make a http request to get its value from the catalog annotation. This means that the chaise-config will be available during the runtime and after an asynchronous call. Because of this we had to delay the loading of Chaise apps and introduce an extra app which its whole purpose is populating the necessary configuration variables.

The following is how you should define the configuration app:

- Create a new app that uses the `chaise.config` module.
- Define the constant `appName` attribute that `chasie.config` will use.
- In the run-block of this configuration app, bootstrap your app after the configuration is done.

```javascript

// define the configure-appname app which is using the chaise.config
angular.module('<NAMESPACE>.configure-<APP_NAME>', ['chaise.config'])

// this constant is used for `cid` (e.g. recordset)
.constant('appName', '<APP_NAME>')

.run(['$rootScope', function ($rootScope) {
    $rootScope.$on("configuration-done", function () {
        angular.element(document).ready(function(){
            // attach the actual app to the given element.
            angular.bootstrap(document.getElementById("<APP_NAME>"), ["<NAMESPACE>.<APP_NAME>"]);
        });
    });
}]);
```


This will delay your app until the configuration is completely done. To make sure that this works, your HTML structure should be like the following:

```html
<html lang="en" id="<APP_NAME>">
    <body>
        <div class="configure-container" ng-app="<NAMESPACE>.configure-<APP_NAME>">
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
  - Ensure that the `<NAMESPACE>.configure-<APP>` is the first app that will be loaded.
  - Hide the main content and show a loading spinner while getting the catalog annotation.

Note:
Each app will need to handle making sure the dependencies are available still. `record`, `recordset`, and `recordedit` all include the dependencies as part of the `make all` command. When that is run, the dependencies are added to the `index.html` templates as proper source tags. 

`Login` and `Navbar` app handle this differently. Those depencies are defined in `*.app.js` because of how those apps are used. The intent is that they can be injected into a static page and all you need to do is include the `app.js` as a source and the rest of the dependencies are handled by that script. Those 2 scripts will attach the necesssary dependencies to the html as part of the execution of the script.

This is different in the case of the webapps. Those currently have the dependencies defined directly in the html rather than in the makefile. This was done out of simplicity to get a working proof of concept webapp running before investing in refactoring.
