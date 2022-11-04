# Help document pages

This folder contains the document pages that Chaise can display in the help app. 

- Documents under the `chaise` folder are maintained by Chaise developers and are required by some Chaise apps, so please don't modify that folder.


- Feel free to add any help page you'd like to display to the users through Chaise. Any `.md` file in this folder can be accessed through the help app. For example, this `README.md` file can be accessed by navigating to `/chaise/help/?page=README`.


- The `page` query parameter supports folders as well. For instance, you can create a `my-docs` folder under this directory with a `sample.md` document. Then you can access this document by navigating to `/chaise/help/?page=my-docs%2Fsample`.
