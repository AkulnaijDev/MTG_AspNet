
$(document).ready(function() {

    PopulateRuleset();
    PopulateGameModeExplanation();
});




//rules START
$('body').on('click', '.abilityPlusIcon', function () {
    $(this).parent().children(".abilityMinusIcon").show();
    $(this).parent().parent().children(".abilityDescription").show();
    $(this).hide();
})
$('body').on('click', '.abilityMinusIcon', function () {
    $(this).parent().children(".abilityPlusIcon").show();
    $(this).parent().parent().children(".abilityDescription").hide();
    $(this).hide();
});

$('body').on('click', '#mainMenuRules', function () {
    $('#rulesMenu').show();
});
$('body').on('click', '#closeRulesMenu', function () {
    $('#rulesMenu').hide();
    $('.abilityMinusIcon').trigger('click');
});

//rules END

// options START
$('body').on('click', '#mainMenuOptions', function () {
       $('#optionsMenu').show();
});

$('body').on('click', '#closeOptionsMenu', function () {
    $('#optionsMenu').hide();
});

$('body').on('change', '#myRange', function () {
    var chosenVolume = $(this).val()/100;
    document.getElementById('initialPageAudio').volume= chosenVolume;
    if(chosenVolume==0){
        $('#stopMusic').hide()
        $('#playMusic').show()
    } else {
        $('#stopMusic').show()
        $('#playMusic').hide()
    }
})

$('body').on('change', '#backgroundChooseOptions', function () {
    var desktop = $('#backgroundChooseOptions').val();
    if(desktop =="jace"){
        $('#mainMenu').css('background-image','url(../resources/Jace.jpg)')
    } else if(desktop =="nissa"){
        $('#mainMenu').css('background-image','url(../resources/Nissa.jpg)')
    } else if(desktop =="ajani"){
        $('#mainMenu').css('background-image','url(../resources/Ajani.jpg)')
    } else if(desktop =="liliana"){
        $('#mainMenu').css('background-image','url(../resources/Liliana.jpg)')
    } 
    else {
        $('#mainMenu').css('background-image','url(../resources/Chandra.jpg)')
    }
});

$('body').on('change', '#themeChooseOptions', function () {
    var theme = $('#themeChooseOptions').val();
    if(theme =="plain"){
        
    } else if(theme =="swamp"){

    } else if(theme =="forest"){

    } else if(theme =="island"){

    } 
    else {

    }
});

$('body').on('change', '#musicChooseOptions', function () {
    var music = $('#musicChooseOptions').val();
    var audio = document.getElementById('initialPageAudio')
    if(music =="A_Time_Forgotten"){
        audio.src = '../resources/A-Time-Forgotten.mp3'
    } else if(music =="Now-We-Ride"){
        audio.src = '../resources/Now-We-Ride.mp3'
    } else if(music =="Surreal-Forest"){
        audio.src = '../resources/Surreal-Forest.mp3'
    } else {
        audio.src = '../resources/InitialMusic.mp3'
    }
    audio.load();
    audio.play();
});


$('body').on('change', '#languageChooseOptions', function () {
    var language = $('#languageChooseOptions').val();
    if(language =="italian"){
        $('.translatedAbility').show();
        $('.defaultAbility').hide();

        $('#mainMenuNewGame').text("Nuova partita");
        $('#mainMenuMyDeck').text("Il mio mazzo");
        $('#mainMenuRules').text("Regole");
        $('#mainMenuOptions').text("Opzioni");

        $('#rulesTitle').text('Regole');
        $('#closeRulesMenu').text('Chiudi');

        $('.users_heading').text(" 🧙‍♀️ Utenti online 🧙 ");
        
        $('#optionsTitle').text('Opzioni');
        $('#optionsVolumeText').text('Volume:');
        $('#optionsSongText').text('Musica:');
        $('#optionsBackgroundText').text('Sfondo:');
        $('#optionsStyleText').text('Tema:');
        $('#optionsLanguageText').text('Lingua:');
        $('#closeOptionsMenu').text('Chiudi');
        
        $('#themeChooseOptions option[value="swamp"]').text('Palude');
        $('#themeChooseOptions option[value="mountain"]').text('Montagna');
        $('#themeChooseOptions option[value="forest"]').text('Foresta');
        $('#themeChooseOptions option[value="island"]').text('Isola');
        $('#themeChooseOptions option[value="plain"]').text('Pianura');

        $('#myDeckMenuBackButton').text('Torna al menu');
        $('#myDeckCardPreviewImageButton').text('Nascondi anteprima');
        $('#myDeckSaveButton').text('Salva mazzo');
        $('#myDeckDecksSelectorText').text('I miei mazzi');
        $('.myChatTextSenderInput').attr('placeholder','Dì qualcosa!');
        
        $('#myDeckAlert').text("Non puoi aggiungere altre copie di questa carta");
        $('#myDeckCreateNameText').text("Inserisci il nome del mazzo che vuoi creare");
        $('#myDeckCreateNameSaveButton').text("Salva");
        $('#myDeckCreateNameBackButton').text("Torna")
        $('#myDeckDeleteText').text("Sei sicuro di volerlo eliminare?")
        $('#myDeckDeleteConfirmButton').text("Elimina")
        $('#myDeckDeleteBackButton').text("Torna")

        $('#myDeckEditText').text("I tuoi cambiamenti sono stati salvati")
        $('#myDeckEditBackButton').text("Torna")

        $('#validValidity').text("Deck valido")
        $('#startTheGameButton').text("Inizia partita")
        $('#quitTheGameButton').text("Abbandona partita")
        $('#rulesGameButton').text("Controlla regole")
        
        $('#gameModesText').text("Modalità della partita")

        $('#inviteFriendsText').text("Invita un amico")
        $('#invitedFriendsText').text("Altri giocatori")
        $('#modeSelectionText').text("Seleziona modalità della partita")
        $('#deckSelectionText').text("Seleziona un mazzo")
        $('#backTheGameButton').text("Torna")
        $('#inviteError').text("Non è possibile mandare l'invito, non ci sono abbastanza giocatori o il deck non è compatibile con il formato scelto")

        $('#gameInvitationText1').text("Sei stato invitato ad una partita")
        $('#acceptGameInvitation').text("Accetta")
        $('#declineGameInvitation').text("Rifiuta")

        
        $('#beginTheGameButton').text("Inizia partita")
        $('#myDeckGameModeText').text("Modalità di gioco")
        $('#gameModeTitle').text("Modalità di gioco")
        $('#closeGameRulesMenu').text("Chiudi")
        
        $('#gameModeGameButton').text("Controlla modalità di gioco")

        // $('#commanderValidity').removeClass('commanderValidityEng').addClass('commanderValidityIta')


    } else {
        $('.translatedAbility').hide();
        $('.defaultAbility').show();

        $('#mainMenuNewGame').text("New game");
        $('#mainMenuMyDeck').text("My deck");
        $('#mainMenuRules').text("Rules");
        $('#mainMenuOptions').text("Options");

        $('#rulesTitle').text('Rules');
        $('#closeRulesMenu').text('Close');

        $('.users_heading').text(" 🧙‍♀️ Online Users 🧙 ");

        $('#optionsTitle').text('Options');
        $('#optionsVolumeText').text('Volume:');
        $('#optionsSongText').text('Music:');
        $('#optionsBackgroundText').text('Background:');
        $('#optionsStyleText').text('Style:');
        $('#optionsLanguageText').text('Language:');
        $('#closeOptionsMenu').text('Close');

        $('#themeChooseOptions option[value="swamp"]').text('Swamp');
        $('#themeChooseOptions option[value="mountain"]').text('Mountain');
        $('#themeChooseOptions option[value="forest"]').text('Forest');
        $('#themeChooseOptions option[value="island"]').text('Island');
        $('#themeChooseOptions option[value="plain"]').text('Plain');

        $('#myDeckMenuBackButton').text('Back to menu');
        $('#myDeckCardPreviewImageButton').text('Hide preview');
        $('#myDeckSaveButton').text('Save the deck');
        $('#myDeckDecksSelectorText').text('My decks');
        $('.myChatTextSenderInput').attr('placeholder','Say something!');

        $('#myDeckAlert').text("You can't add any more copy of this card!");
        $('#myDeckCreateNameText').text("Insert the name for your deck");
        $('#myDeckCreateNameSaveButton').text("Save");
        $('#myDeckCreateNameBackButton').text("Back");
        $('#myDeckDeleteText').text("Are you sure you want to delete?")
        $('#myDeckDeleteConfirmButton').text("Delete")
        $('#myDeckDeleteBackButton').text("Back")
        $('#myDeckEditText').text("Your changes have been saved")
        $('#myDeckEditBackButton').text("Back")

        $('#validValidity').text("Deck valid")
        $('#startTheGameButton').text("Start the game")
        $('#quitTheGameButton').text("Quit the game")
        $('#rulesGameButton').text("Check rules")

        $('#gameModesText').text("Game modes")

        $('#inviteFriendsText').text("Invite a friend")
        $('#invitedFriendsText').text("Other players")
        $('#modeSelectionText').text("Select a game mode")
        $('#deckSelectionText').text("Select a deck")
        $('#backTheGameButton').text("Back")
        $('#inviteError').text("Can't invite, not enough players or deck not valid for the selected game mode")

        
        $('#gameInvitationText1').text("You have been invited to a game")
        $('#acceptGameInvitation').text("Accept")
        $('#declineGameInvitation').text("Decline")

        $('#beginTheGameButton').text("Start the game")

        $('#myDeckGameModeText').text("Game Modes")
        $('#gameModeTitle').text("Game Modes")
        $('#closeGameRulesMenu').text("Close")
        $('#gameModeGameButton').text("Check game modes")


        // $('#commanderValidity').removeClass('commanderValidityIta').addClass('commanderValidityEng')

    }
});
//options END

function PopulateGameModeExplanation() {
    
    $.getJSON("./resources/gameruleset_ENG.json", function(data){
        data.Rules.forEach(rule => {
            
            var tmp = "<div class='singleAbility defaultAbility'>"+
                "<div class='abilityHeader'>"+
                    "<div class='gameModePlusIcon'>➕</div>"+
                    "<div class='gameModeMinusIcon'>➖</div>"+
                    "<div class='gameModeName myResponsiveTextSmall'>"+rule.Name+"</div>"+
                "</div>"+
                "<div class='gameModeDescription myResponsiveTextSmall'>"+rule.Description+"</div>"+
            "</div>"

            $('#gameModeList').append(tmp);
        });
    })

    $.getJSON("./resources/gameruleset_ITA.json", function(data){
        data.Rules.forEach(rule => {
            
            var tmp = "<div class='singleAbility translatedAbility'>"+
                "<div class='abilityHeader'>"+
                    "<div class='gameModePlusIcon'>➕</div>"+
                    "<div class='gameModeMinusIcon'>➖</div>"+
                    "<div class='gameModeName myResponsiveTextSmall'>"+rule.Name+"</div>"+
                "</div>"+
                "<div class='gameModeDescription myResponsiveTextSmall'>"+rule.Description+"</div>"+
            "</div>"

            $('#gameModeList').append(tmp);
        });
    })
}

function PopulateRuleset(){

    $.getJSON("./resources/ruleset_ENG.json", function(data){
        data.Rules.forEach(rule => {
            
            var tmp = "<div class='singleAbility defaultAbility'>"+
                "<div class='abilityHeader'>"+
                    "<div class='abilityPlusIcon'>➕</div>"+
                    "<div class='abilityMinusIcon'>➖</div>"+
                    "<div class='abilityName myResponsiveTextSmall'>"+rule.Name+"</div>"+
                "</div>"+
                "<div class='abilityDescription myResponsiveTextSmall'>"+rule.Description+"</div>"+
            "</div>"

            $('#rulesAbilitiesList').append(tmp);
        });
    })

    $.getJSON("./resources/ruleset_ITA.json", function(data){
        data.Rules.forEach(rule => {

            var tmp = "<div class='singleAbility translatedAbility'>"+
            "<div class='abilityHeader'>"+
                "<div class='abilityPlusIcon'>➕</div>"+
                "<div class='abilityMinusIcon'>➖</div>"+
                "<div class='abilityName myResponsiveTextSmall'>"+rule.Name+"</div>"+
            "</div>"+
            "<div class='abilityDescription myResponsiveTextSmall'>"+rule.Description+"</div>"+
        "</div>"

            $('#rulesAbilitiesList').append(tmp);
        });
    })
    
}