# Flow Control

In this document, we'll explain how flow control is implemented in chaise. Flow control has been added to different module/apps in Chaise to handle the generation of huge amounts of requests.

## Recordset

Recordset app has the following sections that we need to generate request for:

- Main entity rows
- Main entity count (total number of rows)
- Main entity aggregate columns
- Open facets data

Since the main entity can have multiple aggregate columns and we might have more than one open facet, we might have to generate more than 4 requests at a time to just update the page. The following is how flow control is going to control these requests:

- Only 4 requests will be generated at a time. If a request gets back, we will fire the next cycle of requests.
- We don't have a queue of requests in here. Each time that page has been updated or a response gets back, we will go through all the sections to make sure if we need to update them or not. This is the order:

  1. **Main entity rows**
  1.1. **Main entity aggregate columns from left to right**: This is directly dependent on the previous request. If the main entity request is still pending, we won't send request for these.
  2. **Open facet data from top to bottom**.
  3. **Main entity count**.

  For example when you go to the recordset page (assume that there's just one facet open and we don't have any aggregate columns), the request for main entity, the open facet, and main count will be fired at the same time and sent to the ERMrest. If you open more than two facets without waiting for the previous one to get back, you will eventually hit the limit of having only 4 pending requests.

The best way to handle these would be using states and state-management. But in the first implementation, we decided to go with a easier route (which eventually might be difficult to manage) and used booleans to indicate the state of the page. The following is the list of variables used:


- `flowControlObject`: This object describes the current cycle of flow control. It has
  - `maxRequests`: The maximum concurrent requests (4).
  - `occupiedSlots`: The number of occupied slots (pending requests).
  - `counter`: The current cycle number. Using this we can figure out if the returned data is outdated or not

- Main entity attributes:
  - `hasLoaded`: If the request is done and we should show the data.
  - `dirtyResult`: Whether we should send a request to get the new results.
  - `lastMainRequestPending`: To avoid sending duplicate requests in the same cycle.
  - `aggregatesToInitialize`: An array that contains the index of aggregate columns that we should get the data for. This is going to populated after each successful request for the main entity.

- Facet attributes:
  - `initialized`: The request to initialize a facet could be different from the request to update it. Assume that you go to a page with predefined filter for a foreign key value. The value that we have access to is the raw value of the column. But the facet is in entity mode and we need the row-name. So we need to send a request with these predefined filters to get their row-names. And another request to get other available values for the facet. This second request is the same as the update request.
  - `processed`
  - `isLoading`
