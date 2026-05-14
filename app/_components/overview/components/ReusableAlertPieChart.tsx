import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from "recharts";

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

export interface ReusableAlertPieChartProps {
  // Raw data to process
  data: any[];

  // Chart configuration
  title?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;

  // Data processing function - transforms raw data into pie chart format
  processData: (data: any[]) => PieChartData[];

  // Display options
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
  showTooltip?: boolean;
  showLabels?: boolean;

  // Custom tooltip content
  tooltipFormatter?: (
    value: number,
    name: string,
    props: any,
  ) => [string, string];

  // Custom label formatter
  labelFormatter?: (entry: PieChartData) => string;

  // Grid layout for multiple charts
  gridCols?: number;
  className?: string;

  // Legend click handler and selected items
  onLegendClick?: (name: string) => void;
  selectedFilters?: string[];
}

const ReusableAlertPieChart: React.FC<ReusableAlertPieChartProps> = ({
  data,
  title,
  width = 250,
  height = 200,
  innerRadius = 0,
  outerRadius = 80,
  processData,
  showLegend = true,
  legendPosition = "right",
  showTooltip = true,
  showLabels = false,
  tooltipFormatter,
  labelFormatter,
  gridCols = 1,
  className = "",
  onLegendClick,
  selectedFilters = [],
}) => {
  // Process the raw data using the provided function
  const chartData = processData(data);

  // Don't render if no data
  if (!chartData || chartData.length === 0) {
    return null;
  }

  // Custom tooltip component matching the previous design
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value}{" "}
            {data.name.toLowerCase().includes("vehicle")
              ? "vehicles"
              : "alerts"}
          </p>
        </div>
      );
    }
    return null;
  };

  // Determine layout based on data count and legend position
  const itemsCount = chartData.length;
  const shouldUseGrid = itemsCount > 5;

  // Calculate active indices based on selectedFilters
  const activeIndices =
    selectedFilters.length > 0
      ? chartData
          .map((item, index) =>
            selectedFilters.includes(item.name) ? index : -1,
          )
          .filter((index) => index !== -1)
      : [];

  // Custom active shape renderer for selected segments
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
      props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const chartComponent = (
    <div className="flex items-center gap-0">
      {/* Pie Chart */}
      <div className="flex-shrink-0">
        <div style={{ width: `${width}px`, height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndices}
                activeShape={renderActiveShape}
                label={
                  showLabels
                    ? (entry: any) => `${entry.name}: ${entry.value}`
                    : false
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend - matching previous design */}
      {showLegend && (
        <div className="flex flex-col justify-center">
          <div
            className={
              shouldUseGrid
                ? "grid grid-cols-2 gap-x-2 gap-y-0.5 min-w-0"
                : "flex flex-col gap-y-0.5 min-w-0 max-w-40"
            }
          >
            {chartData.map((item, index) => {
              const isSelected = selectedFilters.includes(item.name);
              const hasFilters = selectedFilters.length > 0;
              const isClickable = !!onLegendClick;

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 ${
                    isClickable
                      ? "cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded"
                      : ""
                  } ${hasFilters && !isSelected ? "opacity-40" : ""}`}
                  onClick={() => onLegendClick?.(item.name)}
                >
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="text-xs text-gray-700">
                    {item.name}:{" "}
                    <span className="font-medium">{item.value}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return chartComponent;
};

export default ReusableAlertPieChart;
