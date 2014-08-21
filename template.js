var CACHE = {}
var render = function(name, params) {
  if (CACHE[name] != null) {
    return new Promise(function (fulfill, reject) {
      fulfill(CACHE[name](params));
    });
  }
  return Promise.resolve($.get(chrome.extension.getURL(name))).then(function(data) {
    CACHE[name] = Handlebars.compile(data);
    return CACHE[name](params);
  });
}
