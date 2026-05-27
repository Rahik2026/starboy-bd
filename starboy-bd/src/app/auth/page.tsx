"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Lock, Phone, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AuthPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !phone) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await register({ username, password, phone, email: email || undefined });
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 grain">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1 text-ink-400 hover:text-brand-300 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-premium">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 text-brand-700 rounded-2xl mb-3">
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-current"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" /></svg>
            </div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-ink-950">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
            <p className="text-xs text-ink-500 mt-1">{mode === "login" ? "Login to access your wishlist, cart & orders." : "Join the STARBOY BD community."}</p>
          </div>
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">Username or Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="w-full pl-10 pr-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="w-full pl-10 pr-10 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-ink-950 hover:bg-brand-700 text-brand-300 hover:text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">{loading ? "Signing in..." : "Sign In"}</button>
                <p className="text-center text-xs text-ink-500">Don&apos;t have an account? <button type="button" onClick={() => setMode("register")} className="text-brand-700 font-semibold hover:underline">Register</button></p>
              </motion.form>
            ) : (
              <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" className="w-full pl-10 pr-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" className="w-full pl-10 pr-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">Email (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" className="w-full pl-10 pr-10 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-ink-950 hover:bg-brand-700 text-brand-300 hover:text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">{loading ? "Creating..." : "Create Account"}</button>
                <p className="text-center text-xs text-ink-500">Already have an account? <button type="button" onClick={() => setMode("login")} className="text-brand-700 font-semibold hover:underline">Sign In</button></p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
