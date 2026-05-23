"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/_globalRedux/store";
import { setMakeInactiveIndex } from "@/app/_globalRedux/dashboard/optionsSlice";
import { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { useSaveInactiveVehicleMutation } from "@/app/_globalRedux/services/saveInactiveVehicle";
import { useMakeActiveVehicleMutation } from "@/app/_globalRedux/services/makeActiveVehicle";
import { useLazyGetVehiclesByStatusQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { Modal, Select, Input, Button, Upload, message } from "antd";
import type { UploadFile, UploadProps } from "antd";

interface MakeInactiveVehicleProps {
  vehicleData: VehicleData;
}

export const MakeInactiveVehicle: React.FC<MakeInactiveVehicleProps> = ({
  vehicleData,
}) => {
  const dispatch = useDispatch();
  const { makeInactiveIndex } = useSelector(
    (state: RootState) => state.vehicleOverviewOptions,
  );
  const { groupId, userId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  );
  const selectedVehicleListTab = useSelector(
    (state: RootState) => state.selectedVehicleListTab,
  );

  const [selectedReason, setSelectedReason] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [accidentalImages, setAccidentalImages] = useState<UploadFile[]>([]);

  const vehicleNumberKey =
    vehicleData.vehReg?.trim() || String(vehicleData.vId);

  const uploadAccidentalImageToServer = async (file: UploadFile) => {
    const originalFile = file.originFileObj;
    if (!(originalFile instanceof File)) return null;

    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("vehicleId", String(vehicleData.vId));
    formData.append("vehicleNumber", vehicleNumberKey);
    formData.append("timestamp", String(Date.now()));

    try {
      const response = await fetch("/api/upload/accidental-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.filePath || data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
      return null;
    }
  };

  const deleteAccidentalImagesFromServer = async () => {
    try {
      const response = await fetch(
        `/api/upload/accidental-image?vehicleId=${vehicleData.vId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  };

  const [saveInactiveVehicle, { isLoading: isInactivating }] =
    useSaveInactiveVehicleMutation();
  const [makeActiveVehicle, { isLoading: isActivating }] =
    useMakeActiveVehicleMutation();
  const [triggerRefetchVehicleList] = useLazyGetVehiclesByStatusQuery();

  const isVehicleInactive = vehicleData.gpsDtl.inactiveStatus === 1;

  const reasonOptions = [
    "Without Driver",
    "At Workshop",
    "Accidental",
    "Vehicle on Sale",
    "Other",
  ];

  const handleSubmit = async () => {
    try {
      if (isVehicleInactive) {
        const payload = {
          sys_service_id: vehicleData.vId,
          reason: "",
          Other: 0,
          inputDatetime: "",
          otherReason: "",
        };

        await makeActiveVehicle(payload).unwrap();

        const deleted = await deleteAccidentalImagesFromServer();
        if (!deleted) {
          message.warning(
            "Vehicle activated, but the stored image could not be removed.",
          );
        }

        message.success("Vehicle marked as active successfully!");
        triggerRefetchVehicleList({
          userId,
          token: groupId,
          pUserId: parentUser,
          mode:
            selectedVehicleListTab.toUpperCase() === "ALL"
              ? ""
              : selectedVehicleListTab.toUpperCase(),
        });
      } else {
        if (selectedReason === "Accidental" && accidentalImages.length === 0) {
          message.error("Please upload one accidental image.");
          return;
        }

        // Make vehicle inactive - use full form data
        const now = new Date();
        const currentDateTime =
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0") +
          " " +
          String(now.getHours()).padStart(2, "0") +
          ":" +
          String(now.getMinutes()).padStart(2, "0") +
          ":" +
          String(now.getSeconds()).padStart(2, "0");

        const payload = {
          sys_service_id: vehicleData.vId,
          reason: selectedReason === "Other" ? "" : selectedReason,
          Other: selectedReason === "Other" ? 1 : 0,
          inputDatetime: currentDateTime,
          otherReason: selectedReason === "Other" ? remarkText : remarkText,
        };

        await saveInactiveVehicle(payload).unwrap();

        // Upload accidental image to server if present
        if (selectedReason === "Accidental" && accidentalImages[0]) {
          const uploadedPath = await uploadAccidentalImageToServer(accidentalImages[0]);
          if (!uploadedPath) {
            message.warning("Vehicle marked inactive but image upload failed.");
          }
        }

        message.success("Vehicle marked as inactive successfully!");
        triggerRefetchVehicleList({
          userId,
          token: groupId,
          pUserId: parentUser,
          mode:
            selectedVehicleListTab.toUpperCase() === "ALL"
              ? ""
              : selectedVehicleListTab.toUpperCase(),
        });
      }

      handleCancel();
    } catch (error) {
      console.error("Failed to update vehicle status:", error);
      message.error(
        `Failed to ${
          isVehicleInactive ? "activate" : "deactivate"
        } vehicle. Please try again.`,
      );
    }
  };

  const handleCancel = () => {
    dispatch(setMakeInactiveIndex(-1));
    setSelectedReason("");
    setRemarkText("");
    setAccidentalImages([]);
  };

  const uploadProps: UploadProps = {
    accept: "image/*",
    multiple: false,
    maxCount: 1,
    fileList: accidentalImages,
    beforeUpload: () => false,
    onChange: ({ fileList }) => {
      const latest = fileList.slice(-1);
      setAccidentalImages(latest);
    },
  };

  useEffect(() => {
    if (makeInactiveIndex !== vehicleData.vId) return;

    // Reset accidental images when modal opens
    setAccidentalImages([]);
  }, [makeInactiveIndex, vehicleData.vId]);

  return (
    <Modal
      title={isVehicleInactive ? "Activate Vehicle" : "Reason"}
      open={makeInactiveIndex === vehicleData.vId}
      onCancel={handleCancel}
      width={350}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={isInactivating || isActivating}
          disabled={
            !isVehicleInactive &&
            (!selectedReason ||
              !remarkText ||
              (selectedReason === "Accidental" &&
                accidentalImages.length === 0))
          }
        >
          {isVehicleInactive ? "Active" : "Submit"}
        </Button>,
      ]}
    >
      {isVehicleInactive ? (
        <div className="py-4">
          <p>Make this vehicle active</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Select
              placeholder="Select a reason..."
              value={selectedReason || undefined}
              onChange={setSelectedReason}
              className="w-full"
              size="large"
              allowClear
            >
              {reasonOptions.map((reason) => (
                <Select.Option key={reason} value={reason}>
                  {reason}
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedReason && (
            <div>
              <Input
                placeholder="Please Enter Remark..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                size="large"
              />
            </div>
          )}

          {selectedReason === "Accidental" && (
            <div>
              <Upload.Dragger {...uploadProps} className="w-full">
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">Upload a image (required).</p>
              </Upload.Dragger>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
