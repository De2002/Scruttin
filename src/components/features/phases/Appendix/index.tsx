import React, { useState, useEffect } from "react";
import { BusinessPlan } from "@/types/businessPlan";
import { generateId } from "@/lib/storage";

interface AppendixItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
  notes: string;
  required: boolean;
}

const DEFAULT_CHECKLIST: Omit<AppendixItem, "id">[] = [
  { category: "Team", label: "Founder / Owner CV or Résumé", checked: false, notes: "", required: true },
  { category: "Team", label: "Key Management Team CVs", checked: false, notes: "", required: false },
  { category: "Team", label: "Professional References", checked: false, notes: "", required: false },
  { category: "Financial", label: "Historical Financial Statements (last 2–3 years)", checked: false, notes: "", required: false },
  { category: "Financial", label: "Bank Statements (recent 3 months)", checked: false, notes: "", required: false },
  { category: "Financial", label: "Tax Returns", checked: false, notes: "", required: false },
  { category: "Financial", label: "Asset Valuation / Appraisals", checked: false, notes: "", required: false },
  { category: "Market Research", label: "Industry / Market Research Reports", checked: false, notes: "", required: false },
  { category: "Market Research", label: "Customer Survey Results", checked: false, notes: "", required: false },
  { category: "Market Research", label: "Competitor Analysis Data", checked: false, notes: "", required: false },
  { category: "Legal & Compliance", label: "Business Registration Certificate", checked: false, notes: "", required: true },
  { category: "Legal & Compliance", label: "Operating Licences / Permits", checked: false, notes: "", required: false },
  { category: "Legal & Compliance", label: "Trademark / Patent Certificates", checked: false, notes: "", required: false },
  { category: "Legal & Compliance", label: "Partnership or Shareholder Agreement", checked: false, notes: "", required: false },
  { category: "Legal & Compliance", label: "Insurance Certificates", checked: false, notes: "", required: false },
  { category: "Contracts & Agreements", label: "Key Customer Contracts or Letters of Intent", checked: false, notes: "", required: false },
  { category: "Contracts & Agreements", label: "Supplier Agreements", checked: false, notes: "", required: false },
  { category: "Contracts & Agreements", label: "Lease Agreements", checked: false, notes: "", required: false },
  { category: "Contracts & Agreements", label: "Franchise or Licensing Agreements", checked: false, notes: "", required: false },
  { category: "Visual & Brand", label: "Product / Service Photos", checked: false, notes: "", required: false },
  { category: "Visual & Brand", label: "Facility / Location Photos", checked: false, notes: "", required: false },
  { category: "Visual & Brand", label: "Brand Guidelines / Logo Files", checked: false, notes: "", required: false },
  { category: "Other", label: "Awards or Recognitions", checked: false, notes: "", required: false },
  { category: "Other", label: "Press Coverage / Media Mentions", checked: false, notes: "", required: false },
  { category: "Other", label: "Letters of Support or Endorsement", checked: false, notes: "", required: false },
];

type AppendixData = {
  items?: AppendixItem[];
  customItems?: AppendixItem[];
  additionalNotes?: string;
  gatheringDeadline?: string;
  submissionNotes?: string;
};

interface AppendixPhaseProps {
  plan: BusinessPlan;
  currentTopic: string;
  onUpdatePlan: (updates: Partial<BusinessPlan>) => void;
  onUpdateTopicStatus: (topicId: string, status: "not_started" | "in_progress" | "completed" | "skipped") => void;
  onNavigate: (phase: string, topic: string) => void;
  onOpenAI?: () => void;
}

function initItems(saved?: AppendixItem[]): AppendixItem[] {
  if (saved && saved.length > 0) return saved;
  return DEFAULT_CHECKLIST.map((item) => ({ ...item, id: generateId() }));
}

export default function AppendixPhase({
  plan,
  currentTopic,
  onUpdatePlan,
  onUpdateTopicStatus,
  onNavigate,
}: AppendixPhaseProps) {
  const saved = (plan as any).appendix as AppendixData | undefined;

  const [items, setItems] = useState<AppendixItem[]>(() => initItems(saved?.items));
  const [customItems, setCustomItems] = useState<AppendixItem[]>(saved?.customItems || []);
  const [additionalNotes, setAdditionalNotes] = useState(saved?.additionalNotes || "");
  const [gatheringDeadline, setGatheringDeadline] = useState(saved?.gatheringDeadline || "");
  const [submissionNotes, setSubmissionNotes] = useState(saved?.submissionNotes || "");
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("Other");

  const persist = (
    newItems?: AppendixItem[],
    newCustom?: AppendixItem[],
    newNotes?: string,
    newDeadline?: string,
    newSubmissionNotes?: string
  ) => {
    const data: AppendixData = {
      items: newItems ?? items,
      customItems: newCustom ?? customItems,
      additionalNotes: newNotes ?? additionalNotes,
      gatheringDeadline: newDeadline ?? gatheringDeadline,
      submissionNotes: newSubmissionNotes ?? submissionNotes,
    };
    onUpdatePlan({ appendix: data } as any);
  };

  const toggleItem = (id: string) => {
    const updated = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    setItems(updated);
    persist(updated);
  };

  const toggleCustom = (id: string) => {
    const updated = customItems.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
    setCustomItems(updated);
    persist(undefined, updated);
  };

  const updateNote = (id: string, note: string, isCustom = false) => {
    if (isCustom) {
      const updated = customItems.map((i) => (i.id === id ? { ...i, notes: note } : i));
      setCustomItems(updated);
      persist(undefined, updated);
    } else {
      const updated = items.map((i) => (i.id === id ? { ...i, notes: note } : i));
      setItems(updated);
      persist(updated);
    }
  };

  const addCustomItem = () => {
    if (!newCustomLabel.trim()) return;
    const newItem: AppendixItem = {
      id: generateId(),
      category: newCustomCategory,
      label: newCustomLabel.trim(),
      checked: false,
      notes: "",
      required: false,
    };
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    persist(undefined, updated);
    setNewCustomLabel("");
  };

  const removeCustomItem = (id: string) => {
    const updated = customItems.filter((i) => i.id !== id);
    setCustomItems(updated);
    persist(undefined, updated);
  };

  // Group items by category
  const allItems = [...items, ...customItems];
  const categories = Array.from(new Set(allItems.map((i) => i.category)));

  const checkedCount = allItems.filter((i) => i.checked).length;
  const totalCount = allItems.length;
  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  if (currentTopic === "ap_intro") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">12</div>
            <span className="text-xs font-bold uppercase tracking-widest text-navy-400">Appendix</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-3">About the Appendix</h1>
          <p className="text-navy-600 text-lg leading-relaxed">
            The appendix is the evidence locker of your business plan — a curated collection of supporting documents that back up your claims and give readers confidence in your business.
          </p>
        </div>

        {/* What it is */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="font-semibold text-navy-900 mb-3 text-lg">What Belongs in the Appendix?</h2>
          <p className="text-navy-700 text-sm leading-relaxed mb-4">
            The appendix contains documents that would interrupt the flow of the main plan if included inline. Think of it as your "show your work" section — everything that substantiates what you've written.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: "👤", label: "CVs & Résumés", desc: "Founders, key management, advisors" },
              { icon: "📊", label: "Financial Documents", desc: "Statements, bank records, tax returns" },
              { icon: "📈", label: "Market Research", desc: "Reports, surveys, competitive data" },
              { icon: "📜", label: "Legal Documents", desc: "Licences, registrations, permits" },
              { icon: "🤝", label: "Contracts", desc: "Customer LOIs, supplier agreements, leases" },
              { icon: "📸", label: "Visual Evidence", desc: "Product photos, facility images, brand assets" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-white rounded-xl p-3">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-medium text-navy-900 text-sm">{item.label}</p>
                  <p className="text-navy-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key principles */}
        <div className="space-y-3">
          <h2 className="font-semibold text-navy-900 text-lg">Key Principles</h2>
          {[
            {
              title: "Reference, don't repeat",
              desc: "Every document in the appendix should be referenced somewhere in the main plan with a note like 'See Appendix A: CV.' Don't include things you never mention.",
            },
            {
              title: "Keep it organised",
              desc: "Label each item clearly (Appendix A, B, C… or by category). Reviewers should be able to find any document within seconds.",
            },
            {
              title: "Include only what matters",
              desc: "More is not always better. A 300-page appendix is a red flag. Include what strengthens your case — not everything you own.",
            },
            {
              title: "Ensure it's current",
              desc: "Outdated financial statements or expired permits undermine credibility. Aim for documents less than 12 months old wherever possible.",
            },
          ].map((p) => (
            <div key={p.title} className="flex gap-4 bg-white border border-navy-100 rounded-xl p-4">
              <div className="w-1.5 shrink-0 bg-amber-400 rounded-full mt-1" />
              <div>
                <p className="font-semibold text-navy-900 text-sm">{p.title}</p>
                <p className="text-navy-600 text-sm mt-1">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Written last */}
        <div className="bg-navy-900 rounded-2xl p-6 text-white">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Good to know</p>
          <p className="text-white/80 text-sm leading-relaxed">
            The appendix is typically assembled last, once all other sections are finalised. Your task now is to identify <strong className="text-white">which documents you already have</strong>, which you need to obtain, and to note where each will sit when you submit your plan.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              onUpdateTopicStatus("ap_intro", "completed");
              onNavigate("appendix", "ap_uploads");
            }}
            className="bg-navy-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-navy-800 transition-colors"
          >
            Start Building Your Appendix →
          </button>
        </div>
      </div>
    );
  }

  if (currentTopic === "ap_uploads") {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">12</div>
            <span className="text-xs font-bold uppercase tracking-widest text-navy-400">Appendix</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-3">Supporting Documents</h1>
          <p className="text-navy-600 leading-relaxed">
            Work through the checklist below. Tick each document you have in hand, add a note about where it's stored or what's needed, and add any custom items specific to your business.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white border border-navy-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-navy-800">Collection Progress</span>
            <span className="text-sm text-navy-500">{checkedCount} / {totalCount} documents</span>
          </div>
          <div className="w-full bg-navy-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-navy-400 mt-2">{pct}% gathered — not all documents are mandatory; include what applies to your business.</p>
        </div>

        {/* Deadline */}
        <div className="bg-white border border-navy-100 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="text-sm font-semibold text-navy-800 shrink-0">Target gathering date:</label>
          <input
            type="date"
            value={gatheringDeadline}
            onChange={(e) => {
              setGatheringDeadline(e.target.value);
              persist(undefined, undefined, undefined, e.target.value);
            }}
            className="border border-navy-200 rounded-lg px-3 py-1.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="text-xs text-navy-400">Set a date to keep yourself on track.</p>
        </div>

        {/* Document checklist by category */}
        {categories.map((cat) => {
          const catItems = allItems.filter((i) => i.category === cat);
          const catChecked = catItems.filter((i) => i.checked).length;

          return (
            <div key={cat} className="bg-white border border-navy-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-navy-50 border-b border-navy-100">
                <h3 className="font-semibold text-navy-900 text-sm">{cat}</h3>
                <span className="text-xs text-navy-500">{catChecked}/{catItems.length}</span>
              </div>
              <div className="divide-y divide-navy-50">
                {catItems.map((item) => {
                  const isCustom = customItems.some((c) => c.id === item.id);
                  return (
                    <div key={item.id} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => isCustom ? toggleCustom(item.id) : toggleItem(item.id)}
                          className={`mt-0.5 w-5 h-5 rounded shrink-0 border-2 flex items-center justify-center transition-colors ${
                            item.checked
                              ? "bg-amber-400 border-amber-400"
                              : "border-navy-300 hover:border-amber-400"
                          }`}
                        >
                          {item.checked && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${item.checked ? "line-through text-navy-400" : "text-navy-900"}`}>
                              {item.label}
                            </span>
                            {item.required && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Recommended</span>
                            )}
                            {isCustom && (
                              <span className="text-xs bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded">Custom</span>
                            )}
                          </div>

                          {/* Notes toggle */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <button
                              onClick={() => setExpandedNotes(expandedNotes === item.id ? null : item.id)}
                              className="text-xs text-navy-400 hover:text-amber-500 transition-colors"
                            >
                              {item.notes ? "✎ Edit note" : "+ Add note"}
                            </button>
                            {item.notes && <span className="text-xs text-navy-400 truncate max-w-[200px]">{item.notes}</span>}
                          </div>

                          {expandedNotes === item.id && (
                            <textarea
                              value={item.notes}
                              onChange={(e) => updateNote(item.id, e.target.value, isCustom)}
                              placeholder="Where is this stored? What's needed? Any context…"
                              className="mt-2 w-full border border-navy-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                              rows={2}
                            />
                          )}
                        </div>

                        {isCustom && (
                          <button
                            onClick={() => removeCustomItem(item.id)}
                            className="shrink-0 text-red-400 hover:text-red-600 transition-colors ml-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add custom item */}
        <div className="bg-white border border-dashed border-navy-300 rounded-2xl p-5">
          <h3 className="font-semibold text-navy-900 text-sm mb-3">Add a Custom Document</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={newCustomCategory}
              onChange={(e) => setNewCustomCategory(e.target.value)}
              className="border border-navy-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {["Team", "Financial", "Market Research", "Legal & Compliance", "Contracts & Agreements", "Visual & Brand", "Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={newCustomLabel}
              onChange={(e) => setNewCustomLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
              placeholder="Document name…"
              className="flex-1 border border-navy-200 rounded-lg px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={addCustomItem}
              disabled={!newCustomLabel.trim()}
              className="bg-navy-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        {/* Additional notes */}
        <div>
          <label className="block text-sm font-semibold text-navy-800 mb-2">Additional Appendix Notes</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => {
              setAdditionalNotes(e.target.value);
              persist(undefined, undefined, e.target.value);
            }}
            placeholder="Any notes about how you'll organise, label, or present the appendix in your final document…"
            className="w-full border border-navy-200 rounded-xl px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={3}
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => onNavigate("appendix", "ap_intro")}
            className="text-navy-500 hover:text-navy-700 text-sm font-medium"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              onUpdateTopicStatus("ap_uploads", "completed");
              onNavigate("appendix", "ap_review");
            }}
            className="bg-navy-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-navy-800 transition-colors"
          >
            Final Check →
          </button>
        </div>
      </div>
    );
  }

  if (currentTopic === "ap_review") {
    const checkedRequired = allItems.filter((i) => i.required && i.checked).length;
    const totalRequired = allItems.filter((i) => i.required).length;
    const missingRequired = allItems.filter((i) => i.required && !i.checked);
    const unchecked = allItems.filter((i) => !i.checked);

    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">12</div>
            <span className="text-xs font-bold uppercase tracking-widest text-navy-400">Appendix</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-900 mb-3">Final Check</h1>
          <p className="text-navy-600 leading-relaxed">
            Before you finalise your business plan, make sure you've gathered the physical supporting documents you'll need when submitting.
          </p>
        </div>

        {/* Summary card */}
        <div className="bg-white border border-navy-100 rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">{pct}%</p>
              <p className="text-xs text-navy-500 mt-1">Collected</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-900">{checkedCount}</p>
              <p className="text-xs text-navy-500 mt-1">Documents ready</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-500">{unchecked.length}</p>
              <p className="text-xs text-navy-500 mt-1">Still needed</p>
            </div>
          </div>
          <div className="w-full bg-navy-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Recommended docs status */}
        {totalRequired > 0 && (
          <div className={`rounded-2xl p-5 border ${checkedRequired === totalRequired ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{checkedRequired === totalRequired ? "✅" : "⚠️"}</span>
              <div>
                <p className="font-semibold text-navy-900 text-sm">
                  {checkedRequired === totalRequired
                    ? "All recommended documents are ready"
                    : `${totalRequired - checkedRequired} recommended document${totalRequired - checkedRequired !== 1 ? "s" : ""} still needed`}
                </p>
                {missingRequired.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {missingRequired.map((d) => (
                      <li key={d.id} className="text-xs text-navy-600 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {d.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gathering deadline */}
        {gatheringDeadline && (
          <div className="bg-navy-50 rounded-xl p-4 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm text-navy-700">
              Your target gathering date: <strong>{new Date(gatheringDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>
            </p>
          </div>
        )}

        {/* Submission notes */}
        <div>
          <label className="block text-sm font-semibold text-navy-800 mb-2">Submission Notes (optional)</label>
          <textarea
            value={submissionNotes}
            onChange={(e) => {
              setSubmissionNotes(e.target.value);
              persist(undefined, undefined, undefined, undefined, e.target.value);
            }}
            placeholder="Where is this plan being submitted? Any specific formatting or document requirements from the recipient?"
            className="w-full border border-navy-200 rounded-xl px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            rows={3}
          />
        </div>

        {/* Final checklist reminders */}
        <div className="bg-navy-900 rounded-2xl p-6 text-white space-y-3">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Before You Submit</p>
          {[
            "Print or scan all physical documents",
            "Label each item clearly (Appendix A, B, C…)",
            "Cross-reference items in the relevant plan sections",
            "Ensure all financial documents are within 12 months",
            "Remove any confidential information not required",
            "Check that all documents are signed and dated",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border border-white/30 flex items-center justify-center text-white/60">
                <span className="text-xs">{i + 1}</span>
              </div>
              <span className="text-white/80 text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* Completion */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">Appendix Complete</h2>
          <p className="text-navy-600 text-sm max-w-md mx-auto">
            You've completed all 12 phases of your business plan. Your plan is now structurally complete. Head to the Document page to review your full plan and export it.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                onUpdateTopicStatus("ap_review", "completed");
                persist();
              }}
              className="bg-amber-400 text-navy-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-300 transition-colors"
            >
              Mark Complete ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
