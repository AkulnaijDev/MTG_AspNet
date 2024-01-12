namespace CardGame.Hubs
{
    public class ChatMessage
    {
        public string SenderId { get; set; }
        public string RoomGuid { get; set; }
        public string Message { get; set; }

        public ChatMessage(string senderId, string roomGuid, string message)
        {
            SenderId = senderId;
            RoomGuid = roomGuid;
            Message = message;
        }
    }
}