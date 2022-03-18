import { RowValue } from '@chaise/models/row-value';

/**
 * given a page object, return array of RowValue types
 * @param {ERMrest.Page} page
 * @return [Object] array of row values in the form of {isHTML: boolean, value: v}
 */
export function getRowValuesFromPage(page: any) {
  return page.tuples.map((tuple: any) => {
    const row: RowValue[] = [];
    tuple.values.forEach((value: string, index: number) => {
      row.push({
        isHTML: tuple.isHTML[index],
        // value: (tuple.isHTML[index]? $sce.trustAsHtml(value) : value)
        value,
      });
    });
    return row;
  });
}

/**
 * given an array of tuples, return array of RowValue types
 * @param {ERMrest.Page} Tuples
 * @return [Object] array of row values in the form of {isHTML: boolean, value: v}
 */
export function getRowValuesFromTuples(tuples: any) {
  return tuples.map((tuple: any) => {
    const row: RowValue[] = [];
    tuple.values.forEach((value: string, index: number) => {
      row.push({
        isHTML: tuple.isHTML[index],
        value,
      });
    });
    return row;
  });
}

/**
 * return the inner text of a displayname object ({value: string, isHTML:boolean})
 * @param {Object} displayname {value: string, isHTML:boolean}
 * @return {String}
 */
export function getDisplaynameInnerText(displayname: any) {
  if (!displayname.isHTML) {
    return displayname.value;
  }
  let dummy = document.createElement('div'), res;
  dummy.innerHTML = displayname.value;
  res = dummy.innerText;
  return res;
}


const ID_SAFE_REGEX = /[^\w-]+/g;
/**
*
* @desc This function is used to make sure the input `string` is id/class safe
* For both class and id:
*   - Must begin with a letter A-Z or a-z
*   - Can be followed by: letters (A-Za-z), digits (0-9), hyphens ("-"), and underscores ("_")
* NOTE: this won't ensure the very beginning of the input string is safe
* it assumes the input string is being appended to an already safe string
* @param {String} string
* @return {String} a string suitable for use in the `id` attributes of HTML elements
*/
export function makeSafeIdAttr(string: string) {
    return String(string).replace(ID_SAFE_REGEX, '-');
}
