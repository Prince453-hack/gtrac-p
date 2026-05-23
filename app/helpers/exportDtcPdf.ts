import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

import logo from "@/public/assets/images/common/logo.png";
import henkeLogo from "@/public/assets/images/henkle_logo.png";

const convertToBase64 = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface DtcExportData {
  activeAlerts: any[];
  alertParameters: any[];
  engineTemperature: any;
  dailyData: any[];
  totals: any;
  scatterChartElement?: HTMLElement;
  barChartElement?: HTMLElement;
  vehicleReg: string;
  odometer: number;
  lastUpdated: string;
}

const exportDtcPdf = async (data: DtcExportData) => {
  const doc = new jsPDF({
    format: "a4",
    orientation: "portrait",
  });

  const logoImg = await convertToBase64(
    window.location.origin === "https://tracking.autowhat.app"
      ? henkeLogo.src
      : logo.src
  );

  let yPosition = 30;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header with logo and title
  doc.addImage(logoImg as string, "PNG", margin, 10, 25, 10);
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(`DTC Report - ${data.vehicleReg}`, margin + 30, 17);

  // Subtitle with date and odometer
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} | Last Updated: ${
      data.lastUpdated
    } | Odometer: ${data.odometer} KM`,
    margin,
    25
  );

  yPosition = 35;

  // Active Alerts Section
  if (data.activeAlerts && data.activeAlerts.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Active Alerts", margin, yPosition);
    yPosition += 10;

    // Main Active Alerts Table (without Alert column)
    const alertsTableData = data.activeAlerts.map((alert) => [
      alert.SPN_Code?.props?.children || "N/A",
      alert.SPN_Description || "N/A",
      alert.FMI_Category?.props?.children?.props?.children || "N/A",
    ]);

    autoTable(doc, {
      head: [["Code", "Issue", "Severity"]],
      body: alertsTableData,
      startY: yPosition,
      theme: "grid",
      headStyles: { fillColor: [71, 140, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { fontStyle: "bold" }, // Make the Code column bold
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Detailed information for each alert
    data.activeAlerts.forEach((alert, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Alert detail header
      doc.setFontSize(12);
      doc.setTextColor(40);
      const alertCode = alert.SPN_Code?.props?.children || "N/A";
      doc.text(`Alert ${index + 1} ${alertCode} Details:`, margin, yPosition);
      yPosition += 8;

      // Create detailed table for this alert
      const detailData = [];

      if (alert.SPN_Description_Expansion) {
        detailData.push(["Description", alert.SPN_Description_Expansion]);
      }

      if (alert.SPN_Possible_Causes) {
        detailData.push(["Possible Causes", alert.SPN_Possible_Causes]);
      }

      if (alert.SPN_Symptoms) {
        detailData.push(["Symptoms", alert.SPN_Symptoms]);
      }

      if (alert.SPN_Recommended_Actions) {
        detailData.push(["Recommended Actions", alert.SPN_Recommended_Actions]);
      }

      if (detailData.length > 0) {
        autoTable(doc, {
          body: detailData,
          startY: yPosition,
          theme: "grid",
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 40 },
            1: { cellWidth: "auto" },
          },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
    });

    yPosition += 5;
  }

  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Alert Parameters Section
  if (data.alertParameters && data.alertParameters.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(
      "Alert Parameters (At the time of Active Code Generation)",
      margin,
      yPosition
    );
    yPosition += 10;

    const filteredParams = data.alertParameters.filter(
      (param) =>
        param.value && typeof param.value === "object" && param.value.props
    );

    if (filteredParams.length > 0) {
      const parametersTableData = filteredParams.map((param) => [
        param.type,
        param.value?.props?.children || "N/A",
        param.min || "N/A",
        param.max || "N/A",
      ]);

      autoTable(doc, {
        head: [["Type", "Value", "Minimum", "Maximum"]],
        body: parametersTableData,
        startY: yPosition,
        theme: "grid",
        headStyles: { fillColor: [71, 140, 129], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Engine Temperature Section
  if (data.engineTemperature && data.engineTemperature.results) {
    // Estimate space needed for the entire section (title + chart + table)
    const estimatedSectionHeight = 100; // Rough estimate for title + chart + table

    // Check if we need a new page for the entire section
    if (yPosition + estimatedSectionHeight > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(
      "Engine Operating Temperature (At the time of Active Code Generation)",
      margin,
      yPosition
    );
    yPosition += 10;

    // Add scatter chart if available
    if (data.scatterChartElement) {
      try {
        // Wait a bit to ensure chart is fully rendered
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await html2canvas(data.scatterChartElement, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true, // Enable logging for debugging
          width: data.scatterChartElement.offsetWidth,
          height: data.scatterChartElement.offsetHeight,
        });

        if (canvas && canvas.width > 0 && canvas.height > 0) {
          const imgData = canvas.toDataURL("image/png");

          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Additional check - if chart alone is too big, move to new page
          if (yPosition + imgHeight > 270) {
            doc.addPage();
            yPosition = 20;
            // Re-add the title on the new page
            doc.setFontSize(14);
            doc.setTextColor(40);
            doc.text(
              "Engine Operating Temperature (At the time of Active Code Generation)",
              margin,
              yPosition
            );
            yPosition += 10;
          }

          doc.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } else {
          console.warn("Chart canvas is empty or invalid", {
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height,
          });
          // Add placeholder text if chart capture fails
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text("Chart could not be generated", margin, yPosition);
          yPosition += 20;
        }
      } catch (error) {
        console.error("Could not capture scatter chart:", error);
        // Add placeholder text if chart capture fails
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Chart could not be generated", margin, yPosition);
        yPosition += 20;
      }
    } else {
      console.warn("Scatter chart element not found");
      // Add placeholder text if chart element is not found
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Chart data not available", margin, yPosition);
      yPosition += 20;
    }

    // Engine temperature table
    autoTable(doc, {
      head: [["Results", "Current", "Ideal"]],
      body: [
        [
          data.engineTemperature.results || "N/A",
          data.engineTemperature.current
            ? `${data.engineTemperature.current}°C`
            : "N/A",
          data.engineTemperature.ideal
            ? data.engineTemperature.ideal.replace(/℃/g, "°C")
            : "N/A",
        ],
      ],
      startY: yPosition,
      theme: "grid",
      headStyles: { fillColor: [71, 140, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Save the PDF
  const fileName = `DTC_Report_${data.vehicleReg.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  )}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
};

export default exportDtcPdf;
