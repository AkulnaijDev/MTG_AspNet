using CardGame.GameLogic;
using CardGame.GameLogic.Models;
using CardGame.Models;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Globalization;
using System.IO.Pipelines;
using System.Linq;
using System.Text.RegularExpressions;
using Utils;
using static System.Collections.Specialized.BitVector32;
using static System.Net.Mime.MediaTypeNames;

namespace CardGame.Hubs
{
    public class ChatHub : Hub
    {
        public static List<Room> _roomList = new();
        public static List<GameStatus> _matchesCurrentlyOn = new();

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
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Trova l'indice dell'utente disconnesso
            var disconnectedUserIndex = UserHandler.Users.FindIndex(x => x.ConnectionId == Context.ConnectionId);

            if (disconnectedUserIndex == -1)
            {
                // Se l'utente non è stato trovato, esci dalla funzione
                return;
            }

            var userDisconnected = UserHandler.Users[disconnectedUserIndex];
            var user = JsonConvert.SerializeObject(userDisconnected);

            // Cerca e rimuovi l'utente dall'elenco
            var userToRemove = UserHandler.Users.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
            if (userToRemove != null)
            {
                UserHandler.Users.Remove(userToRemove);
                UserHandler.ConnectedIds.Remove(Context.ConnectionId);
            }

            var username = userDisconnected.UserName;
            var room = _roomList.FirstOrDefault(x => x.Players.Any(y => y.Name == username));
            var roomId = room?.RoomId;

            var currentMatch = _matchesCurrentlyOn.FirstOrDefault(x => x.PlayerStatuses.Any(y => y.Name == username));

            if (currentMatch != null)
            {
                var teamOfLeavingPlayer = currentMatch.Game.Teams.FirstOrDefault(x => x.Teammates.Any(y => y.Name == username));
                var teammates = teamOfLeavingPlayer?.Teammates;
                var otherPlayers = teammates?.Where(x => x.Name != username);

                // Rimozione del giocatore dalla partita e dalla stanza
                await currentMatch.RemovePlayer(username);
                await room?.RemovePlayer(username);

                // Se ci sono altri giocatori nella squadra, invia notifica
                if (otherPlayers?.Count() > 0)
                {
                    await Clients.Group(roomId).SendAsync("SomeoneLeft", username);
                }
                else
                {
                    // Altrimenti segnala vittoria e rimuovi la partita
                    await Clients.Group(roomId).SendAsync("YouWon", username);
                    _matchesCurrentlyOn.Remove(currentMatch);
                    _roomList.Remove(room);
                }
            }

            // Notifica disconnessione a tutti
            await Clients.All.SendAsync("NotifyMe_Disconnected", user);

            Context.Abort();
            await base.OnDisconnectedAsync(exception);
        }

        //Login with name
        public async Task Login(string username)
        {
            var user = new User(Context.ConnectionId, username);

            if (UserHandler.Users.Any(x=> x.UserName == username))
            {
                await Clients.Caller.SendAsync("TellAlreadyLoggedIn");
            } 
            else
            {
                UserHandler.Users.Add(user);
                var obj = JsonConvert.SerializeObject(UserHandler.Users);

                await Clients.Caller.SendAsync("ApprovedLogin");
                await Clients.All.SendAsync("Notify_Login", obj);
            }

           
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

        public async Task AbandonGame(string username)
        {
            var room = _roomList.Where(x => x.Players.Any(y => y.Name == username)).FirstOrDefault();
            var roomId = room?.RoomId;

            var currentMatch = _matchesCurrentlyOn.Where(x => x.PlayerStatuses.Any(y => y.Name == username)).FirstOrDefault();

            var teamOfLeavingPlayer = currentMatch.Game.Teams.Where(x=> x.Teammates.Any(y=> y.Name==username));
            var teammates = teamOfLeavingPlayer?.Select(x=> x.Teammates).FirstOrDefault();
            var otherPlayers = teammates?.Where(x => x.Name != username);


            await _matchesCurrentlyOn.Where(x => x.Game.RoomId == roomId).FirstOrDefault().RemovePlayer(username);
            await _roomList.Where(x => x.RoomId == roomId).FirstOrDefault().RemovePlayer(username);

            if (otherPlayers?.Count()>0)
            {
                await Clients.Group(roomId).SendAsync("SomeoneLeft", username);
            } 
            else 
            {
                await Clients.Group(roomId).SendAsync("YouWon", username);
                _matchesCurrentlyOn.Remove(_matchesCurrentlyOn.Where(x=>x.Game.RoomId==roomId).FirstOrDefault());
                _roomList.Remove(room);
            }
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
                await Clients.Client(playerId).SendAsync("ConfirmSavedSettings", result);

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
        
        public async Task StartTheActualGame(string startingGamePlayerId, string teams)
        {
            var room = _roomList.Where(x => x.Players.Any(y => y.PlayerId == startingGamePlayerId)).FirstOrDefault();
            var roomId = room.RoomId;
            var players = room.Players;
            var gameTeams = JsonConvert.DeserializeObject<SentTeams>(teams).Teams;
            var myPlayerStatus = new List<PlayerStatus>();

            foreach (var player in players)
            {
                var playerDeck = SqlUtils.GetPlayableVersionOfTheDeck(player.DeckId);

                var dealedCards = GameUtils.DrawCardsAndShuffle(playerDeck,7);

                var playerStatus = new PlayerStatus
                {
                    Name = player.Name,
                    PlayerId = player.PlayerId,
                    Hp = room.GameMode.ToLower() == "commander" ? 40 : 20,
                    Deck = dealedCards[1],
                    Hand = dealedCards[0],
                    Exiled = new List<GameCard>(),
                    Graveyard = new List<GameCard>(),
                    LandZone = new List<GameCard>(),
                    GameZone = new List<GameCard>(),
                    CommanderZone = new List<GameCard>(),
                    PlaneswalkerZone = new List<GameCard>(),
                };

                myPlayerStatus.Add(playerStatus);
            }

            var game = new Game
            {
                RoomId = roomId,
                GameMode = room.GameMode,
                Teams = gameTeams,
            };

            var gameStatus = new GameStatus
            {
                Game = game,
                PlayerStatuses = myPlayerStatus
            };

            //var taskDone = await UpdateGameManager(gameStatus);
            _matchesCurrentlyOn.Add(gameStatus);

            var gameStatusObj = JsonConvert.SerializeObject(gameStatus);
            await Clients.Group(roomId).SendAsync("DisplayGameBoard", gameStatusObj);
        }

        public async Task GetListOfAllTheTokens(string game)
        {
            try
            {
                var allTokens = SqlUtils.GetAllTokens();
                var gameAction = JsonConvert.DeserializeObject<Game>(game);
                var roomId = gameAction.RoomId;

                await Clients.Group(roomId).SendAsync("ShowTokens", JsonConvert.SerializeObject(allTokens));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
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

                cards = cards.OrderBy(x => x.Name.Trim(), StringComparer.OrdinalIgnoreCase).ToList();

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



                if (obj.CommanderColorBlack || obj.CommanderColorGreen || obj.CommanderColorRed ||
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


                if (obj.RarityCommon || obj.RarityUncommon || obj.RarityRare || obj.RarityMythic)
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
                query1 = query1.Replace("AND()", "");
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
            string cleanedPhrase = Regex.Replace(input, @"[^a-zA-Z\s/]+", "");

            // Spezza la frase in array di stringhe usando lettere maiuscole e spazi come delimitatori
            string[] wordsArray = Regex.Split(cleanedPhrase, @"(?<!^)(?=[A-Z])|(?<=\s)");

            // Filtra le stringhe vuote
            wordsArray = wordsArray
            .Where(word => !string.IsNullOrEmpty(word))
            .Select(word => word.TrimEnd())  // Rimuovi spazi vuoti alla fine di ogni stringa
            .ToArray();

            return wordsArray;
        }

        //REGIONE _ GAME LOGIC
        public async Task PlaySelectedToken(string player, string selectedToken, string howManyToken, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);

                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;
                var newGameStatus = storedGameStatus;

                var card = JsonConvert.DeserializeObject<GameCard>(selectedToken);

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == player)
                    {
                        var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                        for (var i=0; i < Convert.ToInt32(howManyToken); i++)
                        {
                            card.Guid = Guid.NewGuid().ToString();
                            updatedPlayer.GameZone.Add(card);
                        }
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task UpdateState_CardPlayed(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardPlayed>(action);

                if (gameAction == null || gameAction.CardGuid == null)
                {
                    await Task.CompletedTask;
                }
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);

                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                //order the list to achieve correct "card" variable data filling
                storedPlayerStatuses.Sort((x, y) =>
                {
                    if (x.Name == gameAction.From.Player && y.Name != gameAction.From.Player)
                        return -1;
                    else if (x.Name != gameAction.From.Player && y.Name == gameAction.From.Player)
                        return 1;
                    else
                        return x.Name.CompareTo(y.Name);
                });

                var newGameStatus = storedGameStatus;
                var card = new GameCard();

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == gameAction.From.Player)
                    {
                        //togli carta
                        if (gameAction.From.Zone == "cardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First( x=> x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.GameZone.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.GameZone.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "handZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Hand.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.Hand.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "landZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.LandZone.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.LandZone.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "exiledZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Exiled.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.Exiled.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "graveyardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Graveyard.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.Graveyard.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "planeswalkerZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.PlaneswalkerZone.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.PlaneswalkerZone.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "commanderZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.CommanderZone.First(x => x.Guid == gameAction.CardGuid);
                            card = cardToRemove;
                            updatedPlayer.CommanderZone.Remove(cardToRemove);
                        }
                    }

                    if (playerStatus.Name == gameAction.To.Player)
                    {
                        //aggiungi carta
                        if (gameAction.To.Zone == "cardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.GameZone.Add(card);
                        }
                        if (gameAction.To.Zone == "handZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                            {
                                card.Statuses.Remove(GameCardConstants.TappedStatus);
                            }

                            if (!card.Source.ToLower().Contains("_token"))  //if token dies is removed from game
                            {
                                updatedPlayer.Hand.Add(card);
                            }

                            card.Counters.Clear();

                        }
                        if (gameAction.To.Zone == "landZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.LandZone.Add(card);
                        }
                        if (gameAction.To.Zone == "exiledZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                            {
                                card.Statuses.Remove(GameCardConstants.TappedStatus);
                            }
                            
                            if (!card.Source.ToLower().Contains("_token"))  //if token dies is removed from game
                            {
                                updatedPlayer.Exiled.Add(card);
                            }
                            card.Counters.Clear();
                        }
                        if (gameAction.To.Zone == "graveyardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                            {
                                card.Statuses.Remove(GameCardConstants.TappedStatus);
                            }

                            if (!card.Source.ToLower().Contains("_token"))  //if token dies is removed from game
                            {
                                updatedPlayer.Graveyard.Add(card);
                            }
                            card.Counters.Clear();

                        }
                        if (gameAction.To.Zone == "planeswalkerZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                            {
                                card.Statuses.Remove(GameCardConstants.TappedStatus);
                            }
                            updatedPlayer.PlaneswalkerZone.Add(card);
                        }
                        if (gameAction.To.Zone == "commanderZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                            {
                                card.Statuses.Remove(GameCardConstants.TappedStatus);
                            }
                            updatedPlayer.CommanderZone.Add(card);
                        }
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

       
        public async Task UpdateState_CardDrawn(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardPlayed>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;
                var card = new GameCard();

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == gameAction.From.Player)
                    {
                        if (gameAction.From.Zone == "deckZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Deck.First();
                            card = cardToRemove;
                            updatedPlayer.Deck.Remove(cardToRemove);
                        }
                    }

                    if (playerStatus.Name == gameAction.To.Player)
                    {
                        if (gameAction.To.Zone == "handZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.Hand.Add(card);
                        }
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }


        public async Task UpdateState_CardPlayedFromDeck(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardPlayed>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;
                var card = new GameCard();

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == gameAction.From.Player)
                    {
                        if (gameAction.From.Zone == "deckZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Deck.First();
                            card = cardToRemove;
                            updatedPlayer.Deck.Remove(cardToRemove);
                        }
                    }

                    if (playerStatus.Name == gameAction.To.Player)
                    {
                        if (gameAction.To.Zone == "cardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.GameZone.Add(card);
                        }
                        if (gameAction.To.Zone == "handZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.Hand.Add(card);
                        }
                        if (gameAction.To.Zone == "landZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.LandZone.Add(card);
                        }
                        if (gameAction.To.Zone == "exiledZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.Exiled.Add(card);
                        }
                        if (gameAction.To.Zone == "graveyardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.Graveyard.Add(card);
                        }
                        if (gameAction.To.Zone == "planeswalkerZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.PlaneswalkerZone.Add(card);
                        }
                        if (gameAction.To.Zone == "commanderZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            updatedPlayer.CommanderZone.Add(card);
                        }
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task UpdateState_Mulligan(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<MulliganAction>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;
                var howManyCards = 0;

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == gameAction.Username)
                    {
                        var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                        howManyCards = updatedPlayer.Hand.Count - 1;

                        if (howManyCards >= 1)
                        {
                            // Copia delle carte in mano in una nuova lista
                            var cardsToMove = updatedPlayer.Hand.ToList();

                            // Rimuove le carte dalla mano e le aggiunge al mazzo
                            updatedPlayer.Hand.Clear();
                            updatedPlayer.Deck.AddRange(cardsToMove);

                            // Mescola il mazzo e seleziona X carte casuali
                            Random rand = new Random();
                            var randomElements = updatedPlayer.Deck.OrderBy(x => rand.Next()).Take(howManyCards).ToList();

                            // Aggiunge le carte selezionate alla mano
                            updatedPlayer.Hand.AddRange(randomElements);
                        }
                    }
                }

                _matchesCurrentlyOn.Remove(storedGameStatus);
                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;
                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task UpdateState_RemoveCounterFromCard(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardCounterRemoved>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;
                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == gameAction.Player)
                    {
                        if (gameAction.Zone == "landZone")
                        {
                            var cardCounters = playerStatus.LandZone.Where(x => x.Guid == gameAction.CardGuid).FirstOrDefault().Counters;
                            var cardHasCounters  = cardCounters.Any(x => x.Type == gameAction.Type);
                            
                            if (cardHasCounters)
                            {
                                var newQuantity = cardCounters.Where(x => x.Type == gameAction.Type).FirstOrDefault().Quantity - 1;
                                if (newQuantity > 0)
                                {
                                    cardCounters.Where(x => x.Type == gameAction.Type).FirstOrDefault().Quantity = newQuantity;
                                }
                                else
                                {
                                    cardCounters.Remove(cardCounters.Where(x => x.Type == gameAction.Type).FirstOrDefault());
                                }
                            }
                        }

                        if (gameAction.Zone == "cardZone")
                        {
                            var cardCounters = playerStatus.GameZone.Where(x => x.Guid == gameAction.CardGuid).FirstOrDefault().Counters;
                            var cardHasCounters = cardCounters.Any(x => x.Type == gameAction.Type);

                            if (cardHasCounters)
                            {
                                var newQuantity = cardCounters.Where(x => x.Type == gameAction.Type).FirstOrDefault().Quantity - 1;
                                if (newQuantity > 0)
                                {
                                    cardCounters.Where(x => x.Type == gameAction.Type).FirstOrDefault().Quantity = newQuantity;
                                }
                                else
                                {
                                    cardCounters.Remove(cardCounters.Where(x => x.Type == gameAction.Type).FirstOrDefault());
                                }
                            }
                        }
                    }
                }
                _matchesCurrentlyOn.Remove(storedGameStatus);
                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;
                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task UpdateState_CardChangeStatusFromGame(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardChangedStatus>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;

                foreach (var playerStatus in storedPlayerStatuses)
                {

                    if (playerStatus.Name == gameAction.Player)
                    {
                        if (gameAction.Zone == "handZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);

                            if (gameAction.Action == GameCardConstants.MorphedStatus)
                            {
                                var card = updatedPlayer.Hand.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.MorphedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.MorphedStatus);
                                }
                                else
                                {
                                    card.Statuses.Add(GameCardConstants.MorphedStatus);
                                }
                               
                                updatedPlayer.Hand.Remove(card);
                                updatedPlayer.GameZone.Add(card);
                            }
                        }
                        if (gameAction.Zone == "cardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);

                            if (gameAction.Action == GameCardConstants.TransformedStatus)
                            {
                                var card = updatedPlayer.GameZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && (card.Source.Contains("_front_") || card.Source.Contains("_back_")) && card.Statuses != null  && card.Statuses.Contains(GameCardConstants.TransformedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.TransformedStatus);

                                    if (card.Source.Contains("_back_"))
                                    {
                                        card.Source = card.Source.Replace("_back_", "_front_");
                                    }
                                } 
                                else
                                {
                                    card.Statuses.Add(GameCardConstants.TransformedStatus);
                                    if (card.Source.Contains("_front_"))
                                    {
                                        card.Source = card.Source.Replace("_front_", "_back_");
                                    }
                                }
                            }

                            if (gameAction.Action == GameCardConstants.MorphedStatus)
                            {
                                var card = updatedPlayer.GameZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.MorphedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.MorphedStatus);
                                }
                                else
                                {
                                    card.Statuses.Add(GameCardConstants.MorphedStatus);
                                }
                            }

                            if (gameAction.Action == GameCardConstants.AddedCounterStatus)
                            {
                                var card = updatedPlayer.GameZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);
                                var counterToAdd = gameAction.Counters.FirstOrDefault();

                                if (card != null && card.Counters != null && card.Counters.Any(x => x.Type == counterToAdd.Type))
                                {
                                    var actualQuantity = card.Counters.Where(x => x.Type == counterToAdd.Type).FirstOrDefault().Quantity;

                                    card.Counters.Where(x=>x.Type == counterToAdd.Type).FirstOrDefault().Quantity = (actualQuantity+1);
                                }
                                else if(card != null && card.Counters != null && !card.Counters.Any(x => x.Type == counterToAdd.Type))
                                {
                                    card.Counters.Add(counterToAdd);
                                }
                            }
                        }
                        if (gameAction.Zone == "landZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);

                            if (gameAction.Action == GameCardConstants.TransformedStatus)
                            {
                                var card = updatedPlayer.LandZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && (card.Source.Contains("_front_") || card.Source.Contains("_back_")) && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TransformedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.TransformedStatus);

                                    if (card.Source.Contains("_back_"))
                                    {
                                        card.Source =  card.Source.Replace("_back_", "_front_");
                                    }
                                }
                                else
                                {
                                    card.Statuses.Add(GameCardConstants.TransformedStatus);
                                    if (card.Source.Contains("_front_"))
                                    {
                                        card.Source = card.Source.Replace("_front_", "_back_");
                                    }
                                }
                            }

                            if (gameAction.Action == GameCardConstants.MorphedStatus)
                            {
                                var card = updatedPlayer.LandZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.MorphedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.MorphedStatus);
                                }
                                else
                                {
                                    card.Statuses.Add(GameCardConstants.MorphedStatus);
                                }
                            }

                            if (gameAction.Action == GameCardConstants.AddedCounterStatus)
                            {
                                var card = updatedPlayer.LandZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);
                                var counterToAdd = gameAction.Counters.FirstOrDefault();

                                if (card != null && card.Counters != null && card.Counters.Any(x => x.Type == counterToAdd.Type))
                                {
                                    var actualQuantity = card.Counters.Where(x => x.Type == counterToAdd.Type).FirstOrDefault().Quantity;

                                    card.Counters.Where(x => x.Type == counterToAdd.Type).FirstOrDefault().Quantity = (actualQuantity + 1);
                                }
                                else if (card != null && card.Counters != null && !card.Counters.Any(x => x.Type == counterToAdd.Type))
                                {
                                    card.Counters.Add(counterToAdd);
                                }
                            }

                        }


                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task UpdateState_CardToDeckFromGame(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardPlayedTopOrBottom>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;
                var card = new GameCard();

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == gameAction.From.Player)
                    {
                        if (gameAction.From.Zone == "handZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Hand.Where(x => x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.Hand.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "cardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.GameZone.Where(x=>x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.GameZone.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "landZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.LandZone.Where(x => x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.LandZone.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "graveyardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Graveyard.Where(x => x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.Graveyard.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "exiledZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.Exiled.Where(x => x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.Exiled.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "planeswalkerZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.PlaneswalkerZone.Where(x => x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.PlaneswalkerZone.Remove(cardToRemove);
                        }
                        if (gameAction.From.Zone == "commanderZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            var cardToRemove = updatedPlayer.CommanderZone.Where(x => x.Guid == gameAction.CardGuid).First();
                            card = cardToRemove;
                            updatedPlayer.CommanderZone.Remove(cardToRemove);
                        }
                    }

                    if (playerStatus.Name == gameAction.To.Player)
                    {
                        if (gameAction.To.Zone == "deckZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);

                            if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                            {
                                card.Statuses.Remove(GameCardConstants.TappedStatus);
                            }

                            if (!card.Source.ToLower().Contains("_token"))  //token can't go back in deck
                            {
                                if (gameAction.TopBottom == "top")
                                {
                                    updatedPlayer.Deck.Insert(0, card);
                                }
                                else
                                {
                                    updatedPlayer.Deck.Add(card);
                                }
                            }
                            
                        }
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task TapCard(string action)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<ActionCardPlayedTapUntap>(action);
                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.Game.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;

                foreach (var playerStatus in storedPlayerStatuses)
                {

                    if (playerStatus.Name == gameAction.Player)
                    {
                        if (gameAction.Zone == "cardZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (gameAction.TapUntap == "Untap")
                            {
                                var card = updatedPlayer.GameZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.TappedStatus);
                                }
                            }
                            if (gameAction.TapUntap == "Tap")
                            {
                                updatedPlayer.GameZone.Where(x => x.Guid == gameAction.CardGuid).First().Statuses.Add(GameCardConstants.TappedStatus);
                            }
                        }
                        if (gameAction.Zone == "landZone")
                        {
                            var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                            if (gameAction.TapUntap == "Untap")
                            {
                                var card = updatedPlayer.LandZone.FirstOrDefault(x => x.Guid == gameAction.CardGuid);

                                if (card != null && card.Statuses != null && card.Statuses.Contains(GameCardConstants.TappedStatus))
                                {
                                    card.Statuses.Remove(GameCardConstants.TappedStatus);
                                }
                            }
                            if (gameAction.TapUntap == "Tap")
                            {
                                updatedPlayer.LandZone.Where(x => x.Guid == gameAction.CardGuid).First().Statuses.Add(GameCardConstants.TappedStatus);
                            }
                        }
                       
                       
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;

                await Clients.Group(roomId).SendAsync("UpdateGameBoard", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task ShowMeCertainZone(string playerInspecting, string playerInspected, string inspectedZone, string howManyCards, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);
                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var requestingPlayer = storedPlayerStatuses.Where(x => x.Name == playerInspecting).First().PlayerId;
                var requestedStatus = storedPlayerStatuses.Where(x => x.Name == playerInspected).First();

                var requestedZone = requestedStatus.Deck;

                if (inspectedZone == "graveyard")
                {
                    requestedZone = requestedStatus.Graveyard;
                }
                if (inspectedZone == "exiled")
                {
                    requestedZone = requestedStatus.Exiled;
                }
                if (inspectedZone == "hand")
                {
                    requestedZone = requestedStatus.Hand;
                }

                var result = new List<GameCard>(requestedZone);

                if (Convert.ToInt32(howManyCards)!=0)  //handle if request > how many are in the zone?
                {
                    result = result.Take(Convert.ToInt32(howManyCards)).ToList();
                }

                await Clients.Client(requestingPlayer).SendAsync("ShowSneakedZone", JsonConvert.SerializeObject(result));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task LogGameEvents(string text, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);
                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var roomId = gameAction.RoomId;

                await Clients.Group(roomId).SendAsync("DispatchLogGameEvent", JsonConvert.SerializeObject(text));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task LogGameEventsNew(string action, string words, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);
                var gameWords = JsonConvert.DeserializeObject<List<string>>(words);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);
                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var roomId = gameAction.RoomId;

                var text = GetTextTranslated(action, gameWords);

                await Clients.Group(roomId).SendAsync("DispatchLogGameEvent", JsonConvert.SerializeObject(text));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public string GetCounterTextTranslated(string counterType)
        {
            switch (counterType.ToLower())
            {
                case "trample":
                    return "Travolgere";
                case "doublestrike":
                    return "DoppioAttacco";
                case "FirstStrike":
                    return "AttaccoImprovviso";
                case "deathTouch":
                    return "ToccoLetale";
                case "lifelink":
                    return "Legame Vitale";
                case "shroud":
                    return "Velo";
                case "hexproof":
                    return "Antimalocchio";
                case "caution":
                    return "Cautela";
                case "poison":
                    return "Veleno";
                case "infect":
                    return "Infettare";
                case "flying":
                    return "Volare";
                default:
                    return counterType;
            }
        }

        public (string, string) GetTextTranslated(string action, List<string> words)
        {
            switch (action)
            {
                case "drawingCard":
                    return ($"{words[0]} is drawing a card from {words[1]} deck", $"{words[0]} sta pescando una carta dal deck di {words[1]}");
                case "untappingCard":
                    return ($"{words[0]} untapped {words[1]}", $"{words[0]} ha stappato {words[1]}");
                case "tappingCard":
                    return ($"{words[0]} tapped {words[1]}", $"{words[0]} ha tappato {words[1]}");
                case "cardFromDeck":
                    return ($"{words[0]} played a card from {words[1]} deck", $"{words[0]} ha giocato una carta dal deck di {words[1]}");
                case "transformedCard":
                    return ($"{words[0]} transformed {words[1]}", $"{words[0]} ha trasformato {words[1]}");
                case "morphedCard":
                    return ($"{words[0]} played a morphed card", $"{words[0]} ha giocato una carta morphata");
                case "cardIntoDeck":
                    return ($"{words[0]} put a card back to {words[0]} deck", $"{words[0]} ha messo una carta nel deck di {words[0]}");
                case "playerInspecting":
                    return ($"{words[0]} is checking {words[1]} deck", $"{words[0]} sta guardando il deck di {words[1]}");
                case "playerAction":
                    return ($"{words[0]} {words[1]} {words[2]} cards from his/her deck", $"{words[0]} {words[1]} {words[2]} carte dal suo deck");
                case "playerCantDoAction":
                    return ($"{words[0]} can't complete this action", $"{words[0]} non può fare questa azione");
                case "shuffleDeck":
                    return ($"{words[0]} shuffled {words[1]} deck", $"{words[0]} sta mescolando il deck di {words[1]}");
                case "checkingDeck":
                    return ($"{words[0]} is checking {words[1]} deck", $"{words[0]} sta guardando il deck di {words[1]}");
                case "mulligan":
                    return ($"{words[0]} decided to mulligan", $"{words[0]} ha mulligato");
                case "cemeteryLooking":
                    return ($"{words[0]} is checking {words[1]} graveyard", $"{words[0]} sta guardando il cimitero di {words[1]}");
                case "exiledLooking":
                    return ($"{words[0]} is checking {words[1]} exiled zone", $"{words[0]} sta guardando l'esilio di {words[1]}");
                case "handLooking":
                    return ($"{words[0]} is checking {words[1]} hand", $"{words[0]} sta guardando la mano di {words[1]}");
                case "hpDecreasing":
                    return ($"{words[0]} is decreasing {words[1]} hp", $"{words[0]} sta calando gli hp di {words[1]}");
                case "hpIncreasing":
                    return ($"{words[0]} is increasing {words[1]} hp", $"{words[0]} sta aumentando gli hp di {words[1]}");
                case "cardMoving":
                    return ($"{words[0]} moved {words[1]} from {words[2]} {words[3]} to {words[4]} {words[5]}", $"{words[0]} sta muovendo {words[1]} da {words[3]} di {words[2]} a {words[5]} di {words[4]}");
                case "counterOnCard":
                    return ($"{words[0]} put {words[3]} {words[1]} counters on {words[2]}", $"{words[0]} ha messo {words[3]} segnalini {GetCounterTextTranslated(words[1])} su {words[2]}");
                default:
                    return ("","");
            }
        }

        public async Task ModifyPlayerHp(string playerUsername, string action, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == playerUsername)
                    {
                        var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                        
                        if (action == "increase")
                        {
                            updatedPlayer.Hp += 1;
                        } 
                        else
                        {
                            updatedPlayer.Hp -= 1;
                        }
                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;
                await Clients.Group(roomId).SendAsync("DispatchPlayerHP", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task ShufflePlayerDeck(string playerUsername, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == playerUsername)
                    {
                        var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);

                        updatedPlayer.Deck = GameUtils.Shuffle(updatedPlayer.Deck);

                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;
                await Clients.Group(roomId).SendAsync("DispatchPlayerHP", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

        public async Task ExileCardsFromPlayerDeck(string playerUsername, string action, string howManyCards, string fromTop, string game)
        {
            try
            {
                var gameAction = JsonConvert.DeserializeObject<Game>(game);

                var storedGameStatus = _matchesCurrentlyOn.First(x => x.Game.RoomId == gameAction.RoomId);
                _matchesCurrentlyOn.Remove(storedGameStatus);

                var storedGame = storedGameStatus.Game;
                var storedPlayerStatuses = storedGameStatus.PlayerStatuses;

                var newGameStatus = storedGameStatus;

                foreach (var playerStatus in storedPlayerStatuses)
                {
                    if (playerStatus.Name == playerUsername)
                    {
                        var updatedPlayer = newGameStatus.PlayerStatuses.First(x => x.Name == playerStatus.Name);
                       
                        var howMany = Convert.ToInt32(howManyCards);
                        if (fromTop=="top")
                        {
                            if (updatedPlayer.Deck.Count>=howMany)
                            {
                                var firstElements = updatedPlayer.Deck.Take(howMany).ToList();
                                updatedPlayer.Deck.RemoveRange(0, howMany);

                                if (action == "discard")
                                {
                                    updatedPlayer.Graveyard.AddRange(firstElements);
                                } else
                                {
                                    updatedPlayer.Exiled.AddRange(firstElements);
                                }
                                
                            }
                           
                        } 
                        else
                        {
                            if (updatedPlayer.Deck.Count >= howMany)
                            {
                                int count = updatedPlayer.Deck.Count;
                                var lastElements = updatedPlayer.Deck.Skip(count - howMany).ToList();
                                updatedPlayer.Deck.RemoveRange(count - howMany, howMany);

                                if (action == "discard")
                                {
                                    updatedPlayer.Graveyard.AddRange(lastElements);
                                }
                                else
                                {
                                    updatedPlayer.Exiled.AddRange(lastElements);
                                }
                            }
                        }

                    }
                }

                _matchesCurrentlyOn.Add(newGameStatus);

                var roomId = newGameStatus.Game.RoomId;
                await Clients.Group(roomId).SendAsync("DispatchExiledCards", JsonConvert.SerializeObject(newGameStatus));
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }

    }
}