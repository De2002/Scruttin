import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBusinessPlan } from "@/hooks/useBusinessPlan";
import { PHASES, PHASE_BY_ID } from "@/constants/phases";
import WalkthroughSidebar from "@/components/layout/WalkthroughSidebar";
import CompanyDescriptionPhase from "@/components/features/phases/CompanyDescription";
import MarketAnalysisPhase from "@/components/features/phases/MarketAnalysis";
import OrganizationPhase from "@/components/features/phases/Organization";
import ProductsServicesPhase from "@/components/features/phases/ProductsServices";
import MarketingSalesPhase from "@/components/features/phases/MarketingSales";
import OperationsPhase from "@/components/features/phases/Operations";
import FinancialPlanPhase from "@/components/features/phases/FinancialPlan";
import FundingRequestPhase from "@/components/features/phases/FundingRequest";
import GenericPhaseStub from "@/components/features/phases/GenericPhaseStub";
import RisksPhase from "@/components/features/phases/Risks";
import MilestonesPhase from "@/components/features/phases/Milestones";
import ExecutiveSummaryPhase from "@/components/features/phases/ExecutiveSummary";
import AIAssistant from "@/components/features/ai/AIAssistant";


export default function WalkthroughPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const { plan, saveStatus, updatePlan, updateTopicStatus, navigateTo } =
    useBusinessPlan(planId || "");

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPhase = plan.currentPhase || "company_description";
  const currentTopic = plan.currentTopic || "cd_overview";

  const handleNavigate = (phase: string, topic: string) => {
    navigateTo(phase, topic);
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case "company_description":
        return (
          <CompanyDescriptionPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "market_analysis":
        return (
          <MarketAnalysisPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "organization":
        return (
          <OrganizationPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "products_services":
        return (
          <ProductsServicesPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "marketing_sales":
        return (
          <MarketingSalesPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "operations":
        return (
          <OperationsPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "financial_plan":
        return (
          <FinancialPlanPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "funding":
        return (
          <FundingRequestPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "risks":
        return (
          <RisksPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "milestones":
        return (
          <MilestonesPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      case "executive_summary":
        return (
          <ExecutiveSummaryPhase
            plan={plan}
            currentTopic={currentTopic}
            onUpdatePlan={updatePlan}
            onUpdateTopicStatus={updateTopicStatus}
            onNavigate={handleNavigate}
            onOpenAI={() => setAiOpen(true)}
          />
        );
      default:
        return (
          <GenericPhaseStub
            plan={plan}
            phaseId={currentPhase}
            currentTopic={currentTopic}
            onNavigate={handleNavigate}
            onUpdateTopicStatus={updateTopicStatus}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:block w-56 xl:w-64 shrink-0 border-r border-navy-700 h-screen sticky top-0 overflow-hidden">
        <WalkthroughSidebar
          plan={plan}
          currentPhase={currentPhase}
          currentTopic={currentTopic}
          saveStatus={saveStatus}
          onNavigate={handleNavigate}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <WalkthroughSidebar
              plan={plan}
              currentPhase={currentPhase}
              currentTopic={currentTopic}
              saveStatus={saveStatus}
              onNavigate={handleNavigate}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between bg-navy-900 px-4 py-3 border-b border-navy-700">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-white font-medium text-sm truncate mx-4">{plan.name}</span>
          <button
            onClick={() => setAiOpen(true)}
            className="bg-amber-400/20 text-amber-300 px-3 py-1.5 rounded text-xs font-medium"
          >
            AI
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 lg:py-10">
            {renderPhaseContent()}
          </div>
        </div>

        {/* Desktop AI button */}
        <div className="hidden lg:block fixed bottom-6 right-6">
          <button
            onClick={() => setAiOpen(!aiOpen)}
            className="bg-navy-900 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-navy-800 transition-all shadow-lg flex items-center gap-2"
          >
            <span>✨</span>
            AI Assist
          </button>
        </div>
      </div>

      {/* AI panel */}
      {aiOpen && (
        <div className="fixed inset-y-0 right-0 w-80 xl:w-96 z-40 shadow-2xl">
          <AIAssistant
            plan={plan}
            currentPhase={currentPhase}
            currentTopic={currentTopic}
            onClose={() => setAiOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
