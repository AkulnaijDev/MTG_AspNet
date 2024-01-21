
function DealInitialCards (player){

    connection.invoke("DealCard",myId,7).catch(function (err) {
        return console.error(err.toString());
    });

    connection.on("ConfirmSavedSettings", function (result) {
        console.log("Settings update:"+ result)  //add a spinner o
    })

}

