export const getDateRange = () => {
  const today = new Date();
  const endDate = today;
  const startDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return {
    startDate: formatDate(startDate).split(" ")[0] + " 00:00",
    endDate: formatDate(endDate).split(" ")[0] + " 23:59",
  };
};
