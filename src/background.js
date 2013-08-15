;(function() {
    var BOARD = 'from vtmm',
        LIST = 'foobar',
        voter = {
            boardName: BOARD,
            listName: LIST
        };

    var setMovie = function(tab) {
        voter.movie = {
            name: tab.title,
            desc: tab.url
        };
    };

    var doAuthorize = function(stuff) {
        var dfd = new $.Deferred();

        if (!Trello.authorized()) {
            // only get token from localStorage
            Trello.authorize({ presist: true }, function() {
                dfd.resolve();
            }, function() {
                dfd.reject();
            });
        } else {
            dfd.resolve();
        }

        return dfd.promise();
    };

    var getUser = function() {
        var dfd = new $.Deferred();

        Trello.members.get('me')
            .done(function(user) {
                voter.user = {
                    id: user.id,
                    name: user.fullName,
                    idBoards: user.idBoards
                };
                dfd.resolve();
            })
            .fail(dfd.reject);

        return dfd.promise();
    };

    var getBoard = function() {
        var dfd = new $.Deferred();

        $.each(voter.user.idBoards, function(idx, id) {
            Trello.boards.get(id, {lists: 'open'}).done(function(board) {
                if (board.name === voter.boardName) {
                    voter.board = {
                        id: board.id,
                        name: board.name,
                        idLists: $.map(board.lists, function(e, i) {
                            return e.id;
                        })
                    };
                    dfd.resolve();
                }
            });
        });

        return dfd.promise();
    };

    var getList = function() {
        var dfd = new $.Deferred();

        $.each(voter.board.idLists, function(idx, id) {
            Trello.lists.get(id, {cards: 'open'}).done(function(list) {
                if (list.name === voter.listName) {
                    voter.list = {
                        id: list.id,
                        name: list.name,
                        cards: list.cards
                    };
                    dfd.resolve();
                }
            });
        });

        return dfd.promise();
    };

    var doVote = function() {
        var dfd = new $.Deferred(),
            voteCard = null,
            card;

        var vote = function(card) {     // subscribe to the card
            Trello.put('cards/' + card.id + '/idMembers',
                        { value: voter.user.id }, function(resp) {
                console.log(resp, voter);
            });
        };

        for (var i = 0;i < voter.list.cards;i++) {
            card = voter.list.cards[i];
            console.log(card);
            if (card.name === voter.movie.name) {
                voteCard = card;
                vote(card);
            }
        }

        if (!voteCard) {    // create it
            Trello.post('lists/' + voter.list.id + '/cards', voter.movie)
            .done(function(card) {
                vote(card);
            });
        }

        return dfd.promise();
    };

    var onRequest = function(req, sender, resp) {
        // show the icon
        chrome.pageAction.show(sender.tab.id);

        // store trello's token
        if (req.name === 'store') {
            localStorage.trello_token = req.value;
            resp({msg: 'token stored'});
        }
    };

    var onClicked = function(tab) {
        setMovie(tab);
        doAuthorize()
            .then(getUser)
            .then(getBoard)
            .then(getList)
            .then(doVote);
    };

    chrome.extension.onRequest.addListener(onRequest);
    chrome.pageAction.onClicked.addListener(onClicked);
})();
