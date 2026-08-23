export interface SampleSection { title: string; summary: string; bullets: string[] }

export const sampleBusinessPlan = {
  businessName: "Lumen Pantry",
  tagline: "Better food, less friction.",
  owner: "Maya Chen",
  location: "Austin, Texas",
  created: "August 2026",
  executiveSummary: "Lumen Pantry is a neighborhood meal-planning subscription that turns dietary preferences, local availability, and household budgets into practical weekly dinners. The service combines a lightweight planning app with chef-curated grocery kits, helping busy households cook more consistently while reducing food waste.",
  sections: [
    { title: "Company Description", summary: "A purpose-led food technology company making home cooking easier for modern households.", bullets: ["Mission: make healthy home cooking the default, not the aspiration.", "Business model: recurring memberships plus margin on optional grocery kits.", "Three-year vision: become the trusted weekly planning layer for 250,000 households."] },
    { title: "Problem & Opportunity", summary: "Households lose time and money deciding what to cook, shopping for it, and managing unused ingredients.", bullets: ["71% of surveyed parents cite weekday dinner decisions as a recurring stressor.", "Average target household spends $180 monthly on unused or expired groceries.", "Convenience options are either expensive, nutritionally generic, or operationally inflexible."] },
    { title: "Market Analysis", summary: "Lumen Pantry operates at the intersection of meal kits, grocery commerce, and personal wellness.", bullets: ["Primary segment: dual-income households with children under 12.", "Launch geography: Austin, Dallas, and Houston metro areas.", "TAM: $4.8B US meal planning and at-home convenience spend; beachhead SAM: $92M."] },
    { title: "Customer Segments", summary: "The initial customer is time-poor, digitally fluent, and willing to pay for dependable routines.", bullets: ["Core: working parents seeking predictable weeknight meals.", "Secondary: health-conscious couples and households managing allergies.", "Buying trigger: a new school year, new baby, or repeated grocery overspend."] },
    { title: "Products & Offerings", summary: "A flexible subscription with a free planning tier and premium grocery fulfillment.", bullets: ["Lumen Plan — $12/month: personalized menus, pantry memory, and shared lists.", "Lumen Kits — $68/week: four dinners for a family of four, delivered locally.", "Lumen Teams — $399/month: employer wellness benefit for up to 50 households."] },
    { title: "Competitive Strategy", summary: "Win through personalization, local supply intelligence, and a calmer customer experience.", bullets: ["Unlike meal kits, customers can use ingredients already in their pantry.", "Unlike generic recipe apps, plans respect budget, schedule, and dietary constraints.", "Defensibility compounds through preference data and local supplier relationships."] },
    { title: "Marketing & Sales", summary: "A referral-led launch supported by neighborhood partnerships and high-intent content.", bullets: ["Founding household program: 500 members recruited through local schools and studios.", "Content engine: seasonal shopping guides, 20-minute recipes, and waste calculators.", "Target blended CAC: $42; target first-year revenue per paid household: $276."] },
    { title: "Operations Plan", summary: "A focused local operation that earns density before geographic expansion.", bullets: ["Menus are planned six weeks ahead and refreshed weekly by a culinary lead.", "Kits are assembled through two shared commercial kitchens and routed by zone.", "Customer support target: first response within four business hours."] },
    { title: "Team & Organization", summary: "A compact founding team combines product, culinary, and marketplace experience.", bullets: ["Maya Chen, Founder & CEO — former product lead at a consumer subscription company.", "Luis Ortega, Culinary Director — 12 years in restaurant and food distribution operations.", "Priya Shah, Growth Advisor — scaled two local-to-national wellness brands."] },
    { title: "Financial Plan", summary: "The business targets contribution-positive subscriptions in month nine and operating break-even in month 22.", bullets: ["Year 1 revenue: $486,000; Year 2: $1.74M; Year 3: $4.62M.", "Gross margin target: 54% on memberships and 31% on grocery kits.", "Break-even requires 1,850 active paid households at blended ARPU of $31/month."] },
    { title: "Funding & Milestones", summary: "A $650,000 pre-seed round funds product launch, local operations, and validated repeatability.", bullets: ["Months 1–3: launch beta with 100 households and 10 supplier partners.", "Months 4–9: reach 750 paid households and prove 65% month-three retention.", "Months 10–18: expand to Dallas, add employer plan, and reach $120k MRR."] },
    { title: "Risks & Appendix", summary: "The plan prioritizes food safety, retention, supply continuity, and disciplined market expansion.", bullets: ["Mitigation: dual-source core ingredients and maintain documented cold-chain checks.", "Mitigation: cohort retention reviews every month before adding paid acquisition.", "Appendix includes interview notes, pricing assumptions, supplier scorecard, and 36-month model inputs."] },
  ] as SampleSection[],
};

export type SampleBusinessPlan = typeof sampleBusinessPlan;

export const samplePlainText = () => [
  sampleBusinessPlan.businessName,
  sampleBusinessPlan.tagline,
  `Prepared for ${sampleBusinessPlan.owner} · ${sampleBusinessPlan.location} · ${sampleBusinessPlan.created}`,
  "",
  "EXECUTIVE SUMMARY",
  sampleBusinessPlan.executiveSummary,
  ...sampleBusinessPlan.sections.flatMap((section) => ["", section.title.toUpperCase(), section.summary, ...section.bullets.map((bullet) => `• ${bullet}`)]),
].join("\n");

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadSamplePdf = async () => {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  let y = 60;
  const addText = (text: string, size = 10, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, 504); const needed = lines.length * (size + 5);
    if (y + needed > 730) { pdf.addPage(); y = 58; }
    pdf.text(lines, margin, y); y += needed + 8;
  };
  pdf.setFillColor(15, 30, 60); pdf.rect(0, 0, 612, 792, "F");
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(30); pdf.text(sampleBusinessPlan.businessName, margin, 240);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(15); pdf.text(sampleBusinessPlan.tagline, margin, 270);
  pdf.setFontSize(10); pdf.text("SAMPLE BUSINESS PLAN", margin, 650); pdf.text(`${sampleBusinessPlan.owner} · ${sampleBusinessPlan.created}`, margin, 670);
  pdf.addPage(); y = 60; pdf.setTextColor(15, 30, 60); addText("Executive Summary", 20, true); addText(sampleBusinessPlan.executiveSummary, 11);
  for (const section of sampleBusinessPlan.sections) { addText(section.title, 16, true); addText(section.summary, 10); section.bullets.forEach((bullet) => addText(`• ${bullet}`, 10)); }
  const pages = pdf.getNumberOfPages(); for (let page = 2; page <= pages; page++) { pdf.setPage(page); pdf.setFontSize(9); pdf.setTextColor(120, 120, 120); pdf.text(`Lumen Pantry · Sample plan · ${page}`, margin, 760); }
  pdf.save("lumen-pantry-sample-business-plan.pdf");
};

export const downloadSampleDocx = async () => {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, PageBreak } = await import("docx");
  const children = [new Paragraph({ text: sampleBusinessPlan.businessName, heading: HeadingLevel.TITLE }), new Paragraph({ children: [new TextRun({ text: sampleBusinessPlan.tagline, italics: true })] }), new Paragraph({ text: `Prepared for ${sampleBusinessPlan.owner} · ${sampleBusinessPlan.location} · ${sampleBusinessPlan.created}` }), new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1 }), new Paragraph(sampleBusinessPlan.executiveSummary), new Paragraph({ children: [new PageBreak()] })];
  sampleBusinessPlan.sections.forEach((section) => { children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }), new Paragraph(section.summary)); section.bullets.forEach((bullet) => children.push(new Paragraph({ text: bullet, bullet: { level: 0 } }))); });
  const doc = new Document({ sections: [{ properties: {}, children }] });
  downloadBlob(await Packer.toBlob(doc), "lumen-pantry-sample-business-plan.docx");
};
