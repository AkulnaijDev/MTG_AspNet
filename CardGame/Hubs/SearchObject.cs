public class SearchObject
{
    public string Name { get; set; }
    public string Text { get; set; }
    public string Type { get; set; }
    public string[] Sets { get; set; }
    public bool ColorWhite { get; set; }
    public bool ColorBlue { get; set; }
    public bool ColorBlack { get; set; }
    public bool ColorRed { get; set; }
    public bool ColorGreen { get; set; }
    public bool ColorColorless { get; set; }
    public string ColorValue { get; set; }
    public bool CommanderColorWhite { get; set; }
    public bool CommanderColorBlue { get; set; }
    public bool CommanderColorBlack { get; set; }
    public bool CommanderColorRed { get; set; }
    public bool CommanderColorGreen { get; set; }
    public bool CommanderColorColorless { get; set; }
    public string ManaCost { get; set; }
    public string ValueType { get; set; }
    public string ValueEqual { get; set; }
    public string ValueAmount { get; set; }
    public bool RarityCommon { get; set; }
    public bool RarityUncommon { get; set; }
    public bool RarityRare { get; set; }
    public bool RarityMythic { get; set; }
    public bool Singleton { get; set; }
    public string FlavorText { get; set; }
}