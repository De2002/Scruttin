import React from "react";
import { BusinessPlan } from "@/types/businessPlan";
import {
  TopicHeader,
  EducationPanel,
  TextAreaField,
  TextField,
  TopicNav,
} from "@/components/features/walkthrough/TopicComponents";
import { PHASES } from "@/constants/phases";
import { generateId } from "@/lib/storage";
import { toast } from "sonner";
import orgHero from "@/assets/phase-org-hero.jpg";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrgData {
  ownershipSummary?: string;
  ownershipType?: string;
  founders?: FounderRecord[];
  orgStructureType?: string;
  orgStructureDescription?: string;
  managementTeam?: ManagementMember[];
  employeeCount?: string;
  departments?: string;
  advisors?: AdvisorRecord[];
  boardExists?: boolean;
  boardDescription?: string;
  skillsGaps?: string;
  hiringPlan?: string;
  externalSupport?: string;
}

interface FounderRecord {
  id: string;
  name: string;
  role: string;
  equity?: string;
  background?: string;
  relevantExperience?: string;
  responsibilities?: string;
}

interface ManagementMember {
  id: string;
  name: string;
  title: string;
  responsibilities?: string;
  relevantExperience?: string;
  keySkills?: string;
}

interface AdvisorRecord {
  id: string;
  name: string;
  expertise?: string;
  contribution?: string;
}

// ─── Phase props ─────────────────────────────────────────────────────────────

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

const PHASE = PHASES.find((p) => p.id === "organization")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

// ─── Phase root ───────────────────────────────────────────────────────────────

export default function OrganizationPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const org: OrgData = (plan as any).organization || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<OrgData>) => {
    onUpdatePlan({ organization: { ...org, ...changes } } as any);
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () =>
    nav.next
      ? onNavigate("organization", nav.next.id)
      : onNavigate("products_services", "ps_intro");
  const handlePrev = () =>
    nav.prev
      ? onNavigate("organization", nav.prev.id)
      : onNavigate("market_analysis", "ma_review");

  const sharedProps = { org, update, status, markComplete, onNext: handleNext, onPrev: handlePrev, onNavigate };

  const renderTopic = () => {
    switch (currentTopic) {
      case "org_ownership": return <OrgOwnership {...sharedProps} />;
      case "org_founders": return <OrgFounders {...sharedProps} />;
      case "org_structure": return <OrgStructure {...sharedProps} />;
      case "org_management": return <OrgManagement {...sharedProps} />;
      case "org_employees": return <OrgEmployees {...sharedProps} />;
      case "org_advisors": return <OrgAdvisors {...sharedProps} />;
      case "org_gaps": return <OrgGaps {...sharedProps} />;
      case "org_review": return <OrgReview org={org} plan={plan} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} onNavigate={onNavigate} />;
      default: return <OrgOwnership {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

// ─── 01 — Ownership ───────────────────────────────────────────────────────────

const OWNERSHIP_TYPES = [
  { value: "sole", label: "Sole Owner", description: "One person owns 100% of the business" },
  { value: "partnership", label: "Partnership", description: "Two or more people share ownership" },
  { value: "investor_backed", label: "Investor-Backed", description: "External investors hold equity" },
  { value: "family", label: "Family-Owned", description: "Ownership held within a family" },
  { value: "employee_owned", label: "Employee-Owned / Cooperative", description: "Staff hold equity collectively" },
  { value: "other", label: "Other", description: "Doesn't fit the above categories" },
];

function OrgOwnership({ org, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      {/* Phase hero banner */}
      <div className="relative rounded-xl overflow-hidden mb-8 h-44 sm:h-56">
        <img
          src={orgHero}
          alt="Organization & Management"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/85 to-navy-900/30 flex flex-col justify-end p-6">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">
            Phase 3
          </p>
          <h2 className="text-white font-serif text-2xl font-bold leading-tight">
            Organization & Management
          </h2>
          <p className="text-white/65 text-sm mt-1">
            Define your team, structure, roles, and capabilities
          </p>
        </div>
      </div>

      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={1}
        topicTitle="Ownership"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What does ownership mean in a business plan?</h3>
        <p className="text-navy-700 mb-3">
          Ownership refers to who holds legal and financial stake in the business — who owns it, in what proportions, and under what arrangement. This is important for several reasons:
        </p>
        <ul className="space-y-2 text-navy-700">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
            <span>Lenders want to know who is accountable for the business</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
            <span>Investors want to understand the equity structure before committing</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
            <span>Ownership totals must always add up to exactly 100%</span>
          </li>
        </ul>
      </EducationPanel>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Important:</strong> All ownership percentages across all individuals and entities must total exactly 100%. If your ownership totals don't add up, Scruttin will flag this as an inconsistency before your plan is finalised.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Ownership type selector */}
        <div>
          <label className="input-label mb-3 block">Ownership Structure</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {OWNERSHIP_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => update({ ownershipType: type.value })}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                  org.ownershipType === type.value
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                    org.ownershipType === type.value
                      ? "border-navy-700 bg-navy-700"
                      : "border-muted-foreground"
                  }`}
                >
                  {org.ownershipType === type.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-navy-900 text-sm">{type.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <TextAreaField
          label="Describe the Ownership Structure"
          value={org.ownershipSummary || ""}
          onChange={(v) => update({ ownershipSummary: v })}
          placeholder="List all owners, their role, and their ownership percentage. Example: Jane Smith (Co-Founder) — 60%, David Lee (Co-Founder) — 40%."
          rows={4}
          required
          helpText="All percentages must add up to 100%. If ownership is more complex (different share classes, vesting schedules), note that here."
        />
      </div>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Example:</p>
        <p className="text-navy-700 text-sm">
          "CycleKit Pro is owned equally by two co-founders: Jane Smith (50%) and David Lee (50%). There are no external investors at this stage. Both founders contribute full-time to the business and have agreed to a 4-year vesting schedule to protect both parties in the event of an early exit."
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

// ─── 02 — Founders ────────────────────────────────────────────────────────────

function OrgFounders({ org, update, status, markComplete, onNext, onPrev }: any) {
  const founders: FounderRecord[] = org.founders || [];

  const addFounder = () =>
    update({
      founders: [
        ...founders,
        {
          id: generateId(),
          name: "",
          role: "",
          equity: "",
          background: "",
          relevantExperience: "",
          responsibilities: "",
        },
      ],
    });

  const updateFounder = (id: string, changes: Partial<FounderRecord>) =>
    update({ founders: founders.map((f) => (f.id === id ? { ...f, ...changes } : f)) });

  const removeFounder = (id: string) =>
    update({ founders: founders.filter((f) => f.id !== id) });

  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={2}
        topicTitle="Founders"
        estimatedMinutes={10}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why do founders matter to readers?</h3>
        <p className="text-navy-700 mb-3">
          Investors and lenders often say they invest in people as much as ideas. The founders section gives readers confidence that the people behind the business have the experience, skills, and commitment to execute the plan.
        </p>
        <p className="text-navy-700">
          You don't need a perfect background. Relevant experience, demonstrable skills, and clear self-awareness about gaps are what matter. Honesty here is an asset.
        </p>
      </EducationPanel>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          <strong>What counts as relevant experience?</strong> Industry knowledge, domain expertise, prior business experience, relevant academic background, certifications, and even strong personal experience as a customer of the industry. Focus on what is directly applicable.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        {founders.length === 0 && (
          <div className="bg-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">No founders added yet. Add at least one founder below.</p>
          </div>
        )}

        {founders.map((founder, i) => (
          <div key={founder.id} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {founder.name ? founder.name[0].toUpperCase() : String(i + 1)}
                </div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                  Founder {i + 1}
                </span>
              </div>
              <button
                onClick={() => removeFounder(founder.id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={founder.name}
                  onChange={(v) => updateFounder(founder.id, { name: v })}
                  placeholder="e.g. Jane Smith"
                  required
                />
                <TextField
                  label="Role / Title"
                  value={founder.role}
                  onChange={(v) => updateFounder(founder.id, { role: v })}
                  placeholder="e.g. CEO & Co-Founder"
                  required
                />
              </div>

              <TextField
                label="Equity Stake"
                value={founder.equity || ""}
                onChange={(v) => updateFounder(founder.id, { equity: v })}
                placeholder="e.g. 50%"
                helpText="Percentage of the business owned by this founder"
              />

              <TextAreaField
                label="Background & Qualifications"
                value={founder.background || ""}
                onChange={(v) => updateFounder(founder.id, { background: v })}
                placeholder="Education, career history, relevant qualifications. Be factual — don't overstate."
                rows={3}
              />

              <TextAreaField
                label="Relevant Experience for This Business"
                value={founder.relevantExperience || ""}
                onChange={(v) => updateFounder(founder.id, { relevantExperience: v })}
                placeholder="What specific experience makes this founder suited to running this business? Industry knowledge, domain expertise, prior business experience?"
                rows={3}
                helpText="This is the most important field. Focus on what directly applies to the business."
              />

              <TextAreaField
                label="Key Responsibilities in the Business"
                value={founder.responsibilities || ""}
                onChange={(v) => updateFounder(founder.id, { responsibilities: v })}
                placeholder="What will this founder be responsible for day-to-day? Operations, sales, finance, technology?"
                rows={2}
              />
            </div>
          </div>
        ))}

        <button
          onClick={addFounder}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3.5 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors"
        >
          + Add Founder
        </button>
      </div>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Example founder profile:</p>
        <p className="text-navy-700 text-sm">
          <strong>Jane Smith — CEO & Co-Founder (50%)</strong><br />
          Jane holds a Bachelor of Business Administration and has 8 years' experience in operations management at a national logistics company. She has been a competitive cyclist for 12 years and has maintained her own bikes since 2015. She co-founded CycleKit Pro to address a service gap she experienced personally. Jane will lead operations, customer experience, and business development.
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

// ─── 03 — Org structure ───────────────────────────────────────────────────────

const STRUCTURE_TYPES = [
  {
    value: "flat",
    label: "Flat / Informal",
    description: "Few or no management layers. Common in startups and small businesses.",
    icon: "⬜",
  },
  {
    value: "functional",
    label: "Functional",
    description: "Organised by function — Marketing, Finance, Operations, etc.",
    icon: "🏛️",
  },
  {
    value: "divisional",
    label: "Divisional",
    description: "Organised by product line, region, or customer type.",
    icon: "🔷",
  },
  {
    value: "matrix",
    label: "Matrix",
    description: "Employees report to both functional and divisional managers.",
    icon: "⊞",
  },
  {
    value: "solo",
    label: "Solo Operator",
    description: "Single person runs the entire business, possibly with contractors.",
    icon: "👤",
  },
];

function OrgStructure({ org, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={3}
        topicTitle="Organizational Structure"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is organizational structure?</h3>
        <p className="text-navy-700 mb-3">
          Organizational structure describes how your business is arranged — who reports to whom, how decision-making flows, and how work is divided. Even a small business has a structure, even if it's informal.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">Why does it matter?</h3>
        <p className="text-navy-700">
          A clear structure tells readers that you've thought through how the business will actually function, not just what it will sell. It also raises important questions about accountability and decision-making.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-6">
        {/* Structure type */}
        <div>
          <label className="input-label mb-3 block">What type of structure best describes your business?</label>
          <div className="space-y-2">
            {STRUCTURE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => update({ orgStructureType: type.value })}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                  org.orgStructureType === type.value
                    ? "border-navy-700 bg-navy-50"
                    : "border-border bg-white hover:border-navy-300"
                }`}
              >
                <span className="text-xl w-6 shrink-0 text-center">{type.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-navy-900 text-sm">{type.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{type.description}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    org.orgStructureType === type.value
                      ? "border-navy-700 bg-navy-700"
                      : "border-muted-foreground"
                  }`}
                >
                  {org.orgStructureType === type.value && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual chart builder */}
        <div>
          <label className="input-label">Describe Your Structure</label>
          <p className="text-xs text-muted-foreground mb-2">
            Describe who leads what, who reports to whom, and how decisions flow. This will be used to generate an organizational summary in the final document.
          </p>
          <TextAreaField
            label=""
            value={org.orgStructureDescription || ""}
            onChange={(v) => update({ orgStructureDescription: v })}
            placeholder={`Example:\n\nCEO (Jane Smith) — overall business direction, investor relations, partnerships\n  ↳ Operations Manager (David Lee) — daily service delivery, technician scheduling, logistics\n  ↳ Marketing Lead (TBH by Month 6) — digital marketing, content, customer acquisition\n\nAll major decisions currently made jointly by both co-founders.`}
            rows={7}
          />
        </div>

        {/* Visual org node builder */}
        <OrgChartBuilder org={org} update={update} />
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

// ─── Mini org chart builder ───────────────────────────────────────────────────

interface OrgNode {
  id: string;
  name: string;
  role: string;
  reportsTo?: string;
}

function OrgChartBuilder({ org, update }: { org: OrgData; update: (c: Partial<OrgData>) => void }) {
  const nodes: OrgNode[] = (org as any).orgNodes || [];

  const addNode = () =>
    update({
      orgNodes: [...nodes, { id: generateId(), name: "", role: "", reportsTo: "" }],
    } as any);

  const updateNode = (id: string, changes: Partial<OrgNode>) =>
    update({ orgNodes: nodes.map((n) => (n.id === id ? { ...n, ...changes } : n)) } as any);

  const removeNode = (id: string) =>
    update({ orgNodes: nodes.filter((n) => n.id !== id) } as any);

  // Group by reports-to for visual rendering
  const topLevel = nodes.filter((n) => !n.reportsTo || n.reportsTo === "");
  const getReports = (id: string) => nodes.filter((n) => n.reportsTo === id);

  return (
    <div className="bg-navy-50 border border-navy-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-navy-900 text-sm">Visual Org Chart</h3>
          <p className="text-navy-600 text-xs mt-0.5">Add roles to generate a visual hierarchy</p>
        </div>
        <button
          onClick={addNode}
          className="bg-navy-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-navy-800 transition-colors"
        >
          + Add Role
        </button>
      </div>

      {nodes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-navy-400 text-sm">No roles added yet.</p>
          <p className="text-navy-300 text-xs mt-1">Add roles to build a visual org chart.</p>
        </div>
      ) : (
        <>
          {/* Input table */}
          <div className="space-y-3 mb-6">
            {nodes.map((node, i) => (
              <div key={node.id} className="bg-white rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-500 font-bold uppercase">
                    Role {i + 1}
                  </span>
                  <button
                    onClick={() => removeNode(node.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Person / Name</label>
                    <input
                      value={node.name}
                      onChange={(e) => updateNode(node.id, { name: e.target.value })}
                      placeholder="e.g. Jane Smith"
                      className="w-full border border-input px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Role / Title</label>
                    <input
                      value={node.role}
                      onChange={(e) => updateNode(node.id, { role: e.target.value })}
                      placeholder="e.g. CEO"
                      className="w-full border border-input px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Reports To (name)</label>
                    <input
                      value={node.reportsTo || ""}
                      onChange={(e) => updateNode(node.id, { reportsTo: e.target.value })}
                      placeholder="Leave blank if top-level"
                      className="w-full border border-input px-2 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-navy-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual preview */}
          {topLevel.length > 0 && (
            <div className="border border-navy-200 rounded-lg p-4 bg-white overflow-x-auto">
              <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">
                Chart Preview
              </p>
              <OrgTree topLevel={topLevel} getReports={getReports} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrgTree({
  topLevel,
  getReports,
}: {
  topLevel: OrgNode[];
  getReports: (id: string) => OrgNode[];
}) {
  return (
    <div className="flex gap-6 flex-wrap">
      {topLevel.map((node) => (
        <OrgNodeCard key={node.id} node={node} getReports={getReports} depth={0} />
      ))}
    </div>
  );
}

function OrgNodeCard({
  node,
  getReports,
  depth,
}: {
  node: OrgNode;
  getReports: (id: string) => OrgNode[];
  depth: number;
}) {
  const reports = getReports(node.name);
  return (
    <div className="flex flex-col items-center">
      <div
        className={`px-4 py-2.5 rounded-lg text-center min-w-[120px] ${
          depth === 0
            ? "bg-navy-900 text-white"
            : depth === 1
            ? "bg-navy-200 text-navy-900 border border-navy-300"
            : "bg-navy-100 text-navy-800 border border-navy-200"
        }`}
      >
        <p className="text-xs font-bold truncate max-w-[120px]">
          {node.name || "—"}
        </p>
        <p
          className={`text-[10px] mt-0.5 truncate max-w-[120px] ${
            depth === 0 ? "text-white/70" : "text-navy-500"
          }`}
        >
          {node.role || "Role"}
        </p>
      </div>
      {reports.length > 0 && (
        <div className="flex flex-col items-center mt-1">
          <div className="w-px h-4 bg-navy-300" />
          <div className="flex gap-4">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-navy-300" />
                <OrgNodeCard node={r} getReports={getReports} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 04 — Management team ─────────────────────────────────────────────────────

function OrgManagement({ org, update, status, markComplete, onNext, onPrev }: any) {
  const team: ManagementMember[] = org.managementTeam || [];

  const addMember = () =>
    update({
      managementTeam: [
        ...team,
        { id: generateId(), name: "", title: "", responsibilities: "", relevantExperience: "", keySkills: "" },
      ],
    });

  const updateMember = (id: string, changes: Partial<ManagementMember>) =>
    update({ managementTeam: team.map((m) => (m.id === id ? { ...m, ...changes } : m)) });

  const removeMember = (id: string) =>
    update({ managementTeam: team.filter((m) => m.id !== id) });

  const founderNames = (org.founders || []).map((f: FounderRecord) => f.name).filter(Boolean);

  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={4}
        topicTitle="Management Team"
        estimatedMinutes={12}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Management team vs founders</h3>
        <p className="text-navy-700 mb-3">
          In a small business, the founders often are the management team. In a larger or more structured business, there may be professional managers, department heads, or executives who are not equity owners.
        </p>
        <p className="text-navy-700">
          This section covers your key management roles — the people who are responsible for making significant decisions and leading major parts of the business.
        </p>
      </EducationPanel>

      {founderNames.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm font-medium mb-1">Founders already recorded</p>
          <p className="text-amber-700 text-sm">
            You've already added: <strong>{founderNames.join(", ")}</strong>. If founders hold management roles, you can add them again here in their management capacity — or skip this section if the founders section covers the full team.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {team.length === 0 && (
          <div className="bg-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No management team members added yet. Add members below, or skip this topic if founders cover the full leadership team.
            </p>
          </div>
        )}

        {team.map((member, i) => (
          <div key={member.id} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-navy-900 text-xs font-bold">
                  {member.name ? member.name[0].toUpperCase() : String(i + 1)}
                </div>
                <span className="text-xs font-bold text-navy-500 uppercase tracking-wide">
                  Manager {i + 1}
                </span>
              </div>
              <button
                onClick={() => removeMember(member.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField
                  label="Full Name"
                  value={member.name}
                  onChange={(v) => updateMember(member.id, { name: v })}
                  placeholder="e.g. David Lee"
                  required
                />
                <TextField
                  label="Title / Position"
                  value={member.title}
                  onChange={(v) => updateMember(member.id, { title: v })}
                  placeholder="e.g. Head of Operations"
                  required
                />
              </div>

              <TextAreaField
                label="Key Responsibilities"
                value={member.responsibilities || ""}
                onChange={(v) => updateMember(member.id, { responsibilities: v })}
                placeholder="What areas does this person own? What decisions do they make? What outcomes are they accountable for?"
                rows={3}
              />

              <TextAreaField
                label="Relevant Experience"
                value={member.relevantExperience || ""}
                onChange={(v) => updateMember(member.id, { relevantExperience: v })}
                placeholder="What experience qualifies this person for this role? Previous roles, industry experience, key achievements?"
                rows={3}
              />

              <TextAreaField
                label="Key Skills"
                value={member.keySkills || ""}
                onChange={(v) => updateMember(member.id, { keySkills: v })}
                placeholder="What are their 3–5 most relevant skills for this business? e.g. financial analysis, team leadership, customer service, digital marketing"
                rows={2}
              />
            </div>
          </div>
        ))}

        <button
          onClick={addMember}
          className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3.5 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors"
        >
          + Add Management Team Member
        </button>
      </div>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Common mistake:</strong> Listing impressive titles without substance. "Chief Revenue Officer" means nothing if there's no description of experience or responsibilities. Be factual and specific about what each person actually does and why they're qualified.
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

// ─── 05 — Employees ───────────────────────────────────────────────────────────

function OrgEmployees({ org, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={5}
        topicTitle="Current Employees"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Beyond the founders and management team, document your current workforce. This gives readers a sense of the business's current capacity and scale.
        </p>
        <p className="text-navy-700">
          For a pre-launch or very early-stage business, this may simply be "None yet — founders only." That's completely fine to state clearly.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextField
          label="Total Employee Count (excluding founders)"
          value={org.employeeCount || ""}
          onChange={(v) => update({ employeeCount: v })}
          placeholder="e.g. 0, 3 full-time, 2 part-time"
          helpText="Include full-time, part-time, and casual employees but not contractors unless they are ongoing."
        />

        <TextAreaField
          label="Departments or Teams"
          value={org.departments || ""}
          onChange={(v) => update({ departments: v })}
          placeholder="Describe how employees are organised, if applicable. What teams or departments exist? What does each do?"
          rows={4}
          helpText="For very small teams, simply describe the roles that exist and what each person is responsible for."
        />

        <div>
          <label className="input-label">Employment Types Present</label>
          <p className="text-xs text-muted-foreground mb-2">Select all that apply to current workforce</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "Full-time employees",
              "Part-time employees",
              "Casual staff",
              "Contractors",
              "Freelancers",
              "Volunteers",
            ].map((type) => {
              const selected: string[] = org.employmentTypes || [];
              const isOn = selected.includes(type);
              return (
                <button
                  key={type}
                  onClick={() =>
                    update({
                      employmentTypes: isOn
                        ? selected.filter((t) => t !== type)
                        : [...selected, type],
                    } as any)
                  }
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
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

// ─── 06 — Advisors & Board ────────────────────────────────────────────────────

function OrgAdvisors({ org, update, status, markComplete, onNext, onPrev }: any) {
  const advisors: AdvisorRecord[] = org.advisors || [];

  const addAdvisor = () =>
    update({
      advisors: [
        ...advisors,
        { id: generateId(), name: "", expertise: "", contribution: "" },
      ],
    });

  const updateAdvisor = (id: string, changes: Partial<AdvisorRecord>) =>
    update({ advisors: advisors.map((a) => (a.id === id ? { ...a, ...changes } : a)) });

  const removeAdvisor = (id: string) =>
    update({ advisors: advisors.filter((a) => a.id !== id) });

  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={6}
        topicTitle="Advisors & Board"
        estimatedMinutes={6}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why advisors and boards matter</h3>
        <p className="text-navy-700 mb-3">
          Advisors and board members bring expertise, networks, and credibility that founders may not yet have. Even one credible, named advisor can strengthen a business plan — it shows that experienced people have reviewed the business and are willing to back it with their reputation.
        </p>
        <p className="text-navy-700">
          Not all businesses have advisors or a board. If yours doesn't, that's fine — this section is optional. But it's worth thinking about whether bringing in advisors could strengthen your business before you launch.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        {/* Board */}
        <div>
          <label className="input-label mb-3 block">Does your business have a formal board of directors or advisory board?</label>
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => update({ boardExists: val })}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                  org.boardExists === val
                    ? "border-navy-700 bg-navy-50 text-navy-900"
                    : "border-border bg-white text-navy-600 hover:border-navy-300"
                }`}
              >
                {val ? "Yes" : "No / Not yet"}
              </button>
            ))}
          </div>
        </div>

        {org.boardExists === true && (
          <TextAreaField
            label="Board Description"
            value={org.boardDescription || ""}
            onChange={(v) => update({ boardDescription: v })}
            placeholder="Describe the board composition, any named members, and their roles."
            rows={3}
          />
        )}

        {/* Advisors list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="input-label">Advisors</label>
            <button
              onClick={addAdvisor}
              className="text-xs text-navy-700 font-medium hover:text-navy-900 transition-colors"
            >
              + Add Advisor
            </button>
          </div>

          {advisors.length === 0 ? (
            <div className="bg-muted rounded-xl p-5 text-center">
              <p className="text-muted-foreground text-sm">No advisors added. You can skip this section if you have none.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {advisors.map((advisor, i) => (
                <div key={advisor.id} className="bg-white border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-500 uppercase">Advisor {i + 1}</span>
                    <button onClick={() => removeAdvisor(advisor.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <TextField
                        label="Name"
                        value={advisor.name}
                        onChange={(v) => updateAdvisor(advisor.id, { name: v })}
                        placeholder="e.g. Michael Torres"
                      />
                      <TextField
                        label="Area of Expertise"
                        value={advisor.expertise || ""}
                        onChange={(v) => updateAdvisor(advisor.id, { expertise: v })}
                        placeholder="e.g. Financial strategy, legal, marketing"
                      />
                    </div>
                    <TextAreaField
                      label="Contribution to the Business"
                      value={advisor.contribution || ""}
                      onChange={(v) => updateAdvisor(advisor.id, { contribution: v })}
                      placeholder="What has this advisor contributed or what will they advise on? How often are they engaged?"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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

// ─── 07 — Skills Gaps & Hiring ────────────────────────────────────────────────

function OrgGaps({ org, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={7}
        topicTitle="Skills Gaps & Hiring Plan"
        estimatedMinutes={8}
        status={status}
      />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why acknowledge gaps?</h3>
        <p className="text-navy-700 mb-3">
          Every business has capability gaps — skills or resources it needs but doesn't yet have. Acknowledging them openly is a sign of self-awareness, not weakness. A business plan that claims the founders can do everything credibly is usually not credible.
        </p>
        <p className="text-navy-700">
          What readers want to see is: <em>you know what's missing, and you have a plan to address it.</em> That plan might be hiring, bringing in advisors, using external services, or learning on the job.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Example:</p>
        <p className="text-navy-700 text-sm">
          "The current team is strong in operations and cycling expertise but lacks formal financial management experience. We plan to engage an external bookkeeper from launch and intend to hire a part-time finance manager in Year 2 once revenue supports it. We are also seeking a marketing advisor to guide our digital strategy in the early months."
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="Current Skills Gaps"
          value={org.skillsGaps || ""}
          onChange={(v) => update({ skillsGaps: v })}
          placeholder="What capabilities does the business currently lack? Which roles or skills are missing from the current team?"
          rows={4}
          required
          helpText="Be honest. Identifying gaps shows you understand what success requires."
        />

        <TextAreaField
          label="Hiring Plan"
          value={org.hiringPlan || ""}
          onChange={(v) => update({ hiringPlan: v })}
          placeholder="Who do you plan to hire, and when? Include role, approximate timing, and reason. Example: 'Technician #2 — Month 6, once service volume exceeds 80 bookings/month.'"
          rows={4}
          helpText="Tie hiring to milestones or revenue thresholds where possible. This connects to your financial plan."
        />

        <TextAreaField
          label="External Professional Support"
          value={org.externalSupport || ""}
          onChange={(v) => update({ externalSupport: v })}
          placeholder="What external professionals or services will you use? e.g. Accountant, lawyer, marketing agency, IT support, bookkeeper, HR consultant."
          rows={3}
          helpText="External support is a normal and credible part of a small business plan."
        />
      </div>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Cross-check:</strong> Make sure any planned hires are reflected in your financial plan — payroll projections should include all staff you intend to hire, not just current employees. Scruttin will flag this inconsistency if it exists.
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

// ─── 08 — Review ──────────────────────────────────────────────────────────────

function OrgReview({ org, plan, status, markComplete, onNext, onPrev, onNavigate }: any) {
  const founders: FounderRecord[] = org.founders || [];
  const managementTeam: ManagementMember[] = org.managementTeam || [];
  const advisors: AdvisorRecord[] = org.advisors || [];

  const fields = [
    {
      label: "Ownership Structure",
      value: org.ownershipSummary,
      topicId: "org_ownership",
      summary: org.ownershipSummary ? org.ownershipSummary.slice(0, 80) + "…" : null,
    },
    {
      label: "Founders",
      value: founders.length > 0 ? `${founders.length} founder(s) documented` : null,
      topicId: "org_founders",
      summary: founders.map((f: FounderRecord) => `${f.name} (${f.role})`).join(", ") || null,
    },
    {
      label: "Organizational Structure",
      value: org.orgStructureType,
      topicId: "org_structure",
      summary: org.orgStructureType
        ? STRUCTURE_TYPES.find((s) => s.value === org.orgStructureType)?.label
        : null,
    },
    {
      label: "Management Team",
      value:
        managementTeam.length > 0
          ? `${managementTeam.length} member(s) documented`
          : founders.length > 0
          ? "Covered by founders section"
          : null,
      topicId: "org_management",
      summary: managementTeam.map((m: ManagementMember) => `${m.name} (${m.title})`).join(", ") || null,
    },
    {
      label: "Skills Gaps & Hiring",
      value: org.skillsGaps,
      topicId: "org_gaps",
      summary: org.skillsGaps ? org.skillsGaps.slice(0, 80) + "…" : null,
    },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  // Cross-check: ownership percentage sum
  const equityValues = founders
    .map((f: FounderRecord) => parseFloat((f.equity || "0").replace("%", "").trim()))
    .filter((n: number) => !isNaN(n));
  const equityTotal = equityValues.reduce((a: number, b: number) => a + b, 0);
  const equityWarning =
    founders.length > 1 &&
    equityValues.length === founders.length &&
    Math.abs(equityTotal - 100) > 0.5;

  return (
    <div>
      <TopicHeader
        phase="Organization & Management"
        phaseNumber={3}
        topicNumber={8}
        topicTitle="Phase Review"
        estimatedMinutes={5}
        status={status}
      />

      {/* Cross-check warning */}
      {equityWarning && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
          <span className="text-red-500 text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-red-800 font-semibold text-sm mb-1">
              Ownership percentages don't add up to 100%
            </p>
            <p className="text-red-700 text-sm">
              Your founder equity percentages total <strong>{equityTotal}%</strong>, not 100%. Please review the Ownership and Founders topics to correct this before finalising your plan.
            </p>
            <button
              onClick={() => onNavigate("organization", "org_ownership")}
              className="text-red-700 text-xs font-semibold mt-2 hover:underline"
            >
              Fix ownership →
            </button>
          </div>
        </div>
      )}

      {/* Summary table */}
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Organization & Management — Summary</h2>
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
                  onClick={() => onNavigate("organization", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team snapshot */}
      {(founders.length > 0 || managementTeam.length > 0 || advisors.length > 0) && (
        <div className="mb-6 p-5 bg-navy-50 border border-navy-200 rounded-xl">
          <h3 className="font-semibold text-navy-900 text-sm mb-4">Team Snapshot</h3>
          <div className="space-y-2">
            {founders.map((f: FounderRecord) => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {f.name ? f.name[0].toUpperCase() : "?"}
                </div>
                <div>
                  <p className="text-navy-900 text-sm font-semibold">{f.name || "Unnamed"}</p>
                  <p className="text-navy-500 text-xs">
                    {f.role}
                    {f.equity ? ` · ${f.equity}` : ""}
                  </p>
                </div>
                <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  Founder
                </span>
              </div>
            ))}
            {managementTeam.map((m: ManagementMember) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-navy-900 text-xs font-bold shrink-0">
                  {m.name ? m.name[0].toUpperCase() : "?"}
                </div>
                <div>
                  <p className="text-navy-900 text-sm font-semibold">{m.name || "Unnamed"}</p>
                  <p className="text-navy-500 text-xs">{m.title}</p>
                </div>
                <span className="ml-auto text-[10px] bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full font-medium">
                  Management
                </span>
              </div>
            ))}
            {advisors.map((a: AdvisorRecord) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center text-sage-700 text-xs font-bold shrink-0">
                  {a.name ? a.name[0].toUpperCase() : "A"}
                </div>
                <div>
                  <p className="text-navy-900 text-sm font-semibold">{a.name || "Unnamed"}</p>
                  <p className="text-navy-500 text-xs">{a.expertise || "Advisor"}</p>
                </div>
                <span className="ml-auto text-[10px] bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full font-medium">
                  Advisor
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed === total ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            Organization & Management is complete. You're ready to move on to Products & Services — where you'll document what your business actually offers.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {total - completed} section{total - completed > 1 ? "s are" : " is"} incomplete. You can continue and return to complete them later.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Continue to Products & Services →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
