import React from "react";
import { BusinessPlan } from "@/types/businessPlan";
import { PHASE_BY_ID } from "@/constants/phases";
import { TopicHeader, EducationPanel, TopicNav } from "@/components/features/walkthrough/TopicComponents";

interface Props {
  plan: BusinessPlan;
  phaseId: string;
  currentTopic: string;
  onNavigate: (phase: string, topic: string) => void;
  onUpdateTopicStatus: (topicId: string, status: "not_started" | "in_progress" | "completed" | "skipped") => void;
}

const PHASE_DESCRIPTIONS: Record<string, { intro: string; topics: string[] }> = {
  organization: {
    intro: "This phase covers your ownership structure, founding team, management, employees, advisors, and hiring plans.",
    topics: ["Ownership & equity", "Founder profiles", "Organizational structure", "Management team", "Current employees", "Advisors & board", "Skills gaps & hiring plans"],
  },
  products_services: {
    intro: "Describe what your business sells — your products, services, pricing, features, benefits, and customer value.",
    topics: ["Product/service catalogue", "Features vs benefits", "Customer value proposition", "Pricing model & strategy", "Intellectual property", "Future product roadmap"],
  },
  marketing_sales: {
    intro: "Define how you will attract, acquire, and retain customers. Cover your strategy, channels, budget, and sales process.",
    topics: ["Marketing objectives", "Overall marketing strategy", "Channels & tactics", "Customer acquisition", "Sales strategy & process", "Marketing budget", "Customer retention & KPIs"],
  },
  operations: {
    intro: "Explain how your business runs day-to-day — locations, technology, suppliers, delivery, staffing, and compliance.",
    topics: ["Operating model", "Locations & facilities", "Technology stack", "Suppliers & procurement", "Delivery & fulfilment", "Staffing & capacity", "Quality & compliance"],
  },
  financial_plan: {
    intro: "Build your financial model from the ground up — startup costs, revenue assumptions, expenses, P&L, cash flow, and break-even.",
    topics: ["Financial concepts & education", "Startup costs", "Sales assumptions", "Revenue forecast", "Cost of sales", "Operating expenses & payroll", "Profit & Loss statement", "Cash flow forecast", "Break-even analysis", "Financial scenarios"],
  },
  funding: {
    intro: "If your business requires external funding, detail the amount needed, its purpose, and how it will be used.",
    topics: ["Funding concepts", "Amount required", "Use of funds breakdown", "Funding type", "Repayment or return expectations"],
  },
  risks: {
    intro: "Identify, assess, and plan mitigation for the key risks your business faces. Acknowledging risk strengthens your plan.",
    topics: ["Market & competitive risks", "Financial risks", "Operational risks", "Legal & regulatory risks", "Personnel & technology risks", "Risk matrix"],
  },
  milestones: {
    intro: "Map out what you have already achieved and what milestones you are targeting. This shows ambition grounded in planning.",
    topics: ["Completed milestones", "Future milestone plan", "Timeline visualization"],
  },
  executive_summary: {
    intro: "The Executive Summary is completed last — it summarises your entire plan. You will reference information already established rather than writing from scratch.",
    topics: ["Business overview", "Problem & opportunity", "Market opportunity", "Products & services summary", "Financial highlights", "Funding request summary"],
  },
  appendix: {
    intro: "Attach supporting documents and evidence that strengthen your plan — research, CVs, contracts, licences, and more.",
    topics: ["Market research documents", "Detailed financial spreadsheets", "Team CVs/resumes", "Licences & permits", "Letters of intent / contracts", "Product material & technical documentation"],
  },
};

export default function GenericPhaseStub({ plan, phaseId, currentTopic, onNavigate, onUpdateTopicStatus }: Props) {
  const phase = PHASE_BY_ID[phaseId];
  if (!phase) return null;

  const desc = PHASE_DESCRIPTIONS[phaseId];
  const currentTopicDef = phase.topics.find((t) => t.id === currentTopic);
  const topicIndex = phase.topics.findIndex((t) => t.id === currentTopic);
  const prevTopic = topicIndex > 0 ? phase.topics[topicIndex - 1] : null;
  const nextTopic = topicIndex < phase.topics.length - 1 ? phase.topics[topicIndex + 1] : null;

  const PHASE_ORDER = ["onboarding", "company_description", "market_analysis", "organization", "products_services", "marketing_sales", "operations", "financial_plan", "funding", "risks", "milestones", "executive_summary", "appendix"];
  const phaseIdx = PHASE_ORDER.indexOf(phaseId);
  const nextPhaseId = PHASE_ORDER[phaseIdx + 1];
  const prevPhaseId = PHASE_ORDER[phaseIdx - 1];
  const prevPhaseDef = prevPhaseId ? PHASE_BY_ID[prevPhaseId] : null;

  const handleNext = () => {
    if (nextTopic) onNavigate(phaseId, nextTopic.id);
    else if (nextPhaseId) {
      const nextPhaseDef = PHASE_BY_ID[nextPhaseId];
      if (nextPhaseDef?.topics[0]) onNavigate(nextPhaseId, nextPhaseDef.topics[0].id);
    }
  };

  const handlePrev = () => {
    if (prevTopic) onNavigate(phaseId, prevTopic.id);
    else if (prevPhaseDef?.topics.length) {
      onNavigate(prevPhaseId!, prevPhaseDef.topics[prevPhaseDef.topics.length - 1].id);
    }
  };

  return (
    <div className="animate-fade-in">
      <TopicHeader
        phase={phase.title}
        phaseNumber={phase.number}
        topicNumber={topicIndex + 1}
        topicTitle={currentTopicDef?.title || "Topic"}
        estimatedMinutes={currentTopicDef?.estimatedMinutes}
        status={plan.topicStatus?.[currentTopic]}
      />

      {topicIndex === 0 && desc && (
        <>
          <EducationPanel>
            <p className="text-navy-700 mb-3">{desc.intro}</p>
            <p className="text-navy-700 font-semibold text-sm mb-2">This phase covers:</p>
            <ul className="space-y-1">
              {desc.topics.map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-navy-700">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </EducationPanel>
          <div className="mt-6 p-6 bg-white border-2 border-dashed border-amber-300 rounded-xl text-center">
            <p className="text-2xl mb-3">🚧</p>
            <p className="font-semibold text-navy-900 mb-1">Phase Coming Soon</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This phase is part of the full Scruttin walkthrough. Full topic-by-topic content for <strong>{phase.title}</strong> is being built. You can navigate to other phases using the sidebar.
            </p>
          </div>
        </>
      )}

      {topicIndex > 0 && (
        <div className="p-6 bg-white border border-border rounded-xl text-center">
          <p className="text-lg mb-2">📋</p>
          <p className="font-semibold text-navy-900 mb-1">{currentTopicDef?.title}</p>
          <p className="text-muted-foreground text-sm">
            Full guided content for this topic is coming soon. You can mark it as complete and continue.
          </p>
          <button
            onClick={() => onUpdateTopicStatus(currentTopic, "completed")}
            className="mt-4 bg-sage-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-sage-500 transition-colors"
          >
            Mark as Complete
          </button>
        </div>
      )}

      <TopicNav
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={topicIndex === 0 && phaseIdx === 1}
        isLast={!nextTopic && !nextPhaseId}
        isCompleted={plan.topicStatus?.[currentTopic] === "completed"}
        onComplete={() => onUpdateTopicStatus(currentTopic, "completed")}
      />
    </div>
  );
}
