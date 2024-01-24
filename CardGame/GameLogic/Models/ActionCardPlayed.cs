using CardGame.Hubs;

namespace CardGame.GameLogic.Models
{
    public class GameZone
    {
        public string Player { get; set; }
        public string Zone { get; set; }
    }
    public class ActionCardPlayed
    {
        public Game Game { get; set; }
        public string CardGuid { get; set; }
        public GameZone From { get; set; }
        public GameZone To { get; set; }
    }
}
