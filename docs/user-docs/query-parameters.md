The query parameters appear in the browser url after the filter path and after the `?` character. There are a number of parameters that are consumed by chaise that the user doesn't need to be aware of. This document will outline the ones that the user can define that will affect how the application will behave.

#### Configurable parameters for users
 - `hideNavbar`: This parameter is used to hide the navbar from showing in the application. It will be honored if it is set to `true` or `false`. By default, the navbar will always show if it is the top level app. If the navbar is attached to an app that shows in an iframe, the navbar will be hidden by default. Setting this property to `false` will show the navbar inside of an iframe. When present, this parameter will be propagated to all applinks on the current page (but not propagated to another app that may be nested in an iframe). When navigating away from the current page, the navbar will continue to be behave the same way unless the query parameter is changed.
 - `scrollTo`: Include this parameter in a link to record app to scroll to a specific section of the page. The value should be the display name of the column or related table (inline or in the related table section). This should be the markdown_pattern defined in the appropriate display annotation for that related table or column. It should also be properly url encoded for the UTF-8 character set. [More info about encoding](https://www.w3schools.com/tags/ref_urlencode.asp).

   - There are 2 cases to consider, one is inline related tables and the other is related tables in the visible-foreignkeys section of record page. Below is the HTML representation of an inline Related Table in the visible-columns section of record app. The `id` on the element with `class="entity-value"` is the one that chaise uses to scroll to that specific inline related table. `entity-` is the static part of the identifier. The value after that is the `displayname.value` that was generated using a markdown_pattern. If no markdown_pattern was defined (no extra styling, just plain text), you can simply use the plaintext as it is displayed in the browser. In the following, that value is `Fixation`. If you aren't sure of what value to use, you can always look at the HTML structure and look for the element with the class `column-displayname`. There should be a `<span>` as a child of the `column-displayname` element. The contents of that element will be the `displayname.value`, which is what should be used in the query parameter.

   ```HTML
   <tr ... id="row-frykLfd4AIhg-5mkjZGDZg" ...>
     <td class="entity-key ...">
       <span class="column-displayname" ...>
         <span ... class="ng-binding ng-scope">
           Fixation
         </span>
       </span>
       ...
     </td>
     <td class="entity-value ..." id="entity-Fixation">
       ...
     </td>
   </tr>
   ```
 
   - Below is the HTML representation of a Related Table from the visible-foreignkeys section of record app. The `id` on the `uib-accordion-group` element is the one that chaise uses to scroll to that specific related table. `rt-heading-` is the static part of the identifier. The value after that is the `displayname.value` that was generated using a markdown_pattern. If no markdown_pattern was defined (no extra styling, just plain text), you can simply use the plaintext as it is displayed in the browser. In the following, that value is `Images`. If you aren't sure of what value to use, you can always look at the HTML structure and look for the element with the class `rt-section-header`. There should be a `<span>` as a child of the `rt-section-header` element. The contents of that element will be the `displayname.value`, which is what should be used in the query parameter.
   ```HTML
   <div uib-accordion-group class="related-table-accordion" id="rt-heading-Images" ...>
     <div role="tab" id="accordiongroup-560-1386-tab" class="panel-heading" ...>
       <h4 class="panel-title">
         <a role="button" ... class="accordion-toggle" ng-click="toggleOpen()" ...>
           <span uib-accordion-header ...>
             <div class="rt-section-header">
               <i class="toggle-icon fas fa-chevron-down" ...></i>
               <span ... class="ng-binding ng-scope">
                 Images
               </span>
             </div>
             <record-action-bar ...></record-action-bar>
           </span>
         </a>
       </h4>
     </div>
     <div id="accordiongroup-560-1386-panel" aria-labelledby="accordiongroup-560-1386-tab" class="panel-collapse collapse in" ...>...</div>
   </div>
   ```
 - `limit`: This parameter changes the number of rows that are returned by the `ermrest` request. This parameter is consumed by chaise and sent along with the requests to fetch data (`recordset` and `recordedit` only)

#### Set by application
 - `ppid` and `pcid`: These two parameters will be available only on a number of requests. They will indicate which app and page led to this current request. More info can be found in the [logging document here](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/logging.md#attributes).
