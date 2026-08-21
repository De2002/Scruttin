import { supabase } from "@/lib/supabase";
import { BusinessPlan, ResearchItem, Note } from "@/types/businessPlan";

export function generateId(): string {
  return crypto.randomUUID();
}

// ─── Map DB row → BusinessPlan ──────────────────────────────────────────────
function rowToPlan(row: Record<string, unknown>): BusinessPlan {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastWorkedOn: row.last_worked_on as string,
    onboardingCompleted: row.onboarding_completed as boolean,
    currentPhase: (row.current_phase as string) || "company_description",
    currentTopic: (row.current_topic as string) || "cd_overview",
    overallProgress: (row.overall_progress as number) || 0,
    phaseProgress: (row.phase_progress as Record<string, number>) || {},
    topicStatus: (row.topic_status as Record<string, "not_started" | "in_progress" | "completed" | "skipped">) || {},
    companyDescription: (row.company_description as BusinessPlan["companyDescription"]) || {},
    marketAnalysis: (row.market_analysis as BusinessPlan["marketAnalysis"]) || {},
    organization: (row.organization as BusinessPlan["organization"]) || {},
    operations: (row.operations as BusinessPlan["operations"]) || {},
    productsServices: (row.products_services as BusinessPlan["productsServices"]) || {},
    marketingSales: (row.marketing_sales as BusinessPlan["marketingSales"]) || {},
    products: (row.products as BusinessPlan["products"]) || [],
    team: (row.team as BusinessPlan["team"]) || [],
    financialPlan: (row.financial_plan as BusinessPlan["financialPlan"]) || {},
    fundingRequest: (row.funding_request as BusinessPlan["fundingRequest"]) || {},
    risks: (row.risks as BusinessPlan["risks"]) || [],
    milestones: (row.milestones as BusinessPlan["milestones"]) || [],
    researchItems: [],
    notes: [],
    aiSuggestionsAccepted: (row.ai_suggestions_accepted as string[]) || [],
  };
}

// ─── Plans ───────────────────────────────────────────────────────────────────
export async function getPlansForUser(userId: string): Promise<BusinessPlan[]> {
  const { data, error } = await supabase
    .from("business_plans")
    .select("*")
    .eq("user_id", userId)
    .order("last_worked_on", { ascending: false });

  if (error) {
    console.error("getPlansForUser error:", error);
    return [];
  }
  return (data || []).map(rowToPlan);
}

export async function getPlan(id: string): Promise<BusinessPlan | null> {
  const { data: planRow, error: planError } = await supabase
    .from("business_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (planError || !planRow) {
    console.error("getPlan error:", planError);
    return null;
  }

  const plan = rowToPlan(planRow as Record<string, unknown>);

  // Load research items
  const { data: research } = await supabase
    .from("research_items")
    .select("*")
    .eq("plan_id", id)
    .order("created_at", { ascending: true });

  // Load notes
  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("plan_id", id)
    .order("created_at", { ascending: false });

  plan.researchItems = (research || []).map((r) => ({
    id: r.id,
    planId: r.plan_id,
    phase: r.phase,
    topic: r.topic,
    question: r.question,
    status: r.status,
    currentAnswer: r.current_answer,
    notes: r.notes,
    evidence: r.evidence,
    sources: r.sources || [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  plan.notes = (notes || []).map((n) => ({
    id: n.id,
    planId: n.plan_id,
    phase: n.phase,
    topic: n.topic,
    content: n.content,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));

  return plan;
}

export async function savePlan(plan: BusinessPlan): Promise<void> {
  const payload = {
    id: plan.id,
    user_id: plan.userId,
    name: plan.name,
    last_worked_on: new Date().toISOString(),
    onboarding_completed: plan.onboardingCompleted,
    current_phase: plan.currentPhase,
    current_topic: plan.currentTopic,
    overall_progress: plan.overallProgress,
    phase_progress: plan.phaseProgress,
    topic_status: plan.topicStatus,
    company_description: plan.companyDescription || {},
    market_analysis: plan.marketAnalysis || {},
    organization: (plan as any).organization || {},
    operations: (plan as any).operations || {},
    products_services: (plan as any).productsServices || {},
    marketing_sales: (plan as any).marketingSales || {},
    products: plan.products || [],
    team: plan.team || [],
    financial_plan: plan.financialPlan || {},
    funding_request: (plan as any).fundingRequest || {},
    risks: plan.risks || [],
    milestones: plan.milestones || [],
    ai_suggestions_accepted: plan.aiSuggestionsAccepted || [],
  };

  const { error } = await supabase
    .from("business_plans")
    .upsert(payload, { onConflict: "id" });

  if (error) console.error("savePlan error:", error);
}

export async function createNewPlan(
  userId: string,
  name: string
): Promise<BusinessPlan> {
  const now = new Date().toISOString();
  const plan: BusinessPlan = {
    id: generateId(),
    userId,
    name,
    createdAt: now,
    updatedAt: now,
    lastWorkedOn: now,
    onboardingCompleted: false,
    currentPhase: "onboarding",
    currentTopic: "welcome",
    overallProgress: 0,
    phaseProgress: {},
    topicStatus: {},
    companyDescription: {},
    marketAnalysis: {},
    organization: {},
    marketingSales: undefined,
    products: [],
    team: [],
    financialPlan: {},
    risks: [],
    milestones: [],
    researchItems: [],
    notes: [],
    aiSuggestionsAccepted: [],
  };

  await savePlan(plan);
  return plan;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("business_plans").delete().eq("id", id);
  if (error) console.error("deletePlan error:", error);
}

// ─── Research Items ──────────────────────────────────────────────────────────
export async function saveResearchItem(item: ResearchItem): Promise<void> {
  const { error } = await supabase.from("research_items").upsert(
    {
      id: item.id,
      plan_id: item.planId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      phase: item.phase,
      topic: item.topic,
      question: item.question,
      status: item.status,
      current_answer: item.currentAnswer,
      notes: item.notes,
      evidence: item.evidence,
      sources: item.sources || [],
    },
    { onConflict: "id" }
  );
  if (error) console.error("saveResearchItem error:", error);
}

export async function deleteResearchItem(id: string): Promise<void> {
  const { error } = await supabase.from("research_items").delete().eq("id", id);
  if (error) console.error("deleteResearchItem error:", error);
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export async function saveNote(note: Note): Promise<void> {
  const { error } = await supabase.from("notes").upsert(
    {
      id: note.id,
      plan_id: note.planId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      phase: note.phase,
      topic: note.topic,
      content: note.content,
    },
    { onConflict: "id" }
  );
  if (error) console.error("saveNote error:", error);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) console.error("deleteNote error:", error);
}
