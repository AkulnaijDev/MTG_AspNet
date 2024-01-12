namespace CardGame.Models
{
    public class User
    {
        public string ConnectionId;
        public string UserName;

        public User(string connectionId, string username)
        {
            ConnectionId = connectionId;
            UserName = username;
        }
    }
}