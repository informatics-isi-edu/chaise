# Flow Control

 In this document, we'll explain how flow control is implemented in chaise. Flow control has been added to different module/apps in Chaise to handle the generation of huge amounts of requests.

 ## Recordset

For showing a recordset view (whether its recordset app or a modal-picker in record and recordedit apps), we need to generate requests for the following:

- Main entity rows
- Main entity count (total number of rows)
- Main entity aggregate columns
- Open facets data

Since the main entity can have multiple aggregate columns and we might have more than one open facet, we might have to generate more than 4 requests at a time to just update the page. The following is how flow control is going to control these requests:

- Only 4 requests will be generated at a time. If a request gets back, we will fire the next cycle of requests.
- We don't have a queue of requests in here. Each time that page has been updated or a response gets back, we will go through all the sections to make sure if we need to update them or not. This is the order:

  1. Main entity.

    1.1. Main entity aggregate columns from left to right: This is dependent on the previous request. If the main entity request is still pending, we won't send request for these.

  2. Main entity count.

  3. Open facet data from top to bottom.




For example when you go to the recordset page (assume that there's just one facet open and we don't have any aggregate columns), the request for main entity, the open facet, and main count will be fired at the same time and sent to ERMrest. If you open three other facets without waiting for the previous one to get back, you will eventually hit the limit of having only 4 pending requests.

The best way to handle these would be using states and state-management. But in the first implementation, we decided to go with a easier route and used booleans to indicate the state of the page. The following is the list of variables used:

- `flowControlObject`: This object describes the current cycle of flow control. It has
  - `maxRequests`: The maximum concurrent requests (4).
  - `occupiedSlots`: The number of occupied slots (pending requests).
  - `counter`: The current cycle number. Using this we can figure out if the returned data is outdated or not

- Main entity attributes:
  - `initialized`: Whether we have
  - `hasLoaded`: If the request is done and we should show the data.
  - `dirtyResult`: Whether we should send a request to get the new results.
  - `dirtyCount`: Whether we should send a request to get the number of matching rows.
  - `aggregatesToInitialize`: An array that contains the index of aggregate columns that we should get the data for. This is going to populated after each successful request for the main entity.
  - `facetsToPreProcess`: An array that contains the index of facets that are already open when the page loads (because of annotation or pre-existing filters). This will be populated once during the initialization of recordset and will be used only on the first cycle of flow-control.

- Facet attributes:
  - `preProccessed`: If a facet has some pre-selected filters, we have to call the `preProcessFacet` function for them. If `preProccessed=false`, that means that we have to call that function for the facet or the request has not got back yet and we have to wait. This will function will behave differently based on different facet types.
   - for entity choice-picker facet: It will get the row-names that we need to display for the selected facets.
   - for other types of facets: It will create the pre-selected checkboxes without calling ERMrest.
  - `initialized`: `initialized=false` indicates that we have not initialized the facet yet so we should not display the facet column data. This will be changed to `true`, when we get the initial facet options. It will remain `true` as long as the facet is open. If users close the facet and change the state of page (by changing other facets), this attribute will be changed to `false` in order to hide its outdated content.
  - `processed`: `processed=false` means that we have to schedule a request to get the facet data. If its value is `true`, it means that either the request is pending or the displayed data is updated.
  - `isLoading`: This attribute is used to display the loader for facets. It has no effect on flow-control.
  - `isOpen`: Indicates whether the facet is open.
  - `facetError`: Indicates whether the facet had a timeout error (to show the appropriate options to recover the facet).
  - `noConstraints`: Indicates whether the facet is constrained by all the filters on the page or not. This is used in conjunction with the `facetError`, to provide appropriate recovery options in case of timeout error.
