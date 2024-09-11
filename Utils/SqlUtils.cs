using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text;
using Utils.Models;

namespace Utils
{
    public class SqlUtils
    {
        public static string _connectionString = "Data Source=(LocalDB)\\MSSQLLocalDB;Initial Catalog = MagicTheGathering; Integrated Security = True";

        public static void NonQueryRequest(string queryString)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Connection.Open();
                command.ExecuteNonQuery();
            }
        }

        public static string SaveMySettings(UserSettings userSettings)
        {
            var queryString = $@"
                DECLARE @OperationResult VARCHAR(50);
                IF NOT EXISTS (SELECT 1 FROM UserSettings WHERE Username = @Username)
                    BEGIN
                        INSERT INTO UserSettings (Username, Volume, BackgroundImage, Theme, Language, Soundtrack)
                        VALUES (@Username, @Volume, @BackgroundImage, @Theme, @Language, @Soundtrack)
                        SET @OperationResult = 'Insertion successful';
                    END
                ELSE
                    BEGIN
                        UPDATE UserSettings
                        SET Volume = @Volume, BackgroundImage = @BackgroundImage, Theme = @Theme, Language = @Language, Soundtrack = @Soundtrack
                        WHERE Username = @Username
                        SET @OperationResult = 'Update successful';
                    END

                SELECT @OperationResult AS OperationResult;
            ";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@Username", userSettings.Username);
                command.Parameters.AddWithValue("@Volume", userSettings.Volume);
                command.Parameters.AddWithValue("@BackgroundImage", userSettings.Background);
                command.Parameters.AddWithValue("@Theme", userSettings.Theme);
                command.Parameters.AddWithValue("@Language", userSettings.Language);
                command.Parameters.AddWithValue("@Soundtrack", userSettings.Soundtrack);

                command.Connection.Open();
                var operationResult = command.ExecuteScalar();

                if (operationResult != null)
                {
                    return operationResult.ToString();
                }
                else
                {
                    return "Error"; // o un valore appropriato in caso di errore
                }
            }
        }

        public static void DeleteDeck(string deckId, string username)
        {
            var queryString = "DELETE FROM Decks WHERE UserId = @username AND Id = @deckId";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@username", username);
                command.Parameters.AddWithValue("@deckId", deckId);

                connection.Open();
                command.ExecuteNonQuery();
            }
        }

        public static void EditDeck(DeckItem deck, string deckId)
        {
            var queryString = new StringBuilder("UPDATE Decks SET Id = @deckId");

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand();
                command.Connection = connection;
                command.Parameters.AddWithValue("@deckId", deckId);

                for (var i = 0; i < deck.Cards.Count; i++)
                {
                    if (deck.Cards[i] != null)
                    {
                        var paramName = $"@Card{i.ToString().PadLeft(3, '0')}";
                        var text1 = $", [Card{i.ToString().PadLeft(3, '0')}] = {paramName}";
                        var deckString = JsonConvert.SerializeObject(deck.Cards[i]).Replace("'", "''");

                        queryString.Append(text1);
                        command.Parameters.AddWithValue(paramName, deckString);
                    }
                }

                queryString.Append(" WHERE Id = @deckId");
                command.CommandText = queryString.ToString();

                connection.Open();
                command.ExecuteNonQuery();
            }
        }


        public static string SaveDeck(DeckItem deck)
        {
            var guid = Guid.NewGuid().ToString();
            var deckString = "";

            for (var i = 1; i <= deck.Cards.Count; i++)
            {
                if (deck.Cards[i - 1] is not null)
                {
                    deckString += (",'" + JsonConvert.SerializeObject(deck.Cards[(i - 1)]).Replace("'", "''") + "'");
                }
            }

            for (var i = (deck.Cards.Count + 1); i <= 100; i++)
            {
                deckString += ", NULL";
            }

            var queryString = "INSERT INTO Decks (" +
            $"Id,Name,UserId," +
            $"[Card001],[Card002],[Card003],[Card004],[Card005],[Card006],[Card007],[Card008],[Card009],[Card010]," +
            $"[Card011],[Card012],[Card013],[Card014],[Card015],[Card016],[Card017],[Card018],[Card019],[Card020]," +
            $"[Card021],[Card022],[Card023],[Card024],[Card025],[Card026],[Card027],[Card028],[Card029],[Card030]," +
            $"[Card031],[Card032],[Card033],[Card034],[Card035],[Card036],[Card037],[Card038],[Card039],[Card040]," +
            $"[Card041],[Card042],[Card043],[Card044],[Card045],[Card046],[Card047],[Card048],[Card049],[Card050]," +
            $"[Card051],[Card052],[Card053],[Card054],[Card055],[Card056],[Card057],[Card058],[Card059],[Card060]," +
            $"[Card061],[Card062],[Card063],[Card064],[Card065],[Card066],[Card067],[Card068],[Card069],[Card070]," +
            $"[Card071],[Card072],[Card073],[Card074],[Card075],[Card076],[Card077],[Card078],[Card079],[Card080]," +
            $"[Card081],[Card082],[Card083],[Card084],[Card085],[Card086],[Card087],[Card088],[Card089],[Card090]," +
            $"[Card091],[Card092],[Card093],[Card094],[Card095],[Card096],[Card097],[Card098],[Card099],[Card100]" +
            $") " +
            $" OUTPUT Inserted.Id VALUES (" +
            $"'{guid}', '{deck.Name}', '{deck.UserId}' " +
            deckString +
            $" ) ";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Connection.Open();
                var id = command.ExecuteScalar();
                return id.ToString();
            }
        }

        public static UserSettings GetUserSettings(string username)
        {
            var queryString = $"SELECT * From UserSettings Where Username = @username";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@username", username);

                using (SqlDataReader reader = command.ExecuteReader())
                {
                    var userSetting = new UserSettings { };

                    while (reader.Read())
                    {

                        userSetting.Username = reader["Username"].ToString();
                        userSetting.Volume = reader["Volume"].ToString();
                        userSetting.Background = reader["BackgroundImage"].ToString();
                        userSetting.Theme = reader["Theme"].ToString();
                        userSetting.Language = reader["Language"].ToString();
                        userSetting.Soundtrack = reader["Soundtrack"].ToString();
                    }
                    return userSetting;
                }

            }

        }

        public static string CheckLogin(string username, string password)
        {
            var queryString = $"SELECT * From Users Where Username =@username and Password =@password";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@username", username);
                command.Parameters.AddWithValue("@password", password);

                var results = 0;
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        if (reader["Username"].ToString() == username)
                        {
                            results++;
                        }
                    }
                }

                if (results > 0)
                {
                    var token = Guid.NewGuid().ToString().Substring(0, 30); ;
                    var query = $"UPDATE Users SET token ='{token}' WHERE Username ='{username}'";
                    NonQueryRequest(query);
                    connection.Close();
                    return token;
                }
                else
                {
                    return "";
                }
            }

        }

        public static List<Sets> QueryRequestSets()
        {
            var queryString = "SELECT s.* FROM [Sets] s WHERE s.Code IN(SELECT c.[Set] FROM Cards c " +
                "WHERE Digital= 'false' AND s.Name NOT LIKE '%Art Series%' AND s.Name NOT LIKE '%Front Cards%' " +
                "AND (Set_type != 'funny' AND Set_type != 'token' AND Set_type != 'minigame' AND Set_type != 'promo') " +
                "AND c.[Set] IS NOT NULL GROUP BY c.[Set] HAVING COUNT(*) > 0) ORDER BY s.released_at DESC ";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                var results = new List<Sets>();
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var tmp = new Sets
                        {
                            Id = reader["Id"].ToString(),
                            Code = reader["Code"].ToString(),
                            Name = reader["Name"].ToString(),
                            Uri = reader["Uri"].ToString(),
                            Released_At = reader["Released_At"].ToString(),
                            Set_type = reader["Set_type"].ToString(),
                            Card_count = reader["Card_count"].ToString(),
                            Digital = reader["Digital"].ToString(),
                            Icon_svg_uri = reader["Icon_svg_uri"].ToString()
                        };
                        results.Add(tmp);
                    }
                }
                connection.Close();
                return results;
            }

        }

        public static List<Deck> QueryRequestDecks(string username)
        {
            var queryString = $"SELECT * From Decks WHERE UserId='' or UserId = @username";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@username", username);

                var results = new List<Deck>();

                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var cardsList = new List<string>();

                        for (var i = 1; i <= 100; i++)
                        {
                            var number = i.ToString().PadLeft(3, '0'); ;
                            cardsList.Add(reader[$"Card{number}"].ToString());
                        }

                        var tmp = new Deck
                        {
                            Name = reader["Name"].ToString(),
                            Id = reader["Id"].ToString(),
                            UserId = reader["UserId"].ToString(),
                            Cards = cardsList
                        };
                        results.Add(tmp);
                    }
                }
                connection.Close();
                return results;
            }
        }


        public static List<Card> QueryRequestCards(string filter)
        {
            var queryString = "SELECT * From Cards " + filter;

            Console.WriteLine(queryString);

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                var results = new List<Card>();
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var tmp = new Card
                        {
                            Object = reader["Object"].ToString(),
                            Id = reader["Id"].ToString(),
                            Oracle_Id = reader["Oracle_Id"].ToString(),
                            Multiverse_ids = reader["Multiverse_ids"].ToString(),
                            Mtgo_Id = reader["Mtgo_Id"].ToString(),
                            Mtgo_Foil_Id = reader["Mtgo_Foil_Id"].ToString(),
                            Tcgplayer_Id = reader["Tcgplayer_Id"].ToString(),
                            Cardmarket_Id = reader["Cardmarket_Id"].ToString(),
                            Name = reader["Name"].ToString(),
                            Lang = reader["Lang"].ToString(),
                            Released_at = reader["Released_at"].ToString(),
                            Uri = reader["Uri"].ToString(),
                            Scryfall_Uri = reader["Scryfall_Uri"].ToString(),
                            Layout = reader["Layout"].ToString(),
                            Highres_Image = reader["Highres_Image"].ToString(),
                            Image_Status = reader["Image_Status"].ToString(),
                            Image_Uris = reader["Image_Uris"].ToString(),
                            Mana_Cost = reader["Mana_Cost"].ToString(),
                            Cmc = reader["Cmc"].ToString(),
                            Type_Line = reader["Type_Line"].ToString(),
                            Oracle_Text = reader["Oracle_Text"].ToString(),
                            Power = reader["Power"].ToString(),
                            Toughness = reader["Toughness"].ToString(),
                            Colors = reader["Colors"].ToString(),
                            Color_Identity = reader["Color_Identity"].ToString(),
                            Keywords = reader["Keywords"].ToString(),
                            Legalities = reader["Legalities"].ToString(),
                            Games = reader["Games"].ToString(),
                            Reserved = reader["Reserved"].ToString(),
                            Foil = reader["Foil"].ToString(),
                            Nonfoil = reader["Nonfoil"].ToString(),
                            Finishes = reader["Finishes"].ToString(),
                            Oversized = reader["Oversized"].ToString(),
                            Promo = reader["Promo"].ToString(),
                            Reprint = reader["Reprint"].ToString(),
                            Variation = reader["Variation"].ToString(),
                            Set_Id = reader["Set_Id"].ToString(),
                            Set = reader["Set"].ToString(),
                            Set_Name = reader["Set_Name"].ToString(),
                            Set_Type = reader["Set_Type"].ToString(),
                            Set_Uri = reader["Set_Uri"].ToString(),
                            Set_Search_Uri = reader["Set_Search_Uri"].ToString(),
                            Scryfall_Set_Uri = reader["Scryfall_Set_Uri"].ToString(),
                            Rulings_Uri = reader["Rulings_Uri"].ToString(),
                            Prints_Search_Uri = reader["Prints_Search_Uri"].ToString(),
                            Collector_Number = reader["Collector_Number"].ToString(),
                            Digital = reader["Digital"].ToString(),
                            Rarity = reader["Rarity"].ToString(),
                            Flavor_Text = reader["Flavor_Text"].ToString(),
                            Card_Back_Id = reader["Card_Back_Id"].ToString(),
                            Artist = reader["Artist"].ToString(),
                            Artist_Ids = reader["Artist_Ids"].ToString(),
                            Illustration_Id = reader["Illustration_Id"].ToString(),
                            Border_Color = reader["Border_Color"].ToString(),
                            Frame = reader["Frame"].ToString(),
                            Full_Art = reader["Full_Art"].ToString(),
                            Textless = reader["Textless"].ToString(),
                            Booster = reader["Booster"].ToString(),
                            Story_Spotlight = reader["Story_Spotlight"].ToString(),
                            Edhrec_Rank = reader["Edhrec_Rank"].ToString(),
                            Penny_Rank = reader["Penny_Rank"].ToString(),
                            Prices = reader["Prices"].ToString(),
                            Related_Uris = reader["Related_Uris"].ToString(),
                            Small = reader["Small"].ToString(),
                            Normal = reader["Normal"].ToString(),
                            Large = reader["Large"].ToString(),
                            Png = reader["Png"].ToString(),
                            Art_Crop = reader["Art_Crop"].ToString(),
                            Border_crop = reader["Border_crop"].ToString(),
                            Standard = reader["Standard"].ToString(),
                            Future = reader["Future"].ToString(),
                            Historic = reader["Historic"].ToString(),
                            Gladiator = reader["Gladiator"].ToString(),
                            Pioneer = reader["Pioneer"].ToString(),
                            Explorer = reader["Explorer"].ToString(),
                            Modern = reader["Modern"].ToString(),
                            Legacy = reader["Legacy"].ToString(),
                            Pauper = reader["Pauper"].ToString(),
                            Vintage = reader["Vintage"].ToString(),
                            Penny = reader["Penny"].ToString(),
                            Commander = reader["Commander"].ToString(),
                            Brawl = reader["Brawl"].ToString(),
                            Historicbrawl = reader["Historicbrawl"].ToString(),
                            Alchemy = reader["Alchemy"].ToString(),
                            Paupercommander = reader["Paupercommander"].ToString(),
                            Duel = reader["Duel"].ToString(),
                            Oldschool = reader["Oldschool"].ToString(),
                            Premodern = reader["Premodern"].ToString(),
                            Usd = Convert.ToDouble(reader["Usd"]),
                            Usd_Foil = Convert.ToDouble(reader["Usd_Foil"]),
                            Usd_Etched = Convert.ToDouble(reader["Usd_Etched"]),
                            Eur = Convert.ToDouble(reader["Eur"]),
                            Eur_Foil = Convert.ToDouble(reader["Eur_Foil"]),
                            Tix = Convert.ToDouble(reader["Tix"]),
                            Gatherer = reader["Gatherer"].ToString(),
                            Tcgplayer_Infinite_Articles = reader["Tcgplayer_Infinite_Articles"].ToString(),
                            Tcgplayer_Infinite_Decks = reader["Tcgplayer_Infinite_Decks"].ToString(),
                            Edhrec = reader["Edhrec"].ToString()
                        };
                        results.Add(tmp);
                    }
                }
                connection.Close();
                return results;
            }
        }


        public static Deck QueryRequestDeck(string deckId, string username)
        {
            var queryString = $"SELECT * From Decks WHERE (UserId = @username or UserId ='') AND Id=@deckId ";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@username", username);
                command.Parameters.AddWithValue("@deckId", deckId);

                var deck = new Deck();
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var cardsList = new List<string>();

                        for (var i = 1; i <= 100; i++)
                        {
                            var number = i.ToString().PadLeft(3, '0'); ;
                            cardsList.Add(reader[$"Card{number}"].ToString());
                        }

                        var tmp = new Deck
                        {
                            Name = reader["Name"].ToString(),
                            Id = reader["Id"].ToString(),
                            UserId = reader["UserId"].ToString(),
                            Cards = cardsList
                        };
                        deck = tmp;
                    }
                }
                connection.Close();
                return deck;
            }
        }

        public static CardCheck ReadSetAndRarityAndColorIdentity(string cardId)
        {
            var queryString = $"select [Set],Rarity,Color_Identity,Released_at from Cards where Id = @cardId";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@cardId", cardId);

                var cardCheck = new CardCheck();
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var tmp = new CardCheck
                        {
                            SetCode = reader["Set"].ToString(),
                            Rarity = reader["Rarity"].ToString(),
                            ColorIdentity = reader["Color_Identity"].ToString(),
                            ReleaseDate = Converters.DateConverter(reader["Released_at"].ToString())
                        };
                        cardCheck = tmp;
                    }
                }
                connection.Close();
                return cardCheck;
            }
        }

        public static List<string> StandardSets()
        {
            var queryString = $"select top 5 Code from [Sets] where Set_type = 'expansion' order by Released_at desc ";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                var setList = new List<string>();
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        setList.Add(reader["Code"].ToString());
                    }
                }
                connection.Close();
                return setList;
            }
        }

        public static List<GameCard> GetAllTokens()
        {
            var deck = new List<GameCard>();
            //var queryString = $"SELECT [Name], Id, Oracle_Id, [Set],Set_Name FROM " +
            //    $"(SELECT [Name], Id, Oracle_Id, [Set], Set_Name, ROW_NUMBER() OVER (PARTITION BY Name ORDER BY Released_at DESC) AS rn" +
            //    $" FROM Cards WHERE Layout = 'Token') AS subquery WHERE rn = 1;";

            var queryString = "SELECT c.Name, c.Id, c.Oracle_Id, c.[Set], c.Set_Name, c.Power, c.Toughness, c.Released_at " +
                "FROM Cards c " +
                "INNER JOIN ( " +
                "SELECT Name, Power, Toughness, MAX(Released_at) AS MaxReleaseDate " +
                "FROM Cards WHERE Layout = 'Token' or Layout ='Emblem' GROUP BY Name, Power, Toughness) groupedCards " +
                "ON c.Name = groupedCards.Name AND c.Power = groupedCards.Power AND c.Toughness = groupedCards.Toughness AND c.Released_at = groupedCards.MaxReleaseDate " +
                "ORDER BY c.Name, c.Power, c.Toughness";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);

                var jsonCards = new List<string>();

                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var setName = "Phyrexia__All_Will_Be_One";
                        setName = reader["Set_Name"].ToString().Replace(" ","_").Replace(":","_");

                        var name = reader["Name"].ToString() + " " + reader["Power"] + "/" + reader["Toughness"]; 

                        if (string.IsNullOrEmpty(reader["Power"].ToString()) && string.IsNullOrEmpty(reader["Toughness"].ToString()))
                        {
                            name = reader["Name"].ToString();
                        }

                        var card = new GameCard
                        {
                            Guid = Guid.NewGuid().ToString(),
                            CardId = reader["Oracle_Id"].ToString(),
                            Source = $"../resources/cards_images/{reader["Set"]}_{setName}/{reader["Set"]}_{reader["Id"]}.jpg",
                            Name = name
                        };

                        deck.Add(card);
                    }
                }
                connection.Close();

                deck = deck.GroupBy(card => card.CardId).Select(group => group.First()).ToList();

                return deck;
            }
        }

        public static List<GameCard> GetPlayableVersionOfTheDeck(string deckId)
        {
            var deck = new List<GameCard>();
            var queryString = $"SELECT * From Decks WHERE Id=@deckId";
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@deckId", deckId);

                var jsonCards = new List<string>();

                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        for (var i = 1; i <= 100; i++)
                        {
                            var number = i.ToString().PadLeft(3, '0'); ;

                            var cardTmp = reader[$"Card{number}"].ToString();
                            if (cardTmp != "")
                            {
                                jsonCards.Add(cardTmp);
                            }
                        }
                    }
                }
                connection.Close();

                foreach (var jsonCard in jsonCards)
                {
                    var obj = JsonConvert.DeserializeObject<CardDeckItem>(jsonCard);

                    for (var i = 1; i <= obj.CardCount; i++)
                    {
                        var card = new GameCard
                        {
                            Guid = Guid.NewGuid().ToString(),
                            CardId = obj.Key,
                            Source = obj.Source,
                            Name = obj.Name,
                            Statuses = new List<string>(),
                            Counters = new List<string>(),
                        };

                        deck.Add(card);
                    }
                }

                return deck;
            }
        }

        public static List<string> AdvancedSearchedCards(string queryString)
        {
            Console.WriteLine(queryString);

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                SqlCommand command = new SqlCommand(queryString, connection);
                var cardIdList = new List<string>();

                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        cardIdList.Add(reader["Id"].ToString());
                    }
                }

                connection.Close();
                return cardIdList;
            }
        }
    }
}