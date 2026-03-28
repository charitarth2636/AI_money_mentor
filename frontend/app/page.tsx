"use client";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { memo } from "react";
import Galaxy from "../components/Animation/Galaxy"; 

const SceneBackground = memo(() => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <Galaxy
      mouseRepulsion={true}
      mouseInteraction={true}
      density={0.6}
      glowIntensity={0.4}
      hueShift={210} // Shifted slightly towards deeper blue/cyan for financial trust
      twinkleIntensity={0.3}
      speed={0.5}
    />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-size-[60px_60px] " />
    <div className="absolute inset-0 bg-radial-at-t from-cyan-500/10 via-transparent to-transparent" />
  </div>
));

export default function LandingPage() {
 const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.1, 
        duration: 0.8, 
        // Force the cubic-bezier array to be recognized correctly
        ease: [0.16, 1, 0.3, 1] 
      }
    }),
  };
  return (
    <div className="relative min-h-screen bg-[#02010a] text-slate-200 selection:bg-cyan-500/30 font-sans">
      <SceneBackground />

      {/* --- NAV BAR --- */}
      <nav className="fixed top-0 w-full z-50 px-8 py-5 flex justify-between items-center backdrop-blur-xl border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-linear-to-br from-cyan-400 to-purple-600 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
             <span className="-rotate-45 font-black text-white text-xs">M</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-white">MONEY<span className="text-cyan-400">MENTOR</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
         <Link href="/login" className="px-6 py-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">Log In</Link>
           <Link href="/signup" className="px-6 py-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">Sign In</Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 pt-48 pb-20 px-6 max-w-7xl mx-auto text-center lg:text-left">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={fadeInUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Financial Intelligence
              </motion.div>
              
              <motion.h1 variants={fadeInUp} custom={1} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white">
                Navigate your <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-300 via-white to-purple-400">Wealth Orbit.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} custom={2} className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-light mx-auto lg:mx-0">
                Meet your AI Money Mentor. We transform complex market data into a clear, personalized financial roadmap using accurate neural analysis.
              </motion.p>

              <motion.div variants={fadeInUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                 <Link href="/signup" className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95">
                    Generate My Roadmap
                 </Link>
                 <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-xl">
                    View Sample Analysis
                 </button>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: The "AI Analyst" Card Preview */}
          <div className="lg:col-span-5 relative group">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative"
            >
              {/* Decorative Glow */}
              <div className="absolute -inset-4 bg-linear-to-r from-cyan-500 to-purple-600 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              
              {/* Glass Card */}
              <div className="relative bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                 <div className="flex justify-between items-start mb-10">
                    <div className="space-y-1">
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portfolio Growth</div>
                       <div className="text-3xl font-black text-white">+24.8%</div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-lg uppercase">Accurate</div>
                 </div>

                 {/* Fake Sparkline/Graph Visualization */}
                 <div className="h-32 w-full flex items-end gap-2 mb-8">
                    {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                       <motion.div 
                        key={i} 
                        initial={{ height: 0 }} 
                        animate={{ height: `${h}%` }} 
                        transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                        className="flex-1 bg-linear-to-t from-cyan-500/40 to-cyan-400 rounded-t-sm" 
                       />
                    ))}
                 </div>

                 <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase mb-1">AI Recommendation</div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"Your current trajectory suggests early retirement by 2045. Diversify 12% into emerging tech."</p>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- CORE SERVICES SECTION --- */}
        <div className="mt-40 grid md:grid-cols-3 gap-8">
           <FeatureCard 
             title="Financial Planning" 
             desc="Algorithmic strategy mapped to your life goals and risk appetite." 
             icon="🎯"
           />
           <FeatureCard 
             title="Roadmap Generation" 
             desc="A step-by-step visual journey from debt to generational wealth." 
             icon="🗺️"
           />
           <FeatureCard 
             title="Accurate Analysis" 
             desc="No guesswork. Pure data-driven insights powered by Neural Nets." 
             icon="📊"
           />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-10 rounded-[2.5rem] bg-white/3 border border-white/10 backdrop-blur-md hover:border-cyan-500/50 transition-all"
    >
      <div className="text-3xl mb-6">{icon}</div>
      <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tighter">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-light">{desc}</p>
    </motion.div>
  );
}
