var cards = [];
var settini = [];
var decks = [];
var mySettings = {};
var amIEditing = false;

connection.on("PopulateAllCardsLastSet", function (scrapedCards) {
    var cardsParsed = JSON.parse(scrapedCards);
    cards = cardsParsed;
})

connection.on("PopulateAllSets", function (scrapedSets) {
    var setsParsed = JSON.parse(scrapedSets);
    settini = setsParsed;

    settini.forEach(element => {
        var option = "<option set_active='active' value=" + element.Code + ">" + element.Name + "</option>";
        $('#myDeckSetPickerSelector').append(option);
    });
    $('#myDeckSetPickerSelector').selectpicker();
})

connection.on("PopulateMyDecksResettingView", function (myDecks) {
    $('.myDecksPickerSelector').empty()
    var myDecksParsed = JSON.parse(myDecks);
    decks = myDecksParsed;

    myDecksParsed.forEach(element => {
        var option = "<option playerid='" + element.UserId + "' value=" + element.Id + ">" + element.Name + "</option>";
        $('.myDecksPickerSelector').append(option);
    });

    $('#myDecksPickerSelector').trigger('change')
})

connection.on("PopulateMyDecks", function (myDecks) {
    $('.myDecksPickerSelector').empty()
    var myDecksParsed = JSON.parse(myDecks);
    decks = myDecksParsed;

    myDecksParsed.forEach(element => {
        var option = "<option playerid='" + element.UserId + "' value=" + element.Id + ">" + element.Name + "</option>";
        $('.myDecksPickerSelector').append(option);
    });
})

connection.on("AdoptSettings", function (myUserSettings) {

    var myUserSettingsParsed = JSON.parse(myUserSettings);
    mySettings = myUserSettingsParsed;

    if(!!mySettings.Volume){
        $('#myRange').val(parseInt(mySettings.Volume)).trigger('change');
    }
    
    if(!!mySettings.Soundtrack){
        $('#musicChooseOptions').val(mySettings.Soundtrack).trigger('change');
    }

    if (!!mySettings.Background) {
        $('#backgroundChooseOptions').val(mySettings.Background).trigger('change');
    }

    if (!!mySettings.Theme) {
        $('#themeChooseOptions').val(mySettings.Theme).trigger('change');
    }

    if (!!mySettings.Language) {
        $('#languageChooseOptions').val(mySettings.Language).trigger('change');
    }

})

connection.on("ConfirmDeckEdited", function () {
    connection.invoke("ReadAllDecks", myUsername).catch(function (err) {
        return console.error(err.toString());
    });
})

connection.on("ConfirmDeckSaved", function (insertedId) {
    $('#myDeckSaveButton').attr('editing', insertedId)
    $('.myDecksPickerSelector').empty()
    connection.invoke("ReadAllDecks", myUsername).catch(function (err) {
        return console.error(err.toString());
    });
})

connection.on("ConfirmDeckDeleted", function () {
    $('#myDeckDelete').hide();
    connection.invoke("ReadAllDecksResetView", myUsername).catch(function (err) {
        return console.error(err.toString());
    });
})

$(document).on('click', '.cardImagePreview', function () {
    var source = $(this).attr('src');
    var newSource = "";

    if ($(this).attr('doubleface') == 'true') {

        if (source.includes("_front_")) {
            newSource = source.replace("_front_", "_back_");
        } else if (source.includes("_back_")) {
            newSource = source.replace("_back_", "_front_");
        }

        if ($(this).hasClass('flip-vertical-left')) {
            $(this).removeClass('flip-vertical-left');
            $(this).addClass('flip-vertical-right');
        } else if ($(this).hasClass('flip-vertical-right')) {
            $(this).removeClass('flip-vertical-right');
            $(this).addClass('flip-vertical-left');
        } else {
            $(this).addClass('flip-vertical-left');
        }

        $(this).attr('src', newSource);
    }
})


$('body').on('click', '#mainMenuMyDeck', function () {
    if (!$("#optionsMenu").is(':visible') && !$("#rulesMenu").is(':visible') && !$("#gameModeMenu").is(':visible')) {
        $('#chatContainer').hide();
        $('#myDeckMenu').show();
        $('#myDeckSetPickerSelector').trigger('change');
        $('#myDecksPickerSelector').trigger('change');
    }
});

$('body').on('click', '#myDeckMenuBackButton', function () {
    $('#chatContainer').show();
    $('#myDeckMenu').hide();
    $('#myDeckList').empty();
});

$('body').on('click', '#myDecksPickerSelectorAdd', function () {
    $('#myDeckName').removeAttr('deckId');
    $('#myDeckCreateName').show();
});

$('body').on('click', '#myDecksPickerSelectorDelete', function () {
    $('#myDeckDelete').show();
});

$('body').on('click', '#myDeckDeleteBackButton', function () {
    $('#myDeckDelete').hide();
});

$('body').on('click', '#myDeckEditBackButton', function () {
    $('#myDeckEdit').hide();
});

$('body').on('click', '#myDeckDeleteConfirmButton', function () {

    if ($('#myDeckSaveButton').attr('editing') == "") {
        $('#myDeckDelete').hide();
        $('#myDecksPickerSelector').trigger('change')

    } else {
        var optionSelected = $('#myDecksPickerSelector').find("option:selected");
        var valueSelected = optionSelected.val();
        connection.invoke("DeleteDeck", valueSelected, myUsername).catch(function (err) {
            return console.error(err.toString());
        });
    }

});

$('body').on('click', '#myDeckCreateNameSaveButton', function () {
    $('#myDeckList').empty();
    var value = $('#myDeckCreateNameInput').val();

    if (value != "") {
        $('#myDeckName').text(value);
        $('#myDeckCreateNameInput').val('');
        $('#myDeckCreateName').hide();
        $('#myDeckSaveButton').attr('editing', '')
        amIEditing = true;


        $('#myDecksPickerSelectorDelete').removeClass('notVisible')
        $('#myDeckSaveButton').removeAttr('disabled')
        $('.cardRowActionPlus').css('visibility', 'visible')
        $('.cardRowActionMinus').css('visibility', 'visible')
        $('.addCardToDeck').removeClass('notVisible')
        $('.removeCardFromDeck').removeClass('notVisible')

    }
});

$('body').on('click', '#myDeckCreateNameBackButton', function () {
    $('#myDeckCreateName').hide();
    $('#myDeckCreateNameInput').val('');
    $('#myDecksPickerSelector').trigger('change')
});


//gameModes START
$('body').on('click', '.gameModePlusIcon', function () {
    $(this).parent().children(".gameModeMinusIcon").show();
    $(this).parent().parent().children(".gameModeDescription").show();
    $(this).hide();
})
$('body').on('click', '.gameModeMinusIcon', function () {
    $(this).parent().children(".gameModePlusIcon").show();
    $(this).parent().parent().children(".gameModeDescription").hide();
    $(this).hide();
});


$('body').on('click', '#myDeckGameModeButton', function () {
    $('#gameModeMenu').show();
});

$('body').on('click', '#closeGameRulesMenu', function () {
    $('#gameModeMenu').hide();
    $('.gameModeIcon').trigger('click');

});
//gameModes END


$('body').on('change', '#myDecksPickerSelector', function () {

    $('#myDeckList').empty();

    var optionSelected = $(this).find("option:selected");
    var isPrecon = $(optionSelected).attr('playerId') == "";

    var valueSelected = optionSelected.val();
    var selectedDeck = decks.filter(x => x.Id == valueSelected);

    $('#myDeckSaveButton').attr('editing', valueSelected);

    $('#myDeckName').text(optionSelected.text());
    $('#myDeckName').attr('deckId', valueSelected);

    selectedDeck[0].Cards.forEach(x => {
        if (x.length > 0) {
            var element = JSON.parse(x);

            if (element.Name != undefined) {
                var tmpCard = "<div class='cardRow' sourcepath='" +
                    element.Source.replace(/'/g, "&#39;") + "'" +
                    "key='" + element.Key + "'" +
                    "><div cardlimit='" + element.Cardlimit + "'" +
                    " class='cardRowActions'><span class='cardRowActionPlus'>➕</span><span class='cardRowActionMinus'>➖</span></div><div class='cardRowCount'>" +
                    element.CardCount +
                    "</div><div key='" + element.Key + "'" +
                    "class='cardRowName'>" + element.Name +
                    "</div></div>";

                $('#myDeckList').append(tmpCard);
            }
        }
    });
    CountCardsInDeck();

    if (isPrecon) {
        $('#myDecksPickerSelectorDelete').addClass('notVisible')
        $('#myDeckSaveButton').attr('disabled', true)
        $('.cardRowActionPlus').css('visibility', 'hidden')
        $('.cardRowActionMinus').css('visibility', 'hidden')
        $('.addCardToDeck').addClass('notVisible')
        $('.removeCardFromDeck').addClass('notVisible')
    } else {
        $('#myDecksPickerSelectorDelete').removeClass('notVisible')
        $('#myDeckSaveButton').removeAttr('disabled')
        $('.cardRowActionPlus').css('visibility', 'visible')
        $('.cardRowActionMinus').css('visibility', 'visible')
        $('.addCardToDeck').removeClass('notVisible')
        $('.removeCardFromDeck').removeClass('notVisible')
    }

});

$('body').on('click', '#myDeckZoomSelectorPlus', function () {
    if ($(this).attr('defaultscreen') == 5) {
        $(this).attr('defaultscreen', 4)
        $('#myDeckZoomSelectorMinus').attr('defaultscreen', 4)
        $('#myDeckCardPickerContainer').css('grid-template-columns', '25% 25% 25% 25%')
        $('.cardImagePreview').css('max-width', '275px')
    }
    else if ($(this).attr('defaultscreen') == 4) {
        $(this).attr('defaultscreen', 3)
        $('#myDeckZoomSelectorMinus').attr('defaultscreen', 3)
        $('#myDeckCardPickerContainer').css('grid-template-columns', '33% 33% 33%')
        $('.cardImagePreview').css('max-width', '300px')
    }
    else if ($(this).attr('defaultscreen') == 3) {
        $(this).attr('defaultscreen', 2)
        $('#myDeckZoomSelectorMinus').attr('defaultscreen', 2)
        $('#myDeckCardPickerContainer').css('grid-template-columns', '50% 50%')
        $('.cardImagePreview').css('max-width', '325px')
    }
});

$('body').on('click', '#myDeckZoomSelectorMinus', function () {
    if ($(this).attr('defaultscreen') == 2) {
        $(this).attr('defaultscreen', 3)
        $('#myDeckZoomSelectorPlus').attr('defaultscreen', 3)

        $('#myDeckCardPickerContainer').css('grid-template-columns', '33% 33% 33%')
        $('.cardImagePreview').css('max-width', '300px')
    }
    else if ($(this).attr('defaultscreen') == 3) {
        $(this).attr('defaultscreen', 4)
        $('#myDeckZoomSelectorPlus').attr('defaultscreen', 4)

        $('#myDeckCardPickerContainer').css('grid-template-columns', '25% 25% 25% 25%')
        $('.cardImagePreview').css('max-width', '275px')
    }
    else if ($(this).attr('defaultscreen') == 4) {
        $(this).attr('defaultscreen', 5)
        $('#myDeckZoomSelectorPlus').attr('defaultscreen', 5)

        $('#myDeckCardPickerContainer').css('grid-template-columns', '20% 20% 20% 20% 20%')
        $('.cardImagePreview').css('max-width', '250px')
    }
});

$('body').on('click', '.cardRowActionMinus', function () {
    var parentRow = $(this).parent().parent();
    var count = $(parentRow).find('.cardRowCount')[0].innerHTML;
    var updatedCount = Number(count) - 1;

    if (count > 1) {
        $(parentRow).find('.cardRowCount')[0].innerHTML = updatedCount
    } else {
        $(parentRow).remove();
    }
    CountCardsInDeck();
});

$('body').on('click', '.cardRowActionPlus', function () {
    var parentRow = $(this).parent().parent();
    var count = $(parentRow).find('.cardRowCount')[0].innerHTML;
    var cardLimit = $(this).parent().attr('cardLimit');
    var updatedCount = Number(count) + 1;

    if (count >= 1 && (updatedCount <= cardLimit)) {
        $(parentRow).find('.cardRowCount')[0].innerHTML = updatedCount
    } else {
        $('#myDeckAlert').css('visibility', 'visible');
        setTimeout(() => {
            $('#myDeckAlert').css('visibility', 'hidden');
        }, 2000);
    }
    CountCardsInDeck();
});

$('body').on('click', '.addCardToDeck', function () {
    var card = $(this).parent().parent();
    var legendary = card.attr("legendary");
    var land = card.attr("land");
    var basicLand = card.attr("basicLand");
    var key = card.attr("key");
    var name = card.attr("name").replaceAll('"', " ");
    var source = card.attr('sourcePath').replace(/'/g, "&#39;");
    var token = card.attr('token');

    var alreadyPresent = document.querySelectorAll('.cardRow[key="' + key + '"]').length > 0 ? true : false;
    var numberOfCopiesInList = alreadyPresent ? document.querySelectorAll('.cardRow[key="' + key + '"]')[0].children[1].innerHTML : 0;

    var anotherVersion = "false";

    var list = document.querySelectorAll('.cardRowName')
    list.forEach(element => {
        if (element.innerHTML == name && basicLand == "false" && element.attributes[0].nodeValue != key) {
            anotherVersion = "true";
        }
    });

    var canPut = false;
    var cardLimit = 1000;

    if (legendary == "true") {
        cardLimit = 1;
    }
    if (land == "true" && basicLand == "false") {
        cardLimit = 4;
    }

    if (land == "false" && basicLand == "false" && legendary == "false") {
        cardLimit = 4;
    }

    if (legendary == "true" && numberOfCopiesInList < 1) {
        canPut = true;
    } else if (basicLand == "true") {
        canPut = true;
    } else if (legendary == "false" && basicLand == "false" && numberOfCopiesInList < 4) {
        canPut = true;
    }

    if (token == "true" || anotherVersion == "true") {
        canPut = false;
    }

    if (canPut) {
        var count = Number(numberOfCopiesInList) + 1;
        if (!alreadyPresent) {
            var row = "<div class='cardRow' sourcePath='" + source.replace(/'/g, "&#39;") + "' key='" + key + "'>" +
                "<div cardLimit=" + cardLimit + " class='cardRowActions'><span class='cardRowActionPlus'>➕</span><span class='cardRowActionMinus'>➖</span></div>" +
                "<div class='cardRowCount'>" + count + "</div><div key='" + key + "' class='cardRowName'>" + name + "</div></div>";
            $('#myDeckList').append(row);

            $('#myDeckList').animate({
                scrollTop: $(
                    'html, body').get(0).scrollHeight
            }, 2000);


        } else {
            document.querySelectorAll('.cardRow[key="' + key + '"]')[0].children[1].innerHTML = count
        }

    } else {

        $('#myDeckAlert').css('visibility', 'visible');
        setTimeout(() => {
            $('#myDeckAlert').css('visibility', 'hidden');
        }, 2000);
    }

    CountCardsInDeck();
});

$('body').on('click', '.removeCardFromDeck', function () {
    var card = $(this).parent().parent();
    var key = card.attr("key");

    var alreadyPresent = document.querySelectorAll('.cardRow[key="' + key + '"]').length > 0 ? true : false;
    var numberOfCopiesInList = alreadyPresent ? document.querySelectorAll('.cardRow[key="' + key + '"]')[0].children[1].innerHTML : 0;

    if (alreadyPresent) {
        if (numberOfCopiesInList == 1) {
            document.querySelectorAll('.cardRow[key="' + key + '"]')[0].remove();
        } else {
            var newCount = Number(numberOfCopiesInList) - 1;
            document.querySelectorAll('.cardRow[key="' + key + '"]')[0].children[1].innerHTML = newCount
        }
    }
    CountCardsInDeck();
});

function checkResourceExistence(url, successCallback, errorCallback) {
    var img = new Image();
    img.onload = function () {
        successCallback();
    };
    img.onerror = function () {
        errorCallback();
    };
    img.src = url;
}


$('body').on('mouseenter', '.cardRow', function () {
    var sourcePath = $(this).attr('sourcePath').replace(/'/g, "&#39;");

    checkResourceExistence(
        sourcePath,
        function () {
            $('#myDeckCardPreviewImage').attr('src', sourcePath);
        },
        function () {
            $('#myDeckCardPreviewImage').attr('src', "../resources/cardBack.jpg");
        }
    );
});

$('body').on('click', '.cardRowName', function () {
    $('#myDeckList').hide();
    $('#myDeckSaveButtonContainer').hide();
    $('#myDeckCardPreviewImage').css('margin-top', '50%');
    $('#myDeckCardPreviewImage').css('transform', 'scale(2.0)');
    $('#myDeckCardPreviewImage').attr("zoomedPreview",true);
    $('#myDeckCardPreviewImageButton').show();
});

$('body').on('click', '#myDeckCardPreviewImageButton', function () {
    $(this).hide();
    $('#myDeckList').show();
    $('#myDeckSaveButtonContainer').show();
    $('#myDeckCardPreviewImage').css('margin-top', '0%');
    $('#myDeckCardPreviewImage').css('transform', 'scale(1)');
    $('#myDeckCardPreviewImage').removeAttr("zoomedPreview");
});

$('body').on('click', '#myDeckSaveButton', function () {
    var cardList = [];

    var list = document.querySelectorAll('.cardRow')
    
    list.forEach(element => {
        var source = element.getAttribute('sourcepath').replace(/'/g, "&#39;");
        var key = element.getAttribute('key');

        if (!key || key === "''") {
            key = element.getAttribute('s_gate');
        }

        var cardCount = element.querySelector('.cardRowCount').innerHTML;
        var name = element.querySelector('.cardRowName').innerHTML;
        var cardLimit = element.querySelector('.cardRowActions').getAttribute('cardlimit');

        var obj = {
            "Source": source,
            "CardCount": cardCount,
            "Name": name,
            "Cardlimit": cardLimit,
            "Key": key
        };

        cardList.push(obj);
    });

    var deck = { "Name": $('#myDeckName').text(), "UserId": myUsername, "Cards": cardList };

    var editingDeckId = ""

    if ($(this).attr('editing') != '') {
        editingDeckId = $(this).attr('editing')//editing a deck
    } else {
        //saving a new deck
    }

    connection.invoke("SaveDeck", JSON.stringify(deck), editingDeckId).catch(function (err) {
        return console.error(err.toString());
    });

    $('#myDeckEdit').show();

});

function CountCardsInDeck() {
    var count = 0;
    $('.cardRowCount').each(function () {
        count += parseInt($(this).text())
    });
    $('#myDeckCardCount').text(count);
}

function showCards() {
    var selectedSetName = $('#myDeckSetPickerSelector option:selected').text();

    connection.invoke("ReadAllCardsThisSet", selectedSetName).catch(function (err) {
        return console.error(err.toString());
    });
}

function showCardsImage(array) {
    let cardArray = [];

    array.forEach(element => {
        let selectedSetCode = element.Set;
        let selectedSetName = element.Set_Name;
        selectedSetName = selectedSetName.replaceAll(" ", "_");
        selectedSetName = selectedSetName.replaceAll(":", "_");
        let legendary = "false";
        let land = "false";
        let basicLand = "false";
        let token = "false";

        if (element.Type_Line.includes("Token")) {
            token = "true";
        }

        if (element.Type_Line.includes("Legendary")) {
            legendary = "true";
        }

        if (element.Type_Line.includes("Land")) {
            land = "true";
        }

        if (element.Type_Line.includes("Basic Land")) {
            basicLand = "true";
        }

        let filePath = "";

        if (element.Name.includes("//") && (element.Layout != "split" && element.Layout != "adventure")) {
            doubleFace = true;
            filePath = '../resources/cards_images/' + selectedSetCode + '_' + selectedSetName + '/' + selectedSetCode + '_front_' + element.Id + '.jpg';
        } else {
            doubleFace = false;
            filePath = '../resources/cards_images/' + selectedSetCode + '_' + selectedSetName + '/' + selectedSetCode + '_' + element.Id + '.jpg';
        }

        if (element.Layout == "split" || element.Layout == "adventure") {
            doubleFace = false;
        }

        let cardObject = {
            set: element.Set_Id,
            token: token,
            doubleFace: doubleFace,
            land: land,
            basicLand: basicLand,
            key: element.Id,
            legendary: legendary,
            source: filePath,
            name: element.Name
        }

        cardArray.push(cardObject);
    });

    setCardsImages(cardArray);
}

function setCardsImages(cardArray) {


    var optionSelected = $('#myDecksPickerSelector').find("option:selected");
    var isPrecon = $(optionSelected).attr('playerId') == "";

    var plus = "<span class='addCardToDeck'>➕</span>"
    var minus = "<span class='removeCardFromDeck'>➖</span>"

    if( $('#myDeckSaveButton').attr('disabled',false).length!=1){
        if (isPrecon == true || amIEditing == false ) {
            plus = "<span class='notVisible addCardToDeck'>➕</span>"
            minus = "<span class='notVisible removeCardFromDeck'>➖</span>"
        }
    }
    

    cardArray.forEach(element => {
        var name = (element.name).replaceAll(" ", "&quot;");

        checkResourceExistence(
            element.source,
            function () {
                var div = "<div token=" + element.token + " set=" + element.set + " sourcePath =" + element.source.replace(/'/g, "&#39;") + " basicLand=" + element.basicLand + " land=" + element.land + " name=" + name + " key=" + element.key + " class='cardImageContainer' " +
                    "legendary=" + element.legendary + ">" +
                    "<img class='cardImagePreview' doubleFace=" + element.doubleFace + " src=" + element.source + " alt=" + name + ">" +
                    "</img><div class='cardImageTextActionContainer'>" + plus + element.name + minus + "</div></div>"

                $('#myDeckCardPickerContainer').append(div);
            },
            function () {
                var div = "<div token=" + element.token + " set=" + element.set + " sourcePath =" + element.source.replace(/'/g, "&#39;") + " basicLand=" + element.basicLand + " land=" + element.land + " name=" + name + " key=" + element.key + " class='cardImageContainer' " +
                    "legendary=" + element.legendary + ">" +
                    "<img class='cardImagePreview' doubleFace=" + element.doubleFace + " src='../resources/cardBack.jpg' alt=" + name + ">" +
                    "</img><div class='cardImageTextActionContainer'>" + plus + element.name + minus + "</div></div>"

                $('#myDeckCardPickerContainer').append(div);
            }
        );


    });
}

function checkResourceExistence(url, successCallback, errorCallback) {
    var img = new Image();
    img.onload = function () {
        successCallback();
    };
    img.onerror = function () {
        errorCallback();
    };
    img.src = url;
}


$('body').on('mouseenter', '.cardRow', function () {
    var sourcePath = $(this).attr('sourcePath').replace(/'/g, "&#39;");

    checkResourceExistence(
        sourcePath,
        function () {
            $('#myDeckCardPreviewImage').attr('src', sourcePath);
        },
        function () {
            $('#myDeckCardPreviewImage').attr('src', "../resources/cardBack.jpg");
        }
    );
});