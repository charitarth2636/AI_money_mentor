"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchWithAuth } from "@/lib/api";

interface MonthData {
  month: string;
  income: number;
  expense: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0e1117]/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm font-semibold" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: ₹{Number(entry.value).toLocaleString("en-IN")}
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-slate-400">
            Surplus: ₹{(payload[0].value - payload[1].value).toLocaleString("en-IN")}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function FinanceMultiChart({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchCashflow = async () => {
      try {
        const res = await fetchWithAuth("/cashflow");
        if (res.ok) {
          const result = await res.json();
          const { income, expenses, months } = result.data || { income: [], expenses: [], months: [] };

          const anyReal = income.some((val: number) => val > 0) || expenses.some((val: number) => val > 0);
          setHasRealData(anyReal);

          const mapped = months.map((m: string, i: number) => ({
            month: m,
            income: income[i] || 0,
            expense: expenses[i] || 0,
          }));
          setData(mapped);
        }
      } catch (e) {
        console.error("Cashflow fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCashflow();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-80 relative">
      {!hasRealData && (
        <div className="absolute top-2 right-2 text-[10px] text-slate-500 bg-white/5 rounded-lg px-2 py-1">
          Add transactions to see real cashflow
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12, opacity: 0.5 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 11, opacity: 0.5 }}
            tickFormatter={(v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 2 }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "16px", fontSize: "12px", fontWeight: "bold" }} />
          <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2.5}
            fill="url(#incomeGrad)" dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2.5}
            fill="url(#expenseGrad)" dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}