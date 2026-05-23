interface InfoCardProps {
  title: string;
  data: Array<{
    label: string;
    value: string;
    textSize?: string;
  }>;
}

export default function InfoCard({ title, data }: InfoCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl">
      <h1 className="font-semibold p-2 bg-gray-100 border-b border-gray-200">
        {title}
      </h1>
      {data.map((item, index) => (
        <div
          key={index}
          className={`${item.textSize || "text-xs"} flex items-start justify-between p-2 gap-2 ${
            index < data.length - 1 ? "border-b border-gray-200" : ""
          }`}
        >
          <p className="text-gray-500 flex-shrink-0 min-w-fit">
            {item.label} :
          </p>
          <span className="text-right break-words overflow-wrap-anywhere">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
