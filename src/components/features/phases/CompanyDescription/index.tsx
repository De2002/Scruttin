import React, { useState } from "react";
import { BusinessPlan, CompanyDescription } from "@/types/businessPlan";
import {
  TopicHeader,
  EducationPanel,
  TextAreaField,
  TextField,
  SelectField,
  TopicNav,
  ResearchStatusSelector,
} from "@/components/features/walkthrough/TopicComponents";
import { LEGAL_STRUCTURES, BUSINESS_STAGES, PHASES } from "@/constants/phases";
import { toast } from "sonner";

interface Props {
  plan: BusinessPlan;
  currentTopic: string;
  onUpdatePlan: (changes: Partial<BusinessPlan>) => void;
  onUpdateTopicStatus: (topicId: string, status: "not_started" | "in_progress" | "completed" | "skipped") => void;
  onNavigate: (phase: string, topic: string) => void;
  onOpenAI: () => void;
}

const PHASE = PHASES.find((p) => p.id === "company_description")!;

function getTopicIndex(topicId: string) {
  return PHASE.topics.findIndex((t) => t.id === topicId);
}

function navTopics(currentId: string) {
  const idx = getTopicIndex(currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

export default function CompanyDescriptionPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
  onOpenAI,
}: Props) {
  const cd = plan.companyDescription || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<CompanyDescription>) => {
    onUpdatePlan({
      companyDescription: { ...cd, ...changes },
      currentTopic,
    });
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = navTopics(currentTopic);

  const handleNext = () => {
    if (nav.next) onNavigate("company_description", nav.next.id);
    else onNavigate("market_analysis", "ma_intro");
  };

  const handlePrev = () => {
    if (nav.prev) onNavigate("company_description", nav.prev.id);
  };

  const topicDef = PHASE.topics.find((t) => t.id === currentTopic);

  return (
    <div className="animate-fade-in">
      {currentTopic === "cd_overview" && <CDOverview cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onOpenAI={onOpenAI} />}
      {currentTopic === "cd_name" && <CDName cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_activity" && <CDActivity cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_purpose" && <CDPurpose cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_problem" && <CDProblem cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_mission" && <CDMission cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_vision" && <CDVision cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_objectives" && <CDObjectives cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_legal" && <CDLegal cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_stage" && <CDStage cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_history" && <CDHistory cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_achievements" && <CDAchievements cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_success_factors" && <CDSuccessFactors cd={cd} update={update} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} />}
      {currentTopic === "cd_review" && <CDReview cd={cd} plan={plan} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} onNavigate={onNavigate} />}
    </div>
  );
}

// ─── Individual topic screens ────────────────────────────────────────────────

function CDOverview({ cd, update, status, markComplete, onNext, onOpenAI }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={1} topicTitle="Business Overview" estimatedMinutes={5} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-3">
          This is the first phase of your business plan: <strong>Company Description</strong>. It tells the reader who you are, what your business does, and where it stands today.
        </p>
        <p className="text-navy-700">
          Over the next several topics, you'll define your business's name, activity, purpose, mission, vision, legal structure, and current stage. Some of these will feel straightforward. Others may require more thought than you expect.
        </p>
      </EducationPanel>

      <div className="mt-8 bg-white border border-border rounded-xl p-6">
        <h2 className="font-semibold text-navy-900 text-base mb-4">What is covered in Company Description?</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Business name and tagline",
            "What the business does",
            "The problem or need it addresses",
            "Mission and vision statements",
            "Business objectives",
            "Legal structure and ownership",
            "Current business stage",
            "Achievements to date",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-navy-700">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <EducationPanel variant="tip">
          <p className="text-sage-700">
            <strong>Tip:</strong> If your business hasn't launched yet, that's completely fine. Several topics in this phase are specifically designed for businesses that are still in the planning or pre-launch stage.
          </p>
        </EducationPanel>
      </div>

      <TopicNav onNext={onNext} isFirst isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDName({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={2} topicTitle="Business Name" estimatedMinutes={3} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          The business name is the official or trading name of your business — what customers will know it as. This is not a decision you need to make in this section if you haven't finalised it, but you should record what you're using for now.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">Why does it matter?</h3>
        <p className="text-navy-700">
          The business name appears throughout your plan and on the cover page of your final document. It also signals professionalism — a well-chosen name suggests the business has thought carefully about its identity.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextField
          label="Business Name"
          value={cd.businessName || ""}
          onChange={(v) => update({ businessName: v })}
          placeholder="e.g. CycleKit Pro"
          required
        />
        <TextField
          label="Tagline (optional)"
          value={cd.tagline || ""}
          onChange={(v) => update({ tagline: v })}
          placeholder='e.g. "Every repair, handled right"'
          helpText="A short phrase that captures what your business stands for. Optional."
        />
      </div>

      <EducationPanel variant="warning">
        <p className="text-red-700">
          <strong>Remember:</strong> If your business name is not yet registered or finalised, note that clearly. Don't record a placeholder name as if it were confirmed — this could create confusion later.
        </p>
      </EducationPanel>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDActivity({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={3} topicTitle="Business Activity" estimatedMinutes={5} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          Business activity describes what your business actually does — the main commercial activity that generates revenue. This is a factual, practical description, not a marketing statement.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">Why does it matter?</h3>
        <p className="text-navy-700">
          A reader should be able to read this one paragraph and immediately understand what your business does, what it sells, and to whom. Clarity here sets up every other section of the plan.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 mb-2">
          <strong>Weak:</strong> "We provide solutions to customers in the cycling industry."
        </p>
        <p className="text-navy-700 mb-4">
          <strong>Strong:</strong> "CycleKit Pro is a mobile bicycle repair and servicing business operating in the greater Melbourne metropolitan area. We provide on-site repairs, routine maintenance, and parts installation for recreational and commuter cyclists, primarily through a booking-based service model."
        </p>
        <p className="text-navy-600 text-xs">
          Notice the strong version specifies: what (repair and servicing), how (on-site, booking-based), where (greater Melbourne), and who (recreational and commuter cyclists). It takes three sentences, not one.
        </p>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="Describe your business activity"
          value={cd.businessActivity || ""}
          onChange={(v) => update({ businessActivity: v })}
          placeholder="Describe what your business does, what it sells or provides, and to whom. Be specific."
          rows={5}
          required
          helpText="Aim for 2–4 sentences. Avoid vague language. Be specific about what, how, where, and who."
        />
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDPurpose({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={4} topicTitle="Business Purpose" estimatedMinutes={5} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          The business purpose goes one level deeper than activity. It answers: <em>Why does this business exist?</em> Not just what it does, but what it is trying to achieve or change.
        </p>
        <p className="text-navy-700">
          Some businesses exist purely to generate profit. Others exist to solve a specific problem, serve an underserved group, or create a particular kind of value. All of these are valid purposes.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700">
          "CycleKit Pro exists to make professional bicycle maintenance accessible to everyday cyclists who don't have the time or tools to maintain their bikes themselves. Most cyclists abandon cycling over time due to maintenance issues — not lack of interest. We exist to remove that barrier."
        </p>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="What is the purpose of your business?"
          value={cd.businessPurpose || ""}
          onChange={(v) => update({ businessPurpose: v })}
          placeholder="Why does this business exist? What is it trying to achieve or change?"
          rows={4}
          required
        />
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDProblem({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={5} topicTitle="Problem or Need" estimatedMinutes={8} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          Every successful business addresses a problem or fulfils a need that isn't being met — or isn't being met well enough. This topic asks you to clearly state what that problem or need is.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">Why does it matter?</h3>
        <p className="text-navy-700">
          This is one of the most important elements in a business plan. If a reader can't clearly see the problem you're solving, they will question whether the business has a reason to exist. A clearly defined problem makes everything else — your product, your marketing, your pricing — make sense.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 mb-3">
          <strong>The problem:</strong> "Recreational cyclists in Australian cities frequently delay or avoid maintenance because professional bike shops require drop-off, have long wait times, and are concentrated in inner-city areas. Many cyclists live more than 20 minutes from a quality repair shop. As a result, bikes sit unused and cyclists disengage."
        </p>
        <p className="text-navy-700">
          <strong>Existing alternatives:</strong> "Existing options include traditional bike shops (inconvenient and slow), DIY maintenance (requires tools and knowledge most cyclists don't have), and mobile handyman services that don't specialise in bicycles."
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <TextAreaField
          label="What problem or need does your business address?"
          value={cd.problemOrNeed || ""}
          onChange={(v) => update({ problemOrNeed: v })}
          placeholder="Describe the problem your customers face or the need that isn't currently being met."
          rows={4}
          required
        />
        <TextAreaField
          label="What existing alternatives do customers currently use?"
          value={cd.existingAlternatives || ""}
          onChange={(v) => update({ existingAlternatives: v })}
          placeholder="How are customers currently solving this problem, even if imperfectly?"
          rows={3}
          helpText="Understanding existing alternatives shows you've thought about the competitive context."
        />
      </div>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Common mistake:</strong> Describing your solution instead of the problem. "We offer a mobile bike repair service" is a solution. "Cyclists can't easily access reliable repair services near their homes" is the problem. Keep these separate — you'll describe your solution later.
        </p>
      </EducationPanel>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDMission({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={6} topicTitle="Mission Statement" estimatedMinutes={7} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          A mission statement describes what your business does, who it serves, and the value it creates — in the present tense. It describes the business as it operates today (or as it will operate when launched).
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">Why does it matter?</h3>
        <p className="text-navy-700">
          A mission statement gives your team and readers a single, memorable statement of purpose. It guides decisions: when you're not sure whether to do something, the mission helps you check whether it fits.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">Formula: We [do what] for [whom] so that [outcome].</p>
        <p className="text-navy-700">
          "CycleKit Pro provides professional, on-site bicycle maintenance to everyday cyclists so that maintaining a bike is never a reason to stop riding."
        </p>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="Mission Statement"
          value={cd.mission || ""}
          onChange={(v) => update({ mission: v })}
          placeholder="We [do what] for [whom] so that [outcome/value]."
          rows={3}
          required
          helpText="Aim for 1–3 sentences. Focus on what you do and the value it creates. Avoid vague words like 'best' or 'world-class'."
        />
      </div>

      <EducationPanel variant="tip">
        <p className="text-sage-700">
          A mission statement is not a marketing slogan. It should be precise and descriptive, not inspirational-sounding and vague. "Empowering cyclists everywhere" is a slogan. A mission statement tells a reader exactly what you do.
        </p>
      </EducationPanel>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDVision({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={7} topicTitle="Vision Statement" estimatedMinutes={6} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          A vision statement describes where you want the business to be in the future. Unlike the mission (present state), the vision is aspirational — it describes the future you are working towards.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">How is it different from a mission statement?</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 p-3 rounded border border-navy-200">
            <p className="font-semibold text-navy-900 text-xs mb-1">Mission</p>
            <p className="text-navy-700 text-xs">What we do and for whom, right now.</p>
          </div>
          <div className="bg-white/60 p-3 rounded border border-navy-200">
            <p className="font-semibold text-navy-900 text-xs mb-1">Vision</p>
            <p className="text-navy-700 text-xs">What we want to become or achieve in the future.</p>
          </div>
        </div>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700">
          "To become Australia's most trusted mobile bicycle maintenance network — making professional bike care available to any cyclist, anywhere, within 24 hours."
        </p>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="Vision Statement"
          value={cd.vision || ""}
          onChange={(v) => update({ vision: v })}
          placeholder="Where do you want this business to be in 3–5 years? What do you want it to become?"
          rows={3}
          required
          helpText="1–3 sentences. Focus on the future you are building toward."
        />
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDObjectives({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={8} topicTitle="Business Objectives" estimatedMinutes={8} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What are business objectives?</h3>
        <p className="text-navy-700 mb-3">
          Objectives are specific, measurable targets the business aims to achieve — usually within a defined timeframe. They translate your vision into concrete steps.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">What makes a good objective?</h3>
        <p className="text-navy-700">
          Good objectives are <strong>SMART</strong>: Specific, Measurable, Achievable, Relevant, and Time-bound. Vague goals like "grow the business" are not objectives. "Acquire 50 paying customers within 6 months of launch" is an objective.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 mb-2 font-medium">Strong objectives:</p>
        <ul className="space-y-1 text-navy-700 text-sm">
          <li>• Reach 100 bookings per month within 12 months of launch</li>
          <li>• Achieve break-even within 8 months of trading</li>
          <li>• Expand to a second city within 24 months</li>
          <li>• Maintain a customer satisfaction score above 4.5/5 from month 3 onwards</li>
        </ul>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="Business Objectives"
          value={cd.objectives || ""}
          onChange={(v) => update({ objectives: v })}
          placeholder="List your key business objectives. Each should be specific and measurable. Include a timeframe where possible."
          rows={6}
          required
          helpText="Aim for 3–6 objectives. Use bullet points or numbered list. Be specific about numbers and timeframes."
        />
      </div>

      <EducationPanel variant="warning">
        <p className="text-red-700 text-sm">
          <strong>Common mistake:</strong> Listing goals without numbers or timeframes. "Become profitable" is a goal. "Achieve net profitability by the end of month 10" is an objective. The difference is accountability.
        </p>
      </EducationPanel>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDLegal({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={9} topicTitle="Legal Structure" estimatedMinutes={5} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is it?</h3>
        <p className="text-navy-700 mb-3">
          Legal structure refers to the formal type of business entity. The choice affects how profits are taxed, your personal liability, how ownership works, and what regulations apply.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {[
            { name: "Sole Proprietorship", desc: "You are the business. Simple to set up, full personal liability." },
            { name: "Partnership", desc: "Two or more people own the business. Shared liability." },
            { name: "LLC / Ltd", desc: "Separate legal entity. Limited personal liability. More administration." },
            { name: "Corporation", desc: "Full separation from owners. Complex but offers most flexibility for investment." },
          ].map((s) => (
            <div key={s.name} className="bg-white/60 p-3 rounded border border-navy-200">
              <p className="font-semibold text-navy-900 text-xs mb-1">{s.name}</p>
              <p className="text-navy-600 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </EducationPanel>

      <div className="mt-8 space-y-5">
        <SelectField
          label="Legal Structure"
          value={cd.legalStructure || ""}
          onChange={(v) => update({ legalStructure: v })}
          options={LEGAL_STRUCTURES}
          required
          helpText="If you haven't decided yet, select 'Not yet decided' — you can update this later."
        />
        <TextAreaField
          label="Ownership Details"
          value={cd.ownershipDetails || ""}
          onChange={(v) => update({ ownershipDetails: v })}
          placeholder="Describe the ownership structure. Who owns what percentage? Are there multiple founders?"
          rows={3}
          helpText="Example: 'Owned equally by two founders — Jane Smith (50%) and David Lee (50%).'"
        />
        <TextAreaField
          label="Business Location"
          value={cd.businessLocation || ""}
          onChange={(v) => update({ businessLocation: v })}
          placeholder="Where is the business registered or based? Where does it operate from?"
          rows={2}
        />
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDStage({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={10} topicTitle="Business Stage" estimatedMinutes={4} status={status} />

      <EducationPanel>
        <p className="text-navy-700">
          Your business stage affects which questions are relevant to you throughout this walkthrough. For example, if you haven't launched yet, questions about sales history don't apply. Be honest — there is no wrong stage.
        </p>
      </EducationPanel>

      <div className="mt-8 space-y-3">
        {BUSINESS_STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => update({ businessStage: stage.value as any })}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
              cd.businessStage === stage.value
                ? "border-navy-700 bg-navy-50"
                : "border-border bg-white hover:border-navy-300"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              cd.businessStage === stage.value ? "border-navy-700 bg-navy-700" : "border-muted-foreground"
            }`}>
              {cd.businessStage === stage.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <div>
              <p className="font-semibold text-navy-900 text-sm">{stage.label}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{stage.description}</p>
            </div>
          </button>
        ))}
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDHistory({ cd, update, status, markComplete, onNext, onPrev }: any) {
  const showHistory = cd.businessStage && cd.businessStage !== "idea" && cd.businessStage !== "pre_launch";

  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={11} topicTitle="Company History" estimatedMinutes={6} status={status} />

      {!showHistory ? (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium mb-1">Not applicable at this stage</p>
          <p className="text-blue-700 text-sm">
            Since your business is at the idea or pre-launch stage, there is no operating history to document. This section will be skipped in your final document.
          </p>
          <button onClick={() => { onUpdateTopicStatus?.("cd_history", "skipped"); onNext(); }} className="mt-4 text-blue-700 text-sm font-medium hover:underline">
            Continue to next topic →
          </button>
        </div>
      ) : (
        <>
          <EducationPanel>
            <p className="text-navy-700">
              For businesses that have been operating, this section documents your founding story and key historical events. It gives readers context for where the business is today.
            </p>
          </EducationPanel>
          <div className="mt-8">
            <TextAreaField
              label="Company History"
              value={cd.companyHistory || ""}
              onChange={(v) => update({ companyHistory: v })}
              placeholder="When was the business founded? By whom? What were the key early events? How did it develop?"
              rows={5}
            />
          </div>
          <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
        </>
      )}
    </div>
  );
}

function CDAchievements({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={12} topicTitle="Achievements to Date" estimatedMinutes={6} status={status} />

      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Achievements to date demonstrates that your business has already accomplished something meaningful — even if small. For a new business, this might mean completed research, signed letters of intent, a prototype built, early customers secured, or funding received.
        </p>
        <p className="text-navy-700">
          If your business is still at the idea stage, it is fine to say "None yet" — but be specific about what you have done. "Completed market research and identified 3 potential customers" is far stronger than silence.
        </p>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="Achievements to Date"
          value={cd.achievementsToDate || ""}
          onChange={(v) => update({ achievementsToDate: v })}
          placeholder="What has the business already accomplished? Early customers, revenue, prototypes, partnerships, research completed..."
          rows={4}
        />
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDSuccessFactors({ cd, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={13} topicTitle="Key Success Factors" estimatedMinutes={8} status={status} />

      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What are key success factors?</h3>
        <p className="text-navy-700 mb-3">
          Key success factors are the 3–5 things that, if done well, will most determine whether the business succeeds. These are not general aspirations — they are the specific capabilities, conditions, or actions that your business depends on.
        </p>
        <h3 className="font-semibold text-navy-900 mb-2">Why does it matter?</h3>
        <p className="text-navy-700">
          This question forces you to think clearly about what actually drives success in your business and your market. It separates what is nice-to-have from what is essential.
        </p>
      </EducationPanel>

      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-2">For a mobile bicycle repair business:</p>
        <ul className="space-y-1.5 text-navy-700 text-sm">
          <li>• <strong>Technician quality:</strong> Customers trust their bicycle to a stranger. Certifications and reputation drive repeat business.</li>
          <li>• <strong>Response time:</strong> Same-day or next-day availability is a core promise. Failing this breaks trust immediately.</li>
          <li>• <strong>Digital booking:</strong> Customers expect to book and pay online. Manual processes will lose bookings.</li>
          <li>• <strong>Local reviews:</strong> In a mobile service business, Google and word-of-mouth drive almost all new customer acquisition.</li>
        </ul>
      </EducationPanel>

      <div className="mt-8">
        <TextAreaField
          label="Key Success Factors"
          value={cd.keySuccessFactors || ""}
          onChange={(v) => update({ keySuccessFactors: v })}
          placeholder="List the 3–5 factors that will most determine whether your business succeeds. Be specific."
          rows={5}
          required
        />
      </div>

      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function CDReview({ cd, plan, status, markComplete, onNext, onPrev, onNavigate }: any) {
  const fields = [
    { label: "Business Name", value: cd.businessName, topicId: "cd_name" },
    { label: "Business Activity", value: cd.businessActivity, topicId: "cd_activity" },
    { label: "Business Purpose", value: cd.businessPurpose, topicId: "cd_purpose" },
    { label: "Problem or Need", value: cd.problemOrNeed, topicId: "cd_problem" },
    { label: "Mission Statement", value: cd.mission, topicId: "cd_mission" },
    { label: "Vision Statement", value: cd.vision, topicId: "cd_vision" },
    { label: "Business Objectives", value: cd.objectives, topicId: "cd_objectives" },
    { label: "Legal Structure", value: cd.legalStructure, topicId: "cd_legal" },
    { label: "Business Stage", value: cd.businessStage, topicId: "cd_stage" },
    { label: "Key Success Factors", value: cd.keySuccessFactors, topicId: "cd_success_factors" },
  ];

  const completed = fields.filter((f) => f.value).length;
  const total = fields.length;

  return (
    <div>
      <TopicHeader phase="Company Description" phaseNumber={1} topicNumber={14} topicTitle="Phase Review" estimatedMinutes={5} status={status} />

      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Company Description — Summary</h2>
          <span className={`text-sm font-semibold ${completed === total ? "text-sage-600" : "text-amber-500"}`}>
            {completed}/{total} fields completed
          </span>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${f.value ? "bg-sage-500" : "bg-amber-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{f.label}</p>
                {f.value ? (
                  <p className="text-navy-800 text-sm line-clamp-2">{f.value}</p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Not yet completed</p>
                )}
              </div>
              {!f.value && (
                <button
                  onClick={() => onNavigate("company_description", f.topicId)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0"
                >
                  Complete →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {completed === total ? (
        <EducationPanel variant="tip">
          <p className="text-sage-700 font-medium">
            All Company Description fields are complete. Well done. You're ready to move on to Market Analysis — one of the most important phases of your business plan.
          </p>
        </EducationPanel>
      ) : (
        <EducationPanel variant="warning">
          <p className="text-red-700">
            {total - completed} field{total - completed > 1 ? "s are" : " is"} incomplete. You can continue to the next phase and return to complete these later, but try to fill in as much as possible before moving on.
          </p>
        </EducationPanel>
      )}

      <TopicNav
        onPrev={onPrev}
        onNext={onNext}
        nextLabel="Begin Market Analysis →"
        isCompleted={status === "completed"}
        onComplete={markComplete}
      />
    </div>
  );
}
