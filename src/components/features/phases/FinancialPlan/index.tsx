import React, { useState, useMemo } from "react";
import { BusinessPlan, Product } from "@/types/businessPlan";
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
const PHASE = PHASES.find((p) => p.id === "financial_plan")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Data types ───────────────────────────────────────────────────────────────
export interface StartupCostItem {
  id: string;
  category: string;
  item: string;
  type: "one_time" | "ongoing";
  amount: number;
  notes?: string;
}

export interface SalesAssumption {
  id: string;
  offeringId?: string;
  offeringName: string;
  price: number;
  unitsPerMonth: number;
  growthRateMonthly: number; // %
  seasonalityNotes?: string;
  reasoning?: string;
}

export interface FixedExpense {
  id: string;
  category: string;
  item: string;
  monthlyAmount: number;
  notes?: string;
}

export interface VariableExpense {
  id: string;
  item: string;
  percentOfRevenue: number;
  notes?: string;
}

export interface PayrollItem {
  id: string;
  role: string;
  headcount: number;
  monthlySalary: number;
  startMonth: number; // 1-12
  notes?: string;
}

export interface FPData {
  // Startup costs
  startupCosts?: StartupCostItem[];
  startupFundingSource?: string;
  // Sales assumptions
  salesAssumptions?: SalesAssumption[];
  revenueNotes?: string;
  // Expenses
  fixedExpenses?: FixedExpense[];
  variableExpenses?: VariableExpense[];
  expenseNotes?: string;
  // Payroll
  payrollItems?: PayrollItem[];
  payrollNotes?: string;
  // Scenarios
  scenarioOptimistic?: string;
  scenarioBase?: string;
  scenarioPessimistic?: string;
  scenarioAssumptions?: string;
  // Misc
  accountingMethod?: "cash" | "accrual";
  fiscalYearStart?: string;
  currency?: string;
  financialNotes?: string;
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
  if (Math.abs(n) >= 1000) return "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
  return "$" + n.toFixed(2);
}

function fmtK(n: number) {
  if (Math.abs(n) >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
  return "$" + Math.round(n);
}

function numColor(n: number) {
  if (n > 0) return "text-sage-600";
  if (n < 0) return "text-red-600";
  return "text-navy-600";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─── Compute 12-month financials from FPData ──────────────────────────────────
function computeMonthlyFinancials(fp: FPData, offerings: Product[]) {
  const assumptions = fp.salesAssumptions || [];
  const fixedExpenses = fp.fixedExpenses || [];
  const variableExpenses = fp.variableExpenses || [];
  const payroll = fp.payrollItems || [];

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;

    // Revenue per assumption
    let totalRevenue = 0;
    let totalCOGS = 0;

    assumptions.forEach((a) => {
      const units = a.unitsPerMonth * Math.pow(1 + (a.growthRateMonthly || 0) / 100, i);
      const rev = units * a.price;
      totalRevenue += rev;
      // Find matching offering for COGS
      const offering = offerings.find((o) => o.id === a.offeringId || o.name === a.offeringName);
      const cogs = offering?.directCosts ? units * offering.directCosts : 0;
      totalCOGS += cogs;
    });

    // Fixed expenses
    const totalFixed = fixedExpenses.reduce((s, e) => s + (e.monthlyAmount || 0), 0);

    // Variable expenses
    const totalVariable = variableExpenses.reduce(
      (s, e) => s + totalRevenue * ((e.percentOfRevenue || 0) / 100),
      0
    );

    // Payroll (only for roles that start at or before this month)
    const totalPayroll = payroll
      .filter((p) => p.startMonth <= monthNum)
      .reduce((s, p) => s + (p.monthlySalary || 0) * (p.headcount || 1), 0);

    const grossProfit = totalRevenue - totalCOGS;
    const totalOpEx = totalFixed + totalVariable + totalPayroll;
    const ebitda = grossProfit - totalOpEx;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      month: i,
      label: MONTHS[i],
      revenue: totalRevenue,
      cogs: totalCOGS,
      grossProfit,
      grossMarginPct,
      fixed: totalFixed,
      variable: totalVariable,
      payroll: totalPayroll,
      opex: totalOpEx,
      ebitda,
    };
  });

  return months;
}

// ─── Phase root ───────────────────────────────────────────────────────────────
export default function FinancialPlanPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const fp: FPData = (plan as any).financialPlan || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";
  const offerings: Product[] = (plan as any).productsServices?.offerings || [];

  const update = (changes: Partial<FPData>) => {
    onUpdatePlan({ financialPlan: { ...fp, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next ? onNavigate("financial_plan", nav.next.id) : onNavigate("funding", "fund_intro");
  const handlePrev = () =>
    nav.prev ? onNavigate("financial_plan", nav.prev.id) : onNavigate("operations", "op_review");

  const monthlyData = useMemo(
    () => computeMonthlyFinancials(fp, offerings),
    [fp, offerings]
  );

  const sharedProps = {
    fp,
    update,
    status,
    markComplete,
    onNext: handleNext,
    onPrev: handlePrev,
    onNavigate,
    plan,
    offerings,
    monthlyData,
  };

  const renderTopic = () => {
    switch (currentTopic) {
      case "fp_intro":         return <FPIntro {...sharedProps} />;
      case "fp_startup_costs": return <FPStartupCosts {...sharedProps} />;
      case "fp_assumptions":   return <FPAssumptions {...sharedProps} />;
      case "fp_revenue":       return <FPRevenue {...sharedProps} />;
      case "fp_cogs":          return <FPCOGS {...sharedProps} />;
      case "fp_expenses":      return <FPExpenses {...sharedProps} />;
      case "fp_payroll":       return <FPPayroll {...sharedProps} />;
      case "fp_pnl":           return <FPPnL {...sharedProps} />;
      case "fp_cashflow":      return <FPCashFlow {...sharedProps} />;
      case "fp_breakeven":     return <FPBreakeven {...sharedProps} />;
      case "fp_scenarios":     return <FPScenarios {...sharedProps} />;
      case "fp_review":        return <FPReview {...sharedProps} />;
      default:                 return <FPIntro {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Phase header ─────────────────────────────────────────────────────────────
function FPPhaseHeader() {
  return (
    <div className="mb-8 p-5 rounded-xl bg-navy-900 text-white">
      <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
        Phase 7
      </p>
      <h2 className="font-serif text-2xl font-bold leading-tight mb-1">Financial Plan</h2>
      <p className="text-white/65 text-sm">
        Build your financial model from the ground up — with real numbers, real assumptions, and real projections
      </p>
    </div>
  );
}

// ─── 01 — Financial Concepts ──────────────────────────────────────────────────
function FPIntro({ fp, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <FPPhaseHeader />
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={1}
        topicTitle="Financial Concepts"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Many first-time business plan writers dread the financial section — not because the numbers are hard, but because the concepts are unfamiliar. This topic walks you through the core concepts you need to understand before you start entering numbers.
        </p>
        <p className="text-navy-700">
          You don't need to be an accountant. You need to understand what each financial statement measures and how the pieces connect. Everything else is arithmetic.
        </p>
      </EducationPanel>

      {/* Core concepts */}
      <div className="mt-8 space-y-5">
        <h3 className="font-semibold text-navy-900 text-base">The three things every business must understand</h3>

        {/* Revenue vs Profit */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">1. Revenue vs Profit</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4 border border-navy-200">
                <p className="font-bold text-navy-900 text-sm mb-1">Revenue (Turnover)</p>
                <p className="text-navy-700 text-sm">The total money coming in from sales, before any costs are deducted.</p>
                <p className="text-navy-500 text-xs mt-2 font-mono">Units Sold × Price = Revenue</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="font-bold text-navy-900 text-sm mb-1">Profit (Net Income)</p>
                <p className="text-navy-700 text-sm">What is left after ALL costs — including COGS, expenses, payroll, and taxes — are subtracted from revenue.</p>
                <p className="text-amber-700 text-xs mt-2 font-mono">Revenue − All Costs = Profit</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-red-800 text-xs font-semibold">Common mistake: confusing high revenue with profitability.</p>
              <p className="text-red-700 text-xs mt-1">A business with $500k revenue and $520k costs is making a $20k loss. Revenue alone tells you nothing about financial health.</p>
            </div>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">2. Gross Margin</p>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-navy-700 text-sm">
              Gross margin is revenue minus the direct costs of producing or delivering your product/service (Cost of Goods Sold — COGS). It measures how much money is left after paying for what you sell, before paying for overheads.
            </p>
            <div className="bg-navy-50 rounded-lg p-4 border border-navy-200 font-mono text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-navy-600">Revenue</span>
                <span className="text-navy-900 font-bold">$10,000</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-navy-600">− Cost of Goods Sold (COGS)</span>
                <span className="text-navy-700">($3,500)</span>
              </div>
              <div className="flex justify-between border-t border-navy-200 pt-2 mt-2">
                <span className="text-navy-900 font-bold">= Gross Profit</span>
                <span className="text-sage-700 font-bold">$6,500</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-navy-500 text-xs">Gross Margin %</span>
                <span className="text-sage-600 text-xs font-bold">65%</span>
              </div>
            </div>
            <p className="text-navy-600 text-xs">
              Gross margin must be high enough to cover all fixed costs and still leave profit. Service businesses often have high gross margins (60–80%+). Product businesses are typically lower (30–60%). Digital businesses can approach 90%+.
            </p>
          </div>
        </div>

        {/* Cash Flow */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">3. Cash Flow vs Profit</p>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-navy-700 text-sm mb-2">
              Cash flow and profit are not the same thing. A profitable business can run out of cash — and many do. Cash flow tracks the actual movement of money in and out of the business, including timing.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-sage-50 rounded-lg p-3 border border-sage-200">
                <p className="font-bold text-navy-900 text-xs mb-1">Cash Flow Positive</p>
                <p className="text-navy-700 text-xs">More cash coming in than going out in a given period. The business can pay its bills.</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="font-bold text-navy-900 text-xs mb-1">Cash Flow Negative</p>
                <p className="text-navy-700 text-xs">More cash going out than coming in. The business is burning through its reserves — common in early months.</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-xs font-semibold">Why it matters:</p>
              <p className="text-amber-700 text-xs mt-1">
                If you invoice $10,000 but the client pays in 30 days, you don't have that cash today. Payroll, rent, and suppliers may not wait. Cash flow projections track when money actually arrives and leaves — preventing surprise insolvencies.
              </p>
            </div>
          </div>
        </div>

        {/* Break-even */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="bg-navy-900 px-5 py-3">
            <p className="text-white font-semibold text-sm">4. Break-Even Point</p>
          </div>
          <div className="p-5">
            <p className="text-navy-700 text-sm mb-3">
              The break-even point is the revenue level at which total income equals total costs — the business is neither making nor losing money. Every dollar of revenue above break-even contributes to profit.
            </p>
            <div className="bg-navy-50 rounded-lg p-4 border border-navy-200 font-mono text-sm">
              <p className="text-navy-700 text-xs mb-2">Formula:</p>
              <p className="text-navy-900 font-bold">Break-Even Revenue = Fixed Costs ÷ Gross Margin %</p>
              <p className="text-navy-500 text-xs mt-2">
                Example: $5,000 fixed costs ÷ 65% gross margin = $7,692 break-even revenue per month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* P&L structure */}
      <div className="mt-6 bg-white border border-border rounded-xl p-5">
        <h3 className="font-semibold text-navy-900 mb-4">What you'll build in this phase</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: "Startup Costs", desc: "One-time and initial ongoing costs" },
            { label: "Sales Assumptions", desc: "Units, pricing, and growth rates per offering" },
            { label: "Revenue Forecast", desc: "12-month projected revenue" },
            { label: "Cost of Sales", desc: "Direct costs per unit × units sold" },
            { label: "Operating Expenses", desc: "Fixed and variable costs" },
            { label: "Payroll", desc: "Team costs by role and start date" },
            { label: "Profit & Loss", desc: "Auto-calculated P&L statement" },
            { label: "Cash Flow", desc: "12-month cash position" },
            { label: "Break-Even Analysis", desc: "Revenue required to cover all costs" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mt-1.5" />
              <div>
                <p className="text-sm font-semibold text-navy-800">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="mt-6 p-5 bg-muted rounded-xl">
        <h3 className="font-semibold text-navy-900 text-sm mb-4">Financial plan settings</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <SelectField
            label="Accounting Method"
            value={fp.accountingMethod || ""}
            onChange={(v) => update({ accountingMethod: v as "cash" | "accrual" })}
            options={[
              { value: "cash", label: "Cash Basis" },
              { value: "accrual", label: "Accrual Basis" },
            ]}
            helpText="Cash: record when paid. Accrual: record when earned."
          />
          <SelectField
            label="Fiscal Year Start"
            value={fp.fiscalYearStart || ""}
            onChange={(v) => update({ fiscalYearStart: v })}
            options={MONTHS.map((m) => ({ value: m, label: m }))}
            helpText="Month your financial year begins"
          />
          <SelectField
            label="Currency"
            value={fp.currency || ""}
            onChange={(v) => update({ currency: v })}
            options={[
              { value: "AUD", label: "AUD — Australian Dollar" },
              { value: "USD", label: "USD — US Dollar" },
              { value: "GBP", label: "GBP — British Pound" },
              { value: "EUR", label: "EUR — Euro" },
              { value: "NZD", label: "NZD — New Zealand Dollar" },
              { value: "CAD", label: "CAD — Canadian Dollar" },
              { value: "SGD", label: "SGD — Singapore Dollar" },
              { value: "ZAR", label: "ZAR — South African Rand" },
              { value: "NGN", label: "NGN — Nigerian Naira" },
              { value: "KES", label: "KES — Kenyan Shilling" },
              { value: "GHS", label: "GHS — Ghanaian Cedi" },
            ]}
            helpText="Currency for all financial figures"
          />
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

// ─── 02 — Startup Costs ───────────────────────────────────────────────────────
const STARTUP_COST_CATEGORIES = [
  "Equipment & Machinery",
  "Vehicles",
  "Website & Technology",
  "Software Subscriptions",
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
  "Other",
];

function FPStartupCosts({ fp, update, status, markComplete, onNext, onPrev }: any) {
  const items: StartupCostItem[] = fp.startupCosts || [];

  const add = () =>
    update({
      startupCosts: [
        ...items,
        { id: generateId(), category: "", item: "", type: "one_time" as const, amount: 0, notes: "" },
      ],
    });

  const upd = (id: string, changes: Partial<StartupCostItem>) =>
    update({ startupCosts: items.map((i) => (i.id === id ? { ...i, ...changes } : i)) });

  const remove = (id: string) =>
    update({ startupCosts: items.filter((i) => i.id !== id) });

  const oneTime = items.filter((i) => i.type === "one_time");
  const ongoing = items.filter((i) => i.type === "ongoing");
  const totalOneTime = oneTime.reduce((s, i) => s + (i.amount || 0), 0);
  const totalOngoing = ongoing.reduce((s, i) => s + (i.amount || 0), 0);
  const grandTotal = totalOneTime + totalOngoing;

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={2}
        topicTitle="Startup Costs"
        estimatedMinutes={15}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What are startup costs?</h3>
        <p className="text-navy-700 mb-3">
          Startup costs are everything you need to spend to get the business to a point where it can begin operating and generating revenue. They fall into two groups:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-lg border border-navy-200 p-3">
            <p className="font-bold text-navy-900 text-xs mb-1">One-Time Costs</p>
            <p className="text-navy-600 text-xs">Spent once to launch — equipment, fit-out, legal fees, initial branding, vehicle purchase.</p>
          </div>
          <div className="bg-white/70 rounded-lg border border-navy-200 p-3">
            <p className="font-bold text-navy-900 text-xs mb-1">Ongoing Setup Costs</p>
            <p className="text-navy-600 text-xs">Monthly costs that begin before revenue starts — rent during setup, insurance, subscriptions, initial payroll.</p>
          </div>
        </div>
      </EducationPanel>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          Add a <strong>Working Capital Reserve</strong> — typically 3–6 months of operating expenses. This is the cash buffer that keeps you afloat while the business builds to profitability. Most startups underestimate how long this takes.
        </p>
      </EducationPanel>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Startup Cost Items</h3>
          <button
            onClick={add}
            className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Cost
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No startup costs added yet.</p>
            <p className="text-muted-foreground text-xs">Document every cost you need to incur before the business begins trading.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Amount ($)</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2">
                        <select
                          value={item.category}
                          onChange={(e) => upd(item.id, { category: e.target.value })}
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        >
                          <option value="">Select…</option>
                          {STARTUP_COST_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={item.item}
                          onChange={(e) => upd(item.id, { item: e.target.value })}
                          placeholder="Describe the cost"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          {(["one_time", "ongoing"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => upd(item.id, { type: t })}
                              className={`flex-1 text-[10px] font-semibold py-1.5 px-2 rounded border transition-all ${
                                item.type === t
                                  ? t === "one_time"
                                    ? "border-navy-700 bg-navy-700 text-white"
                                    : "border-amber-500 bg-amber-50 text-amber-700"
                                  : "border-border bg-white text-navy-500"
                              }`}
                            >
                              {t === "one_time" ? "One-time" : "Ongoing"}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.amount || ""}
                          onChange={(e) => upd(item.id, { amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-right focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 text-xs">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {grandTotal > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">One-Time Costs</p>
              <p className="font-bold text-navy-900 text-lg">{fmt(totalOneTime)}</p>
              <p className="text-navy-400 text-[10px]">{oneTime.length} item(s)</p>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-amber-500 text-[11px] mb-1">Ongoing Setup</p>
              <p className="font-bold text-navy-900 text-lg">{fmt(totalOngoing)}</p>
              <p className="text-navy-400 text-[10px]">{ongoing.length} item(s)</p>
            </div>
            <div className="bg-navy-900 rounded-xl p-4 text-center">
              <p className="text-white/60 text-[11px] mb-1">Total Required</p>
              <p className="font-bold text-white text-lg">{fmt(grandTotal)}</p>
              <p className="text-white/40 text-[10px]">to launch</p>
            </div>
          </div>
        )}

        <div className="mt-5">
          <TextAreaField
            label="Funding Source for Startup Costs"
            value={fp.startupFundingSource || ""}
            onChange={(v) => update({ startupFundingSource: v })}
            placeholder="How will these startup costs be funded? Personal savings, business loan, investor capital, family/friends loan, revenue from a current job? Be specific about how much from each source."
            rows={3}
            helpText="This flows into the Funding Request phase if you are seeking external finance."
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

// ─── 03 — Sales Assumptions ───────────────────────────────────────────────────
function FPAssumptions({ fp, update, status, markComplete, onNext, onPrev, offerings }: any) {
  const assumptions: SalesAssumption[] = fp.salesAssumptions || [];

  const addFromOffering = (offering: Product) => {
    if (assumptions.find((a) => a.offeringId === offering.id || a.offeringName === offering.name)) return;
    update({
      salesAssumptions: [
        ...assumptions,
        {
          id: generateId(),
          offeringId: offering.id,
          offeringName: offering.name || "Unnamed offering",
          price: offering.price || 0,
          unitsPerMonth: 0,
          growthRateMonthly: 0,
          seasonalityNotes: "",
          reasoning: "",
        },
      ],
    });
  };

  const addBlank = () =>
    update({
      salesAssumptions: [
        ...assumptions,
        {
          id: generateId(),
          offeringName: "",
          price: 0,
          unitsPerMonth: 0,
          growthRateMonthly: 0,
        },
      ],
    });

  const upd = (id: string, changes: Partial<SalesAssumption>) =>
    update({ salesAssumptions: assumptions.map((a) => (a.id === id ? { ...a, ...changes } : a)) });

  const remove = (id: string) =>
    update({ salesAssumptions: assumptions.filter((a) => a.id !== id) });

  const linkedOfferings = offerings.map((o: Product) => o.id);
  const alreadyAdded = assumptions.map((a) => a.offeringId).filter(Boolean);
  const pendingOfferings = offerings.filter((o: Product) => !alreadyAdded.includes(o.id));

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={3}
        topicTitle="Sales Assumptions"
        estimatedMinutes={15}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Sales assumptions are the foundation</h3>
        <p className="text-navy-700 mb-3">
          Every revenue figure in your financial model is derived from sales assumptions. This is where you document how many units you expect to sell each month, at what price, and how that changes over time.
        </p>
        <p className="text-navy-700">
          Assumptions must be justified. A projection without documented reasoning is just a wish. For each offering, explain <em>why</em> you expect those numbers based on market research, comparable businesses, or confirmed early demand.
        </p>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Be conservative.</strong> Over-optimistic projections are one of the most common and most credibility-damaging errors in business plans. A realistic forecast with solid reasoning is far more persuasive than an impressive number with no justification.
        </p>
      </EducationPanel>

      {/* Link from Products & Services */}
      {offerings.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-2">
            Offerings from Products & Services phase
          </p>
          <div className="flex flex-wrap gap-2">
            {offerings.map((o: Product) => {
              const isAdded = !!assumptions.find((a) => a.offeringId === o.id || a.offeringName === o.name);
              return (
                <button
                  key={o.id}
                  onClick={() => !isAdded && addFromOffering(o)}
                  disabled={isAdded}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    isAdded
                      ? "border-sage-300 bg-sage-50 text-sage-600 cursor-default"
                      : "border-blue-300 bg-white text-blue-700 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  {isAdded ? "✓ " : "+ "}{o.name || "Unnamed"}
                  {o.price ? ` · $${o.price}` : ""}
                </button>
              );
            })}
          </div>
          <p className="text-blue-600 text-xs mt-2">
            Click to import an offering. Prices are pre-filled from your Products & Services data.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {assumptions.length === 0 && (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No sales assumptions added yet.</p>
            <p className="text-muted-foreground text-xs">Import from Products & Services above, or add manually below.</p>
          </div>
        )}

        {assumptions.map((a, i) => (
          <SalesAssumptionCard
            key={a.id}
            assumption={a}
            index={i}
            onUpdate={(changes) => upd(a.id, changes)}
            onRemove={() => remove(a.id)}
          />
        ))}

        <button
          onClick={addBlank}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors"
        >
          + Add Sales Assumption
        </button>
      </div>

      <div className="mt-5">
        <TextAreaField
          label="Revenue Assumption Notes"
          value={fp.revenueNotes || ""}
          onChange={(v) => update({ revenueNotes: v })}
          placeholder="Explain the basis for your sales assumptions. What research, comparable businesses, or early signals support these numbers? Note any significant changes expected in months 6–12 (ramp-up, seasonal patterns, marketing campaigns)."
          rows={4}
          helpText="A well-reasoned narrative is what makes projections credible."
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

function SalesAssumptionCard({
  assumption,
  index,
  onUpdate,
  onRemove,
}: {
  assumption: SalesAssumption;
  index: number;
  onUpdate: (changes: Partial<SalesAssumption>) => void;
  onRemove: () => void;
}) {
  const monthlyRevenue = assumption.price * assumption.unitsPerMonth;
  const annualRevenue = Array.from({ length: 12 }, (_, i) =>
    assumption.price *
    assumption.unitsPerMonth *
    Math.pow(1 + (assumption.growthRateMonthly || 0) / 100, i)
  ).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-7 h-7 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={assumption.offeringName}
            onChange={(e) => onUpdate({ offeringName: e.target.value })}
            placeholder="Offering / Revenue Stream Name"
            className="w-full font-semibold text-navy-900 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground placeholder:font-normal"
          />
        </div>
        {monthlyRevenue > 0 && (
          <div className="text-right shrink-0">
            <p className="text-navy-700 font-bold text-sm">{fmt(monthlyRevenue)}/mo</p>
            <p className="text-navy-400 text-[10px]">Month 1</p>
          </div>
        )}
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs shrink-0">×</button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="input-label">Price per Unit ($)</label>
            <input
              type="number"
              min="0"
              value={assumption.price || ""}
              onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full border border-input bg-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
            />
          </div>
          <div>
            <label className="input-label">Units / Month (Mth 1)</label>
            <input
              type="number"
              min="0"
              value={assumption.unitsPerMonth || ""}
              onChange={(e) => onUpdate({ unitsPerMonth: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="w-full border border-input bg-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
            />
          </div>
          <div>
            <label className="input-label">Monthly Growth Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={assumption.growthRateMonthly || ""}
              onChange={(e) => onUpdate({ growthRateMonthly: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full border border-input bg-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
            />
            <p className="text-muted-foreground text-[10px] mt-1">% increase each month</p>
          </div>
          <div>
            <label className="input-label">Year 1 Revenue (auto)</label>
            <div className={`border border-input bg-muted px-3 py-2.5 rounded-lg text-sm font-semibold mt-1 ${numColor(annualRevenue)}`}>
              {annualRevenue > 0 ? fmtK(annualRevenue) : "—"}
            </div>
          </div>
        </div>

        <TextAreaField
          label="Reasoning / Evidence"
          value={assumption.reasoning || ""}
          onChange={(v) => onUpdate({ reasoning: v })}
          placeholder="Why these numbers? What research, comparable data, or early indicators support this assumption? Be specific."
          rows={2}
          helpText="This is what separates a credible projection from wishful thinking."
        />

        <TextField
          label="Seasonality / Notes (optional)"
          value={assumption.seasonalityNotes || ""}
          onChange={(v) => onUpdate({ seasonalityNotes: v })}
          placeholder="Any seasonal patterns, launch ramp-up, or demand spikes expected?"
        />
      </div>
    </div>
  );
}

// ─── 04 — Revenue Forecast ────────────────────────────────────────────────────
function FPRevenue({ fp, update, status, markComplete, onNext, onPrev, monthlyData }: any) {
  const totalYear1Revenue = monthlyData.reduce((s: number, m: any) => s + m.revenue, 0);
  const hasData = monthlyData.some((m: any) => m.revenue > 0);

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={4}
        topicTitle="Revenue Forecast"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700">
          Your revenue forecast is auto-calculated from the sales assumptions you entered in the previous topic. Each offering's monthly revenue is calculated as: <strong>Units × Price × (1 + growth rate)^month</strong>. Review the 12-month forecast below and return to Sales Assumptions if the numbers need adjustment.
        </p>
      </EducationPanel>

      {!hasData ? (
        <div className="mt-8 bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm mb-2">No revenue data to display yet.</p>
          <p className="text-muted-foreground text-xs mb-4">Go back to Sales Assumptions and enter your offering assumptions to see the forecast here.</p>
          <button
            onClick={() => {}}
            className="text-navy-700 text-sm font-semibold hover:underline"
          >
            ← Return to Sales Assumptions
          </button>
        </div>
      ) : (
        <div className="mt-8">
          {/* Year 1 summary card */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-navy-900 text-white rounded-xl p-4 text-center">
              <p className="text-white/60 text-[11px] mb-1">Year 1 Total Revenue</p>
              <p className="font-bold text-2xl">{fmtK(totalYear1Revenue)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Month 1 Revenue</p>
              <p className="font-bold text-navy-900 text-2xl">{fmtK(monthlyData[0]?.revenue || 0)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Month 12 Revenue</p>
              <p className="font-bold text-navy-900 text-2xl">{fmtK(monthlyData[11]?.revenue || 0)}</p>
            </div>
          </div>

          {/* Monthly table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Month</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Revenue</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">COGS</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2.5 font-medium text-navy-700">{m.label}</td>
                      <td className="px-4 py-2.5 text-right text-navy-800 font-medium">{fmt(m.revenue)}</td>
                      <td className="px-4 py-2.5 text-right text-navy-600">{m.cogs > 0 ? fmt(m.cogs) : "—"}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${numColor(m.grossProfit)}`}>{fmt(m.grossProfit)}</td>
                      <td className={`px-4 py-2.5 text-right text-sm ${numColor(m.grossMarginPct)}`}>
                        {m.revenue > 0 ? m.grossMarginPct.toFixed(1) + "%" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-200 bg-navy-50 font-bold">
                    <td className="px-4 py-3 text-xs font-bold text-navy-700">Year 1 Total</td>
                    <td className="px-4 py-3 text-right text-navy-900">{fmt(monthlyData.reduce((s: number, m: any) => s + m.revenue, 0))}</td>
                    <td className="px-4 py-3 text-right text-navy-700">{fmt(monthlyData.reduce((s: number, m: any) => s + m.cogs, 0))}</td>
                    <td className={`px-4 py-3 text-right ${numColor(monthlyData.reduce((s: number, m: any) => s + m.grossProfit, 0))}`}>
                      {fmt(monthlyData.reduce((s: number, m: any) => s + m.grossProfit, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-navy-500 text-xs">
                      {totalYear1Revenue > 0
                        ? ((monthlyData.reduce((s: number, m: any) => s + m.grossProfit, 0) / totalYear1Revenue) * 100).toFixed(1) + "%"
                        : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <EducationPanel variant="tip">
            <p className="text-sage-700 text-sm">
              Revenue projections here are calculated from your sales assumptions using compound monthly growth. If revenue seems too low or too high, return to Sales Assumptions and adjust units/growth rates. Gross margin figures will update automatically as you enter COGS data.
            </p>
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

// ─── 05 — Cost of Sales (COGS) ────────────────────────────────────────────────
function FPCOGS({ fp, update, status, markComplete, onNext, onPrev, offerings, monthlyData }: any) {
  const totalCOGS = monthlyData.reduce((s: number, m: any) => s + m.cogs, 0);
  const totalRevenue = monthlyData.reduce((s: number, m: any) => s + m.revenue, 0);
  const avgGrossMargin = totalRevenue > 0
    ? ((totalRevenue - totalCOGS) / totalRevenue) * 100
    : 0;

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={5}
        topicTitle="Cost of Sales"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is Cost of Goods Sold (COGS)?</h3>
        <p className="text-navy-700 mb-3">
          COGS (or Cost of Sales) are the direct, variable costs that increase proportionally with each unit sold. They're the costs that wouldn't exist if you didn't make a sale — materials, direct labour per job, platform fees per transaction, packaging.
        </p>
        <p className="text-navy-700">
          COGS does <strong>not</strong> include fixed overhead like rent, insurance, or salaries that are paid regardless of sales volume. Those belong in Operating Expenses.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">COGS vs Operating Expense examples:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-bold text-navy-600 uppercase mb-1.5">COGS (Variable)</p>
            <ul className="space-y-1 text-navy-700 text-xs">
              <li>• Parts and materials per job</li>
              <li>• Packaging per unit shipped</li>
              <li>• Freelancer cost per project</li>
              <li>• Payment processing fee per transaction</li>
              <li>• Ingredient cost per meal</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-navy-600 uppercase mb-1.5">Op Expenses (Fixed)</p>
            <ul className="space-y-1 text-navy-700 text-xs">
              <li>• Monthly rent</li>
              <li>• Insurance premium</li>
              <li>• Software subscriptions</li>
              <li>• Owner/employee salary</li>
              <li>• Accounting fees</li>
            </ul>
          </div>
        </div>
      </EducationPanel>

      {/* COGS is auto-derived from offering direct costs */}
      <div className="mt-8">
        {offerings.length > 0 ? (
          <div>
            <h3 className="font-semibold text-navy-900 mb-3">COGS derived from your offerings</h3>
            <p className="text-muted-foreground text-sm mb-4">
              COGS is calculated automatically from the direct cost you entered for each offering in Products & Services, multiplied by the units sold per month from your sales assumptions.
            </p>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Offering</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Direct Cost</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((o: Product, i: number) => {
                    const p = o.price || 0;
                    const c = o.directCosts || 0;
                    const gp = p - c;
                    const margin = p > 0 ? ((gp / p) * 100).toFixed(1) + "%" : "—";
                    const mColor = p > 0 ? (gp / p >= 0.4 ? "text-sage-600" : gp / p >= 0.2 ? "text-amber-600" : "text-red-600") : "text-muted-foreground";
                    return (
                      <tr key={o.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                        <td className="px-4 py-2.5 font-medium text-navy-800">{o.name || "Unnamed"}</td>
                        <td className="px-4 py-2.5 text-right text-navy-700">{p > 0 ? fmt(p) : "—"}</td>
                        <td className="px-4 py-2.5 text-right text-navy-600">{c > 0 ? fmt(c) : "—"}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${mColor}`}>{margin}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              To update direct costs, return to Products & Services → Your Offerings.
            </p>
          </div>
        ) : (
          <div className="bg-muted rounded-xl p-5 text-center">
            <p className="text-muted-foreground text-sm">No offerings found. COGS will be calculated once you add offerings with direct costs in Products & Services.</p>
          </div>
        )}

        {totalCOGS > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Year 1 Revenue</p>
              <p className="font-bold text-navy-900 text-lg">{fmtK(totalRevenue)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Year 1 COGS</p>
              <p className="font-bold text-navy-900 text-lg">{fmtK(totalCOGS)}</p>
            </div>
            <div className={`rounded-xl p-4 text-center border ${avgGrossMargin >= 40 ? "bg-sage-50 border-sage-200" : avgGrossMargin >= 20 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-navy-400 text-[11px] mb-1">Avg Gross Margin</p>
              <p className={`font-bold text-2xl ${avgGrossMargin >= 40 ? "text-sage-600" : avgGrossMargin >= 20 ? "text-amber-600" : "text-red-600"}`}>
                {avgGrossMargin.toFixed(1)}%
              </p>
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

// ─── 06 — Operating Expenses ──────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  "Rent & Premises",
  "Utilities",
  "Insurance",
  "Software & Subscriptions",
  "Professional Services (Accounting, Legal)",
  "Marketing & Advertising",
  "Vehicle & Travel",
  "Communications (Phone, Internet)",
  "Bank Charges & Merchant Fees",
  "Equipment Maintenance",
  "Training & Development",
  "Office Supplies",
  "Depreciation",
  "Loan Repayments",
  "Other",
];

function FPExpenses({ fp, update, status, markComplete, onNext, onPrev, monthlyData }: any) {
  const fixedItems: FixedExpense[] = fp.fixedExpenses || [];
  const variableItems: VariableExpense[] = fp.variableExpenses || [];

  const addFixed = () =>
    update({
      fixedExpenses: [
        ...fixedItems,
        { id: generateId(), category: "", item: "", monthlyAmount: 0, notes: "" },
      ],
    });

  const updFixed = (id: string, changes: Partial<FixedExpense>) =>
    update({ fixedExpenses: fixedItems.map((i) => (i.id === id ? { ...i, ...changes } : i)) });

  const removeFixed = (id: string) =>
    update({ fixedExpenses: fixedItems.filter((i) => i.id !== id) });

  const addVariable = () =>
    update({
      variableExpenses: [
        ...variableItems,
        { id: generateId(), item: "", percentOfRevenue: 0, notes: "" },
      ],
    });

  const updVariable = (id: string, changes: Partial<VariableExpense>) =>
    update({ variableExpenses: variableItems.map((i) => (i.id === id ? { ...i, ...changes } : i)) });

  const removeVariable = (id: string) =>
    update({ variableExpenses: variableItems.filter((i) => i.id !== id) });

  const totalMonthlyFixed = fixedItems.reduce((s, i) => s + (i.monthlyAmount || 0), 0);
  const avgMonthlyRevenue = monthlyData.reduce((s: number, m: any) => s + m.revenue, 0) / 12;
  const totalMonthlyVariable = variableItems.reduce(
    (s, i) => s + avgMonthlyRevenue * ((i.percentOfRevenue || 0) / 100),
    0
  );

  // Pull from marketing phase
  const marketingBudget = (fp as any).marketingSales?.budgetItems?.reduce(
    (s: number, b: any) => s + (b.monthlyAmount || 0),
    0
  ) || 0;

  // Pull tech costs from operations
  const techCosts = (fp as any).operations?.techTools?.reduce(
    (s: number, t: any) => s + (t.monthlyCost || 0),
    0
  ) || 0;

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={6}
        topicTitle="Operating Expenses"
        estimatedMinutes={12}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Fixed vs Variable Operating Expenses</h3>
        <p className="text-navy-700 mb-3">
          Operating expenses are the costs of running the business that don't directly vary with each unit sold. They split into two types:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-white/70 rounded-lg border border-navy-200 p-3">
            <p className="font-bold text-navy-900 text-xs mb-1">Fixed Expenses</p>
            <p className="text-navy-600 text-xs">Same every month regardless of revenue — rent, insurance, subscriptions. Document as a monthly amount.</p>
          </div>
          <div className="bg-white/70 rounded-lg border border-navy-200 p-3">
            <p className="font-bold text-navy-900 text-xs mb-1">Variable Expenses</p>
            <p className="text-navy-600 text-xs">Scale with revenue — payment processing fees, sales commissions, variable utilities. Document as a % of revenue.</p>
          </div>
        </div>
      </EducationPanel>

      {(marketingBudget > 0 || techCosts > 0) && (
        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-2">
            Costs from other phases to include
          </p>
          <div className="flex flex-wrap gap-3">
            {marketingBudget > 0 && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-200">
                <p className="text-blue-700 text-xs">Marketing Budget: <strong>{fmt(marketingBudget)}/mo</strong></p>
              </div>
            )}
            {techCosts > 0 && (
              <div className="bg-white rounded-lg px-3 py-2 border border-blue-200">
                <p className="text-blue-700 text-xs">Technology Stack: <strong>{fmt(techCosts)}/mo</strong></p>
              </div>
            )}
          </div>
          <p className="text-blue-600 text-xs mt-2">
            Add these as line items below if not already included.
          </p>
        </div>
      )}

      {/* Fixed expenses */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Fixed Expenses</h3>
          <button onClick={addFixed} className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Add Fixed
          </button>
        </div>

        {fixedItems.length === 0 ? (
          <div className="bg-muted rounded-xl p-5 text-center mb-4">
            <p className="text-muted-foreground text-sm">No fixed expenses added. Add monthly overhead costs — rent, insurance, subscriptions, etc.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Item</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Monthly ($)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Annual ($)</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {fixedItems.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2">
                        <select
                          value={item.category}
                          onChange={(e) => updFixed(item.id, { category: e.target.value })}
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        >
                          <option value="">Select…</option>
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={item.item}
                          onChange={(e) => updFixed(item.id, { item: e.target.value })}
                          placeholder="e.g. Office 365, Public liability"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0"
                          value={item.monthlyAmount || ""}
                          onChange={(e) => updFixed(item.id, { monthlyAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-right focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-navy-700 text-xs font-medium">{fmt((item.monthlyAmount || 0) * 12)}</td>
                      <td className="px-2 py-2 text-center"><button onClick={() => removeFixed(item.id)} className="text-red-400 hover:text-red-600 text-xs">×</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-200 bg-navy-50">
                    <td className="px-4 py-3 text-xs font-bold text-navy-700" colSpan={2}>Total Fixed Expenses</td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">{fmt(totalMonthlyFixed)}/mo</td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">{fmt(totalMonthlyFixed * 12)}/yr</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Variable expenses */}
        <div className="flex items-center justify-between mb-4 mt-6">
          <h3 className="font-semibold text-navy-900">Variable Expenses</h3>
          <button onClick={addVariable} className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Add Variable
          </button>
        </div>

        {variableItems.length === 0 ? (
          <div className="bg-muted rounded-xl p-5 text-center mb-4">
            <p className="text-muted-foreground text-sm">No variable expenses added. Add expenses that scale as a % of revenue.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Item</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">% of Revenue</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Est. Monthly ($)</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {variableItems.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2">
                        <input
                          value={item.item}
                          onChange={(e) => updVariable(item.id, { item: e.target.value })}
                          placeholder="e.g. Payment processing fee, sales commission"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0" max="100" step="0.1"
                          value={item.percentOfRevenue || ""}
                          onChange={(e) => updVariable(item.id, { percentOfRevenue: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-right focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-navy-700 text-xs font-medium">
                        {avgMonthlyRevenue > 0 ? fmt(avgMonthlyRevenue * (item.percentOfRevenue || 0) / 100) : "—"}
                      </td>
                      <td className="px-2 py-2 text-center"><button onClick={() => removeVariable(item.id)} className="text-red-400 hover:text-red-600 text-xs">×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(totalMonthlyFixed + totalMonthlyVariable) > 0 && (
          <div className="mt-4 p-4 bg-navy-50 border border-navy-200 rounded-xl grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-navy-400 text-[11px] mb-1">Monthly Fixed</p>
              <p className="font-bold text-navy-900 text-lg">{fmt(totalMonthlyFixed)}</p>
            </div>
            <div>
              <p className="text-navy-400 text-[11px] mb-1">Est. Variable/mo</p>
              <p className="font-bold text-navy-900 text-lg">{fmt(totalMonthlyVariable)}</p>
            </div>
            <div>
              <p className="text-navy-400 text-[11px] mb-1">Total OpEx/yr</p>
              <p className="font-bold text-navy-900 text-lg">{fmtK((totalMonthlyFixed + totalMonthlyVariable) * 12)}</p>
            </div>
          </div>
        )}

        <div className="mt-5">
          <TextAreaField
            label="Expense Notes"
            value={fp.expenseNotes || ""}
            onChange={(v) => update({ expenseNotes: v })}
            placeholder="Any assumptions, anticipated changes, or cost-reduction plans worth noting."
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

// ─── 07 — Payroll ─────────────────────────────────────────────────────────────
function FPPayroll({ fp, update, status, markComplete, onNext, onPrev }: any) {
  const payroll: PayrollItem[] = fp.payrollItems || [];

  const add = () =>
    update({
      payrollItems: [
        ...payroll,
        { id: generateId(), role: "", headcount: 1, monthlySalary: 0, startMonth: 1, notes: "" },
      ],
    });

  const upd = (id: string, changes: Partial<PayrollItem>) =>
    update({ payrollItems: payroll.map((p) => (p.id === id ? { ...p, ...changes } : p)) });

  const remove = (id: string) =>
    update({ payrollItems: payroll.filter((p) => p.id !== id) });

  const totalMonthly = payroll.reduce((s, p) => s + (p.monthlySalary || 0) * (p.headcount || 1), 0);

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={7}
        topicTitle="Payroll"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Payroll in a business plan</h3>
        <p className="text-navy-700 mb-3">
          Document every person who will be paid by the business — including founders drawing a salary, employees, and key contractors on a recurring basis. Include the month each person starts (useful for staged hiring plans).
        </p>
        <p className="text-navy-700">
          This flows directly into your P&L as a payroll line item. Payroll is typically the largest single cost for service businesses — underestimating it is a common planning error.
        </p>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Include employer costs:</strong> If your business employs staff, you may be responsible for employer taxes, superannuation/pension contributions, workers compensation, and payroll tax (if above threshold). These can add 15–30% on top of gross salary. Document gross cost-to-company, not take-home pay.
        </p>
      </EducationPanel>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Payroll Roster</h3>
          <button onClick={add} className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Add Role
          </button>
        </div>

        {payroll.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No payroll entries yet.</p>
            <p className="text-muted-foreground text-xs">Add each paid role, including founders drawing a salary.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Role</th>
                    <th className="px-4 py-3 text-xs font-semibold text-center">Headcount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Monthly Cost ($)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-center">Start Month</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Annual ($)</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {payroll.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2">
                        <input
                          value={item.role}
                          onChange={(e) => upd(item.id, { role: e.target.value })}
                          placeholder="e.g. Lead Technician, Founder/Director"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="1" max="99"
                          value={item.headcount || 1}
                          onChange={(e) => upd(item.id, { headcount: parseInt(e.target.value) || 1 })}
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-center focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0"
                          value={item.monthlySalary || ""}
                          onChange={(e) => upd(item.id, { monthlySalary: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-right focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={item.startMonth}
                          onChange={(e) => upd(item.id, { startMonth: parseInt(e.target.value) })}
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        >
                          {MONTHS.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m} (Mth {idx + 1})</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-navy-700 text-xs font-medium">
                        {fmt((item.monthlySalary || 0) * (item.headcount || 1) * (13 - (item.startMonth || 1)))}
                      </td>
                      <td className="px-2 py-2 text-center"><button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600 text-xs">×</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-200 bg-navy-50">
                    <td className="px-4 py-3 text-xs font-bold text-navy-700" colSpan={2}>Total (when fully staffed)</td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">{fmt(totalMonthly)}/mo</td>
                    <td />
                    <td className="px-4 py-3 text-right font-bold text-navy-900">{fmt(totalMonthly * 12)}/yr</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5">
          <TextAreaField
            label="Payroll Notes"
            value={fp.payrollNotes || ""}
            onChange={(v) => update({ payrollNotes: v })}
            placeholder="Any notes on founder drawings vs salary, performance bonuses, staged increases, part-time vs full-time arrangements, or contractor structures."
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

// ─── 08 — Profit & Loss ───────────────────────────────────────────────────────
function FPPnL({ fp, update, status, markComplete, onNext, onPrev, monthlyData }: any) {
  const totalRev = monthlyData.reduce((s: number, m: any) => s + m.revenue, 0);
  const totalCOGS = monthlyData.reduce((s: number, m: any) => s + m.cogs, 0);
  const totalGP = monthlyData.reduce((s: number, m: any) => s + m.grossProfit, 0);
  const totalFixed = monthlyData.reduce((s: number, m: any) => s + m.fixed, 0);
  const totalVariable = monthlyData.reduce((s: number, m: any) => s + m.variable, 0);
  const totalPayroll = monthlyData.reduce((s: number, m: any) => s + m.payroll, 0);
  const totalOpEx = monthlyData.reduce((s: number, m: any) => s + m.opex, 0);
  const totalEBITDA = monthlyData.reduce((s: number, m: any) => s + m.ebitda, 0);

  const profitableMonths = monthlyData.filter((m: any) => m.ebitda > 0).length;
  const firstProfitableMonth = monthlyData.findIndex((m: any) => m.ebitda > 0);

  const hasData = totalRev > 0 || totalFixed > 0 || totalPayroll > 0;

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={8}
        topicTitle="Profit & Loss"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700">
          The Profit & Loss statement (P&L) summarises all revenue and all costs for a period to show whether the business made a profit or a loss. This one is auto-generated from everything you've entered so far. Review each line to ensure it reflects your actual plan.
        </p>
      </EducationPanel>

      {!hasData ? (
        <div className="mt-8 bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm mb-2">No data to generate P&L yet.</p>
          <p className="text-muted-foreground text-xs">Complete Sales Assumptions, Operating Expenses, and Payroll topics to generate your P&L.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Summary P&L */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="bg-navy-900 px-5 py-3 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">Year 1 P&L Summary</p>
              <p className="text-white/50 text-xs">Auto-calculated from your inputs</p>
            </div>
            <div className="p-5">
              {[
                { label: "Revenue", value: totalRev, indent: false, bold: false, isRevenue: true },
                { label: "Cost of Goods Sold", value: -totalCOGS, indent: true, bold: false, isRevenue: false },
                { label: "Gross Profit", value: totalGP, indent: false, bold: true, isRevenue: false, divider: true },
                ...(totalFixed > 0 ? [{ label: "Fixed Operating Expenses", value: -totalFixed, indent: true, bold: false, isRevenue: false }] : []),
                ...(totalVariable > 0 ? [{ label: "Variable Operating Expenses", value: -totalVariable, indent: true, bold: false, isRevenue: false }] : []),
                ...(totalPayroll > 0 ? [{ label: "Payroll", value: -totalPayroll, indent: true, bold: false, isRevenue: false }] : []),
                { label: "Total Operating Expenses", value: -totalOpEx, indent: false, bold: false, isRevenue: false },
                { label: "EBITDA (Operating Profit)", value: totalEBITDA, indent: false, bold: true, isRevenue: false, divider: true },
              ].map((row, i) => (
                <div key={i}>
                  {(row as any).divider && <div className="border-t-2 border-navy-200 my-2" />}
                  <div className={`flex items-center justify-between py-2 ${(row as any).divider ? "border-b-0" : "border-b border-border"} last:border-0`}>
                    <span className={`text-sm ${row.bold ? "font-bold text-navy-900" : "text-navy-700"} ${row.indent ? "pl-4" : ""}`}>
                      {row.label}
                    </span>
                    <span className={`font-${row.bold ? "bold" : "medium"} text-sm ${
                      row.isRevenue ? "text-navy-900" : numColor(row.value)
                    }`}>
                      {row.value > 0 && !row.isRevenue ? "+" : ""}{fmt(row.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Year 1 Revenue</p>
              <p className="font-bold text-navy-900 text-xl">{fmtK(totalRev)}</p>
            </div>
            <div className={`rounded-xl p-4 text-center border ${totalEBITDA >= 0 ? "bg-sage-50 border-sage-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-navy-400 text-[11px] mb-1">Year 1 Profit</p>
              <p className={`font-bold text-xl ${numColor(totalEBITDA)}`}>{fmtK(totalEBITDA)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Profitable Months</p>
              <p className="font-bold text-navy-900 text-xl">{profitableMonths}/12</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">First Profit Month</p>
              <p className="font-bold text-navy-900 text-xl">
                {firstProfitableMonth >= 0 ? MONTHS[firstProfitableMonth] : "N/A"}
              </p>
            </div>
          </div>

          {/* Monthly P&L */}
          <div>
            <h3 className="font-semibold text-navy-900 mb-3 text-sm">Monthly P&L Breakdown</h3>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-navy-900 text-white">
                      <th className="text-left px-3 py-2.5 font-semibold">Month</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Revenue</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Gross Profit</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Total OpEx</th>
                      <th className="px-3 py-2.5 font-semibold text-right">EBITDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m: any, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                        <td className="px-3 py-2 font-medium text-navy-700">{m.label}</td>
                        <td className="px-3 py-2 text-right text-navy-800">{fmt(m.revenue)}</td>
                        <td className={`px-3 py-2 text-right font-medium ${numColor(m.grossProfit)}`}>{fmt(m.grossProfit)}</td>
                        <td className="px-3 py-2 text-right text-navy-600">{fmt(m.opex)}</td>
                        <td className={`px-3 py-2 text-right font-bold ${numColor(m.ebitda)}`}>{fmt(m.ebitda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {totalEBITDA < 0 && (
            <EducationPanel variant="warning">
              <p className="text-red-700 text-sm">
                <strong>Year 1 shows a loss of {fmt(Math.abs(totalEBITDA))}.</strong> This is common for startups. Review your startup costs and working capital reserve to ensure you have enough funding to cover this period. Consider whether revenue assumptions are achievable, or whether expenses can be reduced.
              </p>
            </EducationPanel>
          )}

          {totalEBITDA > 0 && (
            <EducationPanel variant="tip">
              <p className="text-sage-700 text-sm">
                <strong>Year 1 shows a profit of {fmt(totalEBITDA)}.</strong> This is a strong result. Ensure your assumptions are defensible — overly optimistic projections are a common credibility issue. Document your reasoning in the Sales Assumptions topic.
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

// ─── 09 — Cash Flow ───────────────────────────────────────────────────────────
function FPCashFlow({ fp, update, status, markComplete, onNext, onPrev, monthlyData }: any) {
  const startupCosts = fp.startupCosts || [];
  const totalStartupCosts = startupCosts.reduce((s: number, c: StartupCostItem) => s + (c.amount || 0), 0);

  // Build cash flow from P&L + startup costs
  let runningBalance = 0;
  const cashFlowData = monthlyData.map((m: any, i: number) => {
    const openingBalance = i === 0 ? -totalStartupCosts : runningBalance;
    const closingBalance = openingBalance + m.ebitda;
    runningBalance = closingBalance;
    return {
      ...m,
      openingBalance: i === 0 ? -totalStartupCosts : runningBalance - m.ebitda,
      netCashFlow: m.ebitda,
      closingBalance,
    };
  });

  const lowestBalance = Math.min(...cashFlowData.map((m: any) => m.closingBalance));
  const firstPositiveMonth = cashFlowData.findIndex((m: any) => m.closingBalance > 0);
  const hasData = monthlyData.some((m: any) => m.revenue > 0 || m.opex > 0);

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={9}
        topicTitle="Cash Flow"
        estimatedMinutes={12}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Cash flow vs profit — a critical distinction</h3>
        <p className="text-navy-700 mb-3">
          This cash flow projection is simplified — it assumes revenue is collected in the same month it's earned (cash basis). For businesses with invoice payment terms (net 30, net 60), the actual cash flow will lag behind revenue. Adjust your startup working capital reserve if you have significant debtor delays.
        </p>
        <p className="text-navy-700">
          The projection starts from a negative opening balance equal to your total startup costs, then adds each month's operating profit. The closing balance each month is your estimated cash position.
        </p>
      </EducationPanel>

      {!hasData ? (
        <div className="mt-8 bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm">Complete Sales Assumptions and Operating Expenses to generate a cash flow projection.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-xl p-4 text-center border ${lowestBalance >= 0 ? "bg-sage-50 border-sage-200" : "bg-red-50 border-red-200"}`}>
              <p className="text-navy-400 text-[11px] mb-1">Lowest Cash Balance</p>
              <p className={`font-bold text-xl ${numColor(lowestBalance)}`}>{fmt(lowestBalance)}</p>
              <p className="text-navy-400 text-[10px] mt-1">
                {lowestBalance < 0 ? "Ensure funded" : "Positive throughout"}
              </p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Startup Costs</p>
              <p className="font-bold text-navy-900 text-xl">{fmt(totalStartupCosts)}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-navy-400 text-[11px] mb-1">Cash Positive From</p>
              <p className="font-bold text-navy-900 text-xl">
                {firstPositiveMonth >= 0 ? MONTHS[firstPositiveMonth] : "Year 1+"}
              </p>
            </div>
          </div>

          {/* Cash flow table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-3 py-2.5 font-semibold">Month</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Opening</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Revenue</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Total Costs</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Net Cash</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.map((m: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-3 py-2 font-medium text-navy-700">{m.label}</td>
                      <td className={`px-3 py-2 text-right ${numColor(m.openingBalance)}`}>{fmt(m.openingBalance)}</td>
                      <td className="px-3 py-2 text-right text-navy-800">{fmt(m.revenue)}</td>
                      <td className="px-3 py-2 text-right text-navy-600">{fmt(m.cogs + m.opex)}</td>
                      <td className={`px-3 py-2 text-right font-medium ${numColor(m.netCashFlow)}`}>{fmt(m.netCashFlow)}</td>
                      <td className={`px-3 py-2 text-right font-bold ${numColor(m.closingBalance)}`}>{fmt(m.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {lowestBalance < 0 && (
            <EducationPanel variant="warning">
              <p className="text-red-700 text-sm">
                <strong>Cash balance goes negative.</strong> Your lowest projected balance is <strong>{fmt(lowestBalance)}</strong>. You need funding of at least {fmt(Math.abs(lowestBalance))} to cover this shortfall — whether from startup capital, an overdraft facility, or a staged hiring and expense plan. This is the minimum cash buffer you need to secure before trading.
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

// ─── 10 — Break-Even ──────────────────────────────────────────────────────────
function FPBreakeven({ fp, update, status, markComplete, onNext, onPrev, monthlyData }: any) {
  const fixedItems: FixedExpense[] = fp.fixedExpenses || [];
  const payrollItems: PayrollItem[] = fp.payrollItems || [];

  const totalMonthlyFixed = fixedItems.reduce((s, i) => s + (i.monthlyAmount || 0), 0);
  const totalMonthlyPayroll = payrollItems.reduce((s, p) => s + (p.monthlySalary || 0) * (p.headcount || 1), 0);
  const totalMonthlyFixedAll = totalMonthlyFixed + totalMonthlyPayroll;

  // Average gross margin from monthly data
  const totalRev = monthlyData.reduce((s: number, m: any) => s + m.revenue, 0);
  const totalGP = monthlyData.reduce((s: number, m: any) => s + m.grossProfit, 0);
  const avgGrossMarginPct = totalRev > 0 ? (totalGP / totalRev) * 100 : 0;

  const breakEvenRevenue = avgGrossMarginPct > 0 ? totalMonthlyFixedAll / (avgGrossMarginPct / 100) : 0;
  const hasData = totalMonthlyFixedAll > 0 && avgGrossMarginPct > 0;

  // Find which month first exceeds break-even
  const breakEvenMonth = monthlyData.findIndex((m: any) => m.revenue >= breakEvenRevenue);

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={10}
        topicTitle="Break-Even Analysis"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is break-even?</h3>
        <p className="text-navy-700 mb-3">
          Break-even is the revenue level at which the business covers all its costs — both COGS and fixed overheads. Below break-even, every dollar of revenue contributes to covering costs. Above it, every dollar is pure profit (after covering COGS).
        </p>
        <div className="bg-white/70 rounded-lg p-4 border border-navy-200 font-mono text-sm">
          <p className="text-navy-700 text-xs mb-2">Formula:</p>
          <p className="text-navy-900 font-bold text-sm">Break-Even Revenue = Fixed Costs ÷ Gross Margin %</p>
        </div>
      </EducationPanel>

      {!hasData ? (
        <div className="mt-8 bg-muted rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm mb-2">Complete Operating Expenses and Payroll to calculate your break-even.</p>
          <p className="text-muted-foreground text-xs">Sales Assumptions are also needed for gross margin % calculation.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {/* Break-even summary */}
          <div className="bg-navy-900 text-white rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-5 text-white/80 text-sm uppercase tracking-wide">Break-Even Calculation</h3>
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="text-center">
                <p className="text-white/60 text-xs mb-1">Monthly Fixed Costs</p>
                <p className="font-bold text-2xl">{fmt(totalMonthlyFixedAll)}</p>
                <p className="text-white/40 text-[10px] mt-1">incl. payroll</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs mb-1">Avg Gross Margin</p>
                <p className="font-bold text-2xl">{avgGrossMarginPct.toFixed(1)}%</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${breakEvenRevenue > 0 ? "bg-amber-400/20" : "bg-sage-500/20"}`}>
                <p className="text-white/60 text-xs mb-1">Monthly Break-Even</p>
                <p className="font-bold text-2xl text-amber-400">{fmt(breakEvenRevenue)}</p>
                <p className="text-white/40 text-[10px] mt-1">revenue needed/month</p>
              </div>
            </div>
          </div>

          {/* Context */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-navy-400 text-xs mb-1">Month 1 Revenue vs Break-Even</p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-navy-600">Month 1: {fmt(monthlyData[0]?.revenue || 0)}</span>
                  <span className="text-xs text-amber-600">Target: {fmt(breakEvenRevenue)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (monthlyData[0]?.revenue || 0) >= breakEvenRevenue ? "bg-sage-500" : "bg-amber-400"
                    }`}
                    style={{
                      width: `${Math.min(100, ((monthlyData[0]?.revenue || 0) / (breakEvenRevenue || 1)) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <p className="text-navy-400 text-[10px] mt-1.5">
                  {breakEvenRevenue > 0
                    ? `${(((monthlyData[0]?.revenue || 0) / breakEvenRevenue) * 100).toFixed(0)}% of break-even`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-navy-400 text-xs mb-1">Break-Even Timeline</p>
              <p className={`font-bold text-2xl mt-2 ${breakEvenMonth >= 0 ? "text-sage-600" : "text-red-600"}`}>
                {breakEvenMonth >= 0 ? MONTHS[breakEvenMonth] + " (Mth " + (breakEvenMonth + 1) + ")" : "Year 2+"}
              </p>
              <p className="text-navy-500 text-xs mt-1">
                {breakEvenMonth >= 0
                  ? "First month revenue exceeds break-even point"
                  : "Revenue doesn't reach break-even in Year 1 — review assumptions"}
              </p>
            </div>
          </div>

          {/* Monthly progress toward break-even */}
          <div>
            <h3 className="font-semibold text-navy-900 text-sm mb-3">Monthly Revenue vs Break-Even</h3>
            <div className="bg-white border border-border rounded-xl p-4 space-y-2">
              {monthlyData.map((m: any, i: number) => {
                const pct = breakEvenRevenue > 0 ? Math.min(100, (m.revenue / breakEvenRevenue) * 100) : 0;
                const exceeded = m.revenue >= breakEvenRevenue;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-navy-500 w-8 shrink-0">{m.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${exceeded ? "bg-sage-500" : "bg-navy-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-16 text-right shrink-0 ${exceeded ? "text-sage-600" : "text-navy-500"}`}>
                      {fmt(m.revenue)}
                    </span>
                    {exceeded && (
                      <span className="text-sage-500 text-xs shrink-0">✓</span>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <span className="text-xs font-medium text-amber-600 w-8 shrink-0">BEP</span>
                <div className="flex-1 border-t-2 border-dashed border-amber-400" />
                <span className="text-xs font-bold text-amber-600 w-16 text-right shrink-0">{fmt(breakEvenRevenue)}</span>
                <span className="w-4 shrink-0" />
              </div>
            </div>
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

// ─── 11 — Scenarios ───────────────────────────────────────────────────────────
function FPScenarios({ fp, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={11}
        topicTitle="Scenarios"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why scenario planning matters</h3>
        <p className="text-navy-700 mb-3">
          A single-point financial forecast — "we will achieve $X" — is not credible, because no forecast is certain. Sophisticated readers (investors, lenders, bank managers) will immediately ask: "But what if things don't go to plan?"
        </p>
        <p className="text-navy-700">
          Presenting three scenarios — optimistic, base, and pessimistic — demonstrates analytical rigour and shows that you have thought through the range of realistic outcomes. It also helps you understand what could break the business before it happens.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Scenario structure:</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Pessimistic", color: "text-red-600", bg: "bg-red-50 border-red-200", desc: "50% of base case revenue. Higher costs. What does the business look like if things don't go to plan?" },
            { label: "Base Case", color: "text-navy-800", bg: "bg-navy-50 border-navy-200", desc: "Your main projections. Conservative but achievable given reasonable execution." },
            { label: "Optimistic", color: "text-sage-600", bg: "bg-sage-50 border-sage-200", desc: "150% of base case. What if demand grows faster than expected? Can the business scale?" },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg border p-3 ${s.bg}`}>
              <p className={`font-bold text-xs mb-1 ${s.color}`}>{s.label}</p>
              <p className="text-navy-600 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Base Case Assumptions"
          value={fp.scenarioBase || ""}
          onChange={(v) => update({ scenarioBase: v })}
          placeholder="Summarise your base case financial assumptions — the scenario your main projections are built on. What conditions need to be true for these numbers to materialise?"
          rows={4}
          helpText="Your base case is what you've modelled in this Financial Plan."
        />

        <TextAreaField
          label="Optimistic Scenario"
          value={fp.scenarioOptimistic || ""}
          onChange={(v) => update({ scenarioOptimistic: v })}
          placeholder="What would need to happen for results to significantly exceed your base case? Higher-than-expected demand, faster sales cycle, early key contract win? Describe the scenario and its approximate financial impact."
          rows={4}
        />

        <TextAreaField
          label="Pessimistic Scenario"
          value={fp.scenarioPessimistic || ""}
          onChange={(v) => update({ scenarioPessimistic: v })}
          placeholder="What could cause results to significantly miss your base case? Slow customer acquisition, key costs higher than estimated, competitor response, economic downturn? At what point does the business become unviable, and what is your contingency?"
          rows={4}
          helpText="This is the most important scenario to think through carefully. It answers: 'What is the worst case, and can we survive it?'"
        />

        <TextAreaField
          label="Key Assumptions Underpinning All Scenarios"
          value={fp.scenarioAssumptions || ""}
          onChange={(v) => update({ scenarioAssumptions: v })}
          placeholder="List the 3–5 most critical assumptions that drive your financial projections. These are the assumptions that, if wrong, would most significantly affect outcomes."
          rows={4}
          helpText="Examples: conversion rate on leads, average job value, ramp-up timeline, cost of customer acquisition."
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

// ─── 12 — Financial Review ────────────────────────────────────────────────────
function FPReview({ fp, update, status, markComplete, onNext, onPrev, onNavigate, monthlyData }: any) {
  const startupCosts: StartupCostItem[] = fp.startupCosts || [];
  const assumptions: SalesAssumption[] = fp.salesAssumptions || [];
  const fixedItems: FixedExpense[] = fp.fixedExpenses || [];
  const payrollItems: PayrollItem[] = fp.payrollItems || [];

  const totalStartup = startupCosts.reduce((s, c) => s + (c.amount || 0), 0);
  const totalRev = monthlyData.reduce((s: number, m: any) => s + m.revenue, 0);
  const totalEBITDA = monthlyData.reduce((s: number, m: any) => s + m.ebitda, 0);
  const totalMonthlyFixed = fixedItems.reduce((s, i) => s + (i.monthlyAmount || 0), 0);
  const totalMonthlyPayroll = payrollItems.reduce((s, p) => s + (p.monthlySalary || 0) * (p.headcount || 1), 0);

  const fields = [
    { label: "Startup Costs", value: totalStartup > 0 ? fmt(totalStartup) : null, topicId: "fp_startup_costs", summary: `${startupCosts.length} item(s) · ${fmt(totalStartup)} total` },
    { label: "Sales Assumptions", value: assumptions.length > 0 ? `${assumptions.length} offering(s)` : null, topicId: "fp_assumptions", summary: assumptions.map((a) => a.offeringName).filter(Boolean).join(", ") || null },
    { label: "Revenue Forecast", value: totalRev > 0 ? fmtK(totalRev) : null, topicId: "fp_revenue", summary: totalRev > 0 ? `Year 1: ${fmtK(totalRev)}` : null },
    { label: "Operating Expenses", value: totalMonthlyFixed > 0 ? `${fmt(totalMonthlyFixed)}/mo` : null, topicId: "fp_expenses", summary: `${fixedItems.length} fixed items · ${fmt(totalMonthlyFixed)}/mo` },
    { label: "Payroll", value: totalMonthlyPayroll > 0 ? `${fmt(totalMonthlyPayroll)}/mo` : null, topicId: "fp_payroll", summary: `${payrollItems.length} role(s) · ${fmt(totalMonthlyPayroll)}/mo` },
    { label: "P&L", value: totalRev > 0 || totalMonthlyFixed > 0 ? "Auto-calculated" : null, topicId: "fp_pnl", summary: totalEBITDA !== 0 ? `Year 1 EBITDA: ${fmt(totalEBITDA)}` : null },
    { label: "Cash Flow", value: fp.startupCosts?.length > 0 || totalRev > 0 ? "Projected" : null, topicId: "fp_cashflow", summary: null },
    { label: "Break-Even", value: totalMonthlyFixed > 0 || totalMonthlyPayroll > 0 ? "Calculated" : null, topicId: "fp_breakeven", summary: null },
    { label: "Scenarios", value: fp.scenarioBase || fp.scenarioOptimistic || fp.scenarioPessimistic ? "Documented" : null, topicId: "fp_scenarios", summary: fp.scenarioBase ? fp.scenarioBase.slice(0, 80) + "…" : null },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  return (
    <div>
      <TopicHeader
        phase="Financial Plan"
        phaseNumber={7}
        topicNumber={12}
        topicTitle="Financial Review"
        estimatedMinutes={8}
        status={status}
      />

      {/* Summary table */}
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Financial Plan — Summary</h2>
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
                  onClick={() => onNavigate("financial_plan", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Snapshot */}
      {(totalRev > 0 || totalStartup > 0) && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Financial Snapshot — Year 1</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Startup Costs", value: fmt(totalStartup), color: "text-navy-900" },
              { label: "Year 1 Revenue", value: fmtK(totalRev), color: "text-navy-900" },
              { label: "Year 1 EBITDA", value: fmtK(totalEBITDA), color: numColor(totalEBITDA) },
              { label: "Monthly OpEx", value: fmt(totalMonthlyFixed + totalMonthlyPayroll), color: "text-navy-900" },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-lg p-3 border border-border">
                <p className="text-navy-400 text-[11px] mb-1">{m.label}</p>
                <p className={`font-bold text-lg ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed === total ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Financial Plan is complete. You're ready to move on to Funding Request — where you'll define whether external funding is required and how it will be used.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {total - completed} section{total - completed > 1 ? "s" : ""} still incomplete. Sales Assumptions, Operating Expenses, and Payroll are the most critical for a credible financial model.
          </p>
        </EducationPanel>
      )}

      <div className="mt-5">
        <TextAreaField
          label="Overall Financial Plan Notes"
          value={fp.financialNotes || ""}
          onChange={(v) => update({ financialNotes: v })}
          placeholder="Any additional financial context, caveats, or notes for this plan that don't fit elsewhere."
          rows={3}
        />
      </div>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Funding Request →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
