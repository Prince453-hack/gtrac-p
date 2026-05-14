"use client";

import {
  setSelectedPOI,
  setSelectedPOIList,
} from "@/app/_globalRedux/dashboard/poiSlice";
import { RootState } from "@/app/_globalRedux/store";
import { ConfigProvider, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const selectedStyles = {
  selectorBg: "transparent",
  fontSize: 14,
  optionFontSize: 14,
  optionPadding: "5px",
  optionSelectedColor: "#000",
};

export const PoiDropdownSelector = () => {
  const poiData = useSelector((state: RootState) => state.poiData);
  const dispatch = useDispatch();

  const [poiOptions, setPoiOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedPOIs, setSelectedPOIs] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!poiData) return;

    const pois = poiData.poi.map((item) => ({
      value: item.id,
      label: item.name,
    }));

    const geofences = poiData.geofenceList
      .filter((item) => item.points.length > 0)
      .map((item) => ({
        value: item.id,
        label: item.name,
      }));

    setPoiOptions([...pois, ...geofences]);
  }, [poiData]);

  // Sync local state with Redux store (optional but clean)
  useEffect(() => {
    setSelectedPOIs(poiData.selectedPOIList);
  }, [poiData.selectedPOIList]);

  const filteredOptions = useMemo(() => {
    return poiOptions.filter((opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [poiOptions, inputValue]);

  const handleSelectChange = (values: number[]) => {
    setSelectedPOIs(values);
    dispatch(setSelectedPOIList(values)); // ✅ store selected POIs

    if (values.length === 1) {
      const selected =
        poiData.poi.find((p) => p.id === values[0]) ||
        poiData.geofenceList.find((g) => g.id === values[0]);
      if (selected) dispatch(setSelectedPOI(selected)); // ✅ zoom for one
    }
  };

  const getCustomDisplay = () => {
    const labels = poiOptions
      .filter((opt) => selectedPOIs.includes(opt.value))
      .map((opt) => opt.label);

    if (labels.length === 0) return undefined;
    if (labels.length === 1) return labels[0];
    return `${labels[0]}, ${labels.length - 1} ...`;
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            ...selectedStyles,
            paddingContentVertical: 0,
            controlHeight: 32,
            controlHeightSM: 32,
            controlHeightLG: 32,
          },
          Dropdown: {
            paddingBlock: 10,
          },
        },
        token: {
          colorTextPlaceholder: "#aaa",
        },
      }}
    >
      <Select
        showSearch
        mode="multiple"
        style={{
          width: 300,
          height: 32,
          minHeight: 32,
          maxHeight: 32,
        }}
        placeholder="Select a POI"
        dropdownMatchSelectWidth
        value={selectedPOIs}
        onSearch={(val) => setInputValue(val)}
        onChange={(values: number[]) => {
          setSelectedPOIs(values);
          dispatch(setSelectedPOIList(values));

          if (values.length === 1) {
            const selected =
              poiData.poi.find((p) => p.id === values[0]) ||
              poiData.geofenceList.find((g) => g.id === values[0]);
            if (selected) dispatch(setSelectedPOI(selected));
          }
        }}
        onInputKeyDown={(e) => {
          if (e.key === "Enter") {
            const match = poiOptions.find(
              (opt) => opt.label.toLowerCase() === inputValue.toLowerCase()
            );
            if (match && !selectedPOIs.includes(match.value)) {
              const updated = [...selectedPOIs, match.value];
              setSelectedPOIs(updated);
              dispatch(setSelectedPOIList(updated));

              if (updated.length === 1) {
                const selected =
                  poiData.poi.find((p) => p.id === updated[0]) ||
                  poiData.geofenceList.find((g) => g.id === updated[0]);
                if (selected) dispatch(setSelectedPOI(selected));
              }
            }
            setInputValue("");
          }
        }}
        filterOption={false}
        options={filteredOptions}
        maxTagCount={0}
        maxTagPlaceholder={() => getCustomDisplay()}
      />
    </ConfigProvider>
  );
};
