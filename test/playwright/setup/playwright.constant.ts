
export const ERMREST_URL = process.env.ERMREST_URL;

export const getCatalogID = () => process.env.CATALOG_ID;


// This is where we're writing the entities to.
// There are some system generated columns that we might want to know the value of,
// entities will have those. The problem is that we cannot just attach this variable
// to `global` since we might run test specs in multiple threads via sharding.
// Therefore we are writing these data this file, and then removing the file
export const ENTITIES_PATH = 'entities.json';
