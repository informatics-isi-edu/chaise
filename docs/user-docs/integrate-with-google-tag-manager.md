
# Integrating Google Tag Manager for deployment analytics

In this document, we will go over the recommended way of collecting user analytics in Chaise or static pages using Google Tag Manager and Google Analytics.

### 1. Create a Google Analytics (GA) account

The first thing that you need to do is create a Google Analytics account and add a "data stream". You will see the aggregated data of user interaction with your website in Google Analytics. Please refer to [this tutorial](https://support.google.com/analytics/answer/9304153?sjid=17908509460315618267-NA) on how to create the account.

> :warning: After creating a GA4 account, it might prompt a "Install your Google tag" step. Please ignore this as we will go over it in the following steps.

### 2. Create a Google Tag Manager (GTM) account

You also need to set up a Google Tag Manager account. Google Tag Manager allows us to collect data from our website and send it wherever we want. You can find more information on how to do this [here](https://support.google.com/tagmanager/answer/6103696?sjid=17908509460315618267-NA).

### 3. Install the GTM container on the server

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

### 4. Add GTM container to static pages

Now that we have the `gtm-id.js` file, we need to ensure the static sites include the same file. The following is how we recommend doing this for Jekyll pages:

1. Add `<script src="/gtm-id.js"></script>` to the `www/_includes/header.html` file in your Jekyll files. 
2. Regenerate your Jekyll pages.
3. Make sure all pages have `<script src="/gtm-id.js"></script>` in the `<head>` tag of their templates.


### 5. Connect Google Tag Manager to Google Analytics

The last step is connecting the GTM and GA together. To do so, please follow [the official guide](https://support.google.com/tagmanager/answer/9442095?hl=en). In summary, 

1. We need first to grab the measurement ID associated with our GA account. The ID will start with _"G-"_ and on new accounts is visible on the home page of the GA account. If you cannot find it, navigate to the "Admin" page. Click on "Data Streams" on this page. You should see a data stream, click on it, and it will show you the Measeuerment ID.

2. Now that we have the measurement ID, we can navigate to the GTM home page and create a "tag" with it. This will ensure GTM data is sent to our GA account.




