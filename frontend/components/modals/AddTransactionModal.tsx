"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, TrendingUp, TrendingDown, Tag, Calendar, FileText } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  isDark: boolean;
}

const CATEGORIES = {
  income: ["Salary", "Freelance", "Business", "Rental", "Investment Returns", "Other Income"],
  expense: ["Food & Dining", "Rent/EMI", "Transport", "Shopping", "Utilities", "Healthcare", "Entertainment", "Education", "Insurance", "Other"],
};

export default function AddTransactionModal({ onClose, onSaved, isDark }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendCategories, setBackendCategories] = useState<any>(null);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetchWithAuth("/transactions/categories");
        if (res.ok) {
          const result = await res.json();
          setBackendCategories(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, []);

  const activeCategories = backendCategories 
    ? backendCategories[type] 
    : CATEGORIES[type];

  const handleSave = async () => {
    if (!amount || !category) {
      setError("Amount aur Category required hai.");
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Valid amount enter karein.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/transactions/", {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description,
          date: new Date(date).toISOString(),
          type,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved();
      onClose();
    } catch {
      setError("Transaction save nahi hui. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const glass = isDark
    ? "bg-[#0e1117] border-white/10 text-slate-200"
    : "bg-white border-slate-200 text-slate-800";

  const inputCls = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/60"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`w-full max-w-md rounded-3xl border shadow-2xl p-7 space-y-5 ${glass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Add Transaction</h2>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex rounded-2xl overflow-hidden border border-white/10">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(""); }}
                className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  type === t
                    ? t === "income"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full pl-8 pr-4 py-3 rounded-2xl border outline-none text-lg font-bold transition-all ${inputCls}`}
            />
          </div>

          {/* Category */}
          <div className="relative">
            <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all appearance-none ${inputCls}`}
            >
              <option value="" className={isDark ? "bg-[#0e1117] text-white" : "bg-white text-slate-900"}>
                Select Category
              </option>
              {activeCategories.map((c: string) => (
                <option 
                  key={c} 
                  value={c} 
                  className={isDark ? "bg-[#0e1117] text-white" : "bg-white text-slate-900"}
                >
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="relative">
            <FileText size={14} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all ${inputCls}`}
            />
          </div>

          {/* Date */}
          <div className="relative">
            <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all ${inputCls}`}
            />
          </div>

          {error && (
            <p className="text-sm text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl">{error}</p>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              type === "income"
                ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
            } disabled:opacity-50`}
          >
            <Plus size={16} />
            {saving ? "Saving..." : "Save Transaction"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
