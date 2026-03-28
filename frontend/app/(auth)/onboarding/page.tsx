"use client";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, memo,useCallback } from "react";
import Galaxy from "../../../components/Animation/Galaxy"; 
import { useRouter } from "next/navigation";

const MemoizedGalaxy = memo(() => (
  <div className="absolute inset-0 z-0">
    <Galaxy
      mouseRepulsion={true}
      mouseInteraction={true}
      density={1}
      glowIntensity={0.3}
      hueShift={140}
      twinkleIntensity={0.3}
      rotationSpeed={0.1}
      repulsionStrength={2}
      starSpeed={0.5}
      speed={1}
    />
  </div>
));
MemoizedGalaxy.displayName = "MemoizedGalaxy";
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    age: "",
    income: "",
    expenses: "",
    savings: "",
    investments: "",
    debt: "",
    goal: "",
    risk: "medium",
  });

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const containerVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative" as const,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      position: "absolute" as const,
      width: "100%",
      transition: { duration: 0.6, ease: "easeInOut" },
    }),
  };

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          age: parseInt(form.age) || 0,
          monthly_income: parseFloat(form.income) || 0,
          monthly_expenses: parseFloat(form.expenses) || 0,
          savings_emergency_fund: parseFloat(form.savings) || 0,
          mutual_funds: parseFloat(form.investments) || 0,
          direct_stocks: 0,
          real_estate: 0,
          physical_gold: 0,
          crypto: 0,
          business_value: 0,
          home_loan: 0,
          vehicle_loan: 0,
          credit_card_dues: parseFloat(form.debt) || 0,
          personal_loans: 0,
          tax_saving_investments: 0,
          full_name: form.name,
          risk_tolerance: form.risk || "medium",
          financial_goals: [{
            title: form.goal || "Savings",
            target: 0,
            current: 0,
            priority: 1
          }]
        })
      });
      if (!res.ok) throw new Error("Failed to save profile");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const titles = ["Who are you?", "Your Financial Snapshot", "Define Your Future"];
  const descriptions = [
    "Let's get to know the person behind the numbers.",
    "Give us an idea of your monthly cash flow.",
    "What are we aiming for? Let's set the target.",
  ];

  return (
    <div className="relative min-h-screen bg-[#030014] flex flex-col justify-center items-center p-4 overflow-hidden font-sans text-slate-200">

      {/* --- GALAXY BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0">
        {/* <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1}
          glowIntensity={0.3}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          starSpeed={0.5}
          speed={1}
        /> */}
         <MemoizedGalaxy />
      </div>
      {/* ------------------------------- */}

      {/* MAIN GLASSMORPHIC CARD */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
        // Added pointer-events-auto to ensure the card remains clickable over the background
        className="relative z-10 max-w-3xl w-full bg-white/3 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-8 border border-white/10 pointer-events-auto"
      >
        {/* GLOWING TOP BORDER */}
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />

        {/* DYNAMIC PROGRESS INDICATOR */}
        <div className="flex gap-3 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden relative">
              {step >= i && (
                <motion.div
                  layoutId={`progress-${i}`}
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.6, ease: "circOut" }}
                  className="absolute inset-0 bg-linear-to-r from-cyan-400 to-purple-500 shadow-[0_0_15px_rgba(34,211,238,0.7)]"
                />
              )}
            </div>
          ))}
        </div>

        {/* HEADER SECTION */}
        <motion.div layout className="mb-8">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400 mb-2 tracking-tight">
              {titles[step - 1]}
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {descriptions[step - 1]}
            </p>
          </motion.div>
        </motion.div>

        {/* FORM FIELDS */}
        <div className=" min-h-45 ">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-5"
            >
              {step === 1 && (
                <>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <input
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Age</label>
                    <input
                      type="number"
                      placeholder="28"
                      value={form.age}
                      onChange={(e) => handleChange("age", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                </>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Monthly Income (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.income}
                      onChange={(e) => handleChange("income", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Monthly Expenses (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.expenses}
                      onChange={(e) => handleChange("expenses", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Total Savings (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.savings}
                      onChange={(e) => handleChange("savings", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Stock/MF Investments (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.investments}
                      onChange={(e) => handleChange("investments", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Total Outstanding Debt (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.debt}
                      onChange={(e) => handleChange("debt", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                </div>
              )}

              {step === 3 && (
                <>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Primary Goal</label>
                    <input
                      placeholder="e.g. Buy a House, Retire Early"
                      value={form.goal}
                      onChange={(e) => handleChange("goal", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/50 outline-none transition-all shadow-inner"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Risk Capacity</label>
                    <select
                      value={form.risk}
                      onChange={(e) => handleChange("risk", e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-white appearance-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/50 outline-none transition-all shadow-inner"
                    >
                      <option value="" disabled className="bg-slate-900">Select Risk Profile</option>
                      <option value="low" className="bg-slate-900">Low (Conservative)</option>
                      <option value="medium" className="bg-slate-900">Medium (Balanced)</option>
                      <option value="high" className="bg-slate-900">High (Aggressive)</option>
                    </select>
                  </motion.div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* NAVIGATION BUTTONS */}
        <motion.div layout className="flex justify-between mt-10 pt-8 border-t border-white/10">
          <button
            disabled={step === 1}
            onClick={prevStep}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${step === 1
                ? "text-slate-700 cursor-not-allowed"
                : "text-slate-300 hover:text-white hover:bg-white/10 active:scale-95"
              }`}
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 active:scale-95 flex items-center gap-2"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={saveProfile}
              className="relative px-8 py-3 bg-linear-to-r from-cyan-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)] transition-all duration-300 active:scale-95 overflow-hidden group"
            >
              <span className="relative z-10">Launch Dashboard</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}