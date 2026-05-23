import React from "react";

export const View = () => {
  return (
    <div className="w-full h-full">
      <iframe
        title="map"
        src={`https://gtrac.in/newtracking/reports/vedanta_fg_bytrip.php?token=57408&userid=85183&puserid=85086&extra=0`}
        style={{ height: "90vh", width: "100%" }}
      />
    </div>
  );
};
