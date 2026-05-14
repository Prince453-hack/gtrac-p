export interface Reports {
  userId: number;
  groupId: number;
  reports: ReportArr[];
}
[];

export interface ReportArr {
  title: string;
  url: string;
}

const reports = ({
  userId,
  groupId,
  extra,
  parent_id,
}: {
  userId: string;
  groupId: string;
  extra: string;
  parent_id: string;
}) => {
  return [
    {
      userId: 3356,
      groupId: 3384,
      parentUser: 1,
      reports: [
        {
          title: `Ignition Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ign_cosolidatetravel.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },

    {
      userId: 82815,
      groupId: 54972,
      parentUser: 1,
      reports: [
        {
          title: `Ignition Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ign_cosolidatetravel.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },

    {
      userId: 4315,
      groupId: 4344,
      parentUser: 4315,
      reports: [
        {
          title: `Trip Import`,
          url: `https://trackingexperts.com/user/trip_import_mrshah_new.php`,
        },
        {
          title: `Night Drive`,
          url: `https://gtrac.in/newtracking/reports/nightdriveupdated.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },

    {
      userId: 6258,
      groupId: 6173,
      parentUser: 6258,
      reports: [
        {
          title: `Incident Listing Panic`,
          url: `https://gtrac.in/newtracking/reports/incident_listing.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
        {
          title: `Client Add Request`,
          url: `https://gtrac.in/newtracking/clientservice/client_addrequest.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
        {
          title: `Client Request View`,
          url: `https://gtrac.in/newtracking/clientservice/client_request_view.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 5275,
      groupId: 5267,
      parentUser: 5275,
      showParent: true,
      reports: [
        {
          title: `All vehicle listing`,
          url: `https://gtrac.in/newtracking/chk_all_veh_data_next.php?token=${groupId}&userid=${userId}`,
        },
        {
          title: `Party wise`,
          url: `https://gtrac.in/newtracking/myaccountgatewayeact.php?token=${groupId}&userid=${userId}`,
        },
        {
          title: `All vehicle Overspeed`,
          url: `https://gtrac.in/newtracking/reports/overspeed_all.php?token=${groupId}&userid=${userId}`,
        },
      ],
    },
    {
      userId: 86046,
      groupId: 58260,
      parentUser: 86046,
      reports: [
        {
          title: `POI`,
          url: `https://gtrac.in/newtracking/reports/poireport.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 1,
      groupId: 1,
      reports: [
        {
          title: `Driver Mapping`,
          url: `https://gtrac.in/newtracking/reports/driver_mapping_list.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
        {
          title: `Manage Driver`,
          url: `https://gtrac.in/newtracking/reports/manage_driver_list.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 4535,
      groupId: 4561,
      parentUser: 4535,
      reports: [
        {
          title: `POI`,
          url: `https://gtrac.in/newtracking/reports/poireport.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 4075,
      groupId: 4105,
      parentUser: 4075,
      reports: [
        {
          title: `AC Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ac_cosolidate.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 86396,
      groupId: 58610,
      parentUser: 86396,
      reports: [
        {
          title: `AC Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ac_cosolidate.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 84712,
      groupId: 56932,
      parentUser: 84712,
      reports: [
        {
          title: `Client Add Request`,
          url: `https://gtrac.in/newtracking/clientservice/client_addrequest.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
        {
          title: `Client Request View`,
          url: `https://gtrac.in/newtracking/clientservice/client_request_view.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },

    {
      userId: 6347,
      groupId: 6255,
      parentUser: 6347,
      reports: [
        {
          title: `AC Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ac_cosolidate.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
        {
          title: `Current Month AC`,
          url: `https://gtrac.in/newtracking/reports/currentmonth_ac_report.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
        {
          title: `Temperature Alert`,
          url: `https://gtrac.in/newtracking/reports/alert_report_snowman.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
        {
          title: `Fuel Alert`,
          url: `https://gtrac.in/newtracking/reports/Snowman_fuel_report.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
        {
          title: `Temperature Summary`,
          url: `https://gtrac.in/newtracking/reports/temperature_summary.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
        {
          title: "Dispatch Entry",
          url: `https://gtrac.in/newtracking/reports/upload_excel_file_snowman.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 85445,
      groupId: 57670,
      parentUser: 85445,
      reports: [
        {
          title: `Temperature Summary`,
          url: `https://gtrac.in/newtracking/reports/temperature_summary.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 81707,
      groupId: 53823,
      parentUser: 81707,
      reports: [
        {
          title: `Trip POI`,
          url: `https://gtrac.in/newtracking/reports/poireportokara.php?token=${groupId}&userid=${userId}&parent_id=${parent_id}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 85380,
      groupId: 4561,
      parentUser: 85380,
      reports: [
        {
          title: `AC Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ac_cosolidate.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 81023,
      groupId: 53096,
      parentUser: 81023,
      reports: [
        {
          title: `AC Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ac_cosolidatetravel.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
        {
          title: `Ignition Consolidate`,
          url: `https://gtrac.in/newtracking/reports/ign_cosolidatetravel.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },
    {
      userId: 83213,
      groupId: 55381,
      parentUser: 83213,
      reports: [
        {
          title: `Consolidate`,
          url: `https://gtrac.in/newtracking/reports/consolidate.php?token=${groupId}&userid=${userId}&extra=${extra}`,
        },
      ],
    },
  ];
};

export default reports;
