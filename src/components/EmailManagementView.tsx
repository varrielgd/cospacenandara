import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface Email {
  id: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  status: string;
  direction: 'INBOUND' | 'OUTBOUND';
  receivedAt?: string;
  sentAt?: string;
  createdAt: string;
}

export default function EmailManagementView() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'sent'>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // Compose States
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'inbox' ? '/api/emails/inbox' : '/api/emails';
      let data = await api.get(endpoint);
      if (activeTab === 'sent') {
        data = data.filter((e: Email) => e.direction === 'OUTBOUND' && e.status === 'SENT');
      }
      setEmails(data);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'compose') {
      fetchEmails();
    }
  }, [activeTab]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Unauthorized. Please log in again.');
      }

      await api.post('/api/emails/sync', {});
      fetchEmails();
    } catch (err: any) {
      const rawMessage = err?.message || 'Failed to sync email inbox. Please try again.';
      const normalizedMessage = /user no longer exists|token expired|invalid token|unauthorized/i.test(rawMessage)
        ? 'Session expired or invalid credentials. Please log in again.'
        : rawMessage;

      if (/user no longer exists|token expired|invalid token|unauthorized/i.test(rawMessage)) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth:logout'));
      }

      console.error('Sync error:', normalizedMessage);
      alert(normalizedMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await api.post('/api/emails/send-direct', { to, subject, body });
      alert('Email sent successfully!');
      setTo('');
      setSubject('');
      setBody('');
      setActiveTab('sent');
    } catch (err: any) {
      console.error('Send error:', err);
      alert('Failed to send: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border border-primary/10 shadow-luxury overflow-hidden flex h-[600px]">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-100 bg-gray-50/50 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button 
            onClick={() => { setActiveTab('compose'); setSelectedEmail(null); }}
            className="w-full py-2.5 bg-primary text-gold rounded-md text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
          >
            
            Compose
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button 
            onClick={() => { setActiveTab('inbox'); setSelectedEmail(null); }}
            className={`w-full text-left px-4 py-3 rounded-md text-xs font-mono uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'inbox' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            
            Inbox
          </button>
          <button 
            onClick={() => { setActiveTab('sent'); setSelectedEmail(null); }}
            className={`w-full text-left px-4 py-3 rounded-md text-xs font-mono uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'sent' ? 'bg-primary/5 text-primary font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            
            Sent
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase mb-2">
            
            marketing@nandara...
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full py-2 border border-gray-200 text-gray-500 rounded-md text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
          >
            
            {isSyncing ? 'Syncing...' : 'Sync Mailbox'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeTab === 'compose' ? (
          <div className="p-8 max-w-2xl mx-auto w-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/5 rounded-full">
                
              </div>
              <h3 className="text-xl font-serif text-primary">New B2B Outreach</h3>
            </div>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Recipient</label>
                <input 
                  type="email" 
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gold transition-all text-sm"
                  placeholder="importer@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gold transition-all text-sm"
                  placeholder="Partnership Inquiry: Indonesian Specialty Coffee"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Message Body</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gold transition-all text-sm resize-none"
                  placeholder="Write your professional outreach here..."
                  required
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSending}
                  className="px-8 py-3 bg-primary text-gold rounded-md text-xs font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isSending ? '...' : '→'}
                  Send Email
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {selectedEmail ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedEmail(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500"
                  >
                    
                  </button>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-500">
                      
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="mb-8">
                    <h3 className="text-2xl font-serif text-primary mb-4">{selectedEmail.subject}</h3>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                        {selectedEmail.from.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-gray-900">{selectedEmail.from}</span>
                          <span className="text-[10px] font-mono text-gray-400">{formatDate(selectedEmail.receivedAt || selectedEmail.sentAt)}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">To: {selectedEmail.to}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-100 pt-8">
                    {selectedEmail.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                    
                    <p className="text-xs font-mono uppercase tracking-widest">Loading mailbox...</p>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                    
                    <p className="text-xs font-mono uppercase tracking-widest">No messages found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {emails.map((email) => (
                      <div 
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-all flex items-start gap-4"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {email.from.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-bold text-gray-900 truncate">{email.from}</span>
                            <span className="text-[9px] font-mono text-gray-400 shrink-0">{formatDate(email.receivedAt || email.sentAt).split(',')[0]}</span>
                          </div>
                          <div className="text-xs text-primary font-medium truncate mb-0.5">{email.subject}</div>
                          <div className="text-[11px] text-gray-500 truncate line-clamp-1">{email.body.substring(0, 100)}...</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
