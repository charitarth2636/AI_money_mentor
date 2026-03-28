"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Sparkles, Target, RotateCcw, ChevronDown } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  isOldHistory?: boolean;
  isGoalSuggestion?: boolean;
  sessionLabel?: string; // e.g. "Today", "Yesterday", "Mar 25"
}

// ── Quick suggestion chips ──────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { label: "💰 Health Score Check", prompt: "Mera financial health score kitna hai?" },
  { label: "🚗 Car Loan Plan", prompt: "Mujhe 15 lakh ki car leni hai, plan do" },
  { label: "🏠 Emergency Fund", prompt: "Emergency fund kaise banaye?" },
  { label: "📈 SIP vs Lump Sum", prompt: "SIP better hai ya lump sum investment?" },
  { label: "💳 Debt Free Plan", prompt: "Mujhe apna debt kaise clear karna chahiye?" },
  { label: "🎯 Goal Tracker", prompt: "Mere active goals ka status kya hai?" },
];

// ── Session label helper ─────────────────────────────────────────
function getSessionLabel(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Goal extractor from AI reply ────────────────────────────────
function extractGoal(reply: string): { title: string; target: number } | null {
  const goalLine = reply.match(/🔹\s*Goal:\s*(.+)/);
  if (!goalLine) return null;
  const text = goalLine[1];
  let target = 0;
  const crore = text.match(/₹?([\d.]+)\s*crore/i);
  const lakh  = text.match(/₹?([\d.]+)\s*lakh/i);
  if (crore) target = parseFloat(crore[1]) * 10_000_000;
  else if (lakh) target = parseFloat(lakh[1]) * 100_000;
  if (target <= 0) return null;
  const titleMatch = text.match(/^([^—₹\n]+)/);
  return { title: titleMatch?.[1]?.trim() || "Financial Goal", target };
}

export default function MentorPage() {
  const { theme } = useTheme();
  const [mounted, setMounted]       = useState(false);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [isTyping, setIsTyping]     = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasOldHistory, setHasOldHistory] = useState(false);
  const [showOldHistory, setShowOldHistory] = useState(false);
  const [goalSuggestion, setGoalSuggestion] = useState<{ title: string; target: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Load chat history ────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const load = async () => {
      try {
        const res = await fetchWithAuth("/chat_history");
        if (res.ok) {
          const data = await res.json();
          const docs = data.data || [];

          // Welcome message (always first)
          const welcome: Message = {
            role: "assistant",
            content: "Namaste! 👋 I'm your AI Money Mentor.\n\nAsk me anything in **English** or **Hinglish** — I'll reply in the same language.\n\nTry one of the quick options below, or type your own question!",
            timestamp: new Date(),
          };

          if (docs.length === 0) {
            setMessages([welcome]);
          } else {
            // Build history messages with session labels
            const hist: Message[] = [];
            let lastLabel = "";
            for (const doc of docs) {
              const ts = doc.timestamp ? new Date(doc.timestamp) : new Date();
              const label = getSessionLabel(ts);
              const sessionLabel = label !== lastLabel ? label : undefined;
              lastLabel = label;
              hist.push({ role: "user",      content: doc.user_msg, timestamp: ts, isOldHistory: true, sessionLabel });
              hist.push({ role: "assistant", content: doc.ai_reply, timestamp: ts, isOldHistory: true });
            }
            setHasOldHistory(true);
            setMessages([welcome, ...hist]);
          }
        }
      } catch {
        setMessages([{
          role: "assistant",
          content: "Namaste! 👋 I'm your AI Money Mentor. Ask me anything in English or Hinglish!",
          timestamp: new Date(),
        }]);
      } finally {
        setHistoryLoaded(true);
      }
    };
    load();
  }, [mounted]);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput("");
    setGoalSuggestion(null);
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setIsTyping(true);
    try {
      const res  = await fetchWithAuth("/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      const data = await res.json();
      const reply = data.reply || "Sorry, couldn't process that. Try again.";
      const detected = extractGoal(reply);
      if (detected) setGoalSuggestion(detected);
      setMessages(prev => [...prev, {
        role: "assistant", content: reply, timestamp: new Date(),
        isGoalSuggestion: !!detected,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Connection error. Please check the backend is running.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Add goal from chat ───────────────────────────────────────
  const addGoalFromChat = async () => {
    if (!goalSuggestion) return;
    try {
      const res = await fetchWithAuth("/goals/", {
        method: "POST",
        body: JSON.stringify({ title: goalSuggestion.title, target: goalSuggestion.target, current: 0 }),
      });
      if (res.ok) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `✅ Goal **"${goalSuggestion.title}"** (₹${goalSuggestion.target.toLocaleString("en-IN")}) added to your Active Goals on the Dashboard!`,
          timestamp: new Date(),
        }]);
        setGoalSuggestion(null);
      }
    } catch { /* silent */ }
  };

  // ── New Chat ─────────────────────────────────────────────────
  const startNewChat = () => {
    setMessages([{
      role: "assistant",
      content: "Namaste! 👋 New chat session shuru ho gayi!\n\nKya poochna hai aapko?",
      timestamp: new Date(),
    }]);
    setGoalSuggestion(null);
    setShowOldHistory(false);
  };

  if (!mounted) return null;
  const isDark = theme === "dark";

  // ── Visible messages filter ──────────────────────────────────
  const visibleMessages = showOldHistory
    ? messages
    : messages.filter(m => !m.isOldHistory);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col w-full max-w-4xl mx-auto h-[85vh]"
    >
      <div className={`relative flex flex-col h-full rounded-[2.5rem] border overflow-hidden transition-all duration-700 ${
        isDark ? "bg-[#0B0F1A]/70 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.1)]"
               : "bg-white/90 border-slate-200 shadow-2xl"
      }`}>

        {/* ── HEADER ── */}
        <div className={`p-5 flex items-center justify-between border-b flex-shrink-0 ${
          isDark ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/50"
        }`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div whileHover={{ rotate: 15 }} className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/40">
                <Bot className="text-white w-6 h-6" />
              </motion.div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#0B0F1A] rounded-full" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>Money Mentor ✨</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em]">Active Now</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Show old history toggle */}
            {hasOldHistory && (
              <button
                onClick={() => setShowOldHistory(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  showOldHistory
                    ? "bg-indigo-600/30 text-indigo-400 border-indigo-500/40"
                    : isDark ? "text-slate-400 border-white/10 hover:border-indigo-500/40" : "text-slate-500 border-slate-200 hover:border-indigo-400"
                }`}
              >
                <ChevronDown size={13} className={`transition-transform ${showOldHistory ? "rotate-180" : ""}`} />
                {showOldHistory ? "Hide" : "Past Chats"}
              </button>
            )}
            {/* New Chat */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startNewChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                isDark ? "text-slate-400 border-white/10 hover:border-indigo-500/40 hover:text-indigo-400"
                       : "text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              <RotateCcw size={13} /> New Chat
            </motion.button>
            <motion.div animate={{ rotate: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Sparkles size={20} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
            </motion.div>
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {!historyLoaded && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {visibleMessages.map((msg, idx) => (
              <motion.div key={idx}>
                {/* ── Session label (date divider) ── */}
                {msg.sessionLabel && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                      {msg.sessionLabel}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} ${msg.isOldHistory ? "opacity-70" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-indigo-600/10 text-indigo-500 border border-indigo-500/20"
                      : "bg-slate-800 text-white"
                  }`}>
                    {msg.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
                  </div>

                  <div className="flex flex-col gap-2 max-w-[78%]">
                    <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "assistant"
                        ? isDark ? "bg-[#161B29] border border-white/10 text-slate-200 rounded-tl-none"
                                 : "bg-slate-100 text-slate-800 rounded-tl-none"
                        : "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20"
                    }`}>
                      {msg.content}
                      <span className={`block text-[10px] mt-2 font-medium opacity-40 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Goal quick-add button */}
                    {msg.role === "assistant" && msg.isGoalSuggestion && goalSuggestion && (
                      <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={addGoalFromChat}
                        className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all"
                      >
                        <Target size={12} /> Add "{goalSuggestion.title}" to Goals
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* ── Typing indicator ── */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                  <Bot size={18} className="text-indigo-500" />
                </div>
                <div className={`px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 ${isDark ? "bg-[#161B29]" : "bg-slate-100"}`}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                      className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Quick suggestion chips (shown only when last message is welcome & no typing) ── */}
          {historyLoaded && !isTyping && visibleMessages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2 mt-2"
            >
              {QUICK_SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => sendMessage(s.prompt)}
                  className={`px-3 py-2 text-xs font-bold rounded-2xl border transition-all ${
                    isDark
                      ? "bg-white/5 border-white/10 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                >
                  {s.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── INPUT BAR ── */}
        <div className={`p-5 border-t flex-shrink-0 ${isDark ? "border-white/10" : "border-slate-100"}`}>
          <div className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isTyping && sendMessage(input)}
              placeholder="English ya Hinglish mein poochho..."
              className={`w-full p-4 pr-16 rounded-2xl outline-none transition-all border-2 text-sm ${
                isDark
                  ? "bg-white/5 border-white/5 text-white placeholder:text-slate-600 focus:border-indigo-500/40"
                  : "bg-slate-50 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/40"
              }`}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-indigo-600/20"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}