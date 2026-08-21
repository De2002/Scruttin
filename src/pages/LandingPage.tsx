import React, { useState, useEffect, useRef, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 280ms ease ${delay}ms, transform 280ms ease ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// ── Cycling contrast lines ────────────────────────────────────────────────────
const CONTRASTS = [
  { dim: "Business idea", bright: "→ AI →", end: "Business plan." },
  { dim: "That's not", bright: "planning.", end: "That's outsourcing." },
  { dim: "You don't own", bright: "invented facts.", end: "Neither does a bank." },
];

const PLAN_SECTIONS = [
  "Executive Summary",
  "Company Description",
  "Market Analysis",
  "Organization & Management",
  "Products & Services",
  "Marketing & Sales",
  "Operations",
  "Financial Plan",
  "Funding Request",
  "Risks & Mitigation",
  "Milestones",
  "Appendix",
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [lineVisible, setLineVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cycle = () => {
      setLineVisible(false);
      setTimeout(() => {
        setLineIdx((i) => (i + 1) % CONTRASTS.length);
        setLineVisible(true);
      }, 380);
    };
    timerRef.current = setInterval(cycle, 3200);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const line = CONTRASTS[lineIdx];

  return (
    <div className="min-h-screen bg-white text-[#0A1628] overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 h-14 bg-white/95 backdrop-blur-sm border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-400 rounded-sm flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C"/>
            </svg>
          </div>
          <span className="font-serif font-bold text-[#0A1628] tracking-tight text-[17px]">Scruttin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth?tab=login" className="text-[#0A1628]/60 hover:text-[#0A1628] text-[13px] font-normal tracking-wide transition-colors">
            Sign in
          </Link>
          <Link
            to="/auth?tab=signup"
            className="bg-[#0A1628] text-white px-4 py-1.5 rounded text-[13px] font-semibold hover:bg-[#0F2040] transition-colors tracking-tight"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* ── HERO — light, typography-led ─────────────────────────────────────── */}
      <section className="pt-14 min-h-[100svh] flex flex-col bg-white relative">
        {/* Amber accent line — left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-amber-400/50 to-transparent" />

        {/* Faint grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#0A1628 1px, transparent 1px), linear-gradient(90deg, #0A1628 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative flex-1 flex flex-col justify-between px-6 pt-12 pb-10">
          <div>
            {/* Label */}
            <p className="text-[#0A1628]/45 text-[11px] font-medium tracking-[0.2em] uppercase mb-8">
              Guided Business Plan Builder
            </p>

            {/* Main headline */}
            <h1 className="font-serif leading-[1.1] mb-6">
              <span className="block text-[40px] font-bold text-[#0A1628]">Build a plan</span>
              <span className="block text-[40px] font-bold text-[#0A1628]">you actually</span>
              <span className="block text-[40px] font-bold text-amber-500">understand.</span>
            </h1>

            {/* Subhead */}
            <p className="text-[#0A1628]/70 text-[16px] font-normal leading-[1.75] mb-10 max-w-xs">
              Not a generator. A guided walkthrough — where you learn, research, calculate, and write your own business plan.
            </p>

            {/* CTA */}
            <Link
              to="/auth?tab=signup"
              className="inline-flex items-center gap-2 bg-[#0A1628] text-white px-7 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#0F2040] transition-colors"
            >
              Begin building
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <p className="text-[#0A1628]/40 text-[12px] font-normal mt-3 tracking-wide">Free · No card · Save anytime</p>
          </div>

          {/* Cycling contrast line */}
          <div className="mt-12 pt-8 border-t border-black/8">
            <div className={`transition-opacity duration-300 ${lineVisible ? "opacity-100" : "opacity-0"}`}>
              <p className="text-[14px] font-normal leading-[1.6]">
                <span className="text-[#0A1628]/40">{line.dim} </span>
                <span className="text-amber-500 font-semibold">{line.bright} </span>
                <span className="text-[#0A1628]/40">{line.end}</span>
              </p>
            </div>
            <div className="flex gap-1.5 mt-4">
              {CONTRASTS.map((_, i) => (
                <div
                  key={i}
                  className={`h-[2px] rounded-full transition-all duration-300 ${i === lineIdx ? "w-6 bg-amber-400" : "w-2 bg-black/10"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE DIFFERENCE ───────────────────────────────────────────────────── */}
      <section className="bg-[#F7F6F3] px-6 py-16">
        <Reveal>
          <p className="text-[#0A1628]/50 text-[11px] font-medium tracking-[0.2em] uppercase mb-8">
            What makes this different
          </p>
        </Reveal>

        <div className="space-y-8">
          <Reveal delay={0}>
            <DiffBlock
              label="01"
              heading="AI generators write a plan for you."
              body="Scruttin won't. Every word comes from you — your research, your data, your reasoning. We teach you what to write and why."
              highlight
            />
          </Reveal>
          <Reveal delay={60}>
            <DiffBlock
              label="02"
              heading="They invent figures you can't defend."
              body="Market sizes, competitor data, financial projections — invented facts collapse under any serious question. Scruttin never puts words in your plan that you didn't put there."
            />
          </Reveal>
          <Reveal delay={120}>
            <DiffBlock
              label="03"
              heading="They produce a document. Not understanding."
              body="A bank or investor will ask questions. You need to understand your own plan. Scruttin builds that understanding as you go."
            />
          </Reveal>
          <Reveal delay={180}>
            <DiffBlock
              label="04"
              heading="They're done in minutes. Plans aren't."
              body="A real business plan takes hours — sometimes days. Scruttin is designed for that reality. Save anywhere. Return anytime. No pressure."
            />
          </Reveal>
        </div>
      </section>

      {/* ── CORE PRINCIPLE — amber band ──────────────────────────────────────── */}
      <section className="bg-amber-400 px-6 py-12">
        <Reveal>
          <p className="text-[#0A1628]/50 text-[11px] font-medium tracking-[0.2em] uppercase mb-5">
            The philosophy
          </p>
          <p className="font-serif text-[#0A1628] text-[28px] font-bold leading-[1.2] mb-4">
            "Teach first. Ask second. Assist when needed."
          </p>
          <p className="text-[#0A1628]/70 text-[15px] font-normal leading-[1.75]">
            AI is a tool inside the experience — not the author, not the decision-maker. You are.
          </p>
        </Reveal>
      </section>

      {/* ── THE PROCESS ──────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <Reveal>
          <p className="text-[#0A1628]/50 text-[11px] font-medium tracking-[0.2em] uppercase mb-8">
            The process
          </p>
          <h2 className="font-serif text-[26px] font-bold text-[#0A1628] leading-tight mb-10">
            How every section works
          </h2>
        </Reveal>

        <div className="space-y-0">
          {[
            { label: "Intro", body: "A natural opening that sets context before you're asked anything." },
            { label: "What is it?", body: "Plain-language explanation. No jargon assumed." },
            { label: "Why does it matter?", body: "Understand the purpose before you write a word." },
            { label: "Example", body: "A realistic, in-depth example. Not one shallow sentence." },
            { label: "Research guide", body: "What to look for, where, and what evidence counts." },
            { label: "Tools", body: "Calculators for market sizing, financials, comparisons." },
            { label: "Your turn", body: "Now you answer — with context, not cold boxes." },
            { label: "Review", body: "Confirm what you've established before moving on." },
          ].map((step, i) => (
            <Reveal key={i} delay={i * 30}>
              <div className="flex gap-5 py-5 border-b border-black/6">
                <span className="text-amber-500 font-mono text-[13px] font-medium shrink-0 pt-0.5 w-3">—</span>
                <div>
                  <p className="text-[#0A1628] font-semibold text-[14px] mb-1">{step.label}</p>
                  <p className="text-[#0A1628]/65 text-[14px] font-normal leading-[1.7]">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU BUILD ───────────────────────────────────────────────────── */}
      <section className="bg-[#F7F6F3] px-6 py-16">
        <Reveal>
          <p className="text-[#0A1628]/50 text-[11px] font-medium tracking-[0.2em] uppercase mb-8">
            The output
          </p>
          <h2 className="font-serif text-[26px] font-bold text-[#0A1628] leading-tight mb-3">
            A complete, 12-section business plan.
          </h2>
          <p className="text-[#0A1628]/65 text-[15px] font-normal leading-[1.75] mb-10">
            Built section by section. Structured data underneath. Exportable as PDF or DOCX when complete.
          </p>
        </Reveal>

        <div className="space-y-0">
          {PLAN_SECTIONS.map((title, i) => (
            <Reveal key={i} delay={i * 25}>
              <div className="flex items-center gap-4 py-3.5 border-b border-black/6">
                <span className="text-[#0A1628]/35 font-mono text-[12px] font-normal shrink-0 w-5 text-right">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[#0A1628]/80 text-[14px] font-normal flex-1">{title}</span>
                {i === 0 && <span className="text-[#0A1628]/35 text-[11px] font-normal italic">completed last</span>}
                {i === 8 && <span className="text-[#0A1628]/35 text-[11px] font-normal italic">if applicable</span>}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-amber-900 text-[13px] font-normal leading-[1.75]">
              The Executive Summary is written last — because it summarises everything that came before it. Scruttin explains why, and guides you through it when you're ready.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <Reveal>
          <p className="text-[#0A1628]/50 text-[11px] font-medium tracking-[0.2em] uppercase mb-8">
            Built-in tools
          </p>
        </Reveal>

        <div className="space-y-8">
          {[
            {
              icon: "↺",
              title: "Autosave",
              body: "Your progress saves after every input. Leave mid-sentence. Return days later. Nothing is lost.",
            },
            {
              icon: "⌕",
              title: "Research Tracker",
              body: "Mark any question as \"needs research\". A central tracker collects every open item so nothing slips.",
            },
            {
              icon: "∑",
              title: "Financial Calculators",
              body: "Market sizing, break-even, P&L, cash flow — all built from your own figures, not invented numbers.",
            },
            {
              icon: "⚡",
              title: "Cross-Section Validation",
              body: "If your financial projection exceeds the production capacity you entered in Operations, Scruttin flags it.",
            },
            {
              icon: "✦",
              title: "AI That Assists",
              body: "Ask AI to explain a concept, give another example, or review your writing. It never writes plan content without you.",
            },
            {
              icon: "↓",
              title: "PDF & DOCX Export",
              body: "When complete, your structured answers generate a professionally formatted, print-ready document.",
            },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 50}>
              <div className="flex gap-5">
                <span className="text-amber-500 text-[20px] font-normal w-6 shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-[#0A1628] font-semibold text-[15px] mb-1.5">{f.title}</p>
                  <p className="text-[#0A1628]/65 text-[14px] font-normal leading-[1.75]">{f.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── EXPECTATIONS ─────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F6F3] px-6 py-16">
        <Reveal>
          <p className="text-[#0A1628]/50 text-[11px] font-medium tracking-[0.2em] uppercase mb-8">
            The expectation
          </p>
          <blockquote className="border-l-2 border-amber-400 pl-5 mb-10">
            <p className="font-serif text-[22px] font-bold text-[#0A1628] leading-[1.3] mb-3">
              "You don't need to know everything before you begin."
            </p>
            <p className="text-[#0A1628]/65 text-[14px] font-normal leading-[1.75]">
              Some questions require research. That's expected. That's the whole point. Work at your own pace.
            </p>
          </blockquote>
        </Reveal>

        <div className="space-y-4">
          {[
            "No time limit",
            "Automatic saving",
            "Resume from exactly where you stopped",
            "Private notes throughout",
            "Research tracker for open questions",
            "No invented facts. Ever.",
          ].map((point, i) => (
            <Reveal key={i} delay={i * 40}>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <p className="text-[#0A1628]/75 text-[14px] font-normal">{point}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16">
        <Reveal>
          <div className="border-t border-black/6 pt-12">
            <h2 className="font-serif text-[32px] font-bold text-[#0A1628] leading-[1.15] mb-3">
              Ready to build something real?
            </h2>
            <p className="text-[#0A1628]/65 text-[15px] font-normal leading-[1.75] mb-8">
              Enter your email. We'll send a sign-in code. No password. No credit card.
            </p>

            <div className="space-y-3 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  navigate(`/auth?tab=signup&email=${encodeURIComponent(email)}`)
                }
                placeholder="your@email.com"
                className="w-full bg-[#F7F6F3] border border-black/10 text-[#0A1628] placeholder-[#0A1628]/40 px-4 py-3.5 rounded-lg text-[15px] font-normal focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
              />
              <button
                onClick={() =>
                  navigate(`/auth?tab=signup&email=${encodeURIComponent(email)}`)
                }
                className="w-full bg-[#0A1628] text-white py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#0F2040] transition-colors"
              >
                Start building — it's free
              </button>
            </div>

            <p className="text-[#0A1628]/40 text-[12px] font-normal text-center tracking-wide">
              Already have an account?{" "}
              <Link
                to="/auth?tab=login"
                className="text-[#0A1628]/65 hover:text-[#0A1628] underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#F7F6F3] px-6 py-7 border-t border-black/6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-amber-400 rounded-sm flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C"/>
              </svg>
            </div>
            <span className="text-[#0A1628]/50 text-[13px] font-normal">Scruttin</span>
          </div>
          <p className="text-[#0A1628]/30 text-[12px] font-normal">© 2026</p>
        </div>
      </footer>
    </div>
  );
}

// ── Diff block component ──────────────────────────────────────────────────────
function DiffBlock({
  label,
  heading,
  body,
  highlight,
}: {
  label: string;
  heading: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border-l-2 pl-5 ${highlight ? "border-amber-400" : "border-black/15"}`}>
      <p className="text-[#0A1628]/40 text-[10px] font-medium tracking-[0.15em] uppercase mb-2">{label}</p>
      <p
        className={`font-serif text-[17px] font-bold leading-tight mb-2 ${
          highlight ? "text-[#0A1628]" : "text-[#0A1628]/85"
        }`}
      >
        {heading}
      </p>
      <p className="text-[#0A1628]/65 text-[14px] font-normal leading-[1.75]">{body}</p>
    </div>
  );
}
