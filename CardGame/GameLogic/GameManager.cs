using CardGame.Hubs;

namespace CardGame.GameLogic
{
    public class GameManager
    {
        public List<GameStatus> matchesCurrentlyOn { get; set; }

        public GameManager()
        {
            matchesCurrentlyOn = new List<GameStatus>();
        }
    }
}

public static class GameUtils
{
    public static List<List<GameCard>> DrawCardsAndShuffle(List<GameCard> deck, int cardsToDraw)
    {
        var random = new Random();
        var remainingCards = deck;
        var selectedCards = new List<GameCard>();

        for (int i = 0; i < cardsToDraw && remainingCards.Count > 0; i++)
        {
            int randomIndex = random.Next(remainingCards.Count);
            GameCard card = remainingCards[randomIndex];
            remainingCards.RemoveAt(randomIndex);
            selectedCards.Add(card);
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

}