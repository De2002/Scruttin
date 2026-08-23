export type CompletionStatus = "not_started" | "in_progress" | "completed" | "skipped";
export type ResearchStatus = "known" | "estimating" | "needs_research" | "not_applicable";

export interface SourceRecord {
  id: string;
  title: string;
  publisher?: string;
  author?: string;
  url?: string;
  publicationDate?: string;
  dateAccessed?: string;
  sourceType: "website" | "report" | "book" | "interview" | "survey" | "other";
  notes?: string;
}

export interface ResearchItem {
  id: string;
  planId: string;
  phase: string;
  topic: string;
  question: string;
  status: "pending" | "in_progress" | "completed";
  currentAnswer?: string;
  notes?: string;
  evidence?: string;
  sources?: SourceRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  planId: string;
  phase?: string;
  topic?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketTrend {
  id: string;
  trend: string;
  category: string;
  evidence?: string;
  source?: string;
  expectedImpact?: string;
}

export interface Competitor {
  id: string;
  name: string;
  type: "direct" | "indirect" | "alternative";
  description?: string;
  strengths?: string;
  weaknesses?: string;
  targetMarket?: string;
  pricing?: string;
  url?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  type: "b2c" | "b2b";
  description?: string;
  size?: string;
  characteristics?: string;
}

export interface DemandEvidence {
  id: string;
  type: "interviews" | "surveys" | "existing_sales" | "pre_orders" | "search_demand" | "reviews" | "industry_research" | "observations" | "other";
  description: string;
  quantity?: string;
  source?: string;
}

export interface RiskItem {
  id: string;
  category: string;
  risk: string;
  cause?: string;
  likelihood: number; // 1–5
  impact: number; // 1–5
  consequence?: string;
  mitigation?: string;
  contingency?: string;
  responsiblePerson?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  // Completed milestone fields
  completedDate?: string;
  achievementNote?: string;
  // Future milestone fields
  targetDate?: string;
  targetQuarter?: string;
  successMeasure?: string;
  dependencies?: string;
  responsiblePerson?: string;
  estimatedCost?: number;
  category?: string;
  status: "planned" | "in_progress" | "completed" | "at_risk" | "cancelled";
  isCompleted: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  equity?: number;
  background?: string;
  responsibilities?: string;
}

export interface Product {
  id: string;
  name: string;
  type: "product" | "service" | "digital" | "subscription";
  description?: string;
  targetCustomer?: string;
  needAddressed?: string;
  features?: string;
  benefits?: string;
  customerValue?: string;
  price?: number;
  pricingModel?: string;
  directCosts?: number;
  deliveryMethod?: string;
  developmentStage?: string;
  suppliers?: string;
}

export interface CompanyDescription {
  businessName?: string;
  tagline?: string;
  businessActivity?: string;
  businessPurpose?: string;
  problemOrNeed?: string;
  existingAlternatives?: string;
  mission?: string;
  vision?: string;
  objectives?: string;
  legalStructure?: string;
  ownershipDetails?: string;
  businessLocation?: string;
  geographicScope?: string;
  businessStage?: "idea" | "pre_launch" | "launched" | "growing" | "established";
  companyHistory?: string;
  achievementsToDate?: string;
  keySuccessFactors?: string;
}

export interface MarketAnalysis {
  industry?: string;
  industrySegment?: string;
  industryDescription?: string;
  industryParticipants?: string;
  geographicMarket?: string[];
  marketValue?: string;
  marketCurrency?: string;
  marketYear?: string;
  marketMethodology?: string;
  marketSources?: SourceRecord[];
  growthDirection?: "growing" | "stable" | "declining";
  growthRate?: string;
  growthPeriod?: string;
  growthReason?: string;
  growthEvidence?: string;
  trends?: MarketTrend[];
  segments?: CustomerSegment[];
  primaryCustomer?: string;
  customerNeeds?: Array<{ id: string; need: string; existingSolution?: string; dissatisfaction?: string; importance?: string }>;
  buyingBehaviour?: string;
  purchaseFrequency?: string;
  averageSpending?: string;
  decisionFactors?: string;
  buyingChannels?: string;
  demandEvidence?: DemandEvidence[];
  directCompetitors?: Competitor[];
  indirectCompetitors?: Competitor[];
  alternatives?: Competitor[];
  positioning?: string;
  differentiation?: string;
  reasonsCustomersChooseUs?: string;
  reasonsCustomersChooseCompetitors?: string;
  barriersToEntry?: string;
  opportunities?: string;
  threats?: string;
}

export interface StartupCostItem {
  id: string;
  category: string;
  item: string;
  type: "one_time" | "ongoing";
  amount: number;
  notes?: string;
}

export interface SalesAssumption {
  id: string;
  offeringId?: string;
  offeringName: string;
  price: number;
  unitsPerMonth: number;
  growthRateMonthly: number;
  seasonalityNotes?: string;
  reasoning?: string;
}

export interface FixedExpense {
  id: string;
  category: string;
  item: string;
  monthlyAmount: number;
  notes?: string;
}

export interface VariableExpense {
  id: string;
  item: string;
  percentOfRevenue: number;
  notes?: string;
}

export interface PayrollItem {
  id: string;
  role: string;
  headcount: number;
  monthlySalary: number;
  startMonth: number;
  notes?: string;
}

export interface FinancialPlan {
  startupCosts?: StartupCostItem[];
  startupFundingSource?: string;
  salesAssumptions?: SalesAssumption[];
  revenueNotes?: string;
  fixedExpenses?: FixedExpense[];
  variableExpenses?: VariableExpense[];
  expenseNotes?: string;
  payrollItems?: PayrollItem[];
  payrollNotes?: string;
  scenarioOptimistic?: string;
  scenarioBase?: string;
  scenarioPessimistic?: string;
  scenarioAssumptions?: string;
  accountingMethod?: "cash" | "accrual";
  fiscalYearStart?: string;
  currency?: string;
  financialNotes?: string;
  // Legacy fields
  fundingRequired?: boolean;
  fundingAmount?: number;
  fundingType?: string;
  fundingPurpose?: string;
  useOfFunds?: Array<{ id: string; category: string; amount: number; description?: string }>;
}

export interface OrgFounder {
  id: string;
  name: string;
  role: string;
  equity?: string;
  background?: string;
  relevantExperience?: string;
  responsibilities?: string;
}

export interface OrgManagementMember {
  id: string;
  name: string;
  title: string;
  responsibilities?: string;
  relevantExperience?: string;
  keySkills?: string;
}

export interface OrgAdvisor {
  id: string;
  name: string;
  expertise?: string;
  contribution?: string;
}

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  reportsTo?: string;
}

export interface MarketingSalesData {
  primaryObjectives?: string;
  revenueTarget?: string;
  customerTarget?: string;
  timeframe?: string;
  overallApproach?: string;
  strategyTypes?: string[];
  positioningNote?: string;
  channels?: Array<{
    id: string;
    channel: string;
    description?: string;
    targetAudience?: string;
    tactics?: string;
    frequency?: string;
    estimatedMonthlyBudget?: number;
    kpi?: string;
    priority: "high" | "medium" | "low";
    enabled: boolean;
  }>;
  acquisitionCost?: number;
  acquisitionChannelBreakdown?: string;
  conversionFunnel?: string;
  leadSources?: string;
  acquisitionGoal?: string;
  salesProcess?: string;
  salesCycleLength?: string;
  salesModel?: string;
  distributionChannels?: string;
  distributionDescription?: string;
  pricingCommunication?: string;
  budgetItems?: Array<{ id: string; category: string; item: string; monthlyAmount: number; notes?: string }>;
  totalMonthlyBudget?: number;
  budgetNotes?: string;
  retentionStrategy?: string;
  repeatPurchaseTactics?: string;
  loyaltyProgram?: boolean;
  loyaltyDescription?: string;
  npsStrategy?: string;
  churnMitigation?: string;
  kpis?: Array<{ id: string; metric: string; target?: string; frequency?: string; tool?: string }>;
  reportingCadence?: string;
}

export interface ProductsServicesData {
  offerings?: Product[];
  productMixDescription?: string;
  overallValueProp?: string;
  ipOwned?: boolean | null;
  ipDescription?: string;
  ipTypes?: string[];
  rdActivities?: string;
  futureOfferings?: string;
  futureTimeframe?: string;
}

export interface OperationsTechTool {
  id: string;
  name: string;
  category?: string;
  purpose?: string;
  monthlyCost?: number;
  criticalityLevel?: "low" | "medium" | "high" | "critical";
}

export interface OperationsSupplier {
  id: string;
  name: string;
  category?: string;
  description?: string;
  leadTime?: string;
  isSingleSource?: boolean;
  backupPlan?: string;
  contractStatus?: string;
}

export interface OperationsLicence {
  id: string;
  name: string;
  issuingBody?: string;
  status?: string;
  renewalDate?: string;
  notes?: string;
}

export interface OperationsData {
  businessModelType?: string;
  operatingModelDescription?: string;
  valueDeliveryMethod?: string;
  locationType?: string;
  primaryLocation?: string;
  additionalLocations?: string;
  facilityDescription?: string;
  facilityOwnership?: string;
  techTools?: OperationsTechTool[];
  techInfrastructure?: string;
  techDependencies?: string;
  suppliers?: OperationsSupplier[];
  supplierStrategy?: string;
  supplyChainRisks?: string;
  deliveryProcess?: string;
  deliveryTimeline?: string;
  deliveryChannels?: string;
  fulfilmentPartners?: string;
  returnPolicy?: string;
  currentCapacity?: string;
  capacityLimits?: string;
  scalingPlan?: string;
  peakPeriods?: string;
  staffingModel?: string;
  qualityStandards?: string;
  qualityProcesses?: string;
  customerFeedbackProcess?: string;
  errorHandling?: string;
  licences?: OperationsLicence[];
  regulatoryRequirements?: string;
  insuranceTypes?: string[];
  dataPrivacyNotes?: string;
  complianceNotes?: string;
}

export interface UseOfFundsItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  notes?: string;
}

export interface FundingSource {
  id: string;
  type: string;
  amount: number;
  provider?: string;
  interestRate?: string;
  term?: string;
  equityOffered?: string;
  repaymentTerms?: string;
  status?: string;
  notes?: string;
}

export interface FundingRequestData {
  requiresFunding?: boolean | null;
  noFundingReason?: string;
  totalFundingRequired?: number;
  fundingPurposeSummary?: string;
  useOfFunds?: UseOfFundsItem[];
  useOfFundsNotes?: string;
  fundingSources?: FundingSource[];
  fundingStrategyNotes?: string;
  repaymentPlan?: string;
  investorReturnsExpected?: string;
  exitStrategy?: string;
  pitchSummary?: string;
  pitchProblem?: string;
  pitchSolution?: string;
  pitchMarketSize?: string;
  pitchBusinessModel?: string;
  pitchTraction?: string;
  pitchAsk?: string;
  pitchUseOfFunds?: string;
  pitchWhyUs?: string;
}

export interface Organization {
  ownershipSummary?: string;
  ownershipType?: string;
  founders?: OrgFounder[];
  orgStructureType?: string;
  orgStructureDescription?: string;
  orgNodes?: OrgNode[];
  managementTeam?: OrgManagementMember[];
  employeeCount?: string;
  departments?: string;
  employmentTypes?: string[];
  advisors?: OrgAdvisor[];
  boardExists?: boolean;
  boardDescription?: string;
  skillsGaps?: string;
  hiringPlan?: string;
  externalSupport?: string;
}

export interface BusinessPlan {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastWorkedOn: string;
  onboardingCompleted: boolean;
  currentPhase: string;
  currentTopic: string;
  overallProgress: number;
  phaseProgress: Record<string, number>;
  topicStatus: Record<string, CompletionStatus>;
  companyDescription?: CompanyDescription;
  marketAnalysis?: MarketAnalysis;
  organization?: Organization;
  operations?: OperationsData;
  productsServices?: ProductsServicesData;
  marketingSales?: MarketingSalesData;
  products?: Product[];
  team?: TeamMember[];
  financialPlan?: FinancialPlan;
  fundingRequest?: FundingRequestData;
  risks?: RiskItem[];
  milestones?: Milestone[];
  executiveSummary?: {
    businessOverview?: string;
    overrideOverview?: boolean;
    problemStatement?: string;
    overrideProblem?: boolean;
    opportunityStatement?: string;
    solutionSummary?: string;
    overrideSolution?: boolean;
    marketOpportunity?: string;
    overrideMarket?: boolean;
    competitiveAdvantage?: string;
    teamSummary?: string;
    overrideTeam?: boolean;
    financialHighlights?: string;
    overrideFinancials?: boolean;
    fundingHighlight?: string;
    overrideFunding?: boolean;
    callToAction?: string;
  };
  appendix?: AppendixData;
  researchItems?: ResearchItem[];
  notes?: Note[];
  aiSuggestionsAccepted?: string[];
}

export interface AppendixItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
  notes: string;
  required: boolean;
}

export interface AppendixData {
  items?: AppendixItem[];
  customItems?: AppendixItem[];
  additionalNotes?: string;
  gatheringDeadline?: string;
  submissionNotes?: string;
}
