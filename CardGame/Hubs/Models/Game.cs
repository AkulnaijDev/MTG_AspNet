namespace CardGame.Hubs
{
    public class Game
    {
        public string RoomId { get; set; }
        public string GameMode { get; set; }
        public List<Team> Teams { get; set; }
        public List<GamePlayer> Players { get; set; }
    }
}