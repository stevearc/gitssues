var getRepoAndUri = function() {
  var repo = window.location.pathname.match(/[^\/]+\/[^\/]+/)[0];
  var curUri = window.location.pathname.substr(repo.length + 1) + window.location.search;
  return [repo, curUri];
}

var COMMENT_CACHE = {};
var fetchAllComments = function(repo, issue) {
  var key = repo + ':' + issue;
  if (COMMENT_CACHE[key] != null) {
    return new Promise(function(fulfill, reject) {
      fulfill(COMMENT_CACHE[key]);
    });
  }
  return Promise.resolve($.ajax({
    type: "GET",
    url: 'https://api.github.com/repos/' + repo + '/issues/' + issue + '/comments',
    headers: {
      'Accept': 'application/vnd.github.v3.html+json'
    }
  }))
}

function getMeta(name) {
  return $('meta[name=' + name + ']').attr('content');
}
