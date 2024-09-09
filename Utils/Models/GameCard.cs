public static class GameCardConstants
{
    public static string TappedStatus = "Tapped";
    public static string FlippedStatus = "Tapped";
}

public class GameCard
{
    public string Guid { get; set; }
    public string CardId { get; set; }
    public string Source { get; set; }
    public string Name { get; set; }
    public List<string> Statuses { get; set; }
    public List<string> Counters { get; set; }
}