"use client";

import { useDispatch, useSelector } from "react-redux";

import { toggleFuelFilter } from "@/app/_globalRedux/dashboard/fuelFilterSlice";
import { RootState } from "@/app/_globalRedux/store";
import { FuelOff, FuelOn } from "@/public/assets/svgs/nav";
import Image from "next/image";

const FuelSort = () => {
  const dispatch = useDispatch();

  const isActive = useSelector(
    (state: RootState) => state.fuelFilter.onlyFuelEnabled
  );

  const toggleIcon = () => {
    dispatch(toggleFuelFilter());
  };

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label="Toggle fuel priority sort"
      onClick={toggleIcon}
      className={`group relative p-1 border border-[#C5C5C5] z-20 flex items-center justify-center rounded-full w-8 h-8 ${
        isActive ? "bg-[#478c83]" : ""
      }`}
    >
      <span className="flex items-center justify-center rounded-full overflow-hidden w-7 h-7 transition">
        <Image
          src={isActive ? FuelOn : FuelOff}
          width={12}
          height={12}
          className="object-contain"
          alt={isActive ? "Fuel On" : "Fuel Off"}
          draggable={false}
        />
      </span>
    </button>
  );
};

export default FuelSort;
