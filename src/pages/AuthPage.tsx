import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Screen = "entry" | "code";

export default function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, user, loading } = useAuthContext();

  const [mode, setMode] = useState<"login" | "signup">(
    params.get("tab") === "signup" ? "signup" : "login"
  );
  const [screen, setScreen] = useState<Screen>("entry");

  // Entry fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.get("email") || "");

  // Code fields — 4 digits
  const [code, setCode] = useState(["", "", "", ""]);
  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Reset error when switching tabs or screens
  useEffect(() => {
    setError("");
    setCode(["", "", "", ""]);
  }, [mode, screen]);

  // ── Step 1: send OTP ──────────────────────────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setBusy(true);
    const err = await sendOtp(email.trim());
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setScreen("code");
    setResendCooldown(60);
    // Focus first code box
    setTimeout(() => codeRefs[0].current?.focus(), 100);
  };

  // ── Step 2: verify code ───────────────────────────────────────
  const handleVerifyCode = async (fullCode?: string) => {
    const token = fullCode ?? code.join("");
    if (token.length < 4) return;
    setError("");
    setBusy(true);
    const err = await verifyOtp(
      email.trim(),
      token,
      mode === "signup" ? name.trim() : undefined
    );
    setBusy(false);
    if (err) {
      setError(err.includes("expired") || err.includes("invalid")
        ? "That code is incorrect or has expired. Please try again."
        : err);
      setCode(["", "", "", ""]);
      setTimeout(() => codeRefs[0].current?.focus(), 50);
      return;
    }
    toast.success(mode === "signup" ? "Welcome to Scruttin!" : "Welcome back!");
    navigate("/dashboard");
  };

  // Code input handling
  const handleCodeKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[idx]) {
        const next = [...code];
        next[idx] = "";
        setCode(next);
      } else if (idx > 0) {
        codeRefs[idx - 1].current?.focus();
      }
    }
  };

  const handleCodeChange = (idx: number, val: string) => {
    // Allow paste of full 4-digit code
    if (val.length === 4 && /^\d{4}$/.test(val)) {
      const digits = val.split("");
      setCode(digits);
      codeRefs[3].current?.focus();
      handleVerifyCode(val);
      return;
    }
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < 3) codeRefs[idx + 1].current?.focus();
    if (digit && idx === 3) {
      // Auto-submit when last digit entered
      const full = next.join("");
      if (full.length === 4) handleVerifyCode(full);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || busy) return;
    setBusy(true);
    const err = await sendOtp(email.trim());
    setBusy(false);
    if (err) { setError(err); return; }
    setResendCooldown(60);
    setCode(["", "", "", ""]);
    setError("");
    toast.success("A new code has been sent.");
    setTimeout(() => codeRefs[0].current?.focus(), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-400 rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C" />
            </svg>
          </div>
          <span className="text-white font-serif font-semibold text-lg">Scruttin</span>
        </Link>

        <div>
          <blockquote className="border-l-2 border-amber-400 pl-6 mb-8">
            <p className="text-2xl font-serif text-white leading-relaxed">
              "You don't need to know everything before you begin. Some questions require research. That's expected."
            </p>
          </blockquote>
          <div className="space-y-4">
            {[
              "Learn what to write and why",
              "Track what still needs research",
              "Build financials from your own data",
              "Export a complete, professional document",
            ].map((point, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-sage-600 rounded-full flex items-center justify-center shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-navy-200 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-navy-500 text-xs">© 2026 Scruttin</p>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-amber-400 rounded flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C" />
              </svg>
            </div>
            <span className="text-navy-900 font-serif font-semibold text-lg">Scruttin</span>
          </Link>

          {screen === "entry" ? (
            <>
              {/* Tab switcher */}
              <div className="flex bg-muted rounded-lg p-1 mb-8">
                {(["signup", "login"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setMode(t); setScreen("entry"); }}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                      mode === t
                        ? "bg-white text-navy-900 shadow-sm"
                        : "text-muted-foreground hover:text-navy-700"
                    }`}
                  >
                    {t === "signup" ? "Create Account" : "Sign In"}
                  </button>
                ))}
              </div>

              <h1 className="text-2xl font-serif font-bold text-navy-900 mb-2">
                {mode === "signup" ? "Start your business plan" : "Welcome back"}
              </h1>
              <p className="text-muted-foreground text-sm mb-8">
                {mode === "signup"
                  ? "Enter your details and we'll send a sign-in code to your email."
                  : "Enter your email and we'll send a sign-in code — no password needed."}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-5">
                {mode === "signup" && (
                  <div>
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-navy-700 transition-all"
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full border border-input bg-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-navy-700 transition-all"
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-navy-900 text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-navy-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    "Send Sign-in Code →"
                  )}
                </button>
              </form>

              <p className="text-center text-muted-foreground text-xs mt-6">
                {mode === "signup" ? (
                  <>Already have an account?{" "}
                    <button onClick={() => setMode("login")} className="text-navy-700 font-medium hover:underline">Sign in</button>
                  </>
                ) : (
                  <>Don't have an account?{" "}
                    <button onClick={() => setMode("signup")} className="text-navy-700 font-medium hover:underline">Create one</button>
                  </>
                )}
              </p>
            </>
          ) : (
            /* ── Code entry screen ── */
            <>
              <button
                onClick={() => setScreen("entry")}
                className="flex items-center gap-1 text-muted-foreground hover:text-navy-700 text-sm mb-8 transition-colors"
              >
                ← Back
              </button>

              <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center mb-6">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M3 4h16v14H3z" stroke="#0F1E3C" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 8h16" stroke="#0F1E3C" strokeWidth="1.5"/>
                  <path d="M7 12h2M13 12h2M7 15h2M13 15h2" stroke="#0F1E3C" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>

              <h1 className="text-2xl font-serif font-bold text-navy-900 mb-2">
                Check your email
              </h1>
              <p className="text-muted-foreground text-sm mb-2">
                We sent a 4-digit code to
              </p>
              <p className="text-navy-900 font-semibold text-sm mb-8">{email}</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {/* 4-box code input */}
              <div className="flex gap-3 justify-center mb-8">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={codeRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCodeKey(idx, e)}
                    onFocus={(e) => e.target.select()}
                    disabled={busy}
                    className={`w-14 h-16 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all
                      ${digit ? "border-navy-700 bg-navy-50 text-navy-900" : "border-input bg-white text-navy-900"}
                      ${busy ? "opacity-50 cursor-not-allowed" : "focus:border-navy-700 focus:ring-2 focus:ring-navy-200"}
                    `}
                  />
                ))}
              </div>

              {busy && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-4">
                  <div className="w-4 h-4 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </div>
              )}

              <button
                onClick={() => handleVerifyCode()}
                disabled={code.join("").length < 4 || busy}
                className="w-full bg-navy-900 text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-navy-800 disabled:opacity-50 transition-colors mb-6"
              >
                Verify Code
              </button>

              <p className="text-center text-muted-foreground text-xs">
                Didn't receive a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || busy}
                  className="text-navy-700 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </button>
              </p>
              <p className="text-center text-muted-foreground text-xs mt-2">
                Wrong email?{" "}
                <button onClick={() => setScreen("entry")} className="text-navy-700 font-medium hover:underline">
                  Go back
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
