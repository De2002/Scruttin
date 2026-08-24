import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlan } from "@/lib/storage";
import { downloadBlob } from "@/lib/sampleBusinessPlan";
import { BusinessPlan } from "@/types/businessPlan";

export default function DocumentPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [tab, setTab] = useState<"preview" | "export">("preview");

  useEffect(() => {
    if (planId) {
      getPlan(planId).then((loaded) => {
        if (loaded) setPlan(loaded);
      });
    }
  }, [planId]);

  if (!plan) return null;

  const cd = plan.companyDescription || {};
  const ma = plan.marketAnalysis || {};
  const es = plan.executiveSummary || {};

  const executiveSummaryContent = (es.businessOverview || es.problemStatement || es.opportunityStatement || es.marketOpportunity || es.solutionSummary || es.financialHighlights) ? (
    <div className="space-y-4 text-sm leading-relaxed text-navy-800">
      {es.businessOverview && <div><p className="font-semibold mb-1">Business Overview</p><p>{es.businessOverview}</p></div>}
      {es.problemStatement && <div><p className="font-semibold mb-1">Problem</p><p>{es.problemStatement}</p></div>}
      {es.opportunityStatement && <div><p className="font-semibold mb-1">Opportunity</p><p className="whitespace-pre-wrap">{es.opportunityStatement}</p></div>}
      {es.solutionSummary && <div><p className="font-semibold mb-1">Solution</p><p>{es.solutionSummary}</p></div>}
      {es.marketOpportunity && <div><p className="font-semibold mb-1">Market Opportunity</p><p>{es.marketOpportunity}</p></div>}
      {es.financialHighlights && <div><p className="font-semibold mb-1">Financial Highlights</p><p>{es.financialHighlights}</p></div>}
    </div>
  ) : null;

  const sections = [
    { num: "1", title: "Executive Summary", content: executiveSummaryContent, placeholder: "Complete the Executive Summary phase to generate this section." },
    {
      num: "2", title: "Company Description", content: cd.businessName ? (
        <div className="space-y-4 text-sm leading-relaxed text-navy-800">
          {cd.businessName && <p><strong>{cd.businessName}</strong>{cd.tagline ? ` — ${cd.tagline}` : ""}</p>}
          {cd.businessActivity && <p>{cd.businessActivity}</p>}
          {cd.businessPurpose && <div><p className="font-semibold mb-1">Purpose</p><p>{cd.businessPurpose}</p></div>}
          {cd.problemOrNeed && <div><p className="font-semibold mb-1">Problem Addressed</p><p>{cd.problemOrNeed}</p></div>}
          {cd.mission && <div><p className="font-semibold mb-1">Mission</p><p className="italic">"{cd.mission}"</p></div>}
          {cd.vision && <div><p className="font-semibold mb-1">Vision</p><p className="italic">"{cd.vision}"</p></div>}
          {cd.objectives && <div><p className="font-semibold mb-1">Objectives</p><p className="whitespace-pre-wrap">{cd.objectives}</p></div>}
          {cd.legalStructure && <p><strong>Legal Structure:</strong> {cd.legalStructure}</p>}
          {cd.businessStage && <p><strong>Stage:</strong> {cd.businessStage.replace(/_/g, " ")}</p>}
        </div>
      ) : null, placeholder: "Complete the Company Description phase to generate this section."
    },
    {
      num: "3", title: "Market Analysis", content: ma.industry ? (
        <div className="space-y-4 text-sm leading-relaxed text-navy-800">
          {ma.industry && <div><p className="font-semibold mb-1">Industry</p><p>{ma.industry}{ma.industrySegment ? ` — ${ma.industrySegment}` : ""}</p></div>}
          {ma.industryDescription && <p>{ma.industryDescription}</p>}
          {ma.marketValue && <div><p className="font-semibold mb-1">Market Size</p><p>{ma.marketValue} {ma.marketCurrency} ({ma.marketYear})</p></div>}
          {ma.growthDirection && <div><p className="font-semibold mb-1">Market Growth</p><p>The market is {ma.growthDirection}{ma.growthRate ? ` at ${ma.growthRate}` : ""}{ma.growthPeriod ? ` over ${ma.growthPeriod}` : ""}.</p></div>}
          {(ma.trends || []).length > 0 && (
            <div>
              <p className="font-semibold mb-2">Market Trends</p>
              <ul className="space-y-2">
                {ma.trends!.map((t) => <li key={t.id} className="pl-4 border-l-2 border-amber-300"><strong>{t.trend}</strong>{t.expectedImpact ? ` — ${t.expectedImpact}` : ""}</li>)}
              </ul>
            </div>
          )}
          {ma.primaryCustomer && <div><p className="font-semibold mb-1">Primary Customer</p><p>{ma.primaryCustomer}</p></div>}
          {(ma.directCompetitors || []).length > 0 && (
            <div>
              <p className="font-semibold mb-2">Direct Competitors</p>
              <ul className="space-y-1">
                {ma.directCompetitors!.map((c) => <li key={c.id} className="text-navy-700"><strong>{c.name}</strong>{c.description ? ` — ${c.description}` : ""}</li>)}
              </ul>
            </div>
          )}
          {ma.positioning && <div><p className="font-semibold mb-1">Positioning</p><p>{ma.positioning}</p></div>}
          {ma.opportunities && <div><p className="font-semibold mb-1">Opportunities</p><p>{ma.opportunities}</p></div>}
          {ma.threats && <div><p className="font-semibold mb-1">Threats</p><p>{ma.threats}</p></div>}
        </div>
      ) : null, placeholder: "Complete the Market Analysis phase to generate this section."
    },
    { num: "4", title: "Organization & Management", content: null, placeholder: "Complete the Organization & Management phase." },
    { num: "5", title: "Products & Services", content: null, placeholder: "Complete the Products & Services phase." },
    { num: "6", title: "Marketing & Sales", content: null, placeholder: "Complete the Marketing & Sales phase." },
    { num: "7", title: "Operations", content: null, placeholder: "Complete the Operations phase." },
    { num: "8", title: "Financial Plan", content: null, placeholder: "Complete the Financial Plan phase." },
    { num: "9", title: "Funding Request", content: null, placeholder: "Include only if external funding is required." },
    { num: "10", title: "Risks & Mitigation", content: null, placeholder: "Complete the Risks & Mitigation phase." },
    { num: "11", title: "Milestones", content: null, placeholder: "Complete the Milestones phase." },
    { num: "12", title: "Appendix", content: null, placeholder: "Attach supporting documents in the Appendix phase." },
  ];

  const completedSections = sections.filter((s) => s.content).length;

  const exportSections = sections.filter((section) => section.content);
  const fileBase = plan.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "business-plan";

  const exportAsPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 54;
    let y = 60;
    const addText = (text: string, size = 10, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, 504);
      const height = lines.length * (size + 5);
      if (y + height > 730) { pdf.addPage(); y = 58; }
      pdf.text(lines, margin, y);
      y += height + 8;
    };

    // Match the original generated-plan format: branded cover, then content pages.
    pdf.setFillColor(15, 30, 60);
    pdf.rect(0, 0, 612, 792, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(30);
    pdf.text(plan.name, margin, 240);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(15);
    if (cd.tagline) pdf.text(cd.tagline, margin, 270);
    pdf.setFontSize(10);
    pdf.text("BUSINESS PLAN", margin, 650);
    pdf.text(`Prepared · ${new Date(plan.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`, margin, 670);

    pdf.addPage();
    y = 60;
    pdf.setTextColor(15, 30, 60);
    const executiveText = [es.businessOverview, es.problemStatement, es.opportunityStatement, es.solutionSummary, es.marketOpportunity, es.financialHighlights].filter(Boolean).join("\\n\\n");
    addText("Executive Summary", 20, true);
    if (executiveText) addText(executiveText, 11);
    exportSections.filter((section) => section.title !== "Executive Summary").forEach((section) => {
      addText(section.title, 16, true);
      if (section.content) addText(section.title === "Company Description" ? [cd.businessName, cd.businessActivity, cd.businessPurpose, cd.problemOrNeed, cd.mission, cd.vision, cd.objectives].filter(Boolean).join("\\n\\n") : section.placeholder, 10);
    });

    const pages = pdf.getNumberOfPages();
    for (let page = 2; page <= pages; page++) {
      pdf.setPage(page);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`${plan.name} · Business plan · ${page}`, margin, 760);
    }
    pdf.save(`${fileBase}.pdf`);
  };

  const exportAsDocx = async () => {
    const { Document, Packer, Paragraph, HeadingLevel } = await import("docx");
    const children = [new Paragraph({ text: plan.name, heading: HeadingLevel.TITLE }), new Paragraph("Business Plan")];
    exportSections.forEach((section) => { children.push(new Paragraph({ text: `${section.num}. ${section.title}`, heading: HeadingLevel.HEADING_1 }), new Paragraph(section.title === "Executive Summary" ? [es.businessOverview, es.problemStatement, es.opportunityStatement, es.solutionSummary, es.marketOpportunity, es.financialHighlights].filter(Boolean).join("\\n\\n") : section.placeholder)); });
    downloadBlob(await Packer.toBlob(new Document({ sections: [{ children }] })), `${fileBase}.docx`);
  };

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <style>{`@media print { header, main > div:first-child, main > div:last-child { display: none !important; } main { max-width: none !important; padding: 0 !important; } main > div:nth-child(2) { display: block !important; } }`}</style>
      <header className="bg-navy-900 border-b border-navy-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/plan/${planId}/build`)} className="text-navy-400 hover:text-white text-sm transition-colors">← Back to plan</button>
            <span className="text-navy-600">|</span>
            <span className="text-white text-sm font-medium">Document Preview</span>
          </div>
          <div className="flex items-center gap-3">
            {(["preview", "export"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded text-xs font-medium capitalize transition-all ${tab === t ? "bg-amber-400 text-navy-900" : "text-navy-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {tab === "preview" ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-serif font-bold text-navy-900">{plan.name}</h1>
                <p className="text-muted-foreground text-sm">{completedSections} of {sections.length} sections have content</p>
              </div>
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${completedSections < 4 ? "bg-amber-100 text-amber-700" : "bg-sage-100 text-sage-700"}`}>
                {plan.overallProgress}% complete
              </div>
            </div>

            {/* Cover page mock */}
            <div className="bg-navy-900 text-white rounded-xl p-10 text-center mb-8">
              <p className="text-navy-400 text-xs uppercase tracking-widest mb-6">Business Plan</p>
              <h1 className="text-3xl font-serif font-bold mb-3">{plan.name}</h1>
              {cd.tagline && <p className="text-navy-300 text-base italic mb-6">"{cd.tagline}"</p>}
              <div className="border-t border-navy-700 pt-6 mt-6">
                <p className="text-navy-400 text-sm">Prepared: {new Date(plan.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                {cd.legalStructure && <p className="text-navy-400 text-xs mt-1">{cd.legalStructure.replace(/_/g, " ")}</p>}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.num} className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className={`px-6 py-4 flex items-center gap-3 border-b border-border ${section.content ? "bg-navy-50" : "bg-muted"}`}>
                    <span className="text-amber-500 font-mono text-xs font-bold w-5">{section.num}</span>
                    <h3 className="font-semibold text-navy-900 text-sm">{section.title}</h3>
                    {section.content ? (
                      <span className="ml-auto flex items-center gap-1 text-sage-600 text-xs font-medium">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Has content
                      </span>
                    ) : (
                      <span className="ml-auto text-muted-foreground text-xs">Incomplete</span>
                    )}
                  </div>
                  <div className="px-6 py-5">
                    {section.content ? section.content : (
                      <p className="text-muted-foreground text-sm italic">{section.placeholder}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 4h20v4H4zM4 12h14v4H4zM4 20h10v4H4z" fill="hsl(220 55% 14%)" opacity="0.4"/></svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-navy-900 mb-3">Export Your Business Plan</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
              Once your plan is complete, you'll be able to export a professionally formatted PDF or DOCX document. You have <strong>{plan.overallProgress}%</strong> of your plan completed.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={exportAsPdf}
                className="bg-navy-900 text-white px-7 py-3 rounded-lg font-semibold text-sm hover:bg-navy-800 transition-colors"
              >
                Export as PDF
              </button>
              <button
                onClick={exportAsDocx}
                className="border border-border text-navy-700 px-7 py-3 rounded-lg font-semibold text-sm hover:bg-muted transition-colors"
              >
                Export as DOCX
              </button>
            </div>
            {plan.overallProgress < 80 && (
              <p className="text-amber-600 text-xs mt-6">Complete more of your plan before exporting for best results.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
