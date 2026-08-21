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
import msHero from "@/assets/phase-marketing-hero.jpg";

// ─── Phase constant ───────────────────────────────────────────────────────────
const PHASE = PHASES.find((p) => p.id === "marketing_sales")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Data types ───────────────────────────────────────────────────────────────
interface ChannelCard {
  id: string;
  channel: string;
  description?: string;
  targetAudience?: string;
  tactics?: string;
  frequency?: string;
  estimatedMonthlyBudget?: number;
  kpi?: string;
  priority: "high" | "medium" | "low";
  enabled: boolean;
}

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  monthlyAmount: number;
  notes?: string;
}

interface KPIItem {
  id: string;
  metric: string;
  target?: string;
  frequency?: string;
  tool?: string;
}

interface MSData {
  // Objectives
  primaryObjectives?: string;
  revenueTarget?: string;
  customerTarget?: string;
  timeframe?: string;
  // Strategy
  overallApproach?: string;
  strategyTypes?: string[];
  positioningNote?: string;
  // Channels
  channels?: ChannelCard[];
  // Acquisition
  acquisitionCost?: number;
  acquisitionChannelBreakdown?: string;
  conversionFunnel?: string;
  leadSources?: string;
  acquisitionGoal?: string;
  // Sales
  salesProcess?: string;
  salesCycleLength?: string;
  salesModel?: string;
  distributionChannels?: string;
  distributionDescription?: string;
  pricingCommunication?: string;
  // Budget
  budgetItems?: BudgetItem[];
  totalMonthlyBudget?: number;
  budgetNotes?: string;
  // Retention
  retentionStrategy?: string;
  repeatPurchaseTactics?: string;
  loyaltyProgram?: boolean;
  loyaltyDescription?: string;
  npsStrategy?: string;
  churnMitigation?: string;
  // KPIs
  kpis?: KPIItem[];
  reportingCadence?: string;
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

// ─── Phase root ───────────────────────────────────────────────────────────────
export default function MarketingSalesPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const ms: MSData = (plan as any).marketingSales || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<MSData>) => {
    onUpdatePlan({ marketingSales: { ...ms, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next
      ? onNavigate("marketing_sales", nav.next.id)
      : onNavigate("operations", "op_model");
  const handlePrev = () =>
    nav.prev
      ? onNavigate("marketing_sales", nav.prev.id)
      : onNavigate("products_services", "ps_review");

  const sharedProps = {
    ms,
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
      case "ms_objectives":   return <MSObjectives {...sharedProps} />;
      case "ms_strategy":     return <MSStrategy {...sharedProps} />;
      case "ms_channels":     return <MSChannels {...sharedProps} />;
      case "ms_acquisition":  return <MSAcquisition {...sharedProps} />;
      case "ms_sales":        return <MSSales {...sharedProps} />;
      case "ms_budget":       return <MSBudget {...sharedProps} />;
      case "ms_retention":    return <MSRetention {...sharedProps} />;
      case "ms_kpis":         return <MSKPIs {...sharedProps} />;
      case "ms_review":       return <MSReview {...sharedProps} />;
      default:                return <MSObjectives {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
function MSHero() {
  return (
    <div className="relative rounded-xl overflow-hidden mb-8 h-44 sm:h-56">
      <img
        src={msHero}
        alt="Marketing & Sales"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/88 to-navy-900/20 flex flex-col justify-end p-6">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
          Phase 5
        </p>
        <h2 className="text-white font-serif text-2xl font-bold leading-tight">
          Marketing & Sales
        </h2>
        <p className="text-white/65 text-sm mt-1">
          Define how you reach, acquire, and keep customers
        </p>
      </div>
    </div>
  );
}

// ─── 01 — Marketing Objectives ───────────────────────────────────────────────
function MSObjectives({ ms, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <MSHero />
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={1}
        topicTitle="Marketing Objectives"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Marketing objectives define what you want your marketing to achieve — in specific, measurable terms. They are not a description of activities ("we will run ads") but of outcomes ("we will acquire 40 new customers in the first 3 months").
        </p>
        <p className="text-navy-700">
          Good marketing objectives are tied to your business objectives. If your business aims to reach $20,000/month in revenue within 12 months, your marketing objective should describe what customer volume, acquisition rate, or conversion metric would get you there.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Strong marketing objectives:</p>
        <ul className="space-y-1.5 text-navy-700 text-sm">
          <li>• Acquire 50 new paying customers within the first 3 months of launch</li>
          <li>• Achieve a cost-per-acquisition of under $35 by Month 6</li>
          <li>• Generate 200 website leads per month by end of Year 1</li>
          <li>• Reach a repeat purchase rate of 40% within 12 months</li>
          <li>• Build an email list of 1,000 subscribers within 6 months</li>
        </ul>
        <p className="text-navy-600 text-xs mt-3">
          Notice: each is specific, has a number, and has a timeframe.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Marketing Objectives"
          value={ms.primaryObjectives || ""}
          onChange={(v) => update({ primaryObjectives: v })}
          placeholder={
            "List your 3–5 key marketing objectives. Each should be:\n" +
            "• Specific (name the outcome)\n" +
            "• Measurable (a number or %)\n" +
            "• Time-bound (within X months)"
          }
          rows={6}
          required
          helpText="Tie these to the business objectives you set in Company Description."
        />

        <div className="grid sm:grid-cols-3 gap-4">
          <TextField
            label="Revenue Target"
            value={ms.revenueTarget || ""}
            onChange={(v) => update({ revenueTarget: v })}
            placeholder="e.g. $20,000/month"
            helpText="Monthly revenue target marketing should support"
          />
          <TextField
            label="Customer Acquisition Target"
            value={ms.customerTarget || ""}
            onChange={(v) => update({ customerTarget: v })}
            placeholder="e.g. 50 new customers"
            helpText="New customers per period"
          />
          <TextField
            label="Timeframe"
            value={ms.timeframe || ""}
            onChange={(v) => update({ timeframe: v })}
            placeholder="e.g. First 12 months"
            helpText="Period for these objectives"
          />
        </div>
      </div>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          If you haven't set business objectives yet, return to Company Description → Business Objectives first. Marketing objectives should flow from those, not be set independently.
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

// ─── 02 — Overall Strategy ────────────────────────────────────────────────────
const STRATEGY_TYPES = [
  {
    value: "inbound",
    label: "Inbound Marketing",
    icon: "🧲",
    description:
      "Attract customers through content, SEO, and organic discovery. Customers come to you.",
  },
  {
    value: "outbound",
    label: "Outbound Marketing",
    icon: "📢",
    description:
      "Proactively reach out to potential customers — ads, cold outreach, direct mail.",
  },
  {
    value: "content",
    label: "Content Marketing",
    icon: "✍️",
    description:
      "Build trust and visibility through articles, videos, social posts, and educational material.",
  },
  {
    value: "paid",
    label: "Paid Advertising",
    icon: "💰",
    description:
      "Google Ads, Meta Ads, TikTok Ads, sponsored content. Fast reach with a clear cost.",
  },
  {
    value: "referral",
    label: "Referral & Word of Mouth",
    icon: "🤝",
    description:
      "Growth driven by satisfied customers recommending your business to others.",
  },
  {
    value: "partnerships",
    label: "Strategic Partnerships",
    icon: "🔗",
    description:
      "Co-marketing arrangements, reseller agreements, distribution partners, or integration deals.",
  },
  {
    value: "community",
    label: "Community & Events",
    icon: "🏡",
    description:
      "Local events, sponsorships, online communities, networking, associations.",
  },
  {
    value: "direct",
    label: "Direct Sales",
    icon: "📞",
    description:
      "Active selling via phone, in-person visits, demos, proposals — especially for B2B.",
  },
];

function MSStrategy({ ms, update, status, markComplete, onNext, onPrev }: any) {
  const selected: string[] = ms.strategyTypes || [];

  const toggle = (v: string) => {
    const updated = selected.includes(v)
      ? selected.filter((s) => s !== v)
      : [...selected, v];
    update({ strategyTypes: updated });
  };

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={2}
        topicTitle="Overall Marketing Strategy"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Strategy before tactics</h3>
        <p className="text-navy-700 mb-3">
          Most people jump straight to tactics — "I'll run Instagram ads and post content." But before you decide on channels and tactics, you need to choose a strategic direction: how will you fundamentally approach the market?
        </p>
        <p className="text-navy-700">
          Your strategy should match your business type, budget, and customer. A B2B software company needs a different strategy than a local service business. Choose the approaches that genuinely suit your situation — not what sounds impressive.
        </p>
      </EducationPanel>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>Starter businesses:</strong> Referral + community is often the highest-ROI starting point for local and service businesses with limited budgets. Paid advertising works faster but costs more. Content marketing takes 6–12 months to compound. Choose based on your runway.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        <div>
          <label className="input-label mb-3 block">
            Select your primary marketing approaches (choose all that apply)
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {STRATEGY_TYPES.map((st) => {
              const isOn = selected.includes(st.value);
              return (
                <button
                  key={st.value}
                  onClick={() => toggle(st.value)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                    isOn
                      ? "border-navy-700 bg-navy-50"
                      : "border-border bg-white hover:border-navy-300"
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{st.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-900 text-sm">{st.label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                      {st.description}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                      isOn
                        ? "border-navy-700 bg-navy-700"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isOn && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <TextAreaField
          label="Overall Strategy Narrative"
          value={ms.overallApproach || ""}
          onChange={(v) => update({ overallApproach: v })}
          placeholder={
            "Describe your overall approach in plain language. How will you reach your target customers? " +
            "What is the order of priority among your chosen approaches? " +
            "What does the first 90 days look like versus 12 months?"
          }
          rows={5}
          required
          helpText="2–4 sentences. Be specific about your customer, your main mechanism, and your priority order."
        />

        <TextAreaField
          label="Positioning in Market Communications"
          value={ms.positioningNote || ""}
          onChange={(v) => update({ positioningNote: v })}
          placeholder="How will you communicate your positioning in marketing? What message will you lead with? What tone and style will define your brand voice?"
          rows={3}
          helpText="This should be consistent with your Market Analysis positioning statement."
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

// ─── Channel definitions ──────────────────────────────────────────────────────
const DEFAULT_CHANNELS: Omit<ChannelCard, "id">[] = [
  {
    channel: "Social Media",
    description: "Organic posts, stories, reels, and community engagement on social platforms",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Followers, engagement rate, reach",
    priority: "high",
    enabled: false,
  },
  {
    channel: "Email Marketing",
    description: "Direct email campaigns, newsletters, and automated sequences to subscribers",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Open rate, click rate, unsubscribe rate",
    priority: "high",
    enabled: false,
  },
  {
    channel: "Search Engine Optimisation (SEO)",
    description: "Improving organic Google search rankings through content and technical optimisation",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Organic traffic, keyword rankings, leads from organic",
    priority: "medium",
    enabled: false,
  },
  {
    channel: "Paid Advertising (Google / Meta / Other)",
    description: "Pay-per-click, display, and social ads to drive targeted traffic and conversions",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Cost per click, cost per acquisition, ROAS",
    priority: "medium",
    enabled: false,
  },
  {
    channel: "Referral Program",
    description: "Incentivised or organic word-of-mouth referrals from existing customers",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Referral rate, new customers from referral",
    priority: "high",
    enabled: false,
  },
  {
    channel: "Partnerships & Co-Marketing",
    description: "Collaborative campaigns, cross-promotions, or distribution via partner businesses",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Leads from partnerships, partnership revenue",
    priority: "medium",
    enabled: false,
  },
  {
    channel: "Content Marketing",
    description: "Blog posts, videos, podcasts, guides — educational content that builds trust and SEO",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Traffic, time-on-page, leads from content",
    priority: "medium",
    enabled: false,
  },
  {
    channel: "Local / Community Marketing",
    description: "Local events, community groups, local sponsorships, in-person networking",
    targetAudience: "",
    tactics: "",
    frequency: "",
    estimatedMonthlyBudget: 0,
    kpi: "Event attendance, local brand awareness, referrals",
    priority: "low",
    enabled: false,
  },
];

// ─── 03 — Marketing Channels ─────────────────────────────────────────────────
function MSChannels({ ms, update, status, markComplete, onNext, onPrev }: any) {
  const channels: ChannelCard[] = ms.channels && ms.channels.length > 0
    ? ms.channels
    : DEFAULT_CHANNELS.map((c) => ({ ...c, id: generateId() }));

  const ensureInitialised = () => {
    if (!ms.channels || ms.channels.length === 0) {
      update({ channels });
    }
  };

  const toggleChannel = (id: string) => {
    ensureInitialised();
    const updated = channels.map((c) =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    update({ channels: updated });
  };

  const updateChannel = (id: string, changes: Partial<ChannelCard>) => {
    const updated = channels.map((c) =>
      c.id === id ? { ...c, ...changes } : c
    );
    update({ channels: updated });
  };

  const enabledChannels = channels.filter((c) => c.enabled);

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={3}
        topicTitle="Channel-by-Channel Strategy"
        estimatedMinutes={12}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Channel strategy vs channel presence</h3>
        <p className="text-navy-700 mb-3">
          Most businesses try to be on every channel and do nothing well on any of them. A stronger approach is to choose 2–4 channels based on where your customers actually are, how much budget you have, and how well each channel fits your offering.
        </p>
        <p className="text-navy-700">
          For each channel you select, document your tactics, frequency, and expected KPI. Vague plans — "we'll post on Instagram" — are not strategies. Specific ones are: "3 posts per week on Instagram, targeting Melbourne cyclists, featuring before/after repair content, goal: 1,000 local followers in 6 months."
        </p>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Channel selection rule:</strong> Only activate channels where your target customers actively spend time. For B2C local services, Instagram, Google, and referrals are typically highest-value. For B2B, LinkedIn and direct sales usually outperform social media.
        </p>
      </EducationPanel>

      {/* Channel selector grid */}
      <div className="mt-8">
        <h3 className="font-semibold text-navy-900 text-sm mb-4">
          Select and configure your marketing channels
        </h3>
        <div className="space-y-3">
          {channels.map((channel) => (
            <ChannelCardEditor
              key={channel.id}
              channel={channel}
              onToggle={() => toggleChannel(channel.id)}
              onUpdate={(changes) => updateChannel(channel.id, changes)}
            />
          ))}
        </div>
      </div>

      {enabledChannels.length === 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 text-sm">
            No channels selected yet. Toggle channels above to activate them and document your strategy for each.
          </p>
        </div>
      )}

      {enabledChannels.length > 0 && (
        <div className="mt-6 p-4 bg-navy-50 border border-navy-200 rounded-xl">
          <p className="text-navy-700 text-sm font-semibold mb-1">
            {enabledChannels.length} channel{enabledChannels.length > 1 ? "s" : ""} selected
          </p>
          <p className="text-navy-500 text-xs">
            {enabledChannels.map((c) => c.channel).join(" · ")}
          </p>
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

// ─── Channel card editor component ───────────────────────────────────────────
function ChannelCardEditor({
  channel,
  onToggle,
  onUpdate,
}: {
  channel: ChannelCard;
  onToggle: () => void;
  onUpdate: (changes: Partial<ChannelCard>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    high: "text-sage-600 bg-sage-50 border-sage-200",
    medium: "text-amber-600 bg-amber-50 border-amber-200",
    low: "text-slate-500 bg-slate-50 border-slate-200",
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        channel.enabled ? "border-navy-300" : "border-border opacity-80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
            channel.enabled ? "bg-navy-800" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              channel.enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm">{channel.channel}</p>
          <p className="text-muted-foreground text-xs mt-0.5 truncate">{channel.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {channel.enabled && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                priorityColors[channel.priority]
              }`}
            >
              {channel.priority.charAt(0).toUpperCase() + channel.priority.slice(1)} priority
            </span>
          )}
          {channel.enabled && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-navy-400 hover:text-navy-700 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              >
                <path
                  d="M2 4l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded editor */}
      {channel.enabled && expanded && (
        <div className="px-5 pb-6 pt-2 border-t border-border bg-white space-y-4">
          {/* Priority */}
          <div>
            <label className="input-label mb-2 block">Priority</label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdate({ priority: p })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                    channel.priority === p
                      ? "border-navy-700 bg-navy-50 text-navy-900"
                      : "border-border bg-white text-navy-500 hover:border-navy-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <TextAreaField
            label="Target Audience on This Channel"
            value={channel.targetAudience || ""}
            onChange={(v) => onUpdate({ targetAudience: v })}
            placeholder="Who specifically are you trying to reach on this channel? Be specific."
            rows={2}
          />

          <TextAreaField
            label="Tactics & Content Plan"
            value={channel.tactics || ""}
            onChange={(v) => onUpdate({ tactics: v })}
            placeholder={
              channel.channel.includes("Social")
                ? "e.g. 3 posts per week: before/after repairs, customer testimonials, cycling tips. Stories 5x/week. Local hashtags."
                : channel.channel.includes("Email")
                ? "e.g. Welcome sequence (5 emails). Monthly newsletter. Post-service review request. Seasonal promotions."
                : channel.channel.includes("SEO")
                ? "e.g. Blog: 2 posts/month targeting 'mobile bike repair Melbourne'. Claim Google Business Profile. Build local citations."
                : "Describe your specific tactics, content, and execution plan for this channel."
            }
            rows={4}
            helpText="Be specific. What will you actually publish, send, or do — and how often?"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Frequency / Cadence"
              value={channel.frequency || ""}
              onChange={(v) => onUpdate({ frequency: v })}
              placeholder="e.g. 3x per week, monthly, ongoing"
            />
            <div>
              <label className="input-label">Estimated Monthly Budget</label>
              <p className="text-xs text-muted-foreground mb-2">$0 for organic/free channels</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={channel.estimatedMonthlyBudget ?? ""}
                  onChange={(e) =>
                    onUpdate({ estimatedMonthlyBudget: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full border border-input bg-white pl-8 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 transition-all"
                />
              </div>
            </div>
          </div>

          <TextField
            label="Primary KPI for This Channel"
            value={channel.kpi || ""}
            onChange={(v) => onUpdate({ kpi: v })}
            placeholder="e.g. Cost per lead, monthly organic traffic, email open rate"
            helpText="How will you measure success on this channel specifically?"
          />
        </div>
      )}
    </div>
  );
}

// ─── 04 — Customer Acquisition ───────────────────────────────────────────────
function MSAcquisition({ ms, update, status, markComplete, onNext, onPrev, plan }: any) {
  const totalMonthlyBudget =
    (ms.channels || []).reduce(
      (sum: number, c: ChannelCard) => sum + (c.estimatedMonthlyBudget || 0),
      0
    ) || 0;

  const cac =
    totalMonthlyBudget > 0 && ms.customerTarget
      ? (totalMonthlyBudget / parseInt(ms.customerTarget)).toFixed(2)
      : null;

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={4}
        topicTitle="Customer Acquisition"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Customer Acquisition Cost (CAC)</h3>
        <p className="text-navy-700 mb-3">
          CAC is the total cost of acquiring one new paying customer. It is calculated by dividing your total marketing spend by the number of new customers acquired in the same period.
        </p>
        <div className="bg-white/70 border border-navy-200 rounded-lg p-4">
          <p className="font-mono text-navy-800 text-sm font-bold mb-2">
            CAC = Total Marketing Spend ÷ New Customers Acquired
          </p>
          <p className="text-navy-600 text-xs">
            Example: If you spend $2,000/month on marketing and acquire 40 new customers, your CAC is $50.
          </p>
        </div>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>CAC must be lower than Customer Lifetime Value (LTV).</strong> If it costs you more to acquire a customer than they ever pay you, the business cannot be profitable. The CAC:LTV ratio should typically be at least 1:3 — meaning the customer generates at least 3× what it cost to acquire them.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        {/* CAC calculator */}
        {totalMonthlyBudget > 0 && (
          <div className="bg-navy-50 border border-navy-200 rounded-xl p-5">
            <p className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-4">
              CAC Calculator
            </p>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-navy-400 text-[11px] mb-1">Monthly Marketing Budget</p>
                <p className="font-bold text-navy-900 text-lg">
                  ${totalMonthlyBudget.toFixed(0)}
                </p>
                <p className="text-navy-400 text-[10px]">from channel budgets above</p>
              </div>
              <div className="flex items-center justify-center text-navy-300 text-xl font-light">
                ÷
              </div>
              <div>
                <p className="text-navy-400 text-[11px] mb-1">Target New Customers/Month</p>
                <input
                  type="number"
                  min="1"
                  value={ms.customerTarget || ""}
                  onChange={(e) => update({ customerTarget: e.target.value })}
                  placeholder="e.g. 40"
                  className="w-full text-center font-bold text-navy-900 text-lg border border-navy-300 rounded-lg py-1 bg-white focus:outline-none focus:ring-2 focus:ring-navy-700"
                />
              </div>
            </div>
            {cac && (
              <div className="border-t border-navy-200 pt-4 text-center">
                <p className="text-3xl font-bold text-navy-900">${cac}</p>
                <p className="text-navy-500 text-xs mt-1">Estimated Cost Per Acquisition</p>
              </div>
            )}
          </div>
        )}

        <TextField
          label="Target Cost Per Acquisition"
          value={ms.acquisitionCost !== undefined ? String(ms.acquisitionCost) : ""}
          onChange={(v) => update({ acquisitionCost: parseFloat(v) || undefined })}
          placeholder="e.g. 35"
          helpText="What is your maximum acceptable CAC? This becomes a financial constraint and KPI."
        />

        <TextAreaField
          label="Lead Sources"
          value={ms.leadSources || ""}
          onChange={(v) => update({ leadSources: v })}
          placeholder="Where will leads come from? Google search, Instagram DMs, referrals, word of mouth, local partnerships? Estimate the % from each source if possible."
          rows={4}
          helpText="Understanding where leads originate helps you allocate budget and prioritise channels."
        />

        <TextAreaField
          label="Conversion Funnel"
          value={ms.conversionFunnel || ""}
          onChange={(v) => update({ conversionFunnel: v })}
          placeholder={
            "Describe how a prospect moves from first awareness to paying customer.\n" +
            "Example: Instagram reel → profile visit → booking page → booked → service delivered → review requested → referral"
          }
          rows={4}
          helpText="A clear funnel helps identify where conversions break down — and where to focus optimisation."
        />

        <TextAreaField
          label="Acquisition Goal"
          value={ms.acquisitionGoal || ""}
          onChange={(v) => update({ acquisitionGoal: v })}
          placeholder="Describe your overall customer acquisition goal for the first year — number of customers, monthly run rate, or revenue milestone."
          rows={2}
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

// ─── 05 — Sales Strategy ─────────────────────────────────────────────────────
const SALES_MODELS = [
  { value: "self_serve", label: "Self-Serve / Online Booking", description: "Customer finds, selects, and purchases without sales involvement" },
  { value: "transactional", label: "Transactional Sales", description: "Short sales cycle, low-touch — customer decides quickly" },
  { value: "consultative", label: "Consultative Sales", description: "Relationship-led, needs analysis, custom proposals" },
  { value: "enterprise", label: "Enterprise / Complex Sales", description: "Long cycle, multiple stakeholders, formal procurement" },
  { value: "channel", label: "Channel / Partner Sales", description: "Sales done by distributors, resellers, or partners" },
];

const DISTRIBUTION_CHANNELS = [
  { value: "direct_online", label: "Direct — Online / Website" },
  { value: "direct_inperson", label: "Direct — In-Person / On-Site" },
  { value: "direct_phone", label: "Direct — Phone or Email" },
  { value: "platform", label: "Third-Party Platform (e.g. Airtasker, Amazon)" },
  { value: "retail", label: "Retail / Wholesale" },
  { value: "reseller", label: "Reseller / Distributor" },
  { value: "partner", label: "Partner Channel" },
  { value: "marketplace", label: "Online Marketplace" },
];

function MSSales({ ms, update, status, markComplete, onNext, onPrev }: any) {
  const selectedDistribution: string[] = ms.distributionChannels
    ? (ms.distributionChannels as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const toggleDistribution = (v: string) => {
    const updated = selectedDistribution.includes(v)
      ? selectedDistribution.filter((s) => s !== v)
      : [...selectedDistribution, v];
    update({ distributionChannels: updated.join(", ") });
  };

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={5}
        topicTitle="Sales Strategy & Distribution"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Sales strategy vs marketing strategy</h3>
        <p className="text-navy-700 mb-3">
          Marketing gets a prospect's attention and interest. Sales converts that interest into a purchase. For some businesses (online, self-serve), the product itself does the selling. For others (B2B, complex services), a human sales process is essential.
        </p>
        <p className="text-navy-700">
          Your sales model should match your customer's buying process — not your preference. If your customer wants to research, compare, and decide on their own time, a high-pressure outbound call strategy will repel them.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Sales model */}
        <div>
          <label className="input-label mb-3 block">Sales Model</label>
          <div className="space-y-2">
            {SALES_MODELS.map((model) => (
              <button
                key={model.value}
                onClick={() => update({ salesModel: model.value })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  ms.salesModel === model.value
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    ms.salesModel === model.value
                      ? "border-navy-700 bg-navy-700"
                      : "border-muted-foreground"
                  }`}
                >
                  {ms.salesModel === model.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-navy-900 text-sm">{model.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{model.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <TextAreaField
          label="Sales Process"
          value={ms.salesProcess || ""}
          onChange={(v) => update({ salesProcess: v })}
          placeholder={
            "Describe your step-by-step sales process from first contact to completed sale.\n" +
            "Example:\n" +
            "1. Customer finds us via Google or referral\n" +
            "2. Views service page and clicks 'Book Now'\n" +
            "3. Selects service, location, and time slot\n" +
            "4. Receives booking confirmation + pre-service reminder\n" +
            "5. Service delivered and payment processed"
          }
          rows={6}
          required
          helpText="Map every step. Gaps in the sales process often explain conversion failures."
        />

        <TextField
          label="Typical Sales Cycle Length"
          value={ms.salesCycleLength || ""}
          onChange={(v) => update({ salesCycleLength: v })}
          placeholder="e.g. Same day, 1–2 days, 1–3 weeks, 3–6 months"
          helpText="How long does it typically take from first contact to purchase?"
        />

        {/* Distribution */}
        <div>
          <label className="input-label mb-2 block">
            Distribution Channels (select all that apply)
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            How does the customer actually access and purchase your offering?
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {DISTRIBUTION_CHANNELS.map((dc) => {
              const isOn = selectedDistribution.includes(dc.value);
              return (
                <button
                  key={dc.value}
                  onClick={() => toggleDistribution(dc.value)}
                  className={`px-4 py-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    isOn
                      ? "border-navy-700 bg-navy-50 text-navy-900"
                      : "border-border bg-white text-navy-600 hover:border-navy-300"
                  }`}
                >
                  {dc.label}
                </button>
              );
            })}
          </div>
        </div>

        <TextAreaField
          label="Distribution Description"
          value={ms.distributionDescription || ""}
          onChange={(v) => update({ distributionDescription: v })}
          placeholder="Describe how your distribution channels work in practice. What technology, platforms, or systems underpin each channel? What is the customer experience at the point of purchase?"
          rows={4}
        />

        <TextAreaField
          label="Pricing Communication"
          value={ms.pricingCommunication || ""}
          onChange={(v) => update({ pricingCommunication: v })}
          placeholder="How are prices communicated to customers? Transparent pricing on the website, quotes on request, negotiated per client? What is the rationale for this approach?"
          rows={3}
          helpText="Price transparency affects conversion rate. Research shows that displaying prices reduces friction for service businesses."
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

// ─── 06 — Marketing Budget ────────────────────────────────────────────────────
const BUDGET_CATEGORIES = [
  "Paid Advertising",
  "Content Creation",
  "Design & Creative",
  "Email Platform",
  "Social Media Tools",
  "SEO / Analytics Tools",
  "Events & Sponsorships",
  "Influencer / PR",
  "Print / Collateral",
  "Agency / Contractor Fees",
  "Referral Incentives",
  "Other",
];

function MSBudget({ ms, update, status, markComplete, onNext, onPrev }: any) {
  const budgetItems: BudgetItem[] = ms.budgetItems || [];

  const addItem = () =>
    update({
      budgetItems: [
        ...budgetItems,
        { id: generateId(), category: "", item: "", monthlyAmount: 0, notes: "" },
      ],
    });

  const updateItem = (id: string, changes: Partial<BudgetItem>) =>
    update({
      budgetItems: budgetItems.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    });

  const removeItem = (id: string) =>
    update({ budgetItems: budgetItems.filter((b) => b.id !== id) });

  const totalMonthly = budgetItems.reduce(
    (sum, b) => sum + (b.monthlyAmount || 0),
    0
  );
  const totalAnnual = totalMonthly * 12;

  // Also pull channel budgets for reference
  const channelBudgetTotal = (ms.channels || []).reduce(
    (sum: number, c: ChannelCard) => sum + (c.estimatedMonthlyBudget || 0),
    0
  );

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={6}
        topicTitle="Marketing Budget"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why budget matters in a business plan</h3>
        <p className="text-navy-700 mb-3">
          A marketing strategy without a budget is a wish list. The budget forces you to make deliberate tradeoffs — which channels you can actually afford, what volume of activity is realistic, and how long you can sustain marketing before it needs to pay for itself.
        </p>
        <p className="text-navy-700">
          Marketing budgets typically range from 5–20% of projected revenue for established businesses, and often higher for launch phases when you're building awareness from zero. There is no universal rule — what matters is that your budget is tied to your objectives and realistic given your financial plan.
        </p>
      </EducationPanel>

      {channelBudgetTotal > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-sm font-medium mb-1">
            Channel budgets from Marketing Channels topic
          </p>
          <p className="text-blue-700 text-sm">
            You've entered channel-level budgets totalling{" "}
            <strong>${channelBudgetTotal.toFixed(0)}/month</strong>. You can use this as a reference
            to populate the budget builder below, or build it independently here.
          </p>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Marketing Budget Builder</h3>
          <button
            onClick={addItem}
            className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Line Item
          </button>
        </div>

        {budgetItems.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No budget items yet.</p>
            <p className="text-muted-foreground text-xs">
              Add each marketing expense line by line.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
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
                  {budgetItems.map((item, i) => (
                    <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2">
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.id, { category: e.target.value })}
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        >
                          <option value="">Select…</option>
                          {BUDGET_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={item.item}
                          onChange={(e) => updateItem(item.id, { item: e.target.value })}
                          placeholder="e.g. Google Ads campaign"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={item.monthlyAmount || ""}
                          onChange={(e) =>
                            updateItem(item.id, { monthlyAmount: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white text-right focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-navy-700 text-xs font-medium">
                        ${((item.monthlyAmount || 0) * 12).toFixed(0)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-200 bg-navy-50">
                    <td className="px-4 py-3 text-xs font-bold text-navy-700" colSpan={2}>
                      Total Marketing Budget
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">
                      ${totalMonthly.toFixed(0)}/mo
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">
                      ${totalAnnual.toFixed(0)}/yr
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5">
          <TextAreaField
            label="Budget Notes"
            value={ms.budgetNotes || ""}
            onChange={(v) => update({ budgetNotes: v })}
            placeholder="Any notes on the budget — assumptions made, items that may vary, phased spending plan (e.g. higher in launch months), or future expansion."
            rows={3}
            helpText="This budget will feed into your Financial Plan phase. Make sure major items are included."
          />
        </div>
      </div>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Cross-check:</strong> The total marketing budget recorded here must be reflected in your Financial Plan → Operating Expenses. If you skip this step, your P&L will understate costs.
        </p>
      </EducationPanel>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 07 — Customer Retention ─────────────────────────────────────────────────
function MSRetention({ ms, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={7}
        topicTitle="Customer Retention"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Retention is cheaper than acquisition</h3>
        <p className="text-navy-700 mb-3">
          Acquiring a new customer typically costs 5–7× more than retaining an existing one. A customer retention strategy is not optional — it directly affects profitability, lifetime value, and referral rate.
        </p>
        <p className="text-navy-700">
          Retention is not just about loyalty programs. It starts with service quality, continues through post-purchase follow-up, and is sustained by ongoing communication that keeps your brand relevant between purchases.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Retention tactics (mobile bike repair example):</p>
        <ul className="space-y-1.5 text-navy-700 text-sm">
          <li>• Post-service email asking for a Google review (sent 2 hours after completion)</li>
          <li>• 90-day "time for a service?" reminder email personalised by last service type</li>
          <li>• Annual service reminder with 10% loyalty discount</li>
          <li>• Referral card left physically with the bike post-service — $10 off for each friend referred</li>
          <li>• Monthly newsletter: cycling tips, local event calendar, seasonal maintenance reminders</li>
        </ul>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Customer Retention Strategy"
          value={ms.retentionStrategy || ""}
          onChange={(v) => update({ retentionStrategy: v })}
          placeholder={
            "Describe your overall approach to keeping customers coming back.\n" +
            "What will you do after the first purchase to build a long-term relationship?"
          }
          rows={4}
          required
        />

        <TextAreaField
          label="Repeat Purchase Tactics"
          value={ms.repeatPurchaseTactics || ""}
          onChange={(v) => update({ repeatPurchaseTactics: v })}
          placeholder={
            "List the specific tactics you will use to drive repeat purchases:\n" +
            "• Follow-up emails or calls\n" +
            "• Reminders (time-based or trigger-based)\n" +
            "• Upsell and cross-sell moments\n" +
            "• Re-engagement campaigns for lapsed customers"
          }
          rows={5}
          helpText="Be specific about timing and mechanism — not just 'send emails'."
        />

        <div>
          <label className="input-label mb-3 block">
            Do you plan to implement a loyalty or rewards program?
          </label>
          <div className="flex gap-3">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                onClick={() => update({ loyaltyProgram: val })}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                  ms.loyaltyProgram === val
                    ? "border-navy-700 bg-navy-50 text-navy-900"
                    : "border-border bg-white text-navy-600 hover:border-navy-300"
                }`}
              >
                {val ? "Yes" : "No / Not planned"}
              </button>
            ))}
          </div>
        </div>

        {ms.loyaltyProgram === true && (
          <TextAreaField
            label="Loyalty Program Description"
            value={ms.loyaltyDescription || ""}
            onChange={(v) => update({ loyaltyDescription: v })}
            placeholder="Describe the loyalty program. What is the mechanic (points, punch card, tiered rewards)? What is the reward? Who qualifies? When does it activate?"
            rows={3}
          />
        )}

        <TextAreaField
          label="Customer Satisfaction & NPS Strategy"
          value={ms.npsStrategy || ""}
          onChange={(v) => update({ npsStrategy: v })}
          placeholder="How will you measure and monitor customer satisfaction? Post-service surveys, Google reviews, Net Promoter Score (NPS) surveys? What threshold will trigger a follow-up?"
          rows={3}
          helpText="Customer feedback systems create a loop between experience and improvement."
        />

        <TextAreaField
          label="Churn Mitigation"
          value={ms.churnMitigation || ""}
          onChange={(v) => update({ churnMitigation: v })}
          placeholder="How will you identify customers at risk of not returning? What will you do when a previously active customer goes quiet? Any win-back campaigns planned?"
          rows={3}
          helpText="For subscription or recurring service businesses, churn rate is a critical KPI."
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

// ─── 08 — KPIs ───────────────────────────────────────────────────────────────
const SUGGESTED_KPIS = [
  { metric: "Cost Per Acquisition (CPA / CAC)", frequency: "Monthly", tool: "Spreadsheet / Analytics" },
  { metric: "Customer Lifetime Value (LTV)", frequency: "Quarterly", tool: "CRM / Spreadsheet" },
  { metric: "LTV:CAC Ratio", frequency: "Quarterly", tool: "Spreadsheet" },
  { metric: "Website Traffic", frequency: "Monthly", tool: "Google Analytics" },
  { metric: "Lead-to-Customer Conversion Rate", frequency: "Monthly", tool: "CRM / Spreadsheet" },
  { metric: "Email Open Rate", frequency: "Per campaign", tool: "Email platform" },
  { metric: "Repeat Purchase Rate", frequency: "Monthly", tool: "CRM / Booking system" },
  { metric: "Net Promoter Score (NPS)", frequency: "Quarterly", tool: "Survey tool" },
  { metric: "Social Media Reach / Engagement Rate", frequency: "Monthly", tool: "Platform analytics" },
  { metric: "Google Business Profile Views / Calls", frequency: "Monthly", tool: "Google Business" },
  { metric: "Revenue from Marketing-Sourced Leads", frequency: "Monthly", tool: "CRM" },
  { metric: "Churn Rate", frequency: "Monthly", tool: "CRM / Subscription tool" },
];

function MSKPIs({ ms, update, status, markComplete, onNext, onPrev }: any) {
  const kpis: KPIItem[] = ms.kpis || [];

  const addKPI = () =>
    update({
      kpis: [
        ...kpis,
        { id: generateId(), metric: "", target: "", frequency: "", tool: "" },
      ],
    });

  const updateKPI = (id: string, changes: Partial<KPIItem>) =>
    update({ kpis: kpis.map((k) => (k.id === id ? { ...k, ...changes } : k)) });

  const removeKPI = (id: string) =>
    update({ kpis: kpis.filter((k) => k.id !== id) });

  const addSuggested = (suggested: (typeof SUGGESTED_KPIS)[0]) => {
    if (kpis.some((k) => k.metric === suggested.metric)) return;
    update({
      kpis: [
        ...kpis,
        {
          id: generateId(),
          metric: suggested.metric,
          target: "",
          frequency: suggested.frequency,
          tool: suggested.tool,
        },
      ],
    });
  };

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={8}
        topicTitle="Key Performance Indicators"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What gets measured, gets managed</h3>
        <p className="text-navy-700 mb-3">
          KPIs are the specific metrics you will track to know whether your marketing strategy is working. Without them, you have no feedback loop — no way to tell if spending is producing results or if changes are making things better or worse.
        </p>
        <p className="text-navy-700">
          Choose 4–8 KPIs that directly reflect your objectives. Too few and you're flying blind. Too many and you'll track everything and act on nothing.
        </p>
      </EducationPanel>

      {/* Suggested KPIs */}
      <div className="mt-6">
        <h3 className="font-semibold text-navy-900 text-sm mb-3">
          Common marketing KPIs — click to add
        </h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_KPIS.map((s) => {
            const isAdded = kpis.some((k) => k.metric === s.metric);
            return (
              <button
                key={s.metric}
                onClick={() => addSuggested(s)}
                disabled={isAdded}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  isAdded
                    ? "border-sage-300 bg-sage-50 text-sage-600 cursor-default"
                    : "border-navy-300 bg-white text-navy-700 hover:border-navy-600 hover:bg-navy-50"
                }`}
              >
                {isAdded ? "✓ " : "+ "}
                {s.metric}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI editor */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Your KPIs</h3>
          <button
            onClick={addKPI}
            className="text-xs text-navy-700 font-medium hover:text-navy-900 border border-navy-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Custom KPI
          </button>
        </div>

        {kpis.length === 0 ? (
          <div className="bg-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No KPIs added yet. Click a suggestion above or add a custom KPI.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Metric</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Target</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Frequency</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold">Tool</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((kpi, i) => (
                    <tr key={kpi.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                      <td className="px-4 py-2">
                        <input
                          value={kpi.metric}
                          onChange={(e) => updateKPI(kpi.id, { metric: e.target.value })}
                          placeholder="e.g. Cost Per Acquisition"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={kpi.target || ""}
                          onChange={(e) => updateKPI(kpi.id, { target: e.target.value })}
                          placeholder="e.g. < $35"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={kpi.frequency || ""}
                          onChange={(e) => updateKPI(kpi.id, { frequency: e.target.value })}
                          placeholder="Monthly"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={kpi.tool || ""}
                          onChange={(e) => updateKPI(kpi.id, { tool: e.target.value })}
                          placeholder="e.g. Google Analytics"
                          className="w-full text-xs border border-input rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-navy-700"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => removeKPI(kpi.id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <SelectField
          label="Reporting Cadence"
          value={ms.reportingCadence || ""}
          onChange={(v) => update({ reportingCadence: v })}
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "fortnightly", label: "Fortnightly" },
            { value: "monthly", label: "Monthly (recommended)" },
            { value: "quarterly", label: "Quarterly" },
          ]}
          helpText="How often will you formally review your marketing KPIs and adjust strategy?"
        />
      </div>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          Your first version of KPIs will change once you have real data. The goal is to start measuring on day one — even imperfectly — so you can make decisions based on signal rather than guesswork.
        </p>
      </EducationPanel>

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}

// ─── 09 — Phase Review ───────────────────────────────────────────────────────
function MSReview({ ms, update, status, markComplete, onNext, onPrev, onNavigate }: any) {
  const enabledChannels = (ms.channels || []).filter((c: ChannelCard) => c.enabled);
  const budgetItems: BudgetItem[] = ms.budgetItems || [];
  const kpis: KPIItem[] = ms.kpis || [];
  const totalMonthlyBudget = budgetItems.reduce((sum, b) => sum + (b.monthlyAmount || 0), 0);

  const fields = [
    {
      label: "Marketing Objectives",
      value: ms.primaryObjectives,
      topicId: "ms_objectives",
      summary: ms.primaryObjectives ? ms.primaryObjectives.slice(0, 100) + "…" : null,
    },
    {
      label: "Overall Strategy",
      value: ms.overallApproach,
      topicId: "ms_strategy",
      summary: ms.strategyTypes?.length
        ? `${ms.strategyTypes.length} approach(es): ${ms.strategyTypes.join(", ")}`
        : null,
    },
    {
      label: "Marketing Channels",
      value: enabledChannels.length > 0 ? `${enabledChannels.length} channel(s) active` : null,
      topicId: "ms_channels",
      summary: enabledChannels.map((c: ChannelCard) => c.channel).join(", ") || null,
    },
    {
      label: "Customer Acquisition",
      value: ms.leadSources || ms.conversionFunnel,
      topicId: "ms_acquisition",
      summary: ms.acquisitionCost ? `Target CAC: $${ms.acquisitionCost}` : ms.leadSources?.slice(0, 80),
    },
    {
      label: "Sales Strategy",
      value: ms.salesProcess,
      topicId: "ms_sales",
      summary: ms.salesModel
        ? `Model: ${SALES_MODELS.find((m) => m.value === ms.salesModel)?.label || ms.salesModel}`
        : null,
    },
    {
      label: "Marketing Budget",
      value: totalMonthlyBudget > 0 ? `$${totalMonthlyBudget}/month` : null,
      topicId: "ms_budget",
      summary: totalMonthlyBudget > 0
        ? `$${totalMonthlyBudget}/month · $${(totalMonthlyBudget * 12).toFixed(0)}/year`
        : null,
    },
    {
      label: "Customer Retention",
      value: ms.retentionStrategy,
      topicId: "ms_retention",
      summary: ms.retentionStrategy ? ms.retentionStrategy.slice(0, 80) + "…" : null,
    },
    {
      label: "KPIs",
      value: kpis.length > 0 ? `${kpis.length} KPI(s) defined` : null,
      topicId: "ms_kpis",
      summary: kpis.map((k) => k.metric).filter(Boolean).slice(0, 3).join(", ") || null,
    },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  return (
    <div>
      <TopicHeader
        phase="Marketing & Sales"
        phaseNumber={5}
        topicNumber={9}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Summary table */}
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Marketing & Sales — Summary</h2>
          <span
            className={`text-sm font-semibold ${
              completed === total ? "text-sage-600" : "text-amber-500"
            }`}
          >
            {completed}/{total} sections complete
          </span>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  f.value ? "bg-sage-500" : "bg-amber-400"
                }`}
              />
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
                  onClick={() => onNavigate("marketing_sales", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Channel + budget snapshot */}
      {(enabledChannels.length > 0 || totalMonthlyBudget > 0) && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Marketing Snapshot</h3>

          {enabledChannels.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-navy-500 uppercase mb-2">Active Channels</p>
              <div className="flex flex-wrap gap-2">
                {enabledChannels.map((c: ChannelCard) => (
                  <span
                    key={c.id}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      c.priority === "high"
                        ? "bg-sage-50 border-sage-200 text-sage-700"
                        : c.priority === "medium"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {c.channel}
                  </span>
                ))}
              </div>
            </div>
          )}

          {totalMonthlyBudget > 0 && (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white rounded-lg p-3 border border-border">
                <p className="text-navy-400 text-[11px] mb-1">Monthly Budget</p>
                <p className="font-bold text-navy-900 text-lg">
                  ${totalMonthlyBudget.toFixed(0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-border">
                <p className="text-navy-400 text-[11px] mb-1">Annual Budget</p>
                <p className="font-bold text-navy-900 text-lg">
                  ${(totalMonthlyBudget * 12).toFixed(0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-border">
                <p className="text-navy-400 text-[11px] mb-1">KPIs Defined</p>
                <p className="font-bold text-navy-900 text-lg">{kpis.length}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cross-check: budget in financial plan */}
      {totalMonthlyBudget > 0 && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-sm font-semibold mb-1">
            Reminder: Add marketing budget to Financial Plan
          </p>
          <p className="text-blue-700 text-sm">
            Your marketing budget of <strong>${totalMonthlyBudget}/month</strong> must be included
            in your Financial Plan → Operating Expenses. Without it, your P&amp;L projections will be
            understated.
          </p>
        </div>
      )}

      {completed === total ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Marketing & Sales is complete. You're ready for Operations — where you'll document how the business runs day-to-day.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {total - completed} section{total - completed > 1 ? "s" : ""} still incomplete. Continue and return later — but aim to have objectives, channels, sales process, and budget fully completed before the Financial Plan phase.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Operations →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
