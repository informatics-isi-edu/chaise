export type TestOptions = {
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
   */
  chaiseConfigFilePath: string,

  manualTestConfig?: boolean,

  /**
   * limit the number of workers to one and run all sequentally
   */
  runSequentially?: boolean
}
