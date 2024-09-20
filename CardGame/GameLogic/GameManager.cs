using CardGame.Hubs;

namespace CardGame.GameLogic
{
    public class GameManager
    {
        public List<GameStatus> matchesCurrentlyOn { get; set; }
    }
}

public static class GameUtils
{
    public static List<T> Shuffle<T>(List<T> list)
    {
        Random rng = new Random();
        int n = list.Count;
        while (n > 1)
        {
            n--;
            int k = rng.Next(n + 1);
            T value = list[k];
            list[k] = list[n];
            list[n] = value;
        }
        return list;
    }
    public static List<List<GameCard>> DrawCardsAndShuffle(List<GameCard> deck, int cardsToDraw)
    {
        var shuffledDeck = Shuffle(deck);
        var selectedCards = new List<GameCard>();
        var remainingCards = new List<GameCard>();

        for (int i = 0; i < shuffledDeck.Count; i++)
        {
            if (i < cardsToDraw)
            {
                selectedCards.Add(shuffledDeck[i]);
            }
            else
            {
                remainingCards.Add(shuffledDeck[i]);
            }
        }

        var result = new List<List<GameCard>>
        {
            selectedCards,
            remainingCards
        };

        return result;
    }
}

public class PlayerStatus
{
    public string Name;
    public string PlayerId;
    public int Hp;
    public List<GameCard> Hand;
    public List<GameCard> Deck;
    public List<GameCard> Exiled;
    public List<GameCard> Graveyard;

    public List<GameCard> LandZone;
    public List<GameCard> GameZone;
    public List<GameCard> CommanderZone;
    public List<GameCard> PlaneswalkerZone;
}

public class GameStatus
{
    public Game Game;
    public List<PlayerStatus> PlayerStatuses;

    public Task RemovePlayer(string username)
    {
        PlayerStatuses.Remove(PlayerStatuses.Where(x => x.Name == username).First());
        return Task.CompletedTask;
    }
}