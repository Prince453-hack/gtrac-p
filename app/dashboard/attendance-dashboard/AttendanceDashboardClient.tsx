"use client";

import { RootState } from "@/app/_globalRedux/store";
import { useSelector } from "react-redux";

const AttendanceDashboardClient = () => {
  const { userId } = useSelector((state: RootState) => state.auth);

  const getAttendanceUrl = () => {
    const userIdNum = Number(userId);
    
    if (userIdNum === 833406 || userIdNum === 833407) {
      return "https://yatayaat.in:8080/dashboard/CC-5544993022";
    } else if (userIdNum === 833408 || userIdNum === 833409) {
      return "https://yatayaat.in:8080/dashboard/CR-892384783";
    }
    
    // Fallback URL (shouldn't be reached given sidebar restrictions)
    return "https://yatayaat.in:8080/dashboard/attendance";
  };

  return (
    <iframe
      src={getAttendanceUrl()}
      style={{ width: "100%", height: "100vh", border: "none" }}
      title="Live Attendance"
    />
  );
};

export default AttendanceDashboardClient;