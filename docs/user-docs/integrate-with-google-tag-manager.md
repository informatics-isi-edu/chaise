
# Integrating Google Tag Manager for deployment analytics

In this document, we will go over the recommended way of collecting user analytics in Chaise or static pages using Google Tag Manager and Google Analytics.

> While you don't necessarily need to create a Google Tag Manager tag and can connect Google Analytics directly to your website, we recommend following what we described here since it will give you more flexibility and will be consistent.

## Table of Contents

  - [1. Create a Google Analytics (GA) account](#1-create-a-google-analytics-ga-account)
  - [2. Create a Google Tag Manager (GTM) account](#2-create-a-google-tag-manager-gtm-account)
  - [3. Install the GTM container on the server](#3-install-the-gtm-container-on-the-server)
  - [4. Add GTM container to static pages](#4-add-gtm-container-to-static-pages)
  - [5. Connect Google Tag Manager to Google Analytics](#5-connect-google-tag-manager-to-google-analytics)
  - [6. Make sure Google Analytics can support Deriva URLs](#6-make-sure-google-analytics-can-support-deriva-urls)


## 1. Create a Google Analytics (GA) account

The first thing that you need to do is create a Google Analytics account and add a "data stream". You will see the aggregated data of user interaction with your website in Google Analytics. Please refer to [this tutorial](https://support.google.com/analytics/answer/9304153?sjid=17908509460315618267-NA) on how to create the account.

> :warning: After creating a GA4 account, it might prompt a "Install your Google tag" step. Please ignore this as we will go over it in the following steps.

## 2. Create a Google Tag Manager (GTM) account

You also need to set up a Google Tag Manager account. Google Tag Manager allows us to collect data from our website and send it wherever we want. You can find more information on how to do this [here](https://support.google.com/tagmanager/answer/6103696?sjid=17908509460315618267-NA).

## 3. Install the GTM container on the server

We now need to connect our website to Google Tag Manager. To do so,

1. Find your container ID formatted as _"GTM-XXXXXX"_ which is visible in the Google Tag Manager workspace or [here](https://tagmanager.google.com/).

2. Copy and paste the following code into a file called `gtm-id.js`


3. Add your GTM container ID on the first uncommented line, `var gtmId = [YOUR CONTAINER ID HERE]`.

4. Add the `gtm-id.js` file to the deployment server at the same level as the Chaise folder (e.g.,`/var/www/html/gtm-id.js`).

    ```js
    // When this file is loaded, it will run the 2 Google Tag Manager tags.
    // To use: Supply your Google Tag Manager container ID on the next line.
    var gtmId = null; // Change null to be your GTM ID (e.g. "GTM-XXXXXX")

    (function(gtmId) {
        if (!gtmId) {
            return;
        }
        // Run <head> tag.
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer', gtmId);

        // Insert <body> tag
        var bodyScript = document.createElement('noscript');
        bodyScript.innerHTML = '<iframe src="https://www.googletagmanager.com/ns.html?id=' + gtmId + '" height="0" width="0" style="display:none;visibility:hidden"></iframe>';
        document.addEventListener("DOMContentLoaded", function(event) {
            document.body.appendChild(bodyScript);
        });
    })(gtmId);
    ```


By doing this, Chaise is now connected to the GTM container and will collect user data for you.

## 4. Add GTM container to static pages

Now that we have the `gtm-id.js` file, we need to ensure the static sites include the same file. The following is how we recommend doing this for Jekyll pages:

1. Add `<script src="/gtm-id.js"></script>` to the `www/_includes/header.html` file in your Jekyll files.
2. Regenerate your Jekyll pages.
3. Make sure all pages have `<script src="/gtm-id.js"></script>` in the `<head>` tag of their templates.


## 5. Connect Google Tag Manager to Google Analytics

The last step is connecting the GTM and GA together. To do so, please follow [the official guide](https://support.google.com/tagmanager/answer/9442095?hl=en). In summary,

1. We need first to grab the measurement ID associated with our GA account. The ID will start with _"G-"_ and on new accounts is visible on the home page of the GA account. If you cannot find it, navigate to the "Admin" page. Click on "Data Streams" on this page. You should see a data stream, click on it, and it will show you the Measeuerment ID.

2. Now that we have the measurement ID, we can navigate to the GTM home page and create a "tag" with it. This will ensure GTM data is sent to our GA account.


## 6. Make sure Google Analytics can support Deriva URLs

Google Analytics, by default, doesn't report the URL fragment or query parameters. But Chaise and deriva-webapps rely on these parts of the URL, and we would like to have them as part of our reports.

The following is how you can achieve this:

1. We first need to create a custom variable in GTM that captures the value we want. So navigate to the GTM page for the deployment.

2. Navigate to the "Variables" page in the sidebar menu.

3. Change the name of the variable to whatever you would like. In this tutorial, we will use "Customized Deriva Page Path".

4. Click on "New" of the "User-Defined Variables".

5. Choose the "Custom JavaScript" variable type.

6. Copy the following code in the code block and save it. As we mentioned in the code, you should add your own rules for special pages that you might. For any pages that is not chaise or deriva-webapps, we're reporting the query parameter. If you don't want this behavior, feel free to change it.

    ```js
    /**
     * TODO feel free to customize it by adding special rules for your own pages.
     *
     * make sure path includes the information that we care about.
     * - for chaise pages:
     *    - include the hash
     *    - remove query parameters, facets, cfacets, sort, and page modifiers
     *    - handle urls that are using query parameter instead of hash
     * - for deriva-webapps:
     *    - heatmap: keep the hash
     *    - other apps: keep appropriate query parameters
     * - other pages: ignore the fragment
     */
    function () {
      var pathname = window.location.pathname;

      var pathStartsWith = function (str) {
        return pathname.indexOf(str) === 0;
      }

      var getParameterByName = function (name) {
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        return match && match[1].replace(/\+/g, ' ');
      }

      // for chaise pages, remove query parameter, facet, and sort/page modifiers.
      if (pathStartsWith('/chaise/')) {
        var hash = window.location.hash;

        // chaise can be initiated with query parameters instead of hash, so we should change it back to hash
        if (!hash && window.location.href.indexOf('?') !== -1) {
          hash = '#' + window.location.href.substring(location.href.indexOf('?') + 1);
        }

        if (hash) {
          // chaise urls have the query as part of fragment, so we should just remove it.
          if (hash.indexOf('?') !== -1) {
            hash = hash.slice(0, hash.indexOf('?'));
          }

          // remove the facets
          if (hash.indexOf('*::facets::') !== -1) {
            hash = hash.slice(0, hash.indexOf('*::facets::'));
          }

          // remove the custom facets
          if (hash.indexOf('*::cfacets::') !== -1) {
            hash = hash.slice(0, hash.indexOf('*::cfacets::'));
          }

          // remove the sort modifiers
          if (hash.indexOf('@sort(') !== -1) {
            hash = hash.slice(0, hash.indexOf('@sort('));
          }

          // remove the page modifiers
          if (hash.indexOf('@page(') !== -1) {
            hash = hash.slice(0, hash.indexOf('@page('));
          }
        }

        return pathname + hash;
      }

      // heatmap can have hash and we should keep it
      else if (pathStartsWith('/deriva-webapps/heatmap')) {
        var hash = window.location.hash;

        // query parameters could be part of the hash, so remove it
        if (hash.indexOf('?') !== -1) {
          hash = hash.slice(0, hash.indexOf('?'));
        }

        return pathname + hash;
      }

      // for deriva-webapps keep some part of the query parameters
      else if (pathStartsWith('/deriva-webapps/')) {
        var allowedKeys = [];
        if (pathStartsWith('/deriva-webapps/plot')) {
          allowedKeys = ['config', 'NCBI_GeneID', 'Study'];
        } else if (pathStartsWith('/deriva-webapps/treeview')) {
          allowedKeys = ['Specimen_RID'];
        } else if (pathStartsWith('/deriva-webapps/matrix')) {
          allowedKeys = ['config'];
        }

        var allowedQueryParams = [];
        if (window.location.search) {
          allowedKeys.forEach(function (k) {
            var q = getParameterByName(k);
            if (q) {
              allowedQueryParams.push(k + '=' + q);
            }
          })
        }

        return pathname + (allowedQueryParams.length > 0 ? ('?' + allowedQueryParams.join('&')) : '');
      }

      // TODO add any other rules for any other special page that your deployment might have.

      // for any other page just return the pathname (no query param or fragment)
      else {
        return pathname + window.location.search;
      }
    }
    ```

7. Navigate to the "Tags" page in the sidebar menu and click on your tag.

8. Modify your tag Configuration by adding a new "Fields to Set".

9. In this tutorial, we will use "customized_deriva_page_path" for "Field Name". And for "Value", click the plus button beside the field and choose the user-defined variable you created previously.

10. Save the changes to your tag.

11. Click on "Submit" on the top right to publish your changes.

12. With this, GTM will report this new variable to Google Analytics. Now, we need to ensure this variable is part of our Google Analytics reports. To do so, navigate to your Google Analytics page.

13. Go to the "Admin" page (the wheel icon on the bottom left of the page).

14. Click on "Custom definitions" and then "Create custom dimensions".

15. The "Dimension name" is the name that shows up in Google Analytics. It can be any value that you would like. In this tutorial, we will use the same name we chose in GTM, "Customized Deriva Page Path".

16. The "Event parameter" must be the same name that you choose for "Field Name" in GTM (step 9). So, "customized_deriva_page_path".

17. You can now use this new dimension in your Google Analytics reports. Please refer to the official guides for creating or customizing Google Analytics reports. But to give you an example, the following is how you can add this custom dimension to the default "Page and Screens" report.
  a. You can find the "Page and Screens" report under "Reports" > "Engagement". It's also included as part of the default homepage of Reports.
  b. Click on the Customize report on the top right (pencil icon).
  c. It will show some options on the right side of the page. You should see "Dimensions" under the "Report Data" section. Click on it.
  d. Click "Add dimension" to find the custom dimension you've added.
  e. Apply and save your changes.
