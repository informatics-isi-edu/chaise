The file contains changes made to chaise-config parameters.
- Refer to [chaise-config.d](chaise-config.md) for currently supported parameters
- Refer to [chaise-config-deprecated.md](chaise-config-deprecated.md) for deprecated parameters

#### 06/23/2023 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2324)

###### Removed
  - `defaultTables` property was deprecated as it doesn't make sense to encode catalog number in it.

###### Added
  - `defaultTable` property which is similar to the deprecated `defaultTables` property and is defined for the existing catalog.

#### 11/17/2022 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2252)

###### Added
  - `hideRecordeditLeaveAlert` property was added to suppress the displayed alert when users are about to navigate away from recordedit to preserve the editted content.

#### 10/07/2022 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2234)

###### Removed
  - `maxRelatedTablesOpen` property was deprecated as it's not needed anymore and wasn't used.

#### 04/08/2022 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2168)
  - [ermrestJS](https://github.com/informatics-isi-edu/ermrestjs/pull/943)

###### Added
  - `facetPanelDisplay` property was added to allow customization of the facet panel visibility on page load.

#### 10/20/2021 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2134)

###### Changed
  - `savedQueryConfig` added new object named `defaultName` to define properties related to setting the default name of the saved query feature.

#### 10/13/2021 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2130)

###### Added
  - `navbarBanner` property was added to allow adition of banners to navbar.

#### 10/12/2021 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2129)

###### Added
  - `loggedInMenu` property was added to allow customization of login submenu when the user is logged in.

###### Removed
  - Given that you can achieve the same behavior with the added property, `profileURL` property was removed.


#### 08/20/2021 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/2114)

###### Added
  - `savedQueryConfig` was introduced to define properties related to saved query feature.

<!--  TODO we might want to add the rest of changes as well -->

#### 10/21/2019 ####

###### PR Link
  - [chaise](https://github.com/informatics-isi-edu/chaise/pull/1847)

###### Removed
  - As part of UX mitigation the search application and all the properties related to this app has been removed.
