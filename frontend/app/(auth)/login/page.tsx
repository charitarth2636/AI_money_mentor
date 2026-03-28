"use client";
import { useRouter } from "next/navigation";
import { useState, memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Galaxy from "../../../components/Animation/Galaxy"; // Keep your correct import path!

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

export default function LoginPage() {
  const router = useRouter();
  // 1. Add state to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      localStorage.setItem("token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030014] flex flex-col justify-center items-center p-4 overflow-hidden font-sans text-slate-200">
      {/* --- GALAXY BACKGROUND LAYER --- */}
    
      <div className="absolute inset-0 z-0">
          <MemoizedGalaxy />
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
      </div>

      {/* MAIN GLASSMORPHIC CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
        className="relative z-10 max-w-md w-full bg-white/3 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-10 border border-white/10 pointer-events-auto overflow-hidden"
      >
        {/* GLOWING TOP BORDER */}
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />

        {/* HEADER SECTION */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400 mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Enter your details to access your dashboard.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EMAIL INPUT */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="hello@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
               className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all shadow-inner autofill:shadow-[inset_0_0_0px_1000px_#030014] autofill:[-webkit-text-fill-color:white]"
            />
          </div>

          {/* PASSWORD INPUT */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            
            {/* 2. Wrap input in a relative div to position the icon */}
            <div className="relative">
              <input
                // 3. Toggle type between "text" and "password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
                // Added pr-12 to ensure text doesn't type *underneath* the icon
               className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all shadow-inner autofill:shadow-[inset_0_0_0px_1000px_#030014] autofill:[-webkit-text-fill-color:white]"
              />
              
              {/* 4. The Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye Off Icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  // Eye Icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="mt-8 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative px-8 py-4 bg-linear-to-r from-cyan-500 to-purple-600 text-white rounded-2xl text-sm font-bold shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all duration-300 active:scale-95 overflow-hidden group disabled:opacity-70 disabled:grayscale">
              <span className="relative z-10">{loading ? "Authenticating..." : "LogIn"}</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </button>
          </div>
        </form>

        {/* FOOTER LINK */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-white font-semibold hover:text-cyan-400 transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}