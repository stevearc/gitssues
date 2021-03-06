var TOKEN = null;
var btnContainer = null

var addButtons = function(force) {
  var container = $('#js-repo-pjax-container .repository-content');
  if (container == null) {
    return;
  }
  btnContainer = $('#gitssues-container');
  if (btnContainer.length > 0) {
    if (force) {
      btnContainer.empty();
    } else {
      return;
    }
  } else {
    btnContainer = $('<div id="gitssues-container" class="gitssues btnContainer">');
    container.before(btnContainer);
  }
  var repoUri = getRepoAndUri();
  var repo = repoUri[0];
  var curUri = repoUri[1];

  var title, classes, uri, newButton;
  var anySelected = false;
  chrome.storage.sync.get(repo, function(data) {
    var repoData = data[repo];
    if (repoData == null) {
      repoData = {};
    }
    var buttons = repoData.buttons;
    if (buttons == null) {
      repoData.buttons = {
        'My issues': '/issues/assigned/' + getMeta('octolytics-actor-login')
      };
    }
    for (title in repoData.buttons) {
      uri = repoData.buttons[title];
      classes = '';
      if (uri === curUri) {
        classes = 'selected';
        anySelected = true;
      }
      newButton = $('<a href="/' + repo + uri + '" class="' + classes + ' btn btn-sm">' + title + '</a>');
      btnContainer.append(newButton);
    }
    if (!anySelected || true) {
      var editButton = $('<a class="btn btn-sm btn-primary">+/-</a>').click(function() {
        editButton.remove();
        btnContainer.find('a').each(function() {
          (function(btn) {
            btn.click(function(e) {
              e.preventDefault();
              delete repoData.buttons[btn.text().substr(1)];
              setData = {}
              setData[repo] = repoData
              chrome.storage.sync.set(setData, function() { addButtons(true) });
            })
            .addClass('danger')
            .text('-' + btn.text());
          })($(this));
        });
        var form = $('<form class="gitssues-add-link">')
        .appendTo(btnContainer)
        .submit(function(e) {
          e.preventDefault();
          if (this.title.value != null) {
            var repoUri = getRepoAndUri();
            var repo = repoUri[0];
            var curUri = repoUri[1];
            repoData.buttons[this.title.value] = curUri;
            setData = {}
            setData[repo] = repoData
            chrome.storage.sync.set(setData, function() { addButtons(true) });
          }
        });
      $('<input name="title" type="text" size="20">').appendTo(form).focus();
      }).appendTo(btnContainer);
    }
  });
};

var addClickHandlers = function() {
  var repo = getRepoAndUri()[0];
  $('#js-repo-pjax-container li.js-issue-row').each(function() {
    var t = $(this);
    // Don't add duplicate click handlers.
    if (t.attr('gitssues-click')) {
      return;
    }
    t.attr('gitssues-click', 1);
    t.click(function(e) {
      // Don't capture clicks that were already hitting a link.
      if (e.target.tagName === 'A' || e.target.parentElement.tagName === 'A') {
        return;
      }
      var issue = t.attr('id').slice('issue_'.length);
      var container = $('#gitssues-comments-' + issue);
      // Remove existing container before opening a new one.
      if (container.length > 0) {
        container.remove();
        return;
      }
      var container = $('<li id="gitssues-comments-' + issue + '" class="read table-list-item gitssues-comments">');
      container.append($('<div style="text-align: center"><img alt="" width="32" height="32" src="https://assets-cdn.github.com/images/spinners/octocat-spinner-64.gif"></div>'));
      t.after(container);
      fetchAllComments(repo, issue).then(function(comments) {
        var renderComment = function(parameters) {
          return render('comment.html', parameters);
        }
        Promise.all(comments.map(renderComment)).then(function(results) {
          container.empty();
          for (var i=0; i < results.length; i++) {
            container.append(results[i]);
          }
        });
      }, function(err) {
        container.empty();
        render('token.html', {}).then(function(html) {
          container.append(html);
          container.find('form').submit(function(e) {
            e.preventDefault();
            if (this.token.value.length > 0) {
              TOKEN = this.token.value;
              chrome.storage.sync.set({'token': TOKEN}, function() {
                container.remove();
              });
            }
          });
        });
      });
    });
  });
}

$(document).ready(function() {
  chrome.storage.sync.get('token', function(data) {
    TOKEN = data.token;
  });
  // Always send up the auth token to Github.
  $.ajaxPrefilter(function(options) {
    if (!options.beforeSend) {
      options.beforeSend = function(xhr) {
        if (TOKEN != null && !chrome.extension.inIncognitoContext) {
          xhr.setRequestHeader('Authorization', 'token ' + TOKEN);
        }
      }
    }
  });

  // Github uses pjax, so we have to watch for url changes.
  var curUri;
  function detectLocationChange() {
    curUri = getRepoAndUri()[1];
    if (curUri.match(/^\/(issues|pull|labels|milestones)/) != null) {
      addButtons();
      addClickHandlers();
    } else {
      $('#gitssues-container').remove();
    }
    setTimeout(detectLocationChange, 200);
  }
  detectLocationChange();
  window.addEventListener("DOMNodeInserted", addClickHandlers, false);
});
