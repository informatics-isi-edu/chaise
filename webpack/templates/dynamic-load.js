/**
 * This template will generate a javascript file that will dynamically loads the
 * needed dependencies if they are not already incldued in the page.
 *
 * Notes:
 * - Currently used for navbar and login libs.
 * - html-webpack-plugin expects this function to return a string that is evaluated
 * to javascript/html file. As a result we cannot also have comments in the code below.
 * - The evaluated javascript needs to be es5 compatiple based on terser (what webpack
 * uses under the hood).
 */
module.exports = function (templateParams) {
  const CSS_DEPS = JSON.stringify(templateParams.htmlWebpackPlugin.files.css);

  // this is already stringified, so we have to remove the last `]` and add the rest
  let externalFiles = templateParams.htmlWebpackPlugin.options.external_files;
  let webpackFiles = JSON.stringify(templateParams.htmlWebpackPlugin.files.js);

  // create a string representation of both
  const JS_DEPS = `${externalFiles.slice(0, -1)},${webpackFiles.substring(1)}`;

  return `

  var JS_DEPS = ${JS_DEPS};
  var CSS_DEPS = ${CSS_DEPS};


  var head = document.getElementsByTagName('head')[0];

  function loadStylesheet (url, callback) {
    if (alreadyLoaded(url, true)) {
      if (callback) callback();
      return;
    }

    var link = document.createElement('link');
    link.setAttribute('type', 'text/css');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', url);
    head.appendChild(link);
    if (callback) callback();
  }

  function loadScript(url, callback) {
    if (alreadyLoaded(url, false)) {
      if (callback) callback();
      return;
    }

    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', url);
    if (callback) {
      script.addEventListener('load', callback);
      script.addEventListener('error', callback);
    }
    head.appendChild(script);
  }

  function alreadyLoaded(url, isStylesheet) {
    let foundInResources = false;
    try {
      foundInResources = performance.getEntries().some(function (e) {
        return e.entryType === 'resource' && e.name.indexOf(url) !== -1;
      });
    } catch (exp) { }

    var selector = isStylesheet ? ('link[href^="' + url + '"]') : ('script[src^="' + url + '"]');
    var foundInTag = document.querySelectorAll(selector).length > 0;

    return foundInResources || foundInTag;
  }

  function loadDependencies() {
    JS_DEPS.forEach(function (url) {
      loadScript(url);
    });

    CSS_DEPS.forEach(function (url) {
      loadStylesheet(url);
    });
  }

  loadDependencies();
`;
}
