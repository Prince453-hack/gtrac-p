import {
  CopyOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Button, Modal, Tag, message } from "antd";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type SummaryCategoryPayload = {
  title: string;
  count: number;
  vehicleCount: number;
  coverageLabel: string;
  uniqueVehicleCount: number;
  topAlertTypes: { name: string; count: number }[];
  topVehicles: { vehicleNumber: string; count: number }[];
  recentAlerts: {
    vehicleNumber: string;
    alertType: string;
    message: string;
    time: string;
  }[];
};

type OverviewSummaryPayload = {
  generatedAt: string;
  reportName: string;
  dateRange: string;
  totals: {
    totalVehicles: number;
    fuelEnabledVehicles: number;
    lockEnabledVehicles: number;
    dashcamEnabledVehicles: number;
    activeCategories: number;
    totalOpenAlerts: number;
  };
  categories: SummaryCategoryPayload[];
};

type SummaryViewTab = "interactive" | "executive";

interface AiSummaryModalProps {
  aiSummaryTrigger?: number;
  onSummaryLoadingChange?: (isLoading: boolean) => void;
  overviewSummaryPayload: OverviewSummaryPayload;
  categoryColors?: Record<string, string>;
}

const AiSummaryModal = ({
  aiSummaryTrigger = 0,
  onSummaryLoadingChange,
  overviewSummaryPayload,
  categoryColors = {},
}: AiSummaryModalProps) => {
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryPdfLoading, setSummaryPdfLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(
    null,
  );
  const [selectedSummaryCategoryTitle, setSelectedSummaryCategoryTitle] =
    useState<string | null>(null);
  const [lastHandledSummaryTrigger, setLastHandledSummaryTrigger] = useState(0);
  const [activeSummaryTab, setActiveSummaryTab] =
    useState<SummaryViewTab>("interactive");

  const summaryActiveCategories = useMemo(() => {
    const totalAlerts = overviewSummaryPayload.totals.totalOpenAlerts;

    return overviewSummaryPayload.categories
      .filter((category) => category.count > 0)
      .sort(
        (firstCategory, secondCategory) =>
          secondCategory.count - firstCategory.count,
      )
      .map((category, index) => ({
        ...category,
        color:
          categoryColors[category.title] ||
          [
            "#3b82f6",
            "#22c55e",
            "#f97316",
            "#a855f7",
            "#eab308",
            "#06b6d4",
            "#ef4444",
            "#6366f1",
          ][index % 8],
        percentage:
          totalAlerts > 0
            ? Number(((category.count / totalAlerts) * 100).toFixed(1))
            : 0,
      }));
  }, [overviewSummaryPayload, categoryColors]);

  const selectedSummaryCategory = useMemo(() => {
    if (!selectedSummaryCategoryTitle) {
      return summaryActiveCategories[0] || null;
    }

    return (
      summaryActiveCategories.find(
        (category) => category.title === selectedSummaryCategoryTitle,
      ) ||
      summaryActiveCategories[0] ||
      null
    );
  }, [summaryActiveCategories, selectedSummaryCategoryTitle]);

  const handleGenerateAiSummary = useCallback(async () => {
    if (
      !overviewSummaryPayload.categories.some((category) => category.count > 0)
    ) {
      message.info("No alert data is available to summarize.");
      return;
    }

    setSummaryLoading(true);

    try {
      const response = await fetch("/api/overview/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(overviewSummaryPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate AI summary.");
      }

      setSummaryText(data.summary || "No summary returned.");
      setSummaryGeneratedAt(moment().format("DD MMM YYYY HH:mm"));
      setActiveSummaryTab("interactive");
      setSummaryModalOpen(true);
    } catch (error: any) {
      message.error(error.message || "Unable to generate AI summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, [overviewSummaryPayload]);

  const handleDownloadSummary = async () => {
    if (!summaryText.trim()) {
      return;
    }

    setSummaryPdfLoading(true);

    try {
      const { jsPDF } = await import("jspdf");
      const pdfDocument = new jsPDF("p", "mm", "a4");

      const pageWidth = pdfDocument.internal.pageSize.getWidth();
      const pageHeight = pdfDocument.internal.pageSize.getHeight();
      const marginX = 14;
      const marginY = 14;
      const usableWidth = pageWidth - marginX * 2;
      const bottomLimit = pageHeight - marginY;

      let cursorY = marginY;

      const ensureSpace = (requiredHeight = 8) => {
        if (cursorY + requiredHeight > bottomLimit) {
          pdfDocument.addPage();
          cursorY = marginY;
        }
      };

      const addWrappedText = (
        text: string,
        fontSize = 11,
        lineHeight = 6,
        isBold = false,
      ) => {
        if (!text.trim()) {
          cursorY += lineHeight;
          return;
        }

        pdfDocument.setFont("helvetica", isBold ? "bold" : "normal");
        pdfDocument.setFontSize(fontSize);
        const lines = pdfDocument.splitTextToSize(text, usableWidth);

        lines.forEach((line: string) => {
          ensureSpace(lineHeight);
          pdfDocument.text(line, marginX, cursorY);
          cursorY += lineHeight;
        });
      };

      pdfDocument.setFont("helvetica", "bold");
      pdfDocument.setFontSize(16);
      pdfDocument.text("AI Alert Summary", marginX, cursorY);
      cursorY += 9;

      addWrappedText(
        `Report scope: ${overviewSummaryPayload.dateRange}`,
        10,
        5,
      );
      addWrappedText(
        `Total open alerts considered: ${overviewSummaryPayload.totals.totalOpenAlerts}`,
        10,
        5,
      );
      if (summaryGeneratedAt) {
        addWrappedText(`Generated: ${summaryGeneratedAt}`, 10, 5);
      }

      cursorY += 3;
      addWrappedText("Generated Report", 12, 7, true);

      summaryText.split(/\r?\n/).forEach((line) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          cursorY += 4;
          return;
        }

        const isHeading = /^\d+\./.test(trimmedLine);
        const isBullet = /^[-•]/.test(trimmedLine);

        if (isHeading) {
          cursorY += 1;
          addWrappedText(trimmedLine, 11, 6, true);
        } else if (isBullet) {
          addWrappedText(trimmedLine.replace(/^[-•]\s*/, "• "), 10, 5);
        } else {
          addWrappedText(trimmedLine, 10, 5);
        }
      });

      pdfDocument.save(
        `overview_alert_summary_${moment().format("YYYYMMDD_HHmm")}.pdf`,
      );
      message.success("Summary downloaded as PDF.");
    } catch {
      message.error("Unable to download summary PDF.");
    } finally {
      setSummaryPdfLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (!summaryText.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      message.success("AI summary copied.");
    } catch {
      message.error("Unable to copy AI summary.");
    }
  };

  useEffect(() => {
    onSummaryLoadingChange?.(summaryLoading);
  }, [summaryLoading, onSummaryLoadingChange]);

  useEffect(() => {
    if (!summaryModalOpen) {
      return;
    }

    if (!summaryActiveCategories.length) {
      setSelectedSummaryCategoryTitle(null);
      return;
    }

    const selectedCategoryExists = summaryActiveCategories.some(
      (category) => category.title === selectedSummaryCategoryTitle,
    );

    if (!selectedCategoryExists) {
      setSelectedSummaryCategoryTitle(summaryActiveCategories[0].title);
    }
  }, [summaryModalOpen, summaryActiveCategories, selectedSummaryCategoryTitle]);

  useEffect(() => {
    if (
      aiSummaryTrigger > 0 &&
      aiSummaryTrigger !== lastHandledSummaryTrigger
    ) {
      setLastHandledSummaryTrigger(aiSummaryTrigger);
      handleGenerateAiSummary();
    }
  }, [aiSummaryTrigger, handleGenerateAiSummary, lastHandledSummaryTrigger]);

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-12">
          <span>AI Alert Summary</span>
          <div className="flex items-center gap-2">
            <Button
              key="copy"
              icon={<CopyOutlined />}
              onClick={handleCopySummary}
            >
              Copy
            </Button>
            <Button
              key="download"
              icon={<DownloadOutlined />}
              onClick={handleDownloadSummary}
              loading={summaryPdfLoading}
            >
              Download
            </Button>
            <Button
              key="regenerate"
              type="primary"
              icon={<FileTextOutlined />}
              loading={summaryLoading}
              onClick={handleGenerateAiSummary}
              className="bg-sky-600 border-sky-600 hover:bg-sky-700"
            >
              Regenerate
            </Button>
          </div>
        </div>
      }
      open={summaryModalOpen}
      onCancel={() => setSummaryModalOpen(false)}
      width={920}
      centered
      footer={null}
    >
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div>Report scope: {overviewSummaryPayload.dateRange}</div>
          <div>
            Total open alerts considered:{" "}
            {overviewSummaryPayload.totals.totalOpenAlerts}
          </div>
          {summaryGeneratedAt ? (
            <div>Generated: {summaryGeneratedAt}</div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveSummaryTab("interactive")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeSummaryTab === "interactive"
                  ? "bg-slate-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Interactive Alert Breakdown
            </button>
            <button
              type="button"
              onClick={() => setActiveSummaryTab("executive")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeSummaryTab === "executive"
                  ? "bg-slate-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Executive Summary
            </button>
          </div>
        </div>

        {activeSummaryTab === "interactive" ? (
          summaryActiveCategories.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Interactive Alert Breakdown
                </h3>
                <div className="text-xs text-slate-500">
                  Click a category or pie slice to inspect details
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5 rounded-lg border border-slate-100 bg-slate-50 p-2">
                  <div className="h-[230px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryActiveCategories}
                          dataKey="count"
                          nameKey="title"
                          innerRadius={55}
                          outerRadius={84}
                          paddingAngle={2}
                          onClick={(chartPoint: any) => {
                            if (chartPoint?.title) {
                              setSelectedSummaryCategoryTitle(chartPoint.title);
                            }
                          }}
                        >
                          {summaryActiveCategories.map((entry) => (
                            <Cell
                              key={entry.title}
                              fill={entry.color}
                              stroke={
                                selectedSummaryCategory?.title === entry.title
                                  ? "#0f172a"
                                  : "#ffffff"
                              }
                              strokeWidth={
                                selectedSummaryCategory?.title === entry.title
                                  ? 2
                                  : 1
                              }
                              className="cursor-pointer"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any, payload: any) => [
                            `${value} alerts (${payload?.payload?.percentage || 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-2 rounded-md border border-slate-200 bg-white p-2">
                    <div className="mb-1 text-xs font-semibold text-slate-600">
                      Legend
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {summaryActiveCategories.map((category) => (
                        <div
                          key={`legend-${category.title}`}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="truncate text-slate-700">
                              {category.title}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800">
                            {category.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-7 space-y-3">
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {summaryActiveCategories.map((category) => (
                        <button
                          key={category.title}
                          type="button"
                          onClick={() =>
                            setSelectedSummaryCategoryTitle(category.title)
                          }
                          className={`rounded-md border px-3 py-2 text-left transition ${
                            selectedSummaryCategory?.title === category.title
                              ? "border-slate-600 bg-slate-100"
                              : "border-slate-200 bg-white hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-2 text-xs font-medium text-slate-700">
                              {category.title}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {category.count}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSummaryCategory ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-700">
                          {selectedSummaryCategory.title}
                        </div>
                        <Tag color="blue">
                          {selectedSummaryCategory.count} alerts •{" "}
                          {selectedSummaryCategory.percentage}%
                        </Tag>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="mb-1 font-semibold text-slate-600">
                            Top Alert Types
                          </div>
                          <div className="space-y-1">
                            {selectedSummaryCategory.topAlertTypes
                              .slice(0, 4)
                              .map((item) => (
                                <div
                                  key={item.name}
                                  className="flex items-center justify-between rounded bg-white px-2 py-1"
                                >
                                  <span className="truncate pr-2">
                                    {item.name}
                                  </span>
                                  <span className="font-semibold">
                                    {item.count}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 font-semibold text-slate-600">
                            Most Affected Vehicles
                          </div>
                          <div className="space-y-1">
                            {selectedSummaryCategory.topVehicles
                              .slice(0, 4)
                              .map((item) => (
                                <div
                                  key={item.vehicleNumber}
                                  className="flex items-center justify-between rounded bg-white px-2 py-1"
                                >
                                  <span className="truncate pr-2">
                                    {item.vehicleNumber}
                                  </span>
                                  <span className="font-semibold">
                                    {item.count}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs">
                        <div className="mb-1 font-semibold text-slate-600">
                          Recent Alerts
                        </div>
                        <div className="max-h-24 space-y-1 overflow-y-auto">
                          {selectedSummaryCategory.recentAlerts
                            .slice(0, 3)
                            .map((item, index) => (
                              <div
                                key={`${item.vehicleNumber}-${item.time}-${index}`}
                                className="rounded bg-white px-2 py-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-700">
                                    {item.vehicleNumber}
                                  </span>
                                  <span className="text-slate-500">
                                    {item.time}
                                  </span>
                                </div>
                                <div className="truncate text-slate-600">
                                  {item.alertType}: {item.message}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No active alert categories are available for interactive
              breakdown.
            </div>
          )
        ) : (
          <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5">
            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {summaryText || "Generate the report to view the AI summary."}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AiSummaryModal;
