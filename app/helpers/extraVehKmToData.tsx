import { Dispatch, SetStateAction } from "react";

const RAW_TO_STATE_KEY: Record<string, string> = {
  Device: "Device",
  AddBlue: "Add blue (DEF) Level",
  "Engine Coolant Temperature": "Engine Coolant Temperature",
  EngineOilTemprature: "Engine Oil Temperature",
  "Engine Oil Pressure": "Engine Oil Pressure",
  "Accelerator Padel Position": "Accelerator Padel Position",
  "Engine Intake Manifold 1 Pressure": "Engine Intak Manifold 1 Pressure",
  "Engine Intake Manifold 1 Temprature": "Engine Intake Manifold 1 Temperature",
  "Engine Total Idle Hours": "Engine Total Idle Hrs",
  "Engine Total Fuel Used": "Engine Total Fuel Used",
  "Engine Total Idle Fuel Used": "Engine Total Idle Fuel Used",
  "Total Vehicle Distance": "Total Vehicle Distance",
  "Engine Fuel Rate": "Engine Fuel rate",
  "Engine Total Hours Of Operation": "Engine Total Hrs of Operation",
};

const TYPES_WITH_MIN_MAX = [
  "Add blue (DEF) Level",
  "Engine Fuel rate",
  "Engine Intake Manifold 1 Temperature",
];

type AlertParam = {
  type: string;
  value: JSX.Element;
  min: string;
  max: string;
  unit: string;
};

export function updateAlertParametersFromString(
  extraVhlparameter: string,
  setAlertParameters?: Dispatch<SetStateAction<AlertParam[]>>
) {
  const rawEntries = extraVhlparameter?.split("##");

  const tempMap: Record<string, string> = {};

  if (rawEntries && Array.isArray(rawEntries)) {
    rawEntries.forEach((entry) => {
      const parts = entry.split(/:-(.+)/);
      if (parts.length >= 2) {
        const rawKey = parts[0].trim();
        const rawVal = parts[1].trim();
        tempMap[rawKey] = rawVal;
      }
    });
  }

  if (setAlertParameters) {
    setAlertParameters((prev) =>
      prev.map((item) => {
        const matchingRawKey = Object.keys(RAW_TO_STATE_KEY).find(
          (rk) => RAW_TO_STATE_KEY[rk] === item.type
        );

        if (
          matchingRawKey &&
          matchingRawKey !== "" &&
          tempMap[matchingRawKey] !== undefined
        ) {
          const rawValue = tempMap[matchingRawKey];

          if (TYPES_WITH_MIN_MAX.includes(item.type)) {
            const parts = rawValue.split(":");
            if (parts.length === 3) {
              let displayValue = parts[0];
              // Normalize AdBlue: strip existing %, parse, cap at 100, append single %
              if (item.type === "Add blue (DEF) Level") {
                const stripped = parts[0].toString().replace(/%+$/, "");
                const numericValue = parseFloat(stripped);
                if (!isNaN(numericValue)) {
                  const capped = numericValue > 100 ? 100 : numericValue;
                  displayValue = `${capped}%`;
                } else {
                  displayValue = parts[0].toString().endsWith("%")
                    ? parts[0]
                    : `${parts[0]}%`;
                }
              }
              return {
                ...item,
                value: (
                  <span className="font-semibold text-blue-500">
                    {displayValue}
                  </span>
                ),
                min: parts[1],
                max: parts[2],
              };
            } else {
              let displayValue = rawValue;
              // Normalize AdBlue same as above
              if (item.type === "Add blue (DEF) Level") {
                const stripped = rawValue.replace(/%+$/, "");
                const numericValue = parseFloat(stripped);
                if (!isNaN(numericValue)) {
                  const capped = numericValue > 100 ? 100 : numericValue;
                  displayValue = `${capped}%`;
                } else {
                  displayValue = rawValue.endsWith("%") ? rawValue : `${rawValue}%`;
                }
              }
              return {
                ...item,
                value: (
                  <span className="font-semibold text-blue-500">
                    {displayValue}
                  </span>
                ),
                min: rawValue,
                max: rawValue,
              };
            }
          } else {
            let displayValue = rawValue;
            // Normalize AdBlue once more for non-min/max types (defensive)
            if (item.type === "Add blue (DEF) Level") {
              const stripped = rawValue.replace(/%+$/, "");
              const numericValue = parseFloat(stripped);
              if (!isNaN(numericValue)) {
                const capped = numericValue > 100 ? 100 : numericValue;
                displayValue = `${capped}%`;
              } else {
                displayValue = rawValue.endsWith("%") ? rawValue : `${rawValue}%`;
              }
            }
            return {
              ...item,
              value: (
                <span className="font-semibold text-blue-500">
                  {displayValue}
                </span>
              ),
              min: rawValue,
              max: rawValue,
            };
          }
        }

        return item;
      })
    );
  } else {
    return tempMap;
  }
}

export function updateAlertParametersFromString2(
  extraVhlparameter: string,
  setAlertParameters?: Dispatch<
    SetStateAction<
      {
        type: string;
        value: string;
      }[]
    >
  >
) {
  const rawEntries = extraVhlparameter?.split("##");

  const tempMap: Record<string, string> = {};

  if (rawEntries && Array.isArray(rawEntries)) {
    rawEntries.forEach((entry) => {
      const parts = entry.split(/:-(.+)/);
      if (parts.length >= 2) {
        const rawKey = parts[0].trim();
        const rawVal = parts[1].trim();

        tempMap[rawKey] = rawVal;
      }
    });
  }

  if (setAlertParameters) {
    setAlertParameters((prev) =>
      prev.map((item) => {
        const matchingRawKey = Object.keys(RAW_TO_STATE_KEY).find(
          (rk) => RAW_TO_STATE_KEY[rk] === item.type
        );

        if (
          matchingRawKey &&
          matchingRawKey !== "" &&
          tempMap[matchingRawKey] !== undefined
        ) {
          return { ...item, value: tempMap[matchingRawKey] };
        }

        return item;
      })
    );
  } else {
    return tempMap;
  }
}
