export class UriUtils {
  static fixedEncodeURIComponent = function (str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  static queryStringToJSON = function(queryString: string) {
    queryString  = queryString || window.location.search;
    if (queryString.indexOf('?') > -1){
        queryString = queryString.split('?')[1];
    }
    var pairs = queryString.split('&');
    var result = {} as any;
    pairs.forEach(function(pair) {
        var pairList = pair.split('=');
        result[pairList[0]] = decodeURIComponent(pairList[1] || '');
    });
    return result;
  }
}

export class TypeUtils {

  /**
   * Return true if the input is string, otherwise false.
   * @param inp
   * @returns
   */
  static isStringAndNotEmpty = (inp: any) => {
    return typeof inp === "string" && inp.length > 0;
  }
}

export class MathUtils {
  static getRandomInt = (min: number, max: number) : number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Generates a unique uuid
   * @returns {String} a string of length 24
   */
  static uuid = () : string => {
    const s4 = MathUtils.uuidS4;
    return s4() + s4() + s4() + s4() + s4() + s4();
  }

  /**
   * @returns a random string of a deterministic length of 4
   * @private
   */
  private static uuidS4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(36);
  }
}
