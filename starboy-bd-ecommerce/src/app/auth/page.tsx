"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function AuthPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) { await login(identifier, password); toast.success("Welcome back!"); }
      else { await register({ username, password, phone, email }); toast.success("Account created!"); }
      router.push("/dashboard");
    } catch (err: any) { toast.error(err?.message || "Authentication failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="relative w-10 h-10"><Image src="/images/logo.webp" alt="STARBOY BD" fill className="object-contain" /></div>
          <span className="font-display text-xl font-bold text-ink-950">STARBOY BD</span>
        </Link>
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold text-ink-950 mb-1 text-center">{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className="text-sm text-ink-500 text-center mb-6">{isLogin ? "Sign in to your account" : "Join the STARBOY BD community"}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Full Name" required className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors" />}
            {!isLogin && <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" required className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors" />}
            {!isLogin && <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email (optional)" className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors" />}
            {isLogin && <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Phone or Email" required className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors" />}
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors" />
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-ink-950 hover:bg-brand-700 text-brand-300 hover:text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
          <p className="text-center text-sm text-ink-500 mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-brand-700 hover:underline font-semibold">{isLogin ? "Sign Up" : "Sign In"}</button>
          </p>
        </div>
      </div>
    </div>
  );
            }

