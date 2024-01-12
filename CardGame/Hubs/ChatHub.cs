using CardGame.Models;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
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
    }

}