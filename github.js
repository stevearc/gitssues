var getRepoAndUri = function() {
  var repo = window.location.pathname.match(/[^\/]+\/[^\/]+/)[0];
  var curUri = window.location.pathname.substr(repo.length + 1) + window.location.search;
  return [repo, curUri];
}

var renderBodyMarkdown = function(data) {
  return renderMarkdown(data.body).then(function(text) {
    data.bodyMarkdown = text;
    return data;
  });
}

function renderMarkdown(text) {
  return new Promise(function(fulfill, reject) {
    var repoId = getMeta('octolytics-dimension-repository_id');
    var csrfToken = getMeta('csrf-token');
    $.ajax({
      type: "POST",
      url: '/preview?repository=' + repoId,
      headers: {
        'X-CSRF-Token': csrfToken
      },
      data: {
        text: text
      },
      success: fulfill,
      error: reject
    });
  })
}

var COMMENT_CACHE = {};
var fetchAllComments = function(url) {
  if (COMMENT_CACHE[url] != null) {
    return new Promise(function(fulfill, reject) {
      fulfill(COMMENT_CACHE[url]);
    });
  }
  var allComments = [];
  return Promise.resolve($.get(url))
    .then(renderBodyMarkdown)
    .then(function(data) {
      allComments.push(data);
      if (data.comments === 0) {
        return allComments;
      } else {
        return Promise.resolve($.get(url + '/comments')).then(function(moreComments) {
          return Promise.all(moreComments.map(renderBodyMarkdown)).then(function(comments) {
            for (var i=0; i < comments.length; i++) {
              allComments.push(comments[i]);
            }
            COMMENT_CACHE[url] = allComments;
            return allComments
          });
        });
      }
    });
}

function getMeta(name) {
  return $('meta[name=' + name + ']').attr('content');
}
