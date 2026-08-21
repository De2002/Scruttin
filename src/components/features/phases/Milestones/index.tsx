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
const PHASE = PHASES.find((p) => p.id === "milestones")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Data types ───────────────────────────────────────────────────────────────
export interface MilestoneEntry {
  id: string;
  title: string;
  description?: string;
  // Completed
  completedDate?: string;
  achievementNote?: string;
  // Future
  targetDate?: string;
  targetQuarter?: string; // "Q1 2025" etc.
  successMeasure?: string;
  responsiblePerson?: string;
  dependencies?: string;
  estimatedCost?: number;
  status: "planned" | "in_progress" | "completed" | "at_risk" | "cancelled";
  isCompleted: boolean;
  category?: string;
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
const MILESTONE_CATEGORIES = [
  "Product / Service Launch",
  "Revenue Target",
  "Customer Acquisition",
  "Hiring / Team",
  "Technology / Infrastructure",
  "Funding / Investment",
  "Legal / Regulatory",
  "Operations",
  "Marketing",
  "Partnerships",
  "Research & Development",
  "Other",
];

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  planned: {
    label: "Planned",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-sage-50",
    text: "text-sage-700",
    border: "border-sage-200",
    dot: "bg-sage-500",
  },
  at_risk: {
    label: "At Risk",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-400",
  },
};

/** Turn a date string like "2025-06" or "2025-06-15" into "Q2 2025" */
function dateToQuarter(dateStr?: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) || 1;
  if (isNaN(year)) return null;
  const q = Math.ceil(month / 3);
  return `Q${q} ${year}`;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "-01").toLocaleDateString("en-AU", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function fmt(n: number) {
  if (!n) return "";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return "$" + n;
}

// ─── Phase root ───────────────────────────────────────────────────────────────
export default function MilestonesPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const milestones: MilestoneEntry[] = (plan as any).milestones || [];
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const updateMilestones = (updated: MilestoneEntry[]) => {
    onUpdatePlan({ milestones: updated } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next ? onNavigate("milestones", nav.next.id) : onNavigate("executive_summary", "es_intro");
  const handlePrev = () =>
    nav.prev ? onNavigate("milestones", nav.prev.id) : onNavigate("risks", "risk_review");

  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const futureMilestones = milestones.filter((m) => !m.isCompleted);

  const sharedProps = {
    milestones,
    completedMilestones,
    futureMilestones,
    updateMilestones,
    status,
    markComplete,
    onNext: handleNext,
    onPrev: handlePrev,
    onNavigate,
    plan,
  };

  const renderTopic = () => {
    switch (currentTopic) {
      case "ms_completed": return <MSCompleted {...sharedProps} />;
      case "ms_future":    return <MSFuture {...sharedProps} />;
      case "ms_timeline":  return <MSTimeline {...sharedProps} />;
      case "ms_review":    return <MSReview {...sharedProps} />;
      default:             return <MSCompleted {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Phase header ─────────────────────────────────────────────────────────────
function MSPhaseHeader() {
  return (
    <div className="mb-8 p-5 rounded-xl bg-navy-900 text-white">
      <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Phase 10</p>
      <h2 className="font-serif text-2xl font-bold leading-tight mb-1">Milestones</h2>
      <p className="text-white/65 text-sm">
        Document what you have achieved and map out what comes next — with clear, measurable targets
      </p>
    </div>
  );
}

// ─── 01 — Completed Milestones ────────────────────────────────────────────────
function MSCompleted({ milestones, completedMilestones, updateMilestones, status, markComplete, onNext, onPrev }: any) {
  const add = () => {
    const newMilestone: MilestoneEntry = {
      id: generateId(),
      title: "",
      completedDate: "",
      achievementNote: "",
      description: "",
      status: "completed",
      isCompleted: true,
      category: "",
    };
    updateMilestones([...milestones, newMilestone]);
  };

  const upd = (id: string, changes: Partial<MilestoneEntry>) =>
    updateMilestones(milestones.map((m: MilestoneEntry) => (m.id === id ? { ...m, ...changes } : m)));

  const remove = (id: string) =>
    updateMilestones(milestones.filter((m: MilestoneEntry) => m.id !== id));

  return (
    <div>
      <MSPhaseHeader />
      <TopicHeader
        phase="Milestones"
        phaseNumber={10}
        topicNumber={1}
        topicTitle="Completed Milestones"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Before you plan forward, document what you have already achieved. Completed milestones serve two purposes in a business plan: they provide proof of execution (important for investors and lenders) and they give you a realistic baseline for future planning.
        </p>
        <p className="text-navy-700">
          Even if your business is at the idea stage, you likely have milestones: market research completed, business name registered, initial customer interviews conducted, a prototype built. Document them — they show momentum.
        </p>
      </EducationPanel>

      {/* Why it matters */}
      <div className="mt-6 bg-white border border-border rounded-xl overflow-hidden">
        <div className="bg-navy-900 px-5 py-3">
          <p className="text-white font-semibold text-sm">What counts as a milestone?</p>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-3">
          {[
            { icon: "✅", example: "Business registered with ASIC", cat: "Legal" },
            { icon: "✅", example: "10 customer interviews completed", cat: "Validation" },
            { icon: "✅", example: "First paying customer acquired", cat: "Revenue" },
            { icon: "✅", example: "MVP prototype built and tested", cat: "Product" },
            { icon: "✅", example: "Key supplier agreement signed", cat: "Operations" },
            { icon: "✅", example: "Website launched", cat: "Marketing" },
            { icon: "✅", example: "Premises lease secured", cat: "Operations" },
            { icon: "✅", example: "Grant application submitted", cat: "Funding" },
          ].map((item) => (
            <div key={item.example} className="flex items-center gap-3 p-2.5 rounded-lg bg-sage-50 border border-sage-100">
              <span className="text-sm shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-navy-800 text-xs font-medium">{item.example}</p>
                <p className="text-navy-400 text-[10px]">{item.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone cards */}
      <div className="mt-8 space-y-4">
        {completedMilestones.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No completed milestones added yet.</p>
            <p className="text-muted-foreground text-xs">
              Add each significant achievement to date — even small ones demonstrate progress and execution ability.
            </p>
          </div>
        ) : (
          completedMilestones.map((m: MilestoneEntry, i: number) => (
            <CompletedMilestoneCard
              key={m.id}
              milestone={m}
              index={i}
              onUpdate={(changes) => upd(m.id, changes)}
              onRemove={() => remove(m.id)}
            />
          ))
        )}

        <button
          onClick={add}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Completed Milestone
        </button>
      </div>

      {completedMilestones.length > 0 && (
        <div className="mt-5 p-4 bg-sage-50 border border-sage-200 rounded-xl">
          <p className="text-sage-700 text-sm font-semibold mb-1">
            {completedMilestones.length} milestone{completedMilestones.length !== 1 ? "s" : ""} achieved
          </p>
          <p className="text-sage-600 text-xs">
            These demonstrate real-world execution and progress. They form the foundation of your traction narrative in the Executive Summary.
          </p>
        </div>
      )}

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>Pre-launch businesses:</strong> It's fine to have zero completed milestones — but even then, document preparatory steps (research done, advisors engaged, market validated). A completely empty milestones section for a business that has been planning for 6 months raises questions.
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

function CompletedMilestoneCard({
  milestone,
  index,
  onUpdate,
  onRemove,
}: {
  milestone: MilestoneEntry;
  index: number;
  onUpdate: (changes: Partial<MilestoneEntry>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-sage-200 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-sage-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          ✓
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm truncate">
            {milestone.title || `Achievement ${index + 1} — click to expand`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {milestone.completedDate && (
              <span className="text-muted-foreground text-xs">{fmtDate(milestone.completedDate)}</span>
            )}
            {milestone.category && (
              <span className="text-muted-foreground text-xs">· {milestone.category}</span>
            )}
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={`text-navy-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M2 4l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-3 border-t border-sage-100 bg-white space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Milestone Title"
              value={milestone.title}
              onChange={(v) => onUpdate({ title: v })}
              placeholder="e.g. Business registered with ASIC"
              required
            />
            <div>
              <label className="input-label">Date Completed</label>
              <p className="text-xs text-muted-foreground mb-1.5">Month and year is sufficient</p>
              <input
                type="month"
                value={milestone.completedDate || ""}
                onChange={(e) => onUpdate({ completedDate: e.target.value })}
                className="w-full border border-input bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Category</label>
            <select
              value={milestone.category || ""}
              onChange={(e) => onUpdate({ category: e.target.value })}
              className="w-full border border-input bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
            >
              <option value="">Select category…</option>
              {MILESTONE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <TextAreaField
            label="Achievement / What Was Accomplished"
            value={milestone.achievementNote || ""}
            onChange={(v) => onUpdate({ achievementNote: v })}
            placeholder="Describe what was specifically achieved. Include any relevant numbers — customers acquired, revenue earned, cost saved, time reduced. Be specific."
            rows={3}
            helpText="Specific outcomes are more compelling than vague descriptions."
          />

          <div className="pt-2 border-t border-border">
            <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Remove milestone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 02 — Future Milestones ───────────────────────────────────────────────────
function MSFuture({ milestones, futureMilestones, updateMilestones, status, markComplete, onNext, onPrev, plan }: any) {
  const add = () => {
    const newMilestone: MilestoneEntry = {
      id: generateId(),
      title: "",
      targetDate: "",
      targetQuarter: "",
      successMeasure: "",
      responsiblePerson: "",
      dependencies: "",
      estimatedCost: 0,
      description: "",
      status: "planned",
      isCompleted: false,
      category: "",
    };
    updateMilestones([...milestones, newMilestone]);
  };

  const upd = (id: string, changes: Partial<MilestoneEntry>) =>
    updateMilestones(milestones.map((m: MilestoneEntry) => (m.id === id ? { ...m, ...changes } : m)));

  const remove = (id: string) =>
    updateMilestones(milestones.filter((m: MilestoneEntry) => m.id !== id));

  // Pull revenue targets from Financial Plan
  const salesAssumptions = (plan as any)?.financialPlan?.salesAssumptions || [];
  const hasRevenueTargets = salesAssumptions.length > 0;
  const year1Revenue = salesAssumptions.reduce((s: number, a: any) => {
    return s + Array.from({ length: 12 }, (_, i) =>
      (a.price || 0) * (a.unitsPerMonth || 0) * Math.pow(1 + (a.growthRateMonthly || 0) / 100, i)
    ).reduce((sum: number, v: number) => sum + v, 0);
  }, 0);

  // Pull funding timeline from Funding Request
  const fundingRequired = (plan as any)?.fundingRequest?.requiresFunding;
  const fundingAmount = (plan as any)?.fundingRequest?.totalFundingRequired;

  // Check for any future milestones that are overdue (target in the past)
  const today = new Date();
  const overdueMilestones = futureMilestones.filter((m: MilestoneEntry) => {
    if (!m.targetDate || m.status === "completed") return false;
    const target = new Date(m.targetDate + "-01");
    return target < today;
  });

  return (
    <div>
      <TopicHeader
        phase="Milestones"
        phaseNumber={10}
        topicNumber={2}
        topicTitle="Future Milestones"
        estimatedMinutes={15}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What makes a good milestone?</h3>
        <p className="text-navy-700 mb-3">
          A milestone is a significant, time-bound event — not a task list. Good milestones are specific, measurable, and tied to a clear date. They represent meaningful inflection points in the business: first revenue, break-even, a key hire, a product launch, a market entry.
        </p>
        <p className="text-navy-700">
          Milestones bridge strategy and execution. They show that you know what needs to happen, in what order, by when — and that you've thought about dependencies and who is responsible.
        </p>
      </EducationPanel>

      {/* Reference from Financial Plan */}
      {hasRevenueTargets && year1Revenue > 0 && (
        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-2">
            Revenue targets from Financial Plan
          </p>
          <p className="text-blue-700 text-sm">
            Year 1 projected revenue: <strong>{fmt(Math.round(year1Revenue))}</strong> — consider adding milestones for revenue targets (e.g. "Reach $X/month by Month 6", "Hit break-even by Month 9").
          </p>
        </div>
      )}

      {fundingRequired === true && fundingAmount > 0 && (
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 text-xs font-semibold uppercase tracking-wide mb-2">
            Funding timeline from Funding Request
          </p>
          <p className="text-amber-700 text-sm">
            Funding required: <strong>{fmt(fundingAmount)}</strong> — add a milestone for when funding is expected to be secured, as it may unlock other milestones.
          </p>
        </div>
      )}

      {/* Milestone guidance */}
      <div className="mt-5 bg-white border border-border rounded-xl overflow-hidden">
        <div className="bg-navy-900 px-5 py-3">
          <p className="text-white font-semibold text-sm">Examples of strong future milestones</p>
        </div>
        <div className="p-5 space-y-2">
          {[
            { title: "First 10 paying customers acquired", cat: "Customer Acquisition", timing: "Month 2" },
            { title: "Monthly recurring revenue exceeds $5,000", cat: "Revenue Target", timing: "Month 4" },
            { title: "Break-even revenue achieved", cat: "Revenue Target", timing: "Month 9" },
            { title: "First full-time hire made (Operations Manager)", cat: "Hiring / Team", timing: "Month 6" },
            { title: "Bank loan of $50,000 approved and drawn down", cat: "Funding / Investment", timing: "Month 1" },
            { title: "E-commerce platform launched", cat: "Technology / Infrastructure", timing: "Month 3" },
            { title: "Trading licence received", cat: "Legal / Regulatory", timing: "Month 1" },
            { title: "Partnership with [Distributor X] formalised", cat: "Partnerships", timing: "Month 5" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mt-1.5" />
              <div className="flex-1">
                <p className="text-navy-800 text-sm">{item.title}</p>
                <p className="text-navy-400 text-xs">{item.cat} · {item.timing}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone cards */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-navy-900">Future Milestones</h3>
          <button
            onClick={add}
            className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Milestone
          </button>
        </div>

        {futureMilestones.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No future milestones added yet.</p>
            <p className="text-muted-foreground text-xs">
              Aim for 6–12 milestones covering the first 12–24 months of operations.
            </p>
          </div>
        ) : (
          futureMilestones.map((m: MilestoneEntry, i: number) => (
            <FutureMilestoneCard
              key={m.id}
              milestone={m}
              index={i}
              onUpdate={(changes) => upd(m.id, changes)}
              onRemove={() => remove(m.id)}
            />
          ))
        )}

        <button
          onClick={add}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Future Milestone
        </button>
      </div>

      {overdueMilestones.length > 0 && (
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 text-sm font-semibold mb-1">
            {overdueMilestones.length} milestone{overdueMilestones.length !== 1 ? "s are" : " is"} past their target date
          </p>
          <p className="text-amber-700 text-sm">
            {overdueMilestones.map((m: MilestoneEntry) => m.title || "Unnamed").join(", ")} — update their status or revise the target date.
          </p>
        </div>
      )}

      {futureMilestones.length >= 5 && (
        <div className="mt-5 p-4 bg-navy-50 border border-navy-200 rounded-xl grid grid-cols-3 gap-4 text-center">
          {(["planned", "in_progress", "at_risk"] as const).map((s) => {
            const count = futureMilestones.filter((m: MilestoneEntry) => m.status === s).length;
            const style = STATUS_STYLES[s];
            return (
              <div key={s} className={`rounded-xl p-3 border ${style.bg} ${style.border}`}>
                <p className={`font-bold text-2xl ${style.text}`}>{count}</p>
                <p className={`text-xs font-medium mt-0.5 ${style.text}`}>{style.label}</p>
              </div>
            );
          })}
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

function FutureMilestoneCard({
  milestone,
  index,
  onUpdate,
  onRemove,
}: {
  milestone: MilestoneEntry;
  index: number;
  onUpdate: (changes: Partial<MilestoneEntry>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const style = STATUS_STYLES[milestone.status] || STATUS_STYLES.planned;
  const quarter = dateToQuarter(milestone.targetDate);

  return (
    <div className={`rounded-xl border overflow-hidden ${milestone.status === "at_risk" ? "border-amber-300" : "border-border"}`}>
      <button
        className="w-full flex items-center gap-3 px-5 py-4 bg-white hover:bg-navy-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm truncate">
            {milestone.title || `Future milestone ${index + 1} — click to expand`}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {quarter && <span className="text-muted-foreground text-xs">{quarter}</span>}
            {milestone.category && <span className="text-muted-foreground text-xs">· {milestone.category}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            {style.label}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={`text-navy-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M2 4l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-3 border-t border-border bg-white space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Milestone Title"
              value={milestone.title}
              onChange={(v) => onUpdate({ title: v })}
              placeholder="e.g. First paying customer acquired"
              required
            />
            <div>
              <label className="input-label">Target Date</label>
              <p className="text-xs text-muted-foreground mb-1.5">Month and year target</p>
              <input
                type="month"
                value={milestone.targetDate || ""}
                onChange={(e) => onUpdate({ targetDate: e.target.value })}
                className="w-full border border-input bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
              {quarter && (
                <p className="text-xs text-navy-500 mt-1">
                  <span className="font-semibold">{quarter}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Category</label>
              <select
                value={milestone.category || ""}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="w-full border border-input bg-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
              >
                <option value="">Select…</option>
                {MILESTONE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Status</label>
              <div className="flex gap-1.5 mt-1">
                {(["planned", "in_progress", "at_risk"] as const).map((s) => {
                  const st = STATUS_STYLES[s];
                  return (
                    <button
                      key={s}
                      onClick={() => onUpdate({ status: s })}
                      className={`flex-1 py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                        milestone.status === s
                          ? `${st.bg} ${st.text} ${st.border} border-current`
                          : "bg-white border-border text-navy-500 hover:border-navy-300"
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <TextAreaField
            label="Success Measure"
            value={milestone.successMeasure || ""}
            onChange={(v) => onUpdate({ successMeasure: v })}
            placeholder="How will you know this milestone has been achieved? Be specific and measurable. e.g. 'Monthly revenue exceeds $10,000 for two consecutive months' rather than 'business is profitable.'"
            rows={3}
            required
            helpText="A milestone without a measurable success criterion is just a wish."
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Responsible Person"
              value={milestone.responsiblePerson || ""}
              onChange={(v) => onUpdate({ responsiblePerson: v })}
              placeholder="e.g. Founder/CEO, Marketing Manager"
              helpText="Who owns achieving this milestone?"
            />
            <div>
              <label className="input-label">Estimated Cost (if any)</label>
              <p className="text-xs text-muted-foreground mb-1.5">Leave $0 if no direct cost</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={milestone.estimatedCost || ""}
                  onChange={(e) => onUpdate({ estimatedCost: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full border border-input bg-white pl-8 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
                />
              </div>
            </div>
          </div>

          <TextAreaField
            label="Dependencies"
            value={milestone.dependencies || ""}
            onChange={(v) => onUpdate({ dependencies: v })}
            placeholder="What must happen before this milestone can be achieved? e.g. Funding secured, hire made, technology built, licence received. Unresolved dependencies are a risk."
            rows={2}
            helpText="Identifying dependencies reveals the critical path through your milestone plan."
          />

          <TextAreaField
            label="Description / Notes (optional)"
            value={milestone.description || ""}
            onChange={(v) => onUpdate({ description: v })}
            placeholder="Any additional context, background, or notes about this milestone."
            rows={2}
          />

          <div className="pt-2 border-t border-border">
            <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 font-medium">
              Remove milestone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 03 — Timeline ────────────────────────────────────────────────────────────
function MSTimeline({ milestones, completedMilestones, futureMilestones, status, markComplete, onNext, onPrev, onNavigate }: any) {
  // Group milestones by quarter
  const grouped = useMemo(() => {
    const map: Record<string, MilestoneEntry[]> = {};

    // Completed milestones
    completedMilestones.forEach((m: MilestoneEntry) => {
      const q = dateToQuarter(m.completedDate) || "Date Unknown";
      if (!map[q]) map[q] = [];
      map[q].push(m);
    });

    // Future milestones
    futureMilestones.forEach((m: MilestoneEntry) => {
      const q = dateToQuarter(m.targetDate) || "Date TBD";
      if (!map[q]) map[q] = [];
      map[q].push(m);
    });

    return map;
  }, [completedMilestones, futureMilestones]);

  // Sort quarters chronologically
  const sortedQuarters = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const parseQ = (q: string) => {
        const match = q.match(/Q(\d) (\d{4})/);
        if (!match) return 99999;
        return parseInt(match[2]) * 10 + parseInt(match[1]);
      };
      return parseQ(a) - parseQ(b);
    });
  }, [grouped]);

  const totalMilestones = milestones.length;
  const completedCount = completedMilestones.length;
  const progressPct = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;

  const hasMilestones = milestones.length > 0;

  return (
    <div>
      <TopicHeader
        phase="Milestones"
        phaseNumber={10}
        topicNumber={3}
        topicTitle="Timeline"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700">
          The timeline below groups all your milestones — completed and future — by quarter. Review the sequencing: does the order make sense? Are dependencies respected? Does the pace of milestones match your financial projections and funding timeline?
        </p>
      </EducationPanel>

      {!hasMilestones ? (
        <div className="mt-8 bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm mb-2">No milestones added yet.</p>
          <p className="text-muted-foreground text-xs mb-4">
            Return to the previous topics to add completed and future milestones before reviewing the timeline.
          </p>
          <button
            onClick={() => onNavigate("milestones", "ms_completed")}
            className="text-navy-700 text-sm font-semibold hover:underline"
          >
            ← Add Milestones
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Progress bar */}
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-navy-700 text-sm font-semibold">Overall Milestone Progress</p>
              <p className="text-navy-500 text-xs">{completedCount} of {totalMilestones} achieved</p>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full bg-sage-500 transition-all"
                style={{ width: `${progressPct.toFixed(0)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sage-600 text-xs font-medium">{completedCount} completed</p>
              <p className="text-navy-400 text-xs">{futureMilestones.length} upcoming</p>
            </div>
          </div>

          {/* Quarterly timeline */}
          <div className="space-y-0">
            {sortedQuarters.map((quarter, qIdx) => {
              const qMilestones = grouped[quarter];
              const isKnownQuarter = /Q\d \d{4}/.test(quarter);
              const completedInQ = qMilestones.filter((m: MilestoneEntry) => m.isCompleted).length;
              const isAllDone = qMilestones.every((m: MilestoneEntry) => m.isCompleted);

              return (
                <div key={quarter} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                      isAllDone
                        ? "bg-sage-500 border-sage-500 text-white"
                        : "bg-white border-navy-300 text-navy-600"
                    }`}>
                      {isAllDone ? "✓" : (qIdx + 1)}
                    </div>
                    {qIdx < sortedQuarters.length - 1 && (
                      <div className="w-0.5 flex-1 bg-navy-200 my-1" />
                    )}
                  </div>

                  {/* Quarter content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className={`font-bold text-sm ${isKnownQuarter ? "text-navy-900" : "text-navy-400"}`}>
                        {quarter}
                      </h3>
                      <span className="text-navy-400 text-xs">
                        · {qMilestones.length} milestone{qMilestones.length !== 1 ? "s" : ""}
                        {completedInQ > 0 && ` · ${completedInQ} done`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {qMilestones.map((m: MilestoneEntry) => {
                        const style = m.isCompleted ? STATUS_STYLES.completed : (STATUS_STYLES[m.status] || STATUS_STYLES.planned);
                        return (
                          <div
                            key={m.id}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.bg} ${style.border}`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${m.isCompleted ? "text-navy-700" : "text-navy-900"}`}>
                                {m.title || "Unnamed milestone"}
                              </p>
                              {m.category && (
                                <p className={`text-xs mt-0.5 ${style.text}`}>{m.category}</p>
                              )}
                              {m.successMeasure && (
                                <p className="text-navy-500 text-xs mt-1 line-clamp-2">
                                  ✓ {m.successMeasure}
                                </p>
                              )}
                              {m.achievementNote && (
                                <p className="text-sage-600 text-xs mt-1 line-clamp-2">
                                  🏆 {m.achievementNote}
                                </p>
                              )}
                              {m.dependencies && (
                                <p className="text-amber-600 text-xs mt-1">
                                  ⚠ Depends on: {m.dependencies.slice(0, 60)}{m.dependencies.length > 60 ? "…" : ""}
                                </p>
                              )}
                              {m.responsiblePerson && !m.isCompleted && (
                                <p className="text-navy-400 text-xs mt-1">👤 {m.responsiblePerson}</p>
                              )}
                            </div>
                            <div className="shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                                {style.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          {totalMilestones >= 4 && (
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-navy-900 text-sm mb-3">Milestones by Category</h3>
              <div className="space-y-2">
                {(() => {
                  const byCat: Record<string, number> = {};
                  milestones.forEach((m: MilestoneEntry) => {
                    const cat = m.category || "Uncategorised";
                    byCat[cat] = (byCat[cat] || 0) + 1;
                  });
                  return Object.entries(byCat)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-navy-600 text-xs w-44 shrink-0 truncate">{cat}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-navy-700"
                            style={{ width: `${(count / totalMilestones) * 100}%` }}
                          />
                        </div>
                        <span className="text-navy-600 text-xs font-semibold w-4 text-right shrink-0">{count}</span>
                      </div>
                    ));
                })()}
              </div>
            </div>
          )}

          {/* Sequencing tips */}
          <EducationPanel variant="tip">
            <p className="text-sage-700 font-medium mb-2">Timeline review checklist</p>
            <ul className="space-y-1.5 text-sage-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span>Do milestones that depend on funding appear after the funding milestone?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span>Do hiring milestones precede capacity-dependent revenue milestones?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span>Does your revenue trajectory align with financial projections?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span>Is there at least one milestone per quarter in Year 1?</span>
              </li>
            </ul>
          </EducationPanel>
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
function MSReview({ milestones, completedMilestones, futureMilestones, status, markComplete, onNext, onPrev, onNavigate, plan }: any) {
  const totalMilestones = milestones.length;
  const futurePlanned = futureMilestones.filter((m: MilestoneEntry) => m.status === "planned").length;
  const futureInProgress = futureMilestones.filter((m: MilestoneEntry) => m.status === "in_progress").length;
  const futureAtRisk = futureMilestones.filter((m: MilestoneEntry) => m.status === "at_risk").length;
  const withSuccessMeasure = futureMilestones.filter((m: MilestoneEntry) => m.successMeasure && m.successMeasure.trim().length > 10).length;
  const withResponsible = futureMilestones.filter((m: MilestoneEntry) => m.responsiblePerson && m.responsiblePerson.trim().length > 0).length;
  const withDependencies = futureMilestones.filter((m: MilestoneEntry) => m.dependencies && m.dependencies.trim().length > 0).length;

  // Cross-check: Financial Plan revenue targets
  const salesAssumptions = (plan as any)?.financialPlan?.salesAssumptions || [];
  const hasFinancialPlan = salesAssumptions.length > 0;
  const revenueInMilestones = milestones.some((m: MilestoneEntry) =>
    (m.title + " " + (m.successMeasure || "")).toLowerCase().includes("revenue") ||
    (m.category || "").includes("Revenue")
  );

  // Cross-check: Funding milestones
  const fundingRequired = (plan as any)?.fundingRequest?.requiresFunding;
  const fundingInMilestones = milestones.some((m: MilestoneEntry) =>
    (m.title + " " + (m.category || "")).toLowerCase().includes("fund") ||
    (m.category || "").includes("Funding")
  );

  // Cross-check: Hiring plan from Organization
  const hiringPlan = (plan as any)?.organization?.hiringPlan;
  const hiringInMilestones = milestones.some((m: MilestoneEntry) =>
    (m.category || "").includes("Hiring") ||
    (m.title + " " + (m.successMeasure || "")).toLowerCase().includes("hire") ||
    (m.title + " " + (m.successMeasure || "")).toLowerCase().includes("staff")
  );

  const missingSuccessMeasures = futureMilestones.length - withSuccessMeasure;
  const isComplete = futureMilestones.length >= 5 && withSuccessMeasure >= Math.ceil(futureMilestones.length * 0.7);

  // Sort future milestones by target date for the "next milestones" panel
  const nextMilestones = [...futureMilestones]
    .filter((m: MilestoneEntry) => m.status !== "cancelled")
    .sort((a: MilestoneEntry, b: MilestoneEntry) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return a.targetDate.localeCompare(b.targetDate);
    })
    .slice(0, 5);

  return (
    <div>
      <TopicHeader
        phase="Milestones"
        phaseNumber={10}
        topicNumber={4}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Warnings */}
      {futureMilestones.length < 5 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 font-semibold text-sm mb-1">
            Only {futureMilestones.length} future milestone{futureMilestones.length !== 1 ? "s" : ""} — aim for at least 5
          </p>
          <p className="text-amber-700 text-sm">
            A credible milestones plan covers key events across at least 12 months of operations.
          </p>
          <button
            onClick={() => onNavigate("milestones", "ms_future")}
            className="text-amber-700 text-xs font-semibold mt-2 hover:underline"
          >
            Add more milestones →
          </button>
        </div>
      )}

      {missingSuccessMeasures > 0 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 font-semibold text-sm mb-1">
            {missingSuccessMeasures} future milestone{missingSuccessMeasures !== 1 ? "s" : ""} missing success measures
          </p>
          <p className="text-amber-700 text-sm">
            Milestones without measurable success criteria are not credible. Add a specific, measurable target for each.
          </p>
          <button
            onClick={() => onNavigate("milestones", "ms_future")}
            className="text-amber-700 text-xs font-semibold mt-2 hover:underline"
          >
            Complete milestone details →
          </button>
        </div>
      )}

      {futureAtRisk > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 font-semibold text-sm mb-1">
            {futureAtRisk} milestone{futureAtRisk !== 1 ? "s are" : " is"} marked At Risk
          </p>
          <p className="text-red-700 text-sm">
            {futureMilestones.filter((m: MilestoneEntry) => m.status === "at_risk").map((m: MilestoneEntry) => m.title || "Unnamed").join(", ")} — document the risk and mitigation in the Risks & Mitigation phase.
          </p>
        </div>
      )}

      {/* Cross-checks */}
      <div className="mb-6 space-y-3">
        {hasFinancialPlan && !revenueInMilestones && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="text-blue-500 text-lg shrink-0">💡</span>
            <div>
              <p className="text-blue-800 text-sm font-semibold">No revenue milestones found</p>
              <p className="text-blue-700 text-sm">
                You have revenue projections in your Financial Plan but no revenue targets appear in your milestones. Consider adding milestones for key revenue thresholds (e.g. first $1k month, break-even).
              </p>
            </div>
          </div>
        )}

        {fundingRequired === true && !fundingInMilestones && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="text-blue-500 text-lg shrink-0">💡</span>
            <div>
              <p className="text-blue-800 text-sm font-semibold">No funding milestone found</p>
              <p className="text-blue-700 text-sm">
                Your Funding Request section indicates external funding is required, but no funding milestone appears here. Add a milestone for when funding is expected to be secured.
              </p>
            </div>
          </div>
        )}

        {hiringPlan && !hiringInMilestones && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <span className="text-blue-500 text-lg shrink-0">💡</span>
            <div>
              <p className="text-blue-800 text-sm font-semibold">Hiring plan not reflected in milestones</p>
              <p className="text-blue-700 text-sm">
                Your Organization phase includes a hiring plan, but no hiring milestones appear here. Add milestones for key hires to show the connection between team growth and operational scaling.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Milestone summary */}
      {totalMilestones > 0 && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Milestone Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
            <div className="bg-sage-50 border border-sage-200 rounded-xl p-3">
              <p className="font-bold text-sage-700 text-2xl">{completedMilestones.length}</p>
              <p className="text-sage-600 text-xs mt-0.5">Achieved</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="font-bold text-blue-700 text-2xl">{futureInProgress}</p>
              <p className="text-blue-600 text-xs mt-0.5">In Progress</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-700 text-2xl">{futurePlanned}</p>
              <p className="text-slate-500 text-xs mt-0.5">Planned</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-3">
              <p className="font-bold text-navy-900 text-2xl">{totalMilestones}</p>
              <p className="text-navy-400 text-xs mt-0.5">Total</p>
            </div>
          </div>

          {/* Quality indicators */}
          <div className="space-y-2">
            {[
              {
                label: "Have a success measure",
                count: withSuccessMeasure,
                total: futureMilestones.length,
                important: true,
              },
              {
                label: "Have a responsible person",
                count: withResponsible,
                total: futureMilestones.length,
                important: false,
              },
              {
                label: "Have dependencies documented",
                count: withDependencies,
                total: futureMilestones.length,
                important: false,
              },
            ].map((item) => {
              const pct = item.total > 0 ? (item.count / item.total) * 100 : 0;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-navy-600 text-xs w-44 shrink-0">{item.label}</span>
                  <div className="flex-1 bg-white rounded-full h-2 border border-border">
                    <div
                      className={`h-2 rounded-full ${pct >= 70 ? "bg-sage-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${pct.toFixed(0)}%` }}
                    />
                  </div>
                  <span className="text-navy-600 text-xs font-semibold w-10 text-right shrink-0">
                    {item.count}/{item.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next 5 milestones */}
      {nextMilestones.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-navy-900 text-sm mb-3">
            Next {nextMilestones.length} Milestone{nextMilestones.length !== 1 ? "s" : ""}
          </h3>
          <div className="space-y-2">
            {nextMilestones.map((m: MilestoneEntry) => {
              const style = STATUS_STYLES[m.status] || STATUS_STYLES.planned;
              const q = dateToQuarter(m.targetDate);
              return (
                <div key={m.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${style.bg} ${style.border}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy-900 text-sm line-clamp-1">{m.title || "Unnamed milestone"}</p>
                    {q && <p className={`text-xs mt-0.5 ${style.text}`}>{q}</p>}
                  </div>
                  {m.responsiblePerson && (
                    <p className="text-navy-400 text-xs shrink-0 hidden sm:block">{m.responsiblePerson}</p>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isComplete ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Milestones is complete. You're ready for the Executive Summary — the final phase where you'll pull together the most compelling elements from across the entire plan.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {futureMilestones.length < 5
              ? `Add at least ${5 - futureMilestones.length} more future milestone(s) to reach the recommended minimum of 5. `
              : ""}
            {missingSuccessMeasures > 0
              ? `${missingSuccessMeasures} milestone(s) still need measurable success criteria. `
              : ""}
            Return to Future Milestones to complete the plan.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Executive Summary →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
