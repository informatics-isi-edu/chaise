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

export class ConfigUtils {

}