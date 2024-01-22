function allowDrop(ev) {
    ev.preventDefault();
  }
  
  function drag(ev) {
    ev.dataTransfer.setData("text", ev.currentTarget.attributes[0].nodeValue);
  }
  
  function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));

    //GESTISCI QUI L'UPDATE DI STATO!!!!!!! avanti e indietro!!!
  }


function DealCardToPlayer(indexPlayer, indexZone){
    state.PlayerStatuses[indexPlayer].Deck.forEach(card => {
        var cardSource = card.Source;
        var guid = guidCreator();
        var div = '<div id="'+guid+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="'+cardSource+'"></div>';
        $('.cardZone').eq(indexZone).append(div);
    })

    state.PlayerStatuses[indexPlayer].Hand.forEach(card => {
        var cardSource = card.Source;
        var guid = guidCreator();
        if(state.PlayerStatuses[indexPlayer].Name != myUsername){
            cardSource= "../resources/cardBack.jpg"
        }
        var div = '<div id="'+guid+'" draggable="true" ondragstart="drag(event)" class="cardContainer"><img class="cardOnTheTable" src="'+cardSource+'"></div>';
        $('.handZone').eq(indexZone).append(div);
    }) 

    var divName = '<div class="playerNameBoardContainer">'+ state.PlayerStatuses[indexPlayer].Name+'</div>';
    $('.playerNameZone').eq(indexZone).append(divName);
}

function DealInitialCards (){
    console.log(state);

    DealCardToPlayer(0, 0);
    DealCardToPlayer(1, 2); //così se si gioca in due stanno di fronte

    if(state.PlayerStatuses.length >= 3){
        DealCardToPlayer(2, 1);
    }
   
    if(state.PlayerStatuses.length == 4){
        DealCardToPlayer(3, 3);
    }
}

function DisplayDecks(){
    var deckCard = "<div class='cardContainer deckBackCardContainer'>"+
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