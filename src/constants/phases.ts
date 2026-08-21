export interface PhaseDefinition {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  documentSection: number;
  topics: TopicDefinition[];
}

export interface TopicDefinition {
  id: string;
  number: number;
  title: string;
  required: boolean;
  estimatedMinutes: number;
  hasCalculator?: boolean;
  hasResearch?: boolean;
  conditionalOn?: string;
}

export const PHASES: PhaseDefinition[] = [
  {
    id: "onboarding",
    number: 0,
    title: "Introduction",
    shortTitle: "Introduction",
    description: "Learn what a business plan is and how this walkthrough works",
    icon: "BookOpen",
    documentSection: 0,
    topics: [
      { id: "welcome", number: 1, title: "Welcome", required: true, estimatedMinutes: 3 },
      { id: "what_is_bp", number: 2, title: "What Is a Business Plan?", required: true, estimatedMinutes: 5 },
      { id: "plan_structure", number: 3, title: "Plan Structure Overview", required: true, estimatedMinutes: 4 },
      { id: "how_it_works", number: 4, title: "How This Walkthrough Works", required: true, estimatedMinutes: 3 },
    ],
  },
  {
    id: "company_description",
    number: 1,
    title: "Company Description",
    shortTitle: "Company",
    description: "Describe your business, its purpose, and where it stands today",
    icon: "Building2",
    documentSection: 2,
    topics: [
      { id: "cd_overview", number: 1, title: "Business Overview", required: true, estimatedMinutes: 5 },
      { id: "cd_name", number: 2, title: "Business Name", required: true, estimatedMinutes: 3 },
      { id: "cd_activity", number: 3, title: "Business Activity", required: true, estimatedMinutes: 5 },
      { id: "cd_purpose", number: 4, title: "Business Purpose", required: true, estimatedMinutes: 5 },
      { id: "cd_problem", number: 5, title: "Problem or Need", required: true, estimatedMinutes: 8 },
      { id: "cd_mission", number: 6, title: "Mission Statement", required: true, estimatedMinutes: 7 },
      { id: "cd_vision", number: 7, title: "Vision Statement", required: true, estimatedMinutes: 6 },
      { id: "cd_objectives", number: 8, title: "Business Objectives", required: true, estimatedMinutes: 8 },
      { id: "cd_legal", number: 9, title: "Legal Structure", required: true, estimatedMinutes: 5 },
      { id: "cd_stage", number: 10, title: "Business Stage", required: true, estimatedMinutes: 4 },
      { id: "cd_history", number: 11, title: "Company History", required: false, estimatedMinutes: 6, conditionalOn: "cd_stage" },
      { id: "cd_achievements", number: 12, title: "Achievements to Date", required: false, estimatedMinutes: 6 },
      { id: "cd_success_factors", number: 13, title: "Key Success Factors", required: true, estimatedMinutes: 8 },
      { id: "cd_review", number: 14, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "market_analysis",
    number: 2,
    title: "Market Analysis",
    shortTitle: "Market",
    description: "Understand your industry, customers, and competitive landscape",
    icon: "TrendingUp",
    documentSection: 3,
    topics: [
      { id: "ma_intro", number: 1, title: "Introduction", required: true, estimatedMinutes: 3 },
      { id: "ma_industry", number: 2, title: "Industry", required: true, estimatedMinutes: 8, hasResearch: true },
      { id: "ma_geography", number: 3, title: "Geographic Market", required: true, estimatedMinutes: 5 },
      { id: "ma_market_size", number: 4, title: "Market Size", required: true, estimatedMinutes: 12, hasCalculator: true, hasResearch: true },
      { id: "ma_market_growth", number: 5, title: "Market Growth", required: true, estimatedMinutes: 10, hasResearch: true },
      { id: "ma_trends", number: 6, title: "Market Trends", required: true, estimatedMinutes: 15, hasResearch: true },
      { id: "ma_segmentation", number: 7, title: "Market Segmentation", required: true, estimatedMinutes: 10 },
      { id: "ma_primary_customer", number: 8, title: "Primary Customer", required: true, estimatedMinutes: 12 },
      { id: "ma_customer_needs", number: 9, title: "Customer Needs", required: true, estimatedMinutes: 10 },
      { id: "ma_buying_behaviour", number: 10, title: "Buying Behaviour", required: true, estimatedMinutes: 8 },
      { id: "ma_demand_evidence", number: 11, title: "Demand Evidence", required: true, estimatedMinutes: 12 },
      { id: "ma_direct_competitors", number: 12, title: "Direct Competitors", required: true, estimatedMinutes: 15 },
      { id: "ma_indirect_competitors", number: 13, title: "Indirect Competitors", required: false, estimatedMinutes: 10 },
      { id: "ma_alternatives", number: 14, title: "Alternatives", required: false, estimatedMinutes: 8 },
      { id: "ma_competitive_comparison", number: 15, title: "Competitive Comparison", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "ma_positioning", number: 16, title: "Positioning", required: true, estimatedMinutes: 10 },
      { id: "ma_barriers", number: 17, title: "Barriers to Entry", required: true, estimatedMinutes: 8 },
      { id: "ma_opportunities", number: 18, title: "Opportunities", required: true, estimatedMinutes: 8 },
      { id: "ma_threats", number: 19, title: "Threats", required: true, estimatedMinutes: 8 },
      { id: "ma_review", number: 20, title: "Market Analysis Review", required: true, estimatedMinutes: 8 },
    ],
  },
  {
    id: "organization",
    number: 3,
    title: "Organization & Management",
    shortTitle: "Organization",
    description: "Define your team structure, roles, and capabilities",
    icon: "Users",
    documentSection: 4,
    topics: [
      { id: "org_ownership", number: 1, title: "Ownership", required: true, estimatedMinutes: 8 },
      { id: "org_founders", number: 2, title: "Founders", required: true, estimatedMinutes: 10 },
      { id: "org_structure", number: 3, title: "Organizational Structure", required: true, estimatedMinutes: 8 },
      { id: "org_management", number: 4, title: "Management Team", required: true, estimatedMinutes: 12 },
      { id: "org_employees", number: 5, title: "Current Employees", required: false, estimatedMinutes: 6 },
      { id: "org_advisors", number: 6, title: "Advisors & Board", required: false, estimatedMinutes: 6 },
      { id: "org_gaps", number: 7, title: "Skills Gaps & Hiring", required: true, estimatedMinutes: 8 },
      { id: "org_review", number: 8, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "products_services",
    number: 4,
    title: "Products & Services",
    shortTitle: "Products",
    description: "Describe what you sell, its value, and how it is delivered",
    icon: "Package",
    documentSection: 5,
    topics: [
      { id: "ps_intro", number: 1, title: "Introduction", required: true, estimatedMinutes: 3 },
      { id: "ps_offerings", number: 2, title: "Your Offerings", required: true, estimatedMinutes: 15 },
      { id: "ps_features_benefits", number: 3, title: "Features vs Benefits", required: true, estimatedMinutes: 8 },
      { id: "ps_value_proposition", number: 4, title: "Value Proposition", required: true, estimatedMinutes: 10 },
      { id: "ps_pricing", number: 5, title: "Pricing", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "ps_ip", number: 6, title: "Intellectual Property", required: false, estimatedMinutes: 5 },
      { id: "ps_future", number: 7, title: "Future Offerings", required: false, estimatedMinutes: 6 },
      { id: "ps_review", number: 8, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "marketing_sales",
    number: 5,
    title: "Marketing & Sales",
    shortTitle: "Marketing",
    description: "Define how you will reach, acquire, and retain customers",
    icon: "Megaphone",
    documentSection: 6,
    topics: [
      { id: "ms_objectives", number: 1, title: "Marketing Objectives", required: true, estimatedMinutes: 6 },
      { id: "ms_strategy", number: 2, title: "Overall Strategy", required: true, estimatedMinutes: 10 },
      { id: "ms_channels", number: 3, title: "Marketing Channels", required: true, estimatedMinutes: 12 },
      { id: "ms_acquisition", number: 4, title: "Customer Acquisition", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "ms_sales", number: 5, title: "Sales Strategy", required: true, estimatedMinutes: 10 },
      { id: "ms_budget", number: 6, title: "Marketing Budget", required: true, estimatedMinutes: 8, hasCalculator: true },
      { id: "ms_retention", number: 7, title: "Customer Retention", required: true, estimatedMinutes: 8 },
      { id: "ms_kpis", number: 8, title: "KPIs", required: true, estimatedMinutes: 6 },
      { id: "ms_review", number: 9, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "operations",
    number: 6,
    title: "Operations",
    shortTitle: "Operations",
    description: "Explain how your business runs day-to-day",
    icon: "Settings",
    documentSection: 7,
    topics: [
      { id: "op_model", number: 1, title: "Operating Model", required: true, estimatedMinutes: 8 },
      { id: "op_location", number: 2, title: "Location & Facilities", required: true, estimatedMinutes: 6 },
      { id: "op_technology", number: 3, title: "Technology", required: false, estimatedMinutes: 6 },
      { id: "op_suppliers", number: 4, title: "Suppliers", required: false, estimatedMinutes: 8 },
      { id: "op_delivery", number: 5, title: "Delivery & Fulfilment", required: true, estimatedMinutes: 8 },
      { id: "op_staffing", number: 6, title: "Staffing & Capacity", required: true, estimatedMinutes: 8 },
      { id: "op_quality", number: 7, title: "Quality Control", required: false, estimatedMinutes: 6 },
      { id: "op_legal", number: 8, title: "Licences & Compliance", required: false, estimatedMinutes: 6 },
      { id: "op_review", number: 9, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "financial_plan",
    number: 7,
    title: "Financial Plan",
    shortTitle: "Financials",
    description: "Build your financial model from the ground up",
    icon: "Calculator",
    documentSection: 8,
    topics: [
      { id: "fp_intro", number: 1, title: "Financial Concepts", required: true, estimatedMinutes: 10 },
      { id: "fp_startup_costs", number: 2, title: "Startup Costs", required: true, estimatedMinutes: 15, hasCalculator: true },
      { id: "fp_assumptions", number: 3, title: "Sales Assumptions", required: true, estimatedMinutes: 15 },
      { id: "fp_revenue", number: 4, title: "Revenue Forecast", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "fp_cogs", number: 5, title: "Cost of Sales", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "fp_expenses", number: 6, title: "Operating Expenses", required: true, estimatedMinutes: 12, hasCalculator: true },
      { id: "fp_payroll", number: 7, title: "Payroll", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "fp_pnl", number: 8, title: "Profit & Loss", required: true, estimatedMinutes: 8, hasCalculator: true },
      { id: "fp_cashflow", number: 9, title: "Cash Flow", required: true, estimatedMinutes: 12, hasCalculator: true },
      { id: "fp_breakeven", number: 10, title: "Break-Even Analysis", required: true, estimatedMinutes: 8, hasCalculator: true },
      { id: "fp_scenarios", number: 11, title: "Scenarios", required: false, estimatedMinutes: 10 },
      { id: "fp_review", number: 12, title: "Financial Review", required: true, estimatedMinutes: 8 },
    ],
  },
  {
    id: "funding",
    number: 8,
    title: "Funding Request",
    shortTitle: "Funding",
    description: "Define your funding requirements and use of funds",
    icon: "DollarSign",
    documentSection: 9,
    topics: [
      { id: "fund_intro", number: 1, title: "Funding Concepts", required: true, estimatedMinutes: 6 },
      { id: "fund_amount", number: 2, title: "Amount Required", required: true, estimatedMinutes: 8 },
      { id: "fund_use", number: 3, title: "Use of Funds", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "fund_type", number: 4, title: "Funding Type", required: true, estimatedMinutes: 8 },
      { id: "fund_repayment", number: 5, title: "Repayment / Returns", required: false, estimatedMinutes: 6 },
      { id: "fund_review", number: 6, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "risks",
    number: 9,
    title: "Risks & Mitigation",
    shortTitle: "Risks",
    description: "Identify, assess, and plan for business risks",
    icon: "ShieldAlert",
    documentSection: 10,
    topics: [
      { id: "risk_intro", number: 1, title: "About Risk Planning", required: true, estimatedMinutes: 5 },
      { id: "risk_identify", number: 2, title: "Identify Risks", required: true, estimatedMinutes: 20 },
      { id: "risk_matrix", number: 3, title: "Risk Matrix", required: true, estimatedMinutes: 10, hasCalculator: true },
      { id: "risk_review", number: 4, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "milestones",
    number: 10,
    title: "Milestones",
    shortTitle: "Milestones",
    description: "Map out what you have achieved and what comes next",
    icon: "Flag",
    documentSection: 11,
    topics: [
      { id: "ms_completed", number: 1, title: "Completed Milestones", required: false, estimatedMinutes: 8 },
      { id: "ms_future", number: 2, title: "Future Milestones", required: true, estimatedMinutes: 15 },
      { id: "ms_timeline", number: 3, title: "Timeline", required: true, estimatedMinutes: 6 },
      { id: "ms_review", number: 4, title: "Phase Review", required: true, estimatedMinutes: 5 },
    ],
  },
  {
    id: "executive_summary",
    number: 11,
    title: "Executive Summary",
    shortTitle: "Summary",
    description: "Summarise your entire plan — completed last, appears first",
    icon: "FileText",
    documentSection: 1,
    topics: [
      { id: "es_intro", number: 1, title: "About the Executive Summary", required: true, estimatedMinutes: 4 },
      { id: "es_overview", number: 2, title: "Business Overview", required: true, estimatedMinutes: 8 },
      { id: "es_opportunity", number: 3, title: "Problem & Opportunity", required: true, estimatedMinutes: 6 },
      { id: "es_market", number: 4, title: "Market Opportunity", required: true, estimatedMinutes: 6 },
      { id: "es_financials", number: 5, title: "Financial Highlights", required: true, estimatedMinutes: 8 },
      { id: "es_review", number: 6, title: "Final Review", required: true, estimatedMinutes: 10 },
    ],
  },
  {
    id: "appendix",
    number: 12,
    title: "Appendix",
    shortTitle: "Appendix",
    description: "Attach supporting documents and evidence",
    icon: "Paperclip",
    documentSection: 12,
    topics: [
      { id: "ap_intro", number: 1, title: "About the Appendix", required: true, estimatedMinutes: 3 },
      { id: "ap_uploads", number: 2, title: "Supporting Documents", required: false, estimatedMinutes: 10 },
      { id: "ap_review", number: 3, title: "Final Check", required: true, estimatedMinutes: 5 },
    ],
  },
];

export const PHASE_BY_ID: Record<string, PhaseDefinition> = Object.fromEntries(
  PHASES.map((p) => [p.id, p])
);

export const LEGAL_STRUCTURES = [
  { value: "sole_proprietorship", label: "Sole Proprietorship / Sole Trader" },
  { value: "partnership", label: "Partnership" },
  { value: "llc", label: "Limited Liability Company (LLC)" },
  { value: "ltd", label: "Private Limited Company (Ltd)" },
  { value: "corporation", label: "Corporation / C-Corp" },
  { value: "s_corp", label: "S-Corporation" },
  { value: "nonprofit", label: "Non-Profit / Charity" },
  { value: "cooperative", label: "Cooperative" },
  { value: "not_decided", label: "Not yet decided" },
];

export const BUSINESS_STAGES = [
  { value: "idea", label: "Idea Stage", description: "Not yet launched or validated" },
  { value: "pre_launch", label: "Pre-Launch", description: "Building toward launch" },
  { value: "launched", label: "Recently Launched", description: "Operating, early stage" },
  { value: "growing", label: "Growing", description: "Established and expanding" },
  { value: "established", label: "Established", description: "Mature, stable operations" },
];

export const GEOGRAPHIC_OPTIONS = [
  { value: "local", label: "Local" },
  { value: "regional", label: "Regional" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
  { value: "online", label: "Online (Location-Agnostic)" },
];

export const RISK_CATEGORIES = [
  { value: "market", label: "Market" },
  { value: "competition", label: "Competition" },
  { value: "financial", label: "Financial" },
  { value: "operations", label: "Operations" },
  { value: "legal", label: "Legal" },
  { value: "regulatory", label: "Regulatory" },
  { value: "technology", label: "Technology" },
  { value: "supplier", label: "Supplier" },
  { value: "personnel", label: "Personnel" },
  { value: "other", label: "Other" },
];
