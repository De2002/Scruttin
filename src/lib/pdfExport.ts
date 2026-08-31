import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BusinessPlan } from "@/types/businessPlan";
import { compileBusinessPlan, CompiledBusinessPlan, formatCurrency } from "./planCompiler";

export type FontTheme = "modern" | "classic" | "technical" | "minimal";

export interface PdfExportOptions {
  includeCover?: boolean;
  includeToc?: boolean;
  includeFinancialTables?: boolean;
  confidentialWatermark?: boolean;
  isExecutiveBriefOnly?: boolean;
  fontTheme?: FontTheme;
  logoDataUrl?: string | null;
  logoPlacement?: "cover-only" | "cover-and-header";
}

export async function exportBusinessPlanToPdf(
  plan: BusinessPlan,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    includeCover = true,
    includeToc = true,
    isExecutiveBriefOnly = false,
    fontTheme = "modern",
    logoDataUrl = null,
    logoPlacement = "cover-and-header",
  } = options;

  const compiled = compileBusinessPlan(plan);
  const pdf = new jsPDF({
    unit: "pt",
    format: "letter",
    orientation: "portrait",
  });

  // Map font themes
  // jsPDF standard built-in fonts: "helvetica", "times", "courier"
  const fontPrimary = fontTheme === "classic" ? "times" : fontTheme === "technical" ? "courier" : "helvetica";
  const fontHeading = fontTheme === "classic" ? "times" : fontTheme === "technical" ? "courier" : "helvetica";

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Colors based on theme
  let navyDark = [15, 23, 42]; // #0F172A
  let navyMedium = [30, 41, 59]; // #1E293B
  let amberGold = [217, 119, 6]; // #D97706
  const slateText = [51, 65, 85]; // #334155
  const slateMuted = [100, 116, 139]; // #64748B
  let lightBg = [248, 250, 252]; // #F8FAFC
  const borderGray = [226, 232, 240]; // #E2E8F0

  if (fontTheme === "classic") {
    // Executive Burgundy & Warm Gold
    navyDark = [24, 24, 27];
    navyMedium = [39, 39, 42];
    amberGold = [180, 83, 9];
    lightBg = [254, 252, 246];
  } else if (fontTheme === "minimal") {
    // Clean Monochrome & Slate
    navyDark = [10, 10, 10];
    navyMedium = [38, 38, 38];
    amberGold = [79, 70, 229]; // Indigo accent
    lightBg = [250, 250, 250];
  } else if (fontTheme === "technical") {
    // Modern Emerald & Cyan Tech
    navyDark = [13, 27, 42];
    navyMedium = [27, 38, 59];
    amberGold = [13, 148, 136]; // Teal accent
    lightBg = [240, 249, 255];
  }

  const fileBase = (plan.name || "business-plan")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Helper to check page bounds
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 60) {
      pdf.addPage();
      currentY = 60;
    }
  };

  // Helper for section banner
  const renderSectionHeader = (sectionNumber: number, title: string, summary?: string) => {
    ensureSpace(60);

    // Pill badge for number
    pdf.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.roundedRect(margin, currentY, 26, 18, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(10);
    pdf.text(String(sectionNumber).padStart(2, "0"), margin + 13, currentY + 13, { align: "center" });

    // Section title
    pdf.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(16);
    pdf.text(title.toUpperCase(), margin + 34, currentY + 14);

    currentY += 24;

    // Subtle divider
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(1);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 12;

    if (summary) {
      pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      pdf.setFont(fontPrimary, "italic");
      pdf.setFontSize(9.5);
      const sumLines = pdf.splitTextToSize(summary, contentWidth);
      pdf.text(sumLines, margin, currentY);
      currentY += sumLines.length * 13 + 12;
    }
  };

  // Helper for subsection title
  const renderSubsectionTitle = (title: string) => {
    ensureSpace(35);
    pdf.setTextColor(navyMedium[0], navyMedium[1], navyMedium[2]);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(12);
    pdf.text(title, margin, currentY);
    currentY += 16;
  };

  // Helper for narrative text
  const renderNarrativeText = (text: string) => {
    pdf.setTextColor(slateText[0], slateText[1], slateText[2]);
    pdf.setFont(fontPrimary, "normal");
    pdf.setFontSize(10);
    const paragraphs = text.split("\n\n");

    paragraphs.forEach((p) => {
      const cleanP = p.trim();
      if (!cleanP) return;
      const lines = pdf.splitTextToSize(cleanP, contentWidth);
      const blockHeight = lines.length * 14 + 8;
      ensureSpace(blockHeight);
      pdf.text(lines, margin, currentY);
      currentY += blockHeight;
    });
  };

  // Helper for callout / quote
  const renderQuoteBlock = (title: string, quote: string) => {
    const text = quote.replace(/^"|"$/g, "");
    pdf.setFont(fontPrimary, "italic");
    pdf.setFontSize(10.5);
    const lines = pdf.splitTextToSize(`"${text}"`, contentWidth - 28);
    const boxHeight = lines.length * 15 + 24;

    ensureSpace(boxHeight);

    // Background card
    pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    pdf.roundedRect(margin, currentY, contentWidth, boxHeight, 4, 4, "F");

    // Left amber accent bar
    pdf.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.roundedRect(margin, currentY, 4, boxHeight, 2, 2, "F");

    // Title
    pdf.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(8.5);
    pdf.text(title.toUpperCase(), margin + 14, currentY + 14);

    // Quote text
    pdf.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    pdf.setFont(fontPrimary, "italic");
    pdf.setFontSize(10);
    pdf.text(lines, margin + 14, currentY + 28);

    currentY += boxHeight + 12;
  };

  // Helper for key-value pairs grid
  const renderKeyValueGrid = (pairs: Array<{ key: string; value: string }>) => {
    if (!pairs.length) return;

    // Use autoTable for a clean 2-column key-value presentation
    const tableData = pairs.map((p) => [p.key, p.value]);
    ensureSpace(pairs.length * 20 + 20);

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: tableData,
      theme: "plain",
      styles: {
        font: fontPrimary as any,
        fontSize: 9.5,
        cellPadding: { top: 5, bottom: 5, left: 8, right: 8 },
        textColor: [slateText[0], slateText[1], slateText[2]],
        lineColor: [borderGray[0], borderGray[1], borderGray[2]],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: {
          fontStyle: "bold",
          textColor: [navyMedium[0], navyMedium[1], navyMedium[2]],
          fillColor: [lightBg[0], lightBg[1], lightBg[2]],
          cellWidth: 160,
        },
        1: {
          cellWidth: contentWidth - 160,
        },
      },
    });

    currentY = (pdf as any).lastAutoTable.finalY + 14;
  };

  // Helper for structured tables
  const renderTable = (headers: string[], rows: string[][]) => {
    if (!rows.length) return;
    ensureSpace(40);

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [headers],
      body: rows,
      theme: "striped",
      headStyles: {
        font: fontHeading as any,
        fillColor: [navyDark[0], navyDark[1], navyDark[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 6,
      },
      styles: {
        font: fontPrimary as any,
        fontSize: 8.5,
        cellPadding: 5,
        textColor: [slateText[0], slateText[1], slateText[2]],
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: [lightBg[0], lightBg[1], lightBg[2]],
      },
    });

    currentY = (pdf as any).lastAutoTable.finalY + 16;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Executive Cover Page
  // ───────────────────────────────────────────────────────────────────────────
  if (includeCover) {
    // Deep Navy full bleed background
    pdf.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Geometric accent stripe in accent
    pdf.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.rect(0, 0, 12, pageHeight, "F");

    let coverTopOffset = 70;

    // Optional Embedded Company Logo on Cover
    if (logoDataUrl) {
      try {
        // Render logo card
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, coverTopOffset, 68, 68, 6, 6, "F");
        pdf.addImage(logoDataUrl, "PNG", margin + 6, coverTopOffset + 6, 56, 56);
        coverTopOffset += 84;
      } catch (e) {
        console.warn("Could not render logo on PDF cover:", e);
      }
    }

    // Top Tag Badge
    pdf.setFillColor(navyMedium[0], navyMedium[1], navyMedium[2]);
    pdf.roundedRect(margin, coverTopOffset, 260, 24, 4, 4, "F");
    pdf.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(9);
    pdf.text("OFFICIAL BUSINESS PLAN & STRATEGY", margin + 12, coverTopOffset + 15);

    // Business Name (Main Hero Title)
    const titleStartY = coverTopOffset + 55;
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(30);
    const titleLines = pdf.splitTextToSize(compiled.name, contentWidth);
    pdf.text(titleLines, margin, titleStartY);

    const titleEndOffset = titleStartY + (titleLines.length * 34);

    // Tagline / Subtitle
    if (compiled.tagline) {
      pdf.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
      pdf.setFont(fontPrimary, "normal");
      pdf.setFontSize(13);
      const tagLines = pdf.splitTextToSize(`"${compiled.tagline}"`, contentWidth);
      pdf.text(tagLines, margin, titleEndOffset + 12);
    }

    // Accent decorative divider
    pdf.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.rect(margin, titleEndOffset + 40, 60, 3, "F");

    // Financial KPI Summary Pill on Cover
    const fin = compiled.financialSummary;
    if (fin.year1Revenue > 0 || fin.totalFundingRequired > 0) {
      const kpiTop = titleEndOffset + 60;
      pdf.setFillColor(navyMedium[0], navyMedium[1], navyMedium[2]);
      pdf.roundedRect(margin, kpiTop, contentWidth, 75, 6, 6, "F");

      // 3 Mini columns
      const colW = contentWidth / 3;
      pdf.setFont(fontPrimary, "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      pdf.text("YEAR 1 TARGET REVENUE", margin + 16, kpiTop + 24);
      pdf.text("BREAK-EVEN TARGET", margin + colW + 16, kpiTop + 24);
      pdf.text("FUNDING REQUIREMENT", margin + colW * 2 + 16, kpiTop + 24);

      pdf.setFont(fontHeading, "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text(formatCurrency(fin.year1Revenue, fin.currency), margin + 16, kpiTop + 48);
      pdf.text(fin.breakevenMonth ? `Month ${fin.breakevenMonth}` : "Within 24 mo", margin + colW + 16, kpiTop + 48);
      pdf.text(fin.totalFundingRequired > 0 ? formatCurrency(fin.totalFundingRequired, fin.currency) : "Self-Funded", margin + colW * 2 + 16, kpiTop + 48);
    }

    // Bottom Meta Card
    const bottomY = 560;
    pdf.setDrawColor(navyMedium[0], navyMedium[1], navyMedium[2]);
    pdf.setLineWidth(1);
    pdf.line(margin, bottomY, pageWidth - margin, bottomY);

    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.text("DOCUMENT DETAILS", margin, bottomY + 22);

    pdf.setFont(fontPrimary, "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Prepared for: ${compiled.preparedFor}`, margin, bottomY + 42);
    pdf.text(`Principal / Author: ${compiled.author}`, margin, bottomY + 58);
    pdf.text(`Publication Date: ${compiled.date}`, margin, bottomY + 74);
    pdf.text(`Plan Completion Level: ${compiled.overallProgress}% Complete`, margin, bottomY + 90);

    // Confidentiality notice footer
    pdf.setFont(fontPrimary, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    pdf.text(
      "CONFIDENTIAL & PROPRIETARY — This document contains proprietary information intended solely for authorized recipients.",
      margin,
      pageHeight - 40
    );

    pdf.addPage();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Table of Contents Placeholder & Page Tracking
  // ───────────────────────────────────────────────────────────────────────────
  let tocPageNumber: number | null = null;
  const sectionPageMap: Record<number, number> = {};

  if (includeToc && !isExecutiveBriefOnly) {
    tocPageNumber = pdf.getNumberOfPages();
    // Advance to next page so sections begin cleanly
    pdf.addPage();
    currentY = 60;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Render Compiled Sections
  // ───────────────────────────────────────────────────────────────────────────
  const sectionsToRender = isExecutiveBriefOnly
    ? compiled.sections.filter((s) => s.id === "executive_summary" || s.id === "company_description")
    : compiled.sections;

  sectionsToRender.forEach((section, secIdx) => {
    // Check if we need a fresh page for section header
    if (secIdx > 0 && currentY > pageHeight - 160) {
      pdf.addPage();
      currentY = 60;
    }

    // Record the exact starting page number of this section for TOC links
    sectionPageMap[section.number] = pdf.getNumberOfPages();

    renderSectionHeader(section.number, section.title, section.summary);

    if (!section.subsections.length || !section.hasContent) {
      pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      pdf.setFont(fontPrimary, "italic");
      pdf.setFontSize(9.5);
      pdf.text(
        "This section has not yet been populated in the business plan builder. Complete the corresponding phase to generate standard content.",
        margin,
        currentY
      );
      currentY += 24;
      return;
    }

    section.subsections.forEach((sub) => {
      renderSubsectionTitle(sub.title);

      if (sub.type === "quote" && sub.text) {
        renderQuoteBlock(sub.title, sub.text);
      } else if (sub.type === "key-value" && sub.keyValuePairs) {
        renderKeyValueGrid(sub.keyValuePairs);
      } else if (sub.type === "table" && sub.tableHeaders && sub.tableRows) {
        renderTable(sub.tableHeaders, sub.tableRows);
      } else if (sub.text) {
        renderNarrativeText(sub.text);
      }
    });

    currentY += 10;
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2b. Populate Table of Contents with Dynamic Page Links (Post-Section Calculation)
  // ───────────────────────────────────────────────────────────────────────────
  if (tocPageNumber !== null) {
    pdf.setPage(tocPageNumber);
    let tocY = 60;

    pdf.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    pdf.setFont(fontHeading, "bold");
    pdf.setFontSize(22);
    pdf.text("Table of Contents", margin, tocY);
    tocY += 14;

    pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    pdf.setFont(fontPrimary, "italic");
    pdf.setFontSize(9);
    pdf.text("Click any chapter below to jump directly to that section in this document.", margin, tocY);
    tocY += 10;

    pdf.setDrawColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.setLineWidth(2);
    pdf.line(margin, tocY, margin + 45, tocY);
    tocY += 18;

    // Table of contents grid with exact page numbers & clickable links
    const tocRows = compiled.sections.map((s) => {
      const pageNum = sectionPageMap[s.number];
      return [
        String(s.number).padStart(2, "0"),
        s.title,
        s.hasContent ? "Documented" : "Draft",
        pageNum ? `Page ${pageNum}  ›` : "—",
      ];
    });

    autoTable(pdf, {
      startY: tocY,
      margin: { left: margin, right: margin },
      head: [["#", "Chapter / Section Name", "Status", "Jump to Page"]],
      body: tocRows,
      theme: "plain",
      headStyles: {
        font: fontHeading as any,
        fillColor: [navyDark[0], navyDark[1], navyDark[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        cellPadding: 6,
      },
      styles: {
        font: fontPrimary as any,
        fontSize: 9,
        cellPadding: 5.5,
        lineColor: [borderGray[0], borderGray[1], borderGray[2]],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [amberGold[0], amberGold[1], amberGold[2]], cellWidth: 28 },
        1: { fontStyle: "bold", textColor: [navyMedium[0], navyMedium[1], navyMedium[2]] },
        2: { textColor: [slateMuted[0], slateMuted[1], slateMuted[2]], cellWidth: 80, halign: "center" },
        3: { fontStyle: "bold", textColor: [amberGold[0], amberGold[1], amberGold[2]], cellWidth: 70, halign: "right" },
      },
      didDrawCell: (data) => {
        // Embed interactive clickable link annotation to target page
        if (data.section === "body" && data.row.raw) {
          const secNum = parseInt(String(data.row.raw[0]), 10);
          const targetPage = sectionPageMap[secNum];
          if (targetPage) {
            pdf.link(
              data.cell.x,
              data.cell.y,
              data.cell.width,
              data.cell.height,
              { pageNumber: targetPage }
            );
          }
        }
      },
    });

    tocY = (pdf as any).lastAutoTable.finalY + 16;

    // Executive Financial Snapshot Box on TOC Page
    const fin = compiled.financialSummary;
    if ((fin.year1Revenue > 0 || fin.totalStartupCosts > 0) && tocY < pageHeight - 110) {
      pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      pdf.roundedRect(margin, tocY, contentWidth, 80, 6, 6, "F");

      pdf.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
      pdf.setFont(fontHeading, "bold");
      pdf.setFontSize(10.5);
      pdf.text("Key Pro-Forma Financial Targets", margin + 16, tocY + 18);

      const colWidth = (contentWidth - 32) / 4;
      const kpis = [
        { label: "Year 1 Revenue", val: formatCurrency(fin.year1Revenue, fin.currency) },
        { label: "Year 1 EBITDA", val: formatCurrency(fin.year1EBITDA, fin.currency) },
        { label: "Startup Capital", val: formatCurrency(fin.totalStartupCosts, fin.currency) },
        { label: "Funding Ask", val: fin.totalFundingRequired > 0 ? formatCurrency(fin.totalFundingRequired, fin.currency) : "Self-Funded" },
      ];

      kpis.forEach((kpi, idx) => {
        const xPos = margin + 16 + idx * colWidth;
        pdf.setFont(fontPrimary, "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        pdf.text(kpi.label.toUpperCase(), xPos, tocY + 38);

        pdf.setFont(fontHeading, "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(navyMedium[0], navyMedium[1], navyMedium[2]);
        pdf.text(kpi.val, xPos, tocY + 56);
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Running Header & Footer for All Content Pages
  // ───────────────────────────────────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  const startPage = includeCover ? 2 : 1;

  for (let p = startPage; p <= totalPages; p++) {
    pdf.setPage(p);

    // Header with optional small logo thumbnail
    let headerTextX = margin;
    if (logoDataUrl && logoPlacement === "cover-and-header") {
      try {
        pdf.addImage(logoDataUrl, "PNG", margin, 24, 16, 16);
        headerTextX = margin + 22;
      } catch (e) {
        // Fallback silently if image format failed
      }
    }

    pdf.setFont(fontPrimary, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    pdf.text(`${compiled.name.toUpperCase()} · BUSINESS PLAN`, headerTextX, 36);

    pdf.setFont(fontHeading, "bold");
    pdf.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
    pdf.text("CONFIDENTIAL", pageWidth - margin, 36, { align: "right" });

    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 42, pageWidth - margin, 42);

    // Footer
    pdf.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38);

    pdf.setFont(fontPrimary, "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    pdf.text(
      `Generated by Scruttin · ${compiled.date}`,
      margin,
      pageHeight - 24
    );

    pdf.setFont(fontHeading, "bold");
    pdf.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 24,
      { align: "right" }
    );
  }

  // Save the PDF
  const filename = isExecutiveBriefOnly
    ? `${fileBase}-executive-brief.pdf`
    : `${fileBase}-business-plan.pdf`;
  pdf.save(filename);
}

// ─── Export Compiled DOCX Word Document ───────────────────────────────────────
export async function exportBusinessPlanToDocx(plan: BusinessPlan): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } = await import("docx");
  const { downloadBlob } = await import("./sampleBusinessPlan");
  const compiled = compileBusinessPlan(plan);
  const fileBase = (plan.name || "business-plan").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: compiled.name,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [new TextRun({ text: compiled.tagline, italics: true })],
    }),
    new Paragraph({
      text: `Prepared for: ${compiled.preparedFor} | Author: ${compiled.author} | Date: ${compiled.date}`,
    }),
    new Paragraph({ text: "" })
  );

  compiled.sections.forEach((section) => {
    children.push(
      new Paragraph({
        text: `${section.number}. ${section.title}`,
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (section.summary) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.summary, italics: true })],
        })
      );
    }

    if (!section.subsections.length || !section.hasContent) {
      children.push(new Paragraph({ text: "Section pending completion in builder." }));
      return;
    }

    section.subsections.forEach((sub) => {
      children.push(
        new Paragraph({
          text: sub.title,
          heading: HeadingLevel.HEADING_2,
        })
      );

      if (sub.type === "quote" && sub.text) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `"${sub.text}"`, italics: true })],
          })
        );
      } else if (sub.type === "key-value" && sub.keyValuePairs) {
        sub.keyValuePairs.forEach((kv) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${kv.key}: `, bold: true }),
                new TextRun({ text: kv.value }),
              ],
            })
          );
        });
      } else if (sub.type === "table" && sub.tableHeaders && sub.tableRows) {
        const tableRows = [
          new TableRow({
            children: sub.tableHeaders.map(
              (h) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  width: { size: Math.floor(100 / sub.tableHeaders!.length), type: WidthType.PERCENTAGE },
                })
            ),
          }),
          ...sub.tableRows.map(
            (row) =>
              new TableRow({
                children: row.map(
                  (cell) =>
                    new TableCell({
                      children: [new Paragraph({ text: cell })],
                      width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
                    })
                ),
              })
          ),
        ];

        children.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      } else if (sub.text) {
        sub.text.split("\n\n").forEach((p) => {
          children.push(new Paragraph({ text: p }));
        });
      }

      children.push(new Paragraph({ text: "" }));
    });
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${fileBase}-business-plan.docx`);
}
