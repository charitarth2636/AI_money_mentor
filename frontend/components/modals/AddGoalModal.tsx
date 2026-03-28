"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Target, DollarSign } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  isDark: boolean;
}

const GOAL_PRESETS = [
  { label: "Emergency Fund", amount: 300000 },
  { label: "New Car", amount: 1500000 },
  { label: "New House", amount: 5000000 },
  { label: "Vacation", amount: 200000 },
  { label: "iPhone / Laptop", amount: 100000 },
  { label: "Wedding", amount: 1000000 },
  { label: "Custom", amount: 0 },
];

export default function AddGoalModal({ onClose, onSaved, isDark }: Props) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentSaved, setCurrentSaved] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: { label: string; amount: number }) => {
    if (preset.label !== "Custom") {
      setTitle(preset.label);
      setTargetAmount(preset.amount.toString());
    } else {
      setTitle("");
      setTargetAmount("");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("Goal ka naam likhein."); return; }
    if (!targetAmount || Number(targetAmount) <= 0) { setError("Valid target amount enter karein."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/goals/", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          target: parseFloat(targetAmount),
          current: parseFloat(currentSaved) || 0,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved();
      onClose();
    } catch {
      setError("Goal save nahi hua. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const glass = isDark
    ? "bg-[#0e1117] border-white/10 text-slate-200"
    : "bg-white border-slate-200 text-slate-800";

  const inputCls = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/60"
    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400";

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
            <div className="flex items-center gap-2">
              <Target size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold">Add Financial Goal</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition">
              <X size={18} />
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    title === p.label && p.label !== "Custom"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : isDark
                      ? "border-white/10 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400"
                      : "border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Name */}
          <input
            type="text"
            placeholder="Goal name (e.g. New Car, Vacation)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${inputCls}`}
          />

          {/* Target Amount */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Target amount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className={`w-full pl-8 pr-4 py-3 rounded-2xl border outline-none font-bold transition-all ${inputCls}`}
            />
          </div>

          {/* Already Saved */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Already saved (default: 0)"
              value={currentSaved}
              onChange={(e) => setCurrentSaved(e.target.value)}
              className={`w-full pl-8 pr-4 py-3 rounded-2xl border outline-none transition-all ${inputCls}`}
            />
          </div>

          {/* Progress Preview */}
          {targetAmount && Number(targetAmount) > 0 && (
            <div className="rounded-2xl p-3 bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex justify-between text-xs text-indigo-400 mb-1.5">
                <span>Progress</span>
                <span>{Math.min(Math.round((Number(currentSaved) / Number(targetAmount)) * 100), 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((Number(currentSaved) / Number(targetAmount)) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            {saving ? "Saving..." : "Create Goal"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
