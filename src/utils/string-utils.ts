export function toTitlecase(str: string) {
  return str.replace(/[^-'\s]+/g, function (word) {
    return word.replace(/^./, function (first) {
      return first.toUpperCase();
    });
  });
}

export function underscoreToSpace(str: string) {
  return str.replace(/_/g, ' ');
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

export function hasTrailingPeriod(str: string) {
  return str[str.length-1] === '.';
}
