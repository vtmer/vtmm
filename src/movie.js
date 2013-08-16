;(function() {
    // bootstrap the extension when install it
    (function() {
        if (localStorage.bootstraped) {     // already installed
            return;
        }

        delete localStorage.trello_token;

        localStorage.bootstraped = true;
    })();

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
            expiration: 'never',
            scope: { read: true, write: true },
            success: onAuthorized
        });
    }
})();
