// Karma configuration
// Generated on Wed Aug 26 2015 15:14:20 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'browserify'],


    // list of files / patterns to load in the browser
    files: [
        '../scripts/vendor/jquery-3.3.1.min.js',
        '../scripts/vendor/jquery.js',
        '../scripts/vendor/angular.js',
        '../scripts/vendor/angular-sanitize.js',
        '../node_modules/angular-mocks/angular-mocks.js',
        '../scripts/vendor/select.js',
        'viewer.app.js',
        // including the common dependencies
        '../common/filters.js',
        // including the scripts/ dependencies
        '../scripts/**/*.js',
        // including the ermrestjs dependencies
        '../../ermrestjs/js/*.js',
        // placeholder to only include specified files
        'alerts/*.js',
        'annotations/*.js',
        'common/**/*.js',
        'image-metadata/*.js',
        'osd/*.js',
        'sidebar/*.js',
        // '**/*.js',
        '../chaise-config.js',
        // Specs to run, use test/*.spec.js for all tests
        'test/*.spec.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/*.spec.js': ['browserify']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'osx'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS2'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
