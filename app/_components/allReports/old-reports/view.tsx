"use client";

import { RootState } from "@/app/_globalRedux/store";
import { Card, Spin } from "antd";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

export const View = () => {
  const { extra, groupId, parentUser, userId } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if (userId) {
      axios.get(
        `https://gtrac.in/newtracking/reports/panicnotworking.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
      );
    }
  }, [userId]);

  const allReports = [
    Number(userId) === 85182 || Number(userId) === 85086
      ? {
          title: "Alumina Trip Report",
          url: `https://gtrac.in/newtracking/reports/poireport_vedanta.php?token=${groupId}&userid=${userId}&puserid=${parentUser}&extra=${extra}`,
        }
      : {},
    Number(userId) === 85183 || Number(userId) === 85086
      ? {
          title: "FG Trip Report",
          url: `https://gtrac.in/newtracking/reports/vedanta_fg_bytrip.php?token=${groupId}&userid=${userId}&puserid=${parentUser}&extra=${extra}`,
        }
      : {},
    Number(userId) === 85086 || Number(userId) === 85184
      ? {
          title: "Coal Trip Report",
          url: `https://gtrac.in/newtracking/reports/vedanta_coal.php?token=${groupId}&userid=${userId}&puserid=${parentUser}&extra=${extra}`,
        }
      : {},

    Number(userId) === 86722
      ? {
          title: "Immobilize Report",
          url: `http://gtrac.in/newtracking/reports/Immobilize_report.php?token=${groupId}&userid=${userId}`,
        }
      : {},
    Number(userId) === 85048
      ? {
          title: "All Vehicle Overspeed Report",
          url: `https://gtrac.in/voneweb/reports/overspeed_report.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        }
      : {},
    Number(userId) === 81707 || Number(userId) === 87197
      ? {
          title: "Fix Trip Report",
          url: `https://gtrac.in/newtracking/reports/poireportokaravasai.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        }
      : {},
    ...(Number(userId) === 81707 || Number(userId) === 87197
      ? [
          {
            title: "In Geofence",
            url: `https://gtrac.in/newtracking/reports/geofencereportokara.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
          },
          {
            title: "Geofence Halting",
            url: `https://gtrac.in/newtracking/reports/okarahaltinggeo.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
          },
        ]
      : [{}]),

    {
      title: "Current Month Report",
      url: `https://gtrac.in/newtracking/reports/currentmonth.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },

    {
      title: "Consolidated Report",
      url: `/dashboard/all-reports/consolidated-detail-report`,
    },
    {
      title: "Non-Journey Report",
      url: `https://gtrac.in/newtracking/reports/non-journey-report.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Continuous Journey",
      url: `/dashboard/all-reports/continuous-journey-report`,
    },
    {
      title: "Performance Report",
      url: `/dashboard/all-reports/performance-report`,
    },
    {
      title: "Vehicle Profile",
      url: `https://gtrac.in/newtracking/reports/vehicle_profile.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Monthly Analysis Report",
      url: `https://gtrac.in/newtracking/reports/monthly_analysis.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Toll Report",
      url: `https://gtrac.in/newtracking/reports/tollreport.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Toll Information System",
      url: `https://tis.nhai.gov.in/tollplazasonmap`,
    },
    {
      title: "POI Report",
      url: `https://gtrac.in/newtracking/reports/poireport.php?token=${groupId}&userid=${userId}&parent_id=${parentUser}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Night Drive",
      url: `https://gtrac.in/newtracking/reports/nightdriveupdated.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Dispatch Entry",
      url: `https://gtrac.in/newtracking/reports/client_veh_information_list.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Near By Vehicle",
      url: `https://gtrac.in/newtracking/reports/proximity.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Nearest Service Center",
      url: `https://gtrac.in/newtracking/reports/nearestservicecenter.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    Number(userId) === 78213 || Number(parentUser) === 78213
      ? {
          title: "Journey Report",
          url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        }
      : {
          title: "Journey Report",
          url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        },
    {
      title: "Diagnostic History",
      url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Diagnostic&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Temperature Report",
      url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    Number(userId) === 87318 || Number(parentUser) === 87318
      ? {
          title: "Movement Report",
          url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        }
      : Number(userId) === 3356 ||
          Number(parentUser) === 3356 ||
          Number(userId) === 87470 ||
          Number(parentUser) === 87470
        ? {
            title: "Movement Report",
            url: `https://gtrac.in/voneweb/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
          }
        : {
            title: "Movement Report",
            url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
          },

    {
      title: "Manage Driver",
      url: `https://gtrac.in/newtracking/reports/manage_driver_list.php?report=driver&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Driver Mapping",
      url: `https://gtrac.in/newtracking/reports/driver_mapping_list.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "AC Report",
      url: `https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    Number(userId) === 85380 || Number(userId) === 81023
      ? {
          title: "Consolidated AC Report",
          url: `https://gtrac.in/newtracking/reports/ac_cosolidatetravel.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        }
      : {
          title: "Consolidated AC Report",
          url: `https://gtrac.in/newtracking/reports/ac_cosolidate.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        },
    Number(userId) === 86693
      ? {
          title: "POI Summary Report",
          url: `https://gtrac.in/newtracking/reports/poi_summery.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        }
      : {},

    {
      title: "Driver Behaviour Report",
      url:
        Number(userId) === 3356 ||
        Number(parentUser) === 3356 ||
        Number(userId) === 87470 ||
        Number(parentUser) === 87470
          ? `https://gtrac.in/voneweb/reports/allreportallvhl.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`
          : `https://gtrac.in/newtracking/reports/allreportallvhl.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    {
      title: "Today KM",
      url:
        Number(userId) === 3356
          ? `https://gtrac.in/voneweb/reports/chk_all_veh_withKM.php?token=3384&userid=3356&extra=0&puserid=1`
          : `https://gtrac.in/newtracking/reports/chk_all_veh_withKM.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
    },
    Number(userId) === 3356 || Number(userId) === 833193
      ? {
          title: "Fuel Report",
          url: `/dashboard/all-reports/fuel-report`,
        }
      : {},
    Number(userId) === 833016
      ? {
          title: "All Vehicles Alcohol Report",
          url: `https://gtrac.in/newtracking/reports/alcohol_report.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`,
        }
      : {},
    Number(userId) === 84712
      ? {
          title: "Last Unlocked Report",
          url: `https://gtrac.in/newtracking/reports/lock_unlock_report.php?report=Journey&token=56932&userid=84712&extra=0&puserid=1`,
        }
      : {},
  ];

  return (
    <div className="m-4 grid-cols-5 grid gap-6">
      {userId ? (
        allReports.map((report) =>
          report.title ? (
            <a
              key={report.title}
              href={report.url}
              target="_blank"
              referrerPolicy="no-referrer"
            >
              <Card
                styles={{
                  body: {
                    background: `${report.url ? "#F2F5F3" : "#CED2CF"} `,
                    borderRadius: "15px",
                  },
                }}
                style={{
                  borderRadius: "15px",
                  background: `${report.url ? "#F2F5F3" : "#CED2CF"} `,
                }}
                className={`shadow ${
                  report.url ? "cursor-pointer" : "cursor-not-allowed"
                } `}
              >
                <div className={`${report.url ? "" : "text-stone-500"}`}>
                  {report.title}
                </div>
              </Card>
            </a>
          ) : null,
        )
      ) : (
        <div className="w-[calc(100vw-200px)] h-[calc(100vh-200px)] flex items-center justify-center">
          <Spin className="relative" size="large" />
        </div>
      )}
    </div>
  );
};
