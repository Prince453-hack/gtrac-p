"use client";

import { toggleTicketFilter } from "@/app/_globalRedux/dashboard/ticketStatusSlice";
import { RootState } from "@/app/_globalRedux/store";
import { ServiceOff, ServiceOn } from "@/public/assets/svgs/nav";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";

const TicketStatus = () => {
  const dispatch = useDispatch();

  const isActive = useSelector(
    (state: RootState) => state.ticketStatus.onlyTicketEnabled
  );

  const toggleIcon = () => {
    dispatch(toggleTicketFilter());
  };

  return (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label="Toggle ticket status filter"
      onClick={toggleIcon}
      className={`group relative p-1 border border-[#C5C5C5] z-20 flex items-center justify-center rounded-full w-8 h-8 ${
        isActive ? "bg-[#478c83]" : ""
      }`}
    >
      <span className="flex items-center justify-center rounded-full overflow-hidden w-7 h-7 transition">
        <Image
          src={isActive ? ServiceOn : ServiceOff}
          width={16}
          height={16}
          className="object-contain"
          alt={isActive ? "Ticket Filter On" : "Ticket Filter Off"}
          draggable={false}
        />
      </span>
    </button>
  );
};

export default TicketStatus;
