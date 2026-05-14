import { Modal } from "antd";
import React from "react";

interface EsclationMatrixProps {
  open: boolean;
  onClose: () => void;
}

const EsclationMatrix = ({ open, onClose }: EsclationMatrixProps) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  const escalationData = [
    {
      level: "Level 1",
      role: "Technical Support",
      name: "John Doe",
      contact: "+91 9876543210",
      email: "john.doe@company.com",
      responseTime: "30 minutes",
    },
    {
      level: "Level 2",
      role: "Senior Technical Lead",
      name: "Jane Smith",
      contact: "+91 9876543211",
      email: "jane.smith@company.com",
      responseTime: "1 hour",
    },
    {
      level: "Level 3",
      role: "Operations Manager",
      name: "Mike Johnson",
      contact: "+91 9876543212",
      email: "mike.johnson@company.com",
      responseTime: "2 hours",
    },
    {
      level: "Level 4",
      role: "Regional Manager",
      name: "Sarah Wilson",
      contact: "+91 9876543213",
      email: "sarah.wilson@company.com",
      responseTime: "4 hours",
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title="Escalation Matrix"
      width={800}
      centered
      maskClosable={true}
      closable={true}
      destroyOnClose={true}
    >
      <div className="p-4">
        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            Contact the appropriate level based on issue severity and response
            time requirements.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Escalation Level
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Role
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Contact Number
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Email
                </th>
                {/* <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                  Response Time
                </th> */}
              </tr>
            </thead>
            <tbody>
              {escalationData.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.level === "Level 1"
                          ? "bg-green-100 text-green-800"
                          : item.level === "Level 2"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.level === "Level 3"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.level}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">
                    {item.role}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-blue-600">
                    {item.contact}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-blue-600">
                    {item.email}
                  </td>
                  {/* <td className="border border-gray-300 px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {item.responseTime}
                    </span>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default EsclationMatrix;
