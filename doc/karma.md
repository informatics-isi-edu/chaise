#Karma 

Currently the application uses Karma for Unit Testing. Karma is a JavaScript command line tool that can be used to spawn a web server which loads your application's source code and executes your tests. You can configure Karma to run against a number of browsers, which is useful for being confident that your application works on all browsers you need to support. Karma is executed on the command line and will display the results of your tests on the command line once they have run in the browser.

Apart from that we use (Jasmine)[http://jasmine.github.io/1.3/introduction.html] to write the test-cases. Jasmine provides functions to help with structuring your tests and also making assertions. As your tests grow, keeping them well structured and documented is vital, and Jasmine helps achieve this.

Karma and Jasmine is a NodeJS application, and should be installed through npm.

###To install Karma and Jasmine on your system follow these steps

1. Delete folder "node_modules" from you  application directory
2. Run "sudo npm install" from you command prompt, to install all node.js dependencies.

###To run all Karma tests

Run `"karma start"` from you command prompt.

By Default Karma will look for *"karma.conf.js"*, and run the configuration mentioned in it. For more info on configuring you Karma tests you can refer (here)[http://karma-runner.github.io/0.13/config/configuration-file.html]

###To run specific Karma tests

You can create you own test configuration file to avoid running all Unit tests. To create one simply copy the existing `karma.conf.js` and rename it to the one that you want and place in a folder karma-test-config(If not present then create it). Now you just need to change `test/unit/*.js` to `test/unit/youtest.spec.js', to test specific file.

Run `"karma start [KarmaTestconfigname].js"` from your command prompt.




