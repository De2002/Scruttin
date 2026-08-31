import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlan, savePlan } from "@/lib/storage";
import { BusinessPlan } from "@/types/businessPlan";
import { compileBusinessPlan, CompiledBusinessPlan, CompiledSection, formatCurrency } from "@/lib/planCompiler";
import { exportBusinessPlanToPdf, exportBusinessPlanToDocx, FontTheme } from "@/lib/pdfExport";
import { DocumentSettingsModal, DocumentSettings } from "@/components/DocumentSettingsModal";
import {
  FileText,
  Download,
  Printer,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Building2,
  TrendingUp,
  Users,
  Package,
  Megaphone,
  Settings,
  Sliders,
  Calculator,
  DollarSign,
  ShieldAlert,
  Flag,
  Paperclip,
  ArrowLeft,
  ChevronRight,
  Eye,
  Layers,
  Sparkles,
  Image as ImageIcon,
  Type,
  Check,
  BookOpen,
  ArrowUp,
  ArrowUpRight,
  ListChecks,
  Compass,
  Clock,
  Timer,
  BarChart3,
  Flame,
  ChevronDown,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Word Count & Reading Time Utilities ─────────────────────────────────────
export function countWords(text?: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export interface SectionDepthMetrics {
  wordCount: number;
  readingTimeMinutes: number;
  readingTimeText: string;
  depthLabel: "In-Depth" | "Detailed" | "Concise" | "Draft";
  depthColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
}

export function calculateSectionMetrics(section: CompiledSection): SectionDepthMetrics {
  let words = 0;
  if (section.summary) {
    words += countWords(section.summary);
  }
  for (const sub of section.subsections) {
    if (sub.title) words += countWords(sub.title);
    if (sub.text) words += countWords(sub.text);
    if (sub.items) {
      for (const item of sub.items) words += countWords(item);
    }
    if (sub.keyValuePairs) {
      for (const kv of sub.keyValuePairs) {
        words += countWords(kv.key) + countWords(kv.value);
      }
    }
    if (sub.tableHeaders) {
      for (const h of sub.tableHeaders) words += countWords(h);
    }
    if (sub.tableRows) {
      for (const row of sub.tableRows) {
        for (const cell of row) words += countWords(cell);
      }
    }
  }

  // Reading time based on standard business reading speed of 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.round(words / 200));
  const readingTimeText =
    words === 0 ? "0 min" : words < 120 ? "< 1 min" : `${readingTimeMinutes} min`;

  let depthLabel: "In-Depth" | "Detailed" | "Concise" | "Draft" = "Draft";
  let depthColor = {
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  };

  if (!section.hasContent || words === 0) {
    depthLabel = "Draft";
    depthColor = {
      bg: "bg-slate-50",
      text: "text-slate-400",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-500 border-slate-200",
    };
  } else if (words >= 450) {
    depthLabel = "In-Depth";
    depthColor = {
      bg: "bg-purple-50/60",
      text: "text-purple-700",
      border: "border-purple-200",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
    };
  } else if (words >= 220) {
    depthLabel = "Detailed";
    depthColor = {
      bg: "bg-blue-50/60",
      text: "text-blue-700",
      border: "border-blue-200",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    };
  } else {
    depthLabel = "Concise";
    depthColor = {
      bg: "bg-amber-50/60",
      text: "text-amber-700",
      border: "border-amber-200",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    wordCount: words,
    readingTimeMinutes,
    readingTimeText,
    depthLabel,
    depthColor,
  };
}

export default function DocumentPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "export">("preview");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBrief, setIsExportingBrief] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    }
    if (isExportDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportDropdownOpen]);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<DocumentSettings>({
    fontTheme: "modern",
    logoDataUrl: null,
    logoPlacement: "cover-and-header",
    includeCover: true,
    includeToc: true,
  });

  useEffect(() => {
    if (planId) {
      getPlan(planId).then((loaded) => {
        if (loaded) {
          setPlan(loaded);
          // Hydrate settings from plan if existing
          setSettings((prev) => ({
            ...prev,
            fontTheme: loaded.companyDescription?.fontTheme || "modern",
            logoDataUrl: loaded.companyDescription?.logoUrl || null,
          }));
        }
      });
    }
  }, [planId]);

  const compiled: CompiledBusinessPlan | null = useMemo(() => {
    if (!plan) return null;
    return compileBusinessPlan(plan);
  }, [plan]);

  // Compute Word Count & Reading Time for entire plan and per-section
  const planMetrics = useMemo(() => {
    if (!compiled) return null;
    let totalWords = 0;
    const sectionMetrics: Record<string, SectionDepthMetrics> = {};

    compiled.sections.forEach((sec) => {
      const metric = calculateSectionMetrics(sec);
      sectionMetrics[sec.id] = metric;
      totalWords += metric.wordCount;
    });

    const totalMinutes = Math.max(1, Math.round(totalWords / 200));
    const totalReadingTimeText =
      totalWords === 0 ? "0 min read" : totalWords < 120 ? "< 1 min read" : `~${totalMinutes} min read`;
    const avgWordsPerSection = Math.round(totalWords / (compiled.sections.length || 1));

    return {
      totalWords,
      totalMinutes,
      totalReadingTimeText,
      avgWordsPerSection,
      sectionMetrics,
    };
  }, [compiled]);

  if (!plan || !compiled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Compiling business plan document...</p>
        </div>
      </div>
    );
  }

  const completedSectionsCount = compiled.sections.filter((s) => s.hasContent).length;
  const totalSectionsCount = compiled.sections.length;

  const scrollToSection = (target: string | number) => {
    if (selectedSectionId !== "all") {
      setSelectedSectionId("all");
    }
    setTimeout(() => {
      const el = document.getElementById(
        target === "toc" ? "section-toc" : `section-${target}`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  const handleUpdateSettings = (newPartial: Partial<DocumentSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleSaveToPlan = async (logoDataUrl: string | null) => {
    if (!plan) return;
    const updated: BusinessPlan = {
      ...plan,
      companyDescription: {
        ...plan.companyDescription,
        logoUrl: logoDataUrl || undefined,
        fontTheme: settings.fontTheme,
      },
    };
    setPlan(updated);
    await savePlan(updated);
  };

  const handleExportPdf = async (briefOnly = false) => {
    try {
      if (briefOnly) setIsExportingBrief(true);
      else setIsExportingPdf(true);

      toast.info("Generating styled PDF document with embedded theme and logo...");
      await exportBusinessPlanToPdf(plan, {
        includeCover: settings.includeCover,
        includeToc: settings.includeToc,
        isExecutiveBriefOnly: briefOnly,
        fontTheme: settings.fontTheme,
        logoDataUrl: settings.logoDataUrl,
        logoPlacement: settings.logoPlacement,
      });
      toast.success(briefOnly ? "Executive Brief PDF downloaded!" : "Business Plan PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
      setIsExportingBrief(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      toast.info("Generating editable Word document...");
      await exportBusinessPlanToDocx(plan);
      toast.success("Word document (.docx) exported successfully!");
    } catch (err) {
      console.error("DOCX generation failed:", err);
      toast.error("Failed to export Word document.");
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Compute theme font styles for preview
  const getThemeFontClass = (theme: FontTheme) => {
    switch (theme) {
      case "classic":
        return "font-serif";
      case "technical":
        return "font-mono";
      case "minimal":
      case "modern":
      default:
        return "font-sans";
    }
  };

  const visibleSections = selectedSectionId === "all"
    ? compiled.sections
    : compiled.sections.filter((s) => s.id === selectedSectionId);

  return (
    <div className={`min-h-screen bg-slate-100/70 text-slate-900 print:bg-white print:p-0 ${getThemeFontClass(settings.fontTheme)}`}>
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .document-paper { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/plan/${planId}/build`)}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-sm font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Builder</span>
            </button>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white font-semibold text-sm truncate max-w-xs">{compiled.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                {compiled.overallProgress}% Complete
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Tabs */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 border border-slate-700">
              <button
                onClick={() => setActiveTab("preview")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "preview"
                    ? "bg-amber-500 text-slate-950 font-semibold shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document View</span>
              </button>
              <button
                onClick={() => setActiveTab("export")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "export"
                    ? "bg-amber-500 text-slate-950 font-semibold shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Hub</span>
              </button>
            </div>

            {/* Document Settings Trigger Button */}
            <button
              id="document-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-2 rounded-lg font-medium text-xs transition-colors shadow-xs"
              title="Configure Font Theme and Company Logo"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Theme & Logo</span>
            </button>

            {/* Split Download as PDF Button with Format Dropdown */}
            <div ref={dropdownRef} className="relative inline-flex rounded-lg shadow-sm">
              <button
                id="download-pdf-primary-btn"
                onClick={() => handleExportPdf(false)}
                disabled={isExportingPdf || isExportingBrief}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 sm:px-4 py-2 rounded-l-lg font-bold text-xs tracking-wide transition-all shadow-xs disabled:opacity-50"
                title="Download complete business plan as PDF"
              >
                {isExportingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download as PDF</span>
              </button>

              <button
                id="download-pdf-dropdown-trigger"
                onClick={() => setIsExportDropdownOpen((prev) => !prev)}
                disabled={isExportingPdf || isExportingBrief}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 px-2 py-2 rounded-r-lg border-l border-amber-400/60 transition-colors disabled:opacity-50 flex items-center justify-center"
                title="Export options & formats"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Format Selection Dropdown Menu */}
              {isExportDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs"
                >
                  <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export & Download Options
                  </div>

                  <button
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handleExportPdf(false);
                    }}
                    disabled={isExportingPdf}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-start gap-2.5 transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Full Business Plan (PDF)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono">12 Ch</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Complete document with TOC, financial models, and branding.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handleExportPdf(true);
                    }}
                    disabled={isExportingBrief}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-start gap-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Executive Brief (PDF)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-mono">2 Pgs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Concise 2-page snapshot of model, problem & KPIs.
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handleExportDocx();
                    }}
                    disabled={isExportingDocx}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Download Word (.docx)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      window.print();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Print Document</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-amber-300 hover:text-amber-200 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Configure PDF Styling & Logo...</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "preview" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div className="no-print lg:col-span-3 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm sticky top-24">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan Structure</h3>
                  <span className="text-xs font-semibold text-slate-700">
                    {completedSectionsCount}/{totalSectionsCount} Sections
                  </span>
                </div>

                <div className="space-y-1 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      setSelectedSectionId("all");
                      scrollToSection("toc");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      selectedSectionId === "all"
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Full Business Plan</span>
                    </span>
                    <span className="text-[10px] opacity-75">12 sections</span>
                  </button>

                  {/* Quick Jump to Table of Contents */}
                  <button
                    onClick={() => {
                      if (selectedSectionId !== "all") setSelectedSectionId("all");
                      scrollToSection("toc");
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>Table of Contents</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">Index</span>
                  </button>

                  <div className="pt-1.5 pb-1 px-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chapters</span>
                  </div>

                  {compiled.sections.map((section) => {
                    const secMetric = planMetrics?.sectionMetrics[section.id];
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          scrollToSection(section.number);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                          selectedSectionId === section.id
                            ? "bg-slate-900 text-white font-semibold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate pr-1">
                          <span className={`w-4 text-center font-mono font-bold text-[11px] ${selectedSectionId === section.id ? "text-amber-400" : "text-amber-600"}`}>
                            {section.number}
                          </span>
                          <span className="truncate">{section.title}</span>
                        </span>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {secMetric && secMetric.wordCount > 0 && (
                            <span
                              className={`text-[10px] font-mono ${
                                selectedSectionId === section.id
                                  ? "text-slate-300"
                                  : "text-slate-400"
                              }`}
                            >
                              {secMetric.readingTimeText}
                            </span>
                          )}
                          {section.hasContent ? (
                            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${selectedSectionId === section.id ? "text-emerald-400" : "text-emerald-600"}`} />
                          ) : (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedSectionId === section.id ? "bg-slate-500" : "bg-slate-300"}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Theme & Settings Banner inside Sidebar */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full inline-flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 text-amber-900 text-xs font-medium transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>Theme & Logo</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                      {settings.fontTheme}
                    </span>
                  </button>

                  <button
                    onClick={() => handleExportPdf(false)}
                    disabled={isExportingPdf}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Version</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div className="lg:col-span-9 space-y-8">
              {/* Executive Document Paper Container */}
              <div className="document-paper bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Document Cover Header */}
                <div className="bg-slate-950 text-white p-8 sm:p-12 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-amber-500" />
                  
                  {/* Embedded Logo in Preview */}
                  {settings.logoDataUrl && (
                    <div className="mb-6 inline-block bg-white p-2.5 rounded-xl shadow-md border border-slate-700">
                      <img
                        src={settings.logoDataUrl}
                        alt="Company Logo"
                        className="h-14 max-w-[180px] object-contain"
                      />
                    </div>
                  )}

                  <div className="max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800/90 text-amber-400 text-xs font-bold tracking-widest uppercase border border-slate-700">
                      Official Business Plan
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {compiled.name}
                    </h1>
                    {compiled.tagline && (
                      <p className="text-slate-300 text-base sm:text-lg italic">
                        "{compiled.tagline}"
                      </p>
                    )}

                    <div className="pt-6 mt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs text-slate-400">
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold text-[10px]">Prepared For</span>
                        <span className="text-slate-200 font-medium">{compiled.preparedFor}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold text-[10px]">Principal / Lead</span>
                        <span className="text-slate-200 font-medium">{compiled.author}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold text-[10px]">Publication Date</span>
                        <span className="text-slate-200 font-medium">{compiled.date}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold text-[10px]">Word Count & Read Time</span>
                        <span className="text-amber-300 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400 inline flex-shrink-0" />
                          <span>{planMetrics?.totalWords.toLocaleString() || 0} words • {planMetrics?.totalReadingTimeText}</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold text-[10px]">Completion</span>
                        <span className="text-emerald-400 font-semibold">{compiled.overallProgress}% Documented</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Financial Metric Ribbon */}
                {compiled.financialSummary.year1Revenue > 0 && (
                  <div className="bg-slate-900 text-white px-8 py-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Year 1 Revenue Target</span>
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(compiled.financialSummary.year1Revenue, compiled.financialSummary.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Year 1 EBITDA</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {formatCurrency(compiled.financialSummary.year1EBITDA, compiled.financialSummary.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Break-Even Point</span>
                      <span className="text-lg font-bold text-amber-400">
                        {compiled.financialSummary.breakevenMonth ? `Month ${compiled.financialSummary.breakevenMonth}` : "Within 24 mo"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Funding Requirement</span>
                      <span className="text-lg font-bold text-white">
                        {compiled.financialSummary.totalFundingRequired > 0
                          ? formatCurrency(compiled.financialSummary.totalFundingRequired, compiled.financialSummary.currency)
                          : "Self-Funded"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive Dynamic Table of Contents Section */}
                {settings.includeToc && selectedSectionId === "all" && (
                  <div id="section-toc" className="scroll-mt-24 p-8 sm:p-12 bg-slate-50/70 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Document Structure</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Table of Contents & Chapter Index</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Click any chapter below to quickly jump to that section in the document or in the exported PDF.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs">
                          <ListChecks className="w-3.5 h-3.5 text-amber-600" />
                          <span>{completedSectionsCount} of {totalSectionsCount} Complete</span>
                        </span>

                        <button
                          onClick={() => handleExportPdf(false)}
                          disabled={isExportingPdf}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors disabled:opacity-50"
                          title="Download complete business plan as PDF"
                        >
                          {isExportingPdf ? (
                            <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Chapter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {compiled.sections.map((section) => {
                        const secMetric = planMetrics?.sectionMetrics[section.id];
                        return (
                          <div
                            key={section.id}
                            onClick={() => scrollToSection(section.number)}
                            className="group relative text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded bg-slate-900 group-hover:bg-amber-500 text-white group-hover:text-slate-950 text-xs font-mono font-bold flex items-center justify-center transition-colors">
                                    {String(section.number).padStart(2, "0")}
                                  </span>
                                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                    {section.title}
                                  </h3>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {secMetric && secMetric.wordCount > 0 && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${secMetric.depthColor.badge}`}>
                                      {secMetric.depthLabel}
                                    </span>
                                  )}
                                  {section.hasContent ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Ready
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                      Draft
                                    </span>
                                  )}
                                </div>
                              </div>

                              {section.summary && (
                                <p className="text-xs text-slate-500 line-clamp-2 pl-8">
                                  {section.summary}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 pl-8">
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                                <span>{section.subsections.length} topic{section.subsections.length !== 1 ? "s" : ""}</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span>{secMetric?.wordCount.toLocaleString() || 0} words</span>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{secMetric?.readingTimeText}</span>
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform text-[11px]">
                                <span>Jump</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Document Body Sections */}
                <div className="p-8 sm:p-12 space-y-12 divide-y divide-slate-100">
                  {visibleSections.map((section) => {
                    const secMetric = planMetrics?.sectionMetrics[section.id];
                    return (
                      <div
                        key={section.id}
                        id={`section-${section.number}`}
                        className={`scroll-mt-24 ${section.number > 1 ? "pt-10" : ""}`}
                      >
                        {/* Section Title Banner */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-500 text-slate-950 text-xs font-mono font-bold">
                                  {section.number}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                  {section.title}
                                </h2>
                              </div>
                              {section.summary && (
                                <p className="text-xs text-slate-500 italic max-w-2xl pl-8.5">
                                  {section.summary}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Quick return to TOC */}
                              <button
                                onClick={() => scrollToSection("toc")}
                                title="Return to Table of Contents"
                                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors"
                              >
                                <ArrowUp className="w-3 h-3 text-slate-500" />
                                <span>TOC</span>
                              </button>

                              {section.hasContent ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Compiled
                                </span>
                              ) : (
                                <button
                                  onClick={() => navigate(`/plan/${planId}/build`)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-100 transition-colors"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Incomplete (Fill)
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Section Word Count & Reading Time Indicator Bar */}
                          {secMetric && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pl-8.5 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Word Count */}
                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    <strong>{secMetric.wordCount.toLocaleString()}</strong> words
                                  </span>
                                </div>

                                <span className="text-slate-300">•</span>

                                {/* Reading Time */}
                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>
                                    Est. <strong>{secMetric.readingTimeText}</strong> read
                                  </span>
                                </div>

                                <span className="text-slate-300">•</span>

                                {/* Depth Pill */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-500 font-medium">Content Depth:</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${secMetric.depthColor.badge}`}>
                                    {secMetric.depthLabel}
                                  </span>
                                </div>
                              </div>

                              {/* Relative Depth Visual Indicator */}
                              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span>Coverage depth</span>
                                <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      secMetric.wordCount >= 450
                                        ? "bg-purple-500"
                                        : secMetric.wordCount >= 220
                                        ? "bg-blue-500"
                                        : secMetric.wordCount > 0
                                        ? "bg-amber-500"
                                        : "bg-slate-300"
                                    }`}
                                    style={{
                                      width: `${Math.min(100, Math.max(10, Math.round((secMetric.wordCount / 500) * 100)))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      {/* Section Content */}
                      {section.hasContent ? (
                        <div className="space-y-8 pl-0 sm:pl-2">
                          {section.subsections.map((sub, sIdx) => (
                            <div key={sIdx} className="space-y-3">
                              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                <span>{sub.title}</span>
                              </h3>

                              {sub.type === "quote" && sub.text && (
                                <blockquote className="p-4 rounded-xl bg-amber-50/60 border-l-4 border-amber-500 text-slate-800 text-sm italic font-serif leading-relaxed">
                                  "{sub.text.replace(/^"|"$/g, "")}"
                                </blockquote>
                              )}

                              {sub.type === "key-value" && sub.keyValuePairs && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {sub.keyValuePairs.map((kv, kvIdx) => (
                                    <div
                                      key={kvIdx}
                                      className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col justify-between"
                                    >
                                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        {kv.key}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-900 mt-1 break-words">
                                        {kv.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {sub.type === "table" && sub.tableHeaders && sub.tableRows && (
                                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[10px]">
                                      <tr>
                                        {sub.tableHeaders.map((h, hIdx) => (
                                          <th key={hIdx} className="px-4 py-3">
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {sub.tableRows.map((row, rIdx) => (
                                        <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-slate-50/50" : ""}>
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-4 py-2.5 text-slate-700 font-medium">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {sub.type === "narrative" && sub.text && (
                                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
                                  {sub.text}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Bottom Section Jump Link */}
                          <div className="pt-4 flex justify-end">
                            <button
                              onClick={() => scrollToSection("toc")}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-600 transition-colors"
                            >
                              <ArrowUp className="w-3 h-3" />
                              <span>Back to Table of Contents</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                          <p className="text-xs text-slate-500 font-medium">
                            Section pending completion in business plan builder.
                          </p>
                          <button
                            onClick={() => navigate(`/plan/${planId}/build`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                          >
                            <span>Go to builder phase</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Floating Action Pill Bar for Easy PDF Export & Navigation */}
            <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 text-xs">
              <span className="font-semibold text-slate-200 hidden sm:inline truncate max-w-[160px]">
                {compiled.name}
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-amber-400 font-mono font-medium hidden md:inline">
                {planMetrics?.totalWords.toLocaleString()} words
              </span>
              <span className="hidden md:inline text-slate-600">•</span>

              <button
                onClick={() => scrollToSection("toc")}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors"
                title="Jump to Table of Contents"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>TOC</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors"
                title="Theme & Logo Settings"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              <button
                id="floating-download-pdf-btn"
                onClick={() => handleExportPdf(false)}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-full transition-all shadow-sm disabled:opacity-50"
                title="Download full business plan as PDF"
              >
                {isExportingPdf ? (
                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download as PDF</span>
              </button>
            </div>
          </div>
        ) : (
          /* Export Control Hub */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-600">
                <FileDown className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Export & Share Business Plan
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-8">
                Generate an executive-ready, professionally styled PDF or DOCX file with formatted financial projections, tables, typography, and company branding.
              </p>

              {/* Readiness Meter */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 max-w-lg mx-auto mb-8 text-left">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Document Readiness</span>
                  <span className="text-amber-600 font-bold">{compiled.overallProgress}% Complete</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                    style={{ width: `${compiled.overallProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>{completedSectionsCount} of {totalSectionsCount} sections compiled</span>
                  {compiled.overallProgress < 75 ? (
                    <span className="text-amber-600 font-medium">Recommended: complete {totalSectionsCount - completedSectionsCount} remaining sections</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Ready for investors & partners</span>
                  )}
                </div>
              </div>

              {/* Document Theme & Branding Banner in Export Hub */}
              <div className="max-w-lg mx-auto bg-white p-5 rounded-xl border border-slate-200 mb-8 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Theme & Branding Preferences
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Change Settings
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Type className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Font Theme</span>
                      <span className="font-bold text-slate-800 capitalize">{settings.fontTheme}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Company Logo</span>
                      <span className="font-bold text-slate-800">
                        {settings.logoDataUrl ? "Embedded" : "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={settings.includeCover}
                      onChange={(e) => handleUpdateSettings({ includeCover: e.target.checked })}
                      className="rounded text-slate-900 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Include Branded Cover</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={settings.includeToc}
                      onChange={(e) => handleUpdateSettings({ includeToc: e.target.checked })}
                      className="rounded text-slate-900 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Include Table of Contents</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <button
                  id="export-hub-download-pdf-full"
                  onClick={() => handleExportPdf(false)}
                  disabled={isExportingPdf}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md group disabled:opacity-50 text-center relative border border-slate-800"
                >
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950">
                    Recommended
                  </span>
                  {isExportingPdf ? (
                    <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2.5" />
                  ) : (
                    <Download className="w-7 h-7 text-amber-400 mb-2.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-bold text-sm text-white">Download as PDF</span>
                  <span className="text-xs text-amber-300 font-semibold mt-0.5">Full Business Plan</span>
                  <span className="text-[11px] text-slate-400 mt-1">Complete 12-section document with TOC & financials</span>
                </button>

                <button
                  id="export-hub-download-pdf-brief"
                  onClick={() => handleExportPdf(true)}
                  disabled={isExportingBrief}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 transition-all shadow-xs group disabled:opacity-50 text-center"
                >
                  {isExportingBrief ? (
                    <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2.5" />
                  ) : (
                    <FileText className="w-7 h-7 text-emerald-600 mb-2.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-bold text-sm text-slate-900">Download as PDF</span>
                  <span className="text-xs text-emerald-700 font-semibold mt-0.5">Executive Brief</span>
                  <span className="text-[11px] text-slate-500 mt-1">Condensed 2-page summary of model & KPIs</span>
                </button>

                <button
                  id="export-hub-download-docx"
                  onClick={handleExportDocx}
                  disabled={isExportingDocx}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 transition-all shadow-xs group disabled:opacity-50 text-center"
                >
                  {isExportingDocx ? (
                    <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2.5" />
                  ) : (
                    <FileDown className="w-7 h-7 text-blue-600 mb-2.5 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-bold text-sm text-slate-900">Download as Word</span>
                  <span className="text-xs text-blue-700 font-semibold mt-0.5">Editable .docx</span>
                  <span className="text-[11px] text-slate-500 mt-1">Microsoft Word and Google Docs compatible</span>
                </button>
              </div>
            </div>

            {/* Document Content Depth & Quality Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Business Plan Depth & Coverage Summary</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detailed word count and reading time breakdown across all 12 standard business plan chapters.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Words</span>
                    <strong className="text-slate-900">{planMetrics?.totalWords.toLocaleString() || 0}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Est. Reading Time</span>
                    <strong className="text-amber-700">{planMetrics?.totalReadingTimeText || "0 min"}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {compiled.sections.map((s) => {
                  const secMetric = planMetrics?.sectionMetrics[s.id];
                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        s.hasContent
                          ? "bg-slate-50/70 border-slate-200 text-slate-800 hover:border-amber-300"
                          : "bg-slate-50/40 border-dashed border-slate-200 text-slate-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-semibold truncate text-slate-900">
                          {s.number}. {s.title}
                        </span>
                        {s.hasContent ? (
                          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded flex-shrink-0">
                            Ready
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px] bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{secMetric?.wordCount.toLocaleString() || 0} words</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{secMetric?.readingTimeText || "0 min"}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <DocumentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onSaveToPlan={handleSaveToPlan}
        onExportPdf={() => handleExportPdf(false)}
        isExportingPdf={isExportingPdf}
      />
    </div>
  );
}
