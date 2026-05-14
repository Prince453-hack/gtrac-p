"use client";

import { toggleElockFilter } from "@/app/_globalRedux/dashboard/elockFilterSlice";
import { RootState } from "@/app/_globalRedux/store";
import { LockOff, LockOn } from "@/public/assets/svgs/nav";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";

const ELockSort = () => {
  const dispatch = useDispatch();

  const isActive = useSelector(
    (state: RootState) => state.elockFilter.onlyControllerVehicles
  );

  const toggleIcon = () => {
    dispatch(toggleElockFilter());
  };

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label="Toggle elock priority sort"
      onClick={toggleIcon}
      className={`group relative p-1 border border-[#C5C5C5] z-20 flex items-center justify-center rounded-full w-8 h-8 ${
        isActive ? "bg-[#478c83]" : ""
      }`}
    >
      <span className="flex items-center justify-center rounded-full overflow-hidden w-7 h-7 transition">
        <Image
          src={isActive ? LockOn : LockOff}
          width={10}
          height={10}
          className="object-contain"
          alt={isActive ? "E-lock On" : "E-lock Off"}
          draggable={false}
        />
      </span>
    </button>
  );
};

export default ELockSort;
