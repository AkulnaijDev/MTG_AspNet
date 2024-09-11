public static class GameCardConstants
{
    public static string TappedStatus = "Tapped";
    public static string MorphedStatus = "Morphed";
    public static string TransformedStatus = "Transformed";
    public static string AddedCounterStatus = "CounterOnCard";
}

public class GameCard
{
    public string Guid { get; set; }
    public string CardId { get; set; }
    public string Source { get; set; }
    public string Name { get; set; }
    public List<string> Statuses { get; set; }
    public List<Counter> Counters { get; set; }
}
public class Counter
{
    public int Quantity { get; set; }
    public string Type { get; set; }
}