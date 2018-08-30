The export annotation applies at the table level. It allows for downloading sets of data using the BDBag tool available in the iobox service. The following is how chaise leverages the different values defined in the export annotation:
```js
templates: [
  {
    name: <some-name>,  // cannot be the same in subsequent templates
    format_name: <chaise-display-name>, // name displayed in dropdown menu in chaise
    format_type: <FILE or BAG>,
    outputs: [
      {
        source: {
          api: <ermrest-query-type>, // entity, attribute, attribute-group
          table: <schema:table>
          path: <optional-ermrest-predicate> // used to represent more complex queries
        },
        destination: {
          name: <output-file-base-name>,
          type: <output-format-suffix>, // FILE supports csv, json; BAG supports csv, json, fetch(?), download(?)
          params: <not-sure> // conditionally optional
        }
      }, ...
    ]
  }
]
```

More information can be found [here](https://github.com/informatics-isi-edu/ioboxd/blob/master/doc/integration.md) with multiple examples.
