namespace CardGame.Hubs
{
    public class GamePlayer
    {
        public string PlayerId { get; set; }
        public List<GameCard> Deck { get; set; }
        public int HP { get; set; }
        public string Name { get; set; }
    }
}