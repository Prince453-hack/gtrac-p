"use client";

import { toggleVideoFilter } from "@/app/_globalRedux/dashboard/videoFilterSlice";
import { RootState } from "@/app/_globalRedux/store";
import { VideoOff, VideoOn } from "@/public/assets/svgs/nav";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";

const DashCamSort = () => {
  const dispatch = useDispatch();

  const isActive = useSelector(
    (state: RootState) => state.videoFilter.onlyVideoEnabled
  );

  const toggleIcon = () => {
    dispatch(toggleVideoFilter());
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
          src={isActive ? VideoOn : VideoOff}
          width={12}
          height={12}
          className="object-contain"
          alt={isActive ? "Video On" : "Video Off"}
          draggable={false}
        />
      </span>
    </button>
  );
};

export default DashCamSort;
