import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlan, saveNote, deleteNote as deleteNoteDB, generateId } from "@/lib/storage";
import { BusinessPlan, Note } from "@/types/businessPlan";
import { toast } from "sonner";
import { PHASES } from "@/constants/phases";

export default function NotesPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [newContent, setNewContent] = useState("");
  const [newPhase, setNewPhase] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
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

  const notes: Note[] = plan.notes || [];

  const addNote = async () => {
    if (!newContent.trim() || !planId) return;
    setSaving(true);
    const note: Note = {
      id: generateId(),
      planId: planId,
      phase: newPhase || undefined,
      content: newContent.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveNote(note);
    setPlan((prev) =>
      prev ? { ...prev, notes: [note, ...(prev.notes || [])] } : prev
    );
    setNewContent("");
    setNewPhase("");
    setSaving(false);
    toast.success("Note saved.");
  };

  const saveEdit = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, content: editContent, updatedAt: new Date().toISOString() };
    await saveNote(updated);
    setPlan((prev) =>
      prev ? { ...prev, notes: (prev.notes || []).map((n) => n.id === id ? updated : n) } : prev
    );
    setEditId(null);
    setEditContent("");
  };

  const removeNote = async (id: string) => {
    await deleteNoteDB(id);
    setPlan((prev) =>
      prev ? { ...prev, notes: (prev.notes || []).filter((n) => n.id !== id) } : prev
    );
    toast.success("Note deleted.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-900 border-b border-navy-700">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/plan/${planId}/build`)} className="text-navy-400 hover:text-white text-sm transition-colors">← Back to plan</button>
            <span className="text-navy-600">|</span>
            <span className="text-white text-sm font-medium">Private Notes</span>
          </div>
          <span className="text-navy-300 text-xs">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold text-navy-900">Private Notes</h1>
          <p className="text-muted-foreground text-sm mt-1">{plan.name}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>📝 Private notes</strong> are for your own use only. They do not appear in your business plan document. Use them for reminders, questions, tasks, or anything you want to note as you work.
          </p>
        </div>

        {/* New note */}
        <div className="bg-white border border-border rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-navy-900 mb-4">Add a Note</h3>
          <div className="space-y-4">
            <div>
              <label className="input-label">Section (optional)</label>
              <select value={newPhase} onChange={(e) => setNewPhase(e.target.value)} className="w-full border border-input px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 bg-white">
                <option value="">General note</option>
                {PHASES.filter(p => p.id !== "onboarding").map((p) => (
                  <option key={p.id} value={p.title}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Note</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
                className="w-full border border-input px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) addNote(); }}
              />
              <p className="text-xs text-muted-foreground mt-1">Ctrl+Enter to save</p>
            </div>
            <button onClick={addNote} disabled={!newContent.trim() || saving} className="bg-navy-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-navy-800 transition-colors">
              {saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="font-semibold text-navy-900 mb-2">No notes yet</p>
            <p className="text-muted-foreground text-sm">Add notes as you work through the plan. They're private and never appear in your document.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    {note.phase && <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">{note.phase}</span>}
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(note.id); setEditContent(note.content); }} className="text-xs text-navy-500 hover:text-navy-700">Edit</button>
                    <button onClick={() => removeNote(note.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
                {editId === note.id ? (
                  <div>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} className="w-full border border-input px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none mb-3" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(note.id)} className="bg-navy-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-navy-800">Save</button>
                      <button onClick={() => setEditId(null)} className="border border-border text-navy-700 px-4 py-2 rounded-lg text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-navy-800 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
