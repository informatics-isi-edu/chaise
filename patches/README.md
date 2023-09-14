# Dependency patches

This folder includes the quick fixes we must do to our dependencies. This should only be used as a quick fix or in cases where a dependency is deprecated or won't fix the feature we need. The following are the changes that we have made to our dependencies:

## webdriver-manager

Used internally by `protractor` to create a selenium server. This package installs the latest ChromeDriver compatible with the installed Chrome version. But since version 115, the location of ChromeDriver has changed ([link](https://chromedriver.chromium.org/downloads/version-selection)). But the `webdriver-manager@12.1.9` still points to the old location. While based on [this issue](https://github.com/angular/webdriver-manager/issues/524) they are planning to fix this, we decided to apply a quick fix based on the suggestions in this issue.

In summary, we modified the `update` command to be able to fetch the newest version of ChromeDriver. The changes are "hacky" and only involve the following files:

- `built/lib/binaries/chrome_xml.js`: Changed `getLatestChromeDriverVersion` to refer to the new location of chromeDriver.
- `built/lib/cmds/update.js`: Changed `unzip` function to handle the new filenames.


The following command was used for generating this patch:
```
npx patch-package webdriver-manager --exclude=\.DS_Store
```
