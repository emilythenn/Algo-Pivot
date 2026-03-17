import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun } from "docx";
import { saveAs } from "file-saver";

function parseAnalysis(raw: string | object | null): any {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return { summary: raw }; }
}

function getReportData(report: any) {
  const analysis = parseAnalysis(report.ai_analysis);
  const scanData = report.scan_results;
  const scanAnalysis = scanData ? parseAnalysis(scanData.ai_analysis) : {};

  // Deep merge: scan analysis as base, report analysis overrides, but preserve arrays from whichever has them
  const merged = { ...scanAnalysis, ...analysis };
  if (!merged.issues?.length && scanAnalysis.issues?.length) merged.issues = scanAnalysis.issues;
  if (!merged.recommendations?.length && scanAnalysis.recommendations?.length) merged.recommendations = scanAnalysis.recommendations;
  if (merged.germination_rate === undefined && scanAnalysis.germination_rate !== undefined) merged.germination_rate = scanAnalysis.germination_rate;
  if (merged.germination_rate === undefined && scanData?.germination_rate !== undefined) merged.germination_rate = scanData.germination_rate;
  if (merged.confidence === undefined && scanAnalysis.confidence !== undefined) merged.confidence = scanAnalysis.confidence;
  if (!merged.summary && scanAnalysis.summary) merged.summary = scanAnalysis.summary;
  if (!merged.status && scanAnalysis.status) merged.status = scanAnalysis.status;

  const isAnomaly = report.report_type === "anomaly";
  const dateStr = new Date(report.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
  const fileName = report.report_title.replace(/[^a-zA-Z0-9]/g, "_");

  return { merged, scanData, isAnomaly, dateStr, fileName };
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function fetchImageAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

// ─── CSV ───
export function downloadCSV(report: any) {
  const { merged, scanData, isAnomaly, dateStr, fileName } = getReportData(report);

  const rows: string[][] = [
    ["Field", "Value"],
    ["Report Title", report.report_title],
    ["Report ID", report.id.slice(0, 12).toUpperCase()],
    ["Date Issued", dateStr],
    ["Report Type", isAnomaly ? "Anomaly Detected" : "Verified Clean"],
    ["Status", (report.status || "completed").charAt(0).toUpperCase() + (report.status || "completed").slice(1)],
    ["Crop Name", scanData?.crop_name || "N/A"],
    ["Scan Date", scanData?.scan_date ? new Date(scanData.scan_date).toLocaleDateString("en-MY") : "N/A"],
    ["GPS Coordinates", report.gps_data?.lat ? `${Number(report.gps_data.lat).toFixed(6)}° N, ${Number(report.gps_data.lng).toFixed(6)}° E` : "Not recorded"],
    ["Germination Rate", merged.germination_rate !== undefined ? `${merged.germination_rate}%` : "N/A"],
    ["Confidence", merged.confidence !== undefined ? `${merged.confidence}%` : "N/A"],
    ["Health Status", merged.status ? merged.status.toUpperCase() : "N/A"],
    ["Summary", merged.summary || "N/A"],
  ];

  if (scanData?.image_url) {
    rows.push(["Photographic Evidence URL", scanData.image_url]);
  }

  if (merged.issues?.length) {
    rows.push(["", ""]);
    rows.push(["Issue Type", "Severity", "Description", "Affected %"] as any);
    merged.issues.forEach((issue: any) => {
      rows.push([issue.type, issue.severity, issue.description, issue.affected_percentage ? `${issue.affected_percentage}%` : "N/A"]);
    });
  }

  if (merged.recommendations?.length) {
    rows.push(["", ""]);
    rows.push(["Recommendations"]);
    merged.recommendations.forEach((rec: string, i: number) => {
      rows.push([`${i + 1}. ${rec}`]);
    });
  }

  const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `${fileName}_Report.csv`);
}

// ─── PDF ───
export async function downloadPDF(report: any) {
  const { merged, scanData, isAnomaly, dateStr, fileName } = getReportData(report);
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("AGRO-PIVOT AGRICULTURAL INTELLIGENCE", 14, y);
  y += 7;
  doc.setFontSize(16);
  doc.setTextColor(30);
  doc.text("Seed Integrity Evidence Report", 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(isAnomaly ? 192 : 39, isAnomaly ? 57 : 174, isAnomaly ? 43 : 96);
  doc.text(isAnomaly ? "⚠ ANOMALY DETECTED" : "✓ VERIFIED CLEAN", 14, y);
  y += 4;
  doc.setDrawColor(60);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 10;

  // Meta table
  doc.setTextColor(30);
  autoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: [
      ["Report ID", report.id.slice(0, 12).toUpperCase()],
      ["Date Issued", dateStr],
      ["Report Type", isAnomaly ? "Anomaly Report" : "Verification Report"],
      ["Status", (report.status || "completed").charAt(0).toUpperCase() + (report.status || "completed").slice(1)],
      ["Crop Name", scanData?.crop_name || "N/A"],
      ["Scan Date", scanData?.scan_date ? new Date(scanData.scan_date).toLocaleDateString("en-MY") : "N/A"],
      ["GPS Coordinates", report.gps_data?.lat ? `${Number(report.gps_data.lat).toFixed(6)}° N, ${Number(report.gps_data.lng).toFixed(6)}° E` : "Not recorded"],
      ["Germination Rate", merged.germination_rate !== undefined ? `${merged.germination_rate}%` : "N/A"],
      ["Confidence", merged.confidence !== undefined ? `${merged.confidence}%` : "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Photographic Evidence (image)
  if (scanData?.image_url) {
    const imgBase64 = await fetchImageAsBase64(scanData.image_url);
    if (imgBase64) {
      // Check page space
      if (y > 200) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setTextColor(30);
      doc.text("PHOTOGRAPHIC EVIDENCE", 14, y);
      y += 6;

      try {
        doc.addImage(imgBase64, "JPEG", 14, y, 60, 60);
        // Caption beside image
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Figure 1: Seedling sample photograph", 80, y + 6);
        doc.text(`captured during field inspection.`, 80, y + 12);
        if (scanData.scan_date) {
          doc.text(`Date: ${new Date(scanData.scan_date).toLocaleDateString("en-MY", { dateStyle: "full" })}`, 80, y + 18);
        }
        if (report.gps_data?.lat) {
          doc.text(`Location: ${Number(report.gps_data.lat).toFixed(6)}° N, ${Number(report.gps_data.lng).toFixed(6)}° E`, 80, y + 24);
        }
        y += 66;
      } catch {
        y += 2;
      }
    }
  }

  // Summary
  if (merged.summary) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text("EXECUTIVE SUMMARY", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(merged.summary, 180);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
  }

  // Issues
  if (merged.issues?.length) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text("FINDINGS & ISSUES", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Type", "Severity", "Description", "Affected %"]],
      body: merged.issues.map((issue: any) => [
        issue.type, issue.severity?.toUpperCase(), issue.description, issue.affected_percentage ? `${issue.affected_percentage}%` : "—"
      ]),
      theme: "striped",
      headStyles: { fillColor: [192, 57, 43], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recommendations
  if (merged.recommendations?.length) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text("RECOMMENDATIONS", 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(60);
    merged.recommendations.forEach((rec: string, i: number) => {
      if (y > 275) { doc.addPage(); y = 20; }
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 3;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Agro-Pivot Agricultural Intelligence — Report ID: ${report.id.slice(0, 12).toUpperCase()} — Page ${p}/${pageCount}`, 14, 290);
  }

  doc.save(`${fileName}_Report.pdf`);
}

// ─── DOCX ───
export async function downloadDOCX(report: any) {
  const { merged, scanData, isAnomaly, dateStr, fileName } = getReportData(report);

  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({ text: "AGRO-PIVOT AGRICULTURAL INTELLIGENCE", heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
    new Paragraph({ text: "Seed Integrity Evidence Report", heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
    new Paragraph({
      children: [new TextRun({ text: isAnomaly ? "⚠ ANOMALY DETECTED" : "✓ VERIFIED CLEAN", bold: true, color: isAnomaly ? "C0392B" : "27AE60", size: 24 })],
      spacing: { after: 300 },
    }),
  );

  // Meta table
  const metaRows = [
    ["Report ID", report.id.slice(0, 12).toUpperCase()],
    ["Date Issued", dateStr],
    ["Report Type", isAnomaly ? "Anomaly Report" : "Verification Report"],
    ["Status", (report.status || "completed").charAt(0).toUpperCase() + (report.status || "completed").slice(1)],
    ["Crop Name", scanData?.crop_name || "N/A"],
    ["Scan Date", scanData?.scan_date ? new Date(scanData.scan_date).toLocaleDateString("en-MY") : "N/A"],
    ["GPS Coordinates", report.gps_data?.lat ? `${Number(report.gps_data.lat).toFixed(6)}° N, ${Number(report.gps_data.lng).toFixed(6)}° E` : "Not recorded"],
    ["Germination Rate", merged.germination_rate !== undefined ? `${merged.germination_rate}%` : "N/A"],
    ["Confidence", merged.confidence !== undefined ? `${merged.confidence}%` : "N/A"],
  ];

  children.push(
    new Table({
      rows: metaRows.map(([label, value]) => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
          }),
        ],
      })),
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({ spacing: { before: 300 } }),
  );

  // Photographic Evidence (image)
  if (scanData?.image_url) {
    const imgBuffer = await fetchImageAsArrayBuffer(scanData.image_url);
    if (imgBuffer) {
      children.push(
        new Paragraph({ text: "PHOTOGRAPHIC EVIDENCE", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
        new Paragraph({
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: { width: 280, height: 280 },
              type: "jpg",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Figure 1: Seedling sample photograph captured during field inspection.${scanData.scan_date ? ` Date: ${new Date(scanData.scan_date).toLocaleDateString("en-MY", { dateStyle: "full" })}.` : ""}${report.gps_data?.lat ? ` Location: ${Number(report.gps_data.lat).toFixed(6)}° N, ${Number(report.gps_data.lng).toFixed(6)}° E.` : ""}`,
              italics: true, size: 18, color: "888888",
            }),
          ],
          spacing: { after: 200 },
        }),
      );
    }
  }

  // Summary
  if (merged.summary) {
    children.push(
      new Paragraph({ text: "EXECUTIVE SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: merged.summary, size: 22 })], spacing: { after: 200 } }),
    );
  }

  // Issues
  if (merged.issues?.length) {
    children.push(
      new Paragraph({ text: "FINDINGS & ISSUES", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
    );
    merged.issues.forEach((issue: any, i: number) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. [${(issue.severity || "").toUpperCase()}] ${issue.type}`, bold: true, size: 22 }),
          ],
          spacing: { before: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: issue.description, size: 20 })],
          spacing: { after: 50 },
        }),
      );
      if (issue.affected_percentage) {
        children.push(new Paragraph({
          children: [new TextRun({ text: `Affected Area: ${issue.affected_percentage}%`, italics: true, size: 18, color: "888888" })],
        }));
      }
    });
  }

  // Recommendations
  if (merged.recommendations?.length) {
    children.push(
      new Paragraph({ text: "RECOMMENDATIONS", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
    );
    merged.recommendations.forEach((rec: string, i: number) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${rec}`, size: 22 })],
        spacing: { after: 80 },
      }));
    });
  }

  // Footer
  children.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      children: [
        new TextRun({ text: `This report was generated by the Agro-Pivot Agricultural Intelligence Platform. Report ID: ${report.id.slice(0, 12).toUpperCase()}. All analysis results are AI-generated and should be verified by a qualified agronomist before taking action.`, size: 16, color: "888888", italics: true }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}_Report.docx`);
}
