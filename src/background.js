;(function() {
    // bootstrap the extension when install it
    (function() {
        if (localStorage.bootstraped) {     // already installed
            return;
        }

        // remove legacy token
        delete localStorage.voter;
        delete localStorage.trello_token;

        localStorage.bootstraped = true;
    })();

    var voter = JSON.parse(localStorage.voter || '{}'),
        VOTING_BOARD = 'vtmm',
        VOTING_LIST = '今日上映';
    
    var saveVoter = function() {
        localStorage.voter = JSON.stringify({
            userId: voter.userId,
            name: voter.name,
            boardId: voter.boardId
        });
    };

    var authorizeVoter = function() {
        var dfd = new $.Deferred();

        if (!Trello.authorized()) {
            // only get token from localStorage
            Trello.authorize({ interactive: false, success: function() {
                dfd.resolve();
            }});
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    };

    var initVoter = function() {
        var dfd = new $.Deferred();
        
        if (!$.isEmptyObject(voter)) {
            dfd.resolve();

            return dfd.promise();
        }

        voter = {};
        Trello.get('members/me', function(user) {
            voter.userId = user.id;
            voter.name = user.fullName;
        });

        Trello.get('members/me/boards', function(boards) {
            $.each(boards, function(idx, board) {
                if (board.name === VOTING_BOARD) {
                    voter.boardId = board.id;
                    dfd.resolve();

                    saveVoter(voter);
                }
            });
            dfd.reject();
        });

        return dfd.promise();
    };

    var getList = function() {
        var dfd = new $.Deferred();

        var _getCards = function(listId) {
            Trello.get('lists/' + listId, {cards: 'open'}, function(list) {
                voter.list = list;
                voter.cards = list.cards;
                dfd.resolve();
            });
        };

        Trello.get('boards/' + voter.boardId + '/lists/open', function(lists) {
            $.each(lists, function(idx, list) {
                if (list.name === VOTING_LIST) {
                    voter.listId = list.id;
                    _getCards(list.id);
                }
            });
        });

        return dfd.promise();
    };

    var voteMovie = function() {
        var dfd = new $.Deferred(),
            foundCard = false;


        var _voteMovie = function(card) {     // subscribe to the card
            var members = card.idMembers;
            members.push(voter.userId);

            Trello.put('cards/' + card.id + '/idMembers',
                       {value: members.join(',')}).done(function() {
                // release the lock
                delete localStorage[voter.movie.desc];
                delete localStorage[voter.movie.desc + '/renew'];
                dfd.resolve();
            });
        };

        for (var i = 0;i < voter.cards.length;i++) {
            if (voter.cards[i].name === voter.movie.name) {
                _voteMovie(voter.cards[i]);
                foundCard = true;
                break;
            }
        }

        if (!foundCard) {
            // create a card
            Trello.post('lists/' + voter.listId + '/cards', voter.movie)
                  .done(_voteMovie);
        }

        return dfd.promise();
    };

    var setMovie = function(tab) {
        var dfd = $.Deferred(),
            current = new Date();

        voter.movie = {
            name: tab.title,
            desc: tab.url
        };

        if (localStorage[tab.url] &&
            localStorage[tab.url + '/renew'] < current.getTime()) {
            dfd.reject();
        } else {
            // avoid duplicate voting
            localStorage[tab.url] = true;
            localStorage[tab.url + '/renew'] = current.getTime() + 600;
            dfd.resolve();
        }

        return dfd.promise();
    };

    var onRequest = function(req, sender, resp) {
        // show the icon
        chrome.pageAction.show(sender.tab.id);

        // store trello's token
        if (req.name === 'store') {
            localStorage.trello_token = req.value;

            voter = null;
            authorizeVoter()
                .then(initVoter)
                .then(resp(voter));
        }
    };

    var onClicked = function(tab) {authorizeVoter().then(function() {
        setMovie(tab)
            .then(getList)
            .then(voteMovie)
            .always(function() { console.log(voter); });
    });
    saveVoter(voter);};

    chrome.extension.onRequest.addListener(onRequest);
    chrome.pageAction.onClicked.addListener(onClicked);
})();
