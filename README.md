# Chaise (Computer-Human Access Interface with Schema Evolution) [![Build Status](https://github.com/informatics-isi-edu/chaise/workflows/Chaise%20end-to-end%20tests/badge.svg?branch=master)](https://github.com/informatics-isi-edu/chaise/actions?query=workflow%3A%22Chaise+end-to-end+tests%22+branch%3Amaster)


A suite of web applications that adapt to the data model for data discovery, analysis, visualization, editing, sharing and collaboration. 

Chaise is the main front-end component of the [DERIVA asset management Platform](http://isrd.isi.edu/deriva) and utilizes [ERMrestJS](https://github.com/informatics-isi-edu/ermrestjs) client library to interact with the DERIVA services including [ERMrest](https://github.com/informatics-isi-edu/ermrest) (a general relational data storage service), [webauthn](https://github.com/informatics-isi-edu/webauthn) (authentication provider framework), [Hatrac](https://github.com/informatics-isi-edu/hatrac) (an object store service), and [deriva-web export](https://github.com/informatics-isi-edu/deriva-web). 

## Table of Contents

- [Applications](#applications)
- [How it works](#how-it-works)
- [Resources](#resources)
- [How to Contribute](#how-to-contribute)
- [Help and Contact](#help-and-contact)
- [License](#license)
- [About Us](#about-us)

## Applications

Chaise includes the following applications:

<table>
  <tbody id="all-apps-table">
    <tr>
      <th>App</th>
      <th>Description</th>
      <th width="500px">Screenshot</th>
    </tr>
    <tr>
      <td><strong>Recordset</strong></td>
      <td>
        Shows a set of entities for a table and allow users to search through them.
        <br/><br/><strong>Notable features:</strong><br/>
        <ul>
          <li>Full-text search</li>
          <li>Customizable faceted search</li>
          <li>Export set of data</li>
          <li>Customizable tabular view of entities</li>
        </ul>
      </td>
      <td><img src='https://dev.isrd.isi.edu/~ashafaei/images/atlas_collection_recordset-min.png' height=300 /></td>
    </tr>
    <tr>
      <td><strong>Record</strong></td>
      <td>
        Shows all the information for an entity.
        <br/><br/><strong>Notable features:</strong><br/>
        <ul>
          <li>Fully customizable column values through annotation.</li>
          <li>Display entities from other tables that have relationship with the main table.</li>
          <li>...</li>
        </ul>
      </td>
      <td><img src='https://dev.isrd.isi.edu/~ashafaei/images/atlas_collection_record-min.png' height=300 /></td>
    </tr>
    <tr>
      <td><strong>Recordedit</strong></td>
      <td>
        Gives the ability to add(or update) single or multiple entities.
        <br/><br/><strong>Notable features:</strong><br/>
        <ul>
          <li>Displays appropriate inputs based on the column types (including color and markdown).</li>
          <li>Allows users to upload files to hatrac.</li>
        </ul>
      </td>
      <td><img src='https://dev.isrd.isi.edu/~ashafaei/images/atlas_collection_recordedit-min.png' height=300 /></td>
    </tr>
    <tr>
      <td><strong><a href='https://github.com/informatics-isi-edu/chaise/blob/master/docs/viewer/viewer-app.md'>Viewer</a></strong></td>
      <td>
        High resolution pyramidal, tiled image visualization tool with pan and zoom capability.
        <br/><br/><strong>Notable features:</strong><br/>
        <ul>
          <li>Supports IIIF, DZI, and other browser compatible images.</li>
          <li>Manipulate the color filters applied to the displayed image.</li>
          <li>Add or modify image annotations that overlay on top of the image.</li>
          <li>Navigate between image scenes with different Z-indices.</li>
        </ul>
      </td>
      <td><img src='https://dev.isrd.isi.edu/~ashafaei/images/atlas_image_viewer-min.png' height=300 /></td>
    </tr>
  </tbody>
</table>

## How it works

The following papers describe Chaise in detail:

* Model-Adaptive User Interfaces For Collaborative Scientific Data Management. Tangmunarunkit, H.; Shafaeibejestan, A.; Chudy, J.; Czajkowski, K.; Schuler, R.; and Kesselman, C. In Copenhagen, Denmark, March 2020. [pdf](http://isrd.isi.edu/downloads/Chaise_EDBT2020.pdf)
* Model-Adaptive Interface Generation for Data-Driven Discovery. Tangmunarunkit, H.; Shafaeibejestan, A.; Chudy, J.; Czajkowski, K.; Schuler, R.; and Kesselman, C. In Sophia Antipolis, France, June 2020. [pdf](https://arxiv.org/pdf/2110.01781.pdf)

Chaise is intended to support specific user interactions, as briefly introduced above (e.g., discovery, analysis, editing, etc.). As such, its presentation capabilities are narrowly scoped to support these interactions. Thus, Chaise makes a few assumptions about how users will interact with the underlying data.

A few representative but non-exhaustive examples of these assumptions include:
- search, explore, and browse collections of data
- navigate from one data record to the next by following their
  relationships (i.e., following links)
- add, edit, remove data records from the database
- create, alter, or extend the data model itself
- subset and export data collections
- share data with other users
- annotate data records with [tags] or [controlled vocabulary] terms

[tags]: https://en.wikipedia.org/wiki/Tag_(metadata)
[controlled vocabulary]: https://en.wikipedia.org/wiki/Controlled_vocabulary
[data model]: https://en.wikipedia.org/wiki/Data_model
[denormalized]: https://en.wikipedia.org/wiki/Denormalization

Beyond these baseline assumptions about basic usage, Chaise makes almost no assumptions about the structure of the underlying [data model], such as its tables, columns, keys, foreign key relationships, etc. Chaise begins by introspecting the data model by getting the `catalog/N/schema` resource from [ERMrest]. The schema resource includes lightweight semantic annotations about the model in addition to the underlying relational database schema. 

Chaise uses its rending heuristics to decide, for instance, how to flatten a hierarchical structure into a simplified (or [denormalized]) presentation for searching and viewing. The schema annotations are then used to modify or override its rendering heuristics, for instance, to hide a column of a table or to use a specific display name in the interface that is different than the column name from the table definition of the schema. Chaise then applies user preferences to further override the rendering decisions and annotations, for instance, to present a nested table of data in a transposed layout (i.e., with the columns and rows flipped).

## Resources

The following are the documents and resources that we've prepared for users and developers of Chaise:

- [User guides](docs/user-docs): Contains documents and examples on how you can configure and use Chaise. Some of the more notable documents are:
  -  [Installation](docs/user-docs/installation.md): How to install Chaise.
  -  [Chaise Config](docs/user-docs/chaise-config.md): How to configure Chaise.
  -  [Navbar app integration](docs/user-docs/navbar-app.md): Goes over how the Chaise's Navbar app can be embedded in other web applications.
  -  [Logging](docs/user-docs/logging.md): How Chaise is logging server requests as well as client actions.
  -  [Query parameters](docs/user-docs/query-parameters.md): Query parameters that can be used in different Chaise applications.
- [Deveoper guides](docs/user-docs): 

## How to Contribute

When developing new code for Chaise, please make sure you're following these steps:

1. create a new branch and make your updates to the code in the branch (avoid changing master branch directly);
2. do your own quality assurance;
4. update the e2e tests (if applicable);
5. make sure the liner doesn't throw any errors (`make lint` should not fail);
6. make sure you can deploy your code without any issues (`make dist && make deploy` should not fail);
7. make sure that all tests are passing before submitting the pull request (`make test` should be free of errors);
8. make your pull request, assign it to yourself, and ask someone to review your code.
   - Try to provide as much information as you can on your PR. Explain the issues that the PR is fixing, and the changes that you've done in the PR.
   - Provide examples if applicable.
   - Deploy your changes to a server if applicable and provide links. You should not expect reviewers to deploy your code.
   - Make sure Github Action build is successful before merging your PR.
   - Resolve the conflicts with master before merging the code (and go through the process of making sure tests are good to go).

## Help and Contact

Please direct questions and comments to the [project issue tracker](https://github.com/informatics-isi-edu/chaise/issues).
## License

Chaise is made available as open source under the Apache License, Version 2.0. Please see the [LICENSE file](LICENSE) for more information.

## About Us

Chaise is developed in the [Informatics Systems Research group](https://www.isi.edu/isr/) at the [USC Information Sciences Institute](http://www.isi.edu).
