function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.currentTarget.attributes[0].nodeValue);
}

async function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");

    if(data!=null){
       
        
        var zoneTo = ev.target.className;

        var playerTo = $(ev.target).parent().parent().parent().find('.playerNameBoardContainer').text();
    
        if (zoneTo === 'cardOnTheTable') {
            playerTo = $(ev.target).parent().parent().parent().parent().find('.playerNameBoardContainer').text();
            zoneTo = $(ev.target).parent().parent()[0].className;;
        }
    
        var cardMoved = $('.cardContainer[id="'+data+'"]');
        
        var zoneFrom = cardMoved.parent()[0].className;
        var playerFrom = cardMoved.parent().parent().parent().find('.playerNameBoardContainer').text();
        
        var availableZones = ["cardZone","handZone","landZone","exiledZone","graveyardZone", "planeswalkerZone","commanderZone", "deckZone" ]
        
        if(!availableZones.includes(zoneTo) || !availableZones.includes(zoneFrom)){
            console.log("Unavailable drop zone");
        } 
        else 
        {
            $('#contextMenu').hide();
            $('#cardInGameContextMenu').hide();
    
            var action = {
                "Game": state.Game,
                "CardGuid": data,
                "From": {
                    "Player": playerFrom,
                    "Zone": zoneFrom
                },
                "To": {
                    "Player": playerTo,
                    "Zone": zoneTo
                }
            }
        
        
            if (zoneTo === 'cardOnTheTable') {
                var targetZone = $(ev.target).parent().parent();
                cardMoved.appendTo(targetZone);
            } else {
                ev.target.appendChild(document.getElementById(data));
            }
        
            var cardName = cardMoved.attr('name');

            if((zoneTo==='handZone' && zoneFrom==='handZone') || cardMoved.attr('morphed')){
                cardName = " ??? ";
            }

            await LogInGameNew("cardMoving", [myUsername, cardName, playerFrom, zoneFrom, playerTo, zoneTo]);
    
            await connection.invoke("UpdateState_CardPlayed", JSON.stringify(action)).catch(function (err) {
                return console.error(err.toString());
            });
        }

       
    }
}



async function DrawCardFromMyDeck(myUsername) {

    var zoneFrom = "deckZone";
    var playerFrom = myUsername;
    var zoneTo = "handZone";
    var playerTo = playerFrom;

    var action = {
        "Game": state.Game,
        "CardGuid": "",
        "From": {
            "Player": playerFrom,
            "Zone": zoneFrom
        },
        "To": {
            "Player": playerTo,
            "Zone": zoneTo
        }
    }

    await connection.invoke("UpdateState_CardDrawn", JSON.stringify(action)).catch(function (err) {
        return console.error(err.toString());
    });
}


async function UpdateBoard(newGameStatus) {
    try {
        var parsedGameStatus = JSON.parse(newGameStatus);
        console.log("Parsed game status:", parsedGameStatus); 

        parsedGameStatus.PlayerStatuses.forEach(element => {

            var parentBoard = $('.playerNameBoardContainer:contains(' + element.Name + ')').parent().parent().parent().parent();

            if (!parentBoard.length || parentBoard.length <1) {
                return;
            }

            var attributeCantSeeCard = false;

            // Card Zone
            parentBoard.find('.cardZone').empty();
            element.GameZone.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSourceImg = card.Source;

                console.log("Card in GameZone:", card);

                if (cardStatus.includes("Morphed")) {
                    cardSourceImg = "../resources/cardBack.jpg";
                }

                var counters = "counters='";
                (card.Counters || []).forEach(function(item) {
                    counters += (item.Quantity + ' _of_ ' + item.Type + ";");
                });
                counters += "'";

                var div = '<div id="' + card.Guid + '" ' + counters + ' ' + statusAttributes + ' cardId="' + card.CardId + '" seeOnlyBack="' + attributeCantSeeCard + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSourceImg + '"></div>';
                parentBoard.find('.cardZone').append(div);
            });

            // Hand Zone
            parentBoard.find('.handZone').empty();
            element.Hand.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSource = card.Source;

                if (element.Name != myUsername) {
                    cardSource = "../resources/cardBack.jpg";
                    attributeCantSeeCard = true;
                }

                console.log("Card in HandZone:", card);

                var div = '<div id="' + card.Guid + '" ' + statusAttributes + ' cardId="' + card.CardId + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
                parentBoard.find('.handZone').append(div);
            });

            // Land Zone
            parentBoard.find('.landZone').empty();
            element.LandZone.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSourceImg = card.Source;
                if (cardStatus.includes("Morphed")) {
                    cardSourceImg = "../resources/cardBack.jpg";
                }
                var counters = "counters='";
                (card.Counters || []).forEach(function(item) {
                    counters += (item.Quantity + ' _of_ ' + item.Type + ";");
                });
                counters += "'";

                console.log("Card in LandZone:", card);

                var div = '<div id="' + card.Guid + '" ' + counters + ' ' + statusAttributes + ' cardId="' + card.CardId + '" seeOnlyBack="' + attributeCantSeeCard + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSourceImg + '"></div>';
                parentBoard.find('.landZone').append(div);
            });

            // Exiled Zone
            parentBoard.find('.exiledZone').empty();
            element.Exiled.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSource = card.Source;

                console.log("Card in ExiledZone:", card);

                var div = '<div id="' + card.Guid + '" ' + statusAttributes + ' cardId="' + card.CardId + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
                parentBoard.find('.exiledZone').append(div);
            });

            // Graveyard Zone
            parentBoard.find('.graveyardZone').empty();
            element.Graveyard.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSource = card.Source;

                console.log("Card in GraveyardZone:", card);

                var div = '<div id="' + card.Guid + '" ' + statusAttributes + ' cardId="' + card.CardId + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
                parentBoard.find('.graveyardZone').append(div);
            });

            // Planeswalker Zone
            parentBoard.find('.planeswalkerZone').empty();
            element.PlaneswalkerZone.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSource = card.Source;

                console.log("Card in PlaneswalkerZone:", card);

                var div = '<div id="' + card.Guid + '" ' + statusAttributes + ' cardId="' + card.CardId + '" seeOnlyBack="' + attributeCantSeeCard + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
                parentBoard.find('.planeswalkerZone').append(div);
            });

            // Commander Zone
            parentBoard.find('.commanderZone').empty();
            element.CommanderZone.forEach(card => {
                var cardStatus = card.Statuses || [];
                var statusAttributes = cardStatus.map(status => status).join(" ");
                var cardSource = card.Source;

                console.log("Card in CommanderZone:", card);

                var div = '<div id="' + card.Guid + '" ' + statusAttributes + ' cardId="' + card.CardId + '" seeOnlyBack="' + attributeCantSeeCard + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
                parentBoard.find('.commanderZone').append(div);
            });

        });
    } catch (err) {
        console.error("Error updating board:", err);
    }
}



function DealCardToPlayer(indexPlayer, indexZone) {
    state.PlayerStatuses[indexPlayer].Hand.forEach(card => {
        var cardSource = card.Source;
        var untappable = true;

        if (state.PlayerStatuses[indexPlayer].Name != myUsername) {
            cardSource = "../resources/cardBack.jpg"
        }

        var div = '<div id="' + card.Guid + '" cardId="' + card.CardId + '" seeOnlyBack="' + untappable + '" source="' + card.Source + '" name="' + card.Name + '" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="' + cardSource + '"></div>';
        $('.handZone').eq(indexZone).append(div);
    })

    var divName = '<div class="playerNameBoardContainer">' + state.PlayerStatuses[indexPlayer].Name + '</div>';
    $('.playerNameZone').eq(indexZone).append(divName);
}

function DealInitialCards() {
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