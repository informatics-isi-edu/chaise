This document contains deprecated chaise-config parameters. 

| Parameter | Values | Default Value | chaise-config.js | URL | Remarks |
|-----------|--------|---------------|------------------|-----|---------|
| **login/logout:**| | | | | |
| profileURL | A URL | N/A | "profileURL":\<your_URL\> | N/A | When a user is logged in, the navbar displays the user's username. Use this parameter to specify what the username in the navbar should link to (e.g. `https://app.globus.org/account` if your deployment uses Globus authentication). If `profileURL` is unspecified, the navbar will display the username as regular text. |
| **search:**| | | | | |
| sidebarPosition | "left" <br> "right" | "right" | "sidebarPosition": \<value\> | N/A | Applies to the Search app only. If \<value\> is "left", the sidebar will be on the left and the main content will shift left correspondingly. If \<value\> is "right", the sidebar will be on the right. |
| attributesSidebarHeading | String | "Choose Attributes" | "attributesSidebarHeading": \<value\> | N/A | Applies to Search app only. Use this parameter to customize the heading displayed in at the top of the Attributes sidebar (usually the first sidebar that appears when the Search app loads). |
