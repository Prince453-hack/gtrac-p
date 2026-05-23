"use client";

import { Form, Input, message, Modal } from "antd";
import { Dispatch, SetStateAction } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useChangePasswordMutation } from "@/app/_globalRedux/services/tracking";
import { NoticeType } from "antd/es/message/interface";

export const ChangePassword = ({
  setChangePasswordModalOpen,
  changePasswordModalOpen,
}: {
  setChangePasswordModalOpen: Dispatch<SetStateAction<boolean>>;
  changePasswordModalOpen: boolean;
}) => {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  const createMessage = ({
    type,
    content,
  }: {
    type: NoticeType;
    content: string;
  }) => {
    messageApi.open({
      type: type,
      content,
    });
  };

  const [triggerChangePassword] = useChangePasswordMutation();

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  const onFinish = async (values: any) => {
    const { username } = JSON.parse(
      localStorage.getItem("username-password") || "{}"
    );

    const { data } = await triggerChangePassword({
      username,
      password: values["old password"],
      newPassword: values["new password"],
    });

    if (data?.data[0].length === 0) {
      createMessage({
        type: "error",
        content: "Failed to change password, Please try again!",
      });
    } else {
      createMessage({
        type: "success",
        content: "Password changed successfully. You will be logged out.",
      });

      localStorage.setItem("password_changed_at", Date.now().toString());

      localStorage.removeItem("username-password");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userInfo");

      document.cookie =
        "auth-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "appSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      setChangePasswordModalOpen(false);

      setTimeout(() => {
        router.push("/");
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      }, 2000);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title="Reset Password"
        open={changePasswordModalOpen}
        onOk={() => setChangePasswordModalOpen(false)}
        onCancel={() => setChangePasswordModalOpen(false)}
        footer={[]}
      >
        <Form
          {...layout}
          name="resetPassword"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Old Password"
            name="old password"
            rules={[
              { required: true, message: "Please input your old password!" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="New Password"
            name="new password"
            rules={[
              { required: true, message: "Please input a new password!" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirm password"
            dependencies={["new password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("new password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <button
            type="submit"
            className="w-full bg-[#4FB090] text-white font-semibold py-2 rounded hover:opacity-85 transition-opacity duration-300"
          >
            Submit
          </button>
        </Form>
      </Modal>
    </>
  );
};
