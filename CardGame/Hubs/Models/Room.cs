namespace CardGame.Hubs
{
    public class Room
    {
        public string RoomId { get; set; }
        public string GameMode { get; set; }
        public List<Player> Players { get; set; }

        public async Task RemovePlayer(string username)
        {
            Players.Remove(Players.Where(x => x.Name == username).First());
            await Task.CompletedTask;
        }
    }
}