import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { getPlansForUser, createNewPlan } from "@/lib/storage";
import { BusinessPlan } from "@/types/businessPlan";
import { useAudio } from "@/contexts/AudioContext";
import { toast } from "sonner";

// ── Quotes ────────────────────────────────────────────────────────────────────
const QUOTES = [
  { text: "Plans are nothing; planning is everything.", author: "Dwight D. Eisenhower" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "An idea without a plan is nothing more than a dream.", author: "Stephen Brewster" },
  { text: "By failing to prepare, you are preparing to fail.", author: "Benjamin Franklin" },
  { text: "Vision without execution is hallucination.", author: "Thomas Edison" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Don't find customers for your products. Find products for your customers.", author: "Seth Godin" },
  { text: "The value of an idea lies in the using of it.", author: "Thomas Edison" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky" },
  { text: "Build something 100 people love, not something 1 million people kind of like.", author: "Brian Chesky" },
  { text: "The entrepreneur always searches for change, responds to it, and exploits it as an opportunity.", author: "Peter Drucker" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { text: "Revenue is vanity, profit is sanity, but cash is king.", author: "Traditional" },
  { text: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "If you are not embarrassed by the first version of your product, you've launched too late.", author: "Reid Hoffman" },
  { text: "Make every detail perfect and limit the number of details to perfect.", author: "Jack Dorsey" },
  { text: "The best marketing strategy ever: Care.", author: "Gary Vaynerchuk" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Chase the vision, not the money; the money will end up following you.", author: "Tony Hsieh" },
  { text: "A business that makes nothing but money is a poor business.", author: "Henry Ford" },
  { text: "You don't need to be first. You need to be better.", author: "Anonymous" },
];

// ── Card colour palette ───────────────────────────────────────────────────────
// Each entry: [header bg, ring progress colour, button hover bg, accent bar]
const CARD_PALETTES = [
  {
    header: "#0A1628",          // Deep navy
    ring: "#F59E0B",            // amber
    btn: "#0F2040",
    bar: "#F59E0B",
    barDone: "#34D399",
    label: "navy",
  },
  {
    header: "#1B3A2F",          // Forest green
    ring: "#6EE7B7",
    btn: "#14532D",
    bar: "#6EE7B7",
    barDone: "#34D399",
    label: "forest",
  },
  {
    header: "#3B1A3A",          // Deep plum
    ring: "#E879F9",
    btn: "#4A1A48",
    bar: "#E879F9",
    barDone: "#A78BFA",
    label: "plum",
  },
  {
    header: "#1A2E4A",          // Steel blue
    ring: "#60A5FA",
    btn: "#1E3A5F",
    bar: "#60A5FA",
    barDone: "#34D399",
    label: "steel",
  },
  {
    header: "#3D1A0A",          // Warm espresso
    ring: "#FB923C",
    btn: "#4D200A",
    bar: "#FB923C",
    barDone: "#FDE68A",
    label: "espresso",
  },
  {
    header: "#1C3040",          // Slate teal
    ring: "#67E8F9",
    btn: "#1E3A4D",
    bar: "#67E8F9",
    barDone: "#34D399",
    label: "teal",
  },
  {
    header: "#2D1F3B",          // Midnight violet
    ring: "#C4B5FD",
    btn: "#3A2550",
    bar: "#C4B5FD",
    barDone: "#A78BFA",
    label: "violet",
  },
  {
    header: "#2D3820",          // Deep olive
    ring: "#A3E635",
    btn: "#374520",
    bar: "#A3E635",
    barDone: "#34D399",
    label: "olive",
  },
];

// ── Time helpers ──────────────────────────────────────────────────────────────
function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getDailyQuote(): (typeof QUOTES)[0] {
  const day = new Date();
  const idx = (day.getFullYear() * 1000 + day.getMonth() * 31 + day.getDate()) % QUOTES.length;
  return QUOTES[idx];
}

// ── Progress ring ─────────────────────────────────────────────────────────────
function ProgressRing({
  pct,
  size = 48,
  progressColor,
  doneColor,
}: {
  pct: number;
  size?: number;
  progressColor: string;
  doneColor: string;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? doneColor : progressColor;
  const textColor = pct === 100 ? doneColor : "white";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill={textColor}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  onOpen,
  paletteIdx,
}: {
  plan: BusinessPlan;
  onOpen: () => void;
  paletteIdx: number;
}) {
  const palette = CARD_PALETTES[paletteIdx % CARD_PALETTES.length];

  const phases = [
    { id: "company_description", label: "Company" },
    { id: "market_analysis", label: "Market" },
    { id: "financial_plan", label: "Financials" },
  ];

  const researchCount = plan.researchItems?.filter((r) => r.status !== "completed").length ?? 0;
  const notesCount = plan.notes?.length ?? 0;

  return (
    <div
      className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group"
      style={{ background: "#fff" }}
    >
      {/* Coloured header */}
      <div
        className="px-6 py-5 flex items-start justify-between gap-4"
        style={{ background: palette.header }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-serif font-semibold text-lg truncate leading-snug">
            {plan.name}
          </h3>
          <p className="text-white/50 text-xs mt-1">
            Last worked on:{" "}
            {new Date(plan.lastWorkedOn).toLocaleDateString("en-GB", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <ProgressRing
          pct={plan.overallProgress}
          progressColor={palette.ring}
          doneColor={palette.barDone}
        />
      </div>

      <div className="p-5">
        {/* Phase progress bars */}
        <div className="flex gap-3 mb-5">
          {phases.map((ph) => {
            const pct = plan.phaseProgress?.[ph.id] ?? 0;
            return (
              <div key={ph.id} className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-navy-500">{ph.label}</span>
                  <span className="text-xs font-medium text-navy-700">{pct}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? palette.barDone : palette.bar,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 mb-5 text-xs flex-wrap min-h-[26px]">
          {researchCount > 0 && (
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              🔎 {researchCount} research item{researchCount > 1 ? "s" : ""}
            </span>
          )}
          {notesCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
              📝 {notesCount} note{notesCount > 1 ? "s" : ""}
            </span>
          )}
          {researchCount === 0 && notesCount === 0 && (
            <span className="text-muted-foreground">No pending items</span>
          )}
        </div>

        <button
          onClick={onOpen}
          className="w-full text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{ background: palette.header }}
          onMouseEnter={(e) => (e.currentTarget.style.background = palette.btn)}
          onMouseLeave={(e) => (e.currentTarget.style.background = palette.header)}
        >
          {plan.onboardingCompleted ? "Continue Where I Left Off" : "Start Walkthrough"}
        </button>
      </div>
    </div>
  );
}

// ── Animated quote wrapper ────────────────────────────────────────────────────
function AnimatedQuote({ quote }: { quote: { text: string; author: string } }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small initial delay so it settles in after the greeting renders
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-start gap-4 max-w-xl">
      <div
        className="w-[2px] self-stretch shrink-0 rounded-full mt-0.5 bg-amber-400"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scaleY(1)" : "scaleY(0.4)",
          transformOrigin: "top",
          transition: "opacity 400ms ease 80ms, transform 400ms ease 80ms",
        }}
      />
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 400ms ease 180ms, transform 400ms ease 180ms",
          willChange: "opacity, transform",
        }}
      >
        <p className="text-[#0A1628]/75 text-[15px] font-normal leading-[1.7] italic">
          "{quote.text}"
        </p>
        <p className="text-[#0A1628]/40 text-[12px] font-medium mt-2 tracking-wide">
          — {quote.author}
        </p>
      </div>
    </div>
  );
}

// ── Audio toggle pill ─────────────────────────────────────────────────────────
function AudioTogglePill() {
  const { audioEnabled, audioSettings, toggleAudio, volume, setVolume, isLoading } = useAudio();
  const [showVolume, setShowVolume] = useState(false);

  if (isLoading || (!audioSettings?.key && !audioSettings?.url)) return null;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${
          audioEnabled
            ? "bg-amber-400/10 border-amber-400/40 text-amber-600"
            : "bg-white/50 border-border text-navy-400 hover:border-navy-300"
        }`}
        onClick={toggleAudio}
        onMouseEnter={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
        title={audioEnabled ? "Background audio on — click to pause" : "Background audio off — click to play"}
      >
        {audioEnabled ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy-400">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round"/>
            <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round"/>
          </svg>
        )}
        <span className="text-[11px] font-semibold">
          {audioEnabled ? "Focus Audio" : "Audio Off"}
        </span>
        {audioEnabled && (
          <span className="flex items-end gap-[2px] h-3">
            {[3, 5, 4, 6, 3].map((h, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-amber-500"
                style={{
                  height: `${h}px`,
                  animation: audioEnabled ? `audioBounce ${0.5 + i * 0.1}s ease-in-out infinite alternate` : "none",
                }}
              />
            ))}
          </span>
        )}
      </div>

      {/* Volume slider on hover */}
      {showVolume && audioEnabled && (
        <div
          className="absolute top-full right-0 mt-2 bg-white border border-border rounded-xl shadow-lg p-3 z-20 min-w-[160px]"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wide mb-2">Volume</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between">
            <span className="text-[10px] text-navy-400">0</span>
            <span className="text-[10px] text-navy-700 font-semibold">{Math.round(volume * 100)}%</span>
            <span className="text-[10px] text-navy-400">100</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [creating, setCreating] = useState(false);

  // Live clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const quote = getDailyQuote();
  const greeting = getGreeting(now.getHours());
  const firstName = (user?.name || "").split(" ")[0] || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (user) {
      getPlansForUser(user.id).then((loaded) => {
        setPlans(loaded);
        setLoadingPlans(false);
      });
    }
  }, [user]);

  const handleCreatePlan = async () => {
    if (!newPlanName.trim() || !user) return;
    setCreating(true);
    const plan = await createNewPlan(user.id, newPlanName.trim());
    setPlans((prev) => [plan, ...prev]);
    setShowNewPlan(false);
    setNewPlanName("");
    setCreating(false);
    navigate(`/plan/${plan.id}/onboarding`);
  };

  const openPlan = (plan: BusinessPlan) => {
    if (!plan.onboardingCompleted) {
      navigate(`/plan/${plan.id}/onboarding`);
    } else {
      navigate(`/plan/${plan.id}/build`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Topbar ── */}
      <header className="bg-navy-900 border-b border-navy-700">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C" />
              </svg>
            </div>
            <span className="text-white font-serif font-semibold text-base">Scruttin</span>
          </div>
          <div className="flex items-center gap-4">
            <AudioTogglePill />
            <span className="text-navy-300 text-sm hidden sm:block">{user?.name}</span>
            <button
              onClick={() => signOut()}
              className="text-navy-400 hover:text-white text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Welcome Hero ── */}
      <div className="bg-white border-b border-black/6">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-9">
          {/* Date + time row */}
          <p className="text-[#0A1628]/40 text-[12px] font-medium tracking-[0.15em] uppercase mb-3">
            {formatFullDate(now)}
            <span className="mx-2 opacity-40">·</span>
            {formatTime(now)}
          </p>

          {/* Greeting */}
          <h1 className="font-serif text-[32px] sm:text-[38px] font-bold text-[#0A1628] leading-tight mb-6">
            {greeting},{" "}
            <span className="text-amber-500">{firstName}.</span>
          </h1>

          {/* Animated quote */}
          <AnimatedQuote quote={quote} />

          {/* Transition nudge */}
          <p className="text-[#0A1628]/50 text-[13px] font-normal mt-7">
            Now, back to what you&apos;re building.
          </p>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-xl font-serif font-bold text-navy-900">My Business Plans</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {loadingPlans
                ? "Loading your plans…"
                : plans.length === 0
                ? "Create your first business plan to get started."
                : `${plans.length} plan${plans.length > 1 ? "s" : ""} in progress`}
            </p>
          </div>
          <button
            onClick={() => setShowNewPlan(true)}
            className="bg-navy-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Plan
          </button>
        </div>

        {/* New plan modal */}
        {showNewPlan && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 animate-fade-in">
              <h2 className="text-xl font-serif font-bold text-navy-900 mb-2">Name Your Business Plan</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Use the name of your business, or a working title. You can change this later.
              </p>
              <input
                type="text"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlan()}
                placeholder='"CycleKit Pro" or "My Coffee Shop"'
                className="w-full border border-input px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mb-5"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNewPlan(false); setNewPlanName(""); }}
                  className="flex-1 border border-border text-navy-700 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  disabled={!newPlanName.trim() || creating}
                  className="flex-1 bg-navy-900 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-navy-800 transition-colors"
                >
                  {creating ? "Creating…" : "Create & Begin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loadingPlans ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 4h20v4H4zM4 12h14v4H4zM4 20h10v4H4z" fill="hsl(220 55% 14%)" opacity="0.3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No plans yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Create your first business plan. The guided walkthrough will teach you what to write and why.
            </p>
            <button
              onClick={() => setShowNewPlan(true)}
              className="bg-navy-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors"
            >
              Create My First Plan
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={() => openPlan(plan)}
                paletteIdx={idx}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
