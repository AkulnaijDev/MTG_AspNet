"use strict";

var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();

//Disable the send button until connection is established.
document.getElementById("sendButton").disabled = true;

connection.on("ReceiveMessage", function (user, message) {
    var li = document.createElement("li");
    document.getElementById("messagesList").appendChild(li);
    li.textContent = `${user} says ${message}`;
});

connection.start().then(function () {
    document.getElementById("sendButton").disabled = false;
    connection.invoke("NotifyMe_Connection", "NomeUtente");
});


document.getElementById("sendButton").addEventListener("click", function (event) {
    var user = document.getElementById("userInput").value;
    var message = document.getElementById("messageInput").value;

    connection.invoke("SendMessage", user, message).catch(function (err) {
        return console.error(err.toString());
    });

    event.preventDefault();
});


//Connected user event
connection.on("NotifyMe_Connected", function (user) {
    const p = document.createElement("p");
    const text = document.createTextNode(`${user} has connected`);
    p.appendChild(text);
    document.getElementById("usersList").appendChild(text);
});

//Disconnected user event
connection.on("NotifyMe_Disconnected", function (user) {
    console.log("oh noes")
    const p = document.createElement("p");
    const text = document.createTextNode(`${user} has disconnected`);
    p.appendChild(text);
    document.getElementById("usersListDisconnected").appendChild(text);
});