
/**
 * given a page object, return array of RowValue types
 * @param {ERMrest.Page} page
 * @return [Object] array of row values in the form of {isHTML: boolean, value: v}
 */
export function getRowValuesFromPage(page: any) {
  return page.tuples.map((tuple: any) => {
    const row: {isHTML: boolean, value: string}[] = [];
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
 * given an array of tuples, return array of cell values
 * arranged based on their columns and then rows
 * @param {ERMrest.Page} Tuples
 * @return [Object] array of row values in the form of {isHTML: boolean, value: v}
 */
export function getColumnValuesFromPage(page: any) {
  const result : any = [];
  page.tuples.forEach((tuple: any, tupleIndex: number) => {
    tuple.values.forEach( (value: string, colIndex: number) => {
      if (!Array.isArray(result[colIndex])) {
        result[colIndex] =  Array(page.length);
      }
      result[colIndex][tupleIndex] = {
        isHTML: tuple.isHTML[colIndex],
        value
      }
    });
  });
  return result;
}

/**
 * given an array of tuples, return array of RowValue types
 * arranged based on rows and then columns
 * @param {ERMrest.Page} Tuples
 * @return [Object] array of row values in the form of {isHTML: boolean, value: v}
 */
export function getRowValuesFromTuples(tuples: any) {
  return tuples.map((tuple: any) => {
    const row: {isHTML: boolean, value: string}[] = [];
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



