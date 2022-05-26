# Chaise [![Build Status](https://github.com/informatics-isi-edu/chaise/workflows/Chaise%20end-to-end%20tests/badge.svg?branch=master)](https://github.com/informatics-isi-edu/chaise/actions?query=workflow%3A%22Chaise+end-to-end+tests%22+branch%3Amaster)
_Computer-human access interface with schema evolution!_

## Overview

Chaise is a model-driven web interface (more formally a [user agent]) for data
discovery, analysis, visualization, editing, sharing and collaboration over
tabular data (more specifically [relational data]) served up as [Web resources]
by the [ERMrest] service. Chaise dynamically renders relational data resources
based on a small set of baseline assumptions, combined with its rendering
[heuristics], and finally user preferences in order to support common user
interactions with the data. Chaise is developed in JavaScript, HTML, and CSS
which runs in most modern Web browsers. This includes Chrome 13 (or better),
Firefox 7 (or better), Internet Explorer 10 (or better including ME Edge), and
Safari 6 (or better). Chaise is the front-end component of the [Deriva Platform].
Chaise utilizes [ERMrestJS] client library to interact with the Deriva services
including including [ERMrest], [Hatrac], and [ioboxd].


[heuristics]: https://en.wikipedia.org/wiki/Heuristic_%28computer_science%29
[relational data]: https://en.wikipedia.org/wiki/Relational_database
[user agent]: https://en.wikipedia.org/wiki/User_agent
[Web resources]: https://en.wikipedia.org/wiki/Web_resource
[ERMrest]: https://github.com/informatics-isi-edu/ermrest
[Hatrac]: https://github.com/informatics-isi-edu/hatrac
[ioboxd]: https://github.com/informatics-isi-edu/ioboxd
[Deriva Platform]: http://isrd.isi.edu/deriva
[ERMrestJS]: https://github.com/informatics-isi-edu/ermrestjs

## Dynamic Rendering Approach

Chaise is intended to support specific user interactions, as briefly introduced
above (e.g., discovery, analysis, editing, etc.). As such, its presentation
capabilities are narrowly scoped to support these interactions. Thus, Chaise
makes a few assumptions about how users will interact with the underlying
data.

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

Beyond these baseline assumptions about basic usage, Chaise makes almost no
assumptions about the structure of the underlying [data model], such as its
tables, columns, keys, foreign key relationships, etc. Chaise begins by
introspecting the data model by getting the `catalog/N/schema` resource from
[ERMrest]. The schema resource includes lightweight semantic annotations about
the model in addition to the underlying relational database schema. Chaise uses
its rending heuristics to decide, for instance, how to flatten a hierarchical
structure into a simplified (or [denormalized]) presentation for searching and
viewing. The schema annotations are then used to modify or override its
rendering heuristics, for instance, to hide a column of a table or to use a
specific display name in the interface that is different than the column name
from the table definition of the schema. Chaise then applies user preferences
to further override the rendering decisions and annotations, for instance, to
present a nested table of data in a transposed layout (i.e., with the columns
and rows flipped).

## Available Applications

Chaise is suite of the following applications:

- [record](record/): Shows all the information for an entity.
- [recordset](recordset): Shows a set of entities that can be faceted.
- [recordedit](recordedit): Gives the ability to add(or update) single or multiple entities.
- [viewer](viewer/):High resolution pyramidal, tiled image visualization tool with pan and zoom capability.

## Installation

See [Chaise installation](docs/user-docs/installation.md).


## Code Contribute

When developing new code for Chaise, please make sure you're following these steps:

1. create a new branch and make your updates to the code in the branch (avoid changing master branch directly);
2. do your own quality assurance;
4. update the e2e tests (if applicable);
6. make sure you can deploy your code without any issues (`make dist && make deploy` should not fail);
7. make sure that all tests are passing before submitting the pull request (`make test` should be free of errors);
8. make your pull request, assign it to yourself, and ask someone to review your code.
  - Try to provide as much information as you can on your PR. Explain the issues that the PR is fixing, and the changes that you've done in the PR.
  - Provide examples if applicable.
  - Deploy your changes to a server if applicable and provide links. You should not expect reviewers to deploy your code.
  - Make sure Github Action build is successful before merging your PR.
  - Resolve the conflicts with master before merging the code (and go through the process of making sure tests are good to go).

## Help and Contact

Please direct questions and comments to the [project issue tracker](https://github.com/informatics-isi-edu/chaise/issues) at GitHub.

## License

Chaise is made available as open source under the Apache License, Version 2.0. Please see the [LICENSE file](LICENSE) for more information.

## About Us

Chaise is developed in the
[Informatics group](http://www.isi.edu/research_groups/informatics/home)
at the [USC Information Sciences Institute](http://www.isi.edu).
