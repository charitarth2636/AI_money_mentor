"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Camera, Bell, Briefcase, Calendar, Trash2,
  Save, Check, Sparkles, Target, Home, Coins,
  GraduationCap, Globe, PieChart, Shield, Landmark, ArrowUpRight
} from "lucide-react";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}as const;

export default function ProfilePage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPulse, setShowSavedPulse] = useState(false);
  const [riskValue, setRiskValue] = useState(70);

  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    whatsapp: true
  });

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    monthlyIncome: "",
    monthlyExpense: "",
    savings: "",
    investments: "",
    debt: "",
    goal: "Buying a Flat",
    experience: "Mid"
  });

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://127.0.0.1:8000/api/profile", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.status === "success") {
          const prof = result.data;
          setFormData({
            fullName: prof.full_name || "",
            age: prof.age?.toString() || "",
            monthlyIncome: prof.monthly_income?.toString() || "",
            monthlyExpense: prof.monthly_expenses?.toString() || "",
            savings: prof.savings_emergency_fund?.toString() || "",
            investments: prof.mutual_funds_stocks?.toString() || "",
            debt: prof.total_debt?.toString() || "",
            goal: prof.financial_goals?.[0]?.title || "Buying a Flat",
            experience: "Mid"
          });
          // Map risk tolerance string back to slider value
          if (prof.risk_tolerance === "low") setRiskValue(20);
          else if (prof.risk_tolerance === "high") setRiskValue(80);
          else setRiskValue(50);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          age: parseInt(formData.age) || 0,
          monthly_income: parseFloat(formData.monthlyIncome) || 0,
          monthly_expenses: parseFloat(formData.monthlyExpense) || 0,
          savings_emergency_fund: parseFloat(formData.savings) || 0,
          mutual_funds_stocks: parseFloat(formData.investments) || 0,
          total_debt: parseFloat(formData.debt) || 0,
          risk_tolerance: getRiskLabel(riskValue).toLowerCase(),
          financial_goals: [{
            title: formData.goal,
            target: 0,
            current: 0,
            priority: 1
          }]
        })
      });
      if (res.ok) {
        setShowSavedPulse(true);
        setTimeout(() => setShowSavedPulse(false), 2000);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskLabel = (val: number) => {
    if (val < 30) return "Conservative";
    if (val < 70) return "Balanced";
    return "Aggressive";
  };

  if (!mounted) return null;

  const isDark = theme === "dark";

  const s = {
    card: isDark
      ? "bg-[#0B0F1A]/80 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden"
      : "bg-white border-slate-200 shadow-sm",
    input: isDark
      ? "bg-black/40 border-white/5 text-white focus:border-indigo-500/50 shadow-inner"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500",
    label: "text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2 block",
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8 pb-32 px-4 pt-4"
    >
      {/* 1. HEADER */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          Profile Settings <Sparkles className="text-indigo-500" size={24} />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage your Indian financial identity and AI mentor preferences.</p>
      </motion.div>

      {/* 2. PERSONAL IDENTITY */}
      <motion.section variants={itemVariants} whileHover={{ y: -4 }} className={`${s.card} rounded-[2.5rem] border p-8 transition-shadow hover:shadow-indigo-500/5`}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <motion.div whileHover={{ scale: 1.05 }} className="w-28 h-28 rounded-3xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-600/20">
              {formData.fullName ? formData.fullName.split(' ').map(n => n[0] || '').join('').substring(0, 2) : <User size={48} />}
            </motion.div>
            <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer border-2 border-dashed border-white/30">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={s.label}><User size={12} className="inline mr-1" /> Full Name</label>
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={`w-full p-4 rounded-2xl outline-none border transition-all ${s.input}`} />
            </div>
            <div>
              <label className={s.label}><Calendar size={12} className="inline mr-1" /> Age</label>
              <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className={`w-full p-4 rounded-2xl outline-none border transition-all ${s.input}`} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. FINANCIAL CORE */}
      <motion.section variants={itemVariants} whileHover={{ y: -4 }} className={`${s.card} rounded-[2.5rem] border p-8 space-y-8`}>
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
          <Briefcase size={20} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial Mission</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={s.label}>Monthly Income (₹)</label>
            <input type="text" value={formData.monthlyIncome} onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border font-mono ${s.input}`} />
          </div>
          <div>
            <label className={s.label}>Avg. Monthly Expense (₹)</label>
            <input type="text" value={formData.monthlyExpense} onChange={(e) => setFormData({...formData, monthlyExpense: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border font-mono ${s.input}`} />
          </div>
          <div>
            <label className={s.label}>Current Savings (₹)</label>
            <input type="text" value={formData.savings} onChange={(e) => setFormData({...formData, savings: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border font-mono ${s.input}`} />
          </div>
          <div>
            <label className={s.label}>Total Investments (₹)</label>
            <input type="text" value={formData.investments} onChange={(e) => setFormData({...formData, investments: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border font-mono ${s.input}`} />
          </div>
          <div className="md:col-span-2">
            <label className={s.label}>Total Outstanding Debt (₹)</label>
            <input type="text" value={formData.debt} onChange={(e) => setFormData({...formData, debt: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border font-mono ${s.input}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {[
            { id: "Buying a Flat", icon: <Home size={18} />, label: "Own Home" },
            { id: "Retirement (Fire)", icon: <Coins size={18} />, label: "Early Fire" },
            { id: "Child's Education", icon: <GraduationCap size={18} />, label: "Education" },
            { id: "International Travel", icon: <Globe size={18} />, label: "Travel" },
          ].map((goal) => (
            <motion.button 
              key={goal.id} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormData({ ...formData, goal: goal.id })} 
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-3 ${formData.goal === goal.id ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/10" : isDark ? "border-white/5 bg-black/20" : "border-slate-200 bg-slate-50"}`}
            >
              <div className={`p-2 rounded-xl transition-all ${formData.goal === goal.id ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500"}`}>{goal.icon}</div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${formData.goal === goal.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}>{goal.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* 4. AI MENTOR MODE */}
      <motion.section variants={itemVariants} whileHover={{ y: -4 }} className={`${s.card} rounded-[2.5rem] border p-8 space-y-8`}>
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
          <PieChart size={20} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Mentorship Mode</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <label className={s.label}>Risk Appetite</label>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={getRiskLabel(riskValue)}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full uppercase"
                >
                  {getRiskLabel(riskValue)}
                </motion.span>
              </AnimatePresence>
            </div>
            <input 
              type="range" 
              value={riskValue}
              onChange={(e) => setRiskValue(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
            />
          </div>
          <div className="space-y-3">
            <label className={s.label}>Mentor Persona</label>
            <div className="relative">
              <select className={`w-full p-4 rounded-2xl outline-none border appearance-none transition-all ${s.input}`}>
                <option>Friendly Coach (Balanced)</option>
                <option>Strict Accountant (Aggressive Saving)</option>
                <option>Market Expert (Technical Advice)</option>
              </select>
              <ArrowUpRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* 5. LINKED SOURCES */}
      <motion.section variants={itemVariants} whileHover={{ y: -4 }} className={`${s.card} rounded-[2.5rem] border p-8`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><Shield size={20} className="text-emerald-500" /><h3 className="text-lg font-bold text-slate-900 dark:text-white">Linked Sources</h3></div>
        </div>
        <div className="flex flex-wrap gap-4">
          {['HDFC Bank', 'Zerodha', 'Groww'].map((name) => (
            <motion.div 
              key={name} 
              whileHover={{ scale: 1.05 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-xs font-bold dark:text-slate-200">{name}</span>
            </motion.div>
          ))}
          <motion.button whileHover={{ scale: 1.05 }} className="px-5 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-xs font-bold hover:border-indigo-500 transition-all">+ Add Account</motion.button>
        </div>
      </motion.section>

      {/* 6. COMMUNICATION (Notification Toggles) */}
      <motion.section variants={itemVariants} whileHover={{ y: -4 }} className={`${s.card} rounded-[2.5rem] border p-8 space-y-6`}>
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
          <Bell size={20} className="text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Communication</h3>
        </div>
        <div className="grid gap-3">
          {[
            { id: 'push', label: 'In-App Notifications', desc: 'Real-time alerts for large expenses', state: notifications.push },
            { id: 'whatsapp', label: 'WhatsApp Intelligence', desc: 'Weekly AI summaries & investment tips', state: notifications.whatsapp },
            { id: 'email', label: 'Email Reports', desc: 'Monthly tax and net-worth breakdown', state: notifications.email }
          ].map((n) => (
            <div key={n.id} className={`flex items-center justify-between p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{n.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
              </div>
              <button 
                onClick={() => setNotifications({...notifications, [n.id as keyof typeof notifications]: !n.state})} 
                className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${n.state ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-white/10'}`}
              >
                <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 30 }} animate={{ x: n.state ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 7. DANGER ZONE */}
      <motion.section variants={itemVariants} className="p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-rose-500 font-black flex items-center justify-center md:justify-start gap-2 text-sm uppercase tracking-widest"><Trash2 size={16} /> Data Sovereignty</h3>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">All linked bank data and AI history will be purged. Irreversible.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-8 py-3 bg-white dark:bg-black border border-rose-500/30 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Wipe All Data</motion.button>
      </motion.section>

      {/* FLOATING ACTION BAR */}
      <div className="fixed bottom-10 right-10 z-50">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring" }}
          onClick={handleSave}
          disabled={isSaving}
          className={`relative flex items-center gap-3 px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-95
            ${showSavedPulse ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/40'}`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : showSavedPulse ? (
            <><Check size={18} className="animate-bounce" /> Preferences Synced</>
          ) : (
            <><Save size={18} /> Update Profile</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}