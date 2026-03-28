"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Check, X, TrendingUp, TrendingDown } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

type Transaction = {
  id: string;
  category: string;
  description?: string;
  amount: number;
  type: string;
  date?: string;
};

interface Props {
  transactions?: Transaction[];
  onRefresh?: () => void;
}

const CATEGORIES = {
  income:  ["Salary", "Freelance", "Business", "Rental", "Investment Returns", "Other Income"],
  expense: ["Food & Dining", "Rent/EMI", "Transport", "Shopping", "Utilities",
            "Healthcare", "Entertainment", "Education", "Insurance", "Other"],
};

export default function TransactionTable({ transactions = [], onRefresh }: Props) {
  const [editId, setEditId]         = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<Partial<Transaction>>({});
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const startEdit = (tx: Transaction) => {
    setEditId(tx.id);
    setEditForm({ amount: tx.amount, category: tx.category, type: tx.type, description: tx.description });
    setConfirmDel(null);
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const saveEdit = async (tx: Transaction) => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/transactions/${tx.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setEditId(null); onRefresh?.(); }
    } finally { setSaving(false); }
  };

  const deleteTx = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetchWithAuth(`/transactions/${id}`, { method: "DELETE" });
      if (res.ok) { setConfirmDel(null); onRefresh?.(); }
    } finally { setDeleting(null); }
  };

  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No transactions yet — add one using the button above! 💸
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-widest border-b border-slate-200 dark:border-white/10 text-slate-500">
            <th className="pb-3 px-2 font-bold">Category</th>
            <th className="pb-3 px-2 font-bold">Amount</th>
            <th className="pb-3 px-2 font-bold">Type</th>
            <th className="pb-3 px-2 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          <AnimatePresence>
            {transactions.map((tx) => (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="group hover:bg-white/5 transition-colors"
              >
                {editId === tx.id ? (
                  /* ── EDIT ROW ── */
                  <>
                    <td className="py-2 px-2">
                      <select
                        value={editForm.category || ""}
                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                      >
                        {CATEGORIES[(editForm.type as "income" | "expense") || "expense"].map(c => (
                          <option key={c} value={c} className="bg-[#0e1117] text-white">{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={editForm.amount || ""}
                        onChange={e => setEditForm(f => ({ ...f, amount: parseFloat(e.target.value) }))}
                        className="w-24 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={editForm.type || "expense"}
                        onChange={e => setEditForm(f => ({ ...f, type: e.target.value, category: "" }))}
                        className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                      >
                        <option value="income" className="bg-[#0e1117] text-white">income</option>
                        <option value="expense" className="bg-[#0e1117] text-white">expense</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => saveEdit(tx)}
                          disabled={saving}
                          className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/40 transition"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  /* ── NORMAL ROW ── */
                  <>
                    <td className="py-3.5 px-2 font-medium text-slate-200">
                      {tx.category}
                      {tx.description && (
                        <span className="block text-[10px] text-slate-500 font-normal">{tx.description}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-100">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        tx.type === "income"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-rose-500/15 text-rose-400"
                      }`}>
                        {tx.type === "income" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Edit */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => startEdit(tx)}
                          className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </motion.button>

                        {/* Delete — with confirm */}
                        {confirmDel === tx.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteTx(tx.id)}
                              disabled={deleting === tx.id}
                              className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold hover:bg-rose-500/40 transition"
                            >
                              {deleting === tx.id ? "..." : "Confirm"}
                            </button>
                            <button
                              onClick={() => setConfirmDel(null)}
                              className="p-1 text-slate-500 hover:text-slate-300"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setConfirmDel(tx.id)}
                            className="p-1.5 bg-rose-500/15 text-rose-400 rounded-lg hover:bg-rose-500/30 transition"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}