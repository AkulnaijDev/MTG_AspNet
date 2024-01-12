namespace Utils
{
    public static class Converters
    {
        public static DateTime DateConverter(string date)
        {
            var year = Convert.ToInt32(date.Split('-')[0]);
            var month = Convert.ToInt32(date.Split('-')[1]);
            var day = Convert.ToInt32(date.Split('-')[2]);

            return new DateTime(year, month, day);
        }
    }
}