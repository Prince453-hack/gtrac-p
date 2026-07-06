"use client";

import Image from "next/image";
import {
  RedoOutlined,
  AppstoreOutlined,
  BugOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const rawId = error.digest || "FL-882-941";
  const errorId = rawId.length > 12 ? `${rawId.slice(0, 10)}...` : rawId;

  const handleGoToDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center border border-gray-100">
        {/* Error Illustration Image */}
        <div className="w-full flex justify-center mb-6">
          <Image
            src="/assets/images/application-error.png"
            width={400}
            height={300}
            alt="Application Error"
            priority
            className="object-contain"
            draggable={false}
          />
        </div>

        {/* Header and Description */}
        <h1 className="text-3xl font-bold text-[#0f172a] mb-3 text-center tracking-tight">
          Application Error
        </h1>
        <p className="text-gray-500 mb-8 text-center text-sm md:text-[15px] leading-relaxed max-w-[340px]">
          Something went wrong while processing your request. Please wait for few seconds or try again.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-3 w-full justify-center mb-6">
          <button
            onClick={() => reset()}
            className="flex-1 max-w-[170px] h-12 flex items-center justify-center gap-2 bg-primary-green text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <RedoOutlined className="text-sm font-bold" />
            <span>Try Again</span>
          </button>
          <button
            onClick={handleGoToDashboard}
            className="flex-1 max-w-[170px] h-12 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm border border-gray-200 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <AppstoreOutlined className="text-sm font-bold" />
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-100 my-4" />

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-xs text-gray-400 font-medium px-1">
          <div className="flex items-center gap-1.5">
            <BugOutlined className="text-sm text-gray-400" />
            <span>Error ID: #{errorId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
