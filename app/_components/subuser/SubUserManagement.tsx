"use client";

import { SubUser } from "@/app/_globalRedux/services/types/subuser";
import {
  useGetSubUsersQuery,
  useLazyAddSubuserVehiclesQuery,
  useLazyCreateSubuserQuery,
  useLazyDeleteSubuserQuery,
  useLazyEditSubuserQuery,
} from "@/app/_globalRedux/services/yatayaat";
import { RootState } from "@/app/_globalRedux/store";
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  MenuProps,
  message,
  Modal,
  Row,
  TableColumnsType,
  Tooltip,
  Typography,
} from "antd";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomTable } from "../common";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseCircleFilled,
  CopyFilled,
  EditFilled,
  EyeFilled,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ModalViewType } from "./View";
import { Markers } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";
import { setAllMarkers } from "@/app/_globalRedux/dashboard/markersSlice";
import {
  useGetVehiclesByStatusQuery,
  useLazySubuserAssignedVehiclesQuery,
} from "@/app/_globalRedux/services/trackingDashboard";
import React from "react";
import { NoticeType } from "antd/es/message/interface";

export const SubUserManagement = ({
  isEditCreateViewModalActive,
  setIsEditCreateViewModalActive,
}: {
  isEditCreateViewModalActive: ModalViewType;
  setIsEditCreateViewModalActive: Dispatch<SetStateAction<ModalViewType>>;
}) => {
  const { userId } = useSelector((state: RootState) => state.auth);

  const { data, refetch } = useGetSubUsersQuery(
    { userId: userId },
    { skip: !userId }
  );

  const [actionActiveIndex, setActionActiveIndex] = useState(-1);
  const [modalActiveIndex, setModalActiveIndex] = useState(-1);

  const getItems = (record: SubUser): MenuProps["items"] | undefined => {
    return [
      {
        key: "1",
        label: (
          <div
            onClick={() => {
              setActionActiveIndex(-1);
              setIsEditCreateViewModalActive("MANAGE VEHICLES");
              setModalActiveIndex(Number(record.user_id));
            }}
          >
            Manage Vehicles
          </div>
        ),
      },
      {
        key: "2",
        label: (
          <div
            onClick={() => {
              setActionActiveIndex(-1);
              setIsEditCreateViewModalActive("DETAILS");
              setModalActiveIndex(Number(record.user_id));
            }}
          >
            View Details
          </div>
        ),
      },
      {
        key: "3",
        label: (
          <div
            onClick={() => {
              setActionActiveIndex(-1);
              setIsEditCreateViewModalActive("EDIT");
              setModalActiveIndex(Number(record.user_id));
            }}
          >
            Edit Subuser
          </div>
        ),
      },
      {
        key: "4",
        label: (
          <div
            onClick={() => {
              setActionActiveIndex(-1);
              setIsEditCreateViewModalActive("DELETE");
              setModalActiveIndex(Number(record.user_id));
            }}
          >
            Delete Subuser
          </div>
        ),
      },
    ];
  };

  const columns: TableColumnsType<SubUser> = [
    {
      title: "Name",
      dataIndex: "fullname",
      key: "name",
    },
    {
      title: "Subuser Name",
      dataIndex: "sys_username",
      key: "name",
    },
    {
      title: "Created On",
      dataIndex: "sys_added_date",
      key: "createdOn",
    },
    {
      title: "Vehicles",
      dataIndex: "vehicle",
      render: (value, record, index) => {
        return (
          <div>
            <Tooltip
              title={
                <div className="max-h-[400px] overflow-scroll">
                  {value &&
                    value.map((vehicle: { veh_reg: string; id: number }) => (
                      <p key={vehicle.id}>{vehicle.veh_reg}</p>
                    ))}
                </div>
              }
              mouseEnterDelay={1}
            >
              {value && value.length > 0
                ? value.length > 3
                  ? value
                      .slice(0, 3)
                      .map((vehicle: { veh_reg: string; id: number }) => (
                        <p key={vehicle.id}>{vehicle.veh_reg}</p>
                      ))
                  : value.map((vehicle: { veh_reg: string; id: number }) => (
                      <p key={vehicle.id}>{vehicle.veh_reg}</p>
                    ))
                : null}
            </Tooltip>
          </div>
        );
      },
      key: "vehicles",
    },
    {
      title: "Email",
      dataIndex: "email_address",
      key: "emailAddress",
    },
    {
      title: "Mobile Number",
      dataIndex: "mobile_number",
      key: "mobileNumber",
    },
    {
      title: "Actions",
      key: "actions",
      width: "150px",

      render: (value, record, index) => {
        return (
          <div
            className="w-fit ml-3 select-none"
            onClick={() =>
              setActionActiveIndex((prev) => (prev !== index ? index : -1))
            }
          >
            <div className="relative">
              <Dropdown
                open={actionActiveIndex === index}
                menu={{ items: getItems(record) }}
                overlayStyle={{ width: "200px" }}
                onOpenChange={() => setActionActiveIndex(-1)}
              >
                <div className="flex justify-center items-center cursor-pointer">
                  <MoreOutlined className="text-xl mr-6" />
                </div>
              </Dropdown>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <CustomTable
        type="Subuser"
        columns={columns}
        scroll_y="calc(100vh - 320px)"
        data={data && data.length > 0 && !data[0].status ? data : null}
        Footer={
          <Row justify="space-between">
            {data && data.length > 1 ? (
              <>
                <div className="flex gap-4"></div>
                <span className="font-bold text-gray-700">
                  Total Subusers: {data?.length || 0}
                </span>
              </>
            ) : null}
          </Row>
        }
      />
      <CreateEditViewModal
        refetchSubusers={refetch}
        view={isEditCreateViewModalActive}
        setView={setIsEditCreateViewModalActive}
        subuserData={
          data &&
          data.find((vehicle) => Number(vehicle.user_id) === modalActiveIndex)
        }
        setModalActiveIndex={setModalActiveIndex}
        allSubusers={data}
      />
    </>
  );
};

const CreateEditViewModal = ({
  view,
  setView,
  subuserData,
  setModalActiveIndex,
  refetchSubusers,
  allSubusers,
}: {
  view: ModalViewType;
  setView: Dispatch<SetStateAction<ModalViewType>>;
  subuserData?: SubUser;
  setModalActiveIndex: Dispatch<SetStateAction<number>>;

  refetchSubusers: () => void;
  allSubusers: SubUser[] | undefined;
}) => {
  const markers = useSelector((state: RootState) => state.markers);
  const {
    userId,
    groupId: token,
    parentUser: pUserId,
  } = useSelector((state: RootState) => state.auth);

  const [selectedVehicleOptions, setSelectedVehicleOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const vehicleOptions = [{ label: "All", value: 0 }].concat(
    markers.map((marker: Markers) => ({
      label: marker.vehReg,
      value: marker.vId,
    }))
  );

  const [promiseLoading, setPromiseLoading] = useState(false);
  const [errorOnSubmit, setErrorOnSubmit] = useState("");
  const [allVehiclesFilter, setAllVehiclesFilter] = useState("");
  const [selectedVehiclesFilter, setSelectedVehiclesFilter] = useState("");
  const [vehiclesSelectedToBeAdded, setVehiclesSelectedToBeAdded] = useState<
    { label: string; value: number }[]
  >([]);
  const [vehiclesSelectedToBeRemoved, setVehiclesSelectedToBeRemoved] =
    useState<{ label: string; value: number }[]>([]);

  const dispatch = useDispatch();
  const [messageApi, contextHolder] = message.useMessage();

  const messageFn = ({
    type,
    content,
  }: {
    type: NoticeType;
    content: string;
  }) => {
    messageApi.open({
      type,
      content,
      duration: 10,
    });
  };

  const { data: markersData } = useGetVehiclesByStatusQuery(
    {
      userId,
      token,
      pUserId,
      mode: "",
    },
    {
      skip: !token || !userId || markers.length > 0,
    }
  );

  const [getSubuserAssignedVehicles] = useLazySubuserAssignedVehiclesQuery();

  useEffect(() => {
    // * checking against data.list.length when more than 1 as we get one element even when we get error
    if (markersData) {
      if (markersData.list.length > 1 && markers.length === 0) {
        dispatch(
          setAllMarkers(
            markersData.list.map((vehicle) => ({
              ...vehicle,
              visibility: true,
              isMarkerInfoWindowOpen: false,
            }))
          )
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersData]);

  useEffect(() => {
    if (view === "MANAGE VEHICLES") {
      getSubuserAssignedVehicles({
        token: subuserData?.sys_group_id || token,
      }).then((assignedVehicles) => {
        if (assignedVehicles.data && assignedVehicles.data.list) {
          if (assignedVehicles.data.list.length > 0) {
            const tempSelectedVehicleOptions = [
              { label: "All", value: 0 },
            ].concat(
              assignedVehicles.data.list.map((vehicle) => ({
                value: vehicle.id,
                label: vehicle.veh_reg,
              }))
            );
            setSelectedVehicleOptions(tempSelectedVehicleOptions);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, subuserData]);

  const reset = () => {
    setView("");
    setModalActiveIndex(-1);
    setErrorOnSubmit("");
    setSelectedVehicleOptions([]);
    setVehiclesSelectedToBeAdded([]);
    setVehiclesSelectedToBeRemoved([]);
  };

  const [
    onAddSubuserTrigger,
    {
      isLoading: isOnAddSubuserTriggerLoading,
      isFetching: isOnAddSubuserTriggerFetching,
    },
  ] = useLazyCreateSubuserQuery();

  const [
    onDeleteSubuserTrigger,
    {
      isLoading: isOnDeleteSubuserTriggerLoading,
      isFetching: isOnDeleteSubuserTriggerFetching,
    },
  ] = useLazyDeleteSubuserQuery();

  const [
    onEditSubuserTrigger,
    {
      isLoading: isOnEditSubuserTriggerLoading,
      isFetching: isOnEditSubuserTriggerFetching,
    },
  ] = useLazyEditSubuserQuery();
  const [
    onAddSubuserVehiclesTrigger,
    {
      isLoading: isOnAddSubuserVehiclesTriggerLoading,
      isFetching: isOnAddSubuserVehiclesFetching,
    },
  ] = useLazyAddSubuserVehiclesQuery();

  const onAddSubuser = (e: {
    email: string;
    confirm_password: string;
    password: string;
    mobile_number: string;
    username: string;
  }) => {
    onAddSubuserTrigger({
      email: e.email,
      password: e.password,
      conf_password: e.confirm_password,
      username: e.username,
      name: e.username,
      userId: userId,
      phone: e.mobile_number,
      token: token,
    }).then(({ data }) => {
      const status = data[0].status;
      const message = data[0].message;

      messageFn({
        type: status === 400 ? "error" : "success",
        content: message,
      });
    });
  };
  const onEditSubuser = (e: {
    email: string;
    confirm_password: string;
    password: string;
    mobile_number: string;
    username: string;
  }) => {
    onEditSubuserTrigger({
      email: e.email,
      password: e.password,
      conf_password: e.confirm_password,
      username: e.username,
      name: e.username,
      userId: subuserData?.user_id || "",
      phone: e.mobile_number,
      token: token,
    });
  };

  const onAddSubuserVehicles = () => {
    onAddSubuserVehiclesTrigger({
      user_id: subuserData?.user_id || "",
      selected_val: `${selectedVehicleOptions
        ?.map((vehicle) => vehicle.value)
        .join(", ")}`,
    });
    reset();
  };

  useEffect(() => {
    if (
      isOnAddSubuserTriggerLoading ||
      isOnAddSubuserTriggerFetching ||
      isOnDeleteSubuserTriggerFetching ||
      isOnDeleteSubuserTriggerLoading ||
      isOnEditSubuserTriggerFetching ||
      isOnEditSubuserTriggerLoading ||
      isOnAddSubuserVehiclesFetching ||
      isOnAddSubuserVehiclesTriggerLoading
    ) {
      setPromiseLoading(true);
    } else if (promiseLoading === true) {
      setPromiseLoading(false);
      reset();
      if (allSubusers?.length) refetchSubusers();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnAddSubuserTriggerFetching,
    isOnAddSubuserTriggerLoading,
    isOnDeleteSubuserTriggerFetching,
    isOnDeleteSubuserTriggerLoading,
    isOnEditSubuserTriggerFetching,
    isOnEditSubuserTriggerLoading,
    isOnAddSubuserVehiclesFetching,
    isOnAddSubuserVehiclesTriggerLoading,
  ]);

  return (
    <>
      {contextHolder}
      <Modal
        open={!!view}
        onCancel={() => reset()}
        onOk={() => reset()}
        title={`${view && view[0]}${view && view.slice(1).toLowerCase()}`}
        footer={() => {
          return (
            <div className="flex items-center justify-between w-full ">
              {view !== "CREATE" &&
              view !== "MANAGE VEHICLES" &&
              view !== "DELETE" ? (
                <div
                  className={`p-1 border-2 border-gray-800 rounded-full flex items-center justify-center  ${
                    view === "DETAILS" ? "" : "absolute bottom-[34px]"
                  }`}
                >
                  {view === "DETAILS" ? (
                    <EditFilled
                      className="text-base"
                      onClick={() => setView("EDIT")}
                    />
                  ) : (
                    <EyeFilled
                      className="text-base"
                      onClick={() => setView("DETAILS")}
                    />
                  )}
                </div>
              ) : (
                <div></div>
              )}
            </div>
          );
        }}
        width={400}
      >
        {view === "DETAILS" ? (
          <div className="bg-white p-4 rounded">
            <Typography.Paragraph
              copyable={{
                text: `Name: ${subuserData?.fullname}\nEmail: ${subuserData?.fullname}\nNumber: ${subuserData?.fullname}`,
                icon: <CopyFilled style={{ color: "rgb(38,38,38)" }} />,
              }}
            >
              <div className="grid grid-cols-5">
                <p className="font-semibold col-span-2">Name: </p>
                <p className="font-medium text-neutral-700 col-span-3">
                  {subuserData?.fullname
                    .split(" ")
                    .map((value) => value[0] + value.slice(1).toLowerCase())
                    .join(" ")}
                </p>

                <p className="font-semibold col-span-2">Email: </p>
                <p className="font-medium text-neutral-700 col-span-3">
                  {subuserData?.email_address}
                </p>

                <p className="font-semibold col-span-2">Contact: </p>
                <p className="font-medium text-neutral-700 col-span-3">
                  {subuserData?.mobile_number}
                </p>
              </div>
              <p className="inline-block w-[calc(100%-30px)]"></p>
            </Typography.Paragraph>
          </div>
        ) : view === "EDIT" || view === "CREATE" ? (
          <Form
            onFinish={(e) =>
              view === "CREATE" ? onAddSubuser(e) : onEditSubuser(e)
            }
            className="select-none"
          >
            <div className="grid grid-cols-5 items-center space-y-4">
              <p className="font-semibold col-span-2">Name: </p>
              <Form.Item name="username" noStyle>
                <Input
                  placeholder={
                    view === "EDIT" ? subuserData?.fullname : "Enter Name"
                  }
                  className="col-span-3"
                />
              </Form.Item>

              <p className="font-semibold col-span-2">Email: </p>
              <Form.Item name="email" noStyle>
                <Input
                  placeholder={
                    view === "EDIT" ? subuserData?.email_address : "Enter Email"
                  }
                  className="col-span-3"
                />
              </Form.Item>

              <p className="font-semibold col-span-2">Contact: </p>
              <Form.Item name="mobile_number" noStyle>
                <Input
                  placeholder={
                    view === "EDIT"
                      ? subuserData?.mobile_number
                      : "Enter Mobile Number"
                  }
                  style={{ width: "100%" }}
                  className="col-span-3"
                />
              </Form.Item>

              <p className="font-semibold col-span-2">Password: </p>
              <Form.Item name="password" noStyle>
                <Input
                  placeholder={"Enter New Password"}
                  style={{ width: "100%" }}
                  className="col-span-3"
                />
              </Form.Item>
              <p className="font-semibold col-span-2"> Confirm Password: </p>
              <Form.Item name="confirm_password" noStyle>
                <Input
                  placeholder={"Confirm New Password"}
                  style={{ width: "100%" }}
                  className="col-span-3"
                />
              </Form.Item>
            </div>
            <div>
              {errorOnSubmit ? (
                <div className="text-red-700 absolute right-0 px-6 mb-4 py-1 rounded  bottom-16 bg-red-50 w-full flex items-center">
                  <p className="font-medium text-sm">{errorOnSubmit}</p>
                  <CloseCircleFilled
                    style={{
                      color: "rgb(185,24,24)",
                      position: "absolute",
                      right: 24,
                      cursor: "pointer",
                    }}
                    onClick={() => setErrorOnSubmit("")}
                  />
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="flex gap-2 w-full justify-end mt-14">
              <Button onClick={() => reset()}>Cancel</Button>
              <Button htmlType="submit" type="primary" loading={promiseLoading}>
                Submit
              </Button>
            </div>
          </Form>
        ) : view === "MANAGE VEHICLES" ? (
          <Form className="select-none" onFinish={() => onAddSubuserVehicles()}>
            <div className="space-y-6">
              <div className="grid grid-cols-5 items-center">
                <p className="font-semibold col-span-2">Name: </p>
                <div className="col-span-3 text-gray-800">
                  {subuserData?.fullname
                    .trim()
                    .split(" ")
                    .map((value) => value[0] + value.slice(1).toLowerCase())
                    .join(" ")}
                </div>
              </div>

              <div className="flex items-center w-full  font-semibold gap-2 ">
                <div>Edit: </div>
              </div>
              <div className="grid grid-cols-11 items-center gap-4 min-w-[352px] -ml-0.5">
                <div className="col-span-5 space-y-1">
                  <p className="font-semibold">All Vehicles</p>

                  <div className="border border-neutral-400 rounded-md h-52 overflow-scroll relative">
                    <div style={{ position: "sticky", top: 0 }}>
                      <Input
                        styles={{
                          input: {
                            borderRadius: "6px 6px 0 0",
                            fontSize: "14px",
                            paddingBlock: "3px",
                          },
                        }}
                        placeholder="Search Vehicles"
                        style={{ borderRadius: "6px 6px 0 0" }}
                        value={allVehiclesFilter}
                        type="text"
                        onChange={(e) => setAllVehiclesFilter(e.target.value)}
                        suffix={<SearchOutlined />}
                      />
                    </div>
                    {allVehiclesFilter
                      ? vehicleOptions
                          .filter(
                            (vehicle) =>
                              selectedVehicleOptions &&
                              selectedVehicleOptions.every(
                                (selectedVehicle) =>
                                  vehicle.label !== selectedVehicle.label
                              )
                          )
                          .map((vehicle) =>
                            vehicle.label.includes(allVehiclesFilter) ? (
                              <div
                                style={{ fontFamily: "Arial, sans-serif" }}
                                key={vehicle.value}
                                className={`font-medium py-2 pl-2 border-b  ${
                                  vehiclesSelectedToBeAdded.findIndex(
                                    (i) => i.label === vehicle.label
                                  ) !== -1
                                    ? "bg-[#4FB090] text-white"
                                    : "hover:bg-white"
                                } `}
                                onClick={() => {
                                  if (vehicle.value === 0) {
                                    if (
                                      vehiclesSelectedToBeAdded.length ===
                                      vehicleOptions.length
                                    ) {
                                      setVehiclesSelectedToBeAdded([]);
                                    } else {
                                      setVehiclesSelectedToBeAdded(
                                        vehicleOptions
                                      );
                                    }
                                  } else {
                                    let tempIndex =
                                      vehiclesSelectedToBeAdded.findIndex(
                                        (i) => i.label === vehicle.label
                                      );

                                    if (tempIndex === -1) {
                                      setVehiclesSelectedToBeAdded((prev) => [
                                        ...prev,
                                        vehicle,
                                      ]);
                                    } else {
                                      setVehiclesSelectedToBeAdded((prev) => [
                                        ...prev.slice(0, tempIndex),
                                        ...prev.slice(tempIndex + 1),
                                      ]);
                                    }
                                  }
                                }}
                              >
                                {vehicle.label}
                              </div>
                            ) : null
                          )
                      : vehicleOptions.map((vehicle) => (
                          <div
                            key={vehicle.value}
                            style={{ fontFamily: "Arial, sans-serif" }}
                            className={`font-medium py-2 pl-2 border-b cursor-pointer  ${
                              vehiclesSelectedToBeAdded.findIndex(
                                (i) => i.label === vehicle.label
                              ) !== -1
                                ? "bg-[#4FB090] text-white"
                                : "hover:bg-white"
                            } `}
                            onClick={() => {
                              if (vehicle.value === 0) {
                                if (
                                  vehiclesSelectedToBeAdded.length ===
                                  vehicleOptions.length
                                ) {
                                  setVehiclesSelectedToBeAdded([]);
                                } else {
                                  setVehiclesSelectedToBeAdded(vehicleOptions);
                                }
                              } else {
                                let tempIndex =
                                  vehiclesSelectedToBeAdded.findIndex(
                                    (i) => i.label === vehicle.label
                                  );

                                if (tempIndex === -1) {
                                  setVehiclesSelectedToBeAdded((prev) => [
                                    ...prev,
                                    vehicle,
                                  ]);
                                } else {
                                  setVehiclesSelectedToBeAdded((prev) => [
                                    ...prev.slice(0, tempIndex),
                                    ...prev.slice(tempIndex + 1),
                                  ]);
                                }
                              }
                            }}
                          >
                            {vehicle.label}
                          </div>
                        ))}
                  </div>
                </div>
                <div className="gap-2 flex flex-col col-span-1 justify-center items-center">
                  <Button
                    icon={<ArrowRightOutlined />}
                    onClick={() => {
                      setSelectedVehicleOptions((prev) => [
                        ...prev,
                        ...vehiclesSelectedToBeAdded,
                      ]);
                      setVehiclesSelectedToBeAdded([]);
                    }}
                  />
                  <div>
                    <Button
                      icon={<ArrowLeftOutlined />}
                      onClick={() => {
                        setSelectedVehicleOptions((prev) =>
                          prev.filter(
                            (e) =>
                              !vehiclesSelectedToBeRemoved.some(
                                (i) => e.label === i.label
                              )
                          )
                        );
                        setVehiclesSelectedToBeRemoved([]);
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-5 space-y-1">
                  <p className="font-semibold">Selected Vehicles</p>
                  <div className="border border-neutral-400 rounded-md h-52 overflow-scroll">
                    <div style={{ position: "sticky", top: 0 }}>
                      <Input
                        styles={{
                          input: {
                            borderRadius: "6px 6px 0 0",
                            fontSize: "14px",
                            paddingBlock: "3px",
                          },
                        }}
                        value={selectedVehiclesFilter}
                        type="text"
                        onChange={(e) =>
                          setSelectedVehiclesFilter(e.target.value)
                        }
                        placeholder="Search Vehicles"
                        style={{ borderRadius: "6px 6px 0 0" }}
                        suffix={<SearchOutlined />}
                      />
                    </div>
                    {selectedVehicleOptions && selectedVehicleOptions.length > 0
                      ? selectedVehiclesFilter
                        ? selectedVehicleOptions.map((vehicle) =>
                            vehicle.label.includes(selectedVehiclesFilter) ? (
                              <div
                                key={vehicle.value}
                                style={{ fontFamily: "Arial, sans-serif" }}
                                className={`font-medium py-2 pl-2 border-b cursor-pointer  ${
                                  vehiclesSelectedToBeRemoved.findIndex(
                                    (i) => i.label === vehicle.label
                                  ) !== -1
                                    ? "bg-[#4FB090] text-white"
                                    : "hover:bg-white"
                                } `}
                                onClick={() => {
                                  if (vehicle.value === 0) {
                                    if (
                                      vehiclesSelectedToBeRemoved.length ===
                                      selectedVehicleOptions.length
                                    ) {
                                      setVehiclesSelectedToBeRemoved([]);
                                    } else {
                                      setVehiclesSelectedToBeRemoved(
                                        selectedVehicleOptions
                                      );
                                    }
                                  } else {
                                    let tempIndex =
                                      vehiclesSelectedToBeRemoved.findIndex(
                                        (i) => i.label === vehicle.label
                                      );

                                    if (tempIndex === -1) {
                                      setVehiclesSelectedToBeRemoved((prev) => [
                                        ...prev,
                                        vehicle,
                                      ]);
                                    } else {
                                      setVehiclesSelectedToBeRemoved((prev) => [
                                        ...prev.slice(0, tempIndex),
                                        ...prev.slice(tempIndex + 1),
                                      ]);
                                    }
                                  }
                                }}
                              >
                                {vehicle.label}
                              </div>
                            ) : null
                          )
                        : selectedVehicleOptions.map((vehicle) => (
                            <div
                              key={vehicle.value}
                              style={{ fontFamily: "Arial, sans-serif" }}
                              className={`font-medium py-2 pl-2 border-b  ${
                                vehiclesSelectedToBeRemoved.findIndex(
                                  (i) => i.label === vehicle.label
                                ) !== -1
                                  ? "bg-[#4FB090] text-white"
                                  : "hover:bg-white"
                              } `}
                              onClick={() => {
                                if (vehicle.value === 0) {
                                  if (
                                    vehiclesSelectedToBeRemoved.length ===
                                    selectedVehicleOptions.length
                                  ) {
                                    setVehiclesSelectedToBeRemoved([]);
                                  } else {
                                    setVehiclesSelectedToBeRemoved(
                                      selectedVehicleOptions
                                    );
                                  }
                                } else {
                                  let tempIndex =
                                    vehiclesSelectedToBeRemoved.findIndex(
                                      (i) => i.label === vehicle.label
                                    );

                                  if (tempIndex === -1) {
                                    setVehiclesSelectedToBeRemoved((prev) => [
                                      ...prev,
                                      vehicle,
                                    ]);
                                  } else {
                                    setVehiclesSelectedToBeRemoved((prev) => [
                                      ...prev.slice(0, tempIndex),
                                      ...prev.slice(tempIndex + 1),
                                    ]);
                                  }
                                }
                              }}
                            >
                              {vehicle.label}
                            </div>
                          ))
                      : null}
                  </div>
                </div>
              </div>
            </div>
            <div>
              {errorOnSubmit ? (
                <div className="text-red-700 absolute right-0 px-6 mb-4 py-1 rounded  bottom-16 bg-red-50 w-full flex items-center">
                  <p className="font-medium text-sm">{errorOnSubmit}</p>
                  <CloseCircleFilled
                    style={{
                      color: "rgb(185,24,24)",
                      position: "absolute",
                      right: 24,
                      cursor: "pointer",
                    }}
                    onClick={() => setErrorOnSubmit("")}
                  />
                </div>
              ) : (
                ""
              )}
            </div>
            <div className="flex gap-2 w-full justify-end mt-8">
              <Button onClick={() => reset()}>Cancel</Button>
              <Button htmlType="submit" type="primary">
                Submit
              </Button>
            </div>
          </Form>
        ) : (
          <div>
            <p>
              Are you sure you want to delete {subuserData?.fullname} as a
              Subuser ?
            </p>
            <div className="flex gap-2 w-full justify-end mt-8">
              <Button onClick={() => reset()}>Cancel</Button>
              <Button
                type="primary"
                loading={promiseLoading}
                onClick={() =>
                  onDeleteSubuserTrigger({
                    user_id: Number(subuserData?.user_id) || 0,
                  })
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
