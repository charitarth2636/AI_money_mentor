type Props = {
  text: string;
};

export default function InsightCard({ text }: Props) {
  return (
    <div className="relative group p-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-400/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 overflow-hidden">
      
      {/* Subtle Glow Accent (Left side line) */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />

      <div className="flex items-start gap-3">
        {/* AI Icon/Bullet */}
        <div className="mt-1">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        </div>

        {/* Insight Text: White in dark mode, Indigo in light mode */}
        <p className="text-sm font-semibold leading-relaxed text-indigo-900 dark:text-white transition-colors">
          {text}
        </p>
      </div>

      {/* Background Decorative Blur (Visible in dark mode) */}
      <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-500/10 blur-xl rounded-full" />
    </div>
  );
}