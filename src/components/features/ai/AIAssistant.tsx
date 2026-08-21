import React, { useState } from "react";
import { BusinessPlan, ResearchItem } from "@/types/businessPlan";
import { generateId } from "@/lib/storage";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const AI_RESPONSES: Record<string, string[]> = {
  explain: [
    "Happy to explain that differently. Think of it this way: every section of a business plan answers a specific question a reader might have. This particular section answers the question from the perspective of someone evaluating your business for the first time.",
    "Let me break that down more simply. The core idea here is that you're demonstrating to any reader that you understand your market — not just that you believe in your product.",
  ],
  example: [
    "Here's another example. Imagine a small artisan bakery launching in a mid-size city. For their market analysis, they wouldn't just say 'people love bread.' They'd show: there are 180,000 residents within 10km, premium bakery spending is growing at 6% annually, and three nearby competitors have 4.2-star reviews with consistent complaints about limited opening hours — an opportunity they can address.",
    "Consider a B2B software company targeting HR departments. Their positioning might be: 'We serve mid-market companies (50–500 employees) that have outgrown spreadsheets but can't afford enterprise HR systems. Unlike [Competitor], we include onboarding support in the base price.'",
  ],
  think: [
    "Let's think through this together. Start with what you know for certain, then identify what you're assuming. For the parts that are assumptions, ask yourself: what would change your answer? That usually points to what you need to research.",
    "A useful approach here is to work backwards. Imagine your finished business plan is in front of a bank manager. What question would they ask about this section? Your answer should anticipate that question.",
  ],
  review: [
    "Looking at what you've written, the core message is clear. A few things to consider: Are the specific numbers traceable to a source? If someone asked 'how do you know that?', would you have an answer? If not, flag those as research items.",
    "Your draft reads well. The main area to strengthen is specificity — concrete numbers, named competitors, defined geographies. Vague language like 'growing market' or 'many customers' weakens your credibility. Wherever possible, attach a figure.",
  ],
  default: [
    "That's a useful question to ask at this stage. The most important thing to remember is that your business plan reflects your thinking — AI can help you organise and express it, but only you can provide the underlying facts and assumptions.",
    "Good point. One thing worth noting: if you're unsure about any answer, use the 'I need to research this' option. It's far better to mark something as requiring research than to provide a figure you've invented.",
  ],
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("explain") || lower.includes("what does") || lower.includes("what is") || lower.includes("mean"))
    return AI_RESPONSES.explain[Math.floor(Math.random() * AI_RESPONSES.explain.length)];
  if (lower.includes("example") || lower.includes("show me"))
    return AI_RESPONSES.example[Math.floor(Math.random() * AI_RESPONSES.example.length)];
  if (lower.includes("think") || lower.includes("help me") || lower.includes("how should"))
    return AI_RESPONSES.think[Math.floor(Math.random() * AI_RESPONSES.think.length)];
  if (lower.includes("review") || lower.includes("improve") || lower.includes("check"))
    return AI_RESPONSES.review[Math.floor(Math.random() * AI_RESPONSES.review.length)];
  return AI_RESPONSES.default[Math.floor(Math.random() * AI_RESPONSES.default.length)];
}

const QUICK_ACTIONS = [
  { label: "Explain this differently", key: "explain" },
  { label: "Give me another example", key: "example" },
  { label: "Help me think through my answer", key: "think" },
  { label: "Review what I wrote", key: "review" },
];

interface AIAssistantProps {
  plan: BusinessPlan;
  currentPhase: string;
  currentTopic: string;
  onClose: () => void;
}

export default function AIAssistant({ plan, currentPhase, currentTopic, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: `I can help you think through this section, explain concepts differently, provide examples, or review what you've written. I won't invent facts for your plan — everything I assist with is to help you express and develop your own information.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: AIMessage = { id: generateId(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = getAIResponse(content);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: "assistant", content: response },
      ]);
      setLoading(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <div className="bg-white border-l border-border h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-navy-900 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <p className="font-semibold text-sm">AI Assist</p>
            <p className="text-navy-400 text-xs">Helps you think — doesn't write for you</p>
          </div>
        </div>
        <button onClick={onClose} className="text-navy-400 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* AI rules notice */}
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
        <p className="text-amber-800 text-xs leading-relaxed">
          <strong>Important:</strong> AI suggestions are not automatically saved as business plan facts. You must review, adjust, and accept any content you want to use.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 bg-navy-900 rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <span className="text-xs">✨</span>
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-navy-900 text-white rounded-br-sm"
                  : "bg-muted text-navy-800 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-6 h-6 bg-navy-900 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs">✨</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-navy-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.key}
              onClick={() => sendMessage(action.label)}
              disabled={loading}
              className="text-left text-xs font-medium text-navy-700 bg-muted hover:bg-navy-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask anything about this section..."
            className="flex-1 border border-input px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-navy-700"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-navy-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
