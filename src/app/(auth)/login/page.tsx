'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'Doctor' | 'Staff' | 'Admin';

const roleIcons: Record<Role, string> = {
  Doctor: '🩺',
  Staff: '👤',
  Admin: '🛡️',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError(data.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[100px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Card wrapper with glow border */}
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-600/35 via-transparent to-indigo-500/25 pointer-events-none" />

        <div className="relative bg-[#14141e] backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden">

          {/* Top accent bar */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          <div className="px-8 pt-10 pb-8">

            {/* Logo + Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold tracking-[0.12em] text-white">
                  I<span className="text-violet-400">X</span>ORA
                </span>
              </div>
              <h1 className="text-[17px] font-semibold text-white tracking-tight">Welcome Back</h1>
              <p className="text-[12.5px] text-white/40 mt-1">Sign in to continue to Doctor Web</p>
            </div>

            {/* Role Selector */}
            <div className="mb-5">
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                Login As
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['Doctor', 'Staff', 'Admin'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`
                      flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[11.5px] font-medium transition-all duration-150 cursor-pointer
                      ${role === r
                        ? 'border-violet-500/60 bg-violet-600/20 text-violet-300'
                        : 'border-white/[0.07] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
                      }
                    `}
                  >
                    <span className="text-base">{roleIcons[r]}</span>
                    <span>{r}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">

              {/* Email */}
              <div>
                <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2">
                  Email
                </label>
                <div className="relative group">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-violet-400 transition-colors pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-[11px] text-[13.5px] text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-violet-500/[0.06] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative group">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-violet-400 transition-colors pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-11 py-[11px] text-[13.5px] text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-violet-500/[0.06] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-[12.5px] text-red-400">{error}</p>
                </div>
              )}

              <div className="user" style={{ color: 'white' }}> admin@gmail.com</div>
              <div className="pass" style={{ color: 'white' }}> admin@123</div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between pt-0.5">
                <label
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => setRemember(!remember)}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 flex-shrink-0 ${remember
                        ? 'bg-violet-600 border-violet-600'
                        : 'bg-transparent border-white/20 group-hover:border-white/40'
                      }`}
                  >
                    {remember && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px] text-white/40 group-hover:text-white/55 transition-colors select-none">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-[12px] text-violet-400/75 hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 rounded-xl text-[14px] font-semibold text-white overflow-hidden group transition-all duration-200 disabled:opacity-70 mt-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:from-violet-500 group-hover:to-indigo-500 transition-all duration-200" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>

            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-[11px] text-white/20">
              © 2026 Doctor Web · Designed & Developed by{' '}
              <span className="text-violet-400/55 font-medium">Ixora Technologies</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}