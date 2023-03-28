
## Integrating Google Tag Manager for deployment analytics ##

### Adding Google Tag Manager to Chaise pages ###

1. Copy and paste the following code into a file called `gtm-id.js`. 
2. Add your GTM ID on the first uncommented line, `var gtmId = [YOUR CONTAINER ID HERE]`.
3. Add gtm-id.js file to deployment server at the same level as Chaise folder (e.g. /gtm-id.js).

```
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

### Adding Google Tag Manager to static pages ###
    
1. If your deployment has Jekyll pages, add `<script src="/gtm-id.js"></script>` to the `www/_includes/header.html` file in your Jekyll files (example). 
2. Regenerate your Jekyll pages.
3. Make sure all pages have `<script src="/gtm-id.js"></script>` in the <head> of their templates.
