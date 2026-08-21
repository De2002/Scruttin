import React, { useState } from "react";
import { BusinessPlan } from "@/types/businessPlan";
import {
  TopicHeader,
  EducationPanel,
  TextAreaField,
  TextField,
  SelectField,
  TopicNav,
} from "@/components/features/walkthrough/TopicComponents";
import { PHASES } from "@/constants/phases";
import { generateId } from "@/lib/storage";
import { toast } from "sonner";

// ─── Phase constant ───────────────────────────────────────────────────────────
const PHASE = PHASES.find((p) => p.id === "funding")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Data types ───────────────────────────────────────────────────────────────
export interface UseOfFundsItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

export interface FundingSource {
  id: string;
  type: string;
  amount: number;
  provider?: string;
  interestRate?: string;
  term?: string;
  equityOffered?: string;
  repaymentTerms?: string;
  status?: string;
  notes?: string;
}

export interface FundingRequestData {
  requiresFunding?: boolean | null;
  noFundingReason?: string;
  totalFundingRequired?: number;
  fundingPurposeSummary?: string;
  useOfFunds?: UseOfFundsItem[];
  useOfFundsNotes?: string;
  fundingSources?: FundingSource[];
  fundingStrategyNotes?: string;
  repaymentPlan?: string;
  investorReturnsExpected?: string;
  exitStrategy?: string;
  pitchSummary?: string;
  pitchProblem?: string;
  pitchSolution?: string;
  pitchMarketSize?: string;
  pitchBusinessModel?: string;
  pitchTraction?: string;
  pitchAsk?: string;
  pitchUseOfFunds?: string;
  pitchWhyUs?: string;
}

// ─── Phase props ──────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n === 0) return "$0";
  if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return "$" + n.toFixed(0);
}

// ─── Phase root ───────────────────────────────────────────────────────────────
export default function FundingRequestPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const fr: FundingRequestData = (plan as any).fundingRequest || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<FundingRequestData>) => {
    onUpdatePlan({ fundingRequest: { ...fr, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next ? onNavigate("funding", nav.next.id) : onNavigate("risks", "risk_intro");
  const handlePrev = () =>
    nav.prev ? onNavigate("funding", nav.prev.id) : onNavigate("financial_plan", "fp_review");

  const sharedProps = {
    fr,
    update,
    status,
    markComplete,
    onNext: handleNext,
    onPrev: handlePrev,
    onNavigate,
    plan,
  };

  const renderTopic = () => {
    switch (currentTopic) {
      case "fund_intro":     return <FundIntro {...sharedProps} />;
      case "fund_amount":    return <FundAmount {...sharedProps} />;
      case "fund_use":       return <FundUse {...sharedProps} />;
      case "fund_type":      return <FundType {...sharedProps} />;
      case "fund_repayment": return <FundRepayment {...sharedProps} />;
      case "fund_review":    return <FundReview {...sharedProps} />;
      default:               return <FundIntro {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Phase header ─────────────────────────────────────────────────────────────
function FundPhaseHeader() {
  return (
    <div className="mb-8 p-5 rounded-xl bg-navy-900 text-white">
      <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Phase 8</p>
      <h2 className="font-serif text-2xl font-bold leading-tight mb-1">Funding Request</h2>
      <p className="text-white/65 text-sm">
        Determine whether you need external funding — and if so, how much, from where, and on what terms
      </p>
    </div>
  );
}

// ─── 01 — Funding Concepts ────────────────────────────────────────────────────
function FundIntro({ fr, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <FundPhaseHeader />
      <TopicHeader
        phase="Funding Request"
        phaseNumber={8}
        topicNumber={1}
        topicTitle="Funding Concepts"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Not every business plan needs a funding request. This phase is only required if you intend to seek capital from external sources — a bank, an investor, a grant body, or a crowdfunding campaign.
        </p>
        <p className="text-navy-700">
          If your business will be funded entirely from personal savings or existing cash flow, this section is shorter but still worth completing: it documents your financial strategy and shows you have thought through how the business will be capitalised.
        </p>
      </EducationPanel>

      {/* When funding is needed */}
      <div className="mt-8 space-y-5">
        <h3 className="font-semibold text-navy-900 text-base">When do businesses need external funding?</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Startup costs exceed personal capital",
              desc: "Equipment, fit-out, initial inventory, deposits, and pre-revenue operating costs collectively exceed what you can self-fund.",
            },
            {
              title: "Working capital gap",
              desc: "Revenue won't cover operating expenses for the first 3–12 months. You need a runway funded externally.",
            },
            {
              title: "Growth requires upfront investment",
              desc: "Scaling requires hiring, equipment, or infrastructure before revenue catches up. External capital bridges the gap.",
            },
            {
              title: "Faster market capture",
              desc: "With more capital, you can grow faster than organic growth allows — important when timing or market share matters.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-border rounded-xl p-4">
              <p className="font-semibold text-navy-900 text-sm mb-1">{item.title}</p>
              <p className="text-navy-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* When you don't need funding */}
        <div className="bg-sage-50 border border-sage-100 rounded-xl p-5">
          <p className="text-sage-700 font-semibold text-sm mb-3">When you might NOT need external funding</p>
          <ul className="space-y-2 text-sage-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-sage-500 font-bold shrink-0">✓</span>
              <span>Startup costs are low and covered by personal savings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage-500 font-bold shrink-0">✓</span>
              <span>Revenue is expected from month one with no upfront capital required</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage-500 font-bold shrink-0">✓</span>
              <span>The business generates cash before bills are due (positive cash conversion cycle)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sage-500 font-bold shrink-0">✓</span>
              <span>You prefer slower, fully-owned growth over faster, diluted growth</span>
            </li>
          </ul>
        </div>

        {/* Types of funding overview */}
        <h3 className="font-semibold text-navy-900 text-base">The main types of business funding</h3>
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-900 text-white">
                <th className="text-left px-4 py-3 text-xs font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold hidden sm:table-cell">What you give up</th>
                <th className="text-left px-4 py-3 text-xs font-semibold hidden sm:table-cell">Best for</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  type: "Bank Loan",
                  gives: "Interest payments, collateral",
                  best: "Established businesses, asset-backed borrowing",
                },
                {
                  type: "Investor Equity",
                  gives: "Ownership stake (equity dilution)",
                  best: "High-growth startups seeking scale capital",
                },
                {
                  type: "Government Grant",
                  gives: "Time + compliance obligations",
                  best: "R&D, innovation, regional, or social enterprises",
                },
                {
                  type: "Personal Savings",
                  gives: "Nothing (no external obligation)",
                  best: "Low-cost startups, full control preferred",
                },
                {
                  type: "Friends & Family",
                  gives: "Relationship risk + potential equity/debt",
                  best: "Pre-revenue stage, small amounts",
                },
                {
                  type: "Crowdfunding",
                  gives: "Time, rewards, or equity (depending on type)",
                  best: "Consumer-facing products, community-driven businesses",
                },
              ].map((row, i) => (
                <tr key={row.type} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                  <td className="px-4 py-3 font-semibold text-navy-800">{row.type}</td>
                  <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">{row.gives}</td>
                  <td className="px-4 py-3 text-navy-600 hidden sm:table-cell">{row.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <EducationPanel variant="tip">
          <p className="text-sage-700">
            The most important number in a funding request is not how much you want — it's how much you <em>need</em> and why. A request backed by a detailed use-of-funds table and conservative financial projections is far more persuasive than a round number without justification.
          </p>
        </EducationPanel>
      </div>

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

// ─── 02 — Amount Required ─────────────────────────────────────────────────────
function FundAmount({ fr, update, status, markComplete, onNext, onPrev, plan }: any) {
  // Pull total startup costs from Financial Plan as a reference
  const startupCosts = (plan as any)?.financialPlan?.startupCosts || [];
  const totalStartupCosts = startupCosts.reduce(
    (s: number, c: any) => s + (c.amount || 0),
    0
  );

  // Pull lowest cash balance from Financial Plan as a reference for working capital
  const cashFlowNegative =
    (plan as any)?.financialPlan?.salesAssumptions?.length > 0 ? true : false;

  return (
    <div>
      <TopicHeader
        phase="Funding Request"
        phaseNumber={8}
        topicNumber={2}
        topicTitle="Amount Required"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Before you decide whether you need funding, review your Financial Plan. Your startup costs (one-time and ongoing setup costs) represent the minimum external capital requirement. Your cash flow projection tells you how long the business runs negative before it covers its own costs.
        </p>
        <p className="text-navy-700">
          The total funding required is not just startup costs — it's startup costs plus the working capital needed to cover operating expenses until the business reaches break-even.
        </p>
      </EducationPanel>

      {/* Reference panel from FP */}
      {totalStartupCosts > 0 && (
        <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-3">
            From your Financial Plan
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-blue-600 text-[11px] mb-1">Total Startup Costs</p>
              <p className="font-bold text-navy-900 text-xl">{fmt(totalStartupCosts)}</p>
              <p className="text-blue-500 text-xs mt-1">{startupCosts.length} cost item(s)</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-blue-600 text-[11px] mb-1">Funding Source (from FP)</p>
              <p className="text-navy-700 text-sm font-medium">
                {(plan as any)?.financialPlan?.startupFundingSource
                  ? (plan as any).financialPlan.startupFundingSource.slice(0, 100) + "…"
                  : "Not documented in Financial Plan"}
              </p>
            </div>
          </div>
          <p className="text-blue-600 text-xs mt-3">
            Use these figures to inform your funding decision below. The total required must cover startup costs + working capital buffer.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-6">
        {/* Funding decision */}
        <div>
          <label className="input-label mb-3 block">
            Does this business require external funding?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                val: true,
                label: "Yes",
                desc: "External capital required from bank, investor, grant, or other source",
              },
              {
                val: false,
                label: "No",
                desc: "Fully self-funded from personal savings or business cash flow",
              },
              {
                val: null,
                label: "Undecided",
                desc: "Still evaluating funding options",
              },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                onClick={() => update({ requiresFunding: opt.val })}
                className={`p-4 rounded-xl border text-center transition-all ${
                  fr.requiresFunding === opt.val
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <p className="font-bold text-navy-900 text-sm mb-1">{opt.label}</p>
                <p className="text-muted-foreground text-xs leading-snug">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* No funding */}
        {fr.requiresFunding === false && (
          <div className="p-5 bg-sage-50 border border-sage-200 rounded-xl space-y-4">
            <p className="text-sage-700 font-semibold text-sm">
              Self-funded — no external capital required
            </p>
            <TextAreaField
              label="How will the business be funded?"
              value={fr.noFundingReason || ""}
              onChange={(v) => update({ noFundingReason: v })}
              placeholder="Describe how the business will be capitalised. Personal savings — how much? Is there a phased investment plan? Will you use revenue from a current job to fund early operations? Be specific about amounts and sources."
              rows={5}
              required
              helpText="Even if no external funding is needed, documenting your self-funding plan demonstrates financial clarity."
            />
          </div>
        )}

        {/* Requires funding */}
        {fr.requiresFunding === true && (
          <>
            <div>
              <label className="input-label">Total Funding Required ($)</label>
              <p className="text-xs text-muted-foreground mb-2">
                This should cover startup costs + working capital reserve. Pull from your Financial Plan cash flow.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={fr.totalFundingRequired || ""}
                  onChange={(e) => update({ totalFundingRequired: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full border border-input bg-white pl-8 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 transition-all"
                />
              </div>
              {totalStartupCosts > 0 && fr.totalFundingRequired > 0 && (
                <p className="text-xs mt-2">
                  {fr.totalFundingRequired >= totalStartupCosts ? (
                    <span className="text-sage-600">
                      ✓ Covers startup costs of {fmt(totalStartupCosts)} with {fmt(fr.totalFundingRequired - totalStartupCosts)} working capital buffer
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      ⚠ Below startup costs of {fmt(totalStartupCosts)} — ensure this is intentional (some costs may be self-funded)
                    </span>
                  )}
                </p>
              )}
            </div>

            <TextAreaField
              label="Funding Purpose Summary"
              value={fr.fundingPurposeSummary || ""}
              onChange={(v) => update({ fundingPurposeSummary: v })}
              placeholder="In 2–4 sentences, explain what the funding will be used for at a high level. This becomes your funding narrative. Example: 'The requested $75,000 will fund initial equipment, premises fit-out, and a 6-month operating reserve while the business builds its customer base to break-even revenue.'"
              rows={4}
              required
              helpText="This narrative will appear at the top of the Funding Request section in your final document."
            />
          </>
        )}

        {fr.requiresFunding === null && (
          <TextAreaField
            label="Notes on Funding Decision"
            value={fr.noFundingReason || ""}
            onChange={(v) => update({ noFundingReason: v })}
            placeholder="Describe where you are in the funding decision process. What options are you evaluating? What additional information would help you decide?"
            rows={4}
          />
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

// ─── 03 — Use of Funds ────────────────────────────────────────────────────────
const USE_OF_FUNDS_CATEGORIES = [
  "Equipment & Machinery",
  "Vehicles",
  "Website & Technology",
  "Software & Subscriptions",
  "Fit-out & Premises",
  "Legal & Professional Fees",
  "Licences & Permits",
  "Initial Inventory / Stock",
  "Marketing & Branding (Launch)",
  "Insurance (Initial)",
  "Training & Certifications",
  "Working Capital Reserve",
  "Deposits & Bonds",
  "Research & Development",
  "Payroll (Pre-Revenue Period)",
  "Loan Repayment",
  "Other",
];

function FundUse({ fr, update, status, markComplete, onNext, onPrev, plan }: any) {
  const items: UseOfFundsItem[] = fr.useOfFunds || [];

  // Auto-import from startup costs
  const startupCosts = (plan as any)?.financialPlan?.startupCosts || [];
  const importedIds = new Set(items.map((i: UseOfFundsItem) => i.id));

  const importFromStartupCosts = () => {
    if (startupCosts.length === 0) return;
    const newItems = startupCosts
      .filter((sc: any) => !items.find((i: UseOfFundsItem) => i.notes === `sc:${sc.id}`))
      .map((sc: any) => ({
        id: generateId(),
        category: sc.category || "Other",
        description: sc.item || "Startup cost",
        amount: sc.amount || 0,
        notes: `sc:${sc.id}`,
      }));
    update({ useOfFunds: [...items, ...newItems] });
    toast.success(`${newItems.length} item(s) imported from Startup Costs.`);
  };

  const addItem = () =>
    update({
      useOfFunds: [
        ...items,
        { id: generateId(), category: "", description: "", amount: 0, notes: "" },
      ],
    });

  const updItem = (id: string, changes: Partial<UseOfFundsItem>) =>
    update({ useOfFunds: items.map((i: UseOfFundsItem) => (i.id === id ? { ...i, ...changes } : i)) });

  const removeItem = (id: string) =>
    update({ useOfFunds: items.filter((i: UseOfFundsItem) => i.id !== id) });

  const total = items.reduce((s: number, i: UseOfFundsItem) => s + (i.amount || 0), 0);
  const totalRequired = fr.totalFundingRequired || 0;
  const difference = totalRequired - total;

  // Group by category for donut-style breakdown
  const byCategory: Record<string, number> = {};
  items.forEach((i: UseOfFundsItem) => {
    const cat = i.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (i.amount || 0);
  });
  const topCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div>
      <TopicHeader
        phase="Funding Request"
        phaseNumber={8}
        topicNumber={3}
        topicTitle="Use of Funds"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why a use-of-funds table matters</h3>
        <p className="text-navy-700 mb-3">
          A use-of-funds table is the single most important element of any funding request. It demonstrates that you have thought carefully about exactly what the money will be spent on — line by line — rather than asking for a round number and spending it as you go.
        </p>
        <p className="text-navy-700">
          Every dollar you request should be accounted for in this table. If the total here doesn't match your funding request amount, you need to explain the difference. Lenders and investors look at this carefully.
        </p>
      </EducationPanel>

      {/* Import from startup costs */}
      {startupCosts.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 text-sm font-semibold">
                {startupCosts.length} startup cost item(s) in your Financial Plan
              </p>
              <p className="text-blue-600 text-xs mt-0.5">
                Import them here to pre-populate your use-of-funds table.
              </p>
            </div>
            <button
              onClick={importFromStartupCosts}
              className="bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shrink-0 ml-4"
            >
              Import All
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Use of Funds Table</h3>
          <button
            onClick={addItem}
            className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Line
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No use-of-funds items yet.</p>
            <p className="text-muted-foreground text-xs">
              Import from Startup Costs above, or add items manually.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Amount ($)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right hidden sm:table-cell">%</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: UseOfFundsItem, i: number) => {
                    const pct = total > 0 ? ((item.amount / total) * 100).toFixed(0) : "—";
                    return (
                      <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                        <td className="px-4 py-2">
                          <select
                            value={item.category}
                            onChange={(e) => updItem(item.id, { category: e.target.value })}
                            className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                          >
                            <option value="">Select…</option>
                            {USE_OF_FUNDS_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={item.description}
                            onChange={(e) => updItem(item.id, { description: e.target.value })}
                            placeholder="Describe the specific spend"
                            className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.amount || ""}
                            onChange={(e) => updItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-right focus:outline-none focus:ring-1 focus:ring-navy-700"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-navy-500 text-xs hidden sm:table-cell">
                          {pct}{pct !== "—" ? "%" : ""}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-200 bg-navy-50">
                    <td className="px-4 py-3 text-xs font-bold text-navy-700" colSpan={2}>
                      Total Use of Funds
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">{fmt(total)}</td>
                    <td className="px-4 py-3 text-right font-bold text-navy-500 text-xs hidden sm:table-cell">100%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Reconciliation */}
        {totalRequired > 0 && total > 0 && (
          <div className={`mt-4 p-4 rounded-xl border flex items-center gap-4 ${
            Math.abs(difference) < 100
              ? "bg-sage-50 border-sage-200"
              : difference > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                Math.abs(difference) < 100 ? "text-sage-700" : difference > 0 ? "text-amber-700" : "text-red-700"
              }`}>
                {Math.abs(difference) < 100
                  ? "✓ Use of funds matches funding request"
                  : difference > 0
                  ? `⚠ ${fmt(difference)} unallocated — add more use-of-funds items`
                  : `⚠ Over-allocated by ${fmt(Math.abs(difference))} — reduce items or increase funding amount`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Funding Request</p>
              <p className="font-bold text-navy-900">{fmt(totalRequired)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Allocated</p>
              <p className="font-bold text-navy-900">{fmt(total)}</p>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {topCategories.length > 0 && total > 0 && (
          <div className="mt-5 bg-navy-50 border border-navy-200 rounded-xl p-4">
            <p className="text-navy-600 text-xs font-bold uppercase tracking-wide mb-3">
              Top Allocation Categories
            </p>
            <div className="space-y-2">
              {topCategories.map(([cat, amt]) => {
                const pct = (amt / total) * 100;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-navy-600 text-xs w-36 shrink-0 truncate">{cat}</span>
                    <div className="flex-1 bg-white rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-navy-700"
                        style={{ width: `${pct.toFixed(0)}%` }}
                      />
                    </div>
                    <span className="text-navy-700 text-xs font-semibold w-14 text-right shrink-0">
                      {fmt(amt)}
                    </span>
                    <span className="text-navy-400 text-xs w-8 text-right shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5">
          <TextAreaField
            label="Use of Funds Notes"
            value={fr.useOfFundsNotes || ""}
            onChange={(v) => update({ useOfFundsNotes: v })}
            placeholder="Any additional context on how funds will be spent — phased spending plan, contingency allocation, or items that may vary."
            rows={3}
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

// ─── 04 — Funding Type ────────────────────────────────────────────────────────
const FUNDING_TYPES = [
  {
    value: "bank_loan",
    label: "Bank / Business Loan",
    icon: "🏦",
    description: "Debt financing from a bank or credit institution. You repay principal + interest on a set schedule.",
    keyConsiderations: [
      "Collateral or personal guarantee may be required",
      "Interest rate typically 5–15% depending on risk profile",
      "Loan term typically 2–7 years for business loans",
      "Serviceability assessed on cash flow and assets",
    ],
    requirement: "Requires credible cash flow projections, business plan, and often existing trading history.",
  },
  {
    value: "investor_equity",
    label: "Investor Equity",
    icon: "📈",
    description: "An investor provides capital in exchange for an ownership stake (equity) in your business.",
    keyConsiderations: [
      "You give up a % of ownership — dilution is permanent",
      "Investors expect returns via exit (sale, IPO) or dividends",
      "Can be angels, VCs, or strategic corporate investors",
      "Often brings mentorship, networks, and expertise",
    ],
    requirement: "Requires high growth potential. Investors need a clear exit path and compelling pitch.",
  },
  {
    value: "grant",
    label: "Government Grant",
    icon: "🏛️",
    description: "Non-repayable funding from government bodies, typically for specific industries or purposes.",
    keyConsiderations: [
      "Not repaid — but comes with reporting and compliance obligations",
      "Competitive application process, often slow to process",
      "Usually tied to specific activities (R&D, innovation, employment)",
      "May require matched funding from your own capital",
    ],
    requirement: "Eligibility criteria vary by programme. Research available grants in your industry and jurisdiction.",
  },
  {
    value: "personal_savings",
    label: "Personal Savings / Capital",
    icon: "💰",
    description: "You invest your own money into the business. No external obligation or dilution.",
    keyConsiderations: [
      "No interest, no dilution, no reporting",
      "Risk is personal — if business fails, savings are lost",
      "Shows commitment to lenders and investors (skin in the game)",
      "Often combined with other funding sources",
    ],
    requirement: "No formal requirements. Ensure you maintain a personal financial safety net.",
  },
  {
    value: "friends_family",
    label: "Friends & Family",
    icon: "🤝",
    description: "Informal loans or equity from people you know. Common at the very earliest stages.",
    keyConsiderations: [
      "Relationship risk is significant — failed business can damage relationships",
      "Terms must be documented formally to avoid disputes",
      "Can be structured as a loan (repayable) or equity (ownership)",
      "Small amounts — rarely enough to fund significant capital requirements",
    ],
    requirement: "Always formalise with a written agreement. Verbal arrangements cause problems.",
  },
  {
    value: "crowdfunding",
    label: "Crowdfunding",
    icon: "🌐",
    description: "Raising small amounts from many people via online platforms (Kickstarter, Indiegogo, equity crowdfunding).",
    keyConsiderations: [
      "Reward-based: backers receive product or rewards, not equity",
      "Equity-based: backers become shareholders — regulatory requirements apply",
      "Campaign success requires an audience and marketing effort",
      "Platform fees typically 5–8% of funds raised",
    ],
    requirement: "Works best for consumer-facing products with an existing community or strong visual story.",
  },
];

function FundType({ fr, update, status, markComplete, onNext, onPrev }: any) {
  const sources: FundingSource[] = fr.fundingSources || [];

  const addSource = (typeValue: string) => {
    if (sources.find((s) => s.type === typeValue)) return;
    update({
      fundingSources: [
        ...sources,
        {
          id: generateId(),
          type: typeValue,
          amount: 0,
          provider: "",
          interestRate: "",
          term: "",
          equityOffered: "",
          repaymentTerms: "",
          status: "planned",
          notes: "",
        },
      ],
    });
  };

  const updSource = (id: string, changes: Partial<FundingSource>) =>
    update({
      fundingSources: sources.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    });

  const removeSource = (id: string) =>
    update({ fundingSources: sources.filter((s) => s.id !== id) });

  const totalSources = sources.reduce((s, src) => s + (src.amount || 0), 0);
  const totalRequired = fr.totalFundingRequired || 0;

  return (
    <div>
      <TopicHeader
        phase="Funding Request"
        phaseNumber={8}
        topicNumber={4}
        topicTitle="Funding Type"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Select the type(s) of funding you are seeking — many businesses use a combination. For each funding source you activate, document the provider, amount sought, and relevant terms. This becomes part of your funding proposal.
        </p>
        <p className="text-navy-700">
          Your funding mix should be deliberate. Different types of funding come with very different obligations, costs, and implications for ownership and control.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        {/* Funding type cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {FUNDING_TYPES.map((ft) => {
            const isActive = sources.some((s) => s.type === ft.value);
            return (
              <button
                key={ft.value}
                onClick={() => isActive ? removeSource(sources.find((s) => s.type === ft.value)!.id) : addSource(ft.value)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  isActive
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{ft.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 text-sm">{ft.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-snug">{ft.description}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    isActive ? "border-navy-700 bg-navy-700" : "border-muted-foreground"
                  }`}
                >
                  {isActive && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Source detail editors */}
        {sources.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-navy-900 text-sm mt-4">Funding Source Details</h3>
            {sources.map((source) => {
              const typeInfo = FUNDING_TYPES.find((ft) => ft.value === source.type);
              return (
                <FundingSourceCard
                  key={source.id}
                  source={source}
                  typeInfo={typeInfo}
                  onUpdate={(changes) => updSource(source.id, changes)}
                  onRemove={() => removeSource(source.id)}
                />
              );
            })}
          </div>
        )}

        {/* Funding mix summary */}
        {sources.length > 0 && totalSources > 0 && (
          <div className="p-4 bg-navy-50 border border-navy-200 rounded-xl">
            <p className="text-navy-600 text-xs font-bold uppercase tracking-wide mb-3">
              Funding Mix
            </p>
            {sources.map((s) => {
              const pct = totalSources > 0 ? (s.amount / totalSources) * 100 : 0;
              const label = FUNDING_TYPES.find((ft) => ft.value === s.type)?.label || s.type;
              return (
                <div key={s.id} className="flex items-center gap-3 mb-2">
                  <span className="text-navy-700 text-xs w-40 shrink-0 truncate">{label}</span>
                  <div className="flex-1 bg-white rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-navy-700"
                      style={{ width: `${pct.toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-navy-700 text-xs font-semibold w-16 text-right shrink-0">
                    {fmt(s.amount)}
                  </span>
                  <span className="text-navy-400 text-xs w-8 text-right shrink-0">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div className="flex justify-between border-t border-navy-200 pt-2 mt-2">
              <span className="text-navy-700 text-xs font-bold">Total from sources</span>
              <span className="font-bold text-navy-900 text-sm">{fmt(totalSources)}</span>
            </div>
            {totalRequired > 0 && Math.abs(totalRequired - totalSources) > 100 && (
              <p className={`text-xs mt-2 font-medium ${totalRequired > totalSources ? "text-amber-600" : "text-red-600"}`}>
                {totalRequired > totalSources
                  ? `⚠ ${fmt(totalRequired - totalSources)} still unaccounted for in sources`
                  : `⚠ Sources exceed required by ${fmt(totalSources - totalRequired)}`}
              </p>
            )}
          </div>
        )}

        <TextAreaField
          label="Funding Strategy Notes"
          value={fr.fundingStrategyNotes || ""}
          onChange={(v) => update({ fundingStrategyNotes: v })}
          placeholder="Describe your overall funding strategy. In what order will you seek these funds? What is the fallback if the primary source doesn't come through? Have you already had preliminary conversations with any lenders or investors?"
          rows={4}
        />
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

function FundingSourceCard({
  source,
  typeInfo,
  onUpdate,
  onRemove,
}: {
  source: FundingSource;
  typeInfo: (typeof FUNDING_TYPES)[0] | undefined;
  onUpdate: (changes: Partial<FundingSource>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-navy-50 transition-colors text-left"
      >
        <span className="text-xl shrink-0">{typeInfo?.icon || "💼"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm">{typeInfo?.label || source.type}</p>
          {source.amount > 0 && (
            <p className="text-muted-foreground text-xs">{fmt(source.amount)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`text-navy-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M2 4l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-6 pt-2 border-t border-border space-y-4">
          {/* Key considerations for this type */}
          {typeInfo && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <p className="text-amber-700 text-xs font-bold uppercase tracking-wide mb-2">
                Key Considerations
              </p>
              <ul className="space-y-1">
                {typeInfo.keyConsiderations.map((kc, i) => (
                  <li key={i} className="text-amber-700 text-xs flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span>{kc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Amount Sought ($)</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={source.amount || ""}
                  onChange={(e) => onUpdate({ amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full border border-input bg-white pl-8 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
                />
              </div>
            </div>
            <TextField
              label="Provider / Lender / Investor Name"
              value={source.provider || ""}
              onChange={(v) => onUpdate({ provider: v })}
              placeholder="e.g. Commonwealth Bank, Specific VC, or 'TBD'"
            />
          </div>

          <SelectField
            label="Status"
            value={source.status || ""}
            onChange={(v) => onUpdate({ status: v })}
            options={[
              { value: "planned", label: "Planned — not yet applied" },
              { value: "in_discussion", label: "In Discussion / Preliminary Conversations" },
              { value: "applied", label: "Applied / Submitted" },
              { value: "approved", label: "Approved / Confirmed" },
              { value: "received", label: "Received" },
            ]}
          />

          {/* Type-specific fields */}
          {source.type === "bank_loan" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                label="Interest Rate (estimated)"
                value={source.interestRate || ""}
                onChange={(v) => onUpdate({ interestRate: v })}
                placeholder="e.g. 7.5% p.a."
              />
              <TextField
                label="Loan Term"
                value={source.term || ""}
                onChange={(v) => onUpdate({ term: v })}
                placeholder="e.g. 5 years"
              />
            </div>
          )}

          {source.type === "investor_equity" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                label="Equity Offered (%)"
                value={source.equityOffered || ""}
                onChange={(v) => onUpdate({ equityOffered: v })}
                placeholder="e.g. 15%"
                helpText="% of business offered in exchange for investment"
              />
              <TextField
                label="Investor Type"
                value={source.provider || ""}
                onChange={(v) => onUpdate({ provider: v })}
                placeholder="e.g. Angel investor, VC, strategic partner"
              />
            </div>
          )}

          <TextAreaField
            label="Notes / Terms"
            value={source.notes || ""}
            onChange={(v) => onUpdate({ notes: v })}
            placeholder="Any additional terms, conditions, or notes about this funding source."
            rows={2}
          />

          <div className="pt-2 border-t border-border">
            <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Remove funding source
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 05 — Repayment / Returns ─────────────────────────────────────────────────
function FundRepayment({ fr, update, status, markComplete, onNext, onPrev }: any) {
  const sources: FundingSource[] = fr.fundingSources || [];
  const hasDebt = sources.some((s) => s.type === "bank_loan" || s.type === "friends_family");
  const hasEquity = sources.some((s) => s.type === "investor_equity");
  const hasGrant = sources.some((s) => s.type === "grant");

  return (
    <div>
      <TopicHeader
        phase="Funding Request"
        phaseNumber={8}
        topicNumber={5}
        topicTitle="Repayment & Returns"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Different funding, different obligations</h3>
        <p className="text-navy-700 mb-3">
          Every external funding source creates an obligation. For debt, it's repayment with interest. For equity, it's a return on investment — typically through dividends, profit share, or an eventual sale of the business. For grants, it's compliance and reporting.
        </p>
        <p className="text-navy-700">
          This section asks you to document what you are offering or committing to in exchange for each type of funding — and to demonstrate that your financial model can support these obligations.
        </p>
      </EducationPanel>

      {/* Debt repayment */}
      {hasDebt && (
        <div className="mt-8 space-y-5">
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="bg-navy-900 px-5 py-3">
              <p className="text-white font-semibold text-sm">Loan / Debt Repayment Plan</p>
            </div>
            <div className="p-5 space-y-4">
              <EducationPanel variant="example">
                <p className="text-navy-700 text-sm">
                  <strong>Example:</strong> "A $50,000 bank loan at 7.5% p.a. over 5 years results in monthly repayments of approximately $1,001. From Month 7 onwards, projected monthly revenue exceeds break-even, providing sufficient cash flow to service the loan while maintaining a 3-month operating reserve."
                </p>
              </EducationPanel>
              <TextAreaField
                label="Loan Repayment Plan"
                value={fr.repaymentPlan || ""}
                onChange={(v) => update({ repaymentPlan: v })}
                placeholder={
                  "Describe your loan repayment plan:\n" +
                  "• What are the loan terms (interest rate, term, monthly repayment)?\n" +
                  "• From which month can the business begin servicing debt?\n" +
                  "• How does this appear in your cash flow projection?\n" +
                  "• Is any collateral or personal guarantee offered?"
                }
                rows={6}
                required
                helpText="Lenders assess whether your projected cash flow can service the debt. Cross-reference your Financial Plan."
              />
            </div>
          </div>
        </div>
      )}

      {/* Equity returns */}
      {hasEquity && (
        <div className="mt-5 bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">Investor Returns & Exit Strategy</p>
          </div>
          <div className="p-5 space-y-4">
            <EducationPanel variant="tip">
              <p className="text-sage-700 text-sm">
                Equity investors invest for a return — typically through capital appreciation and an exit event (sale of the business, management buyout, or IPO). They need to understand your growth trajectory and how they will eventually realise their investment.
              </p>
            </EducationPanel>
            <TextAreaField
              label="Investor Returns Expectations"
              value={fr.investorReturnsExpected || ""}
              onChange={(v) => update({ investorReturnsExpected: v })}
              placeholder={
                "Describe the expected return for investors:\n" +
                "• What equity % are you offering for the investment amount?\n" +
                "• What is the implied valuation?\n" +
                "• What returns might an investor expect and over what timeframe?\n" +
                "• Are dividends expected, or is the return fully via exit?"
              }
              rows={5}
            />
            <TextAreaField
              label="Exit Strategy"
              value={fr.exitStrategy || ""}
              onChange={(v) => update({ exitStrategy: v })}
              placeholder={
                "How will investors ultimately exit their position?\n" +
                "Common exit strategies include: trade sale, management buyout, secondary sale to another investor, or IPO.\n\n" +
                "What is the target exit timeframe? What would trigger an exit?"
              }
              rows={4}
              helpText="Even if exit is years away, investors need to know you've thought about it."
            />
          </div>
        </div>
      )}

      {/* Grant compliance */}
      {hasGrant && (
        <div className="mt-5 bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">Grant Compliance & Reporting</p>
          </div>
          <div className="p-5">
            <p className="text-navy-700 text-sm mb-4">
              Government grants are non-repayable but come with compliance obligations — typically reporting on how funds were spent, activity milestones, and employment or economic outcomes. Describe your approach to managing these obligations.
            </p>
            <TextAreaField
              label="Grant Obligations & Compliance Plan"
              value={fr.repaymentPlan || ""}
              onChange={(v) => update({ repaymentPlan: v })}
              placeholder="Which grant(s) are you applying for? What are the key compliance requirements? How will you track and report on milestones?"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* No debt or equity */}
      {!hasDebt && !hasEquity && !hasGrant && (
        <div className="mt-8">
          <div className="bg-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              No debt, equity, or grant funding selected in Funding Type.
            </p>
            <p className="text-muted-foreground text-xs">
              If you are self-funding, this topic may not apply. Note any personal investment expectations below.
            </p>
          </div>
          <div className="mt-4">
            <TextAreaField
              label="Capital Investment Notes"
              value={fr.repaymentPlan || ""}
              onChange={(v) => update({ repaymentPlan: v })}
              placeholder="Describe how personal capital is being invested and any expectations around eventual extraction or return of capital."
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Investor pitch summary */}
      <div className="mt-8 bg-white border border-border rounded-xl overflow-hidden">
        <div className="bg-navy-900 px-5 py-3">
          <p className="text-white font-semibold text-sm">Investor / Lender Pitch Summary</p>
        </div>
        <div className="p-5 space-y-5">
          <EducationPanel>
            <p className="text-navy-700 mb-2">
              Whether you're pitching to an investor, presenting to a bank manager, or applying for a grant, you need a compelling one-page summary of your business case. This section structures the key elements of that pitch.
            </p>
            <p className="text-navy-700">
              Think of this as the narrative version of your funding request — the story behind the numbers.
            </p>
          </EducationPanel>

          <TextAreaField
            label="The Problem You Solve"
            value={fr.pitchProblem || ""}
            onChange={(v) => update({ pitchProblem: v })}
            placeholder="In 2–3 sentences: what is the problem, how significant is it, and who experiences it? Make it concrete."
            rows={3}
            helpText="Start with the problem. It frames everything else."
          />

          <TextAreaField
            label="Your Solution"
            value={fr.pitchSolution || ""}
            onChange={(v) => update({ pitchSolution: v })}
            placeholder="How does your business solve this problem? Why is your approach better than existing alternatives?"
            rows={3}
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <TextAreaField
              label="Market Opportunity"
              value={fr.pitchMarketSize || ""}
              onChange={(v) => update({ pitchMarketSize: v })}
              placeholder="How big is the market? Reference the market size and growth figures from your Market Analysis."
              rows={3}
              helpText="Quantify the opportunity."
            />
            <TextAreaField
              label="Business Model"
              value={fr.pitchBusinessModel || ""}
              onChange={(v) => update({ pitchBusinessModel: v })}
              placeholder="How does the business make money? Revenue model in 2–3 sentences."
              rows={3}
            />
          </div>

          <TextAreaField
            label="Traction / Proof Points"
            value={fr.pitchTraction || ""}
            onChange={(v) => update({ pitchTraction: v })}
            placeholder="What have you already demonstrated? Early customers, letters of intent, pilot results, waitlist, revenue, media coverage, grants won? Investors and lenders want evidence of momentum."
            rows={3}
            helpText="If pre-revenue: what evidence of demand do you have? (From your Market Analysis — demand evidence topic)"
          />

          <TextAreaField
            label="Why This Team"
            value={fr.pitchWhyUs || ""}
            onChange={(v) => update({ pitchWhyUs: v })}
            placeholder="Why are you and your team the right people to build this business? What experience, expertise, or unfair advantage do you bring?"
            rows={3}
            helpText="Investors often say they back the team as much as the idea."
          />

          <div className="grid sm:grid-cols-2 gap-5">
            <TextAreaField
              label="The Ask"
              value={fr.pitchAsk || ""}
              onChange={(v) => update({ pitchAsk: v })}
              placeholder="How much are you raising? In what form (debt, equity, grant)? What is the timeline?"
              rows={3}
            />
            <TextAreaField
              label="Use of Funds (Pitch Version)"
              value={fr.pitchUseOfFunds || ""}
              onChange={(v) => update({ pitchUseOfFunds: v })}
              placeholder="Top 3–4 uses of funds in plain language. e.g. '40% equipment, 30% working capital, 20% marketing, 10% legal/admin'"
              rows={3}
              helpText="Summarised version for pitch context — detail is in the Use of Funds table."
            />
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

// ─── 06 — Phase Review ────────────────────────────────────────────────────────
function FundReview({ fr, update, status, markComplete, onNext, onPrev, onNavigate }: any) {
  const sources: FundingSource[] = fr.fundingSources || [];
  const useOfFunds: UseOfFundsItem[] = fr.useOfFunds || [];
  const totalFunding = fr.totalFundingRequired || 0;
  const totalSources = sources.reduce((s, src) => s + (src.amount || 0), 0);
  const totalAllocated = useOfFunds.reduce((s, i) => s + (i.amount || 0), 0);

  const fields = [
    {
      label: "Funding Decision",
      value: fr.requiresFunding !== undefined && fr.requiresFunding !== null
        ? fr.requiresFunding
          ? "External funding required"
          : "Self-funded"
        : null,
      topicId: "fund_amount",
      summary:
        fr.requiresFunding === true
          ? `${fmt(totalFunding)} required`
          : fr.requiresFunding === false
          ? fr.noFundingReason?.slice(0, 80) + "…"
          : null,
    },
    {
      label: "Use of Funds",
      value: useOfFunds.length > 0 ? `${useOfFunds.length} item(s) documented` : null,
      topicId: "fund_use",
      summary: useOfFunds.length > 0 ? `${fmt(totalAllocated)} allocated` : null,
    },
    {
      label: "Funding Sources",
      value: sources.length > 0 ? `${sources.length} source(s) documented` : fr.requiresFunding === false ? "N/A — self-funded" : null,
      topicId: "fund_type",
      summary: sources.length > 0
        ? sources.map((s) => FUNDING_TYPES.find((ft) => ft.value === s.type)?.label || s.type).join(", ")
        : null,
    },
    {
      label: "Repayment / Returns / Pitch",
      value:
        fr.repaymentPlan ||
        fr.investorReturnsExpected ||
        fr.pitchProblem
          ? "Documented"
          : null,
      topicId: "fund_repayment",
      summary: fr.pitchProblem ? fr.pitchProblem.slice(0, 80) + "…" : fr.repaymentPlan ? fr.repaymentPlan.slice(0, 80) + "…" : null,
    },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  const hasReconciliationIssue =
    fr.requiresFunding === true &&
    totalFunding > 0 &&
    (Math.abs(totalFunding - totalAllocated) > 100 || Math.abs(totalFunding - totalSources) > 100);

  return (
    <div>
      <TopicHeader
        phase="Funding Request"
        phaseNumber={8}
        topicNumber={6}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Reconciliation warnings */}
      {hasReconciliationIssue && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 font-semibold text-sm mb-2">⚠ Funding figures need reconciliation</p>
          <div className="space-y-1.5">
            {Math.abs(totalFunding - totalAllocated) > 100 && (
              <p className="text-amber-700 text-sm">
                <strong>Use of Funds:</strong> {fmt(totalAllocated)} allocated vs {fmt(totalFunding)} requested
                — difference of {fmt(Math.abs(totalFunding - totalAllocated))}.
              </p>
            )}
            {sources.length > 0 && Math.abs(totalFunding - totalSources) > 100 && (
              <p className="text-amber-700 text-sm">
                <strong>Funding Sources:</strong> {fmt(totalSources)} from sources vs {fmt(totalFunding)} required
                — difference of {fmt(Math.abs(totalFunding - totalSources))}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Funding Request — Summary</h2>
          <span className={`text-sm font-semibold ${completed === total ? "text-sage-600" : "text-amber-500"}`}>
            {completed}/{total} sections complete
          </span>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${f.value ? "bg-sage-500" : "bg-amber-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{f.label}</p>
                {f.value ? (
                  <p className="text-navy-800 text-sm line-clamp-2">{f.summary || f.value}</p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Not yet completed</p>
                )}
              </div>
              {!f.value && (
                <button
                  onClick={() => onNavigate("funding", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Financial snapshot */}
      {fr.requiresFunding === true && totalFunding > 0 && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Funding Snapshot</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Total Required</p>
              <p className="font-bold text-navy-900 text-xl">{fmt(totalFunding)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Allocated</p>
              <p className={`font-bold text-xl ${Math.abs(totalFunding - totalAllocated) < 100 ? "text-sage-600" : "text-amber-500"}`}>
                {fmt(totalAllocated)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Sources</p>
              <p className={`font-bold text-xl ${Math.abs(totalFunding - totalSources) < 100 || totalSources === 0 ? "text-navy-900" : "text-amber-500"}`}>
                {sources.length > 0 ? fmt(totalSources) : "—"}
              </p>
            </div>
          </div>

          {sources.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-navy-500 uppercase mb-2">Funding Sources</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs px-3 py-1.5 rounded-full border font-medium bg-white border-navy-200 text-navy-700"
                  >
                    {FUNDING_TYPES.find((ft) => ft.value === s.type)?.label || s.type}
                    {s.amount > 0 && ` · ${fmt(s.amount)}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {fr.requiresFunding === false && (
        <div className="mb-6 p-5 bg-sage-50 border border-sage-200 rounded-xl">
          <p className="text-sage-700 font-semibold text-sm mb-2">Self-Funded Business</p>
          <p className="text-sage-700 text-sm">
            {fr.noFundingReason || "No external funding required. Business will be funded from personal capital and/or operating cash flow."}
          </p>
        </div>
      )}

      {completed === total ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Funding Request is complete. You're ready for Risks & Mitigation — where you'll identify and plan for the key risks facing the business.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {total - completed} section{total - completed > 1 ? "s" : ""} still incomplete. At minimum, the funding decision and use-of-funds table should be completed before the final document is generated.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Risks & Mitigation →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
