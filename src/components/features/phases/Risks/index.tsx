import React, { useState, useMemo } from "react";
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
const PHASE = PHASES.find((p) => p.id === "risks")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Data types ───────────────────────────────────────────────────────────────
export interface RiskEntry {
  id: string;
  category: string;
  risk: string;
  cause?: string;
  likelihood: number; // 1–5
  impact: number; // 1–5
  consequence?: string;
  mitigation?: string;
  contingency?: string;
  responsiblePerson?: string;
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

// ─── Risk categories ──────────────────────────────────────────────────────────
const RISK_CATEGORIES: {
  value: string;
  label: string;
  icon: string;
  examples: string[];
  color: string;
}[] = [
  {
    value: "market",
    label: "Market",
    icon: "📉",
    examples: [
      "Lower-than-expected demand",
      "Market shrinks or disappears",
      "Slower customer adoption than forecast",
      "Economic downturn reduces spending",
    ],
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    value: "competition",
    label: "Competition",
    icon: "⚔️",
    examples: [
      "Competitor undercuts on price",
      "Well-funded new entrant captures market share",
      "Existing competitor copies your offering",
      "Direct competitor acquires a key customer",
    ],
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    value: "financial",
    label: "Financial",
    icon: "💰",
    examples: [
      "Revenue below projections in first 6 months",
      "Startup costs exceed budget",
      "Late payment from major customers",
      "Interest rate rise increases loan repayments",
    ],
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    value: "operations",
    label: "Operations",
    icon: "⚙️",
    examples: [
      "Key equipment failure",
      "Capacity bottleneck limits growth",
      "Process failure causes delivery delays",
      "Quality issue triggers complaints or refunds",
    ],
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    value: "legal",
    label: "Legal",
    icon: "⚖️",
    examples: [
      "Contract dispute with customer or supplier",
      "IP infringement claim",
      "Employment law breach claim",
      "Failure to meet consumer protection obligations",
    ],
    color: "bg-orange-50 border-orange-200 text-orange-700",
  },
  {
    value: "regulatory",
    label: "Regulatory",
    icon: "🏛️",
    examples: [
      "Licence application rejected or delayed",
      "Regulatory change affects operating model",
      "Non-compliance fine or penalty",
      "New industry standards require costly adaptation",
    ],
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    value: "technology",
    label: "Technology",
    icon: "💻",
    examples: [
      "Critical software tool discontinued",
      "Cybersecurity breach or data loss",
      "Payment processing failure",
      "Website outage during peak period",
    ],
    color: "bg-sky-50 border-sky-200 text-sky-700",
  },
  {
    value: "supplier",
    label: "Supplier",
    icon: "🚚",
    examples: [
      "Key supplier closes or loses capacity",
      "Supply chain disruption causes stock-outs",
      "Price increase from single-source supplier",
      "Supplier quality decline affects your product",
    ],
    color: "bg-teal-50 border-teal-200 text-teal-700",
  },
  {
    value: "personnel",
    label: "Personnel",
    icon: "👤",
    examples: [
      "Key founder or employee leaves unexpectedly",
      "Difficulty hiring skilled staff",
      "Workplace health and safety incident",
      "Skills gap limits delivery capacity",
    ],
    color: "bg-pink-50 border-pink-200 text-pink-700",
  },
  {
    value: "other",
    label: "Other",
    icon: "🔺",
    examples: [
      "Natural disaster or emergency affects premises",
      "Reputational damage from public incident",
      "Pandemic-style disruption to normal operations",
      "Unexpected taxation change",
    ],
    color: "bg-gray-50 border-gray-200 text-gray-700",
  },
];

// ─── Score helpers ────────────────────────────────────────────────────────────
const LIKELIHOOD_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Very High",
};

const IMPACT_LABELS: Record<number, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic",
};

function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

function riskLevel(score: number): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 16)
    return { label: "Critical", bg: "bg-red-600", text: "text-white", border: "border-red-600" };
  if (score >= 10)
    return { label: "High", bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
  if (score >= 5)
    return { label: "Medium", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" };
  return { label: "Low", bg: "bg-green-100", text: "text-green-700", border: "border-green-300" };
}

function matrixColor(likelihood: number, impact: number): string {
  const s = riskScore(likelihood, impact);
  if (s >= 16) return "bg-red-600 text-white";
  if (s >= 10) return "bg-red-200 text-red-900";
  if (s >= 5) return "bg-amber-200 text-amber-900";
  if (s >= 3) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

// ─── Phase root ───────────────────────────────────────────────────────────────
export default function RisksPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const risks: RiskEntry[] = (plan as any).risks || [];
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const updateRisks = (updated: RiskEntry[]) => {
    onUpdatePlan({ risks: updated } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next ? onNavigate("risks", nav.next.id) : onNavigate("milestones", "ms_completed");
  const handlePrev = () =>
    nav.prev ? onNavigate("risks", nav.prev.id) : onNavigate("funding", "fund_review");

  const sharedProps = {
    risks,
    updateRisks,
    status,
    markComplete,
    onNext: handleNext,
    onPrev: handlePrev,
    onNavigate,
    plan,
  };

  const renderTopic = () => {
    switch (currentTopic) {
      case "risk_intro":    return <RiskIntro {...sharedProps} />;
      case "risk_identify": return <RiskIdentify {...sharedProps} />;
      case "risk_matrix":   return <RiskMatrix {...sharedProps} />;
      case "risk_review":   return <RiskReview {...sharedProps} />;
      default:              return <RiskIntro {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Phase header ─────────────────────────────────────────────────────────────
function RisksPhaseHeader() {
  return (
    <div className="mb-8 p-5 rounded-xl bg-navy-900 text-white">
      <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Phase 9</p>
      <h2 className="font-serif text-2xl font-bold leading-tight mb-1">Risks & Mitigation</h2>
      <p className="text-white/65 text-sm">
        Identify, score, and plan for the risks that could affect your business
      </p>
    </div>
  );
}

// ─── 01 — About Risk Planning ─────────────────────────────────────────────────
function RiskIntro({ risks, updateRisks, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <RisksPhaseHeader />
      <TopicHeader
        phase="Risks & Mitigation"
        phaseNumber={9}
        topicNumber={1}
        topicTitle="About Risk Planning"
        estimatedMinutes={5}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Risk planning is not pessimism — it is professionalism. Every business faces uncertainty, and the quality of a business plan is partly measured by how clearly the writer understands and has prepared for the risks facing their venture.
        </p>
        <p className="text-navy-700">
          A plan that ignores risk looks naive. A plan that identifies risks, assesses their severity, and documents mitigation strategies signals that the owner has thought carefully about the business — and is more likely to survive when things don't go to plan.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        {/* Why it strengthens a plan */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">Why risk planning strengthens a business plan</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "🎯",
                  title: "Credibility with readers",
                  desc: "Lenders and investors know risks exist. Acknowledging them shows intellectual honesty — pretending they don't exist destroys credibility.",
                },
                {
                  icon: "🛡️",
                  title: "Operational resilience",
                  desc: "Planning for failure before it happens means you have a response ready. Businesses that survive crises usually prepared for them.",
                },
                {
                  icon: "📊",
                  title: "Realistic forecasting",
                  desc: "Understanding what could go wrong helps you set realistic projections rather than wildly optimistic ones that collapse on contact with reality.",
                },
                {
                  icon: "🔎",
                  title: "Decision-making tool",
                  desc: "The act of documenting risks often surfaces issues you hadn't consciously acknowledged — the process itself is valuable.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-navy-50">
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

        {/* Risk framework */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">How risks are assessed: Likelihood × Impact</p>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-navy-700 text-sm mb-3">
              Each risk is scored on two dimensions. Multiplying them gives a Risk Score that determines priority.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4 border border-navy-200">
                <p className="font-bold text-navy-900 text-sm mb-3">Likelihood (1–5)</p>
                <div className="space-y-1.5">
                  {[
                    { score: 1, label: "Very Low", desc: "Unlikely to occur" },
                    { score: 2, label: "Low", desc: "Possible but uncommon" },
                    { score: 3, label: "Moderate", desc: "Could reasonably occur" },
                    { score: 4, label: "High", desc: "Likely to occur" },
                    { score: 5, label: "Very High", desc: "Almost certain to occur" },
                  ].map((row) => (
                    <div key={row.score} className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 rounded bg-navy-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {row.score}
                      </span>
                      <span className="font-semibold text-navy-800 w-16 shrink-0">{row.label}</span>
                      <span className="text-navy-500">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="font-bold text-navy-900 text-sm mb-3">Impact (1–5)</p>
                <div className="space-y-1.5">
                  {[
                    { score: 1, label: "Negligible", desc: "Minimal disruption" },
                    { score: 2, label: "Minor", desc: "Small setback, recoverable" },
                    { score: 3, label: "Moderate", desc: "Significant disruption" },
                    { score: 4, label: "Major", desc: "Serious threat to viability" },
                    { score: 5, label: "Catastrophic", desc: "Existential — business fails" },
                  ].map((row) => (
                    <div key={row.score} className="flex items-center gap-2 text-xs">
                      <span className="w-4 h-4 rounded bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {row.score}
                      </span>
                      <span className="font-semibold text-navy-800 w-20 shrink-0">{row.label}</span>
                      <span className="text-navy-500">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini risk matrix preview */}
            <div>
              <p className="text-navy-600 text-xs font-semibold uppercase tracking-wide mb-3">
                Risk Score = Likelihood × Impact
              </p>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold max-w-xs">
                {[
                  { l: "—", i: "—", cls: "bg-muted text-muted-foreground" },
                  { l: "—", i: "Low", cls: "bg-muted text-muted-foreground" },
                  { l: "—", i: "Med", cls: "bg-muted text-muted-foreground" },
                  { l: "—", i: "High", cls: "bg-muted text-muted-foreground" },
                  { l: "Low", i: "—", cls: "bg-muted text-muted-foreground" },
                  { l: "1", i: "1", cls: "bg-green-100 text-green-800" },
                  { l: "1", i: "3", cls: "bg-yellow-100 text-yellow-800" },
                  { l: "1", i: "5", cls: "bg-amber-200 text-amber-900" },
                  { l: "Med", i: "—", cls: "bg-muted text-muted-foreground" },
                  { l: "3", i: "1", cls: "bg-yellow-100 text-yellow-800" },
                  { l: "3", i: "3", cls: "bg-amber-200 text-amber-900" },
                  { l: "3", i: "5", cls: "bg-red-200 text-red-900" },
                  { l: "High", i: "—", cls: "bg-muted text-muted-foreground" },
                  { l: "5", i: "1", cls: "bg-amber-200 text-amber-900" },
                  { l: "5", i: "3", cls: "bg-red-200 text-red-900" },
                  { l: "5", i: "5", cls: "bg-red-600 text-white" },
                ].map((cell, i) => (
                  <div key={i} className={`rounded py-1.5 px-1 ${cell.cls}`}>
                    {cell.l === cell.i ? cell.l : cell.l && cell.i && !isNaN(Number(cell.l)) ? `${cell.l}×${cell.i}` : cell.l || cell.i}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                {[
                  { cls: "bg-green-100", label: "Low (1–4)" },
                  { cls: "bg-amber-200", label: "Medium (5–9)" },
                  { cls: "bg-red-200", label: "High (10–15)" },
                  { cls: "bg-red-600", label: "Critical (16–25)" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${item.cls}`} />
                    <span className="text-xs text-navy-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Terminology */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">Mitigation vs Contingency — what's the difference?</p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <div className="bg-sage-50 border border-sage-200 rounded-lg p-4">
              <p className="font-bold text-navy-900 text-sm mb-2">Mitigation Strategy</p>
              <p className="text-navy-700 text-sm mb-2">
                Actions you take <strong>before</strong> the risk occurs to reduce its likelihood or impact.
              </p>
              <p className="text-navy-500 text-xs italic">
                Example: "To mitigate supplier single-source risk, we are qualifying a backup supplier in parallel."
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-bold text-navy-900 text-sm mb-2">Contingency Plan</p>
              <p className="text-navy-700 text-sm mb-2">
                The response plan for <strong>if</strong> the risk actually materialises — what you will do.
              </p>
              <p className="text-navy-500 text-xs italic">
                Example: "If our primary supplier fails, we will activate our backup supplier and notify customers of a 2-week lead time extension."
              </p>
            </div>
          </div>
        </div>

        {/* Risk categories overview */}
        <div>
          <h3 className="font-semibold text-navy-900 text-sm mb-3">10 Risk Categories You'll Assess</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {RISK_CATEGORIES.map((cat) => (
              <div key={cat.value} className={`p-3 rounded-xl border text-center ${cat.color}`}>
                <p className="text-xl mb-1">{cat.icon}</p>
                <p className="font-semibold text-xs">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
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

// ─── 02 — Identify Risks ──────────────────────────────────────────────────────
function RiskIdentify({
  risks,
  updateRisks,
  status,
  markComplete,
  onNext,
  onPrev,
  plan,
}: any) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const addRisk = (category?: string) => {
    const newRisk: RiskEntry = {
      id: generateId(),
      category: category || "other",
      risk: "",
      cause: "",
      likelihood: 3,
      impact: 3,
      consequence: "",
      mitigation: "",
      contingency: "",
      responsiblePerson: "",
    };
    updateRisks([...risks, newRisk]);
    if (status === "not_started") {
      // status update handled in parent
    }
  };

  const updateRisk = (id: string, changes: Partial<RiskEntry>) =>
    updateRisks(risks.map((r: RiskEntry) => (r.id === id ? { ...r, ...changes } : r)));

  const removeRisk = (id: string) =>
    updateRisks(risks.filter((r: RiskEntry) => r.id !== id));

  const filteredRisks =
    activeCategory === "all"
      ? risks
      : risks.filter((r: RiskEntry) => r.category === activeCategory);

  const categoryCounts: Record<string, number> = {};
  risks.forEach((r: RiskEntry) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  // Pull risks flagged in prior phases
  const singleSourceSuppliers = ((plan as any).operations?.suppliers || []).filter(
    (s: any) => s.isSingleSource
  );
  const criticalTechTools = ((plan as any).operations?.techTools || []).filter(
    (t: any) => t.criticalityLevel === "critical"
  );

  const hasSuggestedRisks = singleSourceSuppliers.length > 0 || criticalTechTools.length > 0;

  return (
    <div>
      <TopicHeader
        phase="Risks & Mitigation"
        phaseNumber={9}
        topicNumber={2}
        topicTitle="Identify Risks"
        estimatedMinutes={20}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Work through each risk category and document the risks that apply to your business. For every risk you identify, score its likelihood and impact, then document how you'll mitigate it and what you'll do if it occurs.
        </p>
        <p className="text-navy-700">
          Aim for a minimum of 5–10 risks across at least 4 categories. Businesses with fewer than 5 documented risks often haven't thought deeply enough about the challenges they face.
        </p>
      </EducationPanel>

      {/* Suggested risks from other phases */}
      {hasSuggestedRisks && (
        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide">
            Risks flagged in earlier phases
          </p>
          {singleSourceSuppliers.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-blue-700 text-sm font-medium">Supplier single-source dependency</p>
                <p className="text-blue-600 text-xs mt-0.5">
                  {singleSourceSuppliers.map((s: any) => s.name || "Unnamed supplier").join(", ")} — flagged in Operations.
                </p>
              </div>
              <button
                onClick={() => {
                  const alreadyAdded = risks.find(
                    (r: RiskEntry) => r.category === "supplier" && r.risk.toLowerCase().includes("single")
                  );
                  if (alreadyAdded) return;
                  addRisk("supplier");
                  const newId = risks[risks.length - 1]?.id;
                }}
                className="bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors shrink-0"
              >
                Add Risk
              </button>
            </div>
          )}
          {criticalTechTools.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-blue-700 text-sm font-medium">Critical technology dependency</p>
                <p className="text-blue-600 text-xs mt-0.5">
                  {criticalTechTools.map((t: any) => t.name || "Unnamed tool").join(", ")} — marked as critical in Operations.
                </p>
              </div>
              <button
                onClick={() => addRisk("technology")}
                className="bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors shrink-0"
              >
                Add Risk
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category filter tabs */}
      <div className="mt-6 overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeCategory === "all"
                ? "bg-navy-900 text-white border-navy-900"
                : "bg-white text-navy-600 border-border hover:border-navy-400"
            }`}
          >
            All ({risks.length})
          </button>
          {RISK_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                activeCategory === cat.value
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-white text-navy-600 border-border hover:border-navy-400"
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
              {categoryCounts[cat.value] ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  activeCategory === cat.value ? "bg-white/20 text-white" : "bg-navy-100 text-navy-600"
                }`}>
                  {categoryCounts[cat.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Category prompt / examples */}
      {activeCategory !== "all" && (
        <div className={`mt-4 p-4 rounded-xl border ${RISK_CATEGORIES.find((c) => c.value === activeCategory)?.color}`}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2">
            {RISK_CATEGORIES.find((c) => c.value === activeCategory)?.icon}{" "}
            {RISK_CATEGORIES.find((c) => c.value === activeCategory)?.label} Risk Examples
          </p>
          <ul className="space-y-1">
            {(RISK_CATEGORIES.find((c) => c.value === activeCategory)?.examples || []).map((ex) => (
              <li key={ex} className="text-xs flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk cards */}
      <div className="mt-5 space-y-4">
        {filteredRisks.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              {activeCategory === "all"
                ? "No risks added yet."
                : `No ${RISK_CATEGORIES.find((c) => c.value === activeCategory)?.label || ""} risks added.`}
            </p>
            <p className="text-muted-foreground text-xs">
              Add risks using the button below, or browse each category to see what applies.
            </p>
          </div>
        ) : (
          filteredRisks.map((risk: RiskEntry, i: number) => (
            <RiskCard
              key={risk.id}
              risk={risk}
              index={i}
              onUpdate={(changes) => updateRisk(risk.id, changes)}
              onRemove={() => removeRisk(risk.id)}
            />
          ))
        )}

        <button
          onClick={() => addRisk(activeCategory === "all" ? undefined : activeCategory)}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add{" "}
          {activeCategory !== "all"
            ? `${RISK_CATEGORIES.find((c) => c.value === activeCategory)?.label || ""} `
            : ""}
          Risk
        </button>
      </div>

      {/* Summary bar */}
      {risks.length > 0 && (
        <div className="mt-6 p-4 bg-navy-50 border border-navy-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-navy-600 text-xs font-bold uppercase tracking-wide">Risk Summary</p>
            <span className="text-navy-700 text-sm font-semibold">{risks.length} risk(s) identified</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {(["Critical", "High", "Medium", "Low"] as const).map((level) => {
              const thresholds: Record<string, [number, number]> = {
                Critical: [16, 25],
                High: [10, 15],
                Medium: [5, 9],
                Low: [1, 4],
              };
              const [min, max] = thresholds[level];
              const count = risks.filter((r: RiskEntry) => {
                const s = riskScore(r.likelihood || 1, r.impact || 1);
                return s >= min && s <= max;
              }).length;
              const colors: Record<string, string> = {
                Critical: "bg-red-600 text-white",
                High: "bg-red-100 text-red-700",
                Medium: "bg-amber-100 text-amber-700",
                Low: "bg-green-100 text-green-700",
              };
              return (
                <div key={level} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${colors[level]}`}>
                  <span>{count}</span>
                  <span>{level}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── Risk Card ────────────────────────────────────────────────────────────────
function RiskCard({
  risk,
  index,
  onUpdate,
  onRemove,
}: {
  risk: RiskEntry;
  index: number;
  onUpdate: (changes: Partial<RiskEntry>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const score = riskScore(risk.likelihood || 1, risk.impact || 1);
  const level = riskLevel(score);
  const catInfo = RISK_CATEGORIES.find((c) => c.value === risk.category);

  return (
    <div className={`rounded-xl border overflow-hidden ${score >= 16 ? "border-red-300" : score >= 10 ? "border-red-200" : "border-border"}`}>
      {/* Card header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-navy-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm truncate">
            {risk.risk || "New risk — click to expand"}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {catInfo && (
              <span className="text-muted-foreground text-xs">
                {catInfo.icon} {catInfo.label}
              </span>
            )}
            {(risk.likelihood && risk.impact) ? (
              <span className="text-muted-foreground text-xs">· Score: {score}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {risk.likelihood && risk.impact ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${level.bg} ${level.text} ${level.border}`}>
              {level.label}
            </span>
          ) : null}
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
        <div className="px-5 pb-6 pt-3 border-t border-border bg-white space-y-5">
          {/* Category + risk name */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Risk Category</label>
              <select
                value={risk.category}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="w-full border border-input bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
              >
                {RISK_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              label="Risk Name"
              value={risk.risk}
              onChange={(v) => onUpdate({ risk: v })}
              placeholder="e.g. Primary supplier ceases trading"
              required
            />
          </div>

          <TextAreaField
            label="Cause / Root Cause"
            value={risk.cause || ""}
            onChange={(v) => onUpdate({ cause: v })}
            placeholder="What would cause this risk to materialise? What conditions or events would trigger it?"
            rows={2}
            helpText="Understanding cause helps design better mitigation."
          />

          {/* Likelihood × Impact sliders */}
          <div className="grid sm:grid-cols-2 gap-5">
            <ScoreSelector
              label="Likelihood"
              sublabel="How likely is this risk to occur?"
              value={risk.likelihood || 3}
              onChange={(v) => onUpdate({ likelihood: v })}
              scoreLabels={LIKELIHOOD_LABELS}
              accentClass="bg-navy-700"
            />
            <ScoreSelector
              label="Impact"
              sublabel="How severe would the impact be if it occurred?"
              value={risk.impact || 3}
              onChange={(v) => onUpdate({ impact: v })}
              scoreLabels={IMPACT_LABELS}
              accentClass="bg-amber-500"
            />
          </div>

          {/* Risk score badge */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${level.border} ${level.bg.replace("bg-", "border-")} ${score >= 16 ? "bg-red-600" : score >= 10 ? "bg-red-100" : score >= 5 ? "bg-amber-100" : "bg-green-100"}`}>
            <div className="text-center shrink-0">
              <p className={`text-[11px] font-semibold uppercase tracking-wide mb-0.5 ${score >= 16 ? "text-white/80" : "text-navy-500"}`}>
                Risk Score
              </p>
              <p className={`font-bold text-3xl ${score >= 16 ? "text-white" : level.text}`}>
                {score}
              </p>
              <p className={`text-[10px] font-bold uppercase ${score >= 16 ? "text-white/70" : level.text}`}>
                {level.label}
              </p>
            </div>
            <div className={`flex-1 text-sm ${score >= 16 ? "text-white/80" : "text-navy-700"}`}>
              <p>
                Likelihood <strong>{risk.likelihood || 1}</strong> ({LIKELIHOOD_LABELS[risk.likelihood || 1]}) ×{" "}
                Impact <strong>{risk.impact || 1}</strong> ({IMPACT_LABELS[risk.impact || 1]})
              </p>
              {score >= 16 && (
                <p className="text-white/70 text-xs mt-1 font-medium">
                  ⚠ Critical risk — ensure mitigation and contingency are fully documented
                </p>
              )}
              {score >= 10 && score < 16 && (
                <p className="text-red-600 text-xs mt-1 font-medium">
                  High risk — document a clear mitigation strategy
                </p>
              )}
            </div>
          </div>

          <TextAreaField
            label="Consequence"
            value={risk.consequence || ""}
            onChange={(v) => onUpdate({ consequence: v })}
            placeholder="If this risk materialises, what happens? Be specific about the business impact — revenue, reputation, operations, legal exposure."
            rows={3}
            helpText="The more specific, the more useful your contingency planning will be."
          />

          <TextAreaField
            label="Mitigation Strategy"
            value={risk.mitigation || ""}
            onChange={(v) => onUpdate({ mitigation: v })}
            placeholder="What actions will you take before this risk occurs to reduce its likelihood or impact? Be specific — generic answers like 'manage carefully' are not mitigation strategies."
            rows={3}
            required={score >= 10}
            helpText="Mitigation = actions before the risk occurs."
          />

          <TextAreaField
            label="Contingency Plan"
            value={risk.contingency || ""}
            onChange={(v) => onUpdate({ contingency: v })}
            placeholder="If this risk actually occurs despite your mitigation efforts, what is your response plan? Who acts, what do they do, by when?"
            rows={3}
            helpText="Contingency = your response if the risk materialises."
          />

          <TextField
            label="Responsible Person"
            value={risk.responsiblePerson || ""}
            onChange={(v) => onUpdate({ responsiblePerson: v })}
            placeholder="Who owns monitoring and managing this risk? e.g. Founder/CEO, Operations Manager"
            helpText="Unowned risks tend to go unmanaged."
          />

          <div className="pt-3 border-t border-border">
            <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Remove risk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Score selector (1–5 buttons) ────────────────────────────────────────────
function ScoreSelector({
  label,
  sublabel,
  value,
  onChange,
  scoreLabels,
  accentClass,
}: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
  scoreLabels: Record<number, string>;
  accentClass: string;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <p className="text-xs text-muted-foreground mb-2">{sublabel}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
              value === n
                ? `${accentClass} text-white border-transparent`
                : "bg-white border-border text-navy-500 hover:border-navy-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className={`text-xs mt-1.5 font-medium`}>
        {value} — {scoreLabels[value]}
      </p>
    </div>
  );
}

// ─── 03 — Risk Matrix ─────────────────────────────────────────────────────────
function RiskMatrix({
  risks,
  updateRisks,
  status,
  markComplete,
  onNext,
  onPrev,
  onNavigate,
}: any) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const hasRisks = risks.length > 0;

  // Group risks by (likelihood, impact) cell
  const risksByCell: Record<string, RiskEntry[]> = {};
  risks.forEach((r: RiskEntry) => {
    const key = `${r.likelihood || 1}-${r.impact || 1}`;
    if (!risksByCell[key]) risksByCell[key] = [];
    risksByCell[key].push(r);
  });

  const criticalRisks = risks.filter((r: RiskEntry) => riskScore(r.likelihood || 1, r.impact || 1) >= 16);
  const highRisks = risks.filter((r: RiskEntry) => {
    const s = riskScore(r.likelihood || 1, r.impact || 1);
    return s >= 10 && s < 16;
  });
  const mediumRisks = risks.filter((r: RiskEntry) => {
    const s = riskScore(r.likelihood || 1, r.impact || 1);
    return s >= 5 && s < 10;
  });
  const lowRisks = risks.filter((r: RiskEntry) => riskScore(r.likelihood || 1, r.impact || 1) < 5);

  const unmitigatedHighCritical = [...criticalRisks, ...highRisks].filter(
    (r: RiskEntry) => !r.mitigation || r.mitigation.trim().length < 10
  );

  return (
    <div>
      <TopicHeader
        phase="Risks & Mitigation"
        phaseNumber={9}
        topicNumber={3}
        topicTitle="Risk Matrix"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700">
          The risk matrix below maps all your identified risks onto a likelihood vs impact grid. Each cell's colour reflects the combined risk score. Hover or tap a cell to see which risks sit there. The matrix provides an at-a-glance view of your risk profile and highlights where attention is most needed.
        </p>
      </EducationPanel>

      {!hasRisks ? (
        <div className="mt-8 bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm mb-2">No risks identified yet.</p>
          <p className="text-muted-foreground text-xs mb-4">
            Go back to Identify Risks and add at least 5 risks before reviewing the matrix.
          </p>
          <button
            onClick={() => onNavigate("risks", "risk_identify")}
            className="text-navy-700 text-sm font-semibold hover:underline"
          >
            ← Return to Identify Risks
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Summary counts */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Critical", count: criticalRisks.length, cls: "bg-red-600 text-white" },
              { label: "High", count: highRisks.length, cls: "bg-red-100 text-red-700 border border-red-200" },
              { label: "Medium", count: mediumRisks.length, cls: "bg-amber-100 text-amber-700 border border-amber-200" },
              { label: "Low", count: lowRisks.length, cls: "bg-green-100 text-green-700 border border-green-200" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${item.cls}`}>
                <p className="font-bold text-2xl">{item.count}</p>
                <p className="text-xs font-semibold mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Risk matrix grid */}
          <div>
            <h3 className="font-semibold text-navy-900 text-sm mb-3">Likelihood vs Impact Matrix</h3>
            <div className="bg-white border border-border rounded-xl p-5 overflow-x-auto">
              <div className="min-w-[380px]">
                {/* Column headers (Impact) */}
                <div className="flex mb-1 pl-12">
                  <div className="flex-1 text-center text-xs font-bold text-navy-500 uppercase tracking-wide mb-1 pb-1 border-b border-dashed border-navy-200">
                    ← Impact →
                  </div>
                </div>
                <div className="flex items-center mb-1 pl-12 gap-1">
                  {[1, 2, 3, 4, 5].map((impact) => (
                    <div key={impact} className="flex-1 text-center">
                      <p className="text-[10px] font-bold text-navy-600">{impact}</p>
                      <p className="text-[9px] text-navy-400 leading-tight">{IMPACT_LABELS[impact].split(" ")[0]}</p>
                    </div>
                  ))}
                </div>

                {/* Rows (Likelihood, 5 → 1) */}
                {[5, 4, 3, 2, 1].map((likelihood) => (
                  <div key={likelihood} className="flex items-center gap-1 mb-1">
                    {/* Row label */}
                    <div className="w-11 shrink-0 text-right pr-1.5">
                      <p className="text-[10px] font-bold text-navy-600">{likelihood}</p>
                      <p className="text-[9px] text-navy-400 leading-tight">{LIKELIHOOD_LABELS[likelihood].split(" ")[0]}</p>
                    </div>

                    {/* Cells */}
                    {[1, 2, 3, 4, 5].map((impact) => {
                      const key = `${likelihood}-${impact}`;
                      const cellRisks = risksByCell[key] || [];
                      const score = likelihood * impact;
                      const colorClass = matrixColor(likelihood, impact);

                      return (
                        <div
                          key={key}
                          className={`flex-1 rounded-lg min-h-[52px] flex flex-col items-center justify-center p-1 cursor-default transition-all relative ${colorClass} ${
                            hoveredCell === key ? "ring-2 ring-navy-900 ring-offset-1" : ""
                          }`}
                          onMouseEnter={() => setHoveredCell(key)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <p className="text-[10px] font-bold opacity-60">{score}</p>
                          {cellRisks.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                              {cellRisks.slice(0, 3).map((r: RiskEntry) => {
                                const cat = RISK_CATEGORIES.find((c) => c.value === r.category);
                                return (
                                  <span
                                    key={r.id}
                                    title={r.risk}
                                    className="text-sm leading-none"
                                  >
                                    {cat?.icon || "🔺"}
                                  </span>
                                );
                              })}
                              {cellRisks.length > 3 && (
                                <span className="text-[10px] font-bold">+{cellRisks.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Y-axis label */}
                <div className="flex justify-end mt-2">
                  <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wide">
                    ↑ Likelihood ↑ (rows, top=high)
                  </p>
                </div>
              </div>
            </div>

            {/* Hovered cell detail */}
            {hoveredCell && risksByCell[hoveredCell]?.length > 0 && (
              <div className="mt-3 p-4 bg-navy-50 border border-navy-200 rounded-xl">
                <p className="text-navy-600 text-xs font-bold uppercase tracking-wide mb-2">
                  Risks at L={hoveredCell.split("-")[0]} × I={hoveredCell.split("-")[1]} (Score: {parseInt(hoveredCell.split("-")[0]) * parseInt(hoveredCell.split("-")[1])})
                </p>
                <div className="space-y-1.5">
                  {risksByCell[hoveredCell].map((r: RiskEntry) => {
                    const cat = RISK_CATEGORIES.find((c) => c.value === r.category);
                    const level = riskLevel(riskScore(r.likelihood, r.impact));
                    return (
                      <div key={r.id} className="flex items-start gap-2">
                        <span>{cat?.icon || "🔺"}</span>
                        <div className="flex-1">
                          <span className="text-navy-800 text-sm font-medium">{r.risk || "Unnamed risk"}</span>
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${level.bg} ${level.text} ${level.border} border`}>
                            {level.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Colour legend */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Low (1–4)", cls: "bg-green-100 border-green-200 text-green-700" },
              { label: "Medium (5–9)", cls: "bg-amber-200 border-amber-300 text-amber-800" },
              { label: "High (10–15)", cls: "bg-red-200 border-red-300 text-red-800" },
              { label: "Critical (16–25)", cls: "bg-red-600 border-red-600 text-white" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${item.cls}`}>
                <div className={`w-2 h-2 rounded-full ${item.cls.split(" ")[0]}`} />
                {item.label}
              </div>
            ))}
          </div>

          {/* Risk register table */}
          <div>
            <h3 className="font-semibold text-navy-900 text-sm mb-3">Risk Register</h3>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="text-left px-4 py-3 text-xs font-semibold">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold">Risk</th>
                      <th className="px-4 py-3 text-xs font-semibold text-center">L</th>
                      <th className="px-4 py-3 text-xs font-semibold text-center">I</th>
                      <th className="px-4 py-3 text-xs font-semibold text-center">Score</th>
                      <th className="px-4 py-3 text-xs font-semibold text-center">Level</th>
                      <th className="px-4 py-3 text-xs font-semibold hidden sm:table-cell">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...risks]
                      .sort(
                        (a: RiskEntry, b: RiskEntry) =>
                          riskScore(b.likelihood || 1, b.impact || 1) -
                          riskScore(a.likelihood || 1, a.impact || 1)
                      )
                      .map((r: RiskEntry, i: number) => {
                        const s = riskScore(r.likelihood || 1, r.impact || 1);
                        const level = riskLevel(s);
                        const cat = RISK_CATEGORIES.find((c) => c.value === r.category);
                        return (
                          <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                            <td className="px-4 py-2.5 text-navy-500 text-xs">{i + 1}</td>
                            <td className="px-4 py-2.5 text-xs">
                              <span>{cat?.icon || "🔺"}</span>
                              <span className="ml-1 text-navy-600 hidden sm:inline">{cat?.label || "Other"}</span>
                            </td>
                            <td className="px-4 py-2.5 text-navy-800 font-medium text-sm max-w-[200px]">
                              <p className="line-clamp-1">{r.risk || "—"}</p>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="w-6 h-6 rounded bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center mx-auto">
                                {r.likelihood || 1}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="w-6 h-6 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center mx-auto">
                                {r.impact || 1}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center font-bold text-navy-900">{s}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${level.border} ${level.bg} ${level.text}`}>
                                {level.label}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-navy-600 hidden sm:table-cell max-w-[180px]">
                              <p className="line-clamp-2">{r.mitigation || <span className="text-muted-foreground italic">Not documented</span>}</p>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {unmitigatedHighCritical.length > 0 && (
            <EducationPanel variant="warning">
              <p className="text-red-700 font-semibold mb-2">
                ⚠ {unmitigatedHighCritical.length} high/critical risk{unmitigatedHighCritical.length > 1 ? "s" : ""} with no mitigation documented:
              </p>
              <ul className="space-y-1">
                {unmitigatedHighCritical.map((r: RiskEntry) => (
                  <li key={r.id} className="text-red-700 text-sm">
                    • {r.risk || "Unnamed risk"} (Score: {riskScore(r.likelihood || 1, r.impact || 1)})
                  </li>
                ))}
              </ul>
              <p className="text-red-600 text-xs mt-2">
                Return to Identify Risks to complete mitigation strategies for these items.
              </p>
            </EducationPanel>
          )}
        </div>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 04 — Phase Review ────────────────────────────────────────────────────────
function RiskReview({
  risks,
  updateRisks,
  status,
  markComplete,
  onNext,
  onPrev,
  onNavigate,
}: any) {
  const criticalRisks = risks.filter((r: RiskEntry) => riskScore(r.likelihood || 1, r.impact || 1) >= 16);
  const highRisks = risks.filter((r: RiskEntry) => {
    const s = riskScore(r.likelihood || 1, r.impact || 1);
    return s >= 10 && s < 16;
  });
  const unmitigated = risks.filter(
    (r: RiskEntry) =>
      riskScore(r.likelihood || 1, r.impact || 1) >= 10 &&
      (!r.mitigation || r.mitigation.trim().length < 10)
  );
  const withoutContingency = risks.filter(
    (r: RiskEntry) =>
      riskScore(r.likelihood || 1, r.impact || 1) >= 10 &&
      (!r.contingency || r.contingency.trim().length < 10)
  );
  const unassigned = risks.filter((r: RiskEntry) => !r.responsiblePerson);

  // Category coverage
  const coveredCategories = [...new Set(risks.map((r: RiskEntry) => r.category))];
  const missingCategories = RISK_CATEGORIES.filter((cat) => !coveredCategories.includes(cat.value));

  const isComplete = risks.length >= 5 && unmitigated.length === 0;

  return (
    <div>
      <TopicHeader
        phase="Risks & Mitigation"
        phaseNumber={9}
        topicNumber={4}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Warnings */}
      {unmitigated.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 font-semibold text-sm mb-1">
            ⚠ {unmitigated.length} high/critical risk{unmitigated.length > 1 ? "s" : ""} without a mitigation strategy
          </p>
          <p className="text-red-700 text-sm">
            {unmitigated.map((r: RiskEntry) => r.risk || "Unnamed").join(", ")}
          </p>
          <button
            onClick={() => onNavigate("risks", "risk_identify")}
            className="text-red-700 text-xs font-semibold mt-2 hover:underline"
          >
            Return to Identify Risks →
          </button>
        </div>
      )}

      {risks.length < 5 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 font-semibold text-sm mb-1">
            Only {risks.length} risk{risks.length !== 1 ? "s" : ""} documented — aim for at least 5
          </p>
          <p className="text-amber-700 text-sm">
            A credible risk register covers multiple categories and demonstrates thorough thinking.
          </p>
          <button
            onClick={() => onNavigate("risks", "risk_identify")}
            className="text-amber-700 text-xs font-semibold mt-2 hover:underline"
          >
            Add more risks →
          </button>
        </div>
      )}

      {/* Risk summary snapshot */}
      {risks.length > 0 && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Risk Register Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
            <div className="bg-red-600 text-white rounded-xl p-3">
              <p className="font-bold text-2xl">{criticalRisks.length}</p>
              <p className="text-white/70 text-xs mt-0.5">Critical</p>
            </div>
            <div className="bg-red-100 border border-red-200 rounded-xl p-3">
              <p className="font-bold text-red-700 text-2xl">{highRisks.length}</p>
              <p className="text-red-500 text-xs mt-0.5">High</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3">
              <p className="font-bold text-navy-900 text-2xl">{risks.length}</p>
              <p className="text-navy-400 text-xs mt-0.5">Total Risks</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3">
              <p className="font-bold text-navy-900 text-2xl">{coveredCategories.length}</p>
              <p className="text-navy-400 text-xs mt-0.5">Categories</p>
            </div>
          </div>

          {/* Top risks */}
          <div>
            <p className="text-navy-600 text-xs font-bold uppercase tracking-wide mb-2">Top 5 Risks by Score</p>
            <div className="space-y-2">
              {[...risks]
                .sort(
                  (a: RiskEntry, b: RiskEntry) =>
                    riskScore(b.likelihood || 1, b.impact || 1) -
                    riskScore(a.likelihood || 1, a.impact || 1)
                )
                .slice(0, 5)
                .map((r: RiskEntry) => {
                  const s = riskScore(r.likelihood || 1, r.impact || 1);
                  const level = riskLevel(s);
                  const cat = RISK_CATEGORIES.find((c) => c.value === r.category);
                  return (
                    <div key={r.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-border">
                      <span className="text-sm shrink-0">{cat?.icon || "🔺"}</span>
                      <p className="flex-1 text-navy-800 text-sm line-clamp-1">{r.risk || "Unnamed risk"}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${level.border} ${level.bg} ${level.text}`}>
                        {s} · {level.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Category coverage */}
          {missingCategories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-navy-200">
              <p className="text-navy-500 text-xs font-bold uppercase tracking-wide mb-2">
                Categories not yet covered
              </p>
              <div className="flex flex-wrap gap-2">
                {missingCategories.map((cat) => (
                  <span key={cat.value} className="text-xs px-2.5 py-1 rounded-full bg-white border border-navy-200 text-navy-500 font-medium">
                    {cat.icon} {cat.label}
                  </span>
                ))}
              </div>
              <p className="text-navy-400 text-xs mt-1.5">
                Consider whether these categories have relevant risks for your business.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action items */}
      {(withoutContingency.length > 0 || unassigned.length > 0) && (
        <div className="mb-6 space-y-3">
          {withoutContingency.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm font-semibold mb-1">
                {withoutContingency.length} high/critical risk{withoutContingency.length > 1 ? "s" : ""} without a contingency plan
              </p>
              <p className="text-amber-700 text-sm">
                {withoutContingency.map((r: RiskEntry) => r.risk || "Unnamed").join(", ")}
              </p>
            </div>
          )}
          {unassigned.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-blue-800 text-sm font-semibold mb-1">
                {unassigned.length} risk{unassigned.length > 1 ? "s" : ""} without a responsible person assigned
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Unowned risks tend to go unmonitored. Assign someone to each risk.
              </p>
            </div>
          )}
        </div>
      )}

      {isComplete ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Risks & Mitigation is complete. You're ready for Milestones — where you'll document what you've achieved and what comes next.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {risks.length < 5
              ? `Add at least ${5 - risks.length} more risk(s) to reach the recommended minimum of 5. `
              : ""}
            {unmitigated.length > 0
              ? `${unmitigated.length} high/critical risk(s) still need mitigation strategies. `
              : ""}
            Return to Identify Risks to complete the register.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Milestones →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
