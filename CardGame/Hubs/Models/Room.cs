namespace CardGame.Hubs
{
    public class Room
    {
        public string RoomId { get; set; }
        public string GameMode { get; set; }
        public List<Player> Players { get; set; }
    }
}