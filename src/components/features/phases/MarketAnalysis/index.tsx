import React, { useState } from "react";
import { BusinessPlan, MarketAnalysis, MarketTrend, Competitor } from "@/types/businessPlan";
import {
  TopicHeader, EducationPanel, TextAreaField, TextField,
  SelectField, TopicNav, ResearchStatusSelector,
} from "@/components/features/walkthrough/TopicComponents";
import { PHASES, GEOGRAPHIC_OPTIONS } from "@/constants/phases";
import { generateId } from "@/lib/storage";
import { toast } from "sonner";

interface Props {
  plan: BusinessPlan;
  currentTopic: string;
  onUpdatePlan: (changes: Partial<BusinessPlan>) => void;
  onUpdateTopicStatus: (topicId: string, status: "not_started" | "in_progress" | "completed" | "skipped") => void;
  onNavigate: (phase: string, topic: string) => void;
  onOpenAI: () => void;
}

const PHASE = PHASES.find((p) => p.id === "market_analysis")!;

function getNav(currentId: string) {
  const idx = PHASE.topics.findIndex((t) => t.id === currentId);
  return {
    prev: idx > 0 ? PHASE.topics[idx - 1] : null,
    next: idx < PHASE.topics.length - 1 ? PHASE.topics[idx + 1] : null,
  };
}

export default function MarketAnalysisPhase({ plan, currentTopic, onUpdatePlan, onUpdateTopicStatus, onNavigate, onOpenAI }: Props) {
  const ma = plan.marketAnalysis || {};
  const status = plan.topicStatus?.[currentTopic] || "not_started";

  const update = (changes: Partial<MarketAnalysis>) => {
    onUpdatePlan({ marketAnalysis: { ...ma, ...changes } });
    if (status === "not_started") onUpdateTopicStatus(currentTopic, "in_progress");
  };

  const markComplete = () => {
    onUpdateTopicStatus(currentTopic, "completed");
    toast.success("Topic marked as complete.");
  };

  const nav = getNav(currentTopic);
  const handleNext = () => nav.next ? onNavigate("market_analysis", nav.next.id) : onNavigate("organization", "org_ownership");
  const handlePrev = () => nav.prev ? onNavigate("market_analysis", nav.prev.id) : onNavigate("company_description", "cd_review");

  const sharedProps = { ma, update, status, markComplete, onNext: handleNext, onPrev: handlePrev };

  const renderTopic = () => {
    switch (currentTopic) {
      case "ma_intro": return <MAIntro {...sharedProps} />;
      case "ma_industry": return <MAIndustry {...sharedProps} />;
      case "ma_geography": return <MAGeography {...sharedProps} />;
      case "ma_market_size": return <MAMarketSize {...sharedProps} />;
      case "ma_market_growth": return <MAMarketGrowth {...sharedProps} />;
      case "ma_trends": return <MATrends {...sharedProps} />;
      case "ma_segmentation": return <MASegmentation {...sharedProps} />;
      case "ma_primary_customer": return <MAPrimaryCustomer {...sharedProps} />;
      case "ma_customer_needs": return <MACustomerNeeds {...sharedProps} />;
      case "ma_buying_behaviour": return <MABuyingBehaviour {...sharedProps} />;
      case "ma_demand_evidence": return <MADemandEvidence {...sharedProps} />;
      case "ma_direct_competitors": return <MADirectCompetitors {...sharedProps} />;
      case "ma_indirect_competitors": return <MAIndirectCompetitors {...sharedProps} />;
      case "ma_alternatives": return <MAAlternatives {...sharedProps} />;
      case "ma_competitive_comparison": return <MACompetitiveComparison {...sharedProps} />;
      case "ma_positioning": return <MAPositioning {...sharedProps} />;
      case "ma_barriers": return <MABarriers {...sharedProps} />;
      case "ma_opportunities": return <MAOpportunities {...sharedProps} />;
      case "ma_threats": return <MAThreats {...sharedProps} />;
      case "ma_review": return <MAReview ma={ma} plan={plan} status={status} markComplete={markComplete} onNext={handleNext} onPrev={handlePrev} onNavigate={onNavigate} />;
      default: return <MAIntro {...sharedProps} />;
    }
  };

  return <div className="animate-fade-in">{renderTopic()}</div>;
}

function MAIntro({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={1} topicTitle="Introduction to Market Analysis" estimatedMinutes={3} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Market Analysis is one of the most important phases of your business plan. It demonstrates that you understand the world your business operates in — the industry, the customers, the competitors, and the broader forces that affect success.
        </p>
        <p className="text-navy-700">
          Many first-time business plan writers underestimate this section. They describe their idea and assume the market is obvious. Investors, lenders, and experienced advisors pay close attention to whether your market understanding is real or assumed.
        </p>
      </EducationPanel>
      <div className="mt-6 bg-white border border-border rounded-xl p-5">
        <h3 className="font-semibold text-navy-900 mb-3">What you will cover in Market Analysis</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {["Industry overview", "Geographic market", "Market size & growth", "Market trends", "Customer segmentation", "Primary customer profile", "Customer needs & behaviour", "Demand evidence", "Direct competitors", "Indirect competitors & alternatives", "Competitive comparison", "Positioning & differentiation", "Barriers to entry", "Opportunities & threats"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-navy-700">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
      <EducationPanel variant="research">
        <p className="text-blue-800">
          <strong>Research required:</strong> Market Analysis requires more external research than any other phase. You will be asked about market sizes, growth rates, competitor details, and customer behaviour. Use the <strong>research tracker</strong> to flag anything you don't know yet — and come back when you have it.
        </p>
      </EducationPanel>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAIndustry({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={2} topicTitle="Industry" estimatedMinutes={8} status={status} />
      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is an industry?</h3>
        <p className="text-navy-700 mb-3">
          An industry is a group of businesses that provide similar products or services. Your business belongs to one or more industries — and understanding your industry tells readers what environment your business operates in.
        </p>
        <p className="text-navy-700">
          For example: a mobile bicycle repair business operates within the <em>Bicycle Repair & Retail</em> industry segment of the broader <em>Sporting Goods & Recreation</em> industry.
        </p>
      </EducationPanel>
      <EducationPanel variant="research">
        <p className="text-blue-800 mb-2">
          <strong>Research guidance:</strong> Industry reports from IBISWorld, Statista, government statistics agencies, and industry associations are the most credible sources for industry descriptions.
        </p>
        <p className="text-blue-700 text-xs">Search: "[your industry] industry overview report [current year]"</p>
      </EducationPanel>
      <div className="mt-6 space-y-5">
        <TextField label="Industry" value={ma.industry || ""} onChange={(v) => update({ industry: v })} placeholder="e.g. Bicycle Repair & Retail" required />
        <TextField label="Industry Segment" value={ma.industrySegment || ""} onChange={(v) => update({ industrySegment: v })} placeholder="e.g. Mobile Bicycle Servicing" helpText="The specific segment within the broader industry that most closely describes your business." />
        <TextAreaField label="Industry Description" value={ma.industryDescription || ""} onChange={(v) => update({ industryDescription: v })} placeholder="Describe the industry — its size, how it is structured, and how it operates. Include relevant statistics where known." rows={5} required />
        <TextAreaField label="Important Industry Participants" value={ma.industryParticipants || ""} onChange={(v) => update({ industryParticipants: v })} placeholder="Who are the major players in this industry? Large chains, dominant brands, franchise networks?" rows={3} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAGeography({ ma, update, status, markComplete, onNext, onPrev }: any) {
  const selected: string[] = ma.geographicMarket || [];
  const toggle = (v: string) => {
    const updated = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    update({ geographicMarket: updated });
  };
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={3} topicTitle="Geographic Market" estimatedMinutes={5} status={status} />
      <EducationPanel>
        <p className="text-navy-700">
          Define the geographic boundaries of your market. Where do your customers live or operate? Where will your business serve them? This is important because market sizes, competition, and customer characteristics vary significantly by location.
        </p>
      </EducationPanel>
      <div className="mt-6 space-y-4">
        <div>
          <label className="input-label">Geographic Scope (select all that apply)</label>
          <div className="grid sm:grid-cols-3 gap-2 mt-2">
            {GEOGRAPHIC_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => toggle(opt.value)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${selected.includes(opt.value) ? "border-navy-700 bg-navy-50 text-navy-900" : "border-border bg-white text-navy-600 hover:border-navy-300"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <TextAreaField label="Describe Your Geographic Market" value={ma.geographicMarket?.join(", ") ? "" : ""} onChange={(v) => update({ geographicMarket: v.split(",").map(s => s.trim()).filter(Boolean) })}
          placeholder="Describe the specific geographic area your business serves. Include cities, regions, countries, or radius as relevant." rows={3} helpText="Be specific. 'Melbourne metropolitan area' is better than 'Australia'." />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAMarketSize({ ma, update, status, markComplete, onNext, onPrev }: any) {
  const [researchStatus, setResearchStatus] = useState<any>("known");
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={4} topicTitle="Market Size" estimatedMinutes={12} status={status} />
      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is market size?</h3>
        <p className="text-navy-700 mb-3">
          Market size is the total amount of revenue or the total number of customers in your target market. It tells readers how large the opportunity is.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { term: "TAM", def: "Total Addressable Market — the entire global or national opportunity" },
            { term: "SAM", def: "Serviceable Addressable Market — the portion you can realistically reach" },
            { term: "SOM", def: "Serviceable Obtainable Market — what you can realistically capture" },
          ].map((item) => (
            <div key={item.term} className="bg-white/60 p-3 rounded border border-navy-200">
              <p className="font-bold text-navy-900 text-sm">{item.term}</p>
              <p className="text-navy-600 text-xs mt-1">{item.def}</p>
            </div>
          ))}
        </div>
      </EducationPanel>
      <EducationPanel variant="research">
        <p className="text-blue-800 mb-2"><strong>How to find market size:</strong></p>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Industry research reports (IBISWorld, Statista, Mintel)</li>
          <li>• Government statistics and census data</li>
          <li>• Industry association publications</li>
          <li>• Financial filings of publicly listed competitors</li>
        </ul>
      </EducationPanel>
      <div className="mt-6 mb-4">
        <label className="input-label mb-2">How confident are you in this data?</label>
        <ResearchStatusSelector value={researchStatus} onChange={setResearchStatus} />
      </div>
      <div className="mt-5 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <TextField label="Market Value" value={ma.marketValue || ""} onChange={(v) => update({ marketValue: v })} placeholder="e.g. 2.4 billion" helpText="Total annual revenue of the market" />
          <TextField label="Currency" value={ma.marketCurrency || ""} onChange={(v) => update({ marketCurrency: v })} placeholder="e.g. USD, AUD" />
          <TextField label="Year" value={ma.marketYear || ""} onChange={(v) => update({ marketYear: v })} placeholder="e.g. 2024" />
        </div>
        <TextAreaField label="Methodology" value={ma.marketMethodology || ""} onChange={(v) => update({ marketMethodology: v })} placeholder="How was this figure calculated or sourced? Bottom-up calculation, industry report, etc." rows={2} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAMarketGrowth({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={5} topicTitle="Market Growth" estimatedMinutes={10} status={status} />
      <EducationPanel>
        <p className="text-navy-700">
          Is your market growing, stable, or declining? Market growth tells readers whether the opportunity is expanding or contracting. A growing market suggests increasing demand; a declining market raises questions about long-term viability.
        </p>
      </EducationPanel>
      <div className="mt-6 space-y-5">
        <div>
          <label className="input-label">Market Direction</label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {(["growing", "stable", "declining"] as const).map((dir) => (
              <button key={dir} onClick={() => update({ growthDirection: dir })}
                className={`py-3 rounded-lg border text-sm font-semibold capitalize transition-all ${ma.growthDirection === dir ? "border-navy-700 bg-navy-50 text-navy-900" : "border-border bg-white text-navy-600 hover:border-navy-300"}`}>
                {dir === "growing" ? "📈 Growing" : dir === "stable" ? "➡️ Stable" : "📉 Declining"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Annual Growth Rate" value={ma.growthRate || ""} onChange={(v) => update({ growthRate: v })} placeholder="e.g. 6.2% per year" />
          <TextField label="Period" value={ma.growthPeriod || ""} onChange={(v) => update({ growthPeriod: v })} placeholder="e.g. 2022–2027" />
        </div>
        <TextAreaField label="Reason for Growth/Decline" value={ma.growthReason || ""} onChange={(v) => update({ growthReason: v })} placeholder="What is driving the growth or decline of this market?" rows={3} />
        <TextAreaField label="Evidence & Source" value={ma.growthEvidence || ""} onChange={(v) => update({ growthEvidence: v })} placeholder="What evidence supports this? Cite your source." rows={2} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MATrends({ ma, update, status, markComplete, onNext, onPrev }: any) {
  const trends: MarketTrend[] = ma.trends || [];
  const addTrend = () => update({ trends: [...trends, { id: generateId(), trend: "", category: "", evidence: "", source: "", expectedImpact: "" }] });
  const updateTrend = (id: string, changes: Partial<MarketTrend>) => update({ trends: trends.map((t) => t.id === id ? { ...t, ...changes } : t) });
  const removeTrend = (id: string) => update({ trends: trends.filter((t) => t.id !== id) });

  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={6} topicTitle="Market Trends" estimatedMinutes={15} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Market trends are forces that are changing your market — shifts in technology, consumer behaviour, regulation, demographics, or economics. Understanding trends shows that you are thinking about where your market is going, not just where it is today.
        </p>
        <p className="text-navy-700">Each trend should be supported by evidence. "I think people are using their phones more" is an observation. A cited statistic showing smartphone commerce growth is a trend.</p>
      </EducationPanel>
      <EducationPanel variant="example">
        <p className="text-navy-700 font-medium mb-1">Example trend (bicycle industry):</p>
        <p className="text-navy-700 text-sm"><strong>Trend:</strong> Rising commuter cycling adoption post-pandemic</p>
        <p className="text-navy-700 text-sm"><strong>Evidence:</strong> Cycling participation in Melbourne grew 27% between 2020–2023 (Bicycle Network, 2024)</p>
        <p className="text-navy-700 text-sm"><strong>Impact:</strong> Larger addressable market; higher proportion of maintenance-naive new cyclists who need support</p>
      </EducationPanel>
      <div className="mt-6 space-y-4">
        {trends.map((trend, i) => (
          <div key={trend.id} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-500 uppercase">Trend {i + 1}</span>
              <button onClick={() => removeTrend(trend.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <div className="space-y-3">
              <TextField label="Trend" value={trend.trend} onChange={(v) => updateTrend(trend.id, { trend: v })} placeholder="Describe the trend" />
              <TextField label="Category" value={trend.category} onChange={(v) => updateTrend(trend.id, { category: v })} placeholder="e.g. Technology, Consumer behaviour, Regulation" />
              <TextField label="Evidence & Source" value={trend.evidence || ""} onChange={(v) => updateTrend(trend.id, { evidence: v })} placeholder="What evidence supports this? Cite your source." />
              <TextField label="Expected Impact on Your Business" value={trend.expectedImpact || ""} onChange={(v) => updateTrend(trend.id, { expectedImpact: v })} placeholder="How will this trend affect your business?" />
            </div>
          </div>
        ))}
        <button onClick={addTrend} className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors">
          + Add Market Trend
        </button>
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MASegmentation({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={7} topicTitle="Market Segmentation" estimatedMinutes={10} status={status} />
      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is market segmentation?</h3>
        <p className="text-navy-700 mb-3">
          Market segmentation divides your total market into distinct groups of customers who share similar characteristics, needs, or behaviours. Not every customer is the same — segmentation helps you identify who your most important customers are.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { type: "B2C Segments", desc: "Demographics (age, income), psychographics (lifestyle, values), geography, behaviour" },
            { type: "B2B Segments", desc: "Industry, company size, revenue, geography, buying process, role of decision-maker" },
          ].map((s) => (
            <div key={s.type} className="bg-white/60 p-3 rounded border border-navy-200">
              <p className="font-semibold text-navy-900 text-xs mb-1">{s.type}</p>
              <p className="text-navy-600 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Describe Your Market Segments" value={ma.primaryCustomer || ""} onChange={(v) => update({ primaryCustomer: v })}
          placeholder="Identify the distinct groups of customers in your market. Describe each segment briefly." rows={5}
          helpText="Example: Segment 1 — Recreational cyclists aged 25–45, moderate income, cycling for leisure. Segment 2 — Daily commuters, inner-city, cycling for transport." />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAPrimaryCustomer({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={8} topicTitle="Primary Customer" estimatedMinutes={12} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Your primary customer is the specific type of customer your business is primarily designed to serve. They represent your most important market segment — the customer who is most likely to buy, most likely to return, and most valuable to your business.
        </p>
        <p className="text-navy-700">Describe this customer in concrete, specific terms. Avoid vague generalisations like "everyone" or "adults who like cycling."</p>
      </EducationPanel>
      <EducationPanel variant="example">
        <p className="text-navy-700">
          "Our primary customer is a recreational cyclist aged 28–45 living in inner to middle-ring suburban Melbourne. They own one or two bikes used for weekend riding and occasional commuting. They have disposable income but limited time. They are technically capable in their career but don't have the tools, skills, or patience to repair a bike themselves. They have previously had a poor experience with traditional bike shops due to wait times."
        </p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Describe Your Primary Customer" value={ma.primaryCustomer || ""} onChange={(v) => update({ primaryCustomer: v })}
          placeholder="Who is your primary customer? Be specific about characteristics relevant to your business — not just generic demographics." rows={6} required />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MACustomerNeeds({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={9} topicTitle="Customer Needs" estimatedMinutes={10} status={status} />
      <EducationPanel>
        <p className="text-navy-700">
          Customer needs are the specific requirements, problems, or desires that drive your target customers to seek a solution. Understanding these deeply is what separates a business that survives from one that thrives.
        </p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="What are your customers' primary needs?" value={ma.buyingBehaviour || ""} onChange={(v) => update({ buyingBehaviour: v })}
          placeholder="What do your customers need? What problems are they trying to solve? What outcomes are they trying to achieve?" rows={5}
          helpText="Be specific. 'Convenience' is too vague. 'Ability to book a repair without dropping off the bike and arranging transport' is a need." />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MABuyingBehaviour({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={10} topicTitle="Buying Behaviour" estimatedMinutes={8} status={status} />
      <EducationPanel>
        <p className="text-navy-700">
          Buying behaviour describes how your customers make purchasing decisions. Understanding this shapes your pricing, marketing, sales process, and service design.
        </p>
      </EducationPanel>
      <div className="mt-6 space-y-4">
        <TextAreaField label="Purchase Frequency & Spending" value={ma.purchaseFrequency || ""} onChange={(v) => update({ purchaseFrequency: v })} placeholder="How often do customers buy? How much do they typically spend per transaction or per year?" rows={3} />
        <TextAreaField label="Decision Factors" value={ma.decisionFactors || ""} onChange={(v) => update({ decisionFactors: v })} placeholder="What factors most influence the purchase decision? Price, convenience, reputation, reviews, recommendation?" rows={3} />
        <TextAreaField label="Buying Channels" value={ma.buyingChannels || ""} onChange={(v) => update({ buyingChannels: v })} placeholder="Where and how do customers buy? Online, in-store, by phone, via referral?" rows={2} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MADemandEvidence({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={11} topicTitle="Demand Evidence" estimatedMinutes={12} status={status} />
      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">Why evidence matters</h3>
        <p className="text-navy-700 mb-3">
          Asserting that customers want your product is not evidence. Evidence is observable data that confirms demand exists. Without it, your market analysis is based on belief rather than fact.
        </p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Evidence of Demand" value={ma.growthEvidence || ""} onChange={(v) => update({ growthEvidence: v })}
          placeholder="Describe the evidence you have that customers want what you are offering. Include: interviews conducted, surveys run, pre-orders taken, search volume data, reviews of competitors showing unmet needs, existing sales, industry research..." rows={6}
          helpText="If you haven't collected evidence yet, note what you plan to do and mark this for research." />
      </div>
      <EducationPanel variant="tip">
        <p className="text-sage-700">Even small-scale evidence is valuable. 10 customer interviews with documented responses is stronger than citing a general industry report. Primary research — evidence you collect yourself — is especially powerful.</p>
      </EducationPanel>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MADirectCompetitors({ ma, update, status, markComplete, onNext, onPrev }: any) {
  const competitors: Competitor[] = ma.directCompetitors || [];
  const addComp = () => update({ directCompetitors: [...competitors, { id: generateId(), name: "", type: "direct", description: "", strengths: "", weaknesses: "", pricing: "" }] });
  const updateComp = (id: string, changes: Partial<Competitor>) => update({ directCompetitors: competitors.map((c) => c.id === id ? { ...c, ...changes } : c) });
  const removeComp = (id: string) => update({ directCompetitors: competitors.filter((c) => c.id !== id) });

  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={12} topicTitle="Direct Competitors" estimatedMinutes={15} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-2"><strong>Direct competitors</strong> offer the same or very similar products/services to the same target customers.</p>
        <p className="text-navy-700">Knowing your competitors in detail — their strengths, weaknesses, and pricing — shows readers you understand the competitive landscape. It also sharpens your own positioning.</p>
      </EducationPanel>
      <div className="mt-6 space-y-4">
        {competitors.map((comp, i) => (
          <div key={comp.id} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-amber-500 uppercase">Competitor {i + 1}</span>
              <button onClick={() => removeComp(comp.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField label="Name" value={comp.name} onChange={(v) => updateComp(comp.id, { name: v })} placeholder="Competitor name" />
                <TextField label="Website (optional)" value={comp.url || ""} onChange={(v) => updateComp(comp.id, { url: v })} placeholder="https://" />
              </div>
              <TextAreaField label="Description" value={comp.description || ""} onChange={(v) => updateComp(comp.id, { description: v })} placeholder="What do they offer? Who do they serve?" rows={2} />
              <div className="grid sm:grid-cols-2 gap-3">
                <TextAreaField label="Strengths" value={comp.strengths || ""} onChange={(v) => updateComp(comp.id, { strengths: v })} placeholder="What do they do well?" rows={3} />
                <TextAreaField label="Weaknesses" value={comp.weaknesses || ""} onChange={(v) => updateComp(comp.id, { weaknesses: v })} placeholder="Where are they vulnerable or inadequate?" rows={3} />
              </div>
              <TextField label="Pricing" value={comp.pricing || ""} onChange={(v) => updateComp(comp.id, { pricing: v })} placeholder="What are their approximate prices?" />
            </div>
          </div>
        ))}
        <button onClick={addComp} className="w-full border-2 border-dashed border-navy-300 text-navy-600 py-3 rounded-xl text-sm font-medium hover:border-navy-500 hover:text-navy-800 transition-colors">
          + Add Direct Competitor
        </button>
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAIndirectCompetitors({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={13} topicTitle="Indirect Competitors" estimatedMinutes={10} status={status} />
      <EducationPanel>
        <p className="text-navy-700"><strong>Indirect competitors</strong> serve the same customer need through a different type of product or service. They compete for the same budget or attention, but through a different approach.</p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Indirect Competitors" value={ma.positioning || ""} onChange={(v) => update({ positioning: v })}
          placeholder="Describe businesses that address the same need through different means. For a mobile bike repair service, indirect competitors might include YouTube tutorials (DIY), general handyman services, or big-box sporting goods stores with repair bays." rows={5} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAAlternatives({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={14} topicTitle="Alternatives" estimatedMinutes={8} status={status} />
      <EducationPanel>
        <p className="text-navy-700">Alternatives are what customers do instead of buying from anyone in your market — including doing nothing, delaying the decision, or solving the problem themselves.</p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="What alternatives do customers currently use?" value={ma.reasonsCustomersChooseCompetitors || ""} onChange={(v) => update({ reasonsCustomersChooseCompetitors: v })}
          placeholder="What do customers do right now instead of using your product or service? What would they do if your business didn't exist?" rows={4} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MACompetitiveComparison({ ma, update, status, markComplete, onNext, onPrev }: any) {
  const allCompetitors = [...(ma.directCompetitors || [])];
  const criteria = ["Price", "Convenience", "Quality", "Speed", "Customer service", "Specialisation"];

  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={15} topicTitle="Competitive Comparison" estimatedMinutes={10} status={status} />
      <EducationPanel>
        <p className="text-navy-700">A competitive comparison table shows how your business stacks up against competitors across key criteria. It makes positioning clear and visual.</p>
      </EducationPanel>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden border border-border">
          <thead>
            <tr className="bg-navy-900 text-white">
              <th className="text-left px-4 py-3 text-xs font-semibold">Criteria</th>
              <th className="px-4 py-3 text-xs font-semibold text-center">Your Business</th>
              {allCompetitors.slice(0, 3).map((c) => (
                <th key={c.id} className="px-4 py-3 text-xs font-semibold text-center">{c.name || "Competitor"}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, i) => (
              <tr key={c} className={i % 2 === 0 ? "bg-white" : "bg-navy-50"}>
                <td className="px-4 py-3 font-medium text-navy-700 text-xs">{c}</td>
                <td className="px-4 py-3 text-center">
                  <select className="text-xs border border-input rounded px-2 py-1 bg-white">
                    <option>★★★★★</option><option>★★★★</option><option>★★★</option><option>★★</option><option>★</option>
                  </select>
                </td>
                {allCompetitors.slice(0, 3).map((comp) => (
                  <td key={comp.id} className="px-4 py-3 text-center">
                    <select className="text-xs border border-input rounded px-2 py-1 bg-white">
                      <option>★★★★★</option><option>★★★★</option><option>★★★</option><option>★★</option><option>★</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {allCompetitors.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-4 py-4">Complete the Direct Competitors topic first to populate the comparison table.</p>
        )}
      </div>
      <div className="mt-5">
        <TextAreaField label="Key Takeaways from Competitive Comparison" value={ma.differentiation || ""} onChange={(v) => update({ differentiation: v })} placeholder="What does this comparison reveal about your competitive position? Where do you have clear advantages?" rows={3} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAPositioning({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={16} topicTitle="Positioning" estimatedMinutes={10} status={status} />
      <EducationPanel>
        <h3 className="font-semibold text-navy-900 mb-2">What is positioning?</h3>
        <p className="text-navy-700 mb-3">
          Positioning describes where your business sits in the market relative to competitors — and why customers should choose you. It is not a marketing tagline. It is a strategic statement about your competitive identity.
        </p>
      </EducationPanel>
      <EducationPanel variant="example">
        <p className="text-navy-700">"CycleKit Pro is positioned as the premium convenience option for time-poor recreational and commuter cyclists in metropolitan Melbourne. Unlike traditional bike shops that require drop-off, we come to the customer — at home, work, or wherever the bike is. We price above DIY tutorials but below specialist workshops, reflecting our combination of professional quality and maximum convenience."</p>
      </EducationPanel>
      <div className="mt-6 space-y-5">
        <TextAreaField label="Market Positioning Statement" value={ma.positioning || ""} onChange={(v) => update({ positioning: v })} placeholder="How is your business positioned relative to competitors? Where do you sit in terms of price, quality, convenience, specialisation?" rows={4} required />
        <TextAreaField label="Why Would Customers Choose You?" value={ma.reasonsCustomersChooseUs || ""} onChange={(v) => update({ reasonsCustomersChooseUs: v })} placeholder="What specific reasons would make a customer choose your business over alternatives?" rows={3} />
        <TextAreaField label="Why Might Customers Choose a Competitor Instead?" value={ma.differentiation || ""} onChange={(v) => update({ differentiation: v })} placeholder="Be honest. When would a competitor win? Understanding this sharpens your positioning." rows={3} />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MABarriers({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={17} topicTitle="Barriers to Entry" estimatedMinutes={8} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Barriers to entry are factors that make it difficult for new businesses to enter your market. High barriers protect established players. Low barriers mean competition can arrive easily.
        </p>
        <p className="text-navy-700">Covering this topic demonstrates market awareness. Acknowledging that barriers are low is not a weakness — but you should also address how you will build your own competitive moat over time.</p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Barriers to Entry in Your Market" value={ma.barriersToEntry || ""} onChange={(v) => update({ barriersToEntry: v })}
          placeholder="What factors make it difficult for a new business to enter your market? Capital requirements, regulations, specialised knowledge, customer loyalty, supplier relationships, brand reputation..." rows={5} required />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAOpportunities({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={18} topicTitle="Market Opportunities" estimatedMinutes={8} status={status} />
      <EducationPanel>
        <p className="text-navy-700">Market opportunities are external conditions, trends, or gaps that your business can take advantage of. These are not internal strengths — they are things happening in the market that work in your favour.</p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Market Opportunities" value={ma.opportunities || ""} onChange={(v) => update({ opportunities: v })} placeholder="What external opportunities exist in your market? Underserved customer segments, technology shifts, regulatory changes, competitor weaknesses, emerging trends..." rows={5} required />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAThreats({ ma, update, status, markComplete, onNext, onPrev }: any) {
  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={19} topicTitle="Market Threats" estimatedMinutes={8} status={status} />
      <EducationPanel>
        <p className="text-navy-700 mb-3">
          Market threats are external forces that could negatively affect your business. Acknowledging threats does not weaken your plan — it strengthens it. A plan that ignores threats looks naive. A plan that identifies threats and addresses them looks professional.
        </p>
      </EducationPanel>
      <div className="mt-6">
        <TextAreaField label="Market Threats" value={ma.threats || ""} onChange={(v) => update({ threats: v })} placeholder="What external threats could harm your business? New competitors, changing regulations, technology disruption, economic conditions, shifting consumer preferences..." rows={5} required />
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}

function MAReview({ ma, plan, status, markComplete, onNext, onPrev, onNavigate }: any) {
  const fields = [
    { label: "Industry", value: ma.industry, topicId: "ma_industry" },
    { label: "Market Size", value: ma.marketValue, topicId: "ma_market_size" },
    { label: "Market Growth", value: ma.growthDirection, topicId: "ma_market_growth" },
    { label: "Market Trends", value: (ma.trends || []).length > 0 ? `${ma.trends.length} trend(s)` : null, topicId: "ma_trends" },
    { label: "Primary Customer", value: ma.primaryCustomer, topicId: "ma_primary_customer" },
    { label: "Direct Competitors", value: (ma.directCompetitors || []).length > 0 ? `${ma.directCompetitors.length} competitor(s)` : null, topicId: "ma_direct_competitors" },
    { label: "Positioning", value: ma.positioning, topicId: "ma_positioning" },
    { label: "Barriers to Entry", value: ma.barriersToEntry, topicId: "ma_barriers" },
    { label: "Opportunities", value: ma.opportunities, topicId: "ma_opportunities" },
    { label: "Threats", value: ma.threats, topicId: "ma_threats" },
  ];
  const completed = fields.filter((f) => f.value).length;

  return (
    <div>
      <TopicHeader phase="Market Analysis" phaseNumber={2} topicNumber={20} topicTitle="Market Analysis Review" estimatedMinutes={8} status={status} />
      <div className="mb-6 p-5 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-900">Market Analysis — Summary</h2>
          <span className={`text-sm font-semibold ${completed === fields.length ? "text-sage-600" : "text-amber-500"}`}>{completed}/{fields.length} completed</span>
        </div>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${f.value ? "bg-sage-500" : "bg-amber-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{f.label}</p>
                {f.value ? <p className="text-navy-800 text-sm line-clamp-2">{f.value}</p> : <p className="text-muted-foreground text-sm italic">Not yet completed</p>}
              </div>
              {!f.value && (
                <button onClick={() => onNavigate("market_analysis", f.topicId)} className="text-xs text-amber-600 hover:text-amber-700 font-medium shrink-0">Complete →</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <TopicNav onPrev={onPrev} onNext={onNext} nextLabel="Continue to Organization →" isCompleted={status === "completed"} onComplete={markComplete} />
    </div>
  );
}
