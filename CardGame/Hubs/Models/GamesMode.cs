namespace CardGame.Hubs
{
    public class GamesMode
    {
        public bool Commander = true;  //tutte stessa color identity
        public bool Pauper = true;  //only common
        public bool Standard = true; //last 5 expansions
        public bool Pioneer = true; //after 2012-10-05
        public bool Extended = true; //all
        public bool Modern = true;  //after 8th edition 2003-07-28
        public bool Valid = true;
    }
}