
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, User, Database, Globe, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function ConnectionTestView() {
  const [status, setStatus] = useState<{
    backend: 'checking' | 'ok' | 'error';
    database: 'checking' | 'ok' | 'error';
    auth: 'checking' | 'ok' | 'error';
    user: any | null;
    error: string | null;
  }>({
    backend: 'checking',
    database: 'checking',
    auth: 'checking',
    user: null,
    error: null,
  });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, backend: 'checking', database: 'checking', auth: 'checking', error: null }));
    
    try {
      // 1. Check Backend & Database Status
      // Assuming there's a health check endpoint, or just try to hit any public endpoint
      try {
        const healthData = await api.get('/api/auth/me'); // Using /me as it checks both auth and DB
        setStatus(prev => ({
          ...prev,
          backend: 'ok',
          database: 'ok',
          auth: 'ok',
          user: healthData,
        }));
      } catch (err: any) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          setStatus(prev => ({
            ...prev,
            backend: 'ok',
            database: 'ok',
            auth: 'error',
            error: 'Authentication failed. Please log in again.',
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            backend: 'error',
            database: 'error',
            auth: 'error',
            error: err.message,
          }));
        }
      }
    } catch (err: any) {
      setStatus(prev => ({
        ...prev,
        backend: 'error',
        error: err.message,
      }));
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const StatusIcon = ({ state }: { state: 'checking' | 'ok' | 'error' }) => {
    if (state === 'checking') return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    if (state === 'ok') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-white mb-2">System Diagnostics</h2>
          <p className="text-gray-400 text-sm">Verify frontend-to-backend integration and security protocols.</p>
        </div>
        <button 
          onClick={checkConnection}
          className="px-4 py-2 bg-[#C9A227] text-[#05190F] rounded-lg text-sm font-bold hover:bg-[#D4AF37] transition-colors"
        >
          Re-run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend Status */}
        <div className="bg-[#0A2A1A] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <StatusIcon state={status.backend} />
          </div>
          <div>
            <h3 className="text-white font-medium">API Gateway</h3>
            <p className="text-gray-500 text-xs mt-1">Connection to http://localhost:4000</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-[#0A2A1A] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Database className="w-6 h-6 text-emerald-500" />
            </div>
            <StatusIcon state={status.database} />
          </div>
          <div>
            <h3 className="text-white font-medium">Persistence Layer</h3>
            <p className="text-gray-500 text-xs mt-1">PostgreSQL Database connectivity</p>
          </div>
        </div>

        {/* Auth Status */}
        <div className="bg-[#0A2A1A] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <StatusIcon state={status.auth} />
          </div>
          <div>
            <h3 className="text-white font-medium">Auth Protocol</h3>
            <p className="text-gray-500 text-xs mt-1">JWT Bearer Token validation</p>
          </div>
        </div>
      </div>

      {status.user && (
        <div className="bg-[#0A2A1A] border border-[#C9A227]/20 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-[#C9A227]/20 flex items-center justify-center border border-[#C9A227]/30">
              <User className="w-8 h-8 text-[#C9A227]" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-xl font-serif text-white">Authenticated Session</h4>
                <p className="text-gray-400 text-sm">Current secure session details</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">User ID</p>
                  <p className="text-sm text-white font-mono mt-1">{status.user.id}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm text-white font-mono mt-1">{status.user.email}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Role/Permissions</p>
                  <p className="text-sm text-[#C9A227] font-mono mt-1">{status.user.role || 'Permanent Admin'}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Full Name</p>
                  <p className="text-sm text-white font-mono mt-1">{status.user.firstName} {status.user.lastName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-400">
          <XCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Diagnostic Error</p>
            <p className="mt-1 opacity-80">{status.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
