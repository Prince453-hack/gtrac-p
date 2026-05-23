export interface Vehicle {
  id: number;
  vehicle_no: string;
  date: string;
  start_time: string;
  end_time: string;
  total_distance: number;
  running: string;
  stoppage_hrs: string;
  six_to_nine_km: number | null;
  nine_to_six_km: number | null;
  six_to_nine_start_time: string;
  six_to_nine_end_time: string;
  nine_to_six_start_time: string;
  nine_to_six_end_time: string;
  nine_to_six_running: string;
  six_to_nine_running: string;
  six_to_nine_stoppage_hrs: string;
  nine_to_six_stoppage_hrs: string;
  day: string;
}

interface VehicleTableProps {
  data: Vehicle[];
  timeFilter: string;
  dayFilter: string;
  selectedMonth: number;
  selectedYear: number;
}

export default function VehicleTable({
  data,
  timeFilter,
  dayFilter,
  selectedMonth,
  selectedYear,
}: VehicleTableProps) {
  const generateDates = () => {
    const dates = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(selectedYear, selectedMonth, i);
      const dayIndex = date.getDay();
      dates.push({
        date: i,
        day: days[dayIndex],
        fullDay:
          days[dayIndex] === "Sun"
            ? "Sunday"
            : days[dayIndex] === "Sat"
              ? "Saturday"
              : "Weekday",
        fullDate: date.toISOString().split("T")[0],
      });
    }
    return dates;
  };

  const dates = generateDates();

  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.date);

    const km =
      timeFilter === "six_to_nine"
        ? item.six_to_nine_km
        : timeFilter === "nine_to_six"
          ? item.nine_to_six_km
          : item.total_distance;

    return (
      (km ?? 0) !== 0 &&
      itemDate.getMonth() === selectedMonth &&
      itemDate.getFullYear() === selectedYear
    );
  });

  // Group filtered data by vehicle number and date
  const groupedData = filteredData.reduce(
    (acc, item) => {
      if (!acc[item.vehicle_no]) {
        acc[item.vehicle_no] = {};
      }
      const date = new Date(item.date).getDate();
      acc[item.vehicle_no][date] = item;
      return acc;
    },
    {} as Record<string, Record<number, Vehicle>>,
  );

  const vehicleNumbers = Object.keys(groupedData);

  // Helper function to get display data for a cell
  const getDisplayData = (vehicleNo: string, date: number, dayType: string) => {
    const vehicleData = groupedData[vehicleNo]?.[date];

    if (!vehicleData) return null;

    // Check day filter
    if (dayFilter === "saturday" && dayType !== "Saturday") return null;
    if (dayFilter === "sunday" && dayType !== "Sunday") return null;
    if (
      dayFilter === "weekdays" &&
      (dayType === "Saturday" || dayType === "Sunday")
    )
      return null;
    if (
      dayFilter === "weekoff" &&
      !(dayType === "Saturday" || dayType === "Sunday")
    )
      return null;

    return vehicleData;
  };

  const getCellColor = (hasData: boolean, dayType: string) => {
    if (!hasData) return "bg-gray-100 text-gray-400";

    if (dayType === "Sunday") return "bg-red-50";
    if (dayType === "Saturday") return "bg-purple-50";

    return "bg-white";
  };

  const renderCellContent = (
    vehicleData: Vehicle | null,
    dateObj: { date: number; day: string; fullDay: string; fullDate: string },
  ) => {
    if (!vehicleData) {
      return <div className="text-center text-xs text-gray-400 py-1">N/A</div>;
    }

    return (
      <div className="text-center space-y-1 py-1">
        {/* Distance */}
        <div className="text-xs font-semibold text-green-600">
          {timeFilter === "six_to_nine"
            ? `${vehicleData.six_to_nine_km || 0} km`
            : timeFilter === "nine_to_six"
              ? `${vehicleData.nine_to_six_km || 0} km`
              : `${vehicleData.total_distance || 0} km`}
        </div>

        {/* Time Range */}
        <div className="text-[10px] text-gray-500">
          {timeFilter === "six_to_nine"
            ? `${vehicleData.six_to_nine_start_time} - ${vehicleData.six_to_nine_end_time}`
            : timeFilter === "nine_to_six"
              ? `${vehicleData.nine_to_six_start_time} - ${vehicleData.nine_to_six_end_time}`
              : `${vehicleData.start_time} - ${vehicleData.end_time}`}
        </div>

        {/* Running Time */}
        <div className="text-[10px] text-gray-600">
          Run:{" "}
          {timeFilter === "six_to_nine"
            ? vehicleData.six_to_nine_running
            : timeFilter === "nine_to_six"
              ? vehicleData.nine_to_six_running
              : vehicleData.running}
        </div>

        {/* Stoppage */}
        <div className="text-[10px] text-red-500">
          Stop:{" "}
          {timeFilter === "six_to_nine"
            ? vehicleData.six_to_nine_stoppage_hrs
            : timeFilter === "nine_to_six"
              ? vehicleData.nine_to_six_stoppage_hrs
              : vehicleData.stoppage_hrs}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-black p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
          <span>Weekdays</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-50 border border-gray-300 mr-2"></div>
          <span>Saturday</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-50 border border-gray-300 mr-2"></div>
          <span>Sunday</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 mr-2"></div>
          <span>N/A</span>
        </div>
        <div className="flex items-center ml-4">
          <div className="w-3 h-3 bg-green-600 mr-1"></div>
          <span>Total Distance</span>
        </div>
      </div>

      {/* Data Summary */}
      <div className="my-3 mx-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="font-semibold text-blue-800">Total Vehicles</div>
          <div className="text-lg font-bold text-blue-600">
            {vehicleNumbers.length}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="font-semibold text-green-800">Days with Data</div>
          <div className="text-lg font-bold text-green-600">
            {
              dates.filter((dateObj) => {
                return vehicleNumbers.some((vehicleNo) =>
                  getDisplayData(vehicleNo, dateObj.date, dateObj.fullDay),
                );
              }).length
            }{" "}
            / {dates.length}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="font-semibold text-purple-800">Current View</div>
          <div className="text-sm text-purple-600">
            {timeFilter === "six_to_nine" ? "7AM-9PM" : "9PM-7AM"} •
            {dayFilter === "all"
              ? " All Days"
              : dayFilter === "weekdays"
                ? " Weekdays"
                : dayFilter === "weekoff"
                  ? " Weekoff (Sat & Sun)"
                  : dayFilter === "saturday"
                    ? " Saturday"
                    : " Sunday"}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300 text-xs">
          <thead className="sticky top-0 z-50 bg-gray-50">
            <tr>
              <th
                rowSpan={1}
                className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider
             border border-gray-300 sticky left-0 top-0 bg-gray-50 z-50"
              >
                Vehicle No
              </th>
              {dates.map((dateObj) => (
                <th
                  key={dateObj.date}
                  className="px-1 py-2 text-center font-medium text-gray-700 uppercase tracking-wider border border-gray-300 min-w-20"
                >
                  <div className="font-semibold">{dateObj.day}</div>
                  <div className="font-normal text-gray-600">
                    {dateObj.date}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicleNumbers.length > 0 ? (
              vehicleNumbers.map((vehicleNo, index) => (
                <tr
                  key={vehicleNo}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-300 sticky left-0 bg-white z-10">
                    {vehicleNo}
                  </td>
                  {dates.map((dateObj) => {
                    const vehicleData = getDisplayData(
                      vehicleNo,
                      dateObj.date,
                      dateObj.fullDay,
                    );
                    const cellColor = getCellColor(
                      !!vehicleData,
                      dateObj.fullDay,
                    );

                    return (
                      <td
                        key={`${vehicleNo}-${dateObj.date}`}
                        className={`px-1 py-0 border border-gray-300 align-top ${cellColor} hover:bg-yellow-50 transition-colors`}
                      >
                        {renderCellContent(vehicleData, dateObj)}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={dates.length + 1} className="text-center py-12">
                  <div className="text-gray-400 text-lg">
                    No data found for this month
                  </div>
                  <div className="text-gray-500 text-sm mt-2">
                    Try selecting a different month or adjusting your filters
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
