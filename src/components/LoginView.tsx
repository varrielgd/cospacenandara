import React, { useState } from 'react';
import { Lock, Mail, Loader2, ShieldCheck, Shield } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresVerification) {
          setShow2FA(true);
          setError('Account needs verification. Please check your email.');
          return;
        }
        // Tampilkan detail error dari backend jika ada
        const errorMessage = data.details || data.message || 'Login failed';
        throw new Error(errorMessage);
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05190F] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Luxury Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_#0A2A1A_0%,_transparent_40%),radial-gradient(circle_at_80%_80%,_#082416_0%,_transparent_40%)]"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="max-w-lg w-full relative z-10">
        {/* Enterprise Branding */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl lg:text-5xl font-medium text-white tracking-tight mb-4 drop-shadow-sm">
            Nandara Nusa Montierra
          </h1>
          
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold text-[#C9A227] tracking-widest uppercase">
                SECURE NETWORK
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-[11px] font-mono text-[#C9A227] tracking-[0.4em] uppercase font-semibold">
                GLOBAL COFFEE EXPORT INTELLIGENCE PLATFORM
              </p>
              <p className="text-[9px] font-mono text-white/40 tracking-wider">
                support.nandaranusamontierra.com
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden backdrop-blur-sm">
          <div className="p-10">
            {!show2FA ? (
              <form onSubmit={handleLogin} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold ml-1">
                    Corporate Identity
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#05190F] opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A227] focus:bg-white transition-all rounded-lg py-4 pl-12 pr-4 text-sm outline-none placeholder:text-gray-300"
                      placeholder="admin@nandaranusamontierra.com"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold ml-1">
                    Access Key
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#05190F] opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A227] focus:bg-white transition-all rounded-lg py-4 pl-12 pr-4 text-sm outline-none placeholder:text-gray-300"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-600 text-[11px] font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <Shield className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#05190F] hover:bg-[#0A2A1A] text-[#C9A227] font-bold py-5 rounded-lg transition-all shadow-2xl hover:shadow-[#C9A227]/10 active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70 group"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="tracking-[0.3em] text-xs uppercase">ACCESS PLATFORM</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-8">
                <div className="text-center space-y-4 mb-8">
                  <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#05190F]">Multi-Factor Protocol</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Security code transmitted to <br/>
                    <span className="font-bold text-[#05190F]">{email}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold text-center block">
                    Security Token
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#C9A227] focus:bg-white transition-all rounded-lg py-5 text-center text-3xl font-mono tracking-[0.6em] outline-none shadow-inner"
                    placeholder="000000"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-600 text-[11px] font-medium flex items-center gap-3">
                    <Shield className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#05190F] hover:bg-[#0A2A1A] text-[#C9A227] font-bold py-5 rounded-lg transition-all shadow-2xl active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="tracking-[0.3em] text-xs uppercase">VERIFY & ENTER</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full text-[9px] font-mono uppercase tracking-[0.3em] text-gray-400 hover:text-[#C9A227] transition-colors font-bold"
                >
                  Return to Protocol
                </button>
              </form>
            )}
          </div>
          
          <div className="bg-gray-50/80 p-6 border-t border-gray-100 text-center space-y-1">
            <p className="text-[10px] font-bold text-[#05190F]/60 uppercase tracking-widest">
              Authorized Personnel Only
            </p>
            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">
              Access Attempts Are Logged & Monitored
            </p>
            <p className="text-[9px] font-mono text-[#C9A227] font-bold uppercase tracking-widest pt-1">
              Nandara Corporation Security Division
            </p>
          </div>
        </div>

        {/* Global Support */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em]">
            System Node: ID-JKT-01 • v2.4.1-Enterprise
          </p>
          <p className="text-[11px] text-white/50">
            Authentication issues? Contact{' '}
            <a href="mailto:support@nandaranusamontierra.com" className="text-[#C9A227] hover:text-[#D4AF37] font-bold underline underline-offset-4 decoration-[#C9A227]/30 transition-all">
              Security Division
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
