using CardGame.Models;

namespace CardGame.Hubs
{
    public static class UserHandler
    {
        public static HashSet<string> ConnectedIds = new HashSet<string>();
        public static List<User> Users = new List<User>();
    }
}