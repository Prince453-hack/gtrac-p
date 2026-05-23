import {
  TruckFilled,
  CloseOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Input, Button } from "antd";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";

interface ModalHeaderProps {
  selectedItem: {
    title: string;
    count: number;
    sub: string;
    vehCount: number;
    bgColor: string;
    lineColor: string;
    vehicles?: VehicleData[] | any[];
    alerts?: any[];
  };
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onClose: () => void;
}

export const ModalHeader = ({
  selectedItem,
  searchTerm,
  onSearchChange,
  onExport,
  onClose,
}: ModalHeaderProps) => {
  return (
    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ backgroundColor: selectedItem.lineColor }}
        >
          <TruckFilled className="text-white text-sm" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          {selectedItem.title}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by vehicle number..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onExport}
          className="bg-green-500 border-green-500 hover:bg-green-600"
          disabled={
            !selectedItem?.vehicles || selectedItem.vehicles.length === 0
          }
        >
          Export
        </Button>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        />
      </div>
    </div>
  );
};
