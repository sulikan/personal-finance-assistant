"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch("/api/captcha");
      const data = await res.json();
      setCaptchaId(data.id);
      setCaptchaSvg(data.svg);
    } catch {
      setError("Gagal memuat CAPTCHA");
    }
  }, []);

  useEffect(() => { fetchCaptcha(); }, [fetchCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginAction({ email, password, captchaId, captchaAnswer });
    if ("error" in result) {
      setError(result.error);
      fetchCaptcha();
      setCaptchaAnswer("");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", { email, password, redirect: false });
    if (signInResult?.error) {
      setError("Email atau password salah");
      fetchCaptcha();
      setCaptchaAnswer("");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 border border-white/20">
            <svg viewBox="0 0 36 36" className="w-14 h-14" fill="none">
              <defs>
                <linearGradient id="lgn" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
                  <stop offset="100%" stop-color="#fff" stop-opacity="0.8"/>
                </linearGradient>
              </defs>
              <rect x="0" y="4" width="32" height="28" rx="6" stroke="url(#lgn)" stroke-width="2" fill="none"/>
              <path d="M6 12V8a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v4" stroke="url(#lgn)" stroke-width="2" stroke-linecap="round"/>
              <circle cx="18" cy="18" r="4" stroke="url(#lgn)" stroke-width="2" fill="none"/>
              <path d="M16 18h4" stroke="url(#lgn)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Finance Assistant</h1>
          <p className="text-blue-100 text-lg max-w-sm mx-auto leading-relaxed">
            Kelola keuangan pribadi Anda dengan mudah, aman, dan profesional.
          </p>
          <div className="mt-12 flex justify-center gap-8 text-blue-200 text-sm">
            <div className="flex flex-col items-center gap-1">
              <Lock className="w-5 h-5" />
              <span>Aman</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/></svg>
              <span>Terstruktur</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              <span>Laporan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-base-200 px-6">
        <div className="w-full max-w-sm py-4">
          {/* Logo + Title */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl mb-3 shadow-lg shadow-blue-200">
              <svg viewBox="0 0 36 36" className="w-8 h-8" fill="none">
                <rect x="0" y="4" width="32" height="28" rx="6" stroke="#fff" stroke-width="2" fill="none"/>
                <path d="M6 12V8a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                <circle cx="18" cy="18" r="4" stroke="#fff" stroke-width="2" fill="none"/>
                <path d="M16 18h4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-base-content">Selamat Datang</h2>
            <p className="text-base-content/60 text-sm mt-1">Masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email */}
            <div className="form-control">
              <label className="label pb-1" htmlFor="email">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="email" type="email" placeholder="nama@email.com"
                  className="input input-bordered w-full pl-10 focus:outline-none focus:border-blue-500 transition-colors"
                  value={email} onChange={(e) => { setError(""); setEmail(e.target.value); }} required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label pb-1" htmlFor="password">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="input input-bordered w-full pl-10 pr-10 focus:outline-none focus:border-blue-500 transition-colors"
                  value={password} onChange={(e) => { setError(""); setPassword(e.target.value); }} required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CAPTCHA */}
            <div className="form-control">
              <label className="label pb-1">
                <span className="label-text font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Verifikasi Keamanan
                </span>
              </label>
              <div className="flex items-center justify-center rounded-xl border border-base-300 bg-white py-1 mb-1.5 shadow-inner overflow-hidden">
                {captchaSvg && (
                  <img
                    src={`data:image/svg+xml;base64,${btoa(captchaSvg)}`}
                    alt="CAPTCHA"
                    className="block h-12"
                    style={{ maxWidth: "none", imageRendering: "pixelated" }}
                  />
                )}
              </div>
              <input
                placeholder="Ketik 8 karakter di atas"
                className="input input-bordered w-full focus:outline-none focus:border-blue-500 transition-colors"
                value={captchaAnswer} onChange={(e) => { setError(""); setCaptchaAnswer(e.target.value); }} required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error py-2 text-sm" role="alert">
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn btn-primary w-full h-11 text-base font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all" disabled={loading}>
              {loading && <span className="loading loading-spinner loading-sm"></span>}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-center text-xs text-base-content/40 mt-4">
            &copy; {new Date().getFullYear()} Finance Assistant. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
