export type TestOptions = {
  /**
   * the name of the main spec folder. used for locating the chaise-config.js file. If missing, we won't try to find and
   * copy the chaise-config.js file into the remote location.
   *
   * Note: it should be defined for all the tests under "specs". It's optional so we can use this for manual testing too.
   */
  mainSpecName?: string,
  /**
   * the name of the spec (will be used for the report file)
   */
  testName: string,

  testMatch?: string|RegExp|Array<string|RegExp>,
  /**
   * location of the .dev.json file
   */
  configFileName: string,
  /**
   * location of the chaise config file
   * (if misisng, we're using mainSpecName to find the chaise-config file).
   * /test/e2e/specs/<mainSpecName>/chaise-config.js
   */
  chaiseConfigFilePath?: string,

  /**
   * if set to to true, we will inject the "defaultCatalog" property
   * into the chaise-config.js file.
   *
   * the id of the catalog created for the chrome project will be used for this.
   */
  addDefaultCatalogToChaiseConfig?: boolean,

  manualTestConfig?: boolean,

  /**
   * limit the number of workers to one and run all sequentally
   */
  runSequentially?: boolean
}
