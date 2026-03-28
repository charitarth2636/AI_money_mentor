"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

type Props = {
  id: string;
  title: string;
  current: number;
  target: number;
  onRefresh?: () => void;
};

export default function GoalCard({ id, title, current, target, onRefresh }: Props) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({ title, current: String(current), target: String(target) });

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/goals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title,
          current: parseFloat(form.current) || 0,
          target:  parseFloat(form.target)  || 0,
        }),
      });
      if (res.ok) { setEditing(false); onRefresh?.(); }
    } finally { setSaving(false); }
  };

  const deleteGoal = async () => {
    setDeleting(true);
    try {
      const res = await fetchWithAuth(`/goals/${id}`, { method: "DELETE" });
      if (res.ok) { onRefresh?.(); }
    } finally { setDeleting(false); }
  };

  const required12m = target > 0 ? Math.round((target - current) / 12) : 0;

  return (
    <div className="p-0 bg-transparent group">
      {editing ? (
        /* ── EDIT MODE ── */
        <div className="space-y-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Goal title"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Current (₹)</label>
              <input
                type="number"
                value={form.current}
                onChange={e => setForm(f => ({ ...f, current: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Target (₹)</label>
              <input
                type="number"
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-600/30 text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-600/50 transition"
            >
              <Check size={13} /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-white/5 text-slate-400 rounded-xl text-xs font-bold hover:bg-white/10 transition"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        /* ── VIEW MODE ── */
        <>
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate">{title}</h3>
              <p className="text-[11px] font-medium mt-0.5 text-slate-400">
                ₹{current.toLocaleString("en-IN")}
                <span className="opacity-40 mx-1">/</span>
                ₹{target.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {Math.round(percentage)}%
              </span>
              {/* Actions — visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setEditing(true); setConfirmDel(false); }}
                  className="p-1 bg-indigo-500/15 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition"
                  title="Edit goal"
                >
                  <Pencil size={12} />
                </motion.button>

                {confirmDel ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={deleteGoal}
                      disabled={deleting}
                      className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold hover:bg-rose-500/40"
                    >
                      {deleting ? "..." : "Delete?"}
                    </button>
                    <button onClick={() => setConfirmDel(false)} className="text-slate-500 hover:text-slate-300">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setConfirmDel(true)}
                    className="p-1 bg-rose-500/15 text-rose-400 rounded-lg hover:bg-rose-500/30 transition"
                    title="Delete goal"
                  >
                    <Trash2 size={12} />
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="bg-indigo-500 h-full rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {percentage >= 100 ? "Goal Reached! 🎉" : "Keep going"}
            </p>
            {percentage < 100 && required12m > 0 && (
              <p className="text-[10px] text-slate-500">
                ~₹{required12m.toLocaleString("en-IN")}/mo to finish in 1yr
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}