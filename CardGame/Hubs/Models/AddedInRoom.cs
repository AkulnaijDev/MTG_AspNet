namespace CardGame.Hubs
{
    public class AddedInRoom
    {
        public string AddingUserId { get; set; }
        public string AddingUsername { get; set; }
        public string AddedUserId { get; set; }
        public string AddedUsername { get; set; }
        public string RoomGuid { get; set; }

        public AddedInRoom(string addingUserId, string addingUsername, string addedUserId, string addedUsername, string roomGuid)
        {
            AddingUserId = addingUserId;
            AddingUsername = addingUsername;
            AddedUserId = addedUserId;
            AddedUsername = addedUsername;
            RoomGuid = roomGuid;

        }

    }
}