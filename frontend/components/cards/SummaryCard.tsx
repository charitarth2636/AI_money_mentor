// import { motion } from "framer-motion";

// type Props = {
//   title: string;
//   value: string;
// };

// export default function SummaryCard({ title, value }: Props) {
//   return (
//     <motion.div
//       whileHover={{ y: -5, scale: 1.02 }}
//       // LIGHT MODE: White/Bordered | DARK MODE: Grey (#27292D)
//       className="p-6 rounded-3xl transition-all duration-300
//                  bg-white border-slate-200 shadow-sm
//                  dark:bg-[#27292D] dark:border-white/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
//                  border relative overflow-hidden group"
//     >
//       {/* Subtle Top Shine (Premium Detail) */}
//       <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent dark:bg-black" />

//       {/* Title: Silver/Gray in Dark Mode */}
//       <h3 className="text-xs font-bold uppercase tracking-widest  text-slate-500 dark:text-slate-900">
//         {title}
//       </h3>

//       {/* Value: Pure White in Dark Mode */}
//       <p className="text-3xl font-black mt-3 text-slate-900 dark:text-white tracking-tight">
//         {value}
//       </p>

//       {/* Interactive Bottom Accent */}
//       <div className="mt-4 h-1 w-8 rounded-full bg-indigo-500 opacity-40 group-hover:w-full transition-all duration-500" />
//     </motion.div>
//   );
// }


// import { motion } from "framer-motion";

// type Props = {
//   title: string;
//   value: string;
// };

// export default function SummaryCard({ title, value }: Props) {
//   return (
//     <motion.div
//       whileHover={{ y: -5, scale: 1.02 }}
//       className="p-6 rounded-3xl transition-all duration-300 border relative overflow-hidden group
                
//                  /* Dark Mode */
//                  dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
//     >
//       {/* Subtle Top Shine: Visible in dark mode to give it that 'glass' depth */}
//       <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent dark:via-white/10" />

//       {/* Title: Slate-500 for light, Slate-400 for dark (better readability) */}
//       <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] 
//                      text-slate-900 dark:text-slate-900">
//         {title}
//       </h3>

//       {/* Value: Deep slate for light, Crisp white for dark */}
//       <p className="text-3xl font-black mt-2 tracking-tight
//                     text-slate-900 dark:text-slate-900">
//         {value}
//       </p>

//       {/* Interactive Bottom Accent: Indigo for light, Cyan or Violet for dark pop */}
//       <div className="mt-5 h-1 w-8 rounded-full transition-all duration-500
//                       bg-indigo-600 dark:bg-indigo-400 
//                       opacity-40 group-hover:w-full group-hover:opacity-100" />
      
//       {/* Background Glow Effect (Dark Mode only) */}
//       <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
//     </motion.div>
//   );
// }


// import { motion } from "framer-motion";

// type Props = {
//   title: string;
//   value: string;
// };

// export default function SummaryCard({ title, value }: Props) {
//   return (
//     <motion.div
//       whileHover={{ y: -5, scale: 1.02 }}
//       className="p-6 rounded-[2rem] border relative overflow-hidden group transition-all duration-500
//                  /* LIGHT MODE: White background */
//                  bg-white border-slate-200 shadow-sm
//                  /* DARK MODE: Dark background & subtle border */
//                  dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
//     >
//       {/* Subtle Top Shine */}
//       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent dark:via-white/10" />

//       {/* Title */}
//       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] 
//                      /* Light Mode: Slate-500 | Dark Mode: Slate-400 */
//                      text-slate-500 dark:text-slate-400 transition-colors">
//         {title}
//       </h3>

//       {/* Value */}
//       <p className="text-3xl font-black mt-2 tracking-tight
//                     /* Light Mode: Slate-900 | Dark Mode: Pure White */
//                     text-slate-900 dark:text-white transition-colors">
//         {value}
//       </p>

//       {/* Interactive Bottom Accent */}
//       <div className="mt-5 h-1.5 w-10 rounded-full transition-all duration-500
//                       bg-indigo-600 dark:bg-indigo-500 
//                       opacity-30 group-hover:w-full group-hover:opacity-100" />
      
//       {/* Background Glow */}
//       <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
//     </motion.div>
//   );
// }


import { motion } from "framer-motion";
type Props = {
  title: string;
  value: string;
};
export default function SummaryCard({ title, value }: Props) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="p-6 rounded-3xl transition-all duration-300
                 bg-card border-border shadow-sm
                 dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                 border relative overflow-hidden group"
    >
      {/* Subtle Top Shine */}
      <div className="absolute inset-x-0 top-0 h-px 
                      bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Title */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>

      {/* Value */}
      <p className="text-3xl font-black mt-3 text-foreground tracking-tight">
        {value}
      </p>

      {/* Accent */}
      <div className="mt-4 h-1 w-8 rounded-full bg-primary opacity-40 group-hover:w-full transition-all duration-500" />
    </motion.div>
  );
}