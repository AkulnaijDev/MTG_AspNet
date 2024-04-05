
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
    if(!$("#optionsMenu").is(':visible') && !$("#myDeckMenu").is(':visible') && !$("#gameModeMenu").is(':visible')){
        $('#rulesMenu').show();
    }   
});

$('body').on('click', '#closeRulesMenu', function () {
    $('#rulesMenu').hide();
    $('.abilityMinusIcon').trigger('click');
});

//rules END

// options START
$('body').on('click', '#mainMenuOptions', function () {
    if(!$("#rulesMenu").is(':visible') && !$("#myDeckMenu").is(':visible') && !$("#gameModeMenu").is(':visible')){
        $('#optionsMenu').show();
    }
});


$('body').on('click', '#closeOptionsMenu', function () {
    var desktop = $('#backgroundChooseOptions').val();
    var theme = $('#themeChooseOptions').val();
    var music = $('#musicChooseOptions').val();
    var chosenVolume = $('#myRange').val()
    var language = $('#languageChooseOptions').val();
    var myId = myConnectionId;

    connection.invoke("SaveMySettings",myId, myUsername,chosenVolume,desktop,theme,language,music ).catch(function (err) {
        return console.error(err.toString());
      });

    $('#optionsMenu').hide();

});

connection.on("ConfirmSavedSettings", function (result) {
    console.log("Settings update:"+ result)  //add a spinner o
})

connection.on("SendSearchedCards", function (result) {
    $('#myDeckCardPickerContainer').empty();
    $('#myDeckAdvancedSearch input').val('');
    $('#myDeckAdvancedSearch input').prop('checked', false);
    $("#myDeckAdvancedSearch select").each(function() {
        $(this).find("option:first").prop("selected", true);
        $(this).find("option:not(:first)").prop("selected", false);
    });
    showCardsImage(JSON.parse(result))

    $('#advancedSearchSpinner').hide();
    $('#myDeckAdvancedSearch').hide();
})

connection.on("SendNormalSearchCards", function (result) {
    $('#myDeckCardPickerContainer').empty();
    $('#myDeckDecksNormalSearchValue').val('');
    $('#normalSearchSpinner').hide();
    showCardsImage(JSON.parse(result))
})



$('body').on('click', '#myDeckDecksSearchButton', function () {
    $('#myDeckSetPickerSelector').val('')
    $('#myDeckAdvancedSearch').show()
})

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
    if(theme =="default"){
        document.documentElement.style.setProperty('--option_Background_color', 'darkslategray');
        document.documentElement.style.setProperty('--option_Text_hover', '#bb240a');
    } 
    else if(theme =="plain"){
        document.documentElement.style.setProperty('--option_Background_color', '#a8a880');
        document.documentElement.style.setProperty('--option_Text_hover', '#969656');
    } 
    else if(theme =="mountain"){
        document.documentElement.style.setProperty('--option_Background_color', '#720800');
        document.documentElement.style.setProperty('--option_Text_hover', '#bb240a');
    } 
    else if(theme =="forest"){
        document.documentElement.style.setProperty('--option_Background_color', '#066224');
        document.documentElement.style.setProperty('--option_Text_hover', '#023412');
    } 
    else if(theme =="island"){
        document.documentElement.style.setProperty('--option_Background_color', '#3a3ad0');
        document.documentElement.style.setProperty('--option_Text_hover', '#1d1d72');
    } 
    else {
        document.documentElement.style.setProperty('--option_Background_color', '#4a2f4a');
        document.documentElement.style.setProperty('--option_Text_hover', '#5a025a');
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


$('body').on('click', '#advancedSearchTypeColorColorless', function () {
    $(".advancedSearchTypeColorUncheck1").prop("checked", false);
});
$('body').on('click', '.advancedSearchTypeColorUncheck1', function () {
    $("#advancedSearchTypeColorColorless").prop("checked", false);
});

$('body').on('click', '#advancedSearchCommanderColorColorless', function () {
    $(".advancedSearchCommanderColorUncheck1").prop("checked", false);
});
$('body').on('click', '.advancedSearchCommanderColorUncheck1', function () {
    $("#advancedSearchCommanderColorColorless").prop("checked", false);
});

$('body').on('click', '#myDeckAdvancedSearchCloseButton', function () {
    $('#myDeckAdvancedSearch').hide();
    $('#myDeckAdvancedSearch input').val('');
    $('#myDeckAdvancedSearch input').prop('checked', false);
    $("#myDeckAdvancedSearch select").each(function() {
        $(this).find("option:first").prop("selected", true);
        $(this).find("option:not(:first)").prop("selected", false);
    });
});

$('body').on('click', '#myDeckDecksNormalSearchButton', function () {
    $('#normalSearchSpinner').show();
    var name = $('#myDeckDecksNormalSearchValue').val();
    connection.invoke("NormalSearchCards", name).catch(function (err) {
        return console.error(err.toString());
    });
});

$('body').on('click', '#myDeckAdvancedSearchSearchButton', function () {

    var searchObject = {
        name : $('#advancedSearchName').val(),
        text : $('#advancedSearchText').val(),
        type : $('#advancedSearchTypeLine').val(),
        sets : $('#myDeckSetPickerSelector').val(),
        colorWhite : $('#advancedSearchTypeColorWhite').is(':checked'),
        colorBlue : $('#advancedSearchTypeColorBlue').is(':checked'),
        colorBlack : $('#advancedSearchTypeColorBlack').is(':checked'),
        colorRed : $('#advancedSearchTypeColorRed').is(':checked'),
        colorGreen : $('#advancedSearchTypeColorGreen').is(':checked'),
        colorColorless : $('#advancedSearchTypeColorColorless').is(':checked'),
        colorValue : $('#advancedSearchStatsValueType').val(),
        commanderColorWhite : $('#advancedSearchCommanderColorWhite').is(':checked'),
        commanderColorBlue : $('#advancedSearchCommanderColorBlue').is(':checked'),
        commanderColorBlack : $('#advancedSearchCommanderColorBlack').is(':checked'),
        commanderColorRed : $('#advancedSearchCommanderColorRed').is(':checked'),
        commanderColorGreen : $('#advancedSearchCommanderColorGreen').is(':checked'),
        commanderColorColorless : $('#advancedSearchCommanderColorColorless').is(':checked'),
        manaCost : $('#advancedSearchCmC').val(),

        valueType : $('#advancedSearchStatsValueStats').val(),
        valueEqual : $('#advancedSearchStatsValueEqual').val(),
        valueAmount : $('#advancedSearchStatsValueAmount').val(),

        rarityCommon : $('#advancedSearchRarityCommonInput').is(':checked'),
        rarityUncommon : $('#advancedSearchRarityUncommonInput').is(':checked'),
        rarityRare : $('#advancedSearchRarityRareInput').is(':checked'),
        rarityMythic : $('#advancedSearchRarityMythicInput').is(':checked'),

        singleton : $('#advancedSearchOnePerIdValue').is(':checked'),
        flavorText : $('#advancedSearchFlavorText').val()
    }
    
    console.log(searchObject);
    $('#advancedSearchSpinner').show();

    connection.invoke("AdvancedSearchCards", JSON.stringify(searchObject)).catch(function (err) {
        $('#advancedSearchSpinner').hide();
        $('#advancedSearchError').show().delay(2000).fadeOut();
        return console.error(err.toString());
      });

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
       
        $('#myDeckDecksNormalSearchValue').attr("placeholder", "Cerca per nome");
        $('#myDeckDecksNormalSearchButton').text("Cerca")
        $('#myDeckDecksSearchButton').text("Ricerca avanzata")

        $('#advancedSearchFieldName').text("Nome carta")
        $("#advancedSearchName").attr("placeholder", "Qualsiasi parola nel nome, es 'Fire'");
        $('#advancedSearchFieldText').text("Testo")
        $("#advancedSearchText").attr("placeholder", "Qualsiasi parola nel testo, es 'Draw a cards'");
        $('#advancedSearchFieldTypeLine').text("Tipo")
        $("#advancedSearchTypeLine").attr("placeholder", "Qualsiasi sottotipo, es 'Instant, 'Goblin'");
        $('#myDeckSetPickerSelectorText').text("Tieni premuto Ctrl (Windows) o Command (Mac) per selezionare più set.")
        $('#advancedSearchTypeColorWhiteText').text("Bianco")
        $('#advancedSearchTypeColorBlueText').text("Blu")
        $('#advancedSearchTypeColorBlackText').text("Nero")
        $('#advancedSearchTypeColorRedText').text("Rosso")
        $('#advancedSearchTypeColorGreenText').text("Verde")
        $('#advancedSearchTypeColorColorlessText').text("Incolore")
        $("#advancedSearchStatsValueType option[value='exact']").text("Esattamente questi colori");
        $("#advancedSearchStatsValueType option[value='including']").text("Include questi colori");
        $("#advancedSearchStatsValueType option[value='atMost']").text("Al massimo questi colori");
        $('#advancedSearchCmC').attr("placeholder", "Qualsiasi simbolo di mana, es '{W}{W}'");
        $('#advancedSearchFieldCmC').text("Costo di mana")
        $('#advancedSearchStats').text("Statistiche")
        $("#advancedSearchStatsValueStats option[value='power']").text("Forza");
        $("#advancedSearchStatsValueStats option[value='toughness']").text("Costituzione");
        $("#advancedSearchStatsValueStats option[value='loyalty']").text("Fedeltà");
        $("#advancedSearchStatsValueEqual option[value='1']").text("Uguale a");
        $("#advancedSearchStatsValueEqual option[value='2']").text("Minore di");
        $("#advancedSearchStatsValueEqual option[value='3']").text("Maggiore di");
        $("#advancedSearchStatsValueEqual option[value='4']").text("Minore di o uguale a");
        $("#advancedSearchStatsValueEqual option[value='5']").text("Maggiore di o uguale a");
        $("#advancedSearchStatsValueEqual option[value='6']").text("Diverso da");
        $("#advancedSearchStatsValueAmount").attr("placeholder", "Qualsiasi valore, es'2'");
        $('#advancedSearchRarity').text("Rarità")
        $('#advancedSearchRarityCommon').text("Comune")
        $('#advancedSearchRarityUncommon').text("Non comune")
        $('#advancedSearchRarityRare').text("Rara")
        $('#advancedSearchRarityMythic').text("Mitica")
        $('#advancedSearchOnePerIdText').text("Id Unico")
        $('#advancedSearchOnePerIdTextField').text("Rimuovi copie da multipli set")
        $("#advancedSearchFieldFlavorText").attr("placeholder", "Qualsiasi testo di flavor, es 'Jhoira'");
        $('#myDeckAdvancedSearchSearchButton').text("Cerca")
        $('#myDeckAdvancedSearchCloseButton').text("Chiudi")

        $('#contextMenuShuffleDeck').text("Mescola mazzo")
        $('#contextMenuViewDeck').text("Guarda mazzo")
        $('#contextMenuViewHand').text("Guarda mano")
        $('#contextMenuScryDeck').text("Guarda prime X carte")
        $('#contextMenuDiscardDeck').text("Scarta prime X carte")
        $('#contextMenuExileDeck').text("Esilia prime X carte")
        $('.optionFromTop').text("Dalla cima");
        $('.optionFromBottom').text("Dal fondo");
        $('.optionDiscard').text("Scarta carte");
        $('.optionExile').text("Esilia carte");

        $('#contextMenuPlayToken').text("Gioca token")
        $('#contextMenuViewGraveyard').text("Guarda cimitero")
        $('#contextMenuViewExiled').text("Guarda esilio")
        $('#closeContextMenu').text("Chiudi")
        $('#closeInspectorButton').text("Chiudi inspector")

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


        $('#myDeckDecksNormalSearchValue').attr("placeholder", "Search by name");
        $('#myDeckDecksNormalSearchButton').text("Search")
        $('#myDeckDecksSearchButton').text("Advanced Search")

        $('#advancedSearchFieldName').text("Card Name")
        $("#advancedSearchName").attr("placeholder", "Any words in the name, e.g 'Fire'");
        $('#advancedSearchFieldText').text("Text")
        $("#advancedSearchText").attr("placeholder", "Any text, e.g 'Draw a card'");
        $('#advancedSearchFieldTypeLine').text("Type")
        $("#advancedSearchTypeLine").attr("placeholder", "Any type, e.g 'Instant, 'Goblin'");
        $('#myDeckSetPickerSelectorText').text("Hold down the Ctrl (windows) or Command (Mac) button to select multiple options.")
        $('#advancedSearchTypeColorWhiteText').text("White")
        $('#advancedSearchTypeColorBlueText').text("Blue")
        $('#advancedSearchTypeColorBlackText').text("Black")
        $('#advancedSearchTypeColorRedText').text("Red")
        $('#advancedSearchTypeColorGreenText').text("Green")
        $('#advancedSearchTypeColorColorlessText').text("Colorless")
        $("#advancedSearchStatsValueType option[value='exact']").text("Exactly these colors");
        $("#advancedSearchStatsValueType option[value='including']").text("Including these colors");
        $("#advancedSearchStatsValueType option[value='atMost']").text("At most these colors");
        $('#advancedSearchFieldCmC').text("Mana Cost")
        $('#advancedSearchCmC').attr("placeholder", "Any mana symbols, e.g '{W}{W}'");
        $('#advancedSearchStats').text("Stats")
        $("#advancedSearchStatsValueType option[value='power']").text("Power");
        $("#advancedSearchStatsValueType option[value='toughness']").text("Toughness");
        $("#advancedSearchStatsValueType option[value='loyalty']").text("Loyalty");
        $("#advancedSearchStatsValueEqual option[value='1']").text("Equal to");
        $("#advancedSearchStatsValueEqual option[value='2']").text("Less than");
        $("#advancedSearchStatsValueEqual option[value='3']").text("Greater than");
        $("#advancedSearchStatsValueEqual option[value='4']").text("Less than or equal to");
        $("#advancedSearchStatsValueEqual option[value='5']").text("Greater than or equal to");
        $("#advancedSearchStatsValueEqual option[value='6']").text("Not equal to");
        $("#advancedSearchStatsValueAmount").attr("placeholder", "Any value, e.g '2'");
        $('#advancedSearchRarity').text("Rarity")
        $('#advancedSearchRarityCommon').text("Common")
        $('#advancedSearchRarityUncommon').text("Uncommon")
        $('#advancedSearchRarityRare').text("Rare")
        $('#advancedSearchRarityMythic').text("Mythic")
        $('#advancedSearchOnePerIdText').text("Unique Id")
        $('#advancedSearchOnePerIdTextField').text("Remove multiple copies from multiple sets")
        $("#advancedSearchFieldFlavorText").attr("placeholder", "Any flavor text, e.g 'Jhoira'");     
        $('#myDeckAdvancedSearchSearchButton').text("Search")
        $('#myDeckAdvancedSearchCloseButton').text("Close")


        $('#contextMenuShuffleDeck').text("Shuffle deck")
        $('#contextMenuViewDeck').text("View deck")
        $('#contextMenuViewHand').text("View hand")
        $('#contextMenuScryDeck').text("View first X cards")
        $('#contextMenuDiscardDeck').text("Discard first X cards")
        $('#contextMenuExileDeck').text("Exile first X cards")
        $('.optionFromTop').text("From Top");
        $('.optionFromBottom').text("From Bottom");
        $('.optionDiscard').text("Discard cards");
        $('.optionExile').text("Exile cards");

        $('#contextMenuPlayToken').text("Play token")
        $('#contextMenuViewGraveyard').text("View graveyard")
        $('#contextMenuViewExiled').text("View exiled")
        $('#closeContextMenu').text("Close")
        $('#closeInspectorButton').text("Close inspector")
        

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