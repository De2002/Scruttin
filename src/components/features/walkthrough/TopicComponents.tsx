import React, { useState } from "react";
import { BusinessPlan, ResearchItem } from "@/types/businessPlan";
import { generateId } from "@/lib/storage";

type ResearchStatus = "known" | "estimating" | "needs_research" | "not_applicable";

interface ResearchStatusSelectorProps {
  value: ResearchStatus;
  onChange: (v: ResearchStatus) => void;
}

const OPTIONS: { value: ResearchStatus; label: string; icon: string; desc: string }[] = [
  { value: "known", label: "I know this", icon: "✓", desc: "Based on confirmed information" },
  { value: "estimating", label: "I'm estimating", icon: "~", desc: "Reasonable estimate, not confirmed" },
  { value: "needs_research", label: "I need to research this", icon: "🔎", desc: "Will add a research task" },
  { value: "not_applicable", label: "Not applicable", icon: "–", desc: "Does not apply to this business" },
];

export function ResearchStatusSelector({ value, onChange }: ResearchStatusSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
            value === opt.value
              ? "border-navy-700 bg-navy-50"
              : "border-border bg-white hover:border-navy-300"
          }`}
        >
          <span className={`text-sm font-bold mt-0.5 shrink-0 ${
            value === opt.value ? "text-navy-900" : "text-muted-foreground"
          }`}>{opt.icon}</span>
          <div>
            <p className={`text-xs font-semibold ${value === opt.value ? "text-navy-900" : "text-navy-700"}`}>
              {opt.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

interface TopicNavProps {
  onPrev?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  isCompleted?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export function TopicNav({
  onPrev,
  onNext,
  onComplete,
  prevLabel = "← Previous",
  nextLabel = "Next →",
  isCompleted,
  isFirst,
  isLast,
}: TopicNavProps) {
  return (
    <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
      <button
        onClick={onPrev}
        disabled={!onPrev || isFirst}
        className="text-sm text-muted-foreground hover:text-navy-700 disabled:opacity-0 transition-colors"
      >
        {prevLabel}
      </button>
      <div className="flex gap-3">
        {isCompleted ? (
          <span className="flex items-center gap-2 text-sage-600 text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Complete
          </span>
        ) : (
          onComplete && (
            <button
              onClick={onComplete}
              className="bg-sage-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-sage-500 transition-colors"
            >
              Mark Complete
            </button>
          )
        )}
        <button
          onClick={onNext}
          disabled={!onNext}
          className="bg-navy-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-50 transition-colors"
        >
          {isLast ? "Finish Phase →" : nextLabel}
        </button>
      </div>
    </div>
  );
}

interface EducationPanelProps {
  children: React.ReactNode;
  title?: string;
  variant?: "default" | "example" | "warning" | "research" | "tip";
}

export function EducationPanel({ children, title, variant = "default" }: EducationPanelProps) {
  const classes = {
    default: "education-panel",
    example: "example-panel",
    warning: "warning-panel",
    research: "research-panel",
    tip: "bg-sage-50 border border-sage-100 rounded-lg p-5",
  };
  const labelClasses = {
    default: "text-navy-600",
    example: "text-amber-700",
    warning: "text-red-700",
    research: "text-blue-700",
    tip: "text-sage-600",
  };
  const labels = {
    default: "",
    example: "Example",
    warning: "Important",
    research: "Research guidance",
    tip: "Tip",
  };

  return (
    <div className={classes[variant]}>
      {(title || labels[variant]) && (
        <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${labelClasses[variant]}`}>
          {title || labels[variant]}
        </p>
      )}
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  helpText?: string;
  required?: boolean;
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  helpText,
  required,
}: TextAreaFieldProps) {
  return (
    <div>
      <label className="input-label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {helpText && <p className="text-xs text-muted-foreground mb-2">{helpText}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-navy-700 transition-all resize-none"
      />
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  type?: string;
}

export function TextField({ label, value, onChange, placeholder, helpText, required, type = "text" }: TextFieldProps) {
  return (
    <div>
      <label className="input-label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {helpText && <p className="text-xs text-muted-foreground mb-2">{helpText}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-navy-700 transition-all"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; description?: string }[];
  helpText?: string;
  required?: boolean;
}

export function SelectField({ label, value, onChange, options, helpText, required }: SelectFieldProps) {
  return (
    <div>
      <label className="input-label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {helpText && <p className="text-xs text-muted-foreground mb-2">{helpText}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-navy-700 transition-all appearance-none"
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TopicHeaderProps {
  phase: string;
  phaseNumber: number;
  topicNumber: number;
  topicTitle: string;
  estimatedMinutes?: number;
  status?: string;
}

export function TopicHeader({
  phase,
  phaseNumber,
  topicNumber,
  topicTitle,
  estimatedMinutes,
  status,
}: TopicHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
          Phase {phaseNumber} · {phase}
        </span>
        {estimatedMinutes && (
          <span className="text-xs text-muted-foreground">· ~{estimatedMinutes} min</span>
        )}
        {status === "completed" && (
          <span className="ml-auto flex items-center gap-1 text-sage-600 text-xs font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Complete
          </span>
        )}
      </div>
      <h1 className="text-2xl lg:text-3xl font-serif font-bold text-navy-900">
        <span className="text-navy-300 mr-2">{String(topicNumber).padStart(2, "0")}.</span>
        {topicTitle}
      </h1>
    </div>
  );
}
