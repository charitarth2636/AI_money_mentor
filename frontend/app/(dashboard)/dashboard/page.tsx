"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Zap, Wallet, TrendingUp, Target, ListChecks, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { fetchWithAuth } from "@/lib/api";
import { MessageCircle } from "lucide-react";
// Components
import CategoryTable from "@/components/tables/CategoryTable";
import SummaryCard from "@/components/cards/SummaryCard";
import HealthScore from "@/components/charts/HealthScore";
import GoalCard from "@/components/cards/GoalCard";
import TransactionTable from "@/components/tables/TransactionTable";
import FinanceMultiChart from "@/components/charts/FinanceMultiChart";
import AddTransactionModal from "@/components/modals/AddTransactionModal";
import AddGoalModal from "@/components/modals/AddGoalModal";

export default function DashboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [active, setActive] = useState('1M');
  const [chartKey, setChartKey] = useState(0); // increment to trigger chart re-fetch

  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Prevent Hydration error and Fetch Data
  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [profRes, txRes, goalRes, healthRes] = await Promise.all([
          fetchWithAuth("/profile"),
          fetchWithAuth("/transactions"),
          fetchWithAuth("/goals"),
          fetchWithAuth("/dashboard")
        ]);

        // Profile and health are required, fail if missing
        if (!profRes.ok) throw new Error("Unable to load profile. Please log in again.");

        const profData = await profRes.json();
        setProfile(profData.data);

        // Health score (required)
        if (healthRes.ok) {
          const hData = await healthRes.json();
          setHealthData(hData.data);
        }

        // Transactions and goals are optional - degrade gracefully
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(Array.isArray(txData.data) ? txData.data : []);
        }
        if (goalRes.ok) {
          const goalData = await goalRes.json();
          setGoals(Array.isArray(goalData.data) ? goalData.data : []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refresh transactions, goals, dashboard summary, and chart after any CRUD action
  const refreshTxAndGoals = async () => {
    const [txRes, goalRes, dashRes] = await Promise.all([
      fetchWithAuth("/transactions"),
      fetchWithAuth("/goals"),
      fetchWithAuth("/dashboard"),
    ]);
    if (txRes.ok)   { const d = await txRes.json();   setTransactions(Array.isArray(d.data) ? d.data : []); }
    if (goalRes.ok) { const d = await goalRes.json();  setGoals(Array.isArray(d.data) ? d.data : []); }
    if (dashRes.ok) { const d = await dashRes.json();  setHealthData(d.data); }
    // Increment chartKey to trigger FinanceMultiChart re-fetch
    setChartKey(k => k + 1);
  };

  // Check if current theme is dark
  const isDark = resolvedTheme === "dark";

  // --- THE GRAPHITE THEME LOGIC ---
  const bentoStyle = `
    relative overflow-hidden transition-all duration-300
    ${isDark
      ? "bg-[#1C1F26] border-white/5 shadow-2xl"
      : "bg-white border-slate-200 shadow-sm"}
    border rounded-[24px] p-6 lg:p-8
  `;

  const textMain = isDark ? "text-slate-100" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";

  // If not mounted, return a skeleton or empty div to avoid flicker
  if (!mounted) return <div className="min-h-screen bg-[#121418]" />;

  if (loading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-[#121418]">
           <Zap className="animate-pulse text-indigo-500" size={40} />
        </div>
     );
  }

  if (error || !profile) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#121418] text-white text-center px-6">
           <Target size={48} className="text-indigo-500 mb-6 opacity-80" />
           <p className="text-xl mb-4 text-slate-300 font-bold tracking-tight">Financial Profile Empty</p>
           <p className="text-sm mb-8 text-slate-400 max-w-md leading-relaxed">
             Our upcoming PDF Statement Parser will extract your bank data automatically. Until then, you can open the AI Mentor to manually discuss your finances!
           </p>
           <button onClick={() => window.location.reload()} className="px-8 py-4 bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 rounded-2xl font-bold hover:bg-indigo-500/30 transition-all">
              Refresh Dashboard
           </button>
        </div>
     );
  }

  const investmentTotal = 
    (profile.direct_stocks || 0) + 
    (profile.mutual_funds || 0) + 
    (profile.real_estate || 0) + 
    (profile.physical_gold || 0) + 
    (profile.crypto || 0) + 
    (profile.business_value || 0);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-[#121418]" : "bg-[#F3F4F6]"}`}>
      <main className="relative z-10 max-w-350 mx-auto p-6 lg:p-10 space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-transparent border-b border-slate-800/50 pb-8 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${textMain}`}>Wealth Insight</h1>
              <p className={`text-sm ${textSub}`}>Manage your financial ecosystem</p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={() => router.push("/mentor")}
              className="group relative h-11 px-6 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all duration-300 active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              {/* Animated Shine Effect */}
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full] transition-transform duration-500 ease-in-out" />
              <Zap
                size={16}
                className="relative z-10 group-hover:animate-pulse"
                fill="currentColor"
              />
              <span className="relative z-10">AI Analysis</span>
            </button>
          </div>
        </div>

        {/* 3-COLUMN SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={bentoStyle}>
            <SummaryCard title="Current Liquidity" value={`₹${(profile.savings_emergency_fund || 0).toLocaleString("en-IN")}`} />
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-bold">
              <TrendingUp size={14} /> Available
            </div>
          </div>
          <div className={bentoStyle}>
            {/* Use healthData.monthly_expenses (real transaction data if available) */}
            <SummaryCard title="Monthly Outflow" value={`₹${(healthData?.monthly_expenses ?? profile.monthly_expenses ?? 0).toLocaleString("en-IN")}`} />
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{
                width: `${Math.min(((healthData?.monthly_expenses ?? profile.monthly_expenses ?? 0) / Math.max(healthData?.monthly_income ?? profile.monthly_income ?? 1, 1)) * 100, 100)}%`
              }} />
            </div>
          </div>
          <div className={bentoStyle}>
            <SummaryCard title="Investment Value" value={`₹${investmentTotal.toLocaleString("en-IN")}`} />
            <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Surplus: ₹{(healthData?.surplus ?? 0).toLocaleString("en-IN")}/mo
            </p>
          </div>
        </div>

        {/* ANALYTICS HUB */}
        <div className="grid grid-cols-12 gap-6">

          {/* Main Chart Card */}
          <div className={`${bentoStyle} col-span-12 lg:col-span-8`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-lg font-bold ${textMain}`}>Cashflow Trend</h3>
              <div className="flex p-1 rounded-lg bg-card border border-border">
                {['1W', '1M', '3M'].map((t) => {
                  const isActive = t === active;

                  return (
                    <button
                      key={t}
                      onClick={() => setActive(t)}
                      className={`px-4 py-1.5 text-[11px] hover:scale-105 active:scale-95 font-bold rounded-md transition-all duration-300
          ${isActive
                          ? 'bg-primary  shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                        }
        `}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="h-75 w-full">
              <FinanceMultiChart refreshKey={chartKey} />
            </div>
          </div>

          {/* Health Score Card */}
          <div className={`${bentoStyle} col-span-12 lg:col-span-4 flex flex-col items-center justify-center`}>
            <HealthScore score={healthData?.health_score || 0} />
            <div className="mt-6 text-center">
              <h4 className={`text-xl font-bold ${textMain}`}>{healthData?.health_score || 0}% Efficiency</h4>
              <p className={`text-xs mt-2 ${textSub}`}>Your spending is well within limits.</p>
            </div>
          </div>

          {/* RECENT TRACKING (Transaction Table) */}
          <div className={`${bentoStyle} col-span-12 lg:col-span-7 p-0! `}>
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks size={18} className="text-indigo-400" />
                <h3 className={`font-bold ${textMain}`}>Recent Transactions</h3>
              </div>
              <button
                onClick={() => setShowTxModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all"
              >
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="p-4">
              <TransactionTable transactions={transactions} onRefresh={refreshTxAndGoals} />
            </div>
            {transactions.length > 0 && (
              <div className="px-4 pb-4 border-t border-white/5 mt-2 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Expense Breakdown</p>
                <CategoryTable transactions={transactions} />
              </div>
            )}
          </div>

          {/* GOAL TRACKING */}
          <div className={`${bentoStyle} col-span-12 lg:col-span-5`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-indigo-400" />
                <h3 className={`font-bold ${textMain}`}>Active Goals</h3>
              </div>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all"
              >
                <Plus size={13} /> Add Goal
              </button>
            </div>
            <div className="space-y-8">
              {goals.length === 0 ? (
                 <p className="text-sm text-slate-500">No active goals yet. Add one! 🎯</p>
              ) : (
                 goals.map((g: any) => (
                    <GoalCard key={g.id} id={g.id} title={g.title} current={g.current} target={g.target} onRefresh={refreshTxAndGoals} />
                 ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* MODALS */}
      {showTxModal && (
        <AddTransactionModal
          isDark={isDark}
          onClose={() => setShowTxModal(false)}
          onSaved={refreshTxAndGoals}
        />
      )}
      {showGoalModal && (
        <AddGoalModal
          isDark={isDark}
          onClose={() => setShowGoalModal(false)}
          onSaved={refreshTxAndGoals}
        />
      )}
    </div>
  );
}