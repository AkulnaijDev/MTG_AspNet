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

    public class ActionCardCounterRemoved
    {
        public Game Game { get; set; }
        public string CardGuid { get; set; }
        public string Player { get; set; }
        public string Zone { get; set; }
        public string Type { get; set; }
    }

    public class ActionCardPlayedTopOrBottom
    {
        public Game Game { get; set; }
        public string CardGuid { get; set; }
        public GameZone From { get; set; }
        public GameZone To { get; set; }
        public string TopBottom { get; set; }
    }

    public class ActionCardChangedStatus
    {
        public Game Game { get; set; }
        public string CardGuid { get; set; }
        public string Player { get; set; }
        public string Zone { get; set; }
        public string Action { get; set; }
        public List<Counter> Counters { get; set; }
    }
    //public class Counter
    //{
    //    public int Quantity { get; set; }
    //    public string Type { get; set; }
    //}

    public class ActionCardPlayedTapUntap
    {
        public Game Game { get; set; }
        public string CardGuid { get; set; }
        public string Player { get; set; }
        public string Zone { get; set; }
        public string TapUntap { get; set; }
    }


    public class MulliganAction
    {
        public Game Game { get; set; }
        public string Username { get; set; }
    }
}
