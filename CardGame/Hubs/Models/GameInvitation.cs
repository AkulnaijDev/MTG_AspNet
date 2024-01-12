namespace CardGame.Hubs
{
    public class GameInvitation
    {
        public string InvitingId { get; set; }
        public string InvitingPlayerName { get; set; }
        public List<string> InvitedIds { get; set; }
        public string DeckId { get; set; }
        public string GameMode { get; set; }
        public List<Team> Teams { get; set; }
        public string RoomId { get; set; }
        public List<Room> Rooms { get; set; }
    }
}