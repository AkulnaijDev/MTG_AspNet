using CardGame.Models;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Globalization;
using System.IO.Pipelines;
using System.Text.RegularExpressions;
using Utils;

namespace CardGame.Hubs
{
    public class ChatHub : Hub
    {
        public static List<Room> _roomList = new();

        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        //Override to display connected ids
        public override Task OnConnectedAsync()
        {
            UserHandler.ConnectedIds.Add(Context.ConnectionId);
            Clients.Caller.SendAsync("SetMyConnectionId", Context.ConnectionId);
            return base.OnConnectedAsync();
        }

        //Override to notify when someone disconnects
        public override Task OnDisconnectedAsync(Exception exception)
        {
            var disconnectedUserIndex = UserHandler.Users.FindIndex(x => x.ConnectionId == Context.ConnectionId);
            var userDisconnected = UserHandler.Users[disconnectedUserIndex];
            var user = JsonConvert.SerializeObject(userDisconnected);
            Clients.All.SendAsync("NotifyMe_Disconnected", user);
            Context.Abort();
            return base.OnDisconnectedAsync(exception);
        }

        //Login with name
        public async Task Login(string username)
        {
            var user = new User(Context.ConnectionId, username);
            UserHandler.Users.Add(user);
            var obj = JsonConvert.SerializeObject(UserHandler.Users);
            await Clients.All.SendAsync("Notify_Login", obj);
        }

        //Open the chat for the target user
        public async Task PutMeAndFriendInRoom(string myUserId, string myUsername, string targetUserId, string targetUserUsername, string roomGuid)
        {
            await Groups.AddToGroupAsync(myUserId, roomGuid);
            await Groups.AddToGroupAsync(targetUserId, roomGuid);
            var addedInRoom = new AddedInRoom(myUserId, myUsername, targetUserId, targetUserUsername, roomGuid);
            var obj = JsonConvert.SerializeObject(addedInRoom);
            await Clients.Group(roomGuid).SendAsync("PutInRoom", obj);
        }

        public async Task SendChatMessage(string senderId, string roomGuid, string message)
        {
            var chatMessage = new ChatMessage(senderId, roomGuid, message);
            var obj = JsonConvert.SerializeObject(chatMessage);
            await Clients.Group(roomGuid).SendAsync("ReceiveChatMessage", obj);
        }

        public async Task ReadAllSets()
        {
            var sets = SqlUtils.QueryRequestSets();
            var obj = JsonConvert.SerializeObject(sets);
            await Clients.Caller.SendAsync("PopulateAllSets", obj);
        }

        public async Task ReadAllCards()
        {
            var cards = SqlUtils.QueryRequestCards("");
            var obj = JsonConvert.SerializeObject(cards);
            await Clients.Caller.SendAsync("PopulateAllCards", obj);
        }

        public async Task ReadAllCardsLastSet()
        {
            var cards = SqlUtils.QueryRequestCards("where [set] = (select top 1 Code from [Sets] order by Released_at desc)");
            var obj = JsonConvert.SerializeObject(cards);
            await Clients.Caller.SendAsync("PopulateAllCardsLastSet", obj);
        }

        public async Task ReadAllCardsThisSet(string setName)
        {
            var cards = SqlUtils.QueryRequestCards("WHERE [Set_Name] ='" + setName + "'");
            var obj = JsonConvert.SerializeObject(cards);
            await Clients.Caller.SendAsync("ShowCardsFromSet", obj);
        }

        public async Task ReadAllDecksResetView(string username)
        {
            var decks = SqlUtils.QueryRequestDecks(username);
            var obj = JsonConvert.SerializeObject(decks);
            await Clients.Caller.SendAsync("PopulateMyDecksResettingView", obj);
        }

        public async Task ReadAllDecks(string username)
        {
            var decks = SqlUtils.QueryRequestDecks(username);
            var obj = JsonConvert.SerializeObject(decks);
            await Clients.Caller.SendAsync("PopulateMyDecks", obj);
        }

        public async Task VerifyLogin(string username, string password)
        {
            var token = SqlUtils.CheckLogin(username, password);
            await Clients.Caller.SendAsync("ConfirmLogin", token);
        }

        public async Task GetUserSetting(string username)
        {
            var userSetting = SqlUtils.GetUserSettings(username);
            var obj = JsonConvert.SerializeObject(userSetting);
            Console.WriteLine(obj);
            await Clients.Caller.SendAsync("AdoptSettings", obj);
        }

        public async Task SaveDeck(string deck, string? deckId)
        {
            var deckItem = JsonConvert.DeserializeObject<DeckItem>(deck);

            try
            {
                if (String.IsNullOrEmpty(deckId))
                {
                    var insertedId = SqlUtils.SaveDeck(deckItem); //new deck
                    await Clients.Caller.SendAsync("ConfirmDeckSaved", insertedId);
                }
                else
                {
                    SqlUtils.EditDeck(deckItem, deckId); //new deck
                    await Clients.Caller.SendAsync("ConfirmDeckEdited");
                }

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message + ex.StackTrace);
            }

        }

        public async Task DeleteDeck(string deckId, string username)
        {
            SqlUtils.DeleteDeck(deckId, username);
            await Clients.Caller.SendAsync("ConfirmDeckDeleted");
        }

        public async Task VerifyGameModes(string deckId, string username)
        {
            var deck = SqlUtils.QueryRequestDeck(deckId, username);

            var cardCount = 0;
            var setsPresent = new List<string>();
            var raritiesPresent = new List<string>();
            var colorIdentities = new List<string>();
            var singleton = true;
            var standardSets = SqlUtils.StandardSets();

            var gamesMode = new GamesMode();

            for (var i = 1; i <= 100; i++)
            {

                var card = deck.Cards[i - 1];
                if (card is not null && card != "")
                {
                    var parsedCard = JsonConvert.DeserializeObject<JsonCard>(card);
                    cardCount += parsedCard.CardCount;

                    if (parsedCard.CardCount > 1 && parsedCard.CardLimit <= 4)
                        singleton = false;

                    var cardCheck = SqlUtils.ReadSetAndRarityAndColorIdentity(parsedCard.Key);
                    raritiesPresent.Add(cardCheck.Rarity);
                    setsPresent.Add(cardCheck.SetCode);
                    colorIdentities.Add(cardCheck.ColorIdentity);

                    if (cardCheck.ReleaseDate < Converters.DateConverter("2012-10-05"))
                        gamesMode.Pioneer = false;

                    if (cardCheck.ReleaseDate < Converters.DateConverter("2003-07-28"))
                        gamesMode.Modern = false;
                }
            }

            if (raritiesPresent.Any(x => x != "common"))
                gamesMode.Pauper = false;

            if (setsPresent.Any(x => !standardSets.Contains(x)))
                gamesMode.Standard = false;

            if (singleton is false || cardCount != 100)
            {
                gamesMode.Commander = false;
            }

            if (cardCount < 60 || cardCount > 100)
            {
                gamesMode.Valid = false;
            }

            var obj = JsonConvert.SerializeObject(gamesMode);
            Console.WriteLine(obj);
            await Clients.Caller.SendAsync("GameModesForDeck", obj);
        }


        public async Task SendGameInvitation(string obj)
        {
            var gameInvitation = JsonConvert.DeserializeObject<GameInvitation>(obj);

            if (!CheckIfIAmAlreadyInARoom(gameInvitation.InvitingId))
            {
                var listOfPlayers = new List<Player>();
                var me = new Player { PlayerId = gameInvitation.InvitingId, Name = gameInvitation.InvitingPlayerName, DeckId = gameInvitation.DeckId };
                listOfPlayers.Add(me);

                var newRoom = new Room { GameMode = gameInvitation.GameMode, Players = listOfPlayers, RoomId = gameInvitation.RoomId };
                _roomList.Add(newRoom);
                await Groups.AddToGroupAsync(gameInvitation.InvitingId, gameInvitation.RoomId);

                gameInvitation.Rooms = _roomList;
                var sendObj = JsonConvert.SerializeObject(gameInvitation);

                foreach (var playerIds in gameInvitation.InvitedIds)
                {
                    await Clients.Client(playerIds).SendAsync("DisplayGameInvitation", sendObj);
                }

            }
            else
            {
                await Task.CompletedTask;
            }

        }

        public bool CheckIfIAmAlreadyInARoom(string myId)
        {
            if (_roomList.Count > 0)
            {
                foreach (var room in _roomList)
                {
                    if (room.Players.Any(x => x.PlayerId == myId))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        public async Task RefuseGameInvitation(string invitingPlayerId, string invitedPlayerId)
        {
            await Clients.Client(invitingPlayerId).SendAsync("SendRefusalGameInvitation", invitedPlayerId);
        }

        public async Task SaveMySettings(string playerId, string username, string chosenVolume, string desktop, string theme, string language, string music)
        {
            try
            {
                var mySettings = new UserSettings();
                mySettings.Username = username;
                mySettings.Language = language;
                mySettings.Volume = chosenVolume;
                mySettings.Background = desktop;
                mySettings.Theme = theme;
                mySettings.Soundtrack = music;

                var result = SqlUtils.SaveMySettings(mySettings); 
                await Clients.Client(playerId).SendAsync("ConfirmSavedSettings",result);

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

        }


        public async Task AcceptGameInvitation(string roomId, string acceptinPlayerId, string acceptinPlayerName, string deckId)
        {
            try
            {
                await Groups.AddToGroupAsync(acceptinPlayerId, roomId);  //enters the room and send event to who is already in there

                var newPlayer = new Player { DeckId = deckId, Name = acceptinPlayerName, PlayerId = acceptinPlayerId };
                _roomList.Where(x => x.RoomId == roomId).First().Players.Add(newPlayer);

                var roomIEnteredIn = JsonConvert.SerializeObject(_roomList.Where(x => x.RoomId == roomId).First());
                await Clients.Group(roomId).SendAsync("DisplayWhoIsInRoom", roomIEnteredIn);

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

        }

        public async Task<List<GameCard>> CreatePlayingDeck(string deckId)
        {
            var deck = new List<GameCard>();

            return deck;
        }

        public async Task StartTheActualGame(string startingGamePlayerId, string teams)
        {
            var room = _roomList.Where(x => x.Players.Any(y => y.PlayerId == startingGamePlayerId)).FirstOrDefault();
            var roomId = room.RoomId;
            var players = room.Players;
            var gameTeams = JsonConvert.DeserializeObject<SentTeams>(teams).Teams;
            var listOfPlayers = new List<GamePlayer>();

            foreach (var player in players)
            {
                var playerDeck = SqlUtils.GetPlayableVersionOfTheDeck(player.DeckId);

                var playerObj = new GamePlayer
                {
                    PlayerId = player.PlayerId,
                    HP = room.GameMode.ToLower() == "commander" ? 40 : 20,
                    Deck = playerDeck,
                    Name = player.Name
                };

                listOfPlayers.Add(playerObj);
            }

            var game = new Game
            {
                RoomId = roomId,
                GameMode = room.GameMode,
                Teams = gameTeams,
                Players = listOfPlayers
            };

            var gameObj = JsonConvert.SerializeObject(game);
            await Clients.Group(roomId).SendAsync("DisplayGameBoard", gameObj);
        }


        public async Task AdvancedSearchCards(string searchObject)
        {
            try
            {
                var advancedSearch = JsonConvert.DeserializeObject<SearchObject>(searchObject);
                var query = await AdvancedSearchQueryCreator(advancedSearch);

                Console.WriteLine(query);
                var cards = SqlUtils.QueryRequestCards(query);

                if (advancedSearch.Singleton)
                {
                    cards = cards
                   .GroupBy(c => c.Oracle_Id)
                   .Select(g => g.OrderByDescending(c => DateTime.ParseExact(c.Released_at, "yyyy-MM-dd", CultureInfo.InvariantCulture)).First())
                   .ToList();
                }
                var obj = JsonConvert.SerializeObject(cards);

                await Clients.Caller.SendAsync("SendSearchedCards", obj);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task NormalSearchCards(string cardName)
        {
            try
            {
                var index = 0;
                var query1 = " WHERE ";

                if (!string.IsNullOrEmpty(cardName))
                {
                    var namePieces = ExtractWords(cardName);
                    query1 += "(";

                    foreach (var piece in namePieces)
                    {
                        bool lastLoop = (index == namePieces.Length - 1);
                        if (!lastLoop)
                        {
                            query1 += $" [Name] like '%{piece}%' AND ";
                        }
                        else
                        {
                            query1 += $" [Name] like '%{piece}%' ";
                        }
                        index++;
                    }
                    query1 += ")";
                    index = 0;
                }

                query1 += " ORDER BY [Name] ASC";

                var cards = SqlUtils.QueryRequestCards(query1);

                cards = cards
                .GroupBy(c => c.Oracle_Id)
                .Select(g => g.OrderByDescending(c => c.Name).First())
                .ToList();

                var obj = JsonConvert.SerializeObject(cards);

                await Clients.Caller.SendAsync("SendNormalSearchCards", obj);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task<string> AdvancedSearchQueryCreator(SearchObject obj)
        {
            try
            {
                var index = 0;
                var query1 = " WHERE ";

                if (!string.IsNullOrEmpty(obj.Name))
                {
                    var namePieces = ExtractWords(obj.Name);
                    query1 += "(";

                    foreach (var piece in namePieces)
                    {
                        bool lastLoop = (index == namePieces.Length - 1);
                        if (!lastLoop)
                        {
                            query1 += $" [Name] like '%{piece}%' AND ";
                        }
                        else
                        {
                            query1 += $" [Name] like '%{piece}%' ";
                        }
                        index++;
                    }
                    query1 += ") AND";
                    index = 0;
                }
            

                if (!string.IsNullOrEmpty(obj.Text))
                {
                    var textPieces = ExtractWords(obj.Text);
                    query1 += "(";
                    foreach (var piece in textPieces)
                    {
                        bool lastLoop = (index == textPieces.Length - 1);
                        if (!lastLoop)
                        {
                            query1 += $" [Oracle_Text] like '%{piece}%' AND ";
                        }
                        else
                        {
                            query1 += $" [Oracle_Text] like '%{piece}%' ";
                        }
                        index++;
                    }
                    query1 += ") AND";
                    index = 0;
                }

              
                if (!string.IsNullOrEmpty(obj.Type))
                {
                    var typePieces = ExtractWords(obj.Type);
                    //GESTIRE BENE IL TYPE
                    query1 += "(";
                    foreach (var piece in typePieces)
                    {
                        bool lastLoop = (index == typePieces.Length - 1);
                        if (!lastLoop)
                        {
                            query1 += $" [Type_Line] like '%{piece}%' AND ";
                        }
                        else
                        {
                            query1 += $" [Type_Line] like '%{piece}%' ";
                        }
                        index++;
                    }
                    query1 += ") AND";
                    index = 0;
                }

               
                if (obj.Sets.Length > 0)
                {
                    var sets = obj.Sets;
                    query1 += "(";
                    foreach (var set in sets)
                    {
                        bool lastLoop = (index == sets.Length - 1);
                        if (!lastLoop)
                        {
                            query1 += $" [Set] like '{set}' OR";
                        }
                        else
                        {
                            query1 += $" [Set] like '{set}'";
                        }
                        index++;
                    }
                    query1 += ") AND";
                    index = 0;
                }

               
                if (obj.ColorBlack || obj.ColorBlue || obj.ColorRed || obj.ColorWhite || obj.ColorGreen || obj.ColorColorless)
                {
                    var colorOption = obj.ColorValue;
                    var selectedColors = new List<string> { };

                    if (obj.ColorBlack)
                    {
                        selectedColors.Add("B");
                    }
                    if (obj.ColorGreen)
                    {
                        selectedColors.Add("G");
                    }
                    if (obj.ColorRed)
                    {
                        selectedColors.Add("R");
                    }
                    if (obj.ColorBlue)
                    {
                        selectedColors.Add("U");
                    }
                    if (obj.ColorWhite)
                    {
                        selectedColors.Add("W");
                    }

                    query1 += "(";
                    if (obj.ColorValue == "exact")
                    {
                        var colorText = "";
                        foreach (var color in selectedColors)
                        {
                            colorText += (color + ",");
                        }

                        if (!string.IsNullOrEmpty(colorText) && colorText.EndsWith(","))
                        {
                            query1 += $" [Colors] like '{colorText.TrimEnd(',')}'";
                        }
                        query1 += ") AND";
                    }
                    else if (obj.ColorValue == "including")
                    {
                        var colorText = "";
                        foreach (var color in selectedColors)
                        {
                            colorText += (color + ",");
                        }

                        if (!string.IsNullOrEmpty(colorText) && colorText.EndsWith(","))
                        {
                            query1 += $" [Colors] like '%{colorText.TrimEnd(',')}%' ";
                        }
                        query1 += ") AND";
                    }
                    else if (obj.ColorValue == "atMost")
                    {
                        var colorTextAnd = "";
                        var colorTextOr = "";

                        foreach (var color in selectedColors)
                        {
                            colorTextAnd += (color + ",");
                            colorTextOr += $" [Colors] like '{color}' OR";
                        }

                        if (!string.IsNullOrEmpty(colorTextAnd) && colorTextAnd.EndsWith(","))
                        {
                            query1 += $" [Colors] like '{colorTextAnd.TrimEnd(',')}' OR";
                        }
                        if (!string.IsNullOrEmpty(colorTextOr) && colorTextOr.EndsWith("OR"))
                        {
                            query1 += $" {colorTextOr.TrimEnd('R').TrimEnd('O')}";
                        }

                        query1 += ") AND";
                    }

                    if (obj.ColorColorless)
                    {
                        selectedColors.Clear();

                        if (obj.ColorValue == "exact" || obj.ColorValue == "atMost")
                        {
                            query1 += $" [Colors] like '' ";
                        }
                        query1 += ") AND";
                    }
                }



                if (obj.CommanderColorBlack|| obj.CommanderColorGreen || obj.CommanderColorRed || 
                    obj.CommanderColorBlue || obj.CommanderColorWhite || obj.CommanderColorColorless)
                {
                    var selectedCommanderColors = new List<string> { };
                    query1 += "(";

                    if (obj.CommanderColorBlack)
                    {
                        selectedCommanderColors.Add("B");
                    }
                    if (obj.CommanderColorGreen)
                    {
                        selectedCommanderColors.Add("G");
                    }
                    if (obj.CommanderColorRed)
                    {
                        selectedCommanderColors.Add("R");
                    }
                    if (obj.CommanderColorBlue)
                    {
                        selectedCommanderColors.Add("U");
                    }
                    if (obj.CommanderColorWhite)
                    {
                        selectedCommanderColors.Add("W");
                    }

                    var allColors = "";
                    foreach (var commanderColor in selectedCommanderColors)
                    {
                        query1 += $" [Color_Identity] like '{commanderColor}' OR ";
                        allColors += (commanderColor + ",");
                    }

                    if (!string.IsNullOrEmpty(allColors) && allColors.EndsWith(","))
                    {
                        allColors = allColors.TrimEnd(',');
                        query1 += $" [Color_Identity] like '{allColors}' ) AND";
                    }

                    if (obj.CommanderColorColorless)
                    {
                        query1 += $"[Color_Identity] like '' AND ";
                    }
                }

                if (!string.IsNullOrEmpty(obj.ManaCost))
                {
                    query1 += $"( [Mana_Cost] like '{obj.ManaCost}') AND";
                }

                if (!string.IsNullOrEmpty(obj.ValueAmount))
                {
                    var statsCheck = "";
                    query1 += "(";
                    var symbolValue = "";

                    if (obj.ValueEqual == "1")
                    {
                        symbolValue = "=";
                    }
                    if (obj.ValueEqual == "2")
                    {
                        symbolValue = "<";
                    }
                    if (obj.ValueEqual == "3")
                    {
                        symbolValue = ">";
                    }
                    if (obj.ValueEqual == "4")
                    {
                        symbolValue = "<=";
                    }
                    if (obj.ValueEqual == "5")
                    {
                        symbolValue = ">=";
                    }
                    if (obj.ValueEqual == "6")
                    {
                        symbolValue = "!=";
                    }

                    statsCheck += $" TRY_CAST(LEFT([Cmc], LEN([Cmc]) - 2) AS INT){symbolValue}{obj.ValueAmount} ";
                    query1 += $"{statsCheck}) AND";
                }


                if (obj.RarityCommon|| obj.RarityUncommon || obj.RarityRare || obj.RarityMythic)
                {
                    var rarityCheck = "";
                    query1 += "(";
                    if (obj.RarityCommon)
                    {
                        rarityCheck += "Rarity like 'common' OR ";
                    }
                    if (obj.RarityUncommon)
                    {
                        rarityCheck += "Rarity like 'uncommon' OR ";
                    }
                    if (obj.RarityRare)
                    {
                        rarityCheck += "Rarity like 'rare' OR ";
                    }
                    if (obj.RarityMythic)
                    {
                        rarityCheck += "Rarity like 'mythic' OR ";
                    }

                    if (rarityCheck.EndsWith(" OR "))
                    {
                        rarityCheck = rarityCheck.Substring(0, rarityCheck.Length - " OR ".Length);
                    }

                    query1 += $"{rarityCheck}) AND";
                }
              

                if (!string.IsNullOrEmpty(obj.FlavorText))
                {
                    var flavorText = ExtractWords(obj.FlavorText);
                    query1 += "(";
                    foreach (var piece in flavorText)
                    {
                        bool lastLoop = (index == flavorText.Length - 1);
                        if (!lastLoop)
                        {
                            query1 += $" [Flavor_Text] like '%{piece}%' AND ";
                        }
                        else
                        {
                            query1 += $" [Flavor_Text] like '%{piece}%'";
                        }
                        index++;
                    }
                    query1 += ")";
                }
                query1 += "(";
                query1 += ")";
                index = 0;
                query1 = query1.Replace("  ", "");
                query1 = query1.Replace("AND()","");
                query1 = query1.Replace("()", "");
                query1 += " ORDER BY [Name] ASC";
                return query1;

            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return "";
            }
        }

        static string[] ExtractWords(string input)
        {
            // Rimuovi i caratteri speciali tranne spazi e lettere
            string cleanedPhrase = Regex.Replace(input, @"[^a-zA-Z\s]", "");

            // Spezza la frase in array di stringhe usando lettere maiuscole e spazi come delimitatori
            string[] wordsArray = Regex.Split(cleanedPhrase, @"(?<!^)(?=[A-Z])|(?<=\s)");

            // Filtra le stringhe vuote
            wordsArray = wordsArray
            .Where(word => !string.IsNullOrEmpty(word))
            .Select(word => word.TrimEnd())  // Rimuovi spazi vuoti alla fine di ogni stringa
            .ToArray();

            return wordsArray;
        }
    }

}
