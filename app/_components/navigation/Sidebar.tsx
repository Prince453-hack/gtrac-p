"use client";

import { RootState } from "@/app/_globalRedux/store";
import { isCheckInAccount } from "@/app/helpers/isCheckInAccount";
import { isVivekSubUser } from "@/app/helpers/isVivekSubUser";
import resetDashboardAndTripSystemState from "@/app/helpers/resetDashboardAndTripSystemState";
import reports, { ReportArr } from "@/lib/reports";
import {
  AlcoholDrivingIcon,
  AlertsIcon,
  ComparisonIcon,
  CurrentMonthReportIcon,
  DashboardIcon,
  DriverIcon,
  FuelFillingIcon,
  IdlingIcon,
  LiveIcon,
  OldReportsIcon,
  PanicIcon,
  PerformanceIcon,
  RawReportIcon,
  ReportIcon,
  ReportsIcon,
  SubUsersIcon,
  TemperatureReportIcon,
  TripSystemIcon,
  VehicleStatusReportIcon,
} from "@/public/assets/svgs/nav";
import {
  AppstoreFilled,
  LeftCircleOutlined,
  RightCircleOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Input, Layout, Menu, Modal } from "antd";
import { PositionType } from "antd/es/image/style";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const { Sider } = Layout;

const Sidebar = ({ children }: { children: ReactNode }) => {
  const [authLocal, setAuthLocal] = useState<any>();
  const {
    extra,
    userId,
    groupId,
    isTemp,
    parentUser,
    accessLabel,
    isMarketVehicle,
    isPadlock,
    password,
    isVideoTelematics,
    isOdb,
  } = useSelector((state: RootState) => state.auth);

  const [reportsForCurrentUser, setReportsForCurrentUser] = useState<
    ReportArr[]
  >([]);

  useEffect(() => {
    const getUserReports = async () => {
      if (window) {
        let tempAuth: any;

        tempAuth = JSON.parse(localStorage.getItem("auth-session") || "{}");

        if (tempAuth) {
          const isEcoGpsAll =
            Number(tempAuth.userId) === 6258 ||
            Number(tempAuth.parentUser) === 6258;
          setAuthLocal(tempAuth);

          const reportsData = reports({
            userId: tempAuth.userId,
            parent_id: tempAuth.parentUser,
            extra: tempAuth.extra,
            groupId: tempAuth.groupId,
          });

          const tempFilteredReports = reportsData.filter((report) => {
            return (
              Number(report.userId) === Number(tempAuth.userId) ||
              (report?.showParent === true &&
                Number(tempAuth.parentUser) !== 1 &&
                Number(report.parentUser) === Number(tempAuth.parentUser)) ||
              (isEcoGpsAll &&
                Number(tempAuth.parentUser) !== 1 &&
                Number(report.parentUser) === Number(tempAuth.parentUser))
            );
          });

          if (tempFilteredReports.length) {
            if (tempFilteredReports[0].reports) {
              setReportsForCurrentUser(tempFilteredReports[0].reports);
            }
          }
        }
      }
    };

    getUserReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const selectedKeys = [pathname];
  const hideSidebarIcons = Number(userId) === 833815;
  const [isTripOnwardOutward, setIsTripOnwardOutward] =
    useState<boolean>(false);
  const [isVehicleImmobilize, setIsVehicleImmobilize] =
    useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] =
    useState<boolean>(false);
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  const handlePasswordVerification = () => {
    if (enteredPassword === password) {
      setIsPasswordModalOpen(false);
      setIsVehicleImmobilize(true);
      setEnteredPassword("");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };
  return (
    <Layout className="h-[calc(100vh-62px)] overflow-hidden">
      {!hideSidebarIcons ? (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={70}
          width={200}
        >
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  colorBgContainer: "#FFFFFF",
                },
              },
            }}
          >
            <Menu
              mode="inline"
              className={`h-[calc(100vh-60px)] relative z-40`}
              selectedKeys={selectedKeys}
              onClick={(info) => {
                if (info.key === "/dashboard") {
                  resetDashboardAndTripSystemState(dispatch);
                }
              }}
              items={[
                ...(isCheckInAccount(Number(userId)) || Number(userId) === 87101
                  ? []
                  : accessLabel === 10
                    ? [
                        ...(Number(userId) === 87205
                          ? [
                              {
                                key: "/dashboard",
                                icon: (
                                  <Image
                                    src={DashboardIcon}
                                    alt="dashboard icon"
                                    width={14}
                                    height={14}
                                  />
                                ),
                                label: (
                                  <a
                                    href="/dashboard"
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                  >
                                    Dashboard
                                  </a>
                                ),
                              },
                              {
                                key: "/trip-report",
                                icon: (
                                  <Image
                                    src={TripSystemIcon}
                                    alt="trip report"
                                    width={14}
                                    height={14}
                                  />
                                ),
                                label: (
                                  <a
                                    href={`/dashboard/all-reports/trip-report`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                  >
                                    Trip Report
                                  </a>
                                ),
                              },

                              ...(isVideoTelematics
                                ? [
                                    {
                                      key: "/dashboard/alerts",
                                      icon: (
                                        <Image
                                          src={AlertsIcon}
                                          alt="alerts"
                                          width={14}
                                          height={14}
                                        />
                                      ),
                                      label: (
                                        <a
                                          href="/dashboard/alerts"
                                          target="_blank"
                                          referrerPolicy="no-referrer"
                                        >
                                          Alerts
                                        </a>
                                      ),

                                      children: [
                                        {
                                          key: "gps_alerts",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="all reports"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/gps-alerts"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Gps Alerts
                                            </a>
                                          ),
                                        },
                                        {
                                          key: "reminders",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="all reports"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/reminders"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Reminders
                                            </a>
                                          ),
                                        },
                                        {
                                          key: "video_alerts",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="all reports"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/adas-alerts"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Adas Alerts
                                            </a>
                                          ),
                                        },
                                        {
                                          key: "alert_management",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="alert management"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/alert-management"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Alert Management
                                            </a>
                                          ),
                                        },
                                      ],
                                    },
                                  ]
                                : [
                                    {
                                      key: "/dashboard/alerts",
                                      icon: (
                                        <Image
                                          src={AlertsIcon}
                                          alt="alerts"
                                          width={14}
                                          height={14}
                                        />
                                      ),
                                      children: [
                                        {
                                          key: "gps_alerts",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="all reports"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/gps-alerts"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Gps Alerts
                                            </a>
                                          ),
                                        },
                                        {
                                          key: "reminders",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="all reports"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/reminders"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Reminders
                                            </a>
                                          ),
                                        },
                                        {
                                          key: "alert_management",
                                          icon: (
                                            <Image
                                              src={ReportsIcon}
                                              alt="alert management"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/alert-management"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Alert Management
                                            </a>
                                          ),
                                        },
                                      ],
                                    },
                                  ]),
                            ]
                          : []),
                        Number(userId) === 87170 ||
                        Number(userId) === 78560 ||
                        Number(userId) === 833176 ||
                        Number(userId) === 833177 ||
                        Number(userId) === 833178 ||
                        Number(userId) === 833180
                          ? {
                              key: "temperature-report",
                              icon: (
                                <Image
                                  src={TemperatureReportIcon}
                                  alt="temperature report"
                                  width={14}
                                  height={14}
                                />
                              ),
                              label: (
                                <a
                                  href={`https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                >
                                  Temperature
                                </a>
                              ),
                            }
                          : null,
                      ]
                    : [
                        ...(Number(userId) === 87310 ||
                        Number(parentUser) === 87310 ||
                        Number(userId) === 78443 ||
                        Number(userId) === 833176 ||
                        Number(userId) === 833177 ||
                        Number(userId) === 833178
                          ? [
                              {
                                key: "/dashboard",
                                icon: (
                                  <Image
                                    src={DashboardIcon}
                                    alt="dashboard icon"
                                    width={14}
                                    height={14}
                                  />
                                ),
                                label: (
                                  <a
                                    href="/dashboard"
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                  >
                                    Dashboard
                                  </a>
                                ),
                              },
                            ]
                          : [
                              ...(isOdb
                                ? [
                                    {
                                      key: "/dashboard/overview",
                                      icon: (
                                        <AppstoreFilled
                                          style={{ color: "#478C83" }}
                                        />
                                      ),
                                      label: (
                                        <a
                                          href="/dashboard/overview"
                                          target="_blank"
                                          referrerPolicy="no-referrer"
                                        >
                                          Overview
                                        </a>
                                      ),
                                    },
                                  ]
                                : []),
                              {
                                key: "/dashboard/all-reports",
                                icon: (
                                  <Image
                                    src={ReportsIcon}
                                    alt="all reports"
                                    width={14}
                                    height={14}
                                  />
                                ),
                                label: "All Reports",
                                children: [
                                  {
                                    key: "/dashboard/all-reports/old-reports",
                                    icon: (
                                      <Image
                                        src={OldReportsIcon}
                                        alt="old report"
                                        width={14}
                                        height={14}
                                      />
                                    ),
                                    label: (
                                      <a
                                        href="/dashboard/all-reports/old-reports"
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                      >
                                        Reports
                                      </a>
                                    ),
                                  },
                                  {
                                    key: "/dashboard/live-vehicle-tracking",
                                    icon: (
                                      <Image
                                        src={LiveIcon}
                                        alt="live vehicle tracking"
                                        width={14}
                                        height={14}
                                      />
                                    ),
                                    label: (
                                      <a
                                        href="/dashboard/live-vehicle-tracking"
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                      >
                                        Live Vehicle Tracking
                                      </a>
                                    ),
                                  },

                                  Number(userId) === 5275
                                    ? {
                                        key: "/dashboard/all-reports/trip-report",
                                        icon: (
                                          <Image
                                            src={TripSystemIcon}
                                            alt="Trip Report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            onClick={() => {
                                              setIsTripOnwardOutward(true);
                                            }}
                                          >
                                            Trip Onward/Outward Report
                                          </a>
                                        ),
                                      }
                                    : null,
                                  accessLabel === 6 && Number(userId) !== 81707
                                    ? {
                                        key: "/dashboard/all-reports/elock-reports",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="elock report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href={`https://gtrac.in/trackingyatayaat/reports/reports_controller_alert_next.php?token=${groupId}&userid=${userId}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Elock
                                          </a>
                                        ),
                                      }
                                    : null,

                                  Number(userId) === 80233 ||
                                  Number(userId) === 4315
                                    ? {
                                        key: "/dashboard/all-reports/vehicle-status-report",
                                        icon: (
                                          <Image
                                            src={VehicleStatusReportIcon}
                                            alt="vehicle status report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href="https://gtrac.in/newtracking/reports/vehicle_statusmrlog.php?token=4344&userid=4315"
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Vehicle Status
                                          </a>
                                        ),
                                      }
                                    : Number(userId) === 4315
                                      ? {
                                          key: "/dashboard/all-reports/vehicle-status-report",
                                          icon: (
                                            <Image
                                              src={VehicleStatusReportIcon}
                                              alt="vehicle status report"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href={`https://gtrac.in/newtracking/reports/vehicle_status.php?token=${groupId}&userid=${userId}`}
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Vehicle Status
                                            </a>
                                          ),
                                        }
                                      : Number(userId) === 83823 ||
                                          Number(userId) === 85182 ||
                                          Number(userId) === 81544 ||
                                          Number(parentUser) === 81544
                                        ? {
                                            key: "/dashboard/all-reports/vehicle-status-report",
                                            icon: (
                                              <Image
                                                src={VehicleStatusReportIcon}
                                                alt="vehicle status report"
                                                width={14}
                                                height={14}
                                              />
                                            ),
                                            label: (
                                              <a
                                                href={`https://gtrac.in/newtracking/chk_all_veh_data_next.php?token=${groupId}&userid=${userId}`}
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                              >
                                                Vehicle Status
                                              </a>
                                            ),
                                          }
                                        : {
                                            key: "/dashboard/all-reports/vehicle-status-report",
                                            icon: (
                                              <Image
                                                src={VehicleStatusReportIcon}
                                                alt="vehicle status report"
                                                width={14}
                                                height={14}
                                              />
                                            ),
                                            label: (
                                              <a
                                                href="/dashboard/all-reports/vehicle-status-report"
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                              >
                                                Vehicle Status
                                              </a>
                                            ),
                                          },
                                  {
                                    key: "/dashboard/all-reports/current-month-report",
                                    icon: (
                                      <Image
                                        src={CurrentMonthReportIcon}
                                        alt="current month report"
                                        width={14}
                                        height={14}
                                      />
                                    ),
                                    label: (
                                      <a
                                        href={`https://gtrac.in/newtracking/reports/currentmonth.php?token=${groupId}&userid=${userId}&extra=${extra}`}
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                      >
                                        Current Month
                                      </a>
                                    ),
                                  },
                                  isTemp
                                    ? {
                                        key: "temperature-report",
                                        icon: (
                                          <Image
                                            src={TemperatureReportIcon}
                                            alt="temperature report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href={`https://gtrac.in/newtracking/reports/all_reports_of_vehicle.php?report=Journey&token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Temperature
                                          </a>
                                        ),
                                      }
                                    : null,

                                  {
                                    key: "/dashboard/all-reports/detailed-report",
                                    icon: (
                                      <Image
                                        src={RawReportIcon}
                                        alt="detailed report"
                                        width={14}
                                        height={14}
                                      />
                                    ),
                                    label: (
                                      <a
                                        href="/dashboard/all-reports/detailed-report"
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                      >
                                        Detailed
                                      </a>
                                    ),
                                  },

                                  Number(userId) === 83458 ||
                                  Number(parentUser) === 83458
                                    ? {
                                        key: "/newtracking/reports/instantveh.php",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="driver alcohol status"
                                            width={16}
                                            height={16}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href="https://gtrac.in/newtracking/reports/instantveh.php"
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Overall Device Status
                                          </a>
                                        ),
                                      }
                                    : null,

                                  isMarketVehicle || isPadlock
                                    ? {
                                        key: "/dashboard/all-reports/vehicle-allocation-report",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="vehicle allocation report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href="/dashboard/all-reports/vehicle-allocation-report"
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Vehicle Allocation Report
                                          </a>
                                        ),
                                      }
                                    : null,

                                  password
                                    ? {
                                        key: "",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="vehicle immobilize"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            onClick={() =>
                                              setIsPasswordModalOpen(true)
                                            }
                                          >
                                            Vehicle Immobilize
                                          </a>
                                        ),
                                      }
                                    : null,

                                  Number(userId) === 3212 ||
                                  isVivekSubUser.includes(Number(userId))
                                    ? {
                                        key: "dashboard/all-reports/summary-reports",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="summary reports"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href="/dashboard/all-reports/summary-reports"
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Summary Report
                                          </a>
                                        ),
                                      }
                                    : null,

                                  Number(userId) === 80758 ||
                                  Number(userId) === 81707
                                    ? {
                                        key: "trip-report",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="trip report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href={`https://gtrac.in/newtracking/reports/poireportokara.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Trip Report
                                          </a>
                                        ),
                                      }
                                    : null,

                                  Number(userId) === 81707 ||
                                  Number(userId) === 3183
                                    ? {
                                        key: "challan-report",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="challan report"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href={`/dashboard/all-reports/challan-report`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Challan Report
                                          </a>
                                        ),
                                      }
                                    : null,

                                  Number(userId) === 6258
                                    ? {
                                        key: "panic-not-working",
                                        icon: (
                                          <Image
                                            src={ReportsIcon}
                                            alt="panic not working"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href={`https://gtrac.in/newtracking/reports/panicnotworking.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Panic Not Working
                                          </a>
                                        ),
                                      }
                                    : null,

                                  ...reportsForCurrentUser.map((report) => ({
                                    key: report.url,
                                    icon: (
                                      <Image
                                        src={ReportsIcon}
                                        alt="reports icon"
                                        width={14}
                                        height={14}
                                      />
                                    ),
                                    label: (
                                      <a
                                        href={`${
                                          report.url[report.url.length - 1] ===
                                          "="
                                            ? `${report.url}${extra}`
                                            : report.url
                                        }`}
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                      >
                                        {report.title}
                                      </a>
                                    ),
                                  })),
                                ],
                              },

                              {
                                key: "/dashboard/manage-sub-users",
                                icon: (
                                  <Image
                                    src={SubUsersIcon}
                                    alt="manage sub users"
                                    width={14}
                                    height={14}
                                  />
                                ),
                                label: (
                                  <a
                                    href="/dashboard/manage-sub-users"
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                  >
                                    Manage Sub Users
                                  </a>
                                ),
                              },
                              ...(accessLabel === 6 &&
                              Number(userId) !== 81707 &&
                              Number(userId) !== 87115
                                ? [
                                    {
                                      key: "/dashboard/elock-alerts",
                                      icon: (
                                        <Image
                                          src={AlertsIcon}
                                          alt="elock icon"
                                          width={14}
                                          height={14}
                                        />
                                      ),
                                      label: (
                                        <a
                                          href="/dashboard/elock-alerts"
                                          target="_blank"
                                          referrerPolicy="no-referrer"
                                        >
                                          Elock Alerts
                                        </a>
                                      ),
                                    },
                                  ]
                                : Number(userId) === 81707
                                  ? [
                                      {
                                        key: "/dashboard/alerts",
                                        icon: (
                                          <Image
                                            src={AlertsIcon}
                                            alt="alerts"
                                            width={14}
                                            height={14}
                                          />
                                        ),
                                        label: (
                                          <a
                                            href="/dashboard/alerts"
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                          >
                                            Alerts
                                          </a>
                                        ),

                                        children: [
                                          {
                                            key: "gps_alerts",
                                            icon: (
                                              <Image
                                                src={ReportsIcon}
                                                alt="all reports"
                                                width={14}
                                                height={14}
                                              />
                                            ),
                                            label: (
                                              <a
                                                href="/dashboard/gps-alerts"
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                              >
                                                Gps Alerts
                                              </a>
                                            ),
                                          },
                                          {
                                            key: "reminders",
                                            icon: (
                                              <Image
                                                src={ReportsIcon}
                                                alt="all reports"
                                                width={14}
                                                height={14}
                                              />
                                            ),
                                            label: (
                                              <a
                                                href="/dashboard/reminders"
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                              >
                                                Reminders
                                              </a>
                                            ),
                                          },
                                          {
                                            key: "alert_management",
                                            icon: (
                                              <Image
                                                src={ReportsIcon}
                                                alt="alert management"
                                                width={14}
                                                height={14}
                                              />
                                            ),
                                            label: (
                                              <a
                                                href="/dashboard/alert-management"
                                                target="_blank"
                                                referrerPolicy="no-referrer"
                                              >
                                                Alert Management
                                              </a>
                                            ),
                                          },
                                        ],
                                      },
                                    ]
                                  : isVideoTelematics
                                    ? [
                                        {
                                          key: "/dashboard/alerts",
                                          icon: (
                                            <Image
                                              src={AlertsIcon}
                                              alt="alerts"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/alerts"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Alerts
                                            </a>
                                          ),

                                          children: [
                                            {
                                              key: "gps_alerts",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="all reports"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href="/dashboard/gps-alerts"
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Gps Alerts
                                                </a>
                                              ),
                                            },
                                            {
                                              key: "reminders",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="all reports"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href="/dashboard/reminders"
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Reminders
                                                </a>
                                              ),
                                            },
                                            {
                                              key: "video_alerts",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="all reports"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href="/dashboard/adas-alerts"
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Adas Alerts
                                                </a>
                                              ),
                                            },
                                            {
                                              key: "alert_management",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="alert management"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href="/dashboard/alert-management"
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Alert Management
                                                </a>
                                              ),
                                            },
                                          ],
                                        },
                                      ]
                                    : [
                                        {
                                          key: "/dashboard/alerts",
                                          icon: (
                                            <Image
                                              src={AlertsIcon}
                                              alt="alerts"
                                              width={14}
                                              height={14}
                                            />
                                          ),
                                          label: (
                                            <a
                                              href="/dashboard/gps-alerts"
                                              target="_blank"
                                              referrerPolicy="no-referrer"
                                            >
                                              Alerts
                                            </a>
                                          ),
                                          children: [
                                            {
                                              key: "gps_alerts",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="all reports"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href="/dashboard/gps-alerts"
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Gps Alerts
                                                </a>
                                              ),
                                            },
                                            {
                                              key: "reminders",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="all reports"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href="/dashboard/reminders"
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Reminders
                                                </a>
                                              ),
                                            },
                                            {
                                              key: "alert_management",
                                              icon: (
                                                <Image
                                                  src={ReportsIcon}
                                                  alt="alert management"
                                                  width={14}
                                                  height={14}
                                                />
                                              ),
                                              label: (
                                                <a
                                                  href={
                                                    Number(userId) !== 6461
                                                      ? "/dashboard/alert-management"
                                                      : "/dashboard/alert-managements"
                                                  }
                                                  target="_blank"
                                                  referrerPolicy="no-referrer"
                                                >
                                                  Alert Management
                                                </a>
                                              ),
                                            },
                                          ],
                                        },

                                        ...(Number(userId) !== 87115
                                          ? [
                                              {
                                                key: "/dashboard/trip-management",
                                                icon: (
                                                  <Image
                                                    src={TripSystemIcon}
                                                    alt="dashboard icon"
                                                    width={16}
                                                    height={16}
                                                  />
                                                ),
                                                label: (
                                                  <a
                                                    href="/dashboard/trip-management"
                                                    target="_blank"
                                                    referrerPolicy="no-referrer"
                                                  >
                                                    Trip Report
                                                  </a>
                                                ),
                                              },
                                            ]
                                          : []),
                                      ]),
                            ]),

                        {
                          key: "5",
                          icon: collapsed ? (
                            <RightCircleOutlined />
                          ) : (
                            <LeftCircleOutlined width={20} />
                          ),
                          label: collapsed ? "Expand" : "Collapse",
                          onClick: () => setCollapsed(!collapsed),
                          style: {
                            position: "absolute" as PositionType,
                            bottom: 2,
                          },
                        },
                      ]),

                Number(userId) === 3212 || Number(parentUser) === 3212
                  ? {
                      key: "/dashboard/driver-alcohol-status",
                      icon: (
                        <Image
                          src={AlcoholDrivingIcon}
                          alt="driver alcohol status"
                          width={16}
                          height={16}
                        />
                      ),
                      label: (
                        <a
                          href="/dashboard/driver-alcohol-status"
                          target="_blank"
                          referrerPolicy="no-referrer"
                        >
                          Driver Alcohol Status
                        </a>
                      ),
                    }
                  : null,

                Number(userId) === 833339
                  ? {
                      key: "/dashboard/trip-management",
                      icon: (
                        <Image
                          src={TripSystemIcon}
                          alt="trip management"
                          width={16}
                          height={16}
                        />
                      ),
                      label: (
                        <a
                          href="/dashboard/trip-management"
                          target="_blank"
                          referrerPolicy="no-referrer"
                        >
                          Trip Management
                        </a>
                      ),
                    }
                  : null,

                Number(userId) === 833193 || isOdb
                  ? {
                      key: "/dashboard/all-reports/fuel-report",
                      icon: (
                        <Image
                          src={FuelFillingIcon}
                          alt="Report"
                          width={16}
                          height={16}
                        />
                      ),
                      label: (
                        <a
                          href="/dashboard/all-reports/fuel-report"
                          target="_blank"
                          referrerPolicy="no-referrer"
                        >
                          Fuel Report
                        </a>
                      ),
                    }
                  : null,
                Number(userId) === 833406 ||
                Number(userId) === 833407 ||
                Number(userId) === 833408 ||
                Number(userId) === 833409
                  ? {
                      key: "/dashboard/attendance-dashboard",
                      icon: (
                        <Image
                          src={ReportsIcon}
                          alt="Dashboard"
                          width={16}
                          height={16}
                        />
                      ),
                      label: (
                        <a
                          href="/dashboard/attendance-dashboard"
                          target="_blank"
                          referrerPolicy="no-referrer"
                        >
                          Attendance Dashboard
                        </a>
                      ),
                    }
                  : null,
                isOdb
                  ? {
                      key: "/dashboard/fleet-report",
                      icon: (
                        <Image
                          src={ReportIcon}
                          alt="fleet report"
                          width={16}
                          height={16}
                          className="object-contain"
                        />
                      ),
                      label: "Fleet Report",
                      children: [
                        {
                          key: "fleet-comparison",
                          icon: (
                            <Image
                              src={ComparisonIcon}
                              alt="fleet comparison"
                              width={14}
                              height={14}
                            />
                          ),
                          label: (
                            <a
                              href="/dashboard/fleet-comparison"
                              target="_blank"
                              referrerPolicy="no-referrer"
                            >
                              Fleet Comparison
                            </a>
                          ),
                        },
                        {
                          key: "fleet-performance",
                          icon: (
                            <Image
                              src={PerformanceIcon}
                              alt="fleet performance"
                              width={14}
                              height={14}
                            />
                          ),
                          label: (
                            <a
                              href="/dashboard/fleet-performance"
                              target="_blank"
                              referrerPolicy="no-referrer"
                            >
                              Fleet Performance
                            </a>
                          ),
                        },
                        {
                          key: "drive-performance",
                          icon: (
                            <Image
                              src={DriverIcon}
                              alt="drive performance"
                              width={14}
                              height={14}
                            />
                          ),
                          label: (
                            <a
                              href="/dashboard/vehicle-information"
                              target="_blank"
                              referrerPolicy="no-referrer"
                            >
                              Driver Performance
                            </a>
                          ),
                        },
                        {
                          key: "idling-trends",
                          icon: (
                            <Image
                              src={IdlingIcon}
                              alt="idling trends"
                              width={14}
                              height={14}
                            />
                          ),
                          label: (
                            <a
                              href="/dashboard/idling-trends"
                              target="_blank"
                              referrerPolicy="no-referrer"
                            >
                              Idling Trends
                            </a>
                          ),
                        },
                      ],
                    }
                  : null,
              ]}
            />
          </ConfigProvider>
        </Sider>
      ) : (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          collapsedWidth={70}
          width={200}
        >
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  colorBgContainer: "#FFFFFF",
                },
              },
            }}
          >
            <Menu
              mode="inline"
              className={`h-[calc(100vh-60px)] relative z-40`}
              selectedKeys={selectedKeys}
              onClick={(info) => {
                if (info.key === "/dashboard") {
                  resetDashboardAndTripSystemState(dispatch);
                }
              }}
              items={[
                {
                  key: "panic-not-working",
                  icon: (
                    <Image
                      src={ReportsIcon}
                      alt="panic not working"
                      width={14}
                      height={14}
                    />
                  ),
                  label: (
                    <a
                      href={`https://gtrac.in/newtracking/reports/panicnotworking.php?token=${groupId}&userid=${userId}&extra=${extra}&puserid=${parentUser}`}
                      target="_blank"
                      referrerPolicy="no-referrer"
                    >
                      Panic Not Working
                    </a>
                  ),
                },
                {
                  key: "/incident-listing-panic",
                  icon: (
                    <Image
                      src={ReportIcon}
                      alt="panics icon"
                      width={14}
                      height={14}
                    />
                  ),
                  label: (
                    <a
                      href={`https://gtrac.in/newtracking/reports/incident_listing.php?token=${groupId}&userid=${userId}&parent_id=${parentUser}&extra=${extra}`}
                      target="_blank"
                      referrerPolicy="no-referrer"
                    >
                      Incident Listing Panic
                    </a>
                  ),
                },
              ]}
            />
          </ConfigProvider>
        </Sider>
      )}

      <Modal
        open={isPasswordModalOpen}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          setEnteredPassword("");
          setPasswordError("");
        }}
        title="Enter Password"
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsPasswordModalOpen(false);
              setEnteredPassword("");
              setPasswordError("");
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handlePasswordVerification}
          >
            Verify
          </Button>,
        ]}
      >
        <div className="py-4">
          <Input.Password
            placeholder="Enter password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            onPressEnter={handlePasswordVerification}
          />
          {passwordError && (
            <p className="text-red-500 mt-2">{passwordError}</p>
          )}
        </div>
      </Modal>

      <Modal
        open={isTripOnwardOutward}
        onCancel={() => setIsTripOnwardOutward(false)}
        footer={null}
        style={{ top: 20 }}
        width="auto"
      >
        <iframe
          title="map"
          src={`https://gtrac.in/newtracking/gatewayTab.php#tab2`}
          style={{ height: "90vh", width: "100%" }}
        />
      </Modal>

      <Modal
        open={isVehicleImmobilize}
        onCancel={() => setIsVehicleImmobilize(false)}
        footer={null}
        style={{ top: 20 }}
        width="auto"
      >
        <iframe
          title="vehicle-immobilize"
          src={`https://gtrac.in/newtracking/reports/ImmobilizeSetall.php?token=${groupId}&userid=${userId}`}
          style={{ height: "90vh", width: "100%" }}
        />
      </Modal>

      <Layout className="relative" style={{ background: "#F6F8F6" }}>
        {children}
      </Layout>
    </Layout>
  );
};

export default Sidebar;
