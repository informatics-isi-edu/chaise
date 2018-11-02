# Useful Browser Console Commands

## Browser Console

Please refer to [this link](https://webmasters.stackexchange.com/a/77337) on how to access your browser's console. Using console you can execute any Javascript code. You have access to all the global objects that are defined in the current website. For example if you go to a Chaise page, you can access `ERMrest` object. `ERMrest` is the global object that we're using in Chaise to use ERMrestJS functions. To test this, just go to a Chaise page, open your browser's console, and write `ERMrest` and press enter. The console will output the prototype of this object for you, signaling that it's available.


## Useful Functions

As we mentioned in the previous sections, all the ERMrestJS APIs are accessible through `ERMrest` object in your browser's console. In this section we are going to mention some of the function that you might find useful:

1. `ERMrest.encodeFacet()`: Given a Javascript object, it will return the compressed string value of it. This is the same compression/encoding algorithm that we're using for facets (hence the name). You can use this to generate the encoded string for you.

    ```
    > ERMrest.encodeFacet({"and": [{"source": "RID", "choices": ["NX-412"]}]})

    "N4IghgdgJiBcDaoDOB7ArgJwMYFM4gCUBJAERABoQsALFAS1yTnhADkANAWgBYBGAJhABdAL6igA"
    ```

2. `ERMrest.decodeFacet()`: Given an encoded string, it will return the decoded object for you.

    ```
    > ERMrest.decodeFacet("N4IghgdgJiBcDaoDOB7ArgJwMYFM4gCUBJAERABoQsALFAS1yTnhADkANAWgBYBGAJhABdAL6igA")

    Object {and: (1 [...])}
    ```

    Each browser will show the object differently. They usually give you a UI that you can expand the object and see its attributes. If you just want the string representation, you can use the AngularJS built-in `angular.toJson` function (its second attribute is the number of spaces per indentation. If you leave it empty it won't add any indentation or whitespace in the string representation of the object).

    ```
    > angular.toJson(ERMrest.decodeFacet("N4IghgdgJiBcDaoDOB7ArgJwMYFM4gCUBJAERABoQsALFAS1yTnhADkANAWgBYBGAJhABdAL6igA"))

    "{\"and\":[{\"source\":\"RID\",\"choices\":[\"NX-412\"]}]}"
    ```

3. `ERMrest.createPath()`: This function can be used to create the path. It will call the `ERMrest.encodeFacet` internally. These are its parameters in order (from left to right): catalog id, schema name, table name, and facets.

    ```
    > ERMrest.createPath("1", "schema", "table")

    "#1/schema:table"

    > ERMrest.createPath("1", "schema", "table", {"and": [{"source": "RID", "choices": ["NX-412"]}]})

    "#1/schema:table/*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM4gCUBJAERABoQsALFAS1yTnhADkANAWgBYBGAJhABdAL6igA"
    ```

## Global Variables

The following are the list of variables that are globally available in different apps in Chaise.

1. `defaultExportTemplate`: This attribute is only available in the record app. It will return the default export template that ERMrestJS is going to generate based on the table models.
