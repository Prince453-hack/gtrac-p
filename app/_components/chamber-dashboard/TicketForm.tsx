"use client";

import { Button, Col, Form, Input, message, Modal, Row, Select } from "antd";
import { useEffect, useState } from "react";
import { compInfoArray, vehicle_id_arrs } from "./Arraydata";

const { Option } = Select;

interface TicketFormProps {
  vehicleNo: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TicketFormState {
  reason: string;
  branch: string;
  contactPerson: string;
  contactNo: string;
  altContactPerson: string;
  altContactNo: string;
}

interface CompInfo {
  routename: string;
  contactperson?: string;
  contactpersontwo?: string;
  phone?: string;
  phonetwo?: string;
}

export default function TicketForm({
  vehicleNo,
  isOpen,
  onClose,
}: TicketFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vehicleNo) return;

    const route = (vehicle_id_arrs as Record<string, string>)[vehicleNo];
    const info = (compInfoArray as CompInfo[]).find(
      (c) => c.routename === route,
    );

    if (info) {
      form.setFieldsValue({
        vehicleNo: vehicleNo,
        branch: route?.split("##")[1] || "",
        contactPerson: info.contactperson || "",
        contactNo: info.phone || "",
        altContactPerson: info.contactpersontwo || "",
        altContactNo: info.phonetwo || "",
      });
    } else {
      // Reset if no match
      form.resetFields();
      form.setFieldsValue({
        vehicleNo: vehicleNo,
      });
    }
  }, [vehicleNo, form]);

  const handleSubmitForm = async (values: any) => {
    setLoading(true);

    const route = (vehicle_id_arrs as Record<string, string>)[vehicleNo];
    const info = (compInfoArray as CompInfo[]).find(
      (c) => c.routename === route,
    );

    if (!route || !info) {
      message.error("Vehicle information not found!");
      setLoading(false);
      return;
    }

    const payload = {
      request_reason: values.reason || "Temperature Sensor Issue",
      branch_loc: values.branch || route || "",
      pname: values.contactPerson || info.contactperson || "",
      cnumber: values.contactNo || info.phone || "",
      pname_two: values.altContactPerson || info.contactpersontwo || "",
      cnumber_two: values.altContactNo || info.phonetwo || "",
      fromtime: "",
      totime: "",
      gps_time_curr: new Date().toISOString().slice(0, 19).replace("T", " "),
      vehicle_id: vehicleNo || "",
      form_type: "services",
      request_type: "",
      veh_no: vehicleNo || "",
      no_of_vehicals: "",
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const res = await fetch(
        "https://gtrac.in/newtracking/reports/ticketPage.php",
        {
          method: "POST",
          mode: "cors",
          headers: { Accept: "*/*" },
          body: formData,
        },
      );

      const textResponse = await res.text();

      message.success("Ticket submitted successfully!");
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      message.error("Error submitting form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reasonOptions: string[] = [
    "Temperature Sensor Issue",
    "Door Sensor Issue",
    "Network Issue",
    "Constant Reading",
    "No readings",
    "Device Reset Error",
    "Device Wiring Issue",
  ];

  const branchOptions: string[] = [
    "BLG",
    "BLB chamber",
    "BHU",
    "KPM_chamber",
    "AHM",
    "SUR",
    "JPU",
    "KOL",
    "KKT_chamber",
    "PUN",
    "PNE",
    "PNN",
    "PUJ",
    "VIR",
    "VGN",
    "VRN",
    "HYD",
    "VIZ",
    "VIG",
    "CON",
    "CHN",
    "CNN",
    "CNE",
    "MumbaiCS1",
    "MumbaiCS2",
    "MumbaiCS3",
    "Mumbai MBI M32",
    "Mumbai MMA K12",
  ];

  return (
    <Modal
      title={`Raise Ticket — ${vehicleNo || "Select Vehicle"}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmitForm}
        preserve={false}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Vehicle No"
              name="vehicleNo"
              initialValue={vehicleNo}
            >
              <Input readOnly disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: "Please select a reason" }]}
            >
              <Select placeholder="Select Reason" allowClear>
                {reasonOptions.map((reason, index) => (
                  <Option key={index} value={reason}>
                    {reason}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Branch"
              name="branch"
              rules={[{ required: true, message: "Please select a branch" }]}
            >
              <Select placeholder="Select Branch" allowClear>
                {branchOptions.map((branch, index) => (
                  <Option key={index} value={branch}>
                    {branch}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Contact Person" name="contactPerson">
              <Input placeholder="Enter contact person name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Contact No"
              name="contactNo"
              rules={[
                { required: true, message: "Please enter contact number" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit phone number",
                },
              ]}
            >
              <Input placeholder="Enter contact number" maxLength={10} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Alternative Contact Person"
              name="altContactPerson"
            >
              <Input placeholder="Enter alternative contact person name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Alternative Contact No"
              name="altContactNo"
              rules={[
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit phone number",
                },
              ]}
            >
              <Input
                placeholder="Enter alternative contact number"
                maxLength={10}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ backgroundColor: "#5CBD5C", borderColor: "#5CBD5C" }}
            >
              Submit
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
