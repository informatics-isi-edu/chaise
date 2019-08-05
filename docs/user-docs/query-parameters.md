The query parameters appear in the browser url after the filter path and after the `?` character. There are a number of parameters that are consumed by chaise that the user doesn't need to be aware of. This document will outline the ones that the user can define that will affect how the application will behave.

#### Configurable parameters for users
 - `hideNavbar`: This parameter is used to hide the navbar from showing in the application. It will be honored if it is set to `true` or `false`. By default, the navbar will always show if it is the top level app. If the navbar is attached to an app that shows in an iframe, the navbar will be hidden by default. Setting this property to `false` will show the navbar inside of an iframe. When present, this parameter will be propagated to all applinks on the current page (but not propagated to another app that may be nested in an iframe). When navigating away from the current page, the navbar will continue to be behave the same way unless the query parameter is changed.
 - `limit`: This parameter changes the number of rows that are returned by the `ermrest` request. This parameter is consumed by chaise and sent along with the requests to fetch data (`recordset` and `recordedit` only)

#### Set by application
 - `ppid` and `pcid`: These two parameters will be available only on a number of requests. They will indicate which app and page led to this current request. More info can be found in the [logging document here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/logging.md#attributes).
