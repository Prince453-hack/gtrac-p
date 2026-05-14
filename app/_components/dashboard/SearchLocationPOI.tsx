"use client";

import { Select, Spin } from "antd";
import React, { useState } from "react";

const { Option } = Select;

interface SearchLocationPOIProps {
  map: google.maps.Map | null;
}

const SearchLocationPOI: React.FC<SearchLocationPOIProps> = ({ map }) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (value: string) => {
    if (!value || !map || !window.google?.maps?.places?.AutocompleteService) {
      console.warn("Missing value/map/service", { value, map });
      return;
    }

    setLoading(true);
    const service = new google.maps.places.AutocompleteService();

    service.getPlacePredictions({ input: value }, (predictions, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        predictions &&
        predictions.length
      ) {
        setOptions(predictions.slice(0, 5));
      } else {
        setOptions([]);
      }
      setLoading(false);
    });
  };

  const handleSelect = (placeId: string) => {
    if (!map) return;

    const service = new google.maps.places.PlacesService(map);
    service.getDetails({ placeId }, (place, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place?.geometry?.location
      ) {
        const location = place.geometry.location;
        map.setCenter(location);
        map.setZoom(15);

        // new google.maps.Marker({
        //   map,
        //   position: location,
        // });
      }
    });
  };

  return (
    <Select
      showSearch
      placeholder="Search a location"
      filterOption={false}
      onSearch={handleSearch}
      onSelect={handleSelect}
      notFoundContent={loading ? <Spin size="small" /> : null}
      style={{ width: 220 }}
      dropdownStyle={{ maxHeight: 200, overflowY: "auto" }}
    >
      {options.map((opt) => (
        <Option key={opt.place_id} value={opt.place_id}>
          {opt.description}
        </Option>
      ))}
    </Select>
  );
};

export default SearchLocationPOI;
