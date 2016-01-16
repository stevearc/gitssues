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
  var url = 'https://api.github.com/repos/' + repo + '/issues/' + issue;
  return Promise.resolve($.ajax({
    type: "GET",
    url: url,
    headers: {
      'Accept': 'application/vnd.github.v3.html+json'
    }
  })).then(function(issue) {
    if (issue.comments === 0) {
      return [issue];
    }
    return Promise.resolve($.ajax({
      type: "GET",
      url: url + '/comments',
      headers: {
        'Accept': 'application/vnd.github.v3.html+json'
      }
    })).then(function(comments) {
      comments.unshift(issue);
      return comments;
    })
  })
}

function getMeta(name) {
  return $('meta[name=' + name + ']').attr('content');
}
