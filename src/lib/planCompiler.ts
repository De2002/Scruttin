import {
  BusinessPlan,
  CompanyDescription,
  MarketAnalysis,
  Organization,
  OperationsData,
  ProductsServicesData,
  MarketingSalesData,
  FinancialPlan,
  FundingRequestData,
  RiskItem,
  Milestone,
  AppendixData,
  Product,
} from "@/types/businessPlan";

export interface CompiledSubsection {
  title: string;
  type?: "text" | "bullets" | "key-value" | "table" | "quote" | "metrics";
  text?: string;
  items?: string[];
  keyValuePairs?: Array<{ key: string; value: string }>;
  tableHeaders?: string[];
  tableRows?: string[][];
}

export interface CompiledSection {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  iconName: string;
  hasContent: boolean;
  summary?: string;
  subsections: CompiledSubsection[];
}

export interface CompiledBusinessPlan {
  planId: string;
  name: string;
  tagline: string;
  preparedFor: string;
  author: string;
  date: string;
  overallProgress: number;
  sections: CompiledSection[];
  financialSummary: {
    year1Revenue: number;
    year1GrossProfit: number;
    year1OpEx: number;
    year1EBITDA: number;
    totalStartupCosts: number;
    breakevenMonth: number | null;
    totalFundingRequired: number;
    currency: string;
  };
}

// ─── Financial Projection Computations ────────────────────────────────────────
export function calculateCompiledFinancials(plan: BusinessPlan) {
  const fp = plan.financialPlan || {};
  const ps = plan.productsServices || {};
  const offerings: Product[] = ps.offerings || plan.products || [];
  const assumptions = fp.salesAssumptions || [];
  const fixedExpenses = fp.fixedExpenses || [];
  const variableExpenses = fp.variableExpenses || [];
  const payroll = fp.payrollItems || [];
  const currency = fp.currency || "USD";

  const totalStartupCosts = (fp.startupCosts || []).reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0
  );

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    let rev = 0;
    let cogs = 0;

    assumptions.forEach((a) => {
      const units = (a.unitsPerMonth || 0) * Math.pow(1 + (a.growthRateMonthly || 0) / 100, i);
      rev += units * (a.price || 0);
      const offering = offerings.find((o) => o.id === a.offeringId || o.name === a.offeringName);
      if (offering?.directCosts) {
        cogs += units * offering.directCosts;
      }
    });

    const fixed = fixedExpenses.reduce((acc, curr) => acc + (curr.monthlyAmount || 0), 0);
    const variable = variableExpenses.reduce(
      (acc, curr) => acc + rev * ((curr.percentOfRevenue || 0) / 100),
      0
    );
    const payrollExp = payroll
      .filter((p) => (p.startMonth || 1) <= monthNum)
      .reduce((acc, curr) => acc + (curr.monthlySalary || 0) * (curr.headcount || 1), 0);

    const grossProfit = rev - cogs;
    const opex = fixed + variable + payrollExp;
    const ebitda = grossProfit - opex;

    return {
      month: monthNum,
      revenue: rev,
      cogs,
      grossProfit,
      opex,
      ebitda,
      fixed,
      variable,
      payroll: payrollExp,
    };
  });

  const year1Revenue = months.reduce((acc, curr) => acc + curr.revenue, 0);
  const year1GrossProfit = months.reduce((acc, curr) => acc + curr.grossProfit, 0);
  const year1OpEx = months.reduce((acc, curr) => acc + curr.opex, 0);
  const year1EBITDA = months.reduce((acc, curr) => acc + curr.ebitda, 0);

  // Calculate break-even month
  let breakevenMonth: number | null = null;
  for (let m = 0; m < months.length; m++) {
    if (months[m].ebitda >= 0 && months[m].revenue > 0) {
      breakevenMonth = m + 1;
      break;
    }
  }

  const funding = plan.fundingRequest;
  const totalFundingRequired = funding?.totalFundingRequired || fp.fundingAmount || 0;

  return {
    currency,
    months,
    year1Revenue,
    year1GrossProfit,
    year1OpEx,
    year1EBITDA,
    totalStartupCosts,
    breakevenMonth,
    totalFundingRequired,
  };
}

export function formatCurrency(amount: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;
  if (Math.abs(amount) >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${symbol}${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${symbol}${amount.toFixed(0)}`;
}

// ─── Compile All 12 Business Plan Sections ────────────────────────────────────
export function compileBusinessPlan(plan: BusinessPlan): CompiledBusinessPlan {
  const cd: CompanyDescription = plan.companyDescription || {};
  const ma: MarketAnalysis = plan.marketAnalysis || {};
  const org: Organization = plan.organization || {};
  const ops: OperationsData = plan.operations || {};
  const ps: ProductsServicesData = plan.productsServices || {};
  const ms: MarketingSalesData = plan.marketingSales || {};
  const fp: FinancialPlan = plan.financialPlan || {};
  const fr: FundingRequestData = plan.fundingRequest || {};
  const es = plan.executiveSummary || {};
  const risks: RiskItem[] = plan.risks || [];
  const milestones: Milestone[] = plan.milestones || [];
  const appendix: AppendixData = plan.appendix || {};
  const offerings: Product[] = ps.offerings || plan.products || [];

  const financials = calculateCompiledFinancials(plan);
  const cur = financials.currency;

  const sections: CompiledSection[] = [];

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Executive Summary
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const overview = es.businessOverview || cd.businessActivity || cd.businessPurpose;
    const problem = es.problemStatement || cd.problemOrNeed;
    const solution = es.solutionSummary || ps.overallValueProp;
    const market = es.marketOpportunity || (ma.industry ? `${ma.industry} market valued at ${ma.marketValue || 'significant scale'}` : undefined);
    const compAdv = es.competitiveAdvantage || ma.positioning || ma.differentiation;
    const team = es.teamSummary || (org.founders?.length ? `Led by ${org.founders.map(f => `${f.name} (${f.role})`).join(", ")}` : undefined);
    const finHigh = es.financialHighlights || (financials.year1Revenue > 0 ? `Targeting ${formatCurrency(financials.year1Revenue, cur)} in Year 1 revenue with operating break-even ${financials.breakevenMonth ? `projected by Month ${financials.breakevenMonth}` : 'within 24 months'}.` : undefined);
    const fundingAsk = es.fundingHighlight || (fr.totalFundingRequired ? `Seeking ${formatCurrency(fr.totalFundingRequired, cur)} in funding for ${fr.fundingPurposeSummary || 'operational expansion and market launch'}.` : undefined);
    const cta = es.callToAction;

    if (overview) subsections.push({ title: "Business Concept & Overview", type: "text", text: overview });
    if (problem) subsections.push({ title: "The Problem & Market Opportunity", type: "text", text: problem });
    if (solution) subsections.push({ title: "Our Solution & Value Proposition", type: "text", text: solution });
    if (market) subsections.push({ title: "Target Market & Industry Dynamics", type: "text", text: market });
    if (compAdv) subsections.push({ title: "Competitive Advantage & Defensibility", type: "text", text: compAdv });
    if (team) subsections.push({ title: "Leadership & Management", type: "text", text: team });
    if (finHigh) subsections.push({ title: "Financial Trajectory & Outlook", type: "text", text: finHigh });
    if (fundingAsk) subsections.push({ title: "Capital Requirements & Next Steps", type: "text", text: fundingAsk });
    if (cta) subsections.push({ title: "Strategic Vision & Call to Action", type: "text", text: cta });

    sections.push({
      id: "executive_summary",
      number: 1,
      title: "Executive Summary",
      shortTitle: "Executive Summary",
      iconName: "FileText",
      hasContent: subsections.length > 0,
      summary: "A high-level strategic overview of the business concept, market opportunity, operations, and financial outlook.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Company Description
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const metaPairs: Array<{ key: string; value: string }> = [];
    if (cd.businessName) metaPairs.push({ key: "Company Name", value: cd.businessName });
    if (cd.legalStructure) metaPairs.push({ key: "Legal Structure", value: cd.legalStructure.replace(/_/g, " ") });
    if (cd.businessStage) metaPairs.push({ key: "Current Stage", value: cd.businessStage.replace(/_/g, " ") });
    if (cd.businessLocation) metaPairs.push({ key: "Headquarters / Location", value: cd.businessLocation });
    if (cd.geographicScope) metaPairs.push({ key: "Geographic Scope", value: cd.geographicScope });
    if (cd.ownershipDetails) metaPairs.push({ key: "Ownership Structure", value: cd.ownershipDetails });

    if (metaPairs.length > 0) {
      subsections.push({ title: "Company Profile", type: "key-value", keyValuePairs: metaPairs });
    }

    if (cd.mission || cd.vision) {
      if (cd.mission) subsections.push({ title: "Mission Statement", type: "quote", text: `"${cd.mission}"` });
      if (cd.vision) subsections.push({ title: "Vision Statement", type: "quote", text: `"${cd.vision}"` });
    }

    if (cd.businessPurpose) {
      subsections.push({ title: "Core Purpose & Founding Thesis", type: "text", text: cd.businessPurpose });
    }

    if (cd.businessActivity) {
      subsections.push({ title: "Primary Business Activity", type: "text", text: cd.businessActivity });
    }

    if (cd.objectives) {
      subsections.push({ title: "Strategic Objectives", type: "text", text: cd.objectives });
    }

    if (cd.companyHistory) {
      subsections.push({ title: "Company History & Background", type: "text", text: cd.companyHistory });
    }

    if (cd.achievementsToDate) {
      subsections.push({ title: "Key Milestones & Achievements to Date", type: "text", text: cd.achievementsToDate });
    }

    if (cd.keySuccessFactors) {
      subsections.push({ title: "Key Success Factors", type: "text", text: cd.keySuccessFactors });
    }

    sections.push({
      id: "company_description",
      number: 2,
      title: "Company Description",
      shortTitle: "Company",
      iconName: "Building2",
      hasContent: subsections.length > 0,
      summary: "Detailed overview of the company's identity, mission, structure, history, and strategic objectives.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Market Analysis
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const indPairs: Array<{ key: string; value: string }> = [];
    if (ma.industry) indPairs.push({ key: "Industry Sector", value: `${ma.industry}${ma.industrySegment ? ` · ${ma.industrySegment}` : ''}` });
    if (ma.marketValue) indPairs.push({ key: "Total Addressable Market (TAM)", value: `${ma.marketValue} ${ma.marketCurrency || ''} (${ma.marketYear || 'Current'})` });
    if (ma.growthDirection) indPairs.push({ key: "Market Growth Trajectory", value: `${ma.growthDirection.toUpperCase()}${ma.growthRate ? ` @ ${ma.growthRate}` : ''}${ma.growthPeriod ? ` over ${ma.growthPeriod}` : ''}` });
    if (ma.geographicMarket?.length) indPairs.push({ key: "Target Geographies", value: ma.geographicMarket.join(", ") });

    if (indPairs.length > 0) {
      subsections.push({ title: "Industry & Market Sizing", type: "key-value", keyValuePairs: indPairs });
    }

    if (ma.industryDescription) {
      subsections.push({ title: "Industry Dynamics & Ecosystem", type: "text", text: ma.industryDescription });
    }

    if (ma.trends && ma.trends.length > 0) {
      const rows = ma.trends.map((t) => [t.trend, t.category || "General", t.expectedImpact || "N/A"]);
      subsections.push({
        title: "Key Market Trends & Tailwinds",
        type: "table",
        tableHeaders: ["Trend Description", "Category", "Expected Impact on Business"],
        tableRows: rows,
      });
    }

    if (ma.primaryCustomer) {
      subsections.push({ title: "Target Customer Persona", type: "text", text: ma.primaryCustomer });
    }

    if (ma.segments && ma.segments.length > 0) {
      const segRows = ma.segments.map((s) => [s.name, s.type.toUpperCase(), s.description || "N/A", s.characteristics || "N/A"]);
      subsections.push({
        title: "Customer Segmentation",
        type: "table",
        tableHeaders: ["Segment Name", "Type", "Description", "Key Characteristics"],
        tableRows: segRows,
      });
    }

    if (ma.buyingBehaviour || ma.purchaseFrequency || ma.averageSpending) {
      const bPairs: Array<{ key: string; value: string }> = [];
      if (ma.buyingBehaviour) bPairs.push({ key: "Buying Behaviour", value: ma.buyingBehaviour });
      if (ma.purchaseFrequency) bPairs.push({ key: "Purchase Frequency", value: ma.purchaseFrequency });
      if (ma.averageSpending) bPairs.push({ key: "Average Customer Spend", value: ma.averageSpending });
      if (ma.decisionFactors) bPairs.push({ key: "Primary Decision Factors", value: ma.decisionFactors });
      if (ma.buyingChannels) bPairs.push({ key: "Preferred Channels", value: ma.buyingChannels });
      subsections.push({ title: "Purchasing Behaviour & Buyer Journey", type: "key-value", keyValuePairs: bPairs });
    }

    if (ma.demandEvidence && ma.demandEvidence.length > 0) {
      const demRows = ma.demandEvidence.map((d) => [d.type.replace(/_/g, " "), d.description, d.quantity || "—", d.source || "—"]);
      subsections.push({
        title: "Market Demand & Traction Evidence",
        type: "table",
        tableHeaders: ["Validation Method", "Observed Evidence", "Sample / Metric", "Source"],
        tableRows: demRows,
      });
    }

    const allCompetitors = [
      ...(ma.directCompetitors || []).map((c) => ({ ...c, typeLabel: "Direct" })),
      ...(ma.indirectCompetitors || []).map((c) => ({ ...c, typeLabel: "Indirect" })),
      ...(ma.alternatives || []).map((c) => ({ ...c, typeLabel: "Alternative" })),
    ];

    if (allCompetitors.length > 0) {
      const compRows = allCompetitors.map((c) => [
        c.name,
        c.typeLabel,
        c.strengths || "—",
        c.weaknesses || "—",
        c.pricing || "—",
      ]);
      subsections.push({
        title: "Competitive Landscape & Matrix",
        type: "table",
        tableHeaders: ["Competitor Name", "Type", "Core Strengths", "Vulnerabilities / Weaknesses", "Pricing Model"],
        tableRows: compRows,
      });
    }

    if (ma.positioning || ma.differentiation) {
      const posText = [
        ma.positioning ? `Strategic Positioning:\n${ma.positioning}` : "",
        ma.differentiation ? `Core Differentiators:\n${ma.differentiation}` : "",
        ma.reasonsCustomersChooseUs ? `Why Customers Choose Us:\n${ma.reasonsCustomersChooseUs}` : "",
      ].filter(Boolean).join("\n\n");
      subsections.push({ title: "Strategic Positioning & Competitive Moat", type: "text", text: posText });
    }

    if (ma.opportunities || ma.threats || ma.barriersToEntry) {
      const swotPairs: Array<{ key: string; value: string }> = [];
      if (ma.opportunities) swotPairs.push({ key: "Market Opportunities", value: ma.opportunities });
      if (ma.threats) swotPairs.push({ key: "External Threats", value: ma.threats });
      if (ma.barriersToEntry) swotPairs.push({ key: "Barriers to Entry", value: ma.barriersToEntry });
      subsections.push({ title: "Strategic Environmental Assessment", type: "key-value", keyValuePairs: swotPairs });
    }

    sections.push({
      id: "market_analysis",
      number: 3,
      title: "Market Analysis",
      shortTitle: "Market",
      iconName: "TrendingUp",
      hasContent: subsections.length > 0,
      summary: "In-depth research on industry size, growth vectors, customer personas, competitor dynamics, and strategic positioning.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Organization & Management
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const orgPairs: Array<{ key: string; value: string }> = [];
    if (org.ownershipType) orgPairs.push({ key: "Ownership Structure", value: org.ownershipType });
    if (org.ownershipSummary) orgPairs.push({ key: "Ownership Summary", value: org.ownershipSummary });
    if (org.orgStructureType) orgPairs.push({ key: "Organizational Model", value: org.orgStructureType });
    if (org.employeeCount) orgPairs.push({ key: "Current Headcount", value: org.employeeCount });
    if (org.departments) orgPairs.push({ key: "Departments / Functional Areas", value: org.departments });

    if (orgPairs.length > 0) {
      subsections.push({ title: "Governance & Organizational Structure", type: "key-value", keyValuePairs: orgPairs });
    }

    if (org.founders && org.founders.length > 0) {
      const fRows = org.founders.map((f) => [
        f.name,
        f.role,
        f.equity ? `${f.equity}%` : "—",
        f.relevantExperience || f.background || "—",
        f.responsibilities || "—",
      ]);
      subsections.push({
        title: "Founders & Executive Leadership",
        type: "table",
        tableHeaders: ["Name", "Title / Role", "Equity %", "Background & Track Record", "Primary Responsibilities"],
        tableRows: fRows,
      });
    }

    if (org.managementTeam && org.managementTeam.length > 0) {
      const mRows = org.managementTeam.map((m) => [
        m.name,
        m.title,
        m.relevantExperience || "—",
        m.responsibilities || "—",
      ]);
      subsections.push({
        title: "Key Management Team",
        type: "table",
        tableHeaders: ["Name", "Position", "Relevant Experience", "Key Responsibilities"],
        tableRows: mRows,
      });
    }

    if (org.advisors && org.advisors.length > 0) {
      const aRows = org.advisors.map((a) => [a.name, a.expertise || "—", a.contribution || "—"]);
      subsections.push({
        title: "Advisory Board & Mentors",
        type: "table",
        tableHeaders: ["Advisor Name", "Area of Domain Expertise", "Value Contribution to Company"],
        tableRows: aRows,
      });
    }

    if (org.skillsGaps || org.hiringPlan) {
      const hrText = [
        org.skillsGaps ? `Identified Skills Gaps:\n${org.skillsGaps}` : "",
        org.hiringPlan ? `Strategic Hiring Plan:\n${org.hiringPlan}` : "",
        org.externalSupport ? `External Agencies & Contractors:\n${org.externalSupport}` : "",
      ].filter(Boolean).join("\n\n");
      subsections.push({ title: "Talent Acquisition & Scaling Roadmap", type: "text", text: hrText });
    }

    sections.push({
      id: "organization",
      number: 4,
      title: "Organization & Management",
      shortTitle: "Organization",
      iconName: "Users",
      hasContent: subsections.length > 0,
      summary: "Leadership credentials, governance structure, key personnel, advisory board, and talent acquisition plan.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Products & Services
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];

    if (ps.overallValueProp) {
      subsections.push({ title: "Value Proposition", type: "text", text: ps.overallValueProp });
    }

    if (offerings.length > 0) {
      const pRows = offerings.map((p) => [
        p.name,
        p.type?.toUpperCase() || "PRODUCT",
        p.price ? formatCurrency(p.price, cur) : "Custom",
        p.directCosts ? formatCurrency(p.directCosts, cur) : "—",
        p.description || p.features || "—",
        p.customerValue || p.benefits || "—",
      ]);
      subsections.push({
        title: "Product & Service Portfolio",
        type: "table",
        tableHeaders: ["Offering", "Type", "Price", "Unit Cost", "Description / Features", "Customer Value & Benefits"],
        tableRows: pRows,
      });
    }

    if (ps.productMixDescription) {
      subsections.push({ title: "Product Mix & Delivery Strategy", type: "text", text: ps.productMixDescription });
    }

    if (ps.ipOwned !== null && ps.ipOwned !== undefined) {
      const ipPairs: Array<{ key: string; value: string }> = [
        { key: "Proprietary IP Owned", value: ps.ipOwned ? "Yes" : "No / In Process" },
      ];
      if (ps.ipTypes?.length) ipPairs.push({ key: "IP Categories", value: ps.ipTypes.join(", ") });
      if (ps.ipDescription) ipPairs.push({ key: "IP Protection Details", value: ps.ipDescription });
      subsections.push({ title: "Intellectual Property & Defensibility", type: "key-value", keyValuePairs: ipPairs });
    }

    if (ps.rdActivities || ps.futureOfferings) {
      const rdText = [
        ps.rdActivities ? `R&D Pipeline:\n${ps.rdActivities}` : "",
        ps.futureOfferings ? `Future Product Roadmap (${ps.futureTimeframe || 'Next 12-36 Months'}):\n${ps.futureOfferings}` : "",
      ].filter(Boolean).join("\n\n");
      subsections.push({ title: "R&D & Product Expansion Pipeline", type: "text", text: rdText });
    }

    sections.push({
      id: "products_services",
      number: 5,
      title: "Products & Services",
      shortTitle: "Products",
      iconName: "Package",
      hasContent: subsections.length > 0,
      summary: "Portfolio of offerings, pricing architecture, direct unit costs, intellectual property, and R&D pipeline.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Marketing & Sales
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const msPairs: Array<{ key: string; value: string }> = [];
    if (ms.primaryObjectives) msPairs.push({ key: "Marketing Objectives", value: ms.primaryObjectives });
    if (ms.revenueTarget) msPairs.push({ key: "Revenue Target", value: ms.revenueTarget });
    if (ms.customerTarget) msPairs.push({ key: "Customer Acquisition Target", value: ms.customerTarget });
    if (ms.overallApproach) msPairs.push({ key: "Strategic Approach", value: ms.overallApproach });
    if (ms.acquisitionCost) msPairs.push({ key: "Target CAC", value: formatCurrency(ms.acquisitionCost, cur) });

    if (msPairs.length > 0) {
      subsections.push({ title: "Marketing Strategy & Growth Targets", type: "key-value", keyValuePairs: msPairs });
    }

    if (ms.channels && ms.channels.length > 0) {
      const chRows = ms.channels.map((c) => [
        c.channel,
        c.targetAudience || "—",
        c.tactics || "—",
        c.estimatedMonthlyBudget ? formatCurrency(c.estimatedMonthlyBudget, cur) : "—",
        c.kpi || "—",
        c.priority.toUpperCase(),
      ]);
      subsections.push({
        title: "Marketing & Acquisition Channels",
        type: "table",
        tableHeaders: ["Channel", "Audience", "Core Tactics", "Monthly Budget", "Key KPI", "Priority"],
        tableRows: chRows,
      });
    }

    if (ms.salesProcess || ms.salesCycleLength || ms.salesModel) {
      const sPairs: Array<{ key: string; value: string }> = [];
      if (ms.salesModel) sPairs.push({ key: "Sales Model", value: ms.salesModel });
      if (ms.salesCycleLength) sPairs.push({ key: "Sales Cycle Length", value: ms.salesCycleLength });
      if (ms.conversionFunnel) sPairs.push({ key: "Conversion Funnel", value: ms.conversionFunnel });
      if (ms.salesProcess) sPairs.push({ key: "Sales Execution Process", value: ms.salesProcess });
      subsections.push({ title: "Sales Execution & Conversion Funnel", type: "key-value", keyValuePairs: sPairs });
    }

    if (ms.retentionStrategy || ms.repeatPurchaseTactics || ms.churnMitigation) {
      const retText = [
        ms.retentionStrategy ? `Retention Strategy:\n${ms.retentionStrategy}` : "",
        ms.repeatPurchaseTactics ? `Repeat Purchase Tactics:\n${ms.repeatPurchaseTactics}` : "",
        ms.churnMitigation ? `Churn Mitigation:\n${ms.churnMitigation}` : "",
      ].filter(Boolean).join("\n\n");
      subsections.push({ title: "Customer Retention & Lifetime Value", type: "text", text: retText });
    }

    if (ms.kpis && ms.kpis.length > 0) {
      const kpiRows = ms.kpis.map((k) => [k.metric, k.target || "—", k.frequency || "Monthly", k.tool || "—"]);
      subsections.push({
        title: "Marketing KPIs & Measurement",
        type: "table",
        tableHeaders: ["Metric", "Target", "Reporting Frequency", "Tracking Tool"],
        tableRows: kpiRows,
      });
    }

    sections.push({
      id: "marketing_sales",
      number: 6,
      title: "Marketing & Sales Strategy",
      shortTitle: "Marketing & Sales",
      iconName: "Megaphone",
      hasContent: subsections.length > 0,
      summary: "Customer acquisition channels, sales process, pricing communication, conversion metrics, and retention strategies.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Operations
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const opPairs: Array<{ key: string; value: string }> = [];
    if (ops.businessModelType) opPairs.push({ key: "Operating Model Type", value: ops.businessModelType });
    if (ops.primaryLocation) opPairs.push({ key: "Primary Facility / Location", value: ops.primaryLocation });
    if (ops.facilityDescription) opPairs.push({ key: "Facility Specifications", value: ops.facilityDescription });
    if (ops.currentCapacity) opPairs.push({ key: "Operating Capacity", value: ops.currentCapacity });
    if (ops.scalingPlan) opPairs.push({ key: "Capacity Scaling Plan", value: ops.scalingPlan });

    if (opPairs.length > 0) {
      subsections.push({ title: "Operating Model & Facilities", type: "key-value", keyValuePairs: opPairs });
    }

    if (ops.techTools && ops.techTools.length > 0) {
      const toolRows = ops.techTools.map((t) => [
        t.name,
        t.category || "—",
        t.purpose || "—",
        t.monthlyCost ? formatCurrency(t.monthlyCost, cur) : "—",
        (t.criticalityLevel || "medium").toUpperCase(),
      ]);
      subsections.push({
        title: "Technology Infrastructure & Software Stack",
        type: "table",
        tableHeaders: ["Tool / System", "Category", "Operational Purpose", "Monthly Cost", "Criticality"],
        tableRows: toolRows,
      });
    }

    if (ops.suppliers && ops.suppliers.length > 0) {
      const supRows = ops.suppliers.map((s) => [
        s.name,
        s.category || "—",
        s.leadTime || "—",
        s.isSingleSource ? "Yes (Single)" : "No (Diversified)",
        s.backupPlan || "—",
      ]);
      subsections.push({
        title: "Supply Chain & Vendor Management",
        type: "table",
        tableHeaders: ["Vendor / Supplier", "Category", "Lead Time", "Sourcing Type", "Contingency / Backup Plan"],
        tableRows: supRows,
      });
    }

    if (ops.deliveryProcess || ops.fulfilmentPartners || ops.qualityProcesses) {
      const delText = [
        ops.deliveryProcess ? `Fulfillment & Delivery:\n${ops.deliveryProcess}` : "",
        ops.qualityProcesses ? `Quality Assurance & Testing:\n${ops.qualityProcesses}` : "",
        ops.customerFeedbackProcess ? `Feedback & Continuous Improvement:\n${ops.customerFeedbackProcess}` : "",
      ].filter(Boolean).join("\n\n");
      subsections.push({ title: "Fulfillment, Logistics & Quality Assurance", type: "text", text: delText });
    }

    if (ops.licences && ops.licences.length > 0) {
      const licRows = ops.licences.map((l) => [l.name, l.issuingBody || "—", l.status || "Active", l.renewalDate || "—"]);
      subsections.push({
        title: "Licenses, Permits & Regulatory Approvals",
        type: "table",
        tableHeaders: ["License / Permit", "Issuing Agency", "Status", "Renewal Date"],
        tableRows: licRows,
      });
    }

    sections.push({
      id: "operations",
      number: 7,
      title: "Operational Plan",
      shortTitle: "Operations",
      iconName: "Settings",
      hasContent: subsections.length > 0,
      summary: "Day-to-day workflow, technology stack, vendor management, fulfillment logistics, and regulatory compliance.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Financial Plan
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];

    // Financial Overview Cards / Metrics
    const metrics: Array<{ key: string; value: string }> = [
      { key: "Year 1 Total Revenue", value: formatCurrency(financials.year1Revenue, cur) },
      { key: "Year 1 Gross Profit", value: formatCurrency(financials.year1GrossProfit, cur) },
      { key: "Year 1 Operating Expenses", value: formatCurrency(financials.year1OpEx, cur) },
      { key: "Year 1 EBITDA", value: formatCurrency(financials.year1EBITDA, cur) },
      { key: "Total Startup Capital Needed", value: formatCurrency(financials.totalStartupCosts, cur) },
      { key: "Projected Break-Even Month", value: financials.breakevenMonth ? `Month ${financials.breakevenMonth}` : "Within 24 Months" },
    ];
    subsections.push({ title: "Financial Model Summary & Key Projections", type: "key-value", keyValuePairs: metrics });

    if (fp.startupCosts && fp.startupCosts.length > 0) {
      const scRows = fp.startupCosts.map((c) => [
        c.item,
        c.category,
        c.type === "one_time" ? "One-Time" : "Ongoing Initial",
        formatCurrency(c.amount, cur),
        c.notes || "—",
      ]);
      subsections.push({
        title: "Startup Capital Requirements",
        type: "table",
        tableHeaders: ["Expense Item", "Category", "Type", "Amount", "Notes"],
        tableRows: scRows,
      });
    }

    if (fp.salesAssumptions && fp.salesAssumptions.length > 0) {
      const saRows = fp.salesAssumptions.map((a) => [
        a.offeringName,
        formatCurrency(a.price, cur),
        `${a.unitsPerMonth} units`,
        `${a.growthRateMonthly || 0}% / mo`,
        a.reasoning || "—",
      ]);
      subsections.push({
        title: "Revenue & Sales Assumptions",
        type: "table",
        tableHeaders: ["Product / Service", "Unit Price", "Starting Units/Mo", "Monthly Growth", "Underlying Thesis"],
        tableRows: saRows,
      });
    }

    // 12-Month Pro-Forma Income Statement
    const monthsLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pnlRows: string[][] = [
      ["Revenue", ...financials.months.map((m) => formatCurrency(m.revenue, cur))],
      ["Cost of Goods Sold (COGS)", ...financials.months.map((m) => formatCurrency(m.cogs, cur))],
      ["Gross Profit", ...financials.months.map((m) => formatCurrency(m.grossProfit, cur))],
      ["Operating Expenses (OpEx)", ...financials.months.map((m) => formatCurrency(m.opex, cur))],
      ["Net Operating Income (EBITDA)", ...financials.months.map((m) => formatCurrency(m.ebitda, cur))],
    ];
    subsections.push({
      title: "12-Month Pro-Forma Income Statement Forecast",
      type: "table",
      tableHeaders: ["Financial Line Item", ...monthsLabels],
      tableRows: pnlRows,
    });

    if (fp.fixedExpenses && fp.fixedExpenses.length > 0) {
      const feRows = fp.fixedExpenses.map((f) => [f.item, f.category, formatCurrency(f.monthlyAmount, cur), f.notes || "—"]);
      subsections.push({
        title: "Fixed Operating Overheads (Monthly)",
        type: "table",
        tableHeaders: ["Expense Item", "Category", "Monthly Amount", "Notes"],
        tableRows: feRows,
      });
    }

    if (fp.payrollItems && fp.payrollItems.length > 0) {
      const pyRows = fp.payrollItems.map((p) => [
        p.role,
        String(p.headcount || 1),
        formatCurrency(p.monthlySalary, cur),
        formatCurrency((p.monthlySalary || 0) * (p.headcount || 1), cur),
        `Month ${p.startMonth || 1}`,
      ]);
      subsections.push({
        title: "Personnel & Payroll Plan",
        type: "table",
        tableHeaders: ["Role / Position", "Headcount", "Salary / Person", "Monthly Total", "Start Month"],
        tableRows: pyRows,
      });
    }

    if (fp.scenarioOptimistic || fp.scenarioBase || fp.scenarioPessimistic) {
      const scPairs: Array<{ key: string; value: string }> = [];
      if (fp.scenarioBase) scPairs.push({ key: "Base Case Scenario", value: fp.scenarioBase });
      if (fp.scenarioOptimistic) scPairs.push({ key: "Optimistic Growth Scenario", value: fp.scenarioOptimistic });
      if (fp.scenarioPessimistic) scPairs.push({ key: "Downside / Pessimistic Scenario", value: fp.scenarioPessimistic });
      if (fp.scenarioAssumptions) scPairs.push({ key: "Sensitivity Assumptions", value: fp.scenarioAssumptions });
      subsections.push({ title: "Scenario & Sensitivity Analysis", type: "key-value", keyValuePairs: scPairs });
    }

    sections.push({
      id: "financial_plan",
      number: 8,
      title: "Financial Plan",
      shortTitle: "Financials",
      iconName: "Calculator",
      hasContent: subsections.length > 0,
      summary: "Comprehensive 12-month financial projections, startup costs, unit economics, cash flow, and scenario analysis.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Funding Request
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];

    if (fr.requiresFunding !== false) {
      const fundPairs: Array<{ key: string; value: string }> = [];
      if (fr.totalFundingRequired) fundPairs.push({ key: "Total Capital Required", value: formatCurrency(fr.totalFundingRequired, cur) });
      if (fr.fundingPurposeSummary) fundPairs.push({ key: "Primary Funding Objective", value: fr.fundingPurposeSummary });
      if (fr.investorReturnsExpected) fundPairs.push({ key: "Target Investor ROI", value: fr.investorReturnsExpected });
      if (fr.repaymentPlan) fundPairs.push({ key: "Repayment / Return Horizon", value: fr.repaymentPlan });
      if (fr.exitStrategy) fundPairs.push({ key: "Target Exit Strategy", value: fr.exitStrategy });

      if (fundPairs.length > 0) {
        subsections.push({ title: "Funding Overview & Terms", type: "key-value", keyValuePairs: fundPairs });
      }

      if (fr.useOfFunds && fr.useOfFunds.length > 0) {
        const uRows = fr.useOfFunds.map((u) => [
          u.category,
          u.description,
          formatCurrency(u.amount, cur),
          fr.totalFundingRequired ? `${Math.round((u.amount / fr.totalFundingRequired) * 100)}%` : "—",
        ]);
        subsections.push({
          title: "Detailed Use of Proceeds / Use of Funds",
          type: "table",
          tableHeaders: ["Category", "Expenditure Purpose", "Allocated Capital", "% of Round"],
          tableRows: uRows,
        });
      }

      if (fr.fundingSources && fr.fundingSources.length > 0) {
        const srcRows = fr.fundingSources.map((s) => [
          s.type,
          formatCurrency(s.amount, cur),
          s.equityOffered || s.interestRate || "—",
          s.status || "Planned",
          s.provider || "—",
        ]);
        subsections.push({
          title: "Capital Structure & Target Sources",
          type: "table",
          tableHeaders: ["Instrument / Source", "Amount", "Terms / Equity", "Status", "Target Provider"],
          tableRows: srcRows,
        });
      }

      if (fr.pitchSummary || fr.pitchWhyUs) {
        const pitchText = [
          fr.pitchSummary ? `Investment Thesis:\n${fr.pitchSummary}` : "",
          fr.pitchWhyUs ? `Why Invest in Our Team:\n${fr.pitchWhyUs}` : "",
        ].filter(Boolean).join("\n\n");
        subsections.push({ title: "Investor Pitch Highlights", type: "text", text: pitchText });
      }
    } else {
      subsections.push({
        title: "Self-Funded / Bootstrapped Model",
        type: "text",
        text: fr.noFundingReason || "The company is currently self-funded through operational cash flow and founder equity.",
      });
    }

    sections.push({
      id: "funding",
      number: 9,
      title: "Funding Request",
      shortTitle: "Funding",
      iconName: "DollarSign",
      hasContent: subsections.length > 0,
      summary: "Capital requirements, use of funds allocation, financing structure, and investor return expectations.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Risks & Mitigation
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];

    if (risks.length > 0) {
      const riskRows = risks.map((r) => {
        const severity = (r.likelihood || 3) * (r.impact || 3);
        const severityLabel = severity >= 15 ? "CRITICAL" : severity >= 10 ? "HIGH" : severity >= 6 ? "MEDIUM" : "LOW";
        return [
          r.risk,
          r.category.toUpperCase(),
          `${r.likelihood || 3}/5`,
          `${r.impact || 3}/5`,
          severityLabel,
          r.mitigation || "Standard operating risk management.",
          r.contingency || "—",
        ];
      });

      subsections.push({
        title: "Risk Assessment & Mitigation Matrix",
        type: "table",
        tableHeaders: ["Identified Risk", "Category", "Likelihood", "Impact", "Severity", "Proactive Mitigation Strategy", "Contingency Plan"],
        tableRows: riskRows,
      });
    }

    sections.push({
      id: "risks",
      number: 10,
      title: "Risks & Mitigation",
      shortTitle: "Risks",
      iconName: "ShieldAlert",
      hasContent: subsections.length > 0,
      summary: "Thorough risk assessment matrix evaluating market, financial, operational, and regulatory risks with contingency planning.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 11. Milestones
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];

    if (milestones.length > 0) {
      const mRows = milestones.map((m) => [
        m.title,
        m.isCompleted ? `Completed (${m.completedDate || 'Past'})` : (m.targetDate || m.targetQuarter || "Upcoming"),
        m.isCompleted ? "COMPLETED" : (m.status || "PLANNED").toUpperCase(),
        m.responsiblePerson || "Executive Team",
        m.successMeasure || m.description || "—",
      ]);

      subsections.push({
        title: "Execution Roadmap & Strategic Milestones",
        type: "table",
        tableHeaders: ["Milestone", "Target Timeline", "Status", "Owner", "Key Success Metric"],
        tableRows: mRows,
      });
    }

    sections.push({
      id: "milestones",
      number: 11,
      title: "Milestones & Execution Plan",
      shortTitle: "Milestones",
      iconName: "Flag",
      hasContent: subsections.length > 0,
      summary: "Chronological roadmap of past achievements and forward-looking operational, product, and financial milestones.",
      subsections,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 12. Appendix
  // ───────────────────────────────────────────────────────────────────────────
  {
    const subsections: CompiledSubsection[] = [];
    const allItems = [...(appendix.items || []), ...(appendix.customItems || [])];

    if (allItems.length > 0) {
      const incRows = allItems
        .filter((i) => i.checked || i.required || i.notes)
        .map((i) => [
          i.label,
          i.category,
          i.checked ? "ATTACHED" : i.required ? "REQUIRED" : "PENDING",
          i.notes || "—",
        ]);

      if (incRows.length > 0) {
        subsections.push({
          title: "Supporting Documents & Due Diligence Schedule",
          type: "table",
          tableHeaders: ["Document Item", "Category", "Status", "Reference / Filing Notes"],
          tableRows: incRows,
        });
      }
    }

    if (appendix.additionalNotes || appendix.submissionNotes) {
      const apText = [
        appendix.submissionNotes ? `Submission Instructions:\n${appendix.submissionNotes}` : "",
        appendix.additionalNotes ? `Documentation Notes:\n${appendix.additionalNotes}` : "",
        appendix.gatheringDeadline ? `Document Readiness Target: ${appendix.gatheringDeadline}` : "",
      ].filter(Boolean).join("\n\n");
      subsections.push({ title: "Document Availability & Notes", type: "text", text: apText });
    }

    sections.push({
      id: "appendix",
      number: 12,
      title: "Appendix",
      shortTitle: "Appendix",
      iconName: "Paperclip",
      hasContent: subsections.length > 0,
      summary: "Index of supporting legal filings, historical financial statements, customer validation research, and certificates.",
      subsections,
    });
  }

  return {
    planId: plan.id,
    name: plan.name || "Business Plan",
    tagline: cd.tagline || "Comprehensive Business Plan & Strategic Roadmap",
    preparedFor: cd.businessName || plan.name,
    author: org.founders?.[0]?.name || "Executive Management",
    date: new Date(plan.updatedAt || Date.now()).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    overallProgress: plan.overallProgress || 0,
    sections,
    financialSummary: {
      year1Revenue: financials.year1Revenue,
      year1GrossProfit: financials.year1GrossProfit,
      year1OpEx: financials.year1OpEx,
      year1EBITDA: financials.year1EBITDA,
      totalStartupCosts: financials.totalStartupCosts,
      breakevenMonth: financials.breakevenMonth,
      totalFundingRequired: financials.totalFundingRequired,
      currency: financials.currency,
    },
  };
}
