var iaminvited = false;
var state = null;

connection.on("DispatchLogGameEvent", function (log) {
    var json = JSON.parse(log);
    
    var text = json.Item1;
    if(!IsEnglishLanguageOn()){
        text = json.Item2;
    }

    var loggedElement = "<div class='loggedEvent'>" + text + "</div>"
    $('#notificationFromOtherPlayers').append(loggedElement);

    $('#notificationFromOtherPlayers').animate({
        scrollTop: $('#notificationFromOtherPlayers').get(0).scrollHeight
    }, 2000);

})

async function LogInGameNew(action, words) {
    await connection.invoke("LogGameEventsNew", action, JSON.stringify(words), JSON.stringify(state.Game)).catch(function (err) {
        return console.error(err.toString());
    });
}

$('body').on('click', '#mainMenuNewGame', function () {

    if (!$("#optionsMenu").is(':visible') && !$("#rulesMenu").is(':visible') && !$("#myDeckMenu").is(':visible')) {
        $('#selectDeckToPlay').trigger('change')
        $('#notificationFromOtherPlayers').empty();

        $('#inviteFriends option[value=' + myConnectionId + ']').remove()
        $('.gameValidities').removeAttr('disabled')

        if (!iaminvited) {
            var defaultPlayer = "<div class='teammate defaultTeammate'><div class='teammateName'>" + myUsername + "</div></div>"
            $('.teammateContainer').eq(0).empty().append(defaultPlayer);
        }

        $('#startTheGameButton').attr('disabled', true)
        $('#backTheGameButton').attr('disabled', true)

        $('#boardGame').addClass('uninteractable');
        $('#gameMenuZone').addClass('uninteractable');
        $('#inviteSection').show();
        $('#boardGameContainer').show();
    }
});

$('body').on('click', '#quitTheGameButton', async function () {
    $('.teammateContainer').empty();
    ResetInviteScreen();
    await connection.invoke("AbandonGame", myUsername).catch(function (err) {
        return console.error(err.toString());
    });
    $('#boardGameContainer').hide();
    $('#quitTheGameButton').attr('disabled',true)
});

$('body').on('change', '#selectDeckToPlay', async function () {
    var deckId = $('#selectDeckToPlay').find(":selected").val();
    if (deckId != "") {

        $('#startTheGameButton').attr('disabled', true)
        $('#backTheGameButton').attr('disabled', true)

        await connection.invoke("VerifyGameModes", deckId, myUsername).catch(function (err) {
            return console.error(err.toString());
        });
    }

});

$('body').on('click', '#addFriendToGame', function () {
    var friendId = $('#inviteFriends').find(":selected").val();
    var friendName = $('#inviteFriends').find(":selected").text();

    if (friendName != "") {
        var div = "<div class='invitedFriendContainer' friendId='" + friendId + "'><div class='invitedFriendName'>" + friendName + "</div><div class='invitedFriendRemove'>Remove</div></div>"
        $('#invitedFriendsArea').append(div);
        $("#inviteFriends").find('[value="' + friendId + '"]').remove();

        var option = "<option value='" + friendId + "'>" + friendName + "</option>"
        $('.teamSelectPlayer').append(option)
    }

});

$('body').on('click', '.invitedFriendRemove', function () {
    var friendId = $(this).parent().attr('friendId');
    var friendName = $(this).parent().children('.invitedFriendName').text();

    $(this).parent().remove();
    var option = "<option value='" + friendId + "'>" + friendName + "</option>"
    $("#inviteFriends").append(option)

    $(".teamSelectPlayer").find('[value="' + friendId + '"]').remove();
    $('.teammateContainer').find('[teammateId="' + friendId + '"]').remove();

});


$('body').on('click', '.addPlayerToTeam', function () {
    var invitedPlayer = $('.teammateName').length;

    var playerId = $(this).parent().children('.teamSelectPlayer').find(":selected").val();
    var playerName = $(this).parent().children('.teamSelectPlayer').find(":selected").text();
    var thisTeammateArea = $(this).parent().parent().children('.teammateContainer');
    if (playerName != "") {
        var player = '<div class="teammate" teammateId="' + playerId + '"><div class="teammateName">' + playerName + '</div><span class="removeFromTeam">➖</span></div>';
        $(thisTeammateArea).append(player);
        $(".teamSelectPlayer").find('[value="' + playerId + '"]').remove();
    }

    if (invitedPlayer >= 3) {
        $('.addPlayerToTeam').css('visibility', 'hidden')
    }
});

$('body').on('click', '.removeFromTeam', function () {
    var invitedPlayer = $('.teammateName').length;

    if (invitedPlayer <= 4) {
        var playerName = $(this).parent().children('.teammateName').text();
        var playerId = $(this).parent().attr('teammateid');
        var option = "<option value='" + playerId + "'>" + playerName + "</option>"
        $(".teamSelectPlayer").append(option)
        $(this).parent().remove();
        $('.addPlayerToTeam').css('visibility', 'visible')
    }


});

$('body').on('click', '#backTheGameButton', function () {
    $('#boardGameContainer').hide();
    ClearFieldsInInvitationView();
});

function ClearFieldsInInvitationView() {
    //reset selects with invited players
    $('.invitedFriendRemove').trigger('click')
    $('#modeSelection').val("commander").trigger('change')
}

$('body').on('click', '#startTheGameButton', async function () {

    var roomId = $(this).attr('roomId')
    var myId = myConnectionId;
    var deckId = $('#selectDeckToPlay').val();

    if ($(this).attr('invited') == 'true') {

        if (CheckDeckValidityForGameMode()) {
            //send accepted game
            await connection.invoke("AcceptGameInvitation", roomId, myId, myUsername, deckId).catch(function (err) {
                return console.error(err.toString());
            });

            $('#inviteSection').hide();
            // $('#boardGame').removeClass('uninteractable');
            $('#gameMenuZone').removeClass('uninteractable');

            ClearFieldsInInvitationView();
        }
        else {
            $('#inviteError').show().delay(2000).fadeOut();
        }

    } else {
        //you are creating the game
        if (CheckDeckValidityForGameMode()) {
            await SendGameInvitations();
            $('#inviteSection').hide();
            // $('#boardGame').removeClass('uninteractable');
            $('#gameMenuZone').removeClass('uninteractable');

            ClearFieldsInInvitationView();
            $('#quitTheGameButton').removeAttr('disabled')
        }
        else {
            $('#inviteError').show().delay(2000).fadeOut();
        }
    }



});


$('body').on('click', '#acceptGameInvitation', function () {
    $('#gameInvitation').hide();
    iaminvited = true;
    $('#mainMenuNewGame').trigger('click');
    $('.defaultTeammate').remove();
    //ricordati di resettare l'invite una volta in game
});

$('body').on('click', '#declineGameInvitation', async function () {
    var invitingPlayerId = $(this).attr('invitingId');

    await connection.invoke("RefuseGameInvitation", invitingPlayerId, myConnectionId).catch(function (err) {
        return console.error(err.toString());
    });

    $('#gameInvitation').hide();
});

$('body').on('click', '#rulesGameButton', function () {
    $('#rulesMenu').show();
});

$('body').on('click', '#gameModeGameButton', function () {
    $('#gameModeMenu').show();
});



$('body').on('click', '#beginTheGameButton', async function () {
    var teams = GetTeams();
    await connection.invoke("StartTheActualGame", myConnectionId, teams).catch(function (err) {
        return console.error(err.toString());
    });
});


var hoverTimeout;

$('body').on('mouseenter', '.cardOnTheTable', function () {
    var src = $(this).attr('src')

    hoverTimeout = setTimeout(function () {
        $('#zoomedHoveredCard').attr('src', src);
    }, 1000);
});

$('body').on('mouseleave', '.cardOnTheTable', function () {
    clearTimeout(hoverTimeout);
});


$('body').on('dblclick', '.deckBackCardOnTheTable', async function (ev) {
    var name = $(ev.target).parent().parent().parent().parent().find('.playerNameBoardContainer').text();
    if (myUsername == name) {
        await DrawCardFromMyDeck(myUsername);
        await LogInGameNew("drawingCard", [myUsername, name]);
    }
});



$('body').on('dblclick', '.cardContainer', async function () {
    var el = $(this);
    var seeBack = el.attr('seeonlyback');

    var cardId =  $(this).attr('id');
    var player = $('body').find('div[id="'+cardId+'"]').first()
    .closest('.playerBoardContainer')  // Supponendo che .playerContainer sia un parent comune contenente sia il div che il .playerNameBoardContainer
    .find('.playerNameBoardContainer')
    .text();
    
    var zoneTo = $(this).parent().attr('class');

    if (seeBack === "false") {
        if (!el.hasClass('deckBackCardContainer') && seeBack != "true") {
            if (el.attr('tapped') !== undefined) {
                //el.removeClass('tapped');

                await LogInGameNew("untappingCard", [myUsername, $(this).attr('name')]);

                var action = {
                    "Game": state.Game,
                    "CardGuid": cardId,
                    "TapUntap": "Untap",
                    "Player": player,
                    "Zone": zoneTo
                }

                await connection.invoke("TapCard", JSON.stringify(action)).catch(function (err) {
                    return console.error(err.toString());
                });

            } else {
                await LogInGameNew("tappingCard", [myUsername, $(this).attr('name')]);

                var action = {
                    "Game": state.Game,
                    "CardGuid": cardId,
                    "TapUntap": "Tap",
                    "Player": player,
                    "Zone": zoneTo
                }

                await connection.invoke("TapCard", JSON.stringify(action)).catch(function (err) {
                    return console.error(err.toString());
                });
            }
        }
    }
});

//sneaked card menu
$('body').on('contextmenu', '.cardContainerSneaked', function () {
    event.preventDefault();  //blocks opening console etc
    // var playerInspecting = myUsername
    // var playerInspected = $(this).parent().parent().find('.playerNameBoardContainer').text();
    $('#cardSneakedContextMenu').show();

    var cardId = $(event.target).parent().attr("id");
    var cardName = $(event.target).parent().attr("name");
    $('#cardSneakedContextMenu').attr('sneakedCardId', cardId);
    $('#cardSneakedContextMenu').attr('sneakedCardName', cardName);
});

$('body').on('click', '#closeCardSneakedContextMenu', function () {
    $('#cardSneakedContextMenu').hide();
});

$('body').on('click', '#contextCardSneakedToZoneButton', async function () {
    await PlayFromContext();
    $('#cardSneakedContextMenu').hide();
    $('#zoneInspector').hide();
    
});

async function PlayFromContext(){
    var zoneTo = $('#contextCardSneakedToZoneSelector').val();
    var cardId = $('#cardSneakedContextMenu').attr('sneakedCardId');

    var playerFrom = $('#contextMenu').attr('inspected');

    var playerToValue = $('#contextCardSneakedToZoneOwnerSelector').val();
    var playerTo = myUsername;

    if(playerToValue != "mine"){
        playerTo = $('#contextMenu').attr('owner');
    }

    var action = {
        "Game": state.Game,
        "CardGuid": cardId,
        "From": {
            "Player": playerFrom,
            "Zone": "deckZone"
        },
        "To": {
            "Player": playerTo,
            "Zone": zoneTo
        }
    }

    await connection.invoke("UpdateState_CardPlayedFromDeck", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });

   
    await LogInGameNew("cardFromDeck", [myUsername, playerFrom]);
}




//card in game context menu
$('body').on('contextmenu', '.cardContainer', function () {
   
    if ($(event.target).closest('.deckZone').length === 0) {
        // Se non è un discendente di .deckZone, procedi con l'handler
        event.preventDefault();  // Blocca l'apertura del menu contestuale
        var playerInspecting = myUsername;
        var playerInspected = $(this).parent().parent().find('.playerNameBoardContainer').text();
        $('#cardInGameContextMenu').show();

        var cardId = $(event.target).parent().attr("id");
        var cardName = $(event.target).parent().attr("name");
        var cardCounters = $(event.target).parent().attr("counters");
        
        $('#cardInGameContextMenu').attr('sneakedCardId', cardId);
        $('#cardInGameContextMenu').attr('sneakedCardName', cardName);

        $('#contextListOfAllCounters').empty();
        
        if(cardCounters!="" && cardCounters.trim() !== ""){
            var entries = cardCounters.split(';').filter(Boolean); // Usa filter(Boolean) per rimuovere stringhe vuote

            // Itera attraverso ogni parte dell'array
            entries.forEach(function(entry) {
                // Rimuovi eventuali spazi extra e dividi la stringa in base a '_of_'
                var parts = entry.trim().split('_of_');
                if (parts.length === 2) {
                    var quantity = parts[0].trim();
                    var type = parts[1].trim();
                    
                    // Crea un nuovo div con la quantità e la tipologia
                    var newSpan = '<div class="quantityTypeCounter">Quantity: ' + quantity + ', Type: ' + type + '</div>';
                    var newButton = '<div class="removeCounter" cardId='+cardId+' type="'+type+'"> Remove one counter</div>';
                    var newDiv = '<div class="quantityCounterContainer">'+newSpan+newButton +'</div>';
                    
                    // Aggiungi il nuovo div a #textone
                   
                    $('#contextListOfAllCounters').append(newDiv);
                }
            });
        }
        
    }
});

$('body').on('click', '.removeCounter', async function () {
    var cardId = $(this).attr('cardid');
    var type = $(this).attr('type');
    var fromZone = $('body').find('div[id="'+cardId+'"]').first().parent().attr('class');
   
    var playerFrom = $('body').find('div[id="'+cardId+'"]').first()
    .closest('.playerBoardContainer')  // Supponendo che .playerContainer sia un parent comune contenente sia il div che il .playerNameBoardContainer
    .find('.playerNameBoardContainer')
    .text();

    var action = {
        "Game": state.Game,
        "CardGuid": cardId,
        "Player":playerFrom,
        "Zone":fromZone,
        "Type": type
    }
    
    await connection.invoke("UpdateState_RemoveCounterFromCard", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });

    $('#cardInGameContextMenu').hide();
    $('#zoneInspector').hide();

});

$('body').on('click', '#closeCardInGameContextMenu', function () {
    $('#cardInGameContextMenu').hide();
});

$('body').on('click', '#contextCardGameMenuPlayMorphedButton', async function () {
    await ApplyActionToCard("Morphed");
    $('#cardInGameContextMenu').hide();
    $('#zoneInspector').hide();
});


$('body').on('click', '#contextCardGameMenuRotateButton',async function () {
    await ApplyActionToCard("Transformed");
    $('#cardInGameContextMenu').hide();
    $('#zoneInspector').hide();
});

$('body').on('click', '#contextCardGameMenuCountersButton', async function () {
    await ApplyActionToCard("CounterOnCard");
    $('#cardInGameContextMenu').hide();
    $('#zoneInspector').hide();
});

async function ApplyActionToCard(actionType){
    var cardId = $('#cardInGameContextMenu').attr('sneakedCardId');
    var cardName = $('#cardInGameContextMenu').attr('sneakedCardName');

    var fromZone = $('body').find('div[id="'+cardId+'"]').first().parent().attr('class');
   
    var playerFrom = $('body').find('div[id="'+cardId+'"]').first()
    .closest('.playerBoardContainer')  // Supponendo che .playerContainer sia un parent comune contenente sia il div che il .playerNameBoardContainer
    .find('.playerNameBoardContainer')
    .text();

    var counterType = $('#contextCardGameMenuCountersSelector').val();
    var counterQuantity = $('#contextCardGameMenuCountersQuantitySelector').val();

    var counters = {
        "Quantity": counterQuantity,
        "Type": counterType
    } 

    var action = {
        "Game": state.Game,
        "CardGuid": cardId,
        "Player": playerFrom,
        "Zone": fromZone,
        "Action": actionType,
        "Counters": [counters]
    }
    
    await connection.invoke("UpdateState_CardChangeStatusFromGame", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });

    if(actionType == "Transformed"){
        await LogInGameNew("transformedCard", [myUsername, cardName]);
    }
   
    if(actionType == "Morphed"){
        await LogInGameNew("morphedCard", [myUsername]);
    }

    if(actionType =="CounterOnCard" && (fromZone =="gameZone" || fromZone =="landZone")){
        await LogInGameNew("counterOnCard", [myUsername,counterType,cardName,counterQuantity ]);
    }
}


$('body').on('click', '#contextCardGameMenuToDeckButton', async function () {
    await CardBackToMyDeck();
    $('#cardInGameContextMenu').hide();
    $('#zoneInspector').hide();
});

async function CardBackToMyDeck(){
    var cardId = $('#cardInGameContextMenu').attr('sneakedCardId');

    var fromZone = $('body').find('div[id="'+cardId+'"]').first().parent().attr('class');
   
    var playerFrom = $('body').find('div[id="'+cardId+'"]').first()
    .closest('.playerBoardContainer')  // Supponendo che .playerContainer sia un parent comune contenente sia il div che il .playerNameBoardContainer
    .find('.playerNameBoardContainer')
    .text();

    var topOrBottom = $('#contextCardGameMenuToDeckSelector').val();

    var action = {
        "Game": state.Game,
        "CardGuid": cardId,
        "From": {
            "Player": playerFrom,
            "Zone": fromZone
        },
        "To": {
            "Player": myUsername,
            "Zone": "deckZone"
        },
        "TopBottom": topOrBottom
    }

    await connection.invoke("UpdateState_CardToDeckFromGame", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });


    await LogInGameNew("cardIntoDeck", [myUsername]);
}






















//menu context 
$('.deckZone').on('contextmenu', async function (event) {
    event.preventDefault();  //blocks opening console etc
    var playerInspecting = myUsername
    var playerInspected = $(this).parent().parent().find('.playerNameBoardContainer').text();
    $('#contextMenu').show();

    //popola select tokens
    if ($('#contextMenuTokenSelector').children().length === 0) {
        await connection.invoke("GetListOfAllTheTokens", JSON.stringify(state.Game)).catch(function (err) {
            return console.error(err.toString());
        });
    }

    $('#contextMenu').attr('inspected', playerInspected)
    $('#contextMenu').attr('inspecting', playerInspecting)
});

connection.on("ShowTokens", function (listOfTokens) {
    var json = JSON.parse(listOfTokens);
    if ($('#contextMenuTokenSelector').children().length === 0) {
        $('#contextMenuTokenSelector').empty();

        json.forEach(function (element) {
            var option = $('<option>', { value: JSON.stringify(element), text: element.Name });
            $('#contextMenuTokenSelector').append(option);
        });
    }
})

$('body').on('click', '#contextMenuPlayToken', async function () {

    var selectedToken = $('#contextMenuTokenSelector').val();
    var howManyToken = $('#contextMenuTokenQuantity').val();

    await connection.invoke("PlaySelectedToken", myUsername, selectedToken, howManyToken, JSON.stringify(state.Game)).catch(function (err) {
        return console.error(err.toString());
    });

});


$('body').on('click', '#contextMenuScryDeck', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent().parent();
    var playerInspecting = contextMenu.attr('inspecting');
    var playerInspected = contextMenu.attr('inspected');
    var howManyCards = $('#contextMenuScryCards').val();

    FillZoneInspectorWithCards(playerInspecting, playerInspected, howManyCards, "deck")
    $('#zoneInspector').show();

    await LogInGameNew("playerInspecting", [playerInspecting, playerInspected]);
});

$('body').on('click', '#contextMenuExileDeck', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent().parent();
    var targetPlayer = contextMenu.attr('inspecting');
    var playerInspected = contextMenu.attr('inspected');

    var howManyCards = $('#contextMenuExileCards').val();
    var whichAction = $('#contextMenuExileDiscardActionSelector').val();
    var fromTop = $('#contextMenuExileDeckSelector').val();

    if (targetPlayer == playerInspected) {
        await connection.invoke("ExileCardsFromPlayerDeck", targetPlayer, whichAction, howManyCards, fromTop, JSON.stringify(state.Game)).catch(function (err) {
            return console.error(err.toString());
        });

        if (IsEnglishLanguageOn()) {
            var actionText = " exiled ";
            if (whichAction == "discard") {
                actionText = " discarded "
            }
        } else {
            var actionText = " ha esiliato ";
            if (whichAction == "discard") {
                actionText = " ha scartato "
            }
        }

        await LogInGameNew("playerAction", [targetPlayer, actionText, howManyCards]);

    } else {
        await LogInGameNew("playerCantDoAction", [targetPlayer]);
    }

});

//this is so bad
function IsEnglishLanguageOn() {
    if ($('#rulesGameButton').text() == "Check rules") {
        return true;
    } else {
        return false;
    }
}

$('body').on('click', '#contextMenuShuffleDeck', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent();

    var targetPlayer = contextMenu.attr('inspected');

    await connection.invoke("ShufflePlayerDeck", targetPlayer, JSON.stringify(state.Game)).catch(function (err) {
        return console.error(err.toString());
    });

    await LogInGameNew("shuffleDeck", [playerInspecting, playerInspected]);
});



$('body').on('click', '#contextMenuViewDeck', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent();
    var playerInspecting = contextMenu.attr('inspecting');
    var playerInspected = contextMenu.attr('inspected');

    FillZoneInspectorWithCards(playerInspecting, playerInspected, "0", "deck")

    $('#zoneInspector').animate({
        scrollTop: $('#zoneInspector').get(0).scrollHeight
    }, 2000);

    $('#zoneInspector').show();

    await LogInGameNew("checkingDeck", [playerInspecting, playerInspected]);
});



$('body').on('click', '#contextMenuMulligan', async function () {
    var obj = {
        "Username": myUsername,
        "Game": state.Game
    }
    $('#contextMenu').hide();
    await connection.invoke("UpdateState_Mulligan", JSON.stringify(obj)).catch(function (err) {
        return console.error(err.toString());
    });

    await LogInGameNew("mulligan", [myUsername]);
});


$('body').on('click', '#contextMenuViewGraveyard', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent();
    var playerInspecting = contextMenu.attr('inspecting');
    var playerInspected = contextMenu.attr('inspected');

    FillZoneInspectorWithCards(playerInspecting, playerInspected, "0", "graveyard")
    $('#zoneInspector').show();

    await LogInGameNew("cemeteryLooking", [playerInspecting, playerInspected]);
});

$('body').on('click', '#contextMenuViewExiled', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent();
    var playerInspecting = contextMenu.attr('inspecting');
    var playerInspected = contextMenu.attr('inspected');

    FillZoneInspectorWithCards(playerInspecting, playerInspected, "0", "exiled")
    $('#zoneInspector').show();

    await LogInGameNew("exiledLooking", [playerInspecting, playerInspected]);
});

$('body').on('click', '#contextMenuViewHand', async function () {
    $('#contextMenu').hide();
    var contextMenu = $(this).parent().parent();
    var playerInspecting = contextMenu.attr('inspecting');
    var playerInspected = contextMenu.attr('inspected');

    await FillZoneInspectorWithCards(playerInspecting, playerInspected, "0", "hand")
    $('#zoneInspector').show();

    await LogInGameNew("handLooking", [playerInspecting, playerInspected]);
});


$('body').on('click', '#closeContextMenu', function () {
    $('#contextMenu').hide();
});

$('body').on('click', '#closeInspectorButton', function () {
    $('#zoneInspector').hide();
});

$('body').on('click', '.decreaseHpButton', async function () {
    var targetPlayer = $(this).parent().find('.playerName').text();
    await LogInGameNew("hpDecreasing", [myUsername, targetPlayer]);

    await connection.invoke("ModifyPlayerHp", targetPlayer, "decrease", JSON.stringify(state.Game)).catch(function (err) {
        return console.error(err.toString());
    });
});

$('body').on('click', '.increaseHpButton', async function () {
    var targetPlayer = $(this).parent().find('.playerName').text();
    await LogInGameNew("hpIncreasing", [myUsername, targetPlayer]);

    await connection.invoke("ModifyPlayerHp", targetPlayer, "increase", JSON.stringify(state.Game)).catch(function (err) {
        return console.error(err.toString());
    });
});

connection.on("DispatchPlayerHP", function (playerStatus) {
    var json = JSON.parse(playerStatus);
    var playerStatuses = json.PlayerStatuses;

    playerStatuses.forEach(status => {
        $('.player').each(function () {
            var playerName = $(this).find('.playerName').text().trim();

            if (playerName === status.Name) {
                $(this).find('.playerHp').text(status.Hp + " HP");
            }
        });
    });
})

connection.on("DispatchExiledCards", function (newGameState) {
    state = JSON.parse(newGameState);
    UpdateBoard(newGameState);
})


async function FillZoneInspectorWithCards(playerInspecting, playerInspected, howManyCards, inspectedZone,) {
    var game = state.Game;
    await connection.invoke("ShowMeCertainZone", playerInspecting, playerInspected, inspectedZone, howManyCards, JSON.stringify(game)).catch(function (err) {
        return console.error(err.toString());
    });
}

connection.on("ShowSneakedZone", function (sneakedZone) {
    $('#zoneInspectorCardContainer').empty();
    var json = JSON.parse(sneakedZone);
    json.forEach(el => {
        var sneakedCard = "<div id='" + el.Guid + "' cardId='" + el.CardId + "' source='" + el.Source + "' name='" + el.Name + "' class='cardContainerSneaked'>" +
            "<img class='cardOnTheTableSneaked' src='" + el.Source + "'>" +
            "</div>";
        $('#zoneInspectorCardContainer').append(sneakedCard);
    });
})



function GetTeams() {

    var teams = [];

    $('.teams').each(function () {
        var teamName = $(this).find('.teamTitle').text();
        var teammates = [];

        $(this).find('.player').each(function () {
            var playerId = $(this).find('.playerName').attr('playerid')
            var playerName = $(this).find('.playerName').text()

            var player = {
                "Id": playerId,
                "Name": playerName
            }

            teammates.push(player);
        });

        var team = {
            "TeamName": teamName,
            "Teammates": teammates
        }

        teams.push(team);
    });

    var obj = {
        "Teams": teams
    }

    return JSON.stringify(obj);
}

connection.on("SomeoneLeft",function (leavingPlayer){
    console.log("someoneleft -> "+ leavingPlayer);
});
connection.on("YouWon", function (leavingPlayer){
    $('.teammateContainer').empty();
    ResetInviteScreen();
    $('#boardGameContainer').hide();
});


function ResetBoard(){
    $('.deckZone').empty();
    $('.planeswalkerZone').empty();
    $('.commanderZone').empty();

    $('.handZone').empty();
    $('.landZone').empty();
    $('.cardZone').empty();

    $('.graveyardZone').empty();
    $('.exiledZone').empty();
    $('.playerNameZone').empty();
}

connection.on("DisplayGameBoard", function (gameState) {

    var gameStatus = JSON.parse(gameState);
    state = gameStatus;

    $('#boardGame').removeClass('uninteractable');
    
    ResetBoard();
    
    if (gameStatus.PlayerStatuses.length >= 3) {
        DisplayBoardForMoreThanTwoPlayers();
        if(gameStatus.PlayerStatuses <= 3){
            $('#boardPlayer4').find('.deckBackCardContainer').hide()
        }
    }
    else {
        DisplayBoardForTwoPlayers();
    }

    DealInitialCards();
    DisplayDecks();
    DisplayInitialHP(gameStatus.Game.GameMode);

    $('#beginTheGameButton').attr('disabled',true)
    $('#quitTheGameButton').removeAttr('disabled')
})


connection.on("UpdateGameBoard", function (newGameState) {
    state = JSON.parse(newGameState);
    UpdateBoard(newGameState);
})

function DisplayInitialHP(mode) {
    if (mode == "commander") {
        $('.playerHp').text('40 HP')
    }
}


function DisplayBoardForTwoPlayers() {
    $('.playerBoard').addClass('playerBoardExtended')
    $('.playerBoard').removeClass('playerBoard')
    $('#boardPlayer3').hide();
    $('#boardPlayer4').hide();
    $('#boardPlayer1').addClass('fullWidth')
    $('#boardPlayer2').addClass('fullWidth')
}

function DisplayBoardForMoreThanTwoPlayers() {
    $('.playerBoardExtended').addClass('playerBoard')
    $('.playerBoardExtended').removeClass('playerBoardExtended')
    $('#boardPlayer3').show();
    $('#boardPlayer4').show();
    $('#boardPlayer1').removeClass('fullWidth')
    $('#boardPlayer2').removeClass('fullWidth')
}

connection.on("GameModesForDeck", function (gameModes) {
    var gameModesParsed = JSON.parse(gameModes);

    var commander = gameModesParsed.Commander;
    var pauper = gameModesParsed.Pauper;
    var standard = gameModesParsed.Standard;
    var pioneer = gameModesParsed.Pioneer;
    var extended = gameModesParsed.Extended;
    var modern = gameModesParsed.Modern;
    var valid = gameModesParsed.Valid;

    if(!valid){
        $('#commanderValidity').attr('disabled', true)
        $('#pauperValidity').attr('disabled', true)
        $('#standardValidity').attr('disabled', true)
        $('#pioneerValidity').attr('disabled', true)
        $('#extendedValidity').attr('disabled', true)
        $('#modernValidity').attr('disabled', true)
    } 
    else {
        $('#commanderValidity').attr('disabled', !commander)
        $('#pauperValidity').attr('disabled', !pauper)
        $('#standardValidity').attr('disabled', !standard)
        $('#pioneerValidity').attr('disabled', !pioneer)
        $('#extendedValidity').attr('disabled', !extended)
        $('#modernValidity').attr('disabled', !modern)
    }

    $('#validValidity').attr('disabled', !valid)

    $('#startTheGameButton').removeAttr('disabled')
    $('#backTheGameButton').removeAttr('disabled')

})

connection.on("DisplayWhoIsInRoom", function (roomIEnteredIn) {
    JSON.parse(roomIEnteredIn).Players.forEach(player => {
        ShowMeConnected(player.PlayerId);
    });

    var teamsWithAtLeastOnePlayer = 0
    $('.teams').each(function () {
        if ($(this).find('.player').length > 0) {
            teamsWithAtLeastOnePlayer++;
        };
    });

    if (teamsWithAtLeastOnePlayer >= 2) {
        $('#beginTheGameButton').removeAttr('disabled')
    }
});

connection.on("SendRefusalGameInvitation", function (refusingPlayerId) {
    var refusingPlayer = $('.onlineUserName[userId=' + refusingPlayerId + ']').text();
    var message = " has refused your invitation";
    if ($('#languageChooseOptions').val() == "Italiano") {
        message = " ha rifiutato il tuo invito";
    }
    var refused = "<div class='refusingPlayerMessage'> " + refusingPlayer + message + " </div>"
    $('#notificationFromOtherPlayers').empty();
    $('#notificationFromOtherPlayers').append(refused).show().delay(2000).fadeOut();
});

//this arrives to inviter and invited players
connection.on("DisplayGameInvitation", function (gameInvitation) {
    var gameInvite = JSON.parse(gameInvitation);
    var invitingPlayer = $('.onlineUserName[userId=' + gameInvite.InvitingId + ']').text();
    $('#gameInvitationInviter').text(invitingPlayer);
    $('#gameInvitationMode').text(" - " + gameInvite.GameMode);
    $('#gameInvitation').show();
    $('#declineGameInvitation').attr('invitingId', gameInvite.InvitingId)
    PopulateInvitationFields(gameInvitation);
    DisplayTeamWaiting(gameInvite.Teams);
})

function PopulateInvitationFields(gameInvitations) {

    var gameInvitation = JSON.parse(gameInvitations)

    $('.friendRow').hide();
    $('#modeSelection').val(gameInvitation.GameMode).trigger('change').attr('disabled', true);
    $('.teamSelectPlayer').css('visibility', 'hidden');
    $('.addPlayerToTeam').css('visibility', 'hidden');
    $('.removeFromTeam').css('visibility', 'hidden');

    $('#startTheGameButton').attr('invited', true);
    $('#startTheGameButton').attr('roomId', gameInvitation.RoomId);

    $('.teamRow').eq(0).find('.teammateContainer').empty();
    $('.teamRow').eq(1).find('.teammateContainer').empty();
    $('.teamRow').eq(2).find('.teammateContainer').empty();
    $('.teamRow').eq(3).find('.teammateContainer').empty();

    var team = gameInvitation.Teams;

    team.forEach(element => {
        if (element.TeamName == "Team1") {
            element.Teammates.forEach(teammate => {
                var player = "<div class='teammate' teammateid='" + teammate.Id + "'><div class='teammateName'>" + teammate.Name + "</div></div>";
                $('.teamRow').eq(0).find('.teammateContainer').append(player);
            })
        }
        if (element.TeamName == "Team2") {
            element.Teammates.forEach(teammate => {
                var player = "<div class='teammate' teammateid='" + teammate.Id + "'><div class='teammateName'>" + teammate.Name + "</div></div>";
                $('.teamRow').eq(1).find('.teammateContainer').append(player);
            })
        }
        if (element.TeamName == "Team3") {
            element.Teammates.forEach(teammate => {
                var player = "<div class='teammate' teammateid='" + teammate.Id + "'><div class='teammateName'>" + teammate.Name + "</div></div>";
                $('.teamRow').eq(2).find('.teammateContainer').append(player);
            })
        }
        if (element.TeamName == "Team4") {
            element.Teammates.forEach(teammate => {
                var player = "<div class='teammate' teammateid='" + teammate.Id + "'><div class='teammateName'>" + teammate.Name + "</div></div>";
                $('.teamRow').eq(3).find('.teammateContainer').append(player);
            })
        }
    });
}

function ResetInviteScreen() {
    $('.friendRow').show();
    $('#modeSelection').removeAttr('disabled');
    $('.teamSelectPlayer').css('visibility', 'visible');
    $('.addPlayerToTeam').css('visibility', 'visible');
    $('.removeFromTeam').css('visibility', 'visible');

    $('#startTheGameButton').removeAttr('invited');

}

async function SendGameInvitations() {
    var invitedId = [];
    var gameMode = $('#modeSelection').val();
    var teams = [];

    //team1
    var teammates = []
    $('.teamRow').eq(0).find('.teammateContainer').find('.teammate').each(function () {
        var id = $(this).attr('teammateid');
        if (id == "" || id == undefined) {
            id = myConnectionId;
        }
        var name = $(this).children('.teammateName').text();
        var teammate = { "Id": id, "Name": name };
        teammates.push(teammate);
    })
    var team1 = { "TeamName": "Team1", "Teammates": teammates }

    //team2
    var teammates = []
    $('.teamRow').eq(1).find('.teammateContainer').find('.teammate').each(function () {
        var id = $(this).attr('teammateid');
        if (id == "" || id == undefined) {
            id = myConnectionId;
        }
        var name = $(this).children('.teammateName').text();
        var teammate = { "Id": id, "Name": name };
        teammates.push(teammate);
    })
    var team2 = { "TeamName": "Team2", "Teammates": teammates }
    //team3
    var teammates = []
    $('.teamRow').eq(2).find('.teammateContainer').find('.teammate').each(function () {
        var id = $(this).attr('teammateid');
        if (id == "" || id == undefined) {
            id = myConnectionId;
        }
        var name = $(this).children('.teammateName').text();
        var teammate = { "Id": id, "Name": name };
        teammates.push(teammate);
    })
    var team3 = { "TeamName": "Team3", "Teammates": teammates }
    //team4
    var teammates = []
    $('.teamRow').eq(3).find('.teammateContainer').find('.teammate').each(function () {
        var id = $(this).attr('teammateid');
        if (id == "" || id == undefined) {
            id = myConnectionId;
        }
        var name = $(this).children('.teammateName').text();
        var teammate = { "Id": id, "Name": name };
        teammates.push(teammate);
    })
    var team4 = { "TeamName": "Team4", "Teammates": teammates }

    teams.push(team1);
    teams.push(team2);
    teams.push(team3);
    teams.push(team4);


    $('.invitedFriendContainer').each(function () {
        invitedId.push($(this).attr('friendid'));
    });

    var deckId = $('#selectDeckToPlay').val();

    var obj = { "InvitingId": myConnectionId, "InvitingPlayerName": myUsername, "DeckId": deckId, "InvitedIds": invitedId, "GameMode": gameMode, "Teams": teams, "RoomId": GuidGenerator(), "Rooms": null }

    await connection.invoke("SendGameInvitation", JSON.stringify(obj)).catch(function (err) {
        return console.error(err.toString());
    });

    DisplayTeamWaiting(teams);
    ShowMeConnected(myConnectionId);
}


function ShowMeConnected(myId) {
    $('.playerName[playerid="' + myId + '"]').removeAttr('disabled');
}

function DisplayTeamWaiting(teams) {
    teams.forEach(team => {
        if (team.Teammates.length > 0) {
            var teamName = "." + team.TeamName.toLowerCase();

            team.Teammates.forEach(teammate => {
                var teammateDiv = "<div class='player row'>" +
                    "<div disabled='disabled' playerid='" + teammate.Id + "' class='col-4 col-md-4 playerName'>" + teammate.Name + "</div>" +
                    "<button class='col-2 col-md-2 decreaseHpButton' playerid='" + teammate.Id + "'>-</button>" +
                    "<div class='playerHp col-4 col-md-4'>20 HP</div>" +
                    "<button class='increaseHpButton col-2 col-md-2' playerid='" + teammate.Id + "'>+</button>" +
                    "</div>";

                if ($(document).find('.playerName[playerid="' + teammate.Id + '"]').length == 0) {
                    $(teamName).append(teammateDiv);
                }

            })

        }
    });
}

function CountHowManyTeamsWithAtLeastOnePlayer() {
    var playableTeams = 0;

    $('.teamRow').each(function () {
        if ($(this).find('.teammateName').text() != "") {
            playableTeams++;
        }
    });

    if (playableTeams >= 2) {
        return true;
    }
    return false;
}

function CheckDeckValidityForGameMode() {
    var chosenMode = $('#modeSelection').val();
    var validity = "#" + chosenMode.toLowerCase() + "Validity";
    var modeValidity = $(validity).attr('disabled') == 'disabled';
    var deckValidity = $('#validValidity').attr('disabled') == 'disabled';
    var atLeastTwoTeams = CountHowManyTeamsWithAtLeastOnePlayer();


    if (atLeastTwoTeams && !deckValidity && !modeValidity) {
        return true;
    }
    return false;
}