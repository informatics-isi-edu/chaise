# Flow Control

 In this document, we'll explain how flow control is implemented in Chaise. Flow control has been added to different modules/apps in Chaise to handle the generation of vast amounts of requests.

 ## Recordset

For showing a recordset view (whether its recordset app or a modal-picker in record and recordedit apps), we need to generate requests for the following:

- Main entity rows (this includes all the all-outbound paths as well)
- Main entity count (total number of rows)
- Main entity pseudo-columns
- Open facets data


### Flow-Control Logic

Since the main entity can have multiple pseudo-columns and we might have more than one open facet, we might have to generate more than 4 requests at a time to update the page. The following is how flow control is going to control these requests:

- Only 4 requests will be generated at a time. If a request gets back, we will fire the next cycle of requests.
- We don't have a queue of requests here. Each time that page has been updated or a response gets back; we will go through all the sections to make sure if we need to update them or not. ُThe following is the order:

  1. Main entity.

    1.1. Main entity pseudo-columns from left to right (ERMrestJS's activeList API dictates this order): This is dependent on the previous request. If the main entity request is still pending, we won't send any requests for these.

  2. Main entity count.

  3. Open facet data from top to bottom.


For example, when you go to the recordset page (assume that there's just one facet open and we don't have any pseudo-columns), the request for the main entity, the open facet, and main count will be fired at the same time and sent to ERMrest. If you open three other facets without waiting for the previous one to get back, you will eventually hit the limit of having only 4 pending requests.


### Implementation Details

The best way to handle these would be using states and state-management. But in the first implementation, we decided to go with an easier option and used booleans to indicate the state of the page. The following is the list of variables used:

- `flowControlObject`: This object describes the current cycle of flow control. It has
  - `maxRequests`: The maximum concurrent requests (4).
  - `occupiedSlots`: The number of occupied slots (pending requests).
  - `counter`: The current cycle number. Using this we can figure out if the returned data is outdated or not

- Main entity attributes:
  - `initialized`: Whether we have
  - `hasLoaded`: If the request is done and we should show the data.
  - `dirtyResult`: Whether we should send a request to get the new results.
  - `dirtyCount`: Whether we should send a request to get the number of matching rows.
  - `facetsToPreProcess`: An array that contains the index of facets that are already open when the page loads (because of annotation or pre-existing filters). This will be populated once during the initialization of recordset and will be used only on the first cycle of flow-control.

Aggregate (pseudo-column) attributes:
  - `processed`: `processed=false` means that we have to schedule a request to get the aggregate data. If its value is `true`, it means either the request is pending, or the request is already done.

- Facet attributes:
  - `preProccessed`: If a facet has some pre-selected filters, we have to call the `preProcessFacet` function for them. If `preProccessed=false`, it means that we have to call the function or the request has not got back yet and we have to wait. The `preProcessFacet` function behaves differently based on different facet types.
   - for entity choice-picker facet: It will get the row-names that we need to display for the selected facets.
   - for other types of facets: It will create the pre-selected checkboxes without calling ERMrest.
  - `initialized`: `initialized=false` indicates that we have not initialized the facet yet, and we should not display the facet column data. This will be changed to `true` when we get the initial facet options. It will remain `true` as long as the facet is open. If users close the facet and change the state of the page (by changing other facets), this attribute will be changed to `false` to hide its outdated content.
  - `processed`: `processed=false` means that we have to schedule a request to get the facet data. If its value is `true`, it means either the request is pending or the displayed data is updated.
  - `isLoading`: This attribute is used to display the loader for facets. It has no effect on flow-control.
  - `isOpen`: Indicates whether the facet is open.
  - `facetError`: Indicates whether the facet had a timeout error (to show the appropriate options to recover the facet).
  - `noConstraints`: Indicates whether the facet is constrained by all the filters on the page or not. This is used in conjunction with the `facetError`, to provide appropriate recovery options in case of timeout error.

## Record

Record page is different from the recordset page, as in the whole page relies on the main entity request. So no matter what, we have to send the main entity request first, and then we can generate the rest of the requests. The actual flow-control of Record page relies heavily on Recordset flow-control since we're showing the simplified view of recordset for inline and related tables.

The following are the category of requests that we need to send in record page:

- The main entity (this includes all the all-outbound paths as well).
- Inline entity tables.
- All the pseudo-columns (entity set and aggregate) that are displayed or the displayed columns rely on (as part of their `wait_for` definition).
- Related entity tables.
- All the pseudo-columns (entity set and aggregate) that the related entity tables rely on (as part of their `wait_for` definition).



### Flow-Control Logic

The flow-control of record page is the same as recordset. We don't have a queue of requests and each time that page has been updated or a response gets back; we will go through all the sections to make sure if we need to update them or not. ُThe following is the order:

1. Main entity request. If we need to send a request for the main entity (due to an update in some part of the page), flow-control will stop here and waits for the main entity request to get back.

2. Use the ERMrestJS's activeList API to generate the secondary requests for the page. The following is how this API works:

    1. Since we want to allow users to open the citation popup as soon as possible, we're going to first send all the requests needed for it. So all the pseudo-columns listed in the `wait_for` of citation annotation will be sent first.

    2. We want to show the main section of record app from top to bottom to avoid the jumps as much as possible. But since we can assume that the aggregates are slower than entity set and inline entity requests, we will:

      2.1. Traverse the list of visible columns from top to bottom and generate the requests for columns that only have entity set in their `wait_for` or inline columns without any `wait_for`.

      2.2. Traverse the list of visible columns the second time from top to bottom and if the column is aggregate, or has aggregate in its `wait_for`; generate requests for them (and their `wait_for` list definition).

    3. For the related section, since we're showing the tables from top to bottom, we don't need to do the optimization that we did for the main section. We can send the requests from top to bottom (and left to right of their `wait_for` list).

    To better understand this, let's assume the following definition (`i` is used to indicate inline table, `es` for entity set, `agg` for aggregate, and `r` for related):

    ```json
    "tag:isrd.isi.edu,2016:visible-columns": {
        "detailed": [
            {"sourcekey": "col_1", "display": {"wait_for": ["agg_1"]}},
            {"sourcekey": "i_1", "display": {"wait_for": ["agg_1", "agg_2"]}},
            {"sourcekey": "i_2", "display": {"wait_for": ["es_1", "es_3", "agg_1", "agg_3"]}},
            {"sourcekey": "col_2", "display": {"wait_for": ["es_4"]}},
            {"sourcekey": "i_3", "display": {"wait_for": ["es_1", "es_2"]}},
            {"sourcekey": "agg_4"},
            {"sourcekey": "i_4"},
        ]
    },
    "tag:isrd.isi.edu,2016:visible-foreign-keys": {
        "detailed": [
            {"sourcekey": "r_1", "display": {"wait_for": ["agg_4", "agg_5"]}},
            {"sourcekey": "r_2", "display": {"wait_for": ["es_1", "es_5", "agg_6", "agg_7"]}},
            {"sourcekey": "r_3", "display": {"wait_for": ["es_1", "es_6"]}},
            {"sourcekey": "r_4"},
        ]
    }
    ```

    The following would be the order of sending the requests (paranthesis has been added for readibility purposes):

    ```
    (es_4), (i_3, es_1, es_2), (i_4), (agg_1), (i_1, agg_2), (i_2, es_3, agg_3), (agg_4)
    (r_1, agg_4, agg_5), (r_2, es_1, es_5, agg_6, agg_7), (r_3, es_1, es_6), (r4)
    ```



3. Send requests for all the aggregate columns that are used in the tabular mode of inline tables from to bottom.

4. Send requests for all the aggregate columns that are used in the tabular mode of related tables from top to bottom.



### Implementation Details


As we mentioned the logic of ordering the secondary requests is hidden from Chaise and all Chaise knows is the list of `requests` that it has to create. Each returned `Request` object from ERMrestJS is going to have different attributes depending on the type of the request. Each object has a boolean attribute to indicate its type. The following are the list of available attributes for each type:

- aggregates: If the `"aggregate": true` is avaiable in the returned object, we know that it's pseudo-column aggregate. The other available attributes are:
  - `column`: An `ERMrest.PseudoColumn` object that can be used for generating the requests.
  - `objects`: An array of objects that signal which part of the page needs this pseudo-column value.
    - If `"citation": true` is available on an object, citation is waiting for this value.
    - If `"column": true` is available on an object, a visible column is waiting for this value. `index` attribute can be used to find the column.
    - If `"related": true` is available on an object, a related entity is waiting for this value. `index` attribute can be used to find the related entity.
- entity sets: If the `"entityset": true` is available in the returned object, we know that it's pseudo-column entity set. It will have the same attributes as aggregate but we had to distinguish between them because Chaise has to use a different API call to get the value.
- inline entities: If `"inline": true` is available in the returened object, the request belongs to an inline table. `index` is the other attribute that Chaise is using to generate a request for the inline entity.
- related entities: If `"related": true` is available in the returened object, the request belongs to an inline table. `index` is the other attribute that Chaise is using to generate a request for the inline entity.


‌Based on this, Chaise uses the returned list of requests and creates its own copy called `requestModels`. This will allow chaise to add extra attributes for book-keeping. `requestModels` is an array of object with the following attributes:
  - `activeListModel`: the exact object that ERMrestJS returns.
  - `processed`: A boolean to help track of the processed requests. If this is `false`, Chaise will attempt to send a new request for it.
  - `reference`: Only available on entity set requests. Used for generating the request.
  - Other extra log related attributes are only available for entity set and aggregate requests.
