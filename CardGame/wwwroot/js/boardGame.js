var iaminvited = false;

$('body').on('click', '#mainMenuNewGame', function () {
    $('#selectDeckToPlay').trigger('change')


    $('#inviteFriends option[value='+myConnectionId+']').remove()
    $('.gameValidities').removeAttr('disabled')

    if(!iaminvited){
        var defaultPlayer= "<div class='teammate defaultTeammate'><div class='teammateName'>"+myUsername+"</div></div>"
        $('.teammateContainer').eq(0).empty().append(defaultPlayer);
    }

    $('#startTheGameButton').attr('disabled',true)
    $('#backTheGameButton').attr('disabled',true)
    
    $('#boardGame').addClass('uninteractable');
    $('#gameMenuZone').addClass('uninteractable');
    $('#inviteSection').show();
    $('#boardGameContainer').show();
});

$('body').on('click', '#quitTheGameButton', function () {
    $('.teammateContainer').empty(); 
    ResetInviteScreen();
    $('#boardGameContainer').hide();
});

$('body').on('change', '#selectDeckToPlay', function () {
   var deckId = $('#selectDeckToPlay').find(":selected").val();
   if(deckId !=""){

    $('#startTheGameButton').attr('disabled',true)
    $('#backTheGameButton').attr('disabled',true)

    connection.invoke("VerifyGameModes", deckId,myUsername).catch(function (err) {
        return console.error(err.toString());
      });
   }
  
});

$('body').on('click', '#addFriendToGame', function () {
    var friendId = $('#inviteFriends').find(":selected").val();
    var friendName = $('#inviteFriends').find(":selected").text();

    if(friendName != "") {
        var div = "<div class='invitedFriendContainer' friendId='"+friendId+"'><div class='invitedFriendName'>"+friendName+"</div><div class='invitedFriendRemove'>Remove</div></div>"
        $('#invitedFriendsArea').append(div);
        $("#inviteFriends").find('[value="'+friendId+'"]').remove();

        var option = "<option value='"+friendId+"'>"+friendName+"</option>"
        $('.teamSelectPlayer').append(option)
    }
    
});

$('body').on('click', '.invitedFriendRemove', function () {
    var friendId = $(this).parent().attr('friendId');
    var friendName = $(this).parent().children('.invitedFriendName').text();

    $(this).parent().remove();
    var option = "<option value='"+friendId+"'>"+friendName+"</option>"
    $("#inviteFriends").append(option)

    $(".teamSelectPlayer").find('[value="'+friendId+'"]').remove();
    $('.teammateContainer').find('[teammateId="'+friendId+'"]').remove();
    
});


$('body').on('click', '.addPlayerToTeam', function () {
    var invitedPlayer = $('.teammateName').length;

    var playerId =  $(this).parent().children('.teamSelectPlayer').find(":selected").val();
    var playerName =$(this).parent().children('.teamSelectPlayer').find(":selected").text();
    var thisTeammateArea = $(this).parent().parent().children('.teammateContainer');
    if(playerName!=""){
        var player = '<div class="teammate" teammateId="'+playerId+'"><div class="teammateName">'+playerName+'</div><span class="removeFromTeam">➖</span></div>';
        $(thisTeammateArea).append(player);
        $(".teamSelectPlayer").find('[value="'+playerId+'"]').remove();    
    }

    if(invitedPlayer >= 3){
        $('.addPlayerToTeam').css('visibility','hidden')
    }   
});

$('body').on('click', '.removeFromTeam', function () {
    var invitedPlayer = $('.teammateName').length;

    if(invitedPlayer <= 4){
        var playerName =  $(this).parent().children('.teammateName').text();
        var playerId =$(this).parent().attr('teammateid');
        var option = "<option value='"+playerId+"'>"+playerName+"</option>"
        $(".teamSelectPlayer").append(option)
        $(this).parent().remove();
        $('.addPlayerToTeam').css('visibility','visible')
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

$('body').on('click', '#startTheGameButton', function () {
   
    var roomId =  $(this).attr('roomId')
    var myId = myConnectionId;
    var deckId = $('#selectDeckToPlay').val();

    if($(this).attr('invited')== 'true'){
      
        if(CheckDeckValidityForGameMode()){
             //send accepted game
             connection.invoke("AcceptGameInvitation", roomId, myId, myUsername, deckId).catch(function (err) {
                return console.error(err.toString());
              });
              
              $('#inviteSection').hide(); 
              $('#boardGame').removeClass('uninteractable');
              $('#gameMenuZone').removeClass('uninteractable');
  
              ClearFieldsInInvitationView();
        } 
        else {
            $('#inviteError').show().delay(2000).fadeOut();
        }

    } else {
        //you are creating the game
        if(CheckDeckValidityForGameMode()){
            SendGameInvitations();
            $('#inviteSection').hide(); 
            $('#boardGame').removeClass('uninteractable');
            $('#gameMenuZone').removeClass('uninteractable');
            
            ClearFieldsInInvitationView();
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

$('body').on('click', '#declineGameInvitation', function () {
    var invitingPlayerId = $(this).attr('invitingId');

    connection.invoke("RefuseGameInvitation", invitingPlayerId, myConnectionId).catch(function (err) {
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



$('body').on('click', '#beginTheGameButton', function () {
    var teams = GetTeams();
    connection.invoke("StartTheActualGame", myConnectionId, teams).catch(function (err) {
        return console.error(err.toString());
    });


});


var hoverTimeout;

$('body').on('mouseenter', '.cardOnTheTable', function () {
    var src = $(this).attr('src')
   
    hoverTimeout = setTimeout(function() {
        $('#zoomedHoveredCard').attr('src', src);
        console.log(src);
    }, 1000);
});

$('body').on('mouseleave', '.cardOnTheTable', function () {
    clearTimeout(hoverTimeout);
});

function GetTeams() {
    
    var teams = [];

    $('.teams').each(function() {
        var teamName = $(this).find('.teamTitle').text();
        var teammates = [];

        $(this).find('.player').each(function() {
            var playerId = $(this).find('.playerName').attr('playerid')
            var playerName = $(this).find('.playerName').text()

            var player = {
                "Id":playerId,
                "Name": playerName
            }

            teammates.push(player);
        });

        var team = {
            "TeamName":teamName,
            "Teammates" : teammates
        }

        teams.push(team);
     });

    var obj = {
        "Teams" : teams
    }

    return JSON.stringify(obj);
}   

//remove tippy library
// var commanderTippyEng = tippy('.commanderValidityEng', {content: '100cards'})
// var commanderTippyIta = tippy('.commanderValidityIta', {content: '100carte'})


connection.on("DisplayGameBoard", function (game) {

    var gameParsed = JSON.parse(game);

    if(gameParsed.Players.length >= 3){
        DisplayBoardForMoreThanTwoPlayers();
    } else {
        DisplayBoardForTwoPlayers();
    }

    gameParsed.Players[0].Deck.forEach(card => {
        var cardSource = card.Source;
        var div = '<div class="cardContainer"><img class="cardOnTheTable" src="'+cardSource+'"></div>';
        $('.cardZone').eq(0).append(div);
    })
    var divName = '<div class="playerNameBoardContainer">'+ gameParsed.Players[0].Name+'</div>';
    $('.playerNameZone').eq(0).append(divName);

    gameParsed.Players[1].Deck.forEach(card => {
        var cardSource = card.Source;
        var div = '<div class="cardContainer"><img class="cardOnTheTable" src="'+cardSource+'"></div>';
        $('.cardZone').eq(2).append(div);  //così se si gioca in due stanno di fronte
    })
    var divName = '<div class="playerNameBoardContainer">'+ gameParsed.Players[1].Name+'</div>';
    $('.playerNameZone').eq(2).append(divName);

   

    if(gameParsed.Players.length >= 3){
        gameParsed.Players[2].Deck.forEach(card => {
            var cardSource = card.Source;
            var div = '<div class="cardContainer"><img class="cardOnTheTable" src="'+cardSource+'"></div>';
            $('.cardZone').eq(1).append(div);
        })
        var divName = '<div class="playerNameBoardContainer">'+ gameParsed.Players[2].Name+'</div>';
        $('.playerNameZone').eq(1).append(divName);
    }
   
    if(gameParsed.Players.length == 4){
        gameParsed.Players[3].Deck.forEach(card => {
            var cardSource = card.Source;
            var div = '<div class="cardContainer"><img class="cardOnTheTable" src="'+cardSource+'"></div>';
            $('.cardZone').eq(3).append(div);
        })
        var divName = '<div class="playerNameBoardContainer">'+ gameParsed.Players[3].Name+'</div>';
        $('.playerNameZone').eq(3).append(divName);
    }
   
    //display cards for decks on back
    DisplayDecks();
})

function DisplayDecks(){
    var deckCard = "<div class='cardContainer deckBackCardContainer'>"+
    "<img class='deckBackCardOnTheTable' src='../resources/cardBack.jpg'></div>";

    $('.deckZone').append(deckCard);
}

function DisplayBoardForTwoPlayers (){
    $('.playerBoard').addClass('playerBoardExtended')
    $('.playerBoard').removeClass('playerBoard')
    $('#boardPlayer3').hide();
    $('#boardPlayer4').hide();
    $('#boardPlayer1').addClass('fullWidth')
    $('#boardPlayer2').addClass('fullWidth')
}

function DisplayBoardForMoreThanTwoPlayers (){
    $('.playerBoardExtended').addClass('playerBoard')
    $('.playerBoardExtended').removeClass('playerBoardExtended')
    $('#boardPlayer3').show();
    $('#boardPlayer4').show();
    $('#boardPlayer1').removeClass('fullWidth')
    $('#boardPlayer2').removeClass('fullWidth')
}

connection.on("GameModesForDeck", function (gameModes) {
    var gameModesParsed = JSON.parse(gameModes);
    console.log(gameModesParsed)
    
    var commander = gameModesParsed.Commander;
    var pauper = gameModesParsed.Pauper;
    var standard = gameModesParsed.Standard;
    var pioneer = gameModesParsed.Pioneer;
    var extended = gameModesParsed.Extended;
    var modern = gameModesParsed.Modern;
    var valid = gameModesParsed.Valid;

    $('#commanderValidity').attr('disabled',!commander)
    $('#pauperValidity').attr('disabled',!pauper)
    $('#standardValidity').attr('disabled',!standard)
    $('#pioneerValidity').attr('disabled',!pioneer)
    $('#extendedValidity').attr('disabled',!extended)
    $('#modernValidity').attr('disabled',!modern)
    $('#validValidity').attr('disabled',!valid)
    
    $('#startTheGameButton').removeAttr('disabled')
    $('#backTheGameButton').removeAttr('disabled')
    
})

connection.on("DisplayWhoIsInRoom", function(roomIEnteredIn){
    JSON.parse(roomIEnteredIn).Players.forEach(player => {
        ShowMeConnected(player.PlayerId);
    });

    var teamsWithAtLeastOnePlayer = 0
    $('.teams').each(function() {
       if($(this).find('.player').length>0){
            teamsWithAtLeastOnePlayer++;
       };
    });

    if(teamsWithAtLeastOnePlayer >=2){
        $('#beginTheGameButton').removeAttr('disabled')
    }
});

connection.on("SendRefusalGameInvitation", function( refusingPlayerId){
    var refusingPlayer = $('.onlineUserName[userId='+refusingPlayerId+']').text();
    var message = " has refused your invitation";
    if($('#languageChooseOptions').val()=="Italiano"){
        message = " ha rifiutato il tuo invito";
    }
    var refused= "<div class='refusingPlayerMessage'> "+refusingPlayer+message+" </div>"
    $('#notificationFromOtherPlayers').empty();
    $('#notificationFromOtherPlayers').append(refused).show().delay(2000).fadeOut();
});

//this arrives to inviter and invited players
connection.on("DisplayGameInvitation", function (gameInvitation) {
    var gameInvite = JSON.parse(gameInvitation);
    var invitingPlayer = $('.onlineUserName[userId='+gameInvite.InvitingId+']').text();
    $('#gameInvitationInviter').text(invitingPlayer);
    $('#gameInvitationMode').text(" - "+ gameInvite.GameMode);
    $('#gameInvitation').show();
    $('#declineGameInvitation').attr('invitingId',gameInvite.InvitingId)
    PopulateInvitationFields(gameInvitation);
    DisplayTeamWaiting(gameInvite.Teams);
})

function PopulateInvitationFields(gameInvitations){
    
    var gameInvitation = JSON.parse(gameInvitations)

    $('.friendRow').hide();
    $('#modeSelection').val(gameInvitation.GameMode).trigger('change').attr('disabled',true);
    $('.teamSelectPlayer').css('visibility','hidden');
    $('.addPlayerToTeam').css('visibility','hidden');
    $('.removeFromTeam').css('visibility','hidden');

    $('#startTheGameButton').attr('invited',true);
    $('#startTheGameButton').attr('roomId',gameInvitation.RoomId);

    $('.teamRow').eq(0).find('.teammateContainer').empty();
    $('.teamRow').eq(1).find('.teammateContainer').empty();
    $('.teamRow').eq(2).find('.teammateContainer').empty();
    $('.teamRow').eq(3).find('.teammateContainer').empty();

    var team = gameInvitation.Teams;

    team.forEach(element => {
        if(element.TeamName == "Team1"){
            element.Teammates.forEach( teammate => {
                var player = "<div class='teammate' teammateid='"+teammate.Id+"'><div class='teammateName'>"+teammate.Name+"</div></div>";
                $('.teamRow').eq(0).find('.teammateContainer').append(player);
            })
        }
        if(element.TeamName == "Team2"){
            element.Teammates.forEach( teammate => {
                var player = "<div class='teammate' teammateid='"+teammate.Id+"'><div class='teammateName'>"+teammate.Name+"</div></div>";
                $('.teamRow').eq(1).find('.teammateContainer').append(player);
            })
        }
        if(element.TeamName == "Team3"){
            element.Teammates.forEach( teammate => {
                var player = "<div class='teammate' teammateid='"+teammate.Id+"'><div class='teammateName'>"+teammate.Name+"</div></div>";
                $('.teamRow').eq(2).find('.teammateContainer').append(player);
            })
        }
        if(element.TeamName == "Team4"){
            element.Teammates.forEach( teammate => {
                var player = "<div class='teammate' teammateid='"+teammate.Id+"'><div class='teammateName'>"+teammate.Name+"</div></div>";
                $('.teamRow').eq(3).find('.teammateContainer').append(player);
            })
        }
    });

   

}

function ResetInviteScreen(){
    $('.friendRow').show();
    $('#modeSelection').removeAttr('disabled');
    $('.teamSelectPlayer').css('visibility','visible');
    $('.addPlayerToTeam').css('visibility','visible');
    $('.removeFromTeam').css('visibility','visible');
    
    $('#startTheGameButton').removeAttr('invited');

}

function SendGameInvitations(){
    var invitedId = [];
    var gameMode = $('#modeSelection').val();
    var teams = [];

    //team1
    var teammates= []
    $('.teamRow').eq(0).find('.teammateContainer').find('.teammate').each(function(){
        var id = $(this).attr('teammateid');
        if(id=="" || id == undefined){
            id = myConnectionId;
        }
        var name = $(this).children('.teammateName').text();
        var teammate = {"Id":id, "Name":name};
        teammates.push(teammate);
    })
    var team1 = {"TeamName":"Team1","Teammates":teammates}

     //team2
     var teammates= []
     $('.teamRow').eq(1).find('.teammateContainer').find('.teammate').each(function(){
         var id = $(this).attr('teammateid');
         if(id=="" || id == undefined){
             id = myConnectionId;
         }
         var name = $(this).children('.teammateName').text();
         var teammate = {"Id":id, "Name":name};
         teammates.push(teammate);
     })
     var team2 = {"TeamName":"Team2","Teammates":teammates}
      //team3
    var teammates= []
    $('.teamRow').eq(2).find('.teammateContainer').find('.teammate').each(function(){
        var id = $(this).attr('teammateid');
        if(id==""|| id == undefined){
            id = myConnectionId;
        }
        var name = $(this).children('.teammateName').text();
        var teammate = {"Id":id, "Name":name};
        teammates.push(teammate);
    })
    var team3 = {"TeamName":"Team3","Teammates":teammates}
     //team4
     var teammates= []
     $('.teamRow').eq(3).find('.teammateContainer').find('.teammate').each(function(){
         var id = $(this).attr('teammateid');
         if(id==""|| id == undefined){
             id = myConnectionId;
         }
         var name = $(this).children('.teammateName').text();
         var teammate = {"Id":id, "Name":name};
         teammates.push(teammate);
     })
     var team4 = {"TeamName":"Team4","Teammates":teammates}

    teams.push(team1);
    teams.push(team2);
    teams.push(team3);
    teams.push(team4);


    $('.invitedFriendContainer').each(function(){
        invitedId.push($(this).attr('friendid'));
    });

    var deckId = $('#selectDeckToPlay').val();

    var obj = {"InvitingId": myConnectionId, "InvitingPlayerName":myUsername, "DeckId":deckId, "InvitedIds":invitedId, "GameMode":gameMode, "Teams": teams,"RoomId":GuidGenerator(), "Rooms": null}
   
    connection.invoke("SendGameInvitation", JSON.stringify(obj)).catch(function (err) {
        return console.error(err.toString());
    });

    DisplayTeamWaiting(teams);
    ShowMeConnected(myConnectionId);
}


function ShowMeConnected(myId){
    $('.playerName[playerid="'+myId+'"]').removeAttr('disabled');
}

function DisplayTeamWaiting(teams){
    teams.forEach(team => {
        if(team.Teammates.length > 0){
            var teamName = "."+team.TeamName.toLowerCase();

            team.Teammates.forEach( teammate => {
                var teammateDiv = "<div class='player'><div disabled='disabled' playerid='"+teammate.Id+"' class='playerName'>"+teammate.Name+"</div><div class='playerHp'>20 HP</div></div>";
                
                if($(document).find('.playerName[playerid="'+teammate.Id+'"]').length == 0){
                    $(teamName).append(teammateDiv);
                }
               
            })
            
        }
    });
}

function CountHowManyTeamsWithAtLeastOnePlayer(){
    var playableTeams = 0;

    $('.teamRow').each(function() {
        if( $(this).find('.teammateName').text()!=""){
            playableTeams++;
        }
    });
    
    if(playableTeams>=2){
        return true;
    }
    return false;
}

function CheckDeckValidityForGameMode(){
    var chosenMode = $('#modeSelection').val();
    var validity = "#"+chosenMode.toLowerCase()+"Validity";
    var modeValidity = $(validity).attr('disabled')=='disabled';
    var deckValidity = $('#validValidity').attr('disabled')=='disabled';
    var atLeastTwoTeams = CountHowManyTeamsWithAtLeastOnePlayer();

    if(atLeastTwoTeams && !deckValidity && !modeValidity){
        return true;
    }
    return false;
}