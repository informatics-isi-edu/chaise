import { execSync } from 'child_process';
import { resolve } from 'path';
import { UPLOAD_FOLDER } from '@isrd-isi-edu/chaise/test/playwright/utils/constants';


export type RecordeditFile = {
  name: string,
  size: number | string,
  path: string,
  skipCreation?: boolean,
  skipDeletion?: boolean
}

/**
 * create files in the given path. This should be called before test cases
 * parent directory that these files will be uploaded into is test/e2e/data_setup/uploaded_files.
 * That means the given path should be a path that is valid in uploaded_files folder.
 *
 * @param  {RecordeditFile[]} files array of objects with at least path, and size as attributes.
 */
export const createFiles = async (files: RecordeditFile[]) => {
  files.forEach((f) => {
    if (f.skipCreation) return;
    const path = resolve(UPLOAD_FOLDER, f.path);
    execSync(`perl -e 'print \"1\" x ${f.size}' > ${path}`);
    console.log(`${path} created`);
  });
};

/**
* removes the given files. read the createFiles documentation for more info about files and path
* @param  {RecordeditFile[]} files array of objects with at least path, and size as attributes.
*/
export const deleteFiles = async (files: RecordeditFile[]) => {
  files.forEach((f) => {
    if (f.skipDeletion) return;
    const path = resolve(UPLOAD_FOLDER, f.path);
    execSync(`rm ${path}`);
    console.log(`${path} deleted`);
  });
};
