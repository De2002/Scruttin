import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlan, savePlan } from "@/lib/storage";
import { BusinessPlan } from "@/types/businessPlan";
import { PHASES } from "@/constants/phases";

const ONBOARDING_STEPS = [
  { id: "welcome", title: "Welcome to Scruttin", subtitle: "Your guided business plan walkthrough" },
  { id: "what_is_bp", title: "What Is a Business Plan?", subtitle: "Understanding the purpose before you begin" },
  { id: "structure", title: "What You're Building", subtitle: "The structure of your finished document" },
  { id: "how_it_works", title: "How This Walkthrough Works", subtitle: "The experience you are about to begin" },
];

const PLAN_STRUCTURE = [
  { n: "01", title: "Executive Summary", note: "Completed last — summarises everything" },
  { n: "02", title: "Company Description", note: "" },
  { n: "03", title: "Market Analysis", note: "One of the deepest sections" },
  { n: "04", title: "Organization & Management", note: "" },
  { n: "05", title: "Products & Services", note: "" },
  { n: "06", title: "Marketing & Sales", note: "" },
  { n: "07", title: "Operations", note: "" },
  { n: "08", title: "Financial Plan", note: "Fully interactive — built from your data" },
  { n: "09", title: "Funding Request", note: "Included only if funding is required" },
  { n: "10", title: "Risks & Mitigation", note: "" },
  { n: "11", title: "Milestones", note: "" },
  { n: "12", title: "Appendix", note: "Supporting documents and evidence" },
];

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current ? "w-6 h-2 bg-navy-900" : i < current ? "w-2 h-2 bg-sage-500" : "w-2 h-2 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<BusinessPlan | null>(null);

  useEffect(() => {
    if (planId) {
      getPlan(planId).then((loaded) => {
        if (loaded) setPlan(loaded);
        else navigate("/dashboard");
      });
    }
  }, [planId, navigate]);

  const handleNext = async () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      if (plan) {
        const updated = {
          ...plan,
          onboardingCompleted: true,
          currentPhase: "company_description",
          currentTopic: "cd_overview",
          updatedAt: new Date().toISOString(),
        };
        await savePlan(updated);
      }
      navigate(`/plan/${planId}/build`);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-navy-900 border-b border-navy-700">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C"/>
              </svg>
            </div>
            <span className="text-white font-serif font-semibold text-base">Scruttin</span>
          </div>
          <span className="text-navy-300 text-sm truncate max-w-xs">{plan.name}</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <StepDots current={step} total={ONBOARDING_STEPS.length} />
          <p className="text-muted-foreground text-xs mt-2">
            Step {step + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        <div className="animate-fade-in" key={step}>
          {step === 0 && <WelcomeStep planName={plan.name} />}
          {step === 1 && <WhatIsBPStep />}
          {step === 2 && <StructureStep />}
          {step === 3 && <HowItWorksStep />}
        </div>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="text-sm text-muted-foreground hover:text-navy-700 disabled:opacity-0 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            className="bg-navy-900 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            {step === ONBOARDING_STEPS.length - 1 ? "Begin Walkthrough →" : "Continue →"}
          </button>
        </div>
      </main>
    </div>
  );
}

function WelcomeStep({ planName }: { planName: string }) {
  return (
    <div>
      <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center mb-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 3h18v4H3zM3 10h13v4H3zM3 17h8v4H3z" fill="#0F1E3C"/>
        </svg>
      </div>
      <h1 className="text-3xl lg:text-4xl font-serif font-bold text-navy-900 mb-4">
        Welcome, and well done for starting.
      </h1>
      <p className="text-navy-600 text-base leading-relaxed mb-8">
        You've created a plan for <strong className="text-navy-900">{planName}</strong>. This walkthrough will guide you through every section of a complete Traditional Business Plan.
      </p>
      <div className="space-y-4">
        {[
          { icon: "⏳", title: "Take your time", body: "There is no time limit. A real business plan can take days or weeks to complete. That's normal." },
          { icon: "💾", title: "Your work saves automatically", body: "Every answer, note, and calculation is saved to the cloud as you type. Access your plan from any device." },
          { icon: "🔎", title: "Some questions require research", body: "You won't know every answer right now. That's expected. We'll help you track what still needs research." },
          { icon: "📖", title: "Learn as you go", body: "Every section starts with an explanation of what you're building and why it matters. No business knowledge is assumed." },
        ].map((item, i) => (
          <div key={i} className="flex gap-4 p-4 bg-white border border-border rounded-lg">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="font-semibold text-navy-900 text-sm mb-1">{item.title}</p>
              <p className="text-navy-500 text-sm leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhatIsBPStep() {
  return (
    <div>
      <h1 className="text-3xl lg:text-4xl font-serif font-bold text-navy-900 mb-4">What is a business plan?</h1>
      <p className="text-navy-600 text-base leading-relaxed mb-8">
        Before you begin writing, it helps to understand what a business plan actually is — and why businesses create one.
      </p>
      <div className="education-panel mb-6">
        <h2 className="font-semibold text-navy-900 mb-3">The simple definition</h2>
        <p className="text-navy-700 text-sm leading-relaxed">
          A business plan is a written document that describes a business — what it does, who its customers are, how it makes money, and what it plans to do in the future. It captures your thinking, your research, and your financial expectations in one place.
        </p>
      </div>
      <h3 className="font-semibold text-navy-900 mb-4">Why do businesses create a business plan?</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {[
          { title: "To attract funding", body: "Banks and investors require a business plan before considering a loan or investment." },
          { title: "To think clearly", body: "Writing forces you to confront assumptions you haven't tested and decisions you haven't made." },
          { title: "To set direction", body: "A plan creates shared understanding within a team about where the business is going." },
          { title: "To identify risks", body: "The process of writing reveals gaps, weaknesses, and threats before they become problems." },
          { title: "To measure progress", body: "Milestones and financial forecasts give you a baseline to measure actual results against." },
          { title: "To guide decisions", body: "When facing a difficult decision, a clear plan helps you evaluate options against your goals." },
        ].map((item, i) => (
          <div key={i} className="p-4 bg-white border border-border rounded-lg">
            <p className="font-semibold text-navy-900 text-sm mb-1">{item.title}</p>
            <p className="text-navy-500 text-xs leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
      <div className="example-panel">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Example</p>
        <p className="text-navy-700 text-sm leading-relaxed">
          Imagine you are opening a bicycle repair shop. A lender needs to know: How many customers will you serve per month? What will you charge? What are your costs? How long until you are profitable? Without a written plan, you are asking them to trust your guess. With a plan backed by research and clear assumptions, they can evaluate the numbers themselves.
        </p>
      </div>
      <div className="mt-6 p-4 bg-navy-50 border border-navy-200 rounded-lg">
        <h3 className="font-semibold text-navy-900 text-sm mb-2">Important: Plans change over time</h3>
        <p className="text-navy-600 text-sm leading-relaxed">
          A business plan is not a contract. It is a snapshot of your best current understanding. Your assumptions will prove right or wrong. Your market will shift. That is not failure — it is reality.
        </p>
      </div>
    </div>
  );
}

function StructureStep() {
  return (
    <div>
      <h1 className="text-3xl lg:text-4xl font-serif font-bold text-navy-900 mb-4">What you are building</h1>
      <p className="text-navy-600 text-base leading-relaxed mb-8">
        Here is the complete structure of the business plan you will build. You don't need to know what goes in each section yet — that's what the walkthrough will teach you.
      </p>
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-8">
        <div className="bg-navy-900 px-5 py-4">
          <p className="text-white font-serif font-semibold">Traditional Business Plan</p>
          <p className="text-navy-400 text-xs mt-0.5">Complete document structure</p>
        </div>
        <div className="divide-y divide-border">
          {PLAN_STRUCTURE.map((item) => (
            <div key={item.n} className="flex items-center gap-4 px-5 py-3">
              <span className="text-amber-500 font-mono text-xs font-bold w-6 shrink-0">{item.n}</span>
              <span className="text-navy-800 text-sm font-medium flex-1">{item.title}</span>
              {item.note && <span className="text-xs text-muted-foreground italic text-right max-w-48">{item.note}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="education-panel">
        <h3 className="font-semibold text-navy-900 text-sm mb-2">Why does the Executive Summary come last?</h3>
        <p className="text-navy-700 text-sm leading-relaxed">
          Even though the Executive Summary appears on page one of the final document, you will write it near the end. It summarises information from every other section — much easier to write once the rest is done.
        </p>
      </div>
    </div>
  );
}

function HowItWorksStep() {
  return (
    <div>
      <h1 className="text-3xl lg:text-4xl font-serif font-bold text-navy-900 mb-4">How this walkthrough works</h1>
      <p className="text-navy-600 text-base leading-relaxed mb-8">
        Each major section is divided into topics. Each topic follows a consistent pattern so you always know where you are and what's expected.
      </p>
      <div className="relative mb-10">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {[
            { letter: "A", title: "Introduction", body: "A natural introduction to what you're about to work on." },
            { letter: "B", title: "What is it?", body: "A plain-language explanation of the business concept. No jargon assumed." },
            { letter: "C", title: "Why does it matter?", body: "Why this information belongs in a business plan." },
            { letter: "D", title: "Example", body: "A realistic example showing the expected depth of an answer." },
            { letter: "E", title: "Think about your business", body: "Prompts that prepare you to answer for your own situation." },
            { letter: "F", title: "Research guidance", body: "Where outside information is needed, we tell you what to find and where to look." },
            { letter: "G", title: "Your turn", body: "Collect your information at the right level of detail." },
            { letter: "H", title: "Review", body: "See what you've established before moving on." },
          ].map((item) => (
            <div key={item.letter} className="flex gap-5 relative">
              <div className="w-10 h-10 bg-white border-2 border-navy-900 rounded-full flex items-center justify-center shrink-0 z-10">
                <span className="text-navy-900 font-bold text-xs">{item.letter}</span>
              </div>
              <div className="bg-white border border-border rounded-lg p-4 flex-1">
                <p className="font-semibold text-navy-900 text-sm mb-1">{item.title}</p>
                <p className="text-navy-500 text-xs leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "💡", title: "AI assistance", body: "Ask AI to explain things differently, give another example, or help you think. AI never writes your plan for you." },
          { icon: "📌", title: "Research tracker", body: "Mark any answer as 'needs research'. It's saved to your tracker. Come back when you have the information." },
          { icon: "📝", title: "Private notes", body: "Leave yourself notes throughout. They're private and don't appear in your final document." },
        ].map((f, i) => (
          <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-xl block mb-2">{f.icon}</span>
            <p className="font-semibold text-navy-900 text-sm mb-1">{f.title}</p>
            <p className="text-navy-600 text-xs leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
      <div className="bg-navy-900 text-white rounded-xl p-6 text-center">
        <p className="font-serif text-lg font-semibold mb-2">You're ready to begin.</p>
        <p className="text-navy-300 text-sm">
          The first phase is <strong className="text-white">Company Description</strong>. It starts with who you are and what problem you're solving.
        </p>
      </div>
    </div>
  );
}
