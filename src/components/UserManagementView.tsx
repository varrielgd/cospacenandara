import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, ShieldCheck, Mail, ShieldAlert, Loader2, User, Key } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function UserManagementView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for new admin
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          firstName: newFirstName,
          lastName: newLastName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add admin');
      }

      setSuccess(`Admin invitation sent to ${newEmail}. They must verify their email with the 6-digit code sent.`);
      setNewEmail('');
      setNewPassword('');
      setNewFirstName('');
      setNewLastName('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${email}? This action is permanent.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess(`Access revoked for ${email}`);
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const permanentEmails = ['nandaranusamontierra@gmail.com', 'nandalatifanibudiarti97@gmail.com'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl border border-primary/5 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-xl font-serif text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            Admin Hierarchy & Access Control
          </h3>
          <p className="text-xs text-gray-500 font-mono tracking-wider uppercase">
            Nandara Corporation Security Division • Personnel Management
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
          <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Master Control Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add New Admin Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-primary/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <UserPlus className="w-24 h-24 text-primary" />
            </div>
            
            <h4 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              Provision New Admin
            </h4>

            <form onSubmit={handleAddAdmin} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold ml-1">First Name</label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-gold focus:bg-white transition-all rounded-xl py-3 px-4 text-sm outline-none"
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold ml-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 focus:border-gold focus:bg-white transition-all rounded-xl py-3 px-4 text-sm outline-none"
                  placeholder="Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold opacity-50" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-gold focus:bg-white transition-all rounded-xl py-3 pl-12 pr-4 text-sm outline-none"
                    placeholder="admin@nandaranusamontierra.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold ml-1">Temporary Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold opacity-50" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-gold focus:bg-white transition-all rounded-xl py-3 pl-12 pr-4 text-sm outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-600 text-[10px] font-bold flex items-center gap-2 uppercase tracking-tight">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-[10px] font-bold flex items-center gap-2 uppercase tracking-tight">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-gold font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 uppercase tracking-widest text-[11px]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Authorize Admin
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Admins Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-primary/5 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-primary/5 flex justify-between items-center bg-gray-50/50">
              <h4 className="text-sm font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                Authorized Personnel Directory
              </h4>
              <span className="text-[10px] font-mono text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                {users.length} Active Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-primary/5 bg-gray-50/30">
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400">Personnel</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400">Role & Status</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400">Security Clearance</th>
                    <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto opacity-40" />
                        <p className="text-[10px] font-mono text-gray-400 mt-4 uppercase tracking-widest">Querying Personnel DB...</p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <User className="w-8 h-8 text-gray-200 mx-auto" />
                        <p className="text-[10px] font-mono text-gray-400 mt-4 uppercase tracking-widest">No personnel records found.</p>
                      </td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary opacity-60" />
                          </div>
                          <div>
                            <p className="text-sm font-serif text-primary">{user.firstName} {user.lastName}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-primary text-gold border border-gold/20">
                            {user.role}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {user.isVerified ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                                <ShieldCheck className="w-3 h-3" /> VERIFIED
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                                <ShieldAlert className="w-3 h-3" /> PENDING VERIFICATION
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-mono">Commissioned:</p>
                          <p className="text-[10px] font-bold text-primary font-mono">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {!permanentEmails.includes(user.email) ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-gold/40 uppercase tracking-widest pr-2 italic">Immutable System Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 p-6 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-gold shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Protocol Notice</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Maximum allocation of 4 administrator accounts is enforced. All access events are logged by the Security Division. 
                revoking access will immediately terminate all active sessions for the target personnel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
