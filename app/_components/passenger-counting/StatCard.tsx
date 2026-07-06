import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  maleValue?: number;
  femaleValue?: number;
  showGender?: boolean;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export const StatCard = ({
  title,
  value,
  maleValue = 0,
  femaleValue = 0,
  showGender = true,
  subtitle,
  icon,
  iconBg,
  iconColor,
}: StatCardProps) => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </p>
        <div className="mt-2 text-3xl font-bold text-slate-900 leading-none">
          {value}
        </div>
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg} ${iconColor} shrink-0`}
      >
        {icon}
      </div>
    </div>

    {showGender && (
      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-8">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">
            Male
          </p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{maleValue}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase">
            Female
          </p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{femaleValue}</p>
        </div>
      </div>
    )}

    <div className="mt-4 text-xs text-slate-400">{subtitle}</div>
  </div>
);
