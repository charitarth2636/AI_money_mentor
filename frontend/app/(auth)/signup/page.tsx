"use client";
import { useRouter } from "next/navigation";
import { useState, memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Galaxy from "../../../components/Animation/Galaxy"; // Adjust this import path as needed!

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
export default function SignupPage() {
      const router = useRouter();
    // Toggle states for both password fields
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
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
            const res = await fetch("http://127.0.0.1:8000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: form.email, 
                    password: form.password,
                    full_name: form.name 
                })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Registration failed");
            }

            localStorage.setItem("token", data.access_token);
            router.push("/onboarding");
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

            {/* MAIN GLASSMORPHIC CARD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                // Using max-w-md to keep the auth cards compact and focused
                className="relative z-10 max-w-md w-full bg-white/3 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-6 border border-white/10 pointer-events-auto overflow-hidden my-8"
            >
                {/* GLOWING TOP BORDER */}
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-400/60 to-transparent" />

                {/* HEADER SECTION */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-slate-400 mb-2 tracking-tight">
                        Create an Account
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Join us to take control of your financial future.
                    </p>
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}
                </div>
                {/* SIGNUP FORM */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* FULL NAME INPUT */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="Jane Doe"
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                             className="w-full bg-black/30 border border-white rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all shadow-inner"
                        />
                    </div>

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
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                                required
                                className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 outline-none transition-all shadow-inner autofill:shadow-[inset_0_0_0px_1000px_#030014] autofill:[-webkit-text-fill-color:white]" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors outline-none"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>



                    {/* SUBMIT BUTTON */}
                    <div className="mt-8 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative px-8 py-4 bg-linear-to-r from-cyan-500 to-purple-600 text-white rounded-2xl text-sm font-bold shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all duration-300 active:scale-95 overflow-hidden group disabled:opacity-70 disabled:grayscale"
                        >
                            <span className="relative z-10">{loading ? "Creating Account..." : "Create Account"}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                        </button>
                    </div>
                </form>

                {/* FOOTER LINK */}
                <p className="mt-8 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-white font-semibold hover:text-cyan-400 transition-colors"
                    >
                        Login
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
