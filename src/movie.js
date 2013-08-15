;(function() {
    var onAuthorized = function() {
        // forward to background script
        chrome.extension.sendRequest({
            name: 'store',
            value: localStorage.trello_token
        }, function(resp) { console.log(resp); });
    };

    if (!Trello.authorized()) {
        Trello.authorize({
            name: '维他妈电影院选影助手',
            type: 'popup',
            scope: { read: true, write: true },
            success: onAuthorized
        });
    }
})();
