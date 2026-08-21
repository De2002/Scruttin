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
import opHero from "@/assets/phase-operations-hero.jpg";

// ─── Phase constant ───────────────────────────────────────────────────────────
const PHASE = PHASES.find((p) => p.id === "operations")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Local data types ─────────────────────────────────────────────────────────
interface SupplierRecord {
  id: string;
  name: string;
  category?: string;
  description?: string;
  leadTime?: string;
  isSingleSource?: boolean;
  backupPlan?: string;
  contractStatus?: string;
}

interface TechTool {
  id: string;
  name: string;
  category?: string;
  purpose?: string;
  monthlyCost?: number;
  criticalityLevel?: "low" | "medium" | "high" | "critical";
}

interface LicenceItem {
  id: string;
  name: string;
  issuingBody?: string;
  status?: string;
  renewalDate?: string;
  notes?: string;
}

interface OpData {
  // Operating model
  businessModelType?: string;
  operatingModelDescription?: string;
  valueDeliveryMethod?: string;
  // Location
  locationType?: string;
  primaryLocation?: string;
  additionalLocations?: string;
  facilityDescription?: string;
  facilityOwnership?: string;
  // Technology
  techTools?: TechTool[];
  techInfrastructure?: string;
  techDependencies?: string;
  // Suppliers
  suppliers?: SupplierRecord[];
  supplierStrategy?: string;
  supplyChainRisks?: string;
  // Delivery & Fulfilment
  deliveryProcess?: string;
  deliveryTimeline?: string;
  deliveryChannels?: string;
  fulfilmentPartners?: string;
  returnPolicy?: string;
  // Staffing & Capacity
  currentCapacity?: string;
  capacityLimits?: string;
  scalingPlan?: string;
  peakPeriods?: string;
  staffingModel?: string;
  // Quality Control
  qualityStandards?: string;
  qualityProcesses?: string;
  customerFeedbackProcess?: string;
  errorHandling?: string;
  // Licences & Compliance
  licences?: LicenceItem[];
  regulatoryRequirements?: string;
  insuranceTypes?: string[];
  dataPrivacyNotes?: string;
  complianceNotes?: string;
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
export default function OperationsPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const op: OpData = (plan as any).operations || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<OpData>) => {
    onUpdatePlan({ operations: { ...op, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next
      ? onNavigate("operations", nav.next.id)
      : onNavigate("financial_plan", "fp_intro");
  const handlePrev = () =>
    nav.prev
      ? onNavigate("operations", nav.prev.id)
      : onNavigate("marketing_sales", "ms_review");

  const sharedProps = {
    op,
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
      case "op_model":    return <OpModel {...sharedProps} />;
      case "op_location": return <OpLocation {...sharedProps} />;
      case "op_technology": return <OpTechnology {...sharedProps} />;
      case "op_suppliers": return <OpSuppliers {...sharedProps} />;
      case "op_delivery": return <OpDelivery {...sharedProps} />;
      case "op_staffing": return <OpStaffing {...sharedProps} />;
      case "op_quality":  return <OpQuality {...sharedProps} />;
      case "op_legal":    return <OpLegal {...sharedProps} />;
      case "op_review":   return <OpReview {...sharedProps} />;
      default:            return <OpModel {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
function OpHero() {
  return (
    <div className="relative rounded-xl overflow-hidden mb-8 h-44 sm:h-56">
      <img
        src={opHero}
        alt="Operations"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900/88 to-navy-900/20 flex flex-col justify-end p-6">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
          Phase 6
        </p>
        <h2 className="text-white font-serif text-2xl font-bold leading-tight">
          Operations
        </h2>
        <p className="text-white/65 text-sm mt-1">
          Explain how your business runs day-to-day
        </p>
      </div>
    </div>
  );
}

// ─── 01 — Operating Model ─────────────────────────────────────────────────────
const BUSINESS_MODEL_TYPES = [
  {
    value: "b2c_service",
    label: "B2C Service",
    icon: "🔧",
    description:
      "You provide a service directly to individual consumers — on-site, in-person, or remotely.",
  },
  {
    value: "b2c_product",
    label: "B2C Product",
    icon: "📦",
    description:
      "You sell physical or digital products directly to individual end customers.",
  },
  {
    value: "b2b_service",
    label: "B2B Service",
    icon: "🤝",
    description:
      "You provide services to other businesses — consulting, agency, professional services.",
  },
  {
    value: "b2b_product",
    label: "B2B Product",
    icon: "🏭",
    description:
      "You sell products to other businesses — wholesale, SaaS, or equipment supply.",
  },
  {
    value: "digital",
    label: "Digital / Platform",
    icon: "💻",
    description:
      "Your offering is primarily digital — software, apps, online platforms, or content.",
  },
  {
    value: "marketplace",
    label: "Marketplace / Aggregator",
    icon: "🔗",
    description:
      "You connect buyers and sellers. Value is created through the network, not direct delivery.",
  },
  {
    value: "subscription",
    label: "Subscription",
    icon: "🔁",
    description:
      "Customers pay recurring fees for ongoing access to a product or service.",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    icon: "⚡",
    description:
      "A mix of the above — for example, a product business that also offers services.",
  },
];

function OpModel({ op, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <OpHero />
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={1}
        topicTitle="Operating Model"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          The Operations section of a business plan explains how the business actually runs — how value is created, delivered, and sustained. While earlier phases covered what you sell and who you sell to, Operations explains the mechanics behind the scenes.
        </p>
        <p className="text-navy-700">
          Your operating model is the fundamental design of how your business creates and delivers value. It shapes everything: staffing, technology, suppliers, costs, and scalability.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Model type selector */}
        <div>
          <label className="input-label mb-3 block">What best describes your operating model?</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {BUSINESS_MODEL_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => update({ businessModelType: type.value })}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  op.businessModelType === type.value
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">{type.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 text-sm">{type.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                    {type.description}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    op.businessModelType === type.value
                      ? "border-navy-700 bg-navy-700"
                      : "border-muted-foreground"
                  }`}
                >
                  {op.businessModelType === type.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <TextAreaField
          label="Operating Model Description"
          value={op.operatingModelDescription || ""}
          onChange={(v) => update({ operatingModelDescription: v })}
          placeholder={
            "Describe how your business operates in plain language. Cover:\n" +
            "• How is value created? (what processes, skills, or systems are involved)\n" +
            "• How is value delivered to customers?\n" +
            "• What is the core operational loop — what happens every day, every week?\n" +
            "• How does revenue flow from activity to cash?"
          }
          rows={6}
          required
          helpText="Think of this as describing a typical working day or week. What actually happens to make the business run?"
        />

        <TextAreaField
          label="How Value is Delivered to Customers"
          value={op.valueDeliveryMethod || ""}
          onChange={(v) => update({ valueDeliveryMethod: v })}
          placeholder={
            "Describe the step-by-step journey from a customer placing an order or booking " +
            "to them receiving your product or service. What does each step involve operationally?"
          }
          rows={4}
          helpText="This is distinct from the sales process — here you focus on operational execution, not selling."
        />
      </div>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">
          Operating model narrative (mobile bicycle repair):
        </p>
        <p className="text-navy-700 text-sm">
          "CycleKit Pro operates as a B2C mobile service. A customer books online, selecting their service type, address, and preferred time. The assigned technician receives the booking via the scheduling app, prepares their service kit, and travels to the customer's location. The repair is completed on-site in 30–90 minutes. Payment is processed digitally at completion. The technician updates the job record and the system triggers a post-service review request. The entire process requires no fixed premises — technicians operate from their own vehicles."
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

// ─── 02 — Location & Facilities ───────────────────────────────────────────────
const LOCATION_TYPES = [
  { value: "home_based", label: "Home-Based", description: "Operated primarily from home" },
  { value: "commercial_premises", label: "Commercial Premises", description: "Office, shop, workshop, or studio" },
  { value: "mobile", label: "Mobile / On-Site", description: "Operations happen at the customer's location" },
  { value: "warehouse", label: "Warehouse / Storage", description: "Physical goods require storage and dispatch" },
  { value: "coworking", label: "Co-Working / Shared Space", description: "Flexible workspace arrangement" },
  { value: "online_only", label: "Online Only", description: "No physical location required" },
  { value: "retail", label: "Retail Storefront", description: "Customers visit a physical retail space" },
  { value: "manufacturing", label: "Manufacturing Facility", description: "Products are manufactured on-site" },
];

const OWNERSHIP_TYPES = [
  { value: "leased", label: "Leased" },
  { value: "owned", label: "Owned" },
  { value: "rented_flexible", label: "Flexible / Month-to-Month" },
  { value: "shared", label: "Shared / Co-occupancy" },
  { value: "free_home", label: "Home Office (no separate cost)" },
  { value: "not_yet_secured", label: "Not Yet Secured" },
];

function OpLocation({ op, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={2}
        topicTitle="Location & Facilities"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why location matters operationally</h3>
        <p className="text-navy-700 mb-3">
          Location decisions directly affect costs, reach, accessibility, and compliance. Whether your business requires physical premises, operates remotely, or is entirely mobile, you need to document this clearly.
        </p>
        <p className="text-navy-700">
          For businesses with physical locations, also document the facilities themselves — size, condition, equipment on-site, and any requirements that affect operations.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Location type */}
        <div>
          <label className="input-label mb-3 block">Location Type</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {LOCATION_TYPES.map((lt) => (
              <button
                key={lt.value}
                onClick={() => update({ locationType: lt.value })}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  op.locationType === lt.value
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    op.locationType === lt.value
                      ? "border-navy-700 bg-navy-700"
                      : "border-muted-foreground"
                  }`}
                >
                  {op.locationType === lt.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-navy-900 text-sm">{lt.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{lt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <TextField
          label="Primary Location / Address"
          value={op.primaryLocation || ""}
          onChange={(v) => update({ primaryLocation: v })}
          placeholder="e.g. Greater Melbourne metropolitan area, or 123 Main St, Sydney"
          helpText="For mobile businesses, describe the operating territory. For online-only, write 'Online — no fixed location'."
        />

        <SelectField
          label="Facility Ownership / Tenure"
          value={op.facilityOwnership || ""}
          onChange={(v) => update({ facilityOwnership: v })}
          options={OWNERSHIP_TYPES}
          helpText="How do you hold or access your primary operating space?"
        />

        <TextAreaField
          label="Facility Description"
          value={op.facilityDescription || ""}
          onChange={(v) => update({ facilityDescription: v })}
          placeholder={
            "Describe your facilities in operational terms:\n" +
            "• Size (square metres, number of rooms, vehicle fleet size, etc.)\n" +
            "• Key equipment or fitout on-site\n" +
            "• Storage capacity if relevant\n" +
            "• Any facility requirements or constraints\n\n" +
            "For mobile/home-based businesses: describe what is needed operationally (e.g. vehicle size, storage for tools/parts, internet requirements)."
          }
          rows={5}
          helpText="Be specific. Vague descriptions like 'a suitable workspace' are not useful here."
        />

        <TextAreaField
          label="Additional Locations (if any)"
          value={op.additionalLocations || ""}
          onChange={(v) => update({ additionalLocations: v })}
          placeholder="If the business operates from or needs multiple locations (e.g. pop-up, storage, second premises), describe them here."
          rows={3}
          helpText="Leave blank if a single location or territory applies."
        />
      </div>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>Home-based businesses:</strong> Even if you work from home, document it. Note whether zoning permits the activity, whether a separate workspace exists, and any council or lease restrictions that apply.
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

// ─── 03 — Technology ──────────────────────────────────────────────────────────
const TECH_CATEGORIES = [
  "Booking / Scheduling",
  "Customer Relationship Management (CRM)",
  "Accounting / Finance",
  "Point of Sale / Payments",
  "Communication / Messaging",
  "Project / Task Management",
  "Website / E-Commerce",
  "Marketing Automation",
  "Inventory Management",
  "HR / Payroll",
  "Cloud Storage / File Management",
  "Analytics / Reporting",
  "Delivery / Logistics",
  "Industry-Specific Software",
  "Other",
];

const CRITICALITY_COLORS = {
  low: "text-slate-500 bg-slate-50 border-slate-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

function OpTechnology({ op, update, status, markComplete, onNext, onPrev }: any) {
  const tools: TechTool[] = op.techTools || [];

  const addTool = () =>
    update({
      techTools: [
        ...tools,
        {
          id: generateId(),
          name: "",
          category: "",
          purpose: "",
          monthlyCost: 0,
          criticalityLevel: "medium" as const,
        },
      ],
    });

  const updateTool = (id: string, changes: Partial<TechTool>) =>
    update({ techTools: tools.map((t) => (t.id === id ? { ...t, ...changes } : t)) });

  const removeTool = (id: string) =>
    update({ techTools: tools.filter((t) => t.id !== id) });

  const totalMonthlyCost = tools.reduce((sum, t) => sum + (t.monthlyCost || 0), 0);
  const criticalTools = tools.filter((t) => t.criticalityLevel === "critical");

  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={3}
        topicTitle="Technology"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Technology as operational infrastructure</h3>
        <p className="text-navy-700 mb-3">
          Almost every business today depends on technology to function — booking systems, payment processors, accounting tools, communication platforms, and more. This section documents the technology that your business relies on.
        </p>
        <p className="text-navy-700">
          Documenting your technology stack reveals real operational costs, identifies single points of failure, and shows readers that you have thought through how the business will actually run rather than just what it will sell.
        </p>
      </EducationPanel>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>Cost note:</strong> Software subscription costs can add up quickly and are easy to forget in a financial plan. Every tool you list here with a monthly cost should flow into your Financial Plan → Operating Expenses.
        </p>
      </EducationPanel>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Technology Stack</h3>
          <button
            onClick={addTool}
            className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Tool
          </button>
        </div>

        {tools.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No tools added yet.</p>
            <p className="text-muted-foreground text-xs">
              Add each software tool or technology the business relies on.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool, i) => (
              <TechToolCard
                key={tool.id}
                tool={tool}
                index={i}
                onUpdate={(changes) => updateTool(tool.id, changes)}
                onRemove={() => removeTool(tool.id)}
              />
            ))}
          </div>
        )}

        {totalMonthlyCost > 0 && (
          <div className="mt-4 p-4 bg-navy-50 border border-navy-200 rounded-xl grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-navy-400 text-xs mb-1">Total Monthly Tech Cost</p>
              <p className="font-bold text-navy-900 text-xl">${totalMonthlyCost.toFixed(0)}/mo</p>
            </div>
            <div className="text-center">
              <p className="text-navy-400 text-xs mb-1">Annualised</p>
              <p className="font-bold text-navy-900 text-xl">
                ${(totalMonthlyCost * 12).toFixed(0)}/yr
              </p>
            </div>
          </div>
        )}

        {criticalTools.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm font-semibold mb-1">
              {criticalTools.length} critical tool{criticalTools.length > 1 ? "s" : ""} identified
            </p>
            <p className="text-red-700 text-sm">
              <strong>{criticalTools.map((t) => t.name || "Unnamed").join(", ")}</strong> — these are marked as critical. Consider your contingency plan if they become unavailable.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <TextAreaField
          label="Technology Infrastructure Notes"
          value={op.techInfrastructure || ""}
          onChange={(v) => update({ techInfrastructure: v })}
          placeholder="Any notes on hardware, internet requirements, server infrastructure, or custom development? What technical decisions have been made about how the business runs?"
          rows={3}
          helpText="For many small businesses this is minimal. For digital or software businesses this section is critical."
        />

        <TextAreaField
          label="Technology Dependencies & Single Points of Failure"
          value={op.techDependencies || ""}
          onChange={(v) => update({ techDependencies: v })}
          placeholder="Are there any technologies where a failure or discontinuation would significantly disrupt the business? What is your backup plan for each?"
          rows={3}
          helpText="This feeds into your Risks & Mitigation phase — technology risk is one of the most common risk categories."
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

function TechToolCard({
  tool,
  index,
  onUpdate,
  onRemove,
}: {
  tool: TechTool;
  index: number;
  onUpdate: (changes: Partial<TechTool>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div className="w-7 h-7 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={tool.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Tool name (e.g. Xero, Square, Calendly)"
            className="w-full text-sm font-semibold text-navy-900 bg-transparent focus:outline-none placeholder:text-muted-foreground placeholder:font-normal"
          />
          {tool.category && (
            <p className="text-muted-foreground text-xs mt-0.5">{tool.category}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tool.criticalityLevel && tool.criticalityLevel !== "low" && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                CRITICALITY_COLORS[tool.criticalityLevel]
              }`}
            >
              {tool.criticalityLevel}
            </span>
          )}
          {tool.monthlyCost ? (
            <span className="text-xs text-navy-600 font-medium">
              ${tool.monthlyCost}/mo
            </span>
          ) : null}
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
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 text-xs font-bold ml-1"
          >
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Category</label>
              <select
                value={tool.category || ""}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="w-full border border-input bg-white px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mt-1"
              >
                <option value="">Select category…</option>
                {TECH_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Criticality</label>
              <p className="text-xs text-muted-foreground mb-1.5">
                How critical is this to daily operations?
              </p>
              <div className="flex gap-1.5">
                {(["low", "medium", "high", "critical"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => onUpdate({ criticalityLevel: level })}
                    className={`flex-1 py-2 rounded-lg border text-[11px] font-semibold capitalize transition-all ${
                      tool.criticalityLevel === level
                        ? `${CRITICALITY_COLORS[level]} border-current`
                        : "border-border bg-white text-navy-500 hover:border-navy-300"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <TextAreaField
            label="Purpose / What It Does"
            value={tool.purpose || ""}
            onChange={(v) => onUpdate({ purpose: v })}
            placeholder="What does this tool do in the business? What would break if it wasn't available?"
            rows={2}
          />

          <div>
            <label className="input-label">Monthly Cost</label>
            <p className="text-xs text-muted-foreground mb-1.5">$0 for free / open-source tools</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                value={tool.monthlyCost ?? ""}
                onChange={(e) => onUpdate({ monthlyCost: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full border border-input bg-white pl-8 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 04 — Suppliers ───────────────────────────────────────────────────────────
function OpSuppliers({ op, update, status, markComplete, onNext, onPrev, plan }: any) {
  const suppliers: SupplierRecord[] = op.suppliers || [];

  const addSupplier = () =>
    update({
      suppliers: [
        ...suppliers,
        {
          id: generateId(),
          name: "",
          category: "",
          description: "",
          leadTime: "",
          isSingleSource: false,
          backupPlan: "",
          contractStatus: "",
        },
      ],
    });

  const updateSupplier = (id: string, changes: Partial<SupplierRecord>) =>
    update({
      suppliers: suppliers.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    });

  const removeSupplier = (id: string) =>
    update({ suppliers: suppliers.filter((s) => s.id !== id) });

  const singleSourceCount = suppliers.filter((s) => s.isSingleSource).length;

  // Pull supplier names from Products & Services for reference
  const productSuppliers = (plan?.productsServices?.offerings || [])
    .map((o: any) => o.suppliers)
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={4}
        topicTitle="Suppliers"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why supplier management matters</h3>
        <p className="text-navy-700 mb-3">
          Suppliers are a key operational dependency. Unreliable suppliers, long lead times, or single-source dependencies can disrupt delivery, damage customer relationships, and threaten revenue.
        </p>
        <p className="text-navy-700">
          This section documents who you source from, how critical each supplier is, and what your backup plan looks like if a supplier fails. Readers — particularly lenders and investors — will look for supplier risk here.
        </p>
      </EducationPanel>

      {productSuppliers && (
        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-2">
            Suppliers referenced in Products & Services
          </p>
          <p className="text-blue-700 text-sm">{productSuppliers}</p>
          <p className="text-blue-600 text-xs mt-2">
            Add these here with full detail to complete your supplier documentation.
          </p>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-900">Supplier Records</h3>
          <button
            onClick={addSupplier}
            className="bg-navy-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Supplier
          </button>
        </div>

        {suppliers.length === 0 ? (
          <div className="bg-muted rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm mb-1">No suppliers added yet.</p>
            <p className="text-muted-foreground text-xs">
              If your business has no suppliers (e.g. pure service, no materials), document that
              in the notes below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier, i) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                index={i}
                onUpdate={(changes) => updateSupplier(supplier.id, changes)}
                onRemove={() => removeSupplier(supplier.id)}
              />
            ))}
          </div>
        )}

        {singleSourceCount > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <span className="text-red-500 text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-red-800 text-sm font-semibold mb-1">
                {singleSourceCount} single-source supplier{singleSourceCount > 1 ? "s" : ""} identified
              </p>
              <p className="text-red-700 text-sm">
                A single-source dependency means there is no backup if this supplier fails. Document
                your contingency plan for each, and consider this a risk item for your Risks &
                Mitigation phase.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <TextAreaField
          label="Supplier Strategy"
          value={op.supplierStrategy || ""}
          onChange={(v) => update({ supplierStrategy: v })}
          placeholder="How do you manage supplier relationships? Do you have preferred supplier agreements, volume discounts, or backup sources? What is your approach to supplier selection and onboarding?"
          rows={3}
        />

        <TextAreaField
          label="Supply Chain Risks"
          value={op.supplyChainRisks || ""}
          onChange={(v) => update({ supplyChainRisks: v })}
          placeholder="What are the main supply chain risks for your business? Lead time variability, geographic concentration, price volatility, single-source dependencies? What is your mitigation approach?"
          rows={3}
          helpText="This links to your Risks & Mitigation phase — carry key risks forward."
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

function SupplierCard({
  supplier,
  index,
  onUpdate,
  onRemove,
}: {
  supplier: SupplierRecord;
  index: number;
  onUpdate: (changes: Partial<SupplierRecord>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        supplier.isSingleSource ? "border-red-300" : "border-border"
      }`}
    >
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-navy-50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm">
            {supplier.name || `Supplier ${index + 1}`}
          </p>
          {supplier.category && (
            <p className="text-muted-foreground text-xs">{supplier.category}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {supplier.isSingleSource && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-red-600 bg-red-50 border-red-200">
              Single Source
            </span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`text-navy-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path
              d="M2 4l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-6 pt-2 border-t border-border bg-white space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Supplier Name"
              value={supplier.name}
              onChange={(v) => onUpdate({ name: v })}
              placeholder="e.g. Shimano Australia"
              required
            />
            <TextField
              label="Category / What They Supply"
              value={supplier.category || ""}
              onChange={(v) => onUpdate({ category: v })}
              placeholder="e.g. Bicycle components, packaging, software"
            />
          </div>

          <TextAreaField
            label="Description"
            value={supplier.description || ""}
            onChange={(v) => onUpdate({ description: v })}
            placeholder="What do you source from this supplier? How important are they to your operations?"
            rows={2}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="Lead Time"
              value={supplier.leadTime || ""}
              onChange={(v) => onUpdate({ leadTime: v })}
              placeholder="e.g. 2–5 business days, immediate"
              helpText="Time from order to delivery"
            />
            <SelectField
              label="Contract Status"
              value={supplier.contractStatus || ""}
              onChange={(v) => onUpdate({ contractStatus: v })}
              options={[
                { value: "formal_contract", label: "Formal Contract in Place" },
                { value: "verbal_agreement", label: "Verbal / Informal Agreement" },
                { value: "spot_purchase", label: "Spot Purchase (no contract)" },
                { value: "preferred_supplier", label: "Preferred Supplier Arrangement" },
                { value: "not_yet_engaged", label: "Not Yet Engaged" },
              ]}
            />
          </div>

          <div className="flex items-center gap-3 py-3 px-4 bg-muted rounded-lg">
            <button
              onClick={() => onUpdate({ isSingleSource: !supplier.isSingleSource })}
              className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                supplier.isSingleSource ? "bg-red-500" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  supplier.isSingleSource ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-navy-800">Single-Source Dependency</p>
              <p className="text-xs text-muted-foreground">
                No alternative supplier exists or is readily available
              </p>
            </div>
          </div>

          {supplier.isSingleSource && (
            <TextAreaField
              label="Backup / Contingency Plan"
              value={supplier.backupPlan || ""}
              onChange={(v) => onUpdate({ backupPlan: v })}
              placeholder="If this supplier fails or is unavailable, what will you do? Note any alternative suppliers being evaluated."
              rows={3}
              helpText="Single-source dependencies without a contingency plan are a significant operational risk."
            />
          )}

          <div className="pt-2 border-t border-border">
            <button
              onClick={onRemove}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Remove supplier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 05 — Delivery & Fulfilment ───────────────────────────────────────────────
function OpDelivery({ op, update, status, markComplete, onNext, onPrev, plan }: any) {
  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={5}
        topicTitle="Delivery & Fulfilment"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Delivery vs sales</h3>
        <p className="text-navy-700 mb-3">
          The Marketing & Sales phase covered how you sell. This section covers what happens operationally <em>after</em> a sale is made — how the product or service is actually delivered to the customer.
        </p>
        <p className="text-navy-700">
          A strong delivery process is what converts a transaction into a customer experience. Weak delivery is the most common source of refunds, complaints, and lost repeat business.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">
          Delivery process example (mobile bicycle repair):
        </p>
        <div className="space-y-1.5">
          {[
            "1. Booking confirmed → technician receives job details via scheduling app",
            "2. Technician checks parts inventory and prepares service kit the evening before",
            "3. Day of service: technician travels to customer location (ETA communicated via SMS)",
            "4. Service completed on-site (30–90 min) — customer signs off on work",
            "5. Payment collected via Stripe link sent to customer's phone",
            "6. Job record updated; post-service review request sent 2 hours later",
            "7. Warranty: 30-day workmanship guarantee — if issue recurs, free revisit",
          ].map((step, i) => (
            <p key={i} className="text-navy-700 text-sm">{step}</p>
          ))}
        </div>
      </EducationPanel>

      <div className="mt-6 space-y-5">
        <TextAreaField
          label="Delivery / Fulfilment Process"
          value={op.deliveryProcess || ""}
          onChange={(v) => update({ deliveryProcess: v })}
          placeholder={
            "Describe step-by-step what happens after a customer places an order or books a service.\n" +
            "Be specific about who does what, in what order, using what tools or systems.\n\n" +
            "For product businesses: order processing, picking/packing, dispatch, tracking, delivery.\n" +
            "For service businesses: confirmation, preparation, execution, sign-off, follow-up.\n" +
            "For digital products: automated delivery, access provisioning, onboarding sequence."
          }
          rows={7}
          required
          helpText="The more specific you are, the more credible the plan becomes."
        />

        <TextField
          label="Typical Delivery Timeline"
          value={op.deliveryTimeline || ""}
          onChange={(v) => update({ deliveryTimeline: v })}
          placeholder="e.g. Same-day to next-day, 3–5 business days, instant (digital), 2–3 weeks (custom)"
          helpText="From confirmed order/booking to delivery completion"
        />

        <TextAreaField
          label="Delivery Channels & Methods"
          value={op.deliveryChannels || ""}
          onChange={(v) => update({ deliveryChannels: v })}
          placeholder="How is the product or service physically or digitally delivered? e.g. On-site technician visit, postal courier, third-party logistics, digital download, cloud access provisioning, SaaS onboarding."
          rows={3}
        />

        <TextAreaField
          label="Fulfilment Partners (if any)"
          value={op.fulfilmentPartners || ""}
          onChange={(v) => update({ fulfilmentPartners: v })}
          placeholder="Do you use third-party fulfilment services, couriers, logistics partners, or outsourced delivery? Name them and describe their role."
          rows={3}
          helpText="Third-party fulfilment partners are supplier dependencies — flag any single-source risks here."
        />

        <TextAreaField
          label="Returns, Refunds & Warranty Policy"
          value={op.returnPolicy || ""}
          onChange={(v) => update({ returnPolicy: v })}
          placeholder="What is your returns or refund policy? For service businesses: what is your service guarantee or warranty? How do you handle customer complaints about delivery or quality?"
          rows={4}
          helpText="A clear returns policy reduces customer uncertainty and builds trust. It also affects your financial exposure — refunds are a real cost."
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

// ─── 06 — Staffing & Capacity ─────────────────────────────────────────────────
const STAFFING_MODELS = [
  {
    value: "founder_only",
    label: "Founder-Only",
    description: "Business runs on founder labour — no employees or contractors at this stage",
  },
  {
    value: "founder_plus_casual",
    label: "Founders + Casual Staff",
    description: "Core team of founders with casual or part-time staff as needed",
  },
  {
    value: "employed_team",
    label: "Employed Team",
    description: "Formal employees working defined hours — full-time or part-time",
  },
  {
    value: "contractor_led",
    label: "Contractor-Led",
    description: "Operations rely primarily on independent contractors",
  },
  {
    value: "outsourced",
    label: "Outsourced Operations",
    description: "Core delivery is outsourced to third-party service providers",
  },
  {
    value: "automated",
    label: "Largely Automated",
    description: "Technology or systems handle most operational delivery with minimal human labour",
  },
];

function OpStaffing({ op, update, status, markComplete, onNext, onPrev, plan }: any) {
  // Pull hiring plan from Organization phase for reference
  const hiringPlan = plan?.organization?.hiringPlan;

  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={6}
        topicTitle="Staffing & Capacity"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Staffing as an operational constraint</h3>
        <p className="text-navy-700 mb-3">
          Staffing determines your operational capacity — how much you can produce, deliver, or service in a given period. This section asks you to document your current staffing model and identify where capacity limits lie.
        </p>
        <p className="text-navy-700">
          Understanding capacity ceilings is essential for financial planning. If a single technician can service 4 jobs per day and you project 400 jobs per month, you need at least 5 technicians. These calculations need to be consistent with your financial projections.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Staffing model selector */}
        <div>
          <label className="input-label mb-3 block">Staffing Model</label>
          <div className="space-y-2">
            {STAFFING_MODELS.map((model) => (
              <button
                key={model.value}
                onClick={() => update({ staffingModel: model.value })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  op.staffingModel === model.value
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    op.staffingModel === model.value
                      ? "border-navy-700 bg-navy-700"
                      : "border-muted-foreground"
                  }`}
                >
                  {op.staffingModel === model.value && (
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
          label="Current Operational Capacity"
          value={op.currentCapacity || ""}
          onChange={(v) => update({ currentCapacity: v })}
          placeholder={
            "Describe your current capacity in concrete terms.\n" +
            "Example: 'With 1 technician operating 5 days per week at 5 jobs per day, current " +
            "capacity is approximately 100 jobs per month.'\n\n" +
            "For service businesses: jobs per day/week/month\n" +
            "For product businesses: units per day/week/month\n" +
            "For digital businesses: concurrent users, transactions, bandwidth"
          }
          rows={4}
          required
          helpText="Tie this to your revenue projections. Capacity × price per unit = max revenue per period."
        />

        <TextAreaField
          label="Capacity Limits & Bottlenecks"
          value={op.capacityLimits || ""}
          onChange={(v) => update({ capacityLimits: v })}
          placeholder="What limits your capacity? Is it the number of staff, available hours, equipment, physical space, or a specific process step? At what point does current setup break and require investment to scale?"
          rows={3}
          helpText="Identifying bottlenecks shows you understand the real constraints of scaling the business."
        />

        <TextAreaField
          label="Scaling Plan"
          value={op.scalingPlan || ""}
          onChange={(v) => update({ scalingPlan: v })}
          placeholder="How will you increase capacity as demand grows? When will you need to hire, invest in equipment, or change the operating model? At what revenue or volume threshold does each change become necessary?"
          rows={4}
          helpText="This should align with your hiring plan from the Organization phase."
        />

        <TextAreaField
          label="Peak Periods & Seasonal Patterns"
          value={op.peakPeriods || ""}
          onChange={(v) => update({ peakPeriods: v })}
          placeholder="Are there predictable peaks or troughs in demand? e.g. Summer demand spike, year-end rush, school term patterns. How will you manage capacity during peaks?"
          rows={3}
        />
      </div>

      {hiringPlan && (
        <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-xs font-semibold uppercase tracking-wide mb-2">
            From Organization Phase — Hiring Plan
          </p>
          <p className="text-blue-700 text-sm">{hiringPlan.slice(0, 250)}{hiringPlan.length > 250 ? "…" : ""}</p>
          <p className="text-blue-600 text-xs mt-2">
            Ensure your capacity and scaling plan above is consistent with this hiring timeline.
          </p>
        </div>
      )}

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Cross-check:</strong> Your capacity calculations must be consistent with your revenue projections in the Financial Plan. If you project 500 jobs/month but can only handle 100 with current staffing, the projections are not credible without a concurrent hiring plan.
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

// ─── 07 — Quality Control ─────────────────────────────────────────────────────
function OpQuality({ op, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={7}
        topicTitle="Quality Control"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Quality is a process, not a promise</h3>
        <p className="text-navy-700 mb-3">
          Saying "we will provide high-quality service" is a marketing claim. Describing <em>how</em> quality is assured — what processes, standards, checks, and feedback loops are in place — is an operational fact.
        </p>
        <p className="text-navy-700">
          For small businesses, quality control doesn't need to be complex. But it does need to be documented. A simple post-service checklist, a customer sign-off step, or a review request process is a quality system.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Quality Standards"
          value={op.qualityStandards || ""}
          onChange={(v) => update({ qualityStandards: v })}
          placeholder={
            "Define the quality standards your business aims to maintain. These should be specific and measurable where possible.\n\n" +
            "Examples:\n" +
            "• Customer satisfaction score above 4.5/5 in post-service reviews\n" +
            "• Zero repeat visits required for the same repair within 30 days\n" +
            "• 100% of jobs completed within the quoted time window\n" +
            "• ISO 9001 certification (if applicable)"
          }
          rows={5}
          required
          helpText="Standards are measurable. Aspirations ('be the best') are not standards."
        />

        <TextAreaField
          label="Quality Assurance Processes"
          value={op.qualityProcesses || ""}
          onChange={(v) => update({ qualityProcesses: v })}
          placeholder={
            "Describe the specific steps or checks in your operation that ensure quality is maintained.\n\n" +
            "Examples:\n" +
            "• Pre-service tool and parts check by technician\n" +
            "• In-process quality checkpoint at 50% completion\n" +
            "• End-of-job test or inspection before sign-off\n" +
            "• Peer review for complex jobs\n" +
            "• Random audits of completed work"
          }
          rows={5}
          helpText="Specific processes are credible. Generic claims are not."
        />

        <TextAreaField
          label="Customer Feedback & Monitoring"
          value={op.customerFeedbackProcess || ""}
          onChange={(v) => update({ customerFeedbackProcess: v })}
          placeholder="How do you collect customer feedback? Post-service surveys, review requests, NPS scores, direct follow-up calls? How is feedback reviewed and acted on?"
          rows={4}
          helpText="Customer feedback is your early warning system for quality failures."
        />

        <TextAreaField
          label="Error Handling & Service Recovery"
          value={op.errorHandling || ""}
          onChange={(v) => update({ errorHandling: v })}
          placeholder={
            "What is your process when something goes wrong? If a customer is dissatisfied, if a product is faulty, or if a service is not completed to standard — what happens?\n\n" +
            "Describe your remediation process: who owns it, what the response timeline is, and what the resolution looks like."
          }
          rows={4}
          helpText="Businesses that handle errors well often retain customers who would have been lost by the error itself."
        />
      </div>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Quality system example:</p>
        <ul className="space-y-1.5 text-navy-700 text-sm">
          <li>• Every completed job signed off by customer on a digital form before payment</li>
          <li>• Post-service email sent within 2 hours with review request and 30-day workmanship guarantee</li>
          <li>• Any Google review below 4 stars triggers a direct owner call within 24 hours</li>
          <li>• Monthly review of all completed jobs for common issues or error patterns</li>
          <li>• Annual refresher training for all technicians on latest repair techniques</li>
        </ul>
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

// ─── 08 — Licences & Compliance ───────────────────────────────────────────────
const INSURANCE_OPTIONS = [
  "Public Liability Insurance",
  "Professional Indemnity Insurance",
  "Product Liability Insurance",
  "Workers Compensation / Employer Liability",
  "Business Vehicle / Fleet Insurance",
  "Business Contents / Equipment Insurance",
  "Cyber Liability Insurance",
  "Key Person Insurance",
  "Income Protection",
  "Trade Credit Insurance",
  "Other",
];

function OpLegal({ op, update, status, markComplete, onNext, onPrev }: any) {
  const licences: LicenceItem[] = op.licences || [];
  const selectedInsurance: string[] = op.insuranceTypes || [];

  const addLicence = () =>
    update({
      licences: [
        ...licences,
        {
          id: generateId(),
          name: "",
          issuingBody: "",
          status: "",
          renewalDate: "",
          notes: "",
        },
      ],
    });

  const updateLicence = (id: string, changes: Partial<LicenceItem>) =>
    update({ licences: licences.map((l) => (l.id === id ? { ...l, ...changes } : l)) });

  const removeLicence = (id: string) =>
    update({ licences: licences.filter((l) => l.id !== id) });

  const toggleInsurance = (type: string) => {
    const updated = selectedInsurance.includes(type)
      ? selectedInsurance.filter((t) => t !== type)
      : [...selectedInsurance, type];
    update({ insuranceTypes: updated });
  };

  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={8}
        topicTitle="Licences & Compliance"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Compliance is non-negotiable</h3>
        <p className="text-navy-700 mb-3">
          Operating without required licences or insurance is both legally risky and a red flag for any serious reader of a business plan. This section documents the regulatory environment your business operates in and how you are — or will be — compliant.
        </p>
        <p className="text-navy-700">
          Not all businesses require licences. Many do. Some industries are heavily regulated. Be honest: if you don't know what's required, mark this for research and consult a business advisor or relevant government authority.
        </p>
      </EducationPanel>

      <EducationPanel variant="research">
        <p className="text-blue-800 text-sm">
          <strong>Research note:</strong> Licensing requirements vary significantly by industry and jurisdiction. Search for "[your industry] licences requirements [your state/country]" or consult your local small business authority to identify what applies. Do not assume — missing a required licence can shut a business down.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Licences */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="input-label">Licences, Permits & Registrations</label>
            <button
              onClick={addLicence}
              className="text-xs text-navy-700 font-medium hover:text-navy-900 border border-navy-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Licence
            </button>
          </div>

          {licences.length === 0 ? (
            <div className="bg-muted rounded-xl p-5 text-center">
              <p className="text-muted-foreground text-sm mb-1">No licences added.</p>
              <p className="text-muted-foreground text-xs">
                If no licences are required for your business, document that explicitly in the notes below.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {licences.map((licence, i) => (
                <div key={licence.id} className="bg-white border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-500 uppercase">
                      Licence {i + 1}
                    </span>
                    <button
                      onClick={() => removeLicence(licence.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <TextField
                      label="Licence / Permit Name"
                      value={licence.name}
                      onChange={(v) => updateLicence(licence.id, { name: v })}
                      placeholder="e.g. Working with Children Check, Food Safety Certificate"
                    />
                    <TextField
                      label="Issuing Body / Authority"
                      value={licence.issuingBody || ""}
                      onChange={(v) => updateLicence(licence.id, { issuingBody: v })}
                      placeholder="e.g. VicGov, ASIC, local council"
                    />
                    <SelectField
                      label="Status"
                      value={licence.status || ""}
                      onChange={(v) => updateLicence(licence.id, { status: v })}
                      options={[
                        { value: "current", label: "Current / Active" },
                        { value: "pending", label: "Applied / Pending" },
                        { value: "renewal_due", label: "Renewal Due" },
                        { value: "not_yet_applied", label: "Not Yet Applied" },
                        { value: "not_required", label: "Confirmed Not Required" },
                      ]}
                    />
                    <TextField
                      label="Renewal Date (if applicable)"
                      value={licence.renewalDate || ""}
                      onChange={(v) => updateLicence(licence.id, { renewalDate: v })}
                      placeholder="e.g. Annual, June 2026"
                    />
                  </div>
                  <div className="mt-3">
                    <TextAreaField
                      label="Notes"
                      value={licence.notes || ""}
                      onChange={(v) => updateLicence(licence.id, { notes: v })}
                      placeholder="Any additional notes about this licence, requirement, or its implications for operations."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insurance */}
        <div>
          <label className="input-label mb-2 block">Insurance Coverage (select all that apply)</label>
          <p className="text-xs text-muted-foreground mb-3">
            Indicate which types of insurance the business holds or plans to hold.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {INSURANCE_OPTIONS.map((type) => {
              const isOn = selectedInsurance.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleInsurance(type)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    isOn
                      ? "border-navy-700 bg-navy-50 text-navy-900"
                      : "border-border bg-white text-navy-600 hover:border-navy-300"
                  }`}
                >
                  {isOn ? "✓ " : ""}{type}
                </button>
              );
            })}
          </div>
        </div>

        <TextAreaField
          label="Regulatory & Legal Requirements"
          value={op.regulatoryRequirements || ""}
          onChange={(v) => update({ regulatoryRequirements: v })}
          placeholder={
            "Describe the regulatory environment your business operates in.\n" +
            "What laws, standards, or codes of practice apply?\n" +
            "How are you ensuring ongoing compliance?\n\n" +
            "Examples: Employment law, consumer protection, food safety, data privacy (GDPR/Privacy Act), industry codes, environmental regulations, zoning requirements."
          }
          rows={5}
          helpText="Being specific here demonstrates regulatory awareness and reduces perceived risk."
        />

        <TextAreaField
          label="Data Privacy & Security Obligations"
          value={op.dataPrivacyNotes || ""}
          onChange={(v) => update({ dataPrivacyNotes: v })}
          placeholder="Does your business collect, store, or process personal data? Describe what data is collected, how it is stored, and how you comply with applicable privacy laws."
          rows={3}
          helpText="Even small businesses collecting customer email addresses may have privacy law obligations."
        />

        <TextAreaField
          label="Compliance Notes"
          value={op.complianceNotes || ""}
          onChange={(v) => update({ complianceNotes: v })}
          placeholder="Any other compliance considerations not covered above. Known gaps, outstanding actions, or regulatory changes expected to affect the business."
          rows={3}
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

// ─── 09 — Phase Review ────────────────────────────────────────────────────────
function OpReview({ op, update, status, markComplete, onNext, onPrev, onNavigate, plan }: any) {
  const tools: TechTool[] = op.techTools || [];
  const suppliers: SupplierRecord[] = op.suppliers || [];
  const licences: LicenceItem[] = op.licences || [];
  const insurance: string[] = op.insuranceTypes || [];

  const singleSourceSuppliers = suppliers.filter((s) => s.isSingleSource);
  const totalTechCost = tools.reduce((sum, t) => sum + (t.monthlyCost || 0), 0);
  const criticalTools = tools.filter((t) => t.criticalityLevel === "critical");

  const fields = [
    {
      label: "Operating Model",
      value: op.operatingModelDescription || op.businessModelType,
      topicId: "op_model",
      summary: op.businessModelType
        ? `${BUSINESS_MODEL_TYPES.find((t) => t.value === op.businessModelType)?.label || op.businessModelType}${
            op.operatingModelDescription
              ? " · " + op.operatingModelDescription.slice(0, 60) + "…"
              : ""
          }`
        : null,
    },
    {
      label: "Location & Facilities",
      value: op.locationType || op.primaryLocation,
      topicId: "op_location",
      summary:
        op.locationType
          ? `${LOCATION_TYPES.find((l) => l.value === op.locationType)?.label || op.locationType}${
              op.primaryLocation ? " — " + op.primaryLocation : ""
            }`
          : null,
    },
    {
      label: "Technology",
      value: tools.length > 0 ? `${tools.length} tool(s) documented` : op.techInfrastructure,
      topicId: "op_technology",
      summary:
        tools.length > 0
          ? `${tools.length} tool(s) · $${totalTechCost}/mo`
          : op.techInfrastructure
          ? op.techInfrastructure.slice(0, 80) + "…"
          : null,
    },
    {
      label: "Suppliers",
      value:
        suppliers.length > 0
          ? `${suppliers.length} supplier(s)`
          : op.supplierStrategy
          ? "No suppliers (documented)"
          : null,
      topicId: "op_suppliers",
      summary:
        suppliers.length > 0
          ? suppliers
              .map((s) => s.name)
              .filter(Boolean)
              .join(", ")
          : null,
    },
    {
      label: "Delivery & Fulfilment",
      value: op.deliveryProcess,
      topicId: "op_delivery",
      summary: op.deliveryTimeline
        ? `Timeline: ${op.deliveryTimeline}`
        : op.deliveryProcess
        ? op.deliveryProcess.slice(0, 80) + "…"
        : null,
    },
    {
      label: "Staffing & Capacity",
      value: op.currentCapacity || op.staffingModel,
      topicId: "op_staffing",
      summary: op.staffingModel
        ? `${STAFFING_MODELS.find((m) => m.value === op.staffingModel)?.label || op.staffingModel}${
            op.currentCapacity ? " · " + op.currentCapacity.slice(0, 50) + "…" : ""
          }`
        : null,
    },
    {
      label: "Quality Control",
      value: op.qualityStandards || op.qualityProcesses,
      topicId: "op_quality",
      summary: op.qualityStandards
        ? op.qualityStandards.slice(0, 80) + "…"
        : null,
    },
    {
      label: "Licences & Compliance",
      value:
        licences.length > 0
          ? `${licences.length} licence(s)`
          : op.regulatoryRequirements
          ? "Regulatory requirements documented"
          : null,
      topicId: "op_legal",
      summary:
        licences.length > 0
          ? licences.map((l) => l.name).filter(Boolean).join(", ")
          : op.regulatoryRequirements
          ? op.regulatoryRequirements.slice(0, 80) + "…"
          : null,
    },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  return (
    <div>
      <TopicHeader
        phase="Operations"
        phaseNumber={6}
        topicNumber={9}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Cross-check warnings */}
      {singleSourceSuppliers.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-red-800 font-semibold text-sm mb-1">
              {singleSourceSuppliers.length} single-source supplier{singleSourceSuppliers.length > 1 ? "s" : ""} with no backup
            </p>
            <p className="text-red-700 text-sm">
              <strong>{singleSourceSuppliers.map((s) => s.name || "Unnamed").join(", ")}</strong> — flag these in your Risks & Mitigation phase.
            </p>
            <button
              onClick={() => onNavigate("operations", "op_suppliers")}
              className="text-red-700 text-xs font-semibold mt-2 hover:underline"
            >
              Review suppliers →
            </button>
          </div>
        </div>
      )}

      {totalTechCost > 0 && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 text-sm font-semibold mb-1">
            Reminder: Add tech costs to Financial Plan
          </p>
          <p className="text-blue-700 text-sm">
            Your technology stack costs{" "}
            <strong>${totalTechCost}/month (${(totalTechCost * 12).toFixed(0)}/year)</strong>.
            These must appear in your Financial Plan → Operating Expenses.
          </p>
        </div>
      )}

      {/* Summary table */}
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Operations — Summary</h2>
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
                  onClick={() => onNavigate("operations", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Operations snapshot */}
      {(tools.length > 0 || suppliers.length > 0 || insurance.length > 0) && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Operations Snapshot</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Tech Tools</p>
              <p className="font-bold text-navy-900 text-xl">{tools.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Tech Cost/mo</p>
              <p className="font-bold text-navy-900 text-xl">
                ${totalTechCost > 0 ? totalTechCost.toFixed(0) : "0"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Suppliers</p>
              <p className="font-bold text-navy-900 text-xl">{suppliers.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-navy-400 text-[11px] mb-1">Insurances</p>
              <p className="font-bold text-navy-900 text-xl">{insurance.length}</p>
            </div>
          </div>

          {criticalTools.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-navy-500 uppercase mb-2">Critical Systems</p>
              <div className="flex flex-wrap gap-2">
                {criticalTools.map((t) => (
                  <span
                    key={t.id}
                    className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-50 border border-red-200 text-red-700"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {completed === total ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Operations is complete. You're ready for the Financial Plan — where all your operational costs, staffing, and revenue assumptions come together into a full financial model.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {total - completed} section{total - completed > 1 ? "s are" : " is"} incomplete. Delivery & Fulfilment, Staffing & Capacity, and Licences & Compliance are especially important to complete before the Financial Plan phase.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Financial Plan →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
