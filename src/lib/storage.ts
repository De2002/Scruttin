import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { BusinessPlan, ResearchItem, Note } from "@/types/businessPlan";

const LOCAL_PLANS_KEY = "scruttin_plans";
const LOCAL_RESEARCH_KEY = "scruttin_research";
const LOCAL_NOTES_KEY = "scruttin_notes";

export function generateId(): string {
  return crypto.randomUUID();
}

function getLocalPlans(): BusinessPlan[] {
  try {
    const raw = localStorage.getItem(LOCAL_PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPlans(plans: BusinessPlan[]): void {
  try {
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans));
  } catch {
    // ignore
  }
}

function getLocalResearch(): ResearchItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_RESEARCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalResearch(items: ResearchItem[]): void {
  try {
    localStorage.setItem(LOCAL_RESEARCH_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function getLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotes(notes: Note[]): void {
  try {
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
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
    executiveSummary: (row.executive_summary as BusinessPlan["executiveSummary"]) || {},
    appendix: (row.appendix as BusinessPlan["appendix"]) || undefined,
    researchItems: [],
    notes: [],
    aiSuggestionsAccepted: (row.ai_suggestions_accepted as string[]) || [],
  };
}

// ─── Plans ───────────────────────────────────────────────────────────────────
export async function getPlansForUser(userId: string): Promise<BusinessPlan[]> {
  const localPlans = getLocalPlans().filter((p) => p.userId === userId || !userId);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("business_plans")
        .select("*")
        .eq("user_id", userId)
        .order("last_worked_on", { ascending: false });

      if (!error && data && data.length > 0) {
        const remotePlans = data.map(rowToPlan);
        saveLocalPlans(remotePlans);
        return remotePlans;
      }
    } catch (e) {
      console.warn("Could not fetch remote plans, using local storage:", e);
    }
  }

  return localPlans;
}

export async function getPlan(id: string): Promise<BusinessPlan | null> {
  const localPlans = getLocalPlans();
  const localPlan = localPlans.find((p) => p.id === id) || null;

  if (isSupabaseConfigured) {
    try {
      const { data: planRow, error: planError } = await supabase
        .from("business_plans")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!planError && planRow) {
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
    } catch (e) {
      console.warn("Could not fetch remote plan, using local storage:", e);
    }
  }

  if (localPlan) {
    localPlan.researchItems = getLocalResearch().filter((r) => r.planId === id);
    localPlan.notes = getLocalNotes().filter((n) => n.planId === id);
  }

  return localPlan;
}

export async function savePlan(plan: BusinessPlan): Promise<void> {
  // Update local storage
  const localPlans = getLocalPlans();
  const index = localPlans.findIndex((p) => p.id === plan.id);
  if (index >= 0) {
    localPlans[index] = plan;
  } else {
    localPlans.unshift(plan);
  }
  saveLocalPlans(localPlans);

  if (isSupabaseConfigured) {
    try {
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
        organization: plan.organization || {},
        operations: plan.operations || {},
        products_services: plan.productsServices || {},
        marketing_sales: plan.marketingSales || {},
        products: plan.products || [],
        team: plan.team || [],
        financial_plan: plan.financialPlan || {},
        funding_request: plan.fundingRequest || {},
        risks: plan.risks || [],
        milestones: plan.milestones || [],
        executive_summary: plan.executiveSummary || {},
        appendix: plan.appendix || null,
        ai_suggestions_accepted: plan.aiSuggestionsAccepted || [],
      };

      await supabase.from("business_plans").upsert(payload, { onConflict: "id" });
    } catch (error) {
      console.warn("savePlan remote error:", error);
    }
  }
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
  const localPlans = getLocalPlans().filter((p) => p.id !== id);
  saveLocalPlans(localPlans);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("business_plans").delete().eq("id", id);
    } catch (error) {
      console.warn("deletePlan remote error:", error);
    }
  }
}

// ─── Research Items ──────────────────────────────────────────────────────────
export async function saveResearchItem(item: ResearchItem): Promise<void> {
  const items = getLocalResearch();
  const idx = items.findIndex((r) => r.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  saveLocalResearch(items);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("research_items").upsert(
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
    } catch (error) {
      console.warn("saveResearchItem remote error:", error);
    }
  }
}

export async function deleteResearchItem(id: string): Promise<void> {
  const items = getLocalResearch().filter((r) => r.id !== id);
  saveLocalResearch(items);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("research_items").delete().eq("id", id);
    } catch (error) {
      console.warn("deleteResearchItem remote error:", error);
    }
  }
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export async function saveNote(note: Note): Promise<void> {
  const notes = getLocalNotes();
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) {
    notes[idx] = note;
  } else {
    notes.unshift(note);
  }
  saveLocalNotes(notes);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("notes").upsert(
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
    } catch (error) {
      console.warn("saveNote remote error:", error);
    }
  }
}

export async function deleteNote(id: string): Promise<void> {
  const notes = getLocalNotes().filter((n) => n.id !== id);
  saveLocalNotes(notes);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("notes").delete().eq("id", id);
    } catch (error) {
      console.warn("deleteNote remote error:", error);
    }
  }
}
