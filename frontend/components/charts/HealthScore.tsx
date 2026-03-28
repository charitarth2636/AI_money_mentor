"use client";
import { motion } from "framer-motion";
type Props = {
  score: number; // out of 100
};

export default function HealthScore({ score }: Props) {
  const radius = 70; // Slightly larger for better visibility
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative group">
      <svg 
        height={radius * 2} 
        width={radius * 2} 
        className="transform -rotate-90 transition-transform duration-500 group-hover:scale-105"
      >
        {/* Define Gradient for the Ring */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo-500 */}
            <stop offset="100%" stopColor="#a855f7" /> {/* Purple-500 */}
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-slate-200 dark:text-white/5 transition-colors"
        />

        {/* Glowing Progress circle */}
        <motion.circle
          stroke="url(#scoreGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + " " + circumference}
          style={{ 
            strokeDashoffset,
            filter: "drop-shadow(0px 0px 6px rgba(99, 102, 241, 0.4))"
          }}
          className="transition-all duration-1000 ease-out"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>

      {/* Score Text: Centered & Theme-Aware */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-black tracking-tighter  transition-colors">
          {score}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
          Score
        </span>
      </div>
    </div>
  );
}

// Optional: If you don't have framer-motion installed, just remove the <motion.circle> 
// and use a standard <circle> with a 'transition-all' class.