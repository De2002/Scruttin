import React, { useRef } from "react";
import { FontTheme } from "@/lib/pdfExport";
import {
  X,
  Type,
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  Sparkles,
  Sliders,
  Palette,
  LayoutTemplate,
  Info,
  Download,
} from "lucide-react";

export interface DocumentSettings {
  fontTheme: FontTheme;
  logoDataUrl: string | null;
  logoPlacement: "cover-only" | "cover-and-header";
  includeCover: boolean;
  includeToc: boolean;
}

interface DocumentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DocumentSettings;
  onUpdateSettings: (newSettings: Partial<DocumentSettings>) => void;
  onSaveToPlan?: (logoDataUrl: string | null) => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

interface FontThemeOption {
  id: FontTheme;
  name: string;
  category: string;
  fontClass: string;
  description: string;
  paletteName: string;
  paletteColors: string[];
  sampleText: string;
}

const FONT_THEMES: FontThemeOption[] = [
  {
    id: "modern",
    name: "Modern Executive",
    category: "Standard Sans-Serif",
    fontClass: "font-sans",
    description: "Crisp, authoritative Helvetica styling with Deep Midnight Slate & warm Amber Gold accents.",
    paletteName: "Midnight & Gold",
    paletteColors: ["#0F172A", "#D97706", "#F8FAFC"],
    sampleText: "Clean geometric precision designed for institutional venture decks and corporate pitches.",
  },
  {
    id: "classic",
    name: "Classic Editorial",
    category: "Refined Serif",
    fontClass: "font-serif",
    description: "Distinguished Times Roman typography paired with rich Burgundy and warm Cream background tones.",
    paletteName: "Burgundy & Warm Sand",
    paletteColors: ["#18181B", "#B45309", "#FEFCF6"],
    sampleText: "Timeless traditional elegance ideal for legal, advisory, banking, and luxury ventures.",
  },
  {
    id: "technical",
    name: "Technical & Data",
    category: "Monospace Hybrid",
    fontClass: "font-mono",
    description: "Structured Courier monospace aesthetic paired with Oceanic Teal & Deep Navy palettes.",
    paletteName: "Teal & Cyber Blue",
    paletteColors: ["#0D1B2A", "#0D9488", "#F0F9FF"],
    sampleText: "Analytical data-driven typography built for SaaS, engineering, biotech, and hardware proposals.",
  },
  {
    id: "minimal",
    name: "Minimalist Studio",
    category: "Contemporary Clean",
    fontClass: "font-sans",
    description: "Ultra-sharp high contrast layout with vivid Indigo accents on pure minimalist canvas.",
    paletteName: "Indigo & Monochrome",
    paletteColors: ["#0A0A0A", "#4F46E5", "#FAFAFA"],
    sampleText: "Modern architectural minimalism crafted for creative agencies, DTC brands, and startups.",
  },
];

export const DocumentSettingsModal: React.FC<DocumentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSaveToPlan,
  onExportPdf,
  isExportingPdf,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("Please upload an image smaller than 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSettings({ logoDataUrl: dataUrl });
      if (onSaveToPlan) onSaveToPlan(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    onUpdateSettings({ logoDataUrl: null });
    if (onSaveToPlan) onSaveToPlan(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="document-settings-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Document & PDF Styling Settings</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider">
                  Live Customizer
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize typography, color themes, and company branding embedded in your exports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm divide-y divide-slate-100">
          {/* Section 1: Font Theme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Typography & Theme Style
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Applied to Document View & PDF Export
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FONT_THEMES.map((theme) => {
                const isSelected = settings.fontTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontTheme: theme.id })}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{theme.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                          {theme.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {theme.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {theme.paletteColors.map((col, idx) => (
                          <span
                            key={idx}
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs inline-block"
                            style={{ backgroundColor: col }}
                            title={theme.paletteName}
                          />
                        ))}
                        <span className="text-[11px] text-slate-500 ml-1 font-medium">
                          {theme.paletteName}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold text-slate-700 ${theme.fontClass}`}>
                        Aa Bb 123
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Company Logo Upload */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  Company Logo & Brand Identity
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Embeds directly into cover & PDF headers
              </span>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview Thumbnail */}
                <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 relative overflow-hidden flex-shrink-0 shadow-xs">
                  {settings.logoDataUrl ? (
                    <img
                      src={settings.logoDataUrl}
                      alt="Company Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium block">
                        No Logo
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload & Controls */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="logo-file-input"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{settings.logoDataUrl ? "Change Logo" : "Upload Company Logo"}</span>
                    </button>

                    {settings.logoDataUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports PNG, JPEG, SVG or WebP. Optimal transparent PNG or square/horizontal badge (up to 4MB).
                  </p>
                </div>
              </div>

              {/* Logo Placement Selector (Only active if logo exists) */}
              {settings.logoDataUrl && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">Logo Placement:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ logoPlacement: "cover-and-header" })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        settings.logoPlacement === "cover-and-header"
                          ? "bg-slate-900 text-white font-semibold shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Cover & Page Headers
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ logoPlacement: "cover-only" })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        settings.logoPlacement === "cover-only"
                          ? "bg-slate-900 text-white font-semibold shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Cover Page Only
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Document Content Inclusions */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                Document Sections & Layout
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeCover}
                  onChange={(e) => onUpdateSettings({ includeCover: e.target.checked })}
                  className="mt-0.5 rounded text-slate-900 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Executive Cover Page</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Includes company hero banner, tagline, metadata & pro-forma KPI summary.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={settings.includeToc}
                  onChange={(e) => onUpdateSettings({ includeToc: e.target.checked })}
                  className="mt-0.5 rounded text-slate-900 focus:ring-amber-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Table of Contents & Snapshot</span>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Lists all 12 section statuses plus 4-column financial target overview.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Theme and logo will automatically apply to next PDF export.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Done & Close
            </button>

            {onExportPdf && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExportPdf();
                }}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Apply & Download PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
