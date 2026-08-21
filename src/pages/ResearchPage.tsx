import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlan, saveResearchItem, deleteResearchItem, generateId } from "@/lib/storage";
import { BusinessPlan, ResearchItem } from "@/types/businessPlan";
import { toast } from "sonner";

export default function ResearchPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ phase: "", question: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (planId) {
      getPlan(planId).then((loaded) => {
        if (loaded) setPlan(loaded);
      });
    }
  }, [planId]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items: ResearchItem[] = plan.researchItems || [];
  const pending = items.filter((i) => i.status !== "completed");
  const done = items.filter((i) => i.status === "completed");

  const addItem = async () => {
    if (!newItem.question.trim() || !planId) return;
    setSaving(true);
    const item: ResearchItem = {
      id: generateId(),
      planId: planId,
      phase: newItem.phase,
      topic: "",
      question: newItem.question,
      status: "pending",
      notes: newItem.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveResearchItem(item);
    setPlan((prev) =>
      prev ? { ...prev, researchItems: [...(prev.researchItems || []), item] } : prev
    );
    setNewItem({ phase: "", question: "", notes: "" });
    setShowAdd(false);
    setSaving(false);
    toast.success("Research item added.");
  };

  const markDone = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, status: "completed" as const, updatedAt: new Date().toISOString() };
    await saveResearchItem(updated);
    setPlan((prev) =>
      prev
        ? { ...prev, researchItems: (prev.researchItems || []).map((i) => i.id === id ? updated : i) }
        : prev
    );
  };

  const removeItem = async (id: string) => {
    await deleteResearchItem(id);
    setPlan((prev) =>
      prev ? { ...prev, researchItems: (prev.researchItems || []).filter((i) => i.id !== id) } : prev
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-900 border-b border-navy-700">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/plan/${planId}/build`)} className="text-navy-400 hover:text-white text-sm transition-colors">← Back to plan</button>
            <span className="text-navy-600">|</span>
            <span className="text-white text-sm font-medium">Research Tracker</span>
          </div>
          <span className="text-navy-300 text-xs">{pending.length} pending</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-navy-900">Research Tracker</h1>
            <p className="text-muted-foreground text-sm mt-1">{plan.name}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-navy-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors">
            + Add Item
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">About the Research Tracker</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            Throughout the walkthrough, any answer you mark as "I need to research this" is saved here. You can also add items manually. When you have found the information, mark it complete and return to the relevant section.
          </p>
        </div>

        {showAdd && (
          <div className="bg-white border border-border rounded-xl p-6 mb-6 animate-fade-in">
            <h3 className="font-semibold text-navy-900 mb-4">New Research Item</h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">Section / Phase</label>
                <input value={newItem.phase} onChange={(e) => setNewItem({ ...newItem, phase: e.target.value })} placeholder="e.g. Market Analysis" className="w-full border border-input px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700" />
              </div>
              <div>
                <label className="input-label">What needs to be researched? *</label>
                <textarea value={newItem.question} onChange={(e) => setNewItem({ ...newItem, question: e.target.value })} placeholder="Describe what you need to find out..." rows={3} className="w-full border border-input px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none" />
              </div>
              <div>
                <label className="input-label">Notes</label>
                <input value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })} placeholder="Where will you look? What kind of source do you need?" className="w-full border border-input px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 border border-border text-navy-700 py-2.5 rounded-lg text-sm font-medium hover:bg-muted">Cancel</button>
                <button onClick={addItem} disabled={!newItem.question.trim() || saving} className="flex-1 bg-navy-900 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-navy-800">
                  {saving ? "Adding..." : "Add to Tracker"}
                </button>
              </div>
            </div>
          </div>
        )}

        {pending.length === 0 && done.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔎</div>
            <p className="font-semibold text-navy-900 mb-2">No research items yet</p>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">As you work through the walkthrough, items marked "needs research" will appear here.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-navy-900 text-xs font-bold">{pending.length}</span>
                  Pending Research
                </h2>
                <div className="space-y-3">
                  {pending.map((item) => (
                    <ResearchCard key={item.id} item={item} onDone={() => markDone(item.id)} onRemove={() => removeItem(item.id)} />
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <h2 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-sage-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  Completed
                </h2>
                <div className="space-y-3">
                  {done.map((item) => (
                    <ResearchCard key={item.id} item={item} completed onRemove={() => removeItem(item.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ResearchCard({ item, completed, onDone, onRemove }: { item: ResearchItem; completed?: boolean; onDone?: () => void; onRemove: () => void }) {
  return (
    <div className={`bg-white border rounded-xl p-5 transition-all ${completed ? "border-sage-200 opacity-70" : "border-border hover:border-navy-300"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {item.phase && <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">{item.phase}</span>}
          <p className={`text-sm font-medium mt-1 ${completed ? "line-through text-muted-foreground" : "text-navy-900"}`}>{item.question}</p>
          {item.notes && <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>}
          <p className="text-xs text-muted-foreground mt-2">Added {new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!completed && onDone && (
            <button onClick={onDone} className="bg-sage-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-sage-500 transition-colors whitespace-nowrap">Mark Done</button>
          )}
          <button onClick={onRemove} className="text-xs text-red-400 hover:text-red-600 transition-colors px-2">×</button>
        </div>
      </div>
    </div>
  );
}
