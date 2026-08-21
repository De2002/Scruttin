import React, { useState } from "react";
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
import psHero from "@/assets/phase-products-hero.jpg";

// ─── Phase constants ──────────────────────────────────────────────────────────
const PHASE = PHASES.find((p) => p.id === "products_services")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── PS data shape ────────────────────────────────────────────────────────────
interface PSData {
  offerings?: Product[];
  overallValueProp?: string;
  productMixDescription?: string;
  ipOwned?: boolean;
  ipDescription?: string;
  ipTypes?: string[];
  rdActivities?: string;
  futureOfferings?: string;
  futureTimeframe?: string;
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
export default function ProductsServicesPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  // PS data lives in plan.products (array) + extra fields we store in a new
  // top-level key "productsServices" via (plan as any)
  const ps: PSData = (plan as any).productsServices || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<PSData>) => {
    onUpdatePlan({ productsServices: { ...ps, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next
      ? onNavigate("products_services", nav.next.id)
      : onNavigate("marketing_sales", "ms_objectives");
  const handlePrev = () =>
    nav.prev
      ? onNavigate("products_services", nav.prev.id)
      : onNavigate("organization", "org_review");

  const sharedProps = {
    ps,
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
      case "ps_intro":            return <PSIntro {...sharedProps} />;
      case "ps_offerings":        return <PSOfferings {...sharedProps} />;
      case "ps_features_benefits": return <PSFeaturesBenefits {...sharedProps} />;
      case "ps_value_proposition": return <PSValueProp {...sharedProps} />;
      case "ps_pricing":          return <PSPricing {...sharedProps} />;
      case "ps_ip":               return <PSIP {...sharedProps} />;
      case "ps_future":           return <PSFuture {...sharedProps} />;
      case "ps_review":           return <PSReview {...sharedProps} />;
      default:                    return <PSIntro {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Hero banner (reused on intro) ───────────────────────────────────────────
function PSHero() {
  return (
    <div className="relative rounded-xl overflow-hidden mb-8 h-44 sm:h-56">
      <img
        src={psHero}
        alt="Products & Services"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/85 to-navy-900/25 flex flex-col justify-end p-6">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
          Phase 4
        </p>
        <h2 className="text-white font-serif text-2xl font-bold leading-tight">
          Products & Services
        </h2>
        <p className="text-white/65 text-sm mt-1">
          Define what you offer, its value, and how it reaches customers
        </p>
      </div>
    </div>
  );
}

// ─── 01 — Introduction ────────────────────────────────────────────────────────
function PSIntro({ ps, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <PSHero />
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={1}
        topicTitle="Introduction"
        estimatedMinutes={3}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          This phase is where you document what your business actually sells — in a structured, specific way that readers can understand and evaluate.
        </p>
        <p className="text-navy-700 mb-3">
          Many business plans describe products in vague, marketing-flavoured language. That's not what this section is for. What readers need — lenders, investors, advisors — is a clear, factual description of your offering: what it is, who it's for, how it's priced, what it costs to deliver, and what value it creates.
        </p>
        <p className="text-navy-700">
          If you offer multiple products or services, you'll document each one separately. This gives you a clean, complete record of your product mix.
        </p>
      </EducationPanel>

      <div className="mt-6 bg-white border border-border rounded-xl p-5">
        <h3 className="font-semibold text-navy-900 mb-3">What you'll cover in this phase</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            "Each product or service documented individually",
            "Features vs benefits — the critical distinction",
            "Pricing and pricing model",
            "Direct costs and margin per offering",
            "Delivery method and development stage",
            "Suppliers and dependencies",
            "Your overall value proposition",
            "Intellectual property",
            "Research & development activities",
            "Future offerings and product roadmap",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-navy-700">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>Service businesses:</strong> The same structure applies whether you sell a physical product, a service, a digital product, or a subscription. The questions are designed to adapt to your offering type.
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

// ─── Offering type options ────────────────────────────────────────────────────
const OFFERING_TYPES = [
  { value: "product", label: "Physical Product", icon: "📦", desc: "A tangible item sold to customers" },
  { value: "service", label: "Service", icon: "🔧", desc: "Labour, expertise, or time sold to customers" },
  { value: "digital", label: "Digital Product", icon: "💾", desc: "Software, downloads, or digital content" },
  { value: "subscription", label: "Subscription", icon: "🔁", desc: "Recurring access to a product or service" },
];

const PRICING_MODELS = [
  { value: "fixed", label: "Fixed Price", description: "Set price per unit or transaction" },
  { value: "tiered", label: "Tiered Pricing", description: "Different prices for different levels" },
  { value: "subscription", label: "Subscription / Recurring", description: "Regular recurring charge" },
  { value: "per_hour", label: "Hourly Rate", description: "Charged per hour of service" },
  { value: "per_project", label: "Per Project", description: "Fixed fee for a defined scope" },
  { value: "freemium", label: "Freemium", description: "Free base tier, paid upgrades" },
  { value: "usage", label: "Usage-Based", description: "Charged by consumption or usage" },
  { value: "custom", label: "Custom / Negotiated", description: "Price set per client" },
];

const DEVELOPMENT_STAGES = [
  { value: "concept", label: "Concept / Idea" },
  { value: "development", label: "In Development" },
  { value: "prototype", label: "Prototype / MVP" },
  { value: "pilot", label: "Pilot / Testing" },
  { value: "launched", label: "Launched / Live" },
  { value: "established", label: "Established" },
];

// ─── Offering card editor ─────────────────────────────────────────────────────
function OfferingCard({
  offering,
  index,
  onUpdate,
  onRemove,
}: {
  offering: Product;
  index: number;
  onUpdate: (changes: Partial<Product>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const price = offering.price ?? 0;
  const directCost = offering.directCosts ?? 0;
  const grossProfit = price - directCost;
  const marginPct = price > 0 ? ((grossProfit / price) * 100).toFixed(1) : null;
  const marginColor =
    marginPct === null
      ? "text-muted-foreground"
      : parseFloat(marginPct) >= 50
      ? "text-sage-600"
      : parseFloat(marginPct) >= 25
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Card header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
            {String(index + 1)}
          </div>
          <div className="min-w-0 text-left">
            <p className="font-semibold text-navy-900 text-sm truncate">
              {offering.name || `Offering ${index + 1}`}
            </p>
            {offering.type && (
              <p className="text-muted-foreground text-xs capitalize">
                {OFFERING_TYPES.find((t) => t.value === offering.type)?.label || offering.type}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {marginPct && (
            <span className={`text-xs font-semibold ${marginColor}`}>{marginPct}% margin</span>
          )}
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
        <div className="px-5 pb-6 pt-1 space-y-5 border-t border-border">
          {/* Offering type */}
          <div>
            <label className="input-label mb-2 block">Offering Type</label>
            <div className="grid grid-cols-2 gap-2">
              {OFFERING_TYPES.map((ot) => (
                <button
                  key={ot.value}
                  onClick={() => onUpdate({ type: ot.value as Product["type"] })}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                    offering.type === ot.value
                      ? "border-navy-700 bg-navy-50"
                      : "border-border bg-white hover:border-navy-300"
                  }`}
                >
                  <span className="text-base shrink-0">{ot.icon}</span>
                  <div>
                    <p className="font-semibold text-navy-900 text-xs">{ot.label}</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5 leading-snug">{ot.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name + tagline */}
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Name"
              value={offering.name}
              onChange={(v) => onUpdate({ name: v })}
              placeholder="e.g. Standard Service Call"
              required
            />
            <SelectField
              label="Development Stage"
              value={offering.developmentStage || ""}
              onChange={(v) => onUpdate({ developmentStage: v })}
              options={DEVELOPMENT_STAGES}
              helpText="Where is this offering today?"
            />
          </div>

          {/* Description */}
          <TextAreaField
            label="Description"
            value={offering.description || ""}
            onChange={(v) => onUpdate({ description: v })}
            placeholder="Describe this offering in clear, factual terms. What is it? What does it include? How is it delivered?"
            rows={4}
            required
            helpText="Avoid marketing language. Describe what a customer actually receives."
          />

          {/* Target customer + need */}
          <div className="grid sm:grid-cols-2 gap-4">
            <TextAreaField
              label="Target Customer"
              value={offering.targetCustomer || ""}
              onChange={(v) => onUpdate({ targetCustomer: v })}
              placeholder="Who specifically is this offering for?"
              rows={2}
            />
            <TextAreaField
              label="Need Addressed"
              value={offering.needAddressed || ""}
              onChange={(v) => onUpdate({ needAddressed: v })}
              placeholder="What problem or need does this solve for that customer?"
              rows={2}
            />
          </div>

          {/* Features */}
          <TextAreaField
            label="Key Features"
            value={offering.features || ""}
            onChange={(v) => onUpdate({ features: v })}
            placeholder={`List the specific, tangible features of this offering.\nExample:\n• On-site repair (customer doesn't need to travel)\n• Same-day or next-day availability\n• 45-minute service window`}
            rows={4}
            helpText="Features describe what the offering IS and INCLUDES. Not why it's good — just what it is."
          />

          {/* Benefits */}
          <TextAreaField
            label="Customer Benefits"
            value={offering.benefits || ""}
            onChange={(v) => onUpdate({ benefits: v })}
            placeholder={`Describe the outcomes and value these features create for customers.\nExample:\n• No wasted time — repair happens at home or work\n• Back on the bike the same day\n• Confidence that repair is done correctly`}
            rows={4}
            helpText="Benefits describe the value, outcomes, and improvements the customer experiences. Features → Benefits is a critical distinction covered in the next topic."
          />

          {/* Customer value */}
          <TextAreaField
            label="Customer Value Statement"
            value={offering.customerValue || ""}
            onChange={(v) => onUpdate({ customerValue: v })}
            placeholder="In one or two sentences, what is the core value this offering delivers to the customer?"
            rows={2}
          />

          {/* Delivery method */}
          <TextAreaField
            label="Delivery Method"
            value={offering.deliveryMethod || ""}
            onChange={(v) => onUpdate({ deliveryMethod: v })}
            placeholder="How is this offering delivered to the customer? Physical delivery, on-site, download, post, in-store pick-up, digital access?"
            rows={2}
          />

          {/* Suppliers */}
          <TextAreaField
            label="Suppliers & Dependencies"
            value={offering.suppliers || ""}
            onChange={(v) => onUpdate({ suppliers: v })}
            placeholder="What suppliers, vendors, materials, or platforms does this offering depend on? Include any single-source dependencies that could be a risk."
            rows={3}
            helpText="Identifying supplier dependencies here will link to your Operations and Risk phases."
          />

          {/* Pricing section */}
          <div className="border-t border-border pt-5">
            <h4 className="font-semibold text-navy-900 text-sm mb-4">Pricing & Economics</h4>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <SelectField
                label="Pricing Model"
                value={offering.pricingModel || ""}
                onChange={(v) => onUpdate({ pricingModel: v })}
                options={PRICING_MODELS}
              />
              <div>
                <label className="input-label">Price</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Per unit / per hour / per project (depending on model above)
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={offering.price ?? ""}
                    onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full border border-input bg-white pl-8 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="input-label">Direct Cost (Cost of Goods / Cost of Service)</label>
              <p className="text-xs text-muted-foreground mb-2">
                The variable cost directly attributable to delivering one unit of this offering — materials, labour per job, platform fees, etc. Exclude fixed overheads.
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={offering.directCosts ?? ""}
                  onChange={(e) => onUpdate({ directCosts: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="w-full border border-input bg-white pl-8 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 transition-all"
                />
              </div>
            </div>

            {/* Margin calculator */}
            {(offering.price ?? 0) > 0 && (
              <div className="bg-navy-50 border border-navy-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-3">
                  Margin Summary
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-navy-400 text-[11px] mb-1">Revenue</p>
                    <p className="font-bold text-navy-900 text-lg">${price.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-navy-400 text-[11px] mb-1">Direct Cost</p>
                    <p className="font-bold text-navy-700 text-lg">${directCost.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-navy-400 text-[11px] mb-1">Gross Profit</p>
                    <p className={`font-bold text-lg ${marginColor}`}>${grossProfit.toFixed(2)}</p>
                  </div>
                </div>
                {marginPct && (
                  <div className="mt-3 pt-3 border-t border-navy-200 text-center">
                    <p className={`font-bold text-2xl ${marginColor}`}>{marginPct}%</p>
                    <p className="text-navy-500 text-xs mt-1">Gross Margin</p>
                    <p className={`text-xs mt-1 ${marginColor}`}>
                      {parseFloat(marginPct) >= 60
                        ? "Strong margin"
                        : parseFloat(marginPct) >= 40
                        ? "Healthy margin"
                        : parseFloat(marginPct) >= 20
                        ? "Moderate margin — watch fixed costs carefully"
                        : "Thin margin — ensure fixed costs are covered by volume"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remove button */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={onRemove}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Remove this offering
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 02 — Offerings ───────────────────────────────────────────────────────────
function PSOfferings({ ps, update, status, markComplete, onNext, onPrev, plan, onUpdatePlan }: any) {
  const offerings: Product[] = ps.offerings || [];

  const addOffering = () => {
    const newOffering: Product = {
      id: generateId(),
      name: "",
      type: "service",
      description: "",
      features: "",
      benefits: "",
    };
    update({ offerings: [...offerings, newOffering] });
  };

  const updateOffering = (id: string, changes: Partial<Product>) =>
    update({ offerings: offerings.map((o: Product) => (o.id === id ? { ...o, ...changes } : o)) });

  const removeOffering = (id: string) =>
    update({ offerings: offerings.filter((o: Product) => o.id !== id) });

  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={2}
        topicTitle="Your Offerings"
        estimatedMinutes={15}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">One card per offering</h3>
        <p className="text-navy-700 mb-3">
          Add every distinct product or service your business offers. For each one, you'll capture a structured description, pricing, costs, delivery method, and key dependencies.
        </p>
        <p className="text-navy-700">
          If you have products at different development stages — some launched, some planned — include them all. The development stage field tracks where each one is.
        </p>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Important:</strong> Avoid vague descriptions like "premium service" or "high-quality product." Describe what the customer actually receives, at what price, and what it costs you to deliver. Be as specific as you can at this stage — you can always refine later.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-4">
        {offerings.length === 0 && (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No offerings added yet.</p>
            <p className="text-muted-foreground text-xs">Add each product or service your business sells below.</p>
          </div>
        )}

        {offerings.map((offering, i) => (
          <OfferingCard
            key={offering.id}
            offering={offering}
            index={i}
            onUpdate={(changes) => updateOffering(offering.id, changes)}
            onRemove={() => removeOffering(offering.id)}
          />
        ))}

        <button
          onClick={addOffering}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-4 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Product or Service
        </button>
      </div>

      {/* Overall product mix summary */}
      {offerings.length > 1 && (
        <div className="mt-8">
          <TextAreaField
            label="Product / Service Mix"
            value={ps.productMixDescription || ""}
            onChange={(v) => update({ productMixDescription: v })}
            placeholder="Briefly describe how your offerings work together as a portfolio. Are some entry-level and others premium? Do they serve different customer segments? Do some feed into others?"
            rows={3}
            helpText="For single-offering businesses, skip this field."
          />
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

// ─── 03 — Features vs Benefits ────────────────────────────────────────────────
function PSFeaturesBenefits({ ps, update, status, markComplete, onNext, onPrev }: any) {
  const offerings: Product[] = ps.offerings || [];

  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={3}
        topicTitle="Features vs Benefits"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">The most important distinction in marketing</h3>
        <p className="text-navy-700 mb-3">
          Most first-time business plan writers confuse features and benefits, or use them interchangeably. They are not the same — and the difference matters significantly for how readers understand your value.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg border border-navy-200">
            <p className="font-bold text-navy-900 text-sm mb-2">Feature</p>
            <p className="text-navy-700 text-sm mb-3">
              A characteristic of what you offer. A factual statement about the product or service itself.
            </p>
            <p className="text-navy-400 text-xs italic">"What it IS or DOES"</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="font-bold text-navy-900 text-sm mb-2">Benefit</p>
            <p className="text-navy-700 text-sm mb-3">
              The outcome or value the feature creates for the customer. How it improves their situation.
            </p>
            <p className="text-amber-700 text-xs italic">"What it MEANS for the customer"</p>
          </div>
        </div>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-3">Feature → Benefit pairs (bicycle repair example):</p>
        <div className="space-y-3">
          {[
            {
              feature: "On-site repair — we come to the customer's location",
              benefit: "No travel required. Customer stays productive while their bike is fixed.",
            },
            {
              feature: "Same-day or next-day availability",
              benefit: "Customer is back on their bike within 24 hours — not waiting 2 weeks at a shop.",
            },
            {
              feature: "Certified bicycle mechanic",
              benefit: "Confidence the job is done correctly. No risk of compounding damage from poor repair.",
            },
            {
              feature: "Flat-rate pricing displayed before booking",
              benefit: "No surprise bills. Customer can decide and commit without anxiety.",
            },
          ].map((pair, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-1 bg-white/70 rounded p-2.5 border border-navy-100">
                <p className="text-[10px] font-bold text-navy-400 uppercase mb-1">Feature</p>
                <p className="text-navy-700 text-xs">{pair.feature}</p>
              </div>
              <div className="flex items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 bg-amber-50/70 rounded p-2.5 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Benefit</p>
                <p className="text-navy-700 text-xs">{pair.benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Common mistake:</strong> Writing benefits that are really just features stated differently. "Fast service" is not a benefit — it's a vague feature claim. "Back on your bike the same day, without rescheduling your morning" is a benefit. Specificity is what makes benefits convincing.
        </p>
      </EducationPanel>

      {/* Quick review of each offering's features/benefits */}
      {offerings.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-navy-900 mb-3">Review your offering features & benefits</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Based on what you entered in the previous topic, here's a quick summary. Return to the Offerings topic to edit them.
          </p>
          <div className="space-y-4">
            {offerings.map((o, i) => (
              <div key={o.id} className="bg-white border border-border rounded-xl p-5">
                <p className="font-semibold text-navy-900 text-sm mb-4">
                  {String(i + 1).padStart(2, "0")}. {o.name || `Offering ${i + 1}`}
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase mb-2">Features recorded</p>
                    <p className="text-navy-700 text-xs leading-relaxed whitespace-pre-line">
                      {o.features || <span className="text-muted-foreground italic">None recorded yet</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase mb-2">Benefits recorded</p>
                    <p className="text-navy-700 text-xs leading-relaxed whitespace-pre-line">
                      {o.benefits || <span className="text-muted-foreground italic">None recorded yet</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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

// ─── 04 — Value Proposition ───────────────────────────────────────────────────
function PSValueProp({ ps, update, status, markComplete, onNext, onPrev, plan }: any) {
  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={4}
        topicTitle="Value Proposition"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is a value proposition?</h3>
        <p className="text-navy-700 mb-3">
          A value proposition is a clear statement that explains how your offering solves a customer's problem, what benefits it delivers, and why customers should choose you over alternatives. It is the core promise your business makes to its customers.
        </p>
        <p className="text-navy-700">
          A strong value proposition is not a slogan. It is a specific, credible explanation of who you help, what you help them do, and what makes you different from alternatives.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Example (mobile bicycle repair):</p>
        <p className="text-navy-700">
          "CycleKit Pro helps recreational and commuter cyclists in greater Melbourne maintain working bikes without the inconvenience of traditional bike shops. We come to you — at home, at work, or wherever your bike is — and complete professional repairs in a single visit, usually within 24 hours of booking. Unlike drop-off bike shops that require scheduling, transportation of the bike, and multi-day waits, CycleKit Pro removes every friction point between a cyclist and a working bike."
        </p>
        <p className="text-navy-600 text-xs mt-3">
          Notice: it names the customer, the problem, the mechanism, the outcome, and the competitor contrast — all in three sentences.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Overall Value Proposition"
          value={ps.overallValueProp || ""}
          onChange={(v) => update({ overallValueProp: v })}
          placeholder={
            "Write your overall value proposition. Cover:\n" +
            "1. Who your customer is\n" +
            "2. The problem or need you address\n" +
            "3. How your offering addresses it\n" +
            "4. What makes you different from alternatives"
          }
          rows={6}
          required
          helpText="Aim for 2–4 sentences. Be specific. Reference your customer and your differentiator."
        />
      </div>

      {/* Reference panel */}
      {plan?.marketAnalysis?.primaryCustomer && (
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-2">
            Your Market Analysis says
          </p>
          <p className="text-blue-700 text-sm">
            <strong>Primary customer:</strong>{" "}
            {plan.marketAnalysis.primaryCustomer.slice(0, 200)}
            {plan.marketAnalysis.primaryCustomer.length > 200 ? "…" : ""}
          </p>
          {plan.marketAnalysis.positioning && (
            <p className="text-blue-700 text-sm mt-2">
              <strong>Positioning:</strong>{" "}
              {plan.marketAnalysis.positioning.slice(0, 200)}
              {plan.marketAnalysis.positioning.length > 200 ? "…" : ""}
            </p>
          )}
        </div>
      )}

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          Your value proposition should be consistent with the customer you defined in Market Analysis and the problem you described in Company Description. If they don't line up, that's a flag worth addressing now.
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

// ─── 05 — Pricing ─────────────────────────────────────────────────────────────
function PSPricing({ ps, update, status, markComplete, onNext, onPrev }: any) {
  const offerings: Product[] = ps.offerings || [];

  // Aggregate totals for summary
  const totalRevenue = offerings.reduce((sum, o) => sum + (o.price ?? 0), 0);
  const avgMargin =
    offerings.length > 0
      ? offerings.reduce((sum, o) => {
          const p = o.price ?? 0;
          const c = o.directCosts ?? 0;
          return sum + (p > 0 ? ((p - c) / p) * 100 : 0);
        }, 0) / offerings.length
      : 0;

  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={5}
        topicTitle="Pricing"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Pricing is a strategic decision</h3>
        <p className="text-navy-700 mb-3">
          Pricing affects who buys, how much they value your product, and whether the business is financially viable. There is no universally correct pricing — but there are common strategies, and your choice of strategy should be deliberate.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {[
            { name: "Cost-Plus", desc: "Add a target margin to your direct costs. Simple, but ignores market." },
            { name: "Value-Based", desc: "Price reflects the value delivered to customers, not your costs." },
            { name: "Competitive", desc: "Price relative to competitors. Risk: margin pressure." },
            { name: "Penetration", desc: "Low initial price to gain market share. Raises sustainability questions." },
          ].map((s) => (
            <div key={s.name} className="bg-white/70 rounded-lg border border-navy-200 p-3">
              <p className="font-semibold text-navy-900 text-xs mb-1">{s.name}</p>
              <p className="text-navy-600 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Important:</strong> Pricing that is too low to cover fixed expenses — regardless of margin percentage — will result in losses. The margin calculator on each offering shows gross margin only. Fixed costs (rent, salaries, subscriptions) must also be covered by total revenue. This is addressed in the Financial Plan phase.
        </p>
      </EducationPanel>

      {/* Pricing summary table */}
      {offerings.length > 0 ? (
        <div className="mt-8">
          <h3 className="font-semibold text-navy-900 mb-4">Pricing Summary</h3>
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="text-left px-4 py-3 text-xs font-semibold">Offering</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Direct Cost</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-xs font-semibold text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((o, i) => {
                    const p = o.price ?? 0;
                    const c = o.directCosts ?? 0;
                    const gp = p - c;
                    const margin = p > 0 ? ((gp / p) * 100).toFixed(1) : "—";
                    const marginNum = p > 0 ? (gp / p) * 100 : null;
                    const mColor =
                      marginNum === null
                        ? "text-muted-foreground"
                        : marginNum >= 50
                        ? "text-sage-600"
                        : marginNum >= 25
                        ? "text-amber-600"
                        : "text-red-600";
                    return (
                      <tr key={o.id} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                        <td className="px-4 py-3 font-medium text-navy-800">
                          {o.name || `Offering ${i + 1}`}
                          {o.pricingModel && (
                            <span className="text-muted-foreground text-xs ml-2">
                              ({PRICING_MODELS.find((pm) => pm.value === o.pricingModel)?.label || o.pricingModel})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-navy-700">{p > 0 ? `$${p.toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-3 text-right text-navy-600">{c > 0 ? `$${c.toFixed(2)}` : "—"}</td>
                        <td className="px-4 py-3 text-right text-navy-700">{p > 0 ? `$${gp.toFixed(2)}` : "—"}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${mColor}`}>{margin}{margin !== "—" ? "%" : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {offerings.length > 1 && (
                  <tfoot>
                    <tr className="border-t border-border bg-navy-50">
                      <td className="px-4 py-3 text-xs font-bold text-navy-700" colSpan={4}>
                        Average gross margin across all offerings
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-sm ${
                        avgMargin >= 50 ? "text-sage-600" : avgMargin >= 25 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {avgMargin.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-3">
            Prices and costs entered in the Offerings topic above. Return there to edit individual figures.
          </p>
        </div>
      ) : (
        <div className="mt-8 bg-muted rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm">
            No offerings added yet. Return to the Offerings topic to add products or services and their pricing.
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

// ─── 06 — Intellectual Property ───────────────────────────────────────────────
const IP_TYPES = [
  "Patent (granted or pending)",
  "Trademark",
  "Copyright",
  "Trade secret",
  "Registered design",
  "Domain name",
  "Proprietary software",
  "Proprietary process or formula",
  "Other",
];

function PSIP({ ps, update, status, markComplete, onNext, onPrev }: any) {
  const selectedTypes: string[] = ps.ipTypes || [];

  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={6}
        topicTitle="Intellectual Property"
        estimatedMinutes={5}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is intellectual property?</h3>
        <p className="text-navy-700 mb-3">
          Intellectual property (IP) refers to creations of the mind that can be legally owned — inventions, brand identifiers, creative works, trade secrets, and unique processes. IP can be a significant competitive asset, especially if it prevents competitors from copying your core offering.
        </p>
        <p className="text-navy-700">
          Not all businesses have significant IP. Many service businesses don't. Be factual: if you have none, say so clearly. If you have any, describe it accurately.
        </p>
      </EducationPanel>

      <EducationPanel variant="research">
        <p className="text-blue-800 text-sm">
          <strong>Research note:</strong> If you're unsure whether you have patentable ideas or registrable trademarks, consult an IP attorney before making claims in your business plan. Overstating IP protection is a common and serious mistake.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <div>
          <label className="input-label mb-3 block">Does this business own or intend to file for any intellectual property?</label>
          <div className="grid grid-cols-3 gap-3">
            {([true, false, null] as const).map((val) => (
              <button
                key={String(val)}
                onClick={() => update({ ipOwned: val })}
                className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                  ps.ipOwned === val
                    ? "border-navy-700 bg-navy-50 text-navy-900"
                    : "border-border bg-white text-navy-600 hover:border-navy-300"
                }`}
              >
                {val === true ? "Yes" : val === false ? "No" : "Not sure yet"}
              </button>
            ))}
          </div>
        </div>

        {ps.ipOwned === true && (
          <>
            <div>
              <label className="input-label mb-2 block">Types of IP (select all that apply)</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {IP_TYPES.map((type) => {
                  const isOn = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() =>
                        update({
                          ipTypes: isOn
                            ? selectedTypes.filter((t) => t !== type)
                            : [...selectedTypes, type],
                        })
                      }
                      className={`px-4 py-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                        isOn
                          ? "border-navy-700 bg-navy-50 text-navy-900"
                          : "border-border bg-white text-navy-600 hover:border-navy-300"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <TextAreaField
              label="IP Description"
              value={ps.ipDescription || ""}
              onChange={(v) => update({ ipDescription: v })}
              placeholder="Describe the IP your business owns or is pursuing. For each item, note: what it is, its status (pending, granted, registered), and why it is commercially relevant."
              rows={5}
              required
            />
          </>
        )}

        {ps.ipOwned === false && (
          <div className="bg-muted rounded-xl p-5">
            <p className="text-muted-foreground text-sm">
              No IP documented. This is common for service businesses and early-stage companies. This section will be omitted from or briefly noted in the final document.
            </p>
          </div>
        )}

        <TextAreaField
          label="Research & Development Activities (optional)"
          value={ps.rdActivities || ""}
          onChange={(v) => update({ rdActivities: v })}
          placeholder="Are you engaged in any R&D? Developing new products, testing new processes, conducting trials? Describe what is underway and what you expect from it."
          rows={3}
          helpText="Even informal development activities — testing, prototyping, customer feedback loops — are worth noting here."
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

// ─── 07 — Future Offerings ────────────────────────────────────────────────────
function PSFuture({ ps, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={7}
        topicTitle="Future Offerings"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why future offerings matter</h3>
        <p className="text-navy-700 mb-3">
          Documenting planned future products and services shows readers that you have thought beyond the launch phase — that the business has a growth trajectory, not just a starting point.
        </p>
        <p className="text-navy-700">
          Be realistic. Only include offerings you genuinely intend to develop and have a credible path toward. Vague "Phase 2" claims without substance are not compelling. A specific planned launch in 18 months with a clear rationale is.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Example:</p>
        <p className="text-navy-700 text-sm">
          "In the second year of operation, we plan to introduce a <strong>Bike Safety Check subscription</strong> — a prepaid annual maintenance plan for commuter cyclists who want two scheduled service visits per year. This offering is designed to build recurring revenue once we have an established customer base from the standard service model. We anticipate launching this once we have documented 150 repeat customers."
        </p>
        <p className="text-navy-600 text-xs mt-2">
          Notice: specific offering, timing, rationale, and trigger condition — not just "we plan to expand."
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Planned Future Offerings"
          value={ps.futureOfferings || ""}
          onChange={(v) => update({ futureOfferings: v })}
          placeholder={
            "Describe any products or services you plan to introduce in the future.\n" +
            "For each: what is it, when do you plan to launch it, what will trigger the launch, and what is the rationale?"
          }
          rows={6}
          helpText="If you have no current plans for future offerings, write 'Not planned at this stage' — it's better than leaving this blank."
        />

        <TextField
          label="Timeframe (optional)"
          value={ps.futureTimeframe || ""}
          onChange={(v) => update({ futureTimeframe: v })}
          placeholder="e.g. Year 2 onwards, 18 months post-launch"
          helpText="Approximate timeframe for new offerings to be developed or launched."
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

// ─── 08 — Review ──────────────────────────────────────────────────────────────
function PSReview({ ps, update, status, markComplete, onNext, onPrev, onNavigate }: any) {
  const offerings: Product[] = ps.offerings || [];

  const fields = [
    {
      label: "Offerings",
      value: offerings.length > 0 ? `${offerings.length} offering(s) documented` : null,
      topicId: "ps_offerings",
      summary: offerings.map((o) => o.name).filter(Boolean).join(", ") || null,
    },
    {
      label: "Value Proposition",
      value: ps.overallValueProp,
      topicId: "ps_value_proposition",
      summary: ps.overallValueProp ? ps.overallValueProp.slice(0, 100) + "…" : null,
    },
    {
      label: "IP & R&D",
      value: ps.ipOwned !== undefined ? (ps.ipOwned === true ? "IP documented" : "No IP") : null,
      topicId: "ps_ip",
      summary:
        ps.ipOwned === true
          ? ps.ipDescription?.slice(0, 80) + "…"
          : ps.ipOwned === false
          ? "No IP held"
          : null,
    },
    {
      label: "Future Offerings",
      value: ps.futureOfferings,
      topicId: "ps_future",
      summary: ps.futureOfferings ? ps.futureOfferings.slice(0, 80) + "…" : null,
    },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  // Cross-check: any offerings missing prices?
  const missingPrice = offerings.filter((o) => !o.price || o.price === 0);
  const missingDescription = offerings.filter((o) => !o.description);

  return (
    <div>
      <TopicHeader
        phase="Products & Services"
        phaseNumber={4}
        topicNumber={8}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Cross-check warnings */}
      {missingPrice.length > 0 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm mb-1">
              {missingPrice.length} offering{missingPrice.length > 1 ? "s" : ""} without a price
            </p>
            <p className="text-amber-700 text-sm">
              <strong>{missingPrice.map((o) => o.name || "Unnamed").join(", ")}</strong> — pricing is required for financial projections in the Financial Plan phase. Return to the Offerings topic to complete these.
            </p>
            <button
              onClick={() => onNavigate("products_services", "ps_offerings")}
              className="text-amber-700 text-xs font-semibold mt-2 hover:underline"
            >
              Fix offerings →
            </button>
          </div>
        </div>
      )}

      {missingDescription.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-red-800 font-semibold text-sm mb-1">
              {missingDescription.length} offering{missingDescription.length > 1 ? "s" : ""} without a description
            </p>
            <p className="text-red-700 text-sm">
              Every offering needs a description. Return to the Offerings topic to complete them.
            </p>
            <button
              onClick={() => onNavigate("products_services", "ps_offerings")}
              className="text-red-700 text-xs font-semibold mt-2 hover:underline"
            >
              Complete offerings →
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Products & Services — Summary</h2>
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
                  onClick={() => onNavigate("products_services", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Offerings snapshot */}
      {offerings.length > 0 && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Offerings Snapshot</h3>
          <div className="space-y-3">
            {offerings.map((o, i) => {
              const p = o.price ?? 0;
              const c = o.directCosts ?? 0;
              const margin = p > 0 ? (((p - c) / p) * 100).toFixed(1) : null;
              const mColor = margin
                ? parseFloat(margin) >= 50
                  ? "text-sage-600"
                  : parseFloat(margin) >= 25
                  ? "text-amber-600"
                  : "text-red-600"
                : "text-muted-foreground";
              return (
                <div key={o.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-border">
                  <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {String(i + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-navy-900 text-sm font-semibold truncate">{o.name || "Unnamed"}</p>
                    <p className="text-navy-500 text-xs">
                      {OFFERING_TYPES.find((t) => t.value === o.type)?.label || "—"}
                      {o.developmentStage
                        ? ` · ${DEVELOPMENT_STAGES.find((d) => d.value === o.developmentStage)?.label || o.developmentStage}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-navy-800 text-sm font-semibold">{p > 0 ? `$${p.toFixed(0)}` : "—"}</p>
                    {margin && <p className={`text-xs font-medium ${mColor}`}>{margin}% margin</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completed === total && missingPrice.length === 0 && missingDescription.length === 0 ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Products & Services is complete. You're ready to move on to Marketing & Sales — where you'll define how you reach and acquire customers.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            Some items are incomplete. You can continue and return later, but complete pricing is essential before you reach the Financial Plan phase.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Marketing & Sales →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
