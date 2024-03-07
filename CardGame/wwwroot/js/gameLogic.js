function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.currentTarget.attributes[0].nodeValue);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    
    var zoneTo = ev.target.className;
    var playerTo = $(ev.target).parent().parent().parent().find('.playerNameBoardContainer').text();

    var cardMoved = $('#'+ data);
    var zoneFrom = cardMoved.parent()[0].className;
    var playerFrom = cardMoved.parent().parent().parent().find('.playerNameBoardContainer').text();

    var action = {
        "Game":state.Game,
        "CardGuid":data,
        "From": {
            "Player":playerFrom,
            "Zone":zoneFrom
        },
        "To": {
            "Player":playerTo,
            "Zone":zoneTo
        }
    }

    ev.target.appendChild(document.getElementById(data));

    //GESTISCI QUI L'UPDATE DI STATO!!!!!!! avanti e indietro!!!
    
    connection.invoke("UpdateState_CardPlayed", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });
}

function DrawCardFromMyDeck(myUsername){
  
    var zoneFrom = "deckZone";
    var playerFrom = myUsername;
    var zoneTo = "handZone";
    var playerTo = playerFrom;

    var action = {
        "Game":state.Game,
        "CardGuid": "",
        "From": {
            "Player":playerFrom,
            "Zone":zoneFrom
        },
        "To": {
            "Player":playerTo,
            "Zone":zoneTo
        }
    }

    console.log("Porcodio");

    console.log(state);

    connection.invoke("UpdateState_CardDrawn", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });
}

function GetHp(playerName){
    var hp = 20;

    $('.teams > .player').each(function(index,element){
        var name = $(element).find('.playerName').text();
        var playerHp = $(element).find('.playerHp').text();

        if(playerName == name){
            hp = playerHp.replace(" HP", "");
        }
    })

    return hp;
}

function UpdateBoard(newGameStatus){

    JSON.parse(newGameStatus).PlayerStatuses.forEach(element => {
        var parentBoard = $('.playerNameBoardContainer:contains('+element.Name+')').parent().parent().parent().parent();
       
        parentBoard.find('.cardZone').empty();
        element.GameZone.forEach(card => {
            var cardSource = card.Source;
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.cardZone').append(div);
        })

        parentBoard.find('.handZone').empty();
        element.Hand.forEach(card => {
            var cardSource = card.Source;
            if (element.Name != myUsername) {
                cardSource = "../resources/cardBack.jpg"
            }
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.handZone').append(div);
        })

        parentBoard.find('.landZone').empty();
        element.LandZone.forEach(card => {
            var cardSource = card.Source;
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.landZone').append(div);
        })

        parentBoard.find('.exiledZone').empty();
        element.Exiled.forEach(card => {
            var cardSource = card.Source;
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.exiledZone').append(div);
        })

        parentBoard.find('.graveyardZone').empty();
        element.Graveyard.forEach(card => {
            var cardSource = card.Source;
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.graveyardZone').append(div);
        })

        parentBoard.find('.planeswalkerZone').empty();
        element.PlaneswalkerZone.forEach(card => {
            var cardSource = card.Source;
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.planeswalkerZone').append(div);
        })

        parentBoard.find('.commanderZone').empty();
        element.CommanderZone.forEach(card => {
            var cardSource = card.Source;
            var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
            parentBoard.find('.commanderZone').append(div);
        })

    });
   
}

//unused
function UpdateStateOldToRemove(){

    var playerStatuses = [];

    $('.playerBoardExtended').each(function(index,element){

        var playerName = $(element).find('.playerNameBoardContainer').text();

        var hp = GetHp(playerName);

        var deckZone = $(element).find('.deckZone > .cardContainer').map(function() {
            var obj = {
                "Guid": "fixme1",
                "CardId": "fixme1",
                "Source":"fixme1",
                "Name":"fixme1",
            }
            return obj;
        }).get();

        var planeswalkerZone = $(element).find('.planeswalkerZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();

        var commanderZone = $(element).find('.commanderZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();

        var handZone = $(element).find('.handZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();

        var landZone = $(element).find('.landZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();

        var cardZone = $(element).find('.cardZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();
        
        var graveyardZone = $(element).find('.graveyardZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();

        var exiledZone = $(element).find('.exiledZone > .cardContainer').map(function() {
            var obj = {
                "Guid": this.id,
                "CardId":this.attributes.cardId.value,
                "Source":this.attributes.source.value,
                "Name":this.attributes.name.value,
            }
            return obj;
        }).get();

        var playerState = {
            "Name" : playerName,
            "PlayerId" : "sistemami",
            "Hp": hp,
            "Hand" : handZone,
            "Deck" : deckZone,
            "Exiled" : exiledZone,
            "Graveyard" : graveyardZone,
            "LandZone" : landZone,
            "GameZone" : cardZone,
            "CommanderZone" : commanderZone,
            "PlaneswalkerZone" : planeswalkerZone
        }

        playerStatuses.push(playerState);

    });
    
    var stateToSend = {
        "Game" : state.Game,
        "PlayerStatuses" : playerStatuses
    }

    connection.invoke("UpdateStateFromGameBoard", stateToSend).catch(function (err) {
        return console.error(err.toString());
    });
}

function DealCardToPlayer(indexPlayer, indexZone) {

    //non devono essere distribuite le carte del deck
    // state.PlayerStatuses[indexPlayer].Deck.forEach(card => {
    //     var cardSource = card.Source;
    //     var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
    //     $('.cardZone').eq(indexZone).append(div);
    // })

    state.PlayerStatuses[indexPlayer].Hand.forEach(card => {
        var cardSource = card.Source;
        if (state.PlayerStatuses[indexPlayer].Name != myUsername) {
            cardSource = "../resources/cardBack.jpg"
        }
        var div = '<div id="' + card.Guid + '" cardId="'+card.CardId+'" source="'+card.Source+'" name="'+card.Name+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
        $('.handZone').eq(indexZone).append(div);
    })

    var divName = '<div class="playerNameBoardContainer">' + state.PlayerStatuses[indexPlayer].Name + '</div>';
    $('.playerNameZone').eq(indexZone).append(divName);
}

function DealInitialCards() {
    console.log(state);

    DealCardToPlayer(0, 0);
    DealCardToPlayer(1, 2); //così se si gioca in due stanno di fronte

    if (state.PlayerStatuses.length >= 3) {
        DealCardToPlayer(2, 1);
    }

    if (state.PlayerStatuses.length == 4) {
        DealCardToPlayer(3, 3);
    }
}

function DisplayDecks() {
    var deckCard = "<div class='cardContainer deckBackCardContainer'>" +
        "<img class='deckBackCardOnTheTable' src='../resources/cardBack.jpg'></div>";
    $('.deckZone').append(deckCard);
}





function guidCreator() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}