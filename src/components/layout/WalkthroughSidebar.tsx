import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BusinessPlan } from "@/types/businessPlan";
import { PHASES, PHASE_BY_ID } from "@/constants/phases";
import { SaveStatus } from "@/hooks/useBusinessPlan";

interface SidebarProps {
  plan: BusinessPlan;
  currentPhase: string;
  currentTopic: string;
  saveStatus: SaveStatus;
  onNavigate: (phase: string, topic: string) => void;
  onClose?: () => void;
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  onboarding: <span className="text-base">📖</span>,
  company_description: <span className="text-base">🏢</span>,
  market_analysis: <span className="text-base">📈</span>,
  organization: <span className="text-base">👥</span>,
  products_services: <span className="text-base">📦</span>,
  marketing_sales: <span className="text-base">📣</span>,
  operations: <span className="text-base">⚙️</span>,
  financial_plan: <span className="text-base">🧮</span>,
  funding: <span className="text-base">💰</span>,
  risks: <span className="text-base">🛡️</span>,
  milestones: <span className="text-base">🎯</span>,
  executive_summary: <span className="text-base">📄</span>,
  appendix: <span className="text-base">📎</span>,
};

export default function WalkthroughSidebar({
  plan,
  currentPhase,
  currentTopic,
  saveStatus,
  onNavigate,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const [expandedPhase, setExpandedPhase] = useState<string>(currentPhase);

  const getTopicStatus = (topicId: string) => plan.topicStatus?.[topicId] || "not_started";

  const researchCount = plan.researchItems?.filter((r) => r.status !== "completed").length ?? 0;
  const notesCount = plan.notes?.length ?? 0;

  return (
    <div className="bg-navy-900 text-white h-full flex flex-col overflow-hidden">
      {/* Logo row */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-navy-700 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C"/>
            </svg>
          </div>
          <span className="font-serif font-semibold text-sm">Scruttin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-navy-400 hover:text-white lg:hidden">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Plan name + progress */}
      <div className="px-4 py-4 border-b border-navy-700 shrink-0">
        <p className="text-white text-sm font-semibold truncate mb-1">{plan.name}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${plan.overallProgress}%` }}
            />
          </div>
          <span className="text-navy-400 text-xs shrink-0">{plan.overallProgress}%</span>
        </div>
      </div>

      {/* Phase list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {PHASES.map((phase) => {
          const phasePct = plan.phaseProgress?.[phase.id] ?? 0;
          const isActive = phase.id === currentPhase;
          const isExpanded = phase.id === expandedPhase;

          return (
            <div key={phase.id}>
              <button
                onClick={() => {
                  setExpandedPhase(isExpanded ? "" : phase.id);
                  if (phase.topics.length > 0) {
                    onNavigate(phase.id, phase.topics[0].id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                  isActive ? "bg-navy-700" : "hover:bg-navy-800"
                }`}
              >
                <span className="shrink-0 opacity-80">{PHASE_ICONS[phase.id]}</span>
                <span className={`flex-1 text-xs font-medium truncate ${isActive ? "text-white" : "text-navy-300"}`}>
                  {phase.shortTitle}
                </span>
                {phasePct === 100 ? (
                  <span className="text-sage-400 text-xs shrink-0">✓</span>
                ) : phasePct > 0 ? (
                  <span className="text-amber-400 text-xs shrink-0">{phasePct}%</span>
                ) : (
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""} text-navy-500`}
                  >
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {isExpanded && (
                <div className="bg-navy-800/50">
                  {phase.topics.map((topic) => {
                    const status = getTopicStatus(topic.id);
                    const isTopicActive = topic.id === currentTopic && isActive;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => { onNavigate(phase.id, topic.id); onClose?.(); }}
                        className={`w-full flex items-center gap-2 pl-10 pr-4 py-2 text-left transition-all ${
                          isTopicActive ? "bg-amber-400/20 text-amber-300" : "text-navy-400 hover:text-navy-200 hover:bg-navy-700/50"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          status === "completed" ? "bg-sage-400" :
                          isTopicActive ? "bg-amber-400" : "bg-navy-600"
                        }`} />
                        <span className="text-xs truncate">{topic.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Quick links */}
      <div className="border-t border-navy-700 p-3 space-y-1 shrink-0">
        <button
          onClick={() => navigate(`/plan/${plan.id}/research`)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-navy-400 hover:text-white hover:bg-navy-700 transition-all text-left"
        >
          <span>🔎</span>
          <span>Research tracker</span>
          {researchCount > 0 && (
            <span className="ml-auto bg-amber-400 text-navy-900 text-xs font-bold px-1.5 py-0.5 rounded-full">{researchCount}</span>
          )}
        </button>
        <button
          onClick={() => navigate(`/plan/${plan.id}/notes`)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-navy-400 hover:text-white hover:bg-navy-700 transition-all text-left"
        >
          <span>📝</span>
          <span>Notes</span>
          {notesCount > 0 && (
            <span className="ml-auto text-navy-500 text-xs">{notesCount}</span>
          )}
        </button>
        <button
          onClick={() => navigate(`/plan/${plan.id}/document`)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-navy-400 hover:text-white hover:bg-navy-700 transition-all text-left"
        >
          <span>📋</span>
          <span>Document preview</span>
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-navy-500 hover:text-navy-300 hover:bg-navy-800 transition-all text-left"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>All plans</span>
        </button>
      </div>

      {/* Save status */}
      <div className="px-4 py-2 border-t border-navy-800 shrink-0">
        <div className="save-indicator justify-center">
          {saveStatus === "saved" && (
            <><span className="w-1.5 h-1.5 bg-sage-500 rounded-full" /><span>Saved</span></>
          )}
          {saveStatus === "saving" && (
            <><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-soft" /><span>Saving...</span></>
          )}
          {saveStatus === "unsaved" && (
            <><span className="w-1.5 h-1.5 bg-navy-500 rounded-full" /><span>Unsaved changes</span></>
          )}
        </div>
      </div>
    </div>
  );
}
