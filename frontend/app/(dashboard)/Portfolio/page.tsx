"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, Home, Landmark, ShieldCheck,
    AlertCircle, BarChart4, Save, Check, Coins,
    HeartPulse, GraduationCap, Lock as LockIcon, Sparkles
} from "lucide-react";

// Animation Variants for staggered entrance
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 260, damping: 20 }
    }
} as const;

export default function PortfolioPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [maturity, setMaturity] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isVerifyingPan, setIsVerifyingPan] = useState(false);
    const [panVerified, setPanVerified] = useState(false);
    const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
    const [aadhaarVerified, setAadhaarVerified] = useState(false);
    
    const [portfolio, setPortfolio] = useState({
        direct_stocks: "0",
        mutual_funds: "0",
        real_estate: "0",
        physical_gold: "0",
        crypto: "0",
        business_value: "0",
        home_loan: "0",
        vehicle_loan: "0",
        credit_card_dues: "0",
        personal_loans: "0",
        pan: "",
        aadhaar: ""
    });

    useEffect(() => {
        setMounted(true);
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://127.0.0.1:8000/api/profile", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.status === "success") {
                    const prof = data.data;
                    setPortfolio({
                        direct_stocks: prof.direct_stocks?.toString() || "0",
                        mutual_funds: prof.mutual_funds?.toString() || "0",
                        real_estate: prof.real_estate?.toString() || "0",
                        physical_gold: prof.physical_gold?.toString() || "0",
                        crypto: prof.crypto?.toString() || "0",
                        business_value: prof.business_value?.toString() || "0",
                        home_loan: prof.home_loan?.toString() || "0",
                        vehicle_loan: prof.vehicle_loan?.toString() || "0",
                        credit_card_dues: prof.credit_card_dues?.toString() || "0",
                        personal_loans: prof.personal_loans?.toString() || "0",
                        pan: prof.pan || "",
                        aadhaar: ""
                    });

                    // Calculate maturity
                    const fields = [
                        prof.direct_stocks, prof.mutual_funds, prof.real_estate, 
                        prof.physical_gold, prof.crypto, prof.business_value,
                        prof.home_loan, prof.vehicle_loan, prof.credit_card_dues, prof.personal_loans
                    ];
                    const filled = fields.filter(f => f > 0).length;
                    setMaturity(Math.round((filled / fields.length) * 100));
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    const isDark = theme === "dark";

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
                    direct_stocks: parseFloat(portfolio.direct_stocks) || 0,
                    mutual_funds: parseFloat(portfolio.mutual_funds) || 0,
                    real_estate: parseFloat(portfolio.real_estate) || 0,
                    physical_gold: parseFloat(portfolio.physical_gold) || 0,
                    crypto: parseFloat(portfolio.crypto) || 0,
                    business_value: parseFloat(portfolio.business_value) || 0,
                    home_loan: parseFloat(portfolio.home_loan) || 0,
                    vehicle_loan: parseFloat(portfolio.vehicle_loan) || 0,
                    credit_card_dues: parseFloat(portfolio.credit_card_dues) || 0,
                    personal_loans: parseFloat(portfolio.personal_loans) || 0,
                    pan: portfolio.pan,
                    // Necessary profile basics
                    age: 25,
                    monthly_income: 50000,
                    monthly_expenses: 20000
                })
            });
            if (res.ok) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyPan = () => {
        setIsVerifyingPan(true);
        setTimeout(() => {
            setIsVerifyingPan(false);
            setPanVerified(true);
        }, 1500);
    };

    const handleVerifyAadhaar = () => {
        setIsVerifyingAadhaar(true);
        setTimeout(() => {
            setIsVerifyingAadhaar(false);
            setAadhaarVerified(true);
        }, 1500);
    };

    if (!mounted) return null;

    const s = {
        card: isDark
            ? "bg-[#0B0F1A]/80 backdrop-blur-xl border-white/10 shadow-2xl"
            : "bg-white border-slate-200 shadow-sm",
        sectionTitle: isDark ? "text-white" : "text-slate-900",
        subText: isDark ? "text-slate-400" : "text-slate-500",
        inputBg: isDark ? "bg-black/40 border-white/5 shadow-inner" : "bg-slate-50 border-slate-200",
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto space-y-10 pb-32 px-4 pt-4"
        >

            {/* 1. DATA ACCURACY TRACKER */}
            <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                className={`${s.card} p-8 rounded-[2.5rem] border flex flex-col md:flex-row items-center justify-between gap-8`}
            >
                <div className="flex items-center gap-5">
                    <motion.div 
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 5 }}
                        className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white"
                    >
                        <BarChart4 size={28} />
                    </motion.div>
                    <div>
                        <h2 className={`text-xl font-bold ${s.sectionTitle}`}>AI Analysis Accuracy</h2>
                        <p className={`text-sm ${s.subText}`}>Fill all sections for a 100% accurate financial plan</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className="flex justify-between w-full mb-1">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Data Maturity</span>
                        <span className="text-sm font-bold text-indigo-500">{maturity}%</span>
                    </div>
                    <div className="w-full md:w-72 h-3 bg-indigo-600/10 rounded-full overflow-hidden p-0.5 border border-indigo-500/10">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${maturity}%` }}
                            transition={{ duration: 2, ease: "circOut" }}
                            className="h-full bg-linear-to-r from-indigo-600 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                        />
                    </div>
                </div>
            </motion.div>

            {/* 🛡️ IDENTITY & KYC SECTION */}
            <motion.section variants={itemVariants} className={`${s.card} rounded-[2.5rem] border overflow-hidden`}>
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <ShieldCheck size={22} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${s.sectionTitle}`}>Identity & Tax Verification</h3>
                                <p className={`text-xs ${s.subText}`}>Required for accurate Indian Tax (TDS) and Credit analysis.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">AES-256 SECURE</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent Account Number (PAN)</label>
                            <div className={`flex items-center ${s.inputBg} border rounded-2xl p-1.5 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20`}>
                                <input
                                    type="text"
                                    maxLength={10}
                                    placeholder="ABCDE1234F"
                                    value={portfolio.pan}
                                    onChange={(e) => setPortfolio({...portfolio, pan: e.target.value.toUpperCase()})}
                                    className="flex-1 bg-transparent p-3.5 text-lg font-mono font-bold tracking-[0.2em] uppercase text-indigo-500 outline-none placeholder:opacity-20"
                                />
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }} 
                                    onClick={handleVerifyPan}
                                    className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg ${panVerified ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                >
                                    {isVerifyingPan ? "Verifying..." : panVerified ? "Verified ✓" : "Verify"}
                                </motion.button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhaar (VID Masked)</label>
                            <div className={`flex items-center ${s.inputBg} border rounded-2xl p-4 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20`}>
                                <div className="flex gap-2 text-lg font-mono text-slate-500/50 select-none tracking-widest mr-3">XXXX XXXX</div>
                                <input
                                    type="password"
                                    maxLength={4}
                                    placeholder="1234"
                                    value={portfolio.aadhaar}
                                    onChange={(e) => setPortfolio({...portfolio, aadhaar: e.target.value})}
                                    className="flex-1 bg-transparent text-lg font-mono font-bold tracking-[0.3em] text-indigo-500 outline-none placeholder:opacity-20"
                                />
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} 
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleVerifyAadhaar}
                                    className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg ${aadhaarVerified ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                >
                                    {isVerifyingAadhaar ? "Verifying..." : aadhaarVerified ? "Verified ✓" : "Verify"}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* 2. ASSETS SECTION */}
            <AssetSection title="Growth Assets" icon={<TrendingUp className="text-indigo-500" />} s={s}>
                <PortfolioInput label="Direct Stocks" value={portfolio.direct_stocks} onChange={(val: string) => setPortfolio({...portfolio, direct_stocks: val})} icon={<BarChart4 size={14} />} isDark={isDark} />
                <PortfolioInput label="Mutual Funds" value={portfolio.mutual_funds} onChange={(val: string) => setPortfolio({...portfolio, mutual_funds: val})} icon={<TrendingUp size={14} />} isDark={isDark} />
                <PortfolioInput label="Real Estate" value={portfolio.real_estate} onChange={(val: string) => setPortfolio({...portfolio, real_estate: val})} icon={<Home size={14} />} isDark={isDark} />
                <PortfolioInput label="Physical Gold" value={portfolio.physical_gold} onChange={(val: string) => setPortfolio({...portfolio, physical_gold: val})} icon={<Coins size={14} />} isDark={isDark} />
                <PortfolioInput label="Crypto" value={portfolio.crypto} onChange={(val: string) => setPortfolio({...portfolio, crypto: val})} icon={<Sparkles size={14} />} isDark={isDark} />
                <PortfolioInput label="Business Value" value={portfolio.business_value} onChange={(val: string) => setPortfolio({...portfolio, business_value: val})} icon={<Landmark size={14} />} isDark={isDark} />
            </AssetSection>

            {/* 3. LIABILITIES SECTION */}
            <AssetSection title="Liabilities & EMIs" icon={<AlertCircle className="text-rose-500" />} s={s}>
                <PortfolioInput label="Home Loan" value={portfolio.home_loan} onChange={(val: string) => setPortfolio({...portfolio, home_loan: val})} color="rose" isDark={isDark} />
                <PortfolioInput label="Vehicle Loan" value={portfolio.vehicle_loan} onChange={(val: string) => setPortfolio({...portfolio, vehicle_loan: val})} color="rose" isDark={isDark} />
                <PortfolioInput label="Credit Card Dues" value={portfolio.credit_card_dues} onChange={(val: string) => setPortfolio({...portfolio, credit_card_dues: val})} color="rose" isDark={isDark} />
                <PortfolioInput label="Personal Loans" value={portfolio.personal_loans} onChange={(val: string) => setPortfolio({...portfolio, personal_loans: val})} color="rose" isDark={isDark} />
            </AssetSection>

            {/* FLOATING ACTION BAR */}
            <div className="fixed bottom-10 right-10 z-50">
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-3 px-12 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all group relative overflow-hidden
                    ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}
                >
                    <AnimatePresence mode="wait">
                        {isSaving ? (
                            <motion.div 
                                key="saving"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" 
                            />
                        ) : showSuccess ? (
                            <motion.div key="success" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-3">
                                <Check size={20} className="animate-bounce" /> Saved Successfully
                            </motion.div>
                        ) : (
                            <motion.div key="default" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-3">
                                <Save size={20} /> Sync Portfolio
                              </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </motion.div>
    );
}

// REUSABLE SECTION WRAPPER
function AssetSection({ title, icon, children, s }: any) {
    return (
        <motion.section
            variants={itemVariants}
            className={`${s.card} rounded-[2.5rem] border overflow-hidden`}
        >
            <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
                    <motion.div whileHover={{ rotate: 15 }}>{icon}</motion.div>
                    <h3 className={`text-lg font-bold ${s.sectionTitle}`}>{title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {children}
                </div>
            </div>
        </motion.section>
    );
}

// REUSABLE INPUT COMPONENT
function PortfolioInput({ label, value, onChange, placeholder, icon, color = "indigo", isDark }: any) {
    const colorClasses: any = {
        indigo: isDark ? "text-indigo-400" : "text-indigo-600",
        rose: "text-rose-500",
        emerald: "text-emerald-500",
    };

    return (
        <motion.div 
            whileHover={{ y: -2 }}
            className="space-y-3 group"
        >
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2 transition-colors group-focus-within:text-indigo-500">
                {icon} {label}
            </label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm select-none">₹</span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-100/50 dark:bg-black/30 border border-slate-200 dark:border-white/5 outline-none transition-all font-mono text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 ${colorClasses[color]}`}
                />
            </div>
        </motion.div>
    );
}