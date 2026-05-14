"use client";

import { RootState } from "@/app/_globalRedux/store";
import { DownOutlined, UserOutlined } from "@ant-design/icons";
import {
  Divider,
  Dropdown,
  DropdownProps,
  MenuProps,
  Popover,
  Space,
  Spin,
  Switch,
  theme,
  Tooltip,
} from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChangePassword } from "./ChangePassword";
import { LogoutItem } from "../navigation/TopNavbar";
import { useSaveMapChoiceMutation } from "@/app/_globalRedux/services/trackingDashboard";
import { setAuth } from "@/app/_globalRedux/common/authSlice";
import { ReloadWindowModal } from "../navigation/ReloadWindowModal";
import { useGetSubUsersQuery } from "@/app/_globalRedux/services/yatayaat";

const { useToken } = theme;

function UserSettings() {
  const { userName, isGoogleMap, userId, parentUser } = useSelector(
    (state: RootState) => state.auth
  );
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [reloadWindowModal, setReloadWindowModal] = useState(false);
  const [isGlobalLoader, setIsGlobalLoader] = useState(false);
  const [subuserOptions, setSubuserOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [saveMapChoice, { isLoading }] = useSaveMapChoiceMutation();
  const { data: subuserData, isLoading: isSubuserLoading } =
    useGetSubUsersQuery(
      {
        userId: permissions.userId,
      },
      { skip: !permissions.userId || Number(permissions.parentUser) !== 1 }
    );

  useEffect(() => {
    if (subuserData && subuserData.length > 0) {
      const options = subuserData.map((user) => ({
        value: user.user_id,
        label: user.sys_username,
      }));
      setSubuserOptions(options);
    }
  }, [subuserData]);

  const handleOpenChange: DropdownProps["onOpenChange"] = (nextOpen, info) => {
    if (info.source === "trigger" || nextOpen) {
      setUserSettingsOpen(nextOpen);
    }
  };

  const { token } = useToken();

  const contentStyle: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };

  const menuStyle: React.CSSProperties = {
    boxShadow: "none",
  };

  const items: MenuProps["items"] = [
    {
      key: "0",
      label: (
        <div className="relative mb-1">
          {permissions.parentUser === 1 ? (
            <div className="w-full">
              <Popover
                arrow={false}
                trigger={"click"}
                placement="leftBottom"
                overlayInnerStyle={{
                  padding: 0,
                  marginRight: 15,
                  marginTop: -8,
                }}
                className="w-full"
                content={
                  <div
                    className="w-full flex flex-col h-[500px] overflow-y-scroll scrollbar-thumb-thumb-green scrollbar-w-2  scrollbar-thumb-rounded-md scrollbar overflow-visible"
                    key={permissions.userId}
                  >
                    <div className="w-full border-b-[1px] border-neutral-300 py-1.5 pl-3">
                      <p className="text-lg font-semibold">Subusers</p>
                      <div
                        className="text-xs font-semibold py-0.5 cursor-pointer"
                        onClick={() => {
                          const updatedAuth = {
                            ...auth,
                            userId: `${permissions.userId}`,
                            groupId: `${permissions.groupId}`,
                            parentUser: "1",
                            userName: permissions.userName,
                          };
                          dispatch(setAuth(updatedAuth));
                          localStorage.setItem(
                            "auth-session",
                            JSON.stringify(updatedAuth)
                          );
                          window.location.reload();
                        }}
                      >
                        Switch to main account
                      </div>
                    </div>

                    {subuserData && subuserData?.length > 0
                      ? subuserData.map((option) => (
                          <div
                            className="hover:bg-neutral-100 pr-10 pl-3 py-2 font-medium text-sm cursor-pointer w-full"
                            key={option.user_id}
                            onClick={() => {
                              const updatedAuth = {
                                ...auth,
                                userId: option.user_id,
                                groupId: option.sys_group_id,
                                parentUser: `${permissions.userId}`,
                                userName: option.sys_username,
                              };
                              dispatch(setAuth(updatedAuth));
                              localStorage.setItem(
                                "auth-session",
                                JSON.stringify(updatedAuth)
                              );
                              window.location.reload();
                            }}
                          >
                            {option.sys_username}
                          </div>
                        ))
                      : null}
                  </div>
                }
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-xl text-gray-600 select-none">
                    {userName?.charAt(0)?.toUpperCase() + userName?.slice(1)}
                  </p>
                  <DownOutlined className="text-xl" />
                </div>
              </Popover>
            </div>
          ) : (
            <p className="font-medium text-xl text-gray-600 select-none text-center w-full">
              {userName?.charAt(0)?.toUpperCase() + userName?.slice(1)}
            </p>
          )}
        </div>
      ),
      disabled: Number(permissions.parentUser) !== 1 ? true : false,
    },
    ...(Number(userId) === 87307 ||
    Number(userId) === 3085 ||
    Number(parentUser) === 3085 ||
    Number(userId) === 87162 ||
    Number(parentUser) === 87162 ||
    Number(userId) === 87317
      ? []
      : [
          {
            key: "toggle_open_street_map",
            label: (
              <div className="w-full rounded-sm hover:text-primary-green transition-colors duration-300 flex items-center justify-between">
                <p>Toggle open street map</p>
                <Switch
                  loading={isLoading}
                  value={isGoogleMap === 0}
                  onClick={() => {
                    saveMapChoice({
                      userid: Number(userId),
                      isgooglemap: isGoogleMap === 1 ? 0 : 1,
                    }).then(() => {
                      setReloadWindowModal(true);
                      const updatedIsGoogleMap = isGoogleMap === 1 ? 0 : 1;

                      dispatch(
                        setAuth({ ...auth, isGoogleMap: updatedIsGoogleMap })
                      );
                      localStorage.setItem(
                        "auth-session",
                        JSON.stringify({
                          ...auth,
                          isGoogleMap: updatedIsGoogleMap,
                        })
                      );
                    });
                  }}
                />
              </div>
            ),
          },
        ]),

    Number(userId) === 4607
      ? null
      : {
          key: "change_password",
          label: (
            <p
              className="w-full rounded-sm hover:text-primary-green transition-colors duration-300"
              onClick={() => {
                setChangePasswordModalOpen(true);
              }}
            >
              Change password
            </p>
          ),
        },
  ];

  return (
    <>
      <ReloadWindowModal
        reloadWindowModal={reloadWindowModal}
        setReloadWindowModal={setReloadWindowModal}
      />
      {isGlobalLoader ? (
        <div className="h-screen w-screen absolute top-0 -left-[15px] z-[9999] bg-[rgba(255,255,255)] flex items-center justify-center">
          <Spin size="large" spinning={true} />
        </div>
      ) : (
        ""
      )}
      <ChangePassword
        setChangePasswordModalOpen={setChangePasswordModalOpen}
        changePasswordModalOpen={changePasswordModalOpen}
      />
      <Dropdown
        menu={{
          items,
          onClick: () => {},
        }}
        dropdownRender={(menu) => (
          <div style={contentStyle}>
            {React.cloneElement(menu as React.ReactElement, {
              style: menuStyle,
            })}
            <Divider style={{ margin: 0 }} />
            <Space className="pb-2 pt-4 px-2 w-full">
              <button
                onClick={() => {
                  setUserSettingsOpen(false);
                  setIsGlobalLoader(true);
                  LogoutItem({ dispatch, setAuth });
                }}
                className=" text-white py-2 w-[286px] rounded-sm font-semibold bg-primary-orange hover:bg-[rgba(218,94,26)] transition-colors duration-300"
              >
                Logout
              </button>
            </Space>
          </div>
        )}
        trigger={["click"]}
        placement="bottomRight"
        open={userSettingsOpen}
        onOpenChange={handleOpenChange}
        arrow={{ pointAtCenter: true }}
        overlayStyle={{ width: "300px" }}
      >
        <Tooltip title="User Settings" mouseEnterDelay={1}>
          <div className="rounded-full border-primary-orange border-2">
            <div className="rounded-full border-white border-2 px-1.5  bg-primary-orange cursor-pointer">
              <UserOutlined
                className="text-xs"
                style={{ color: "rgb(214, 211, 209)" }}
              />
            </div>
          </div>
        </Tooltip>
      </Dropdown>
    </>
  );
}

export default UserSettings;
