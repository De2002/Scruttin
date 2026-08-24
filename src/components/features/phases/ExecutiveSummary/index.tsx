import React, { useState, useMemo, useEffect } from "react";
import { BusinessPlan } from "@/types/businessPlan";
import {
  TopicHeader,
  EducationPanel,
  TextAreaField,
  TextField,
  TopicNav,
} from "@/components/features/walkthrough/TopicComponents";
import { PHASES } from "@/constants/phases";
import { toast } from "sonner";

// ─── Phase constant ───────────────────────────────────────────────────────────
const PHASE = PHASES.find((p) => p.id === "executive_summary")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── ES data type ─────────────────────────────────────────────────────────────
export interface ExecutiveSummaryData {
  businessOverview?: string;
  overrideOverview?: boolean;
  problemStatement?: string;
  overrideProblem?: boolean;
  opportunityStatement?: string;
  solutionSummary?: string;
  overrideSolution?: boolean;
  marketOpportunity?: string;
  overrideMarket?: boolean;
  competitiveAdvantage?: string;
  teamSummary?: string;
  overrideTeam?: boolean;
  financialHighlights?: string;
  overrideFinancials?: boolean;
  fundingHighlight?: string;
  overrideFunding?: boolean;
  callToAction?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  plan: BusinessPlan;
  currentTopic: string;
  onUpdatePlan: (changes: Partial<BusinessPlan>) => void;
  onUpdateTopicStatus: (
    topicId: string,
    status: "not_started" | "in_progress" | "completed" | "skipped"
  ) => void;
  onNavigate: (phase: string, topic: string) => void;
  onOpenAI: () => void;
}

// ─── Financial calculations ───────────────────────────────────────────────────
function calcYear1Revenue(plan: BusinessPlan): number {
  const assumptions = plan.financialPlan?.salesAssumptions || [];
  return assumptions.reduce((total, a) => {
    const monthlyRevenues = Array.from({ length: 12 }, (_, i) =>
      (a.price || 0) * (a.unitsPerMonth || 0) * Math.pow(1 + (a.growthRateMonthly || 0) / 100, i)
    );
    return total + monthlyRevenues.reduce((s, v) => s + v, 0);
  }, 0);
}

function calcBreakevenMonth(plan: BusinessPlan): number | null {
  const assumptions = plan.financialPlan?.salesAssumptions || [];
  const fixedExpenses = plan.financialPlan?.fixedExpenses || [];
  const payrollItems = plan.financialPlan?.payrollItems || [];
  if (!assumptions.length) return null;

  const totalFixed = fixedExpenses.reduce((s, e) => s + (e.monthlyAmount || 0), 0);
  const totalPayroll = payrollItems.reduce((s, p) => {
    return s + (p.monthlySalary || 0) * (p.headcount || 1);
  }, 0);
  const fixedMonthly = totalFixed + totalPayroll;

  for (let month = 1; month <= 24; month++) {
    const revenue = assumptions.reduce((s, a) => {
      return (
        s +
        (a.price || 0) *
          (a.unitsPerMonth || 0) *
          Math.pow(1 + (a.growthRateMonthly || 0) / 100, month - 1)
      );
    }, 0);
    const cogs = assumptions.reduce((s, a) => {
      const units = (a.unitsPerMonth || 0) * Math.pow(1 + (a.growthRateMonthly || 0) / 100, month - 1);
      return s;
    }, 0);
    if (revenue >= fixedMonthly && fixedMonthly > 0) return month;
  }
  return null;
}

function fmt(n: number): string {
  if (!n) return "$0";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + Math.round(n).toLocaleString("en-AU");
  return "$" + Math.round(n).toLocaleString("en-AU");
}

// ─── Phase root ───────────────────────────────────────────────────────────────
export default function ExecutiveSummaryPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const es: ExecutiveSummaryData = (plan as any).executiveSummary || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<ExecutiveSummaryData>) => {
    onUpdatePlan({ executiveSummary: { ...es, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next ? onNavigate("executive_summary", nav.next.id) : onNavigate("appendix", "ap_intro");
  const handlePrev = () =>
    nav.prev ? onNavigate("executive_summary", nav.prev.id) : onNavigate("milestones", "ms_review");

  const sharedProps = { es, update, status, markComplete, onNext: handleNext, onPrev: handlePrev, onNavigate, onUpdateTopicStatus, plan };

  const renderTopic = () => {
    switch (currentTopic) {
      case "es_intro":      return <ESIntro {...sharedProps} />;
      case "es_overview":   return <ESOverview {...sharedProps} />;
      case "es_opportunity": return <ESOpportunity {...sharedProps} />;
      case "es_market":     return <ESMarket {...sharedProps} />;
      case "es_financials": return <ESFinancials {...sharedProps} />;
      case "es_review":     return <ESReview {...sharedProps} />;
      default:              return <ESIntro {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Phase header ─────────────────────────────────────────────────────────────
function ESPhaseHeader() {
  return (
    <div className="mb-8 p-5 rounded-xl bg-navy-900 text-white">
      <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Phase 11</p>
      <h2 className="font-serif text-2xl font-bold leading-tight mb-1">Executive Summary</h2>
      <p className="text-white/65 text-sm">
        Written last. Appears first. The most-read section of any business plan.
      </p>
    </div>
  );
}

// ─── Auto-populated field component ──────────────────────────────────────────
function AutoField({
  label,
  autoValue,
  overrideKey,
  fieldKey,
  es,
  update,
  placeholder,
  rows = 4,
  helpText,
  required,
}: {
  label: string;
  autoValue: string;
  overrideKey: keyof ExecutiveSummaryData;
  fieldKey: keyof ExecutiveSummaryData;
  es: ExecutiveSummaryData;
  update: (c: Partial<ExecutiveSummaryData>) => void;
  placeholder?: string;
  rows?: number;
  helpText?: string;
  required?: boolean;
}) {
  const isOverriding = es[overrideKey] as boolean;
  const displayValue = isOverriding ? ((es[fieldKey] as string) || "") : autoValue;
  const hasAutoValue = autoValue && autoValue.trim().length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="input-label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        {hasAutoValue && (
          <button
            onClick={() => update({ [overrideKey]: !isOverriding, [fieldKey]: isOverriding ? "" : autoValue } as any)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
              isOverriding
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-sage-50 border-sage-300 text-sage-700"
            }`}
          >
            {isOverriding ? "↩ Use Auto-Draft" : "✏ Customise"}
          </button>
        )}
      </div>

      {!hasAutoValue && !isOverriding ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-700 text-sm">
            No data pulled from earlier phases yet. Complete the relevant phase first, or write this section manually using the Customise button.
          </p>
        </div>
      ) : isOverriding ? (
        <div>
          <textarea
            value={(es[fieldKey] as string) || ""}
            onChange={(e) => update({ [fieldKey]: e.target.value } as any)}
            placeholder={placeholder}
            rows={rows}
            className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none leading-relaxed"
          />
          {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}
        </div>
      ) : (
        <div className="relative bg-navy-50 border border-navy-200 rounded-lg p-4">
          <div className="absolute top-2 right-2 bg-sage-100 text-sage-700 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
            Auto
          </div>
          <p className="text-navy-800 text-sm leading-relaxed whitespace-pre-wrap pr-8">{autoValue}</p>
          {helpText && <p className="text-xs text-navy-400 mt-2">{helpText}</p>}
        </div>
      )}
    </div>
  );
}

// ─── 01 — About the Executive Summary ────────────────────────────────────────
function ESIntro({ es, update, status, markComplete, onNext, onPrev, plan }: any) {
  // Calculate overall completion across all phases
  const allTopics = PHASES.flatMap((p) => p.topics.map((t) => t.id));
  const completedTopics = allTopics.filter(
    (id) => plan.topicStatus?.[id] === "completed"
  );
  const completionPct = Math.round((completedTopics.length / allTopics.length) * 100);

  const phasesWithData = [
    { id: "company_description", label: "Company Description", field: plan.companyDescription?.businessName },
    { id: "market_analysis", label: "Market Analysis", field: plan.marketAnalysis?.industry },
    { id: "organization", label: "Organization & Management", field: (plan as any).organization?.founders?.length > 0 },
    { id: "products_services", label: "Products & Services", field: (plan as any).productsServices?.offerings?.length > 0 },
    { id: "marketing_sales", label: "Marketing & Sales", field: (plan as any).marketingSales?.primaryObjectives },
    { id: "operations", label: "Operations", field: (plan as any).operations?.businessModelType },
    { id: "financial_plan", label: "Financial Plan", field: plan.financialPlan?.salesAssumptions?.length > 0 },
    { id: "funding", label: "Funding Request", field: (plan as any).fundingRequest?.requiresFunding !== undefined },
    { id: "risks", label: "Risks & Mitigation", field: (plan as any).risks?.length > 0 },
    { id: "milestones", label: "Milestones", field: (plan as any).milestones?.length > 0 },
  ];

  const completedPhases = phasesWithData.filter((p) => p.field).length;

  return (
    <div>
      <ESPhaseHeader />
      <TopicHeader
        phase="Executive Summary"
        phaseNumber={11}
        topicNumber={1}
        topicTitle="About the Executive Summary"
        estimatedMinutes={4}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          The Executive Summary is the first section readers encounter in your business plan — but it is always the last section written. That's because it summarises everything you have already thought through in depth across the other ten phases.
        </p>
        <p className="text-navy-700">
          A well-written Executive Summary can be read in 2–3 minutes and leaves the reader with a clear understanding of what the business does, why it will succeed, who is behind it, how it makes money, and what it needs. For many readers — lenders, investors, and partners — it is the only section they read in full.
        </p>
      </EducationPanel>

      {/* Why it matters */}
      <div className="mt-8 bg-white border border-border rounded-xl overflow-hidden">
        <div className="bg-navy-900 px-5 py-3">
          <p className="text-white font-semibold text-sm">Why the Executive Summary is written last</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "📋",
                title: "Synthesis, not introduction",
                desc: "The ES distils 10 phases of thinking. You can only write a credible summary after you've done the detailed work — not before.",
              },
              {
                icon: "🎯",
                title: "First impression",
                desc: "It sets expectations. A strong ES signals rigorous thinking throughout. A weak one undermines everything that follows.",
              },
              {
                icon: "⏱",
                title: "2–3 minute read",
                desc: "Busy stakeholders read this first. If it doesn't capture them, they won't continue. Brevity and clarity are everything.",
              },
              {
                icon: "📐",
                title: "Appears first in the document",
                desc: "Despite being written last, it's placed at the beginning of your finished business plan — before Company Description, before everything.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 bg-navy-50 rounded-lg">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-navy-900 text-sm mb-1">{item.title}</p>
                  <p className="text-navy-600 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What it covers */}
      <div className="mt-5 bg-white border border-border rounded-xl overflow-hidden">
        <div className="bg-navy-900 px-5 py-3">
          <p className="text-white font-semibold text-sm">What an Executive Summary covers (in order)</p>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {[
              { n: 1, label: "Business Overview", desc: "Name, what you do, stage, location, legal structure" },
              { n: 2, label: "Problem & Opportunity", desc: "The problem you solve and why the timing is right" },
              { n: 3, label: "Market Opportunity", desc: "Size, growth, target customer, your differentiation" },
              { n: 4, label: "Products & Services Summary", desc: "What you offer and why customers will choose it" },
              { n: 5, label: "Team", desc: "Who is behind it and why they are the right people" },
              { n: 6, label: "Financial Highlights", desc: "Year 1 revenue, break-even, key financial proof points" },
              { n: 7, label: "Funding Requirement", desc: "If applicable — how much, what for, what's offered" },
            ].map((item) => (
              <div key={item.n} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
                <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.n}
                </span>
                <div>
                  <p className="font-semibold text-navy-800 text-sm">{item.label}</p>
                  <p className="text-navy-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Readiness check */}
      <div className="mt-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-navy-800 font-semibold text-sm">Plan Completion Snapshot</p>
          <span className={`text-sm font-bold ${completedPhases >= 8 ? "text-sage-600" : "text-amber-500"}`}>
            {completedPhases}/10 phases with data
          </span>
        </div>
        <p className="text-navy-600 text-xs mb-4">
          The more phases you have completed, the more of this summary will be auto-populated from your actual data. You can always write sections manually using the Customise button on each field.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {phasesWithData.map((p) => (
            <div
              key={p.id}
              className={`text-center p-2 rounded-lg border text-xs font-medium ${
                p.field
                  ? "bg-sage-50 border-sage-200 text-sage-700"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {p.field ? "✓" : "·"} {p.label.split(" ")[0]}
            </div>
          ))}
        </div>

        {completedPhases < 7 && (
          <p className="text-amber-600 text-xs mt-3 font-medium">
            ⚠ Consider completing more phases before writing the Executive Summary — you'll have more data to pull from.
          </p>
        )}
        {completedPhases >= 7 && (
          <p className="text-sage-600 text-xs mt-3 font-medium">
            ✓ You have strong data across most phases. The auto-populated fields below will be well-populated.
          </p>
        )}
      </div>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>Length:</strong> A traditional business plan Executive Summary is 1–2 pages. In this walkthrough, it maps to 5 topics that collectively produce those 1–2 pages when assembled. Write each section concisely — if you find yourself writing more than 3–4 sentences for any field, trim it.
        </p>
      </EducationPanel>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isFirst
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 02 — Business Overview ───────────────────────────────────────────────────
function ESOverview({ es, update, status, markComplete, onNext, onPrev, plan }: any) {
  const cd = plan.companyDescription || {};
  const org = (plan as any).organization || {};
  const founders = org.founders || [];

  // Auto-draft business overview
  const autoOverview = [
    cd.businessName && `${cd.businessName} is ${cd.businessActivity || "a business"}.`,
    cd.businessStage && `The business is currently at the ${cd.businessStage.replace("_", " ")} stage`,
    cd.businessLocation && `, based in ${cd.businessLocation}.`,
    cd.legalStructure && ` It operates as a ${cd.legalStructure.replace(/_/g, " ")}.`,
    cd.mission && `\n\nMission: ${cd.mission}`,
  ]
    .filter(Boolean)
    .join("")
    .trim();

  // Auto-draft team summary
  const autoTeam = founders.length > 0
    ? `The business is led by ${founders
        .slice(0, 3)
        .map((f: any) => `${f.name}${f.role ? ` (${f.role})` : ""}`)
        .join(", ")}${founders.length > 3 ? `, and ${founders.length - 3} others` : ""}.${
        org.employeeCount ? ` The current team comprises ${org.employeeCount} people.` : ""
      }`
    : "";

  return (
    <div>
      <TopicHeader
        phase="Executive Summary"
        phaseNumber={11}
        topicNumber={2}
        topicTitle="Business Overview"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          The Business Overview is the opening paragraph of your Executive Summary. It should answer the most basic questions: What does this business do? Where does it operate? What stage is it at? Who runs it?
        </p>
        <p className="text-navy-700">
          Below, the fields are pre-drafted from your Company Description and Organisation phases. Review each one — if the auto-draft captures your position well, keep it. If not, click Customise to write your own version.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        <AutoField
          label="Business Overview"
          autoValue={autoOverview}
          overrideKey="overrideOverview"
          fieldKey="businessOverview"
          es={es}
          update={update}
          placeholder="Describe the business in 3–5 sentences. Include: business name, what it does, where it operates, legal structure, and current stage."
          rows={5}
          helpText="Pulled from Company Description. Edit via 'Customise' if needed."
          required
        />

        <AutoField
          label="Management Team Summary"
          autoValue={autoTeam}
          overrideKey="overrideTeam"
          fieldKey="teamSummary"
          es={es}
          update={update}
          placeholder="Briefly introduce the founding/leadership team. Include names, roles, and one sentence on what makes them right for this business. 2–4 sentences."
          rows={4}
          helpText="Pulled from Organization phase. Edit via 'Customise'."
          required
        />

        {/* Source data panel */}
        <div className="bg-navy-50 border border-navy-200 rounded-xl p-5">
          <p className="text-navy-600 text-xs font-bold uppercase tracking-wide mb-3">Source Data</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: "Business Name", val: cd.businessName },
              { label: "Activity", val: cd.businessActivity?.slice(0, 60) },
              { label: "Stage", val: cd.businessStage?.replace(/_/g, " ") },
              { label: "Location", val: cd.businessLocation },
              { label: "Legal Structure", val: cd.legalStructure?.replace(/_/g, " ") },
              { label: "Founder Count", val: founders.length > 0 ? `${founders.length} founder(s)` : null },
              { label: "Employee Count", val: org.employeeCount },
              { label: "Mission", val: cd.mission?.slice(0, 80) },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="text-navy-400 w-28 shrink-0 text-xs">{label}</span>
                <span className={`text-xs font-medium ${val ? "text-navy-800" : "text-muted-foreground italic"}`}>
                  {val || "Not completed yet"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 03 — Problem & Opportunity ───────────────────────────────────────────────
function ESOpportunity({ es, update, status, markComplete, onNext, onPrev, plan, onUpdateTopicStatus }: any) {
  const cd = plan.companyDescription || {};

  // Keep the topic status derived from the saved manual answer. This repairs
  // older plans that were marked complete before the required field was filled.
  useEffect(() => {
    const hasOpportunity = Boolean(es.opportunityStatement?.trim());
    if (hasOpportunity && status !== "completed") {
      onUpdateTopicStatus("es_opportunity", "completed");
    } else if (!hasOpportunity && status === "completed") {
      onUpdateTopicStatus("es_opportunity", "in_progress");
    }
  }, [es.opportunityStatement, status, onUpdateTopicStatus]);
  const ps = (plan as any).productsServices || {};
  const offerings = ps.offerings || [];

  const autoProblem = [
    cd.problemOrNeed && cd.problemOrNeed.trim(),
    cd.existingAlternatives && `Existing alternatives — such as ${cd.existingAlternatives.slice(0, 100)} — fail to adequately address this need.`,
  ]
    .filter(Boolean)
    .join(" ");

  const autoSolution = [
    offerings.length > 0
      ? `${cd.businessName || "The business"} addresses this through ${offerings
          .slice(0, 3)
          .map((o: any) => o.name || "its offering")
          .join(", ")}.`
      : null,
    ps.overallValueProp && ps.overallValueProp.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <TopicHeader
        phase="Executive Summary"
        phaseNumber={11}
        topicNumber={3}
        topicTitle="Problem & Opportunity"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          After introducing the business, the Executive Summary immediately establishes why this business exists — the problem it solves and the opportunity it represents. This is the narrative hook. A reader who doesn't understand the problem won't understand the opportunity.
        </p>
        <p className="text-navy-700">
          Be specific. "People find it hard to find parking" is too vague. "45% of CBD commuters spend 20+ minutes finding parking each day, costing them an average of $1,200/year in wasted time and fuel" is compelling.
        </p>
      </EducationPanel>

      {/* Example structure */}
      <div className="mt-6 bg-white border border-border rounded-xl overflow-hidden">
        <div className="bg-navy-900 px-5 py-3">
          <p className="text-white font-semibold text-sm">Structure of a strong Problem & Opportunity section</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            { step: "1", label: "State the problem clearly", tip: "What problem exists? Who experiences it? How significant/painful is it?" },
            { step: "2", label: "Explain why existing solutions fall short", tip: "Why haven't existing alternatives solved it? What gap exists?" },
            { step: "3", label: "Position your solution", tip: "What does your business offer? How does it solve the problem better?" },
            { step: "4", label: "State the business opportunity", tip: "Why is now the right time? Market trends, regulatory changes, technology shifts?" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-navy-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-navy-900 text-sm">{item.label}</p>
                <p className="text-navy-500 text-xs mt-0.5">{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <AutoField
          label="Problem Statement"
          autoValue={autoProblem}
          overrideKey="overrideProblem"
          fieldKey="problemStatement"
          es={es}
          update={update}
          placeholder="Describe the problem your business solves. Be specific — quantify it where possible. Who has this problem? How significant is it? Why haven't existing alternatives solved it?"
          rows={4}
          helpText="Pulled from Company Description — Problem or Need section."
          required
        />

        <AutoField
          label="Your Solution"
          autoValue={autoSolution}
          overrideKey="overrideSolution"
          fieldKey="solutionSummary"
          es={es}
          update={update}
          placeholder="How does your business solve the problem? What do you offer, and what makes it better? 2–4 sentences that bridge the problem to your product/service."
          rows={4}
          helpText="Pulled from Products & Services phase."
          required
        />

        <div>
          <label className="input-label">Opportunity Statement <span className="text-red-500">*</span></label>
          <p className="text-xs text-muted-foreground mb-2">
            Why is now the right time? This bridges the problem into the market opportunity. Write this manually — it requires your personal insight about timing, trends, and competitive dynamics.
          </p>
          <textarea
            value={es.opportunityStatement || ""}
            onChange={(e) => update({ opportunityStatement: e.target.value })}
            placeholder={`Example: "The shift to remote work has permanently increased demand for home office services. The $1.2B home improvement market is growing at 8% annually, driven by hybrid work adoption. Existing providers are fragmented and slow to adapt. [Business name] is positioned at the intersection of this shift — offering a fast, online-first booking experience that legacy competitors cannot easily replicate."`}
            rows={5}
            className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none leading-relaxed"
          />
        </div>
      </div>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 04 — Market Opportunity ──────────────────────────────────────────────────
function ESMarket({ es, update, status, markComplete, onNext, onPrev, plan }: any) {
  const ma = plan.marketAnalysis || {};
  const ps = (plan as any).productsServices || {};
  const offerings = ps.offerings || [];

  const autoMarket = [
    ma.industry && `${cd_name(plan)} operates in the ${ma.industry}${ma.industrySegment ? ` (${ma.industrySegment})` : ""} sector.`,
    ma.marketValue && `The total addressable market is estimated at ${ma.marketCurrency || "$"}${ma.marketValue}${ma.marketYear ? ` (${ma.marketYear})` : ""}`,
    ma.growthDirection && ma.growthRate
      ? `, with the market ${ma.growthDirection === "growing" ? "growing" : ma.growthDirection === "stable" ? "remaining stable" : "experiencing change"} at approximately ${ma.growthRate}${ma.growthPeriod ? ` ${ma.growthPeriod}` : ""}.`
      : ".",
    ma.primaryCustomer && `\n\nThe primary target customer is ${ma.primaryCustomer.slice(0, 150)}.`,
    ma.positioning && `\n\n${ma.positioning.slice(0, 200)}`,
  ]
    .filter(Boolean)
    .join("")
    .trim();

  const autoAdvantage = [
    ma.differentiation && ma.differentiation.trim().slice(0, 300),
    ma.reasonsCustomersChooseUs && `\n\nCustomers choose ${cd_name(plan)} because: ${ma.reasonsCustomersChooseUs.slice(0, 200)}`,
  ]
    .filter(Boolean)
    .join("")
    .trim();

  return (
    <div>
      <TopicHeader
        phase="Executive Summary"
        phaseNumber={11}
        topicNumber={4}
        topicTitle="Market Opportunity"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          The Market Opportunity section tells investors and lenders how big the prize is and why this business is positioned to win a share of it. It draws directly from your Market Analysis — the market size, growth, target customer, and competitive differentiation you researched.
        </p>
        <p className="text-navy-700">
          Be specific and evidence-based. "There's a big market" is useless. "$3.4B addressable market, growing 12% annually, driven by X trend, with fragmented competition and no dominant digital-first player" is compelling.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        <AutoField
          label="Market Opportunity"
          autoValue={autoMarket}
          overrideKey="overrideMarket"
          fieldKey="marketOpportunity"
          es={es}
          update={update}
          placeholder="Describe the market: industry, size, growth rate, and primary target customer. Reference your market research figures. 3–5 sentences."
          rows={5}
          helpText="Pulled from Market Analysis — industry, market size, growth, and primary customer sections."
          required
        />

        <AutoField
          label="Competitive Advantage / Differentiation"
          autoValue={autoAdvantage}
          overrideKey="overrideSolution"
          fieldKey="competitiveAdvantage"
          es={es}
          update={update}
          placeholder="What makes this business meaningfully different from competitors? Why will customers choose you over existing alternatives? 2–3 sentences focused on your core differentiator."
          rows={4}
          helpText="Pulled from Market Analysis — positioning and differentiation sections."
          required
        />

        {/* Market data source panel */}
        {(ma.industry || ma.marketValue || ma.primaryCustomer) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-blue-700 text-xs font-bold uppercase tracking-wide mb-3">
              Market Data from your Research
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Industry", val: ma.industry },
                { label: "Market Size", val: ma.marketValue ? `${ma.marketCurrency || "$"}${ma.marketValue}` : null },
                { label: "Growth Rate", val: ma.growthRate ? `${ma.growthRate} (${ma.growthDirection})` : null },
                { label: "Primary Customer", val: ma.primaryCustomer?.slice(0, 60) },
                { label: "Competitors", val: [...(ma.directCompetitors || [])].length > 0 ? `${(ma.directCompetitors || []).length} identified` : null },
                { label: "Positioning", val: ma.positioning?.slice(0, 60) },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-blue-400 w-28 shrink-0 text-xs">{label}</span>
                  <span className={`text-xs font-medium ${val ? "text-navy-800" : "text-muted-foreground italic"}`}>
                    {val || "Not completed yet"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 05 — Financial Highlights ────────────────────────────────────────────────
function ESFinancials({ es, update, status, markComplete, onNext, onPrev, plan }: any) {
  const year1Revenue = calcYear1Revenue(plan);
  const breakevenMonth = calcBreakevenMonth(plan);
  const startupCosts = plan.financialPlan?.startupCosts || [];
  const totalStartup = startupCosts.reduce((s: number, c: any) => s + (c.amount || 0), 0);

  const fr = (plan as any).fundingRequest || {};
  const fundingRequired = fr.requiresFunding;
  const fundingAmount = fr.totalFundingRequired || 0;

  const autoFinancials = [
    year1Revenue > 0
      ? `Projected Year 1 revenue: ${fmt(year1Revenue)}.`
      : null,
    breakevenMonth
      ? ` The business is projected to reach break-even at Month ${breakevenMonth}.`
      : null,
    totalStartup > 0
      ? ` Total startup costs are estimated at ${fmt(totalStartup)}.`
      : null,
  ]
    .filter(Boolean)
    .join("")
    .trim();

  const autoFunding = fundingRequired === true && fundingAmount > 0
    ? `${cd_name(plan)} is seeking ${fmt(fundingAmount)} in external funding.${
        fr.fundingPurposeSummary ? ` ${fr.fundingPurposeSummary.slice(0, 200)}` : ""
      }${
        (fr.fundingSources || []).length > 0
          ? ` Funding will be sourced via ${(fr.fundingSources as any[]).map((s: any) => s.type.replace(/_/g, " ")).join(", ")}.`
          : ""
      }`
    : fundingRequired === false
    ? "The business will be fully self-funded from personal capital and operating cash flow."
    : "";

  return (
    <div>
      <TopicHeader
        phase="Executive Summary"
        phaseNumber={11}
        topicNumber={5}
        topicTitle="Financial Highlights"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Financial highlights are the numbers that prove the business case. Not a full financial model — just the 3–5 figures that tell a credible story: how much revenue you expect, when you break even, what it costs to start, and (if applicable) how much funding you need.
        </p>
        <p className="text-navy-700">
          These figures are pulled from your Financial Plan and Funding Request phases. If they look wrong here, return to those phases to refine your numbers before finalising the Executive Summary.
        </p>
      </EducationPanel>

      {/* Auto-calculated highlights */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 text-center ${year1Revenue > 0 ? "bg-sage-50 border-sage-200" : "bg-muted border-border"}`}>
          <p className="text-sage-600 text-[10px] font-bold uppercase tracking-wide mb-1">Year 1 Revenue</p>
          <p className={`font-bold text-2xl ${year1Revenue > 0 ? "text-navy-900" : "text-muted-foreground"}`}>
            {year1Revenue > 0 ? fmt(year1Revenue) : "—"}
          </p>
          <p className="text-navy-400 text-[10px] mt-1">
            {year1Revenue > 0 ? "Projected (Financial Plan)" : "Complete Financial Plan"}
          </p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${breakevenMonth ? "bg-blue-50 border-blue-200" : "bg-muted border-border"}`}>
          <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wide mb-1">Break-Even</p>
          <p className={`font-bold text-2xl ${breakevenMonth ? "text-navy-900" : "text-muted-foreground"}`}>
            {breakevenMonth ? `Month ${breakevenMonth}` : "—"}
          </p>
          <p className="text-navy-400 text-[10px] mt-1">
            {breakevenMonth ? "Projected timeline" : "Complete Financial Plan"}
          </p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${totalStartup > 0 ? "bg-amber-50 border-amber-200" : "bg-muted border-border"}`}>
          <p className="text-amber-600 text-[10px] font-bold uppercase tracking-wide mb-1">Startup Costs</p>
          <p className={`font-bold text-2xl ${totalStartup > 0 ? "text-navy-900" : "text-muted-foreground"}`}>
            {totalStartup > 0 ? fmt(totalStartup) : "—"}
          </p>
          <p className="text-navy-400 text-[10px] mt-1">
            {totalStartup > 0 ? `${startupCosts.length} cost items` : "Complete Financial Plan"}
          </p>
        </div>
      </div>

      {fundingRequired === true && fundingAmount > 0 && (
        <div className="mt-4 bg-navy-900 rounded-xl p-4 text-center">
          <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wide mb-1">Funding Requested</p>
          <p className="font-bold text-white text-2xl">{fmt(fundingAmount)}</p>
          <p className="text-white/50 text-[10px] mt-1">From Funding Request phase</p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        <AutoField
          label="Financial Highlights"
          autoValue={autoFinancials}
          overrideKey="overrideFinancials"
          fieldKey="financialHighlights"
          es={es}
          update={update}
          placeholder={
            "Key financial figures for the Executive Summary:\n" +
            "• Year 1 revenue projection\n" +
            "• Projected break-even month\n" +
            "• Total startup cost\n" +
            "• Gross margin / profit target (optional)\n" +
            "• Year 2 or Year 3 revenue target (if projecting forward)"
          }
          rows={5}
          helpText="Auto-calculated from your Financial Plan. Customise if you want to add commentary or adjustments."
          required
        />

        {(fundingRequired !== null && fundingRequired !== undefined) && (
          <AutoField
            label="Funding Requirement"
            autoValue={autoFunding}
            overrideKey="overrideFunding"
            fieldKey="fundingHighlight"
            es={es}
            update={update}
            placeholder={
              fundingRequired
                ? "How much funding is required? From what sources? What will it be used for? What does the investor/lender receive in return?"
                : "Describe how the business will be capitalised from personal/self-funding sources."
            }
            rows={4}
            helpText="Pulled from Funding Request phase."
          />
        )}

        <div>
          <label className="input-label">Call to Action (optional)</label>
          <p className="text-xs text-muted-foreground mb-2">
            End the Executive Summary with what you are asking for or inviting the reader to do next.
          </p>
          <textarea
            value={es.callToAction || ""}
            onChange={(e) => update({ callToAction: e.target.value })}
            placeholder={`Example: "We welcome the opportunity to discuss this plan with potential investors or lenders. A full financial model, supporting market research, and team CVs are available on request." — or simply a statement of intent: "The full business plan follows."`}
            rows={3}
            className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none leading-relaxed"
          />
        </div>
      </div>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 06 — Final Review ────────────────────────────────────────────────────────
function ESReview({ es, update, status, markComplete, onNext, onPrev, onNavigate, plan }: any) {
  // ES completeness
  const esFields = [
    { key: "businessOverview", label: "Business Overview", topicId: "es_overview", source: "Company Description" },
    { key: "teamSummary", label: "Team Summary", topicId: "es_overview", source: "Organization" },
    { key: "problemStatement", label: "Problem Statement", topicId: "es_opportunity", source: "Company Description" },
    { key: "solutionSummary", label: "Solution", topicId: "es_opportunity", source: "Products & Services" },
    { key: "opportunityStatement", label: "Opportunity Statement", topicId: "es_opportunity", source: "Manual" },
    { key: "marketOpportunity", label: "Market Opportunity", topicId: "es_market", source: "Market Analysis" },
    { key: "competitiveAdvantage", label: "Competitive Advantage", topicId: "es_market", source: "Market Analysis" },
    { key: "financialHighlights", label: "Financial Highlights", topicId: "es_financials", source: "Financial Plan" },
  ];

  const completedFields = esFields.filter((f) => {
    const override = (es as any)[`override${f.key.charAt(0).toUpperCase() + f.key.slice(1)}`];
    const autoVal = getAutoValue(f.key, plan);
    return override ? (es as any)[f.key]?.trim()?.length > 10 : autoVal.trim().length > 10;
  });

  const pct = Math.round((completedFields.length / esFields.length) * 100);

  // Cross-phase consistency checks
  const cd = plan.companyDescription || {};
  const ma = plan.marketAnalysis || {};
  const year1Revenue = calcYear1Revenue(plan);
  const fr = (plan as any).fundingRequest || {};

  const consistencyChecks = [
    {
      label: "Business name consistent",
      pass: !cd.businessName || (
        (es.businessOverview || "").includes(cd.businessName) ||
        (es.overrideOverview ? false : true) // auto draft always includes name
      ),
      fix: "Ensure your business name appears in the Business Overview.",
    },
    {
      label: "Market opportunity quantified",
      pass: !!(ma.marketValue || (es.marketOpportunity || "").match(/\$|billion|million|%/i)),
      fix: "Add market size figures — 'a large market' is not compelling. Return to Market Analysis to add figures.",
    },
    {
      label: "Financial highlights present",
      pass: year1Revenue > 0 || (es.financialHighlights || "").length > 20,
      fix: "Complete the Financial Plan phase to generate auto-calculated revenue figures.",
    },
    {
      label: "Funding section addressed",
      pass: fr.requiresFunding !== undefined && fr.requiresFunding !== null,
      fix: "Complete the Funding Request phase to document whether external funding is needed.",
    },
    {
      label: "All 10 prior phases have some data",
      pass: [
        cd.businessName,
        ma.industry,
        (plan as any).organization?.founders?.length > 0,
        (plan as any).productsServices?.offerings?.length > 0,
        (plan as any).marketingSales?.primaryObjectives,
        (plan as any).operations?.businessModelType,
        plan.financialPlan?.salesAssumptions?.length > 0,
        fr.requiresFunding !== undefined,
        (plan as any).risks?.length > 0,
        (plan as any).milestones?.length > 0,
      ].filter(Boolean).length >= 8,
      fix: "At least 8 of the 10 prior phases should have core data before finalising the Executive Summary.",
    },
  ];

  const passedChecks = consistencyChecks.filter((c) => c.pass).length;
  const isReadyForDocument = pct >= 80 && passedChecks >= 4;

  return (
    <div>
      <TopicHeader
        phase="Executive Summary"
        phaseNumber={11}
        topicNumber={6}
        topicTitle="Final Review"
        estimatedMinutes={10}
        status={status}
      />

      {/* ES completeness */}
      <div className="mb-6 bg-white border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Executive Summary Completeness</h2>
          <span className={`text-lg font-bold ${pct === 100 ? "text-sage-600" : pct >= 80 ? "text-blue-600" : "text-amber-500"}`}>
            {pct}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-sage-500" : pct >= 80 ? "bg-blue-500" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-2">
          {esFields.map((f) => {
            const override = (es as any)[`override${f.key.charAt(0).toUpperCase() + f.key.slice(1)}`];
            const autoVal = getAutoValue(f.key, plan);
            const hasValue = override
              ? (es as any)[f.key]?.trim()?.length > 10
              : autoVal.trim().length > 10;

            return (
              <div key={f.key} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${hasValue ? "bg-sage-500" : "bg-amber-400"}`} />
                <div className="flex-1">
                  <span className="text-sm text-navy-800 font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">({f.source})</span>
                </div>
                {!hasValue && (
                  <button
                    onClick={() => onNavigate("executive_summary", f.topicId)}
                    className="text-xs text-amber-600 font-semibold hover:underline shrink-0"
                  >
                    Complete →
                  </button>
                )}
                {hasValue && (
                  <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${override ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-sage-50 text-sage-700 border border-sage-200"}`}>
                    {override ? "Custom" : "Auto"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-phase consistency checks */}
      <div className="mb-6 bg-navy-50 border border-navy-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-navy-900 text-sm">Cross-Phase Consistency Checks</h3>
          <span className={`text-sm font-semibold ${passedChecks >= 4 ? "text-sage-600" : "text-amber-500"}`}>
            {passedChecks}/{consistencyChecks.length} passed
          </span>
        </div>
        <div className="space-y-2">
          {consistencyChecks.map((check) => (
            <div key={check.label} className={`flex items-start gap-3 p-3 rounded-lg border ${check.pass ? "bg-sage-50 border-sage-200" : "bg-amber-50 border-amber-200"}`}>
              <span className={`text-sm shrink-0 mt-0.5 ${check.pass ? "text-sage-600" : "text-amber-500"}`}>
                {check.pass ? "✓" : "⚠"}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${check.pass ? "text-sage-700" : "text-amber-700"}`}>
                  {check.label}
                </p>
                {!check.pass && (
                  <p className="text-amber-600 text-xs mt-0.5">{check.fix}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full plan completeness across all phases */}
      <div className="mb-6 bg-white border border-border rounded-xl p-5">
        <h3 className="font-semibold text-navy-900 text-sm mb-4">Complete Business Plan — Phase Status</h3>
        <div className="space-y-2">
          {PHASES.filter((p) => p.number >= 1 && p.number <= 11).map((phase) => {
            const phaseTopics = phase.topics;
            const completedCount = phaseTopics.filter(
              (t) => plan.topicStatus?.[t.id] === "completed"
            ).length;
            const phasePct = Math.round((completedCount / phaseTopics.length) * 100);

            return (
              <div key={phase.id} className="flex items-center gap-3">
                <span className="text-navy-500 text-xs w-28 shrink-0 truncate">{phase.shortTitle}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${phasePct === 100 ? "bg-sage-500" : phasePct >= 50 ? "bg-blue-400" : "bg-navy-300"}`}
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-8 text-right shrink-0 ${phasePct === 100 ? "text-sage-600" : "text-navy-500"}`}>
                  {phasePct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Readiness for document generation */}
      {isReadyForDocument ? (
        <div className="mb-6 p-5 bg-sage-50 border border-sage-300 rounded-xl">
          <p className="text-sage-700 font-bold text-base mb-2">🎉 Your business plan is ready.</p>
          <p className="text-sage-700 text-sm mb-4">
            All key sections of the Executive Summary are complete, and the core consistency checks have passed. Your plan is ready to be assembled into the final document.
          </p>
          <button
            onClick={() => window.location.href = `/plan/${plan.id}/document`}
            className="bg-sage-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-sage-700 transition-colors"
          >
            View / Download Document →
          </button>
        </div>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700 font-medium mb-2">Almost there — a few things to complete before the document is finalised:</p>
          <ul className="space-y-1 text-red-700 text-sm">
            {pct < 80 && (
              <li>• Executive Summary is {pct}% complete — fill in remaining sections above.</li>
            )}
            {passedChecks < 4 && (
              <li>• {5 - passedChecks} consistency check(s) still flagged — review and resolve.</li>
            )}
          </ul>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Appendix →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── Helper: get auto value for a field by key ────────────────────────────────
function cd_name(plan: BusinessPlan): string {
  return plan.companyDescription?.businessName || "The business";
}

function getAutoValue(fieldKey: string, plan: BusinessPlan): string {
  const cd = plan.companyDescription || {};
  const ma = plan.marketAnalysis || {};
  const org = (plan as any).organization || {};
  const ps = (plan as any).productsServices || {};
  const offerings = ps.offerings || [];
  const founders = org.founders || [];
  const fr = (plan as any).fundingRequest || {};
  const year1Revenue = calcYear1Revenue(plan);
  const breakevenMonth = calcBreakevenMonth(plan);
  const startupCosts = plan.financialPlan?.startupCosts || [];
  const totalStartup = startupCosts.reduce((s: number, c: any) => s + (c.amount || 0), 0);

  switch (fieldKey) {
    case "businessOverview":
      return [
        cd.businessName && `${cd.businessName} is ${cd.businessActivity || "a business"}.`,
        cd.businessStage && ` The business is currently at the ${cd.businessStage.replace("_", " ")} stage`,
        cd.businessLocation && `, based in ${cd.businessLocation}.`,
        cd.legalStructure && ` It operates as a ${cd.legalStructure.replace(/_/g, " ")}.`,
        cd.mission && `\n\nMission: ${cd.mission}`,
      ].filter(Boolean).join("").trim();

    case "teamSummary":
      return founders.length > 0
        ? `The business is led by ${founders.slice(0, 3).map((f: any) => `${f.name}${f.role ? ` (${f.role})` : ""}`).join(", ")}.${org.employeeCount ? ` The current team comprises ${org.employeeCount} people.` : ""}`
        : "";

    case "problemStatement":
      return [
        cd.problemOrNeed && cd.problemOrNeed.trim(),
        cd.existingAlternatives && `Existing alternatives fail to adequately address this need.`,
      ].filter(Boolean).join(" ");

    case "solutionSummary":
      return [
        offerings.length > 0 ? `${cd.businessName || "The business"} addresses this through ${offerings.slice(0, 3).map((o: any) => o.name || "its offering").join(", ")}.` : null,
        ps.overallValueProp && ps.overallValueProp.trim(),
      ].filter(Boolean).join(" ");

    case "marketOpportunity":
      return [
        ma.industry && `${cd_name(plan)} operates in the ${ma.industry}${ma.industrySegment ? ` (${ma.industrySegment})` : ""} sector.`,
        ma.marketValue && `The total addressable market is estimated at ${ma.marketCurrency || "$"}${ma.marketValue}${ma.marketYear ? ` (${ma.marketYear})` : ""}`,
        ma.growthRate ? `, growing at approximately ${ma.growthRate}.` : ".",
        ma.primaryCustomer && `\n\nThe primary target customer is ${ma.primaryCustomer.slice(0, 150)}.`,
      ].filter(Boolean).join("").trim();

    case "competitiveAdvantage":
      return [
        ma.differentiation && ma.differentiation.trim().slice(0, 300),
        ma.reasonsCustomersChooseUs && `Customers choose ${cd_name(plan)} because: ${ma.reasonsCustomersChooseUs.slice(0, 200)}`,
      ].filter(Boolean).join("\n\n").trim();

    case "financialHighlights":
      return [
        year1Revenue > 0 ? `Projected Year 1 revenue: ${fmt(year1Revenue)}.` : null,
        breakevenMonth ? ` The business is projected to reach break-even at Month ${breakevenMonth}.` : null,
        totalStartup > 0 ? ` Total startup costs are estimated at ${fmt(totalStartup)}.` : null,
      ].filter(Boolean).join("").trim();

    default:
      return "";
  }
}
