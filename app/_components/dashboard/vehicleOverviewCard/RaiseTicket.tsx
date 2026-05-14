"use client";

import React, { useState } from "react";
import { Modal, Input, Select, Form, message, Button } from "antd";
import { useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";

export default function VehicleOverviewCardTicket({
  vehicleNo,
  open,
  onClose,
  contactname,
  contactnumber,
}: {
  vehicleNo: string;
  open: boolean;
  onClose: () => void;
  contactname: string;
  contactnumber: string;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const {
    userId,
    groupId,
    parentUser: pUserId,
    company,
    userName,
  } = useSelector((state: RootState) => state.auth);

  const branchOptions = ["JAIPUR", "AHEMEDABAD", "DELHI", "MUMBAI", "KOLKATA"];

  const reasonOptions = [
    "GPS Device Not Working",
    "Vehicle Not Updating Location",
    "Ignition Status Issue",
    "Fuel Sensor Malfunction",
    "Over-Speed Alert Not Triggering",
    "Harsh Braking/Acceleration Sensor Fault",
    "Power Disconnection Issue",
    "SIM Card / Network Issue",
    "Device Tampering Detected",
    "Wrong Vehicle Mapping",
    "Temperature Sensor Removed",
    "Temperature Sensor Broken",
    "Temperature Not Working",
    "Testing by Gtrac",
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const {
        reason,
        location,
        branch,
        contactPerson,
        contactNo,
        altContactPerson,
        altContactNo,
      } = values;

      setLoading(true);

      const now = new Date();
      const formattedDate = `${String(now.getMonth() + 1).padStart(
        2,
        "0",
      )}:${String(now.getDate()).padStart(
        2,
        "0",
      )}:${now.getFullYear()} ${String(now.getHours()).padStart(
        2,
        "0",
      )}:${String(now.getMinutes()).padStart(2, "0")}`;

      // Get vehicle data from mob API directly
      let installationDate = "";
      let notWorking = "";

      try {
        const mobApiRes = await fetch(
          `https://gtrac.in:8089/trackingDashboard/getListVehiclesmob?token=${groupId}&userid=${userId}&puserid=${pUserId}&mode=`,
        );
        const mobApiData = await mobApiRes.json();

        if (
          mobApiData.success &&
          mobApiData.list &&
          mobApiData.list.length > 0
        ) {
          const currentVehicle = mobApiData.list.find(
            (vehicle: any) =>
              vehicle.vehReg === vehicleNo || vehicle.lorry_no === vehicleNo,
          );

          if (currentVehicle) {
            const rawInstallationDate = currentVehicle.dateOfinstallation || "";
            if (rawInstallationDate) {
              const installDate = new Date(rawInstallationDate);
              if (!isNaN(installDate.getTime())) {
                installationDate = `${installDate.getFullYear()}-${String(
                  installDate.getMonth() + 1,
                ).padStart(2, "0")}-${String(installDate.getDate()).padStart(
                  2,
                  "0",
                )} ${String(installDate.getHours()).padStart(2, "0")}:${String(
                  installDate.getMinutes(),
                ).padStart(2, "0")}:${String(installDate.getSeconds()).padStart(
                  2,
                  "0",
                )}`;
              } else {
                installationDate = rawInstallationDate; // fallback to original if parsing fails
              }
            }

            const rawGpsTime = currentVehicle.gpsDtl?.latLngDtl?.gpstime || "";
            if (rawGpsTime) {
              const gpsDate = new Date(rawGpsTime);
              if (!isNaN(gpsDate.getTime())) {
                notWorking = `${gpsDate.getFullYear()}-${String(
                  gpsDate.getMonth() + 1,
                ).padStart(2, "0")}-${String(gpsDate.getDate()).padStart(
                  2,
                  "0",
                )} ${String(gpsDate.getHours()).padStart(2, "0")}:${String(
                  gpsDate.getMinutes(),
                ).padStart(2, "0")}:${String(gpsDate.getSeconds()).padStart(
                  2,
                  "0",
                )}`;
              } else {
                notWorking = rawGpsTime;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle data from mob API:", error);
      }

      const formData = new FormData();
      formData.append("request_reason", reason);
      formData.append("location", location || "");
      formData.append("branch_loc", branch);
      formData.append("pname", contactPerson);
      formData.append("cnumber", contactNo);
      formData.append("pname_two", altContactPerson || "");
      formData.append("cnumber_two", altContactNo || "");
      formData.append("gps_time_curr", formattedDate);
      formData.append("vehicle_id", vehicleNo);
      formData.append("request_type", "services");
      formData.append("veh_no", vehicleNo);

      formData.append("user_id", userId);
      formData.append("group_id", groupId);
      formData.append("company_name", company);
      formData.append("client_name", userName);

      formData.append("instalation_date", installationDate);
      formData.append("not_working", notWorking);
      formData.append("request_by", userName);

      const res = await fetch(
        "https://josue-unfabled-unscenically.ngrok-free.dev/newtracking/reports/ticketPage.php",
        {
          method: "POST",
          mode: "cors",
          headers: { Accept: "*/*" },
          body: formData,
        },
      );

      if (res.ok) {
        message.success("Ticket submitted successfully!");
        form.resetFields();
        onClose();
      } else {
        message.error("Ticket submission failed.");
      }
    } catch (error) {
      console.error(error);
      message.error("Please fill in all required fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      centered
      width={500}
      className="overflow-hidden"
    >
      <div className="p-1rounded-md">
        <h2 className="text-xl font-bold text-center mb-6">
          Raise Ticket — {vehicleNo || "Select Vehicle"}
        </h2>

        <Form form={form} layout="vertical" className="w-full max-w-lg mx-auto">
          {/* Vehicle No */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 h-10 pb-5 items-center px-4 mb-2">
            <div className="flex justify-start">
              <label className="text-xs font-bold text-gray-700 text-right whitespace-nowrap">
                Vehicle No:
              </label>
            </div>
            <Input
              value={vehicleNo}
              disabled
              className="border border-slate-300 rounded-md text-xs bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Reason */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 px-4 h-12">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Reason:
              </label>
            </div>
            <Form.Item
              name="reason"
              className="mb-0 text-xs"
              rules={[{ required: true, message: "Please select a reason" }]}
            >
              <Select placeholder="Select Reason" className="w-full">
                {reasonOptions.map((r) => (
                  <Select.Option key={r} value={r}>
                    {r}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Location */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 px-4 h-12">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Location:
              </label>
            </div>
            <Form.Item
              name="location"
              className="mb-0 text-xs"
              rules={[{ required: true, message: "Please enter location" }]}
            >
              <Input placeholder="Enter location" className="h-7 text-xs" />
            </Form.Item>
          </div>

          {/* Branch */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 px-4 h-12">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Branch:
              </label>
            </div>
            <Form.Item
              name="branch"
              className="mb-0 text-xs"
              rules={[{ required: true, message: "Please select a branch" }]}
            >
              <Select placeholder="Select Branch" className="w-full">
                {branchOptions.map((b) => (
                  <Select.Option key={b} value={b}>
                    {b}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Contact Person */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 h-12 px-4">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Contact Person:
              </label>
            </div>
            <Form.Item
              name="contactPerson"
              initialValue={contactname}
              className="mb-0 text-xs"
              rules={[
                { required: true, message: "Please enter contact person" },
                {
                  pattern: /^[A-Za-z\s]+$/,
                  message: "Name can only contain letters",
                },
              ]}
            >
              <Input
                placeholder="Enter contact person"
                className="h-7 text-xs"
              />
            </Form.Item>
          </div>

          {/* Contact No */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 px-4 h-12">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Contact No:
              </label>
            </div>
            <Form.Item
              name="contactNo"
              initialValue={contactnumber}
              className="mb-0"
              rules={[
                { required: true, message: "Please enter contact number" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Contact number must be 10 digits",
                },
              ]}
            >
              <Input
                placeholder="Enter contact number"
                className="h-7 text-xs"
                maxLength={10}
                onInput={(e) =>
                  (e.currentTarget.value = e.currentTarget.value.replace(
                    /[^0-9]/g,
                    "",
                  ))
                }
              />
            </Form.Item>
          </div>

          {/* Alternate Contact Person */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 px-4 h-12">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Alternate Contact Person:
              </label>
            </div>
            <Form.Item
              name="altContactPerson"
              className="mb-0"
              rules={[
                {
                  pattern: /^[A-Za-z\s]*$/,
                  message: "Only letters and spaces allowed",
                },
              ]}
            >
              <Input
                placeholder="Enter alternate contact person"
                className="h-7 text-xs"
              />
            </Form.Item>
          </div>

          {/* Alternate Contact No */}
          <div className="grid grid-cols-[180px,1fr] gap-x-6 px-4 h-12">
            <div className="flex justify-start">
              <label className="text-xs pt-2 font-bold text-gray-700 text-right whitespace-nowrap">
                Alternate Contact No:
              </label>
            </div>
            <Form.Item
              name="altContactNo"
              className="mb-0 text-xs"
              rules={[
                {
                  pattern: /^[0-9]{0,10}$/,
                  message: "Must be up to 10 digits",
                },
              ]}
            >
              <Input
                placeholder="Enter alternate contact number"
                className="h-7 text-xs"
                maxLength={10}
                onInput={(e) =>
                  (e.currentTarget.value = e.currentTarget.value.replace(
                    /[^0-9]/g,
                    "",
                  ))
                }
              />
            </Form.Item>
          </div>

          {/* BUTTONS: Cancel | Submit | Chat */}
          <div className="flex justify-center gap-6 mt-2 pb-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              className="bg-[#5CBD5C] hover:bg-[#4aa54a] border-none"
            >
              Submit Ticket
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
