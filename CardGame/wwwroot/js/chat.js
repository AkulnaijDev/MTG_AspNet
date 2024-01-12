"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();
var myConnectionId = "";
var myUsername = "";
var myToken = "";

var sets = [];

$("#sendButton").disabled = true;

connection.start().then(function () {
  $("#loginForm").show();
  $("#mainMenu").addClass("uninteractable");
  $("#chatContainer").addClass("uninteractable");
  $("#sendButton").disabled = false;
});



//login


$(document).on("mousedown", "#mypasswordchecker", function () {
  $("#mypassword").attr('type','text')
  $("#mypasswordchecker").text('👁️‍🗨️')
  
  
})
$(document).on("mouseup", "#mypasswordchecker", function () {
  $("#mypassword").attr('type','password')
  $("#mypasswordchecker").text('👁️')
})


$(document).on("click", "#loginbutton", function () {

  $('#loginSpinner').show();
  $(this).attr('disabled','true') //to avoid multiple calls
  var username = $("#myname").val();
  var password = $("#mypassword").val();
  
  connection.invoke("VerifyLogin", username,password).catch(function (err) {
    return console.error(err.toString());
  });

  event.preventDefault();
});

connection.on("ConfirmLogin", function (tokenSql) {
  myToken = tokenSql;

  if (tokenSql != "") {
    myUsername = $('#myname').val();

    connection.invoke("ReadAllSets").catch(function (err) {
      return console.error(err.toString());
    });

    connection.invoke("ReadAllCardsLastSet").catch(function (err) {
      return console.error(err.toString());
    });

    connection.invoke("ReadAllDecks", myUsername).catch(function (err) {
      return console.error(err.toString());
    });
    
    connection.invoke("Login", myUsername).catch(function (err) {
      return console.error(err.toString());
    });

  } else {
    $('#loginSpinner').hide();
    $('#loginError').show().delay(2000).fadeOut();
    $('#loginbutton').removeAttr('disabled')
    
  }
})

connection.on("SetMyConnectionId", function (userId) {
  myConnectionId = userId;
})

connection.on("Notify_Login", function (userList) {
  $("#mainMenu").removeClass("uninteractable");
  $("#chatContainer").removeClass("uninteractable");
  $('#loginSpinner').hide();
  $("#loginForm").hide();
  $('#loadingScreen').hide();
  
  $("#onlineUserContainer").empty();
  var users = JSON.parse(userList);

  users.forEach(function (user) {
    var chatSpan = "";
    var avatar = RandomAvatar();

    if(user.ConnectionId != myConnectionId){
      chatSpan = "<div class='openToChatIcon'>&#128172;</div>";
    }
    var div = $("<div class='onlineUser'><div class='randomIconEmoji'>" + avatar + "</div><div userid='" + user.ConnectionId + "' class='onlineUserName'> " + user.UserName + "</div>"+chatSpan+"</div>");

    $("#onlineUserContainer").append(div);

    var option = "<option value='"+user.ConnectionId+"'>"+user.UserName+"</option>"

    if(user.ConnectionId != myConnectionId){
      $("#inviteFriends").append(option)
    }
    
    
  });
})

connection.on("NotifyMe_Disconnected", function (userObj) {
  var user = JSON.parse(userObj);
  $('p:contains("' + user.ConnectionId + '")').remove();
  var p = $("<p></p>").text(`${user.UserName} has disconnected`);

  $("#onlineUserContainer").find('[userid="'+user.ConnectionId+'"]').parent().remove();
  $("#inviteFriends").find('[value="'+user.ConnectionId+'"]').remove();


  $("#chatBox").append(p);
  connection.close();
});




//actual chat start

$('body').on('click', '.openToChatIcon', function () {
  var targetUserId = $(this).parent().find('.onlineUserName').attr("userid");
  var targetUsername = $(this).parent().find('.onlineUserName').text();

  var roomGuid = GuidGenerator();

  connection.invoke("PutMeAndFriendInRoom", myConnectionId, myUsername, targetUserId, targetUsername, roomGuid).catch(function (err) {
    return console.error(err.toString());
  });
});

$('body').on('click', '.closePersonalChat', function () {
  var chatContainer = $(this).parent().parent();
  $(chatContainer).hide();
});

$('body').on('click', '.minimizePersonalChat', function () {
  var chatContainer = $(this).parent().parent();
  $(chatContainer).attr('minimized',"true");
  $(chatContainer).addClass('personalChatMinimized');
  
  $(chatContainer).find('.myChatTextContainer').hide();
  $(chatContainer).find('.myChatTextSenderContainer').hide();

  $(this).hide();
  $(chatContainer).find(".maximizePersonalChat").show();
});

$('body').on('click', '.maximizePersonalChat', function () {
  var chatContainer = $(this).parent().parent();
  $(chatContainer).attr('minimized',"false");
  $(chatContainer).removeClass('personalChatMinimized');

  $(chatContainer).find('.myChatTextContainer').show();
  $(chatContainer).find('.myChatTextSenderContainer').show();

  $(this).hide();
  $(chatContainer).find(".minimizePersonalChat").show();
});


$('body').on('keyup', '.myChatTextSenderInput', function(e) {
  var message = $(this).val();
  var roomGuid = $(this).parent().parent().attr('guid')
  var textBox = $(this).parent().parent().find('.myChatTextContainer')

  if(e.key == "Enter" &&  $(this).val().replaceAll(" ","") != ""){
    
    connection.invoke("SendChatMessage", myConnectionId, roomGuid, message ).catch(function (err) {
      return console.error(err.toString());
    });

    $(this).val('');

    textBox.animate({
      scrollTop: $(
        'html, body').get(0).scrollHeight
    }, 2000);
  }
})


connection.on("ReceiveChatMessage", function (event) {
  var message = JSON.parse(event);
  var classSender = "senderIsMe";
  var chatContainer = $('body').find('.personalChat[guid='+message.RoomGuid+']')
  var textBox = $(chatContainer).find('.myChatTextContainer')

  if(message.SenderId != myConnectionId){
    classSender = "senderIsOther"
  }

  var messageText = "<div class='myChatSingleMessage "+classSender+"'>"+ message.Message+"</div><br>"
  $(textBox).append(messageText);

  if(!$(chatContainer).is(":visible")){
    $(chatContainer).show();
    $(chatContainer).removeClass('personalChatMinimized');
    $(chatContainer).find('.myChatTextContainer').show();
    $(chatContainer).find('.myChatTextSenderContainer').show();
  }

  if($(chatContainer).attr('minimized')=="true"){
    //blink
    $(chatContainer).addClass('blinkChat');
    
    setTimeout(function() {
        $(chatContainer).removeClass('blinkChat')
    }, 2000);
  }

})

connection.on("PutInRoom", function (event) {
  var user = JSON.parse(event);

  var addingUserId = user.AddingUserId;
  var addingUsername = user.AddingUsername;

  var addedUserId = user.AddedUserId;
  var addedUsername = user.AddedUsername;

  var roomGuid = user.RoomGuid;

  ChatBoxCreator(addingUserId, addingUsername, addedUserId, addedUsername, roomGuid) 
});


function RandomAvatar() {
  var emojis = ["&#128121;", "&#128122;", "&#128123;", "&#128128;", "&#129497;", "&#129498;", "&#129499;", "&#129500;", "&#129501;", "&#129502;", "&#129503;"]
  return emojis[Math.floor(Math.random() * emojis.length)];
}


function ChatBoxCreator(addingUserId, addingUsername, addedUserId, addedUsername, roomGuid) {
  
  if(addedUserId == myConnectionId){
    addedUserId = addingUserId;
    addedUsername = addingUsername;
  }

  if ($(".personalChat[guid=" + roomGuid + "]").length == 0) {
    var personalChat = "<div guid='" + roomGuid + "' id='myChat" + addedUserId + "' class='personalChat'  targetUserId='" + addedUserId + "'>" +
      "<div class='myChatHeader'  id='myChat" + addedUserId + "header'>" +
      "<div class='myChatUsername'>" + addedUsername + "</div>" +
      "<div class='minimizePersonalChat'> - </div>" +
      "<div class='maximizePersonalChat'> [] </div>" +
      "<div class='closePersonalChat'> X </div>" +
      "</div>" +
      "<div class='myChatTextContainer'>" +
      "</div>" +
      "<div class='myChatTextSenderContainer'>"+
      "<input placeholder='Say something!' class='myChatTextSenderInput'></input>"
      "</div>"+
      "</div>";

    $('body').append(personalChat);

    dragElement(document.getElementById('myChat' + addedUserId));
  }
}


function GuidGenerator() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}
//actual chat end


// Make the DIV element draggable:


function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}