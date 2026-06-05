import React, { useState, useEffect } from 'react';
import { Lead, EmailLog, Sample, Quotation, SystemConfig } from './types';
import DashboardView from './components/DashboardView';
import DiscoveryView from './components/DiscoveryView';
import CrmView from './components/CrmView';
import EmailGeneratorView from './components/EmailGeneratorView';
import SampleView from './components/SampleView';
import QuotationView from './components/QuotationView';
import SheetsIntegrationView from './components/SheetsIntegrationView';
import AIContentStudioView from './components/AIContentStudioView';
import BrandPortalView from './components/BrandPortalView';
import CurriculumView from './components/CurriculumView';
import GlossaryView from './components/GlossaryView';
import EmailManagementView from './components/EmailManagementView';
import LoginView from './components/LoginView';
import UserManagementView from './components/UserManagementView';
import { 
  Compass, 
  Users, 
  Mail, 
  Beaker, 
  FileText, 
  FileSpreadsheet, 
  LayoutDashboard, 
  Coffee,
  Globe,
  Settings,
  Share2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Layout,
  Inbox,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';

const INITIAL_LEADS: Lead[] = [];
const INITIAL_SAMPLES: Sample[] = [];
const INITIAL_EMAILS: EmailLog[] = [];
const INITIAL_QUOTES: Quotation[] = [];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [activeLang, setActiveLang] = useState<string>('id');
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('nandara_ciis_active_tab', tab);
  };

  // Persistence States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [config, setConfig] = useState<SystemConfig>({ googleAppsScriptUrl: '', isSynced: false });

  // Direct tab linkage States
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const [selectedLeadForSample, setSelectedLeadForSample] = useState<Lead | null>(null);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);

  const handleLoginSuccess = (token: string, user: any) => {
    localStorage.setItem('token', token);
    setCurrentUser(user);
    setIsAuthenticated(true);
    fetchData(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('discoverySessionId');
    localStorage.removeItem('discoveryLastResults');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLeads([]);
    setEmails([]);
    setSamples([]);
    setQuotations([]);
    window.location.href = '/'; // Hard redirect to clear state
  };

  const fetchData = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const responses = await Promise.all([
        fetch('/api/importers', { headers }),
        fetch('/api/samples', { headers }),
        fetch('/api/quotations', { headers }),
        fetch('/api/emails', { headers })
      ]);

      // Global 401 interceptor
      if (responses.some(r => r.status === 401)) {
        console.warn('Unauthorized detected in batch fetch. Logging out.');
        handleLogout();
        return;
      }

      const [leadsRes, samplesRes, quotesRes, emailsRes] = responses;

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (samplesRes.ok) setSamples(await samplesRes.json());
      if (quotesRes.ok) setQuotations(await quotesRes.json());
      if (emailsRes.ok) setEmails(await emailsRes.json());

    } catch (err) {
      console.error('Error fetching data from database:', err);
    }
  };

  // Load from Database
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token and get user info
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const userData = await res.json();
            setCurrentUser(userData);
            setIsAuthenticated(true);
            fetchData(token);
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    const savedActiveTab = localStorage.getItem('nandara_ciis_active_tab');
    if (savedActiveTab) setActiveTabState(savedActiveTab);
    const savedConfig = localStorage.getItem('nandara_ciis_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  // Database update helpers
   const refreshLeads = async () => {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/importers', { 
       headers: { 'Authorization': `Bearer ${token}` } 
     });
     if (res.ok) setLeads(await res.json());
   };

   const refreshEmails = async () => {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/emails', { 
       headers: { 'Authorization': `Bearer ${token}` } 
     });
     if (res.ok) setEmails(await res.json());
   };

   const refreshSamples = async () => {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/samples', { 
       headers: { 'Authorization': `Bearer ${token}` } 
     });
     if (res.ok) setSamples(await res.json());
   };

   const refreshQuotations = async () => {
     const token = localStorage.getItem('token');
     const res = await fetch('/api/quotations', { 
       headers: { 'Authorization': `Bearer ${token}` } 
     });
     if (res.ok) setQuotations(await res.json());
   };

  // State manipulation triggers
  const handleAddDiscoveryLeads = () => {
    // Discovery results are already saved to DB by backend
    // Just refresh the frontend list
    refreshLeads();
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/importers/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        refreshLeads();
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleUpdateMultipleLeadsStatus = async (leadIds: string[], newStatus: Lead['status']) => {
    // For simplicity, update each one or create a bulk endpoint
    for (const id of leadIds) {
      await handleUpdateLeadStatus(id, newStatus);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/importers/${leadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        refreshLeads();
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleAddLeadManual = async (leadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/importers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        refreshLeads();
      }
    } catch (err) {
      console.error('Error adding lead manually:', err);
    }
  };

  const handleSaveOrUpdateEmail = async (emailData: EmailLog) => {
    try {
      const token = localStorage.getItem('token');
      const isNew = !emailData.id || emailData.id.includes('draft');
      const url = isNew ? '/api/emails' : `/api/emails/${emailData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        refreshEmails();
        // Update status to 'Contacted' automatically if sent
        if (emailData.status === 'Sent') {
          handleUpdateLeadStatus(emailData.leadId, 'Contacted');
        }
      }
    } catch (err) {
      console.error('Error saving email:', err);
    }
  };

  const handleAddSample = async (sampleData: Omit<Sample, 'id' | 'sampleRequestDate'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/samples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sampleData)
      });

      if (response.ok) {
        refreshSamples();
        // Mark status on CRM as "Sample Requested" or "Sample Sent"
        const targetState = sampleData.status === 'Shipped' ? 'Sample Sent' : 'Sample Requested';
        handleUpdateLeadStatus(sampleData.leadId, targetState);
      }
    } catch (err) {
      console.error('Error adding sample:', err);
    }
  };

  const handleUpdateSampleStatus = async (sampleId: string, targetStatus: Sample['status'], trackingNumber?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/samples/${sampleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus, trackingNumber })
      });

      if (response.ok) {
        refreshSamples();
        
        // Find leadId for the sample to update status
        const sample = samples.find(s => s.id === sampleId);
        if (sample) {
          if (targetStatus === 'Shipped') {
            handleUpdateLeadStatus(sample.leadId, 'Sample Sent');
          } else if (targetStatus === 'Delivered') {
            handleUpdateLeadStatus(sample.leadId, 'Replied');
          }
        }
      }
    } catch (err) {
      console.error('Error updating sample status:', err);
    }
  };

  const handleAddQuotation = async (quoteData: Omit<Quotation, 'quoteNumber' | 'dateCreated'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        refreshQuotations();
        // Automatically advance CRM status to "Quotation Sent" if draft isn't default
        const targetStatus = quoteData.status === 'Sent' ? 'Quotation Sent' : 'Negotiation';
        handleUpdateLeadStatus(quoteData.leadId, targetStatus);
      }
    } catch (err) {
      console.error('Error adding quotation:', err);
    }
  };

  const handleUpdateQuotationStatus = async (number: string, targetStatus: Quotation['status']) => {
    try {
      const token = localStorage.getItem('token');
      // Need to find ID by quotation number or update API to accept number
      const quote = quotations.find(q => q.quoteNumber === number)!
      if (!quote) return;

const response = await fetch(`/api/quotations/${quote.quoteNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });

      if (response.ok) {
        refreshQuotations();
        if (targetStatus === 'Accepted') {
          handleUpdateLeadStatus(quote.leadId, 'Order Confirmed');
        } else if (targetStatus === 'Sent') {
          handleUpdateLeadStatus(quote.leadId, 'Quotation Sent');
        } else if (targetStatus === 'Declined') {
          handleUpdateLeadStatus(quote.leadId, 'Closed Lost');
        }
      }
    } catch (err) {
      console.error('Error updating quotation status:', err);
    }
  };

  const handleUpdateConfig = (newUrl: string) => {
    const updated = { ...config, googleAppsScriptUrl: newUrl };
    setConfig(updated);
    localStorage.setItem('nandara_ciis_config', JSON.stringify(updated));
  };

  // MODULE 7 - Google Sheets synchronization engine (Live integration lookup)
  const handleSyncAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to sync with Google Sheets');

      // Simple wait and state save
      const updated = { ...config, isSynced: true };
      setConfig(updated);
      localStorage.setItem('nandara_ciis_config', JSON.stringify(updated));
      alert("Database successfully synced to Google Sheets!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Sync failed.');
    }
  };

  const handleSelectLeadForEmail = (lead: Lead) => {
    setSelectedLeadForEmail(lead);
    setActiveTab('email');
  };

  const handleSelectLeadForSample = (lead: Lead) => {
    setSelectedLeadForSample(lead);
    setActiveTab('samples');
  };

  const handleSelectLeadForQuote = (lead: Lead) => {
    setSelectedLeadForQuote(lead);
    setActiveTab('quotation');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-serif italic text-primary tracking-widest uppercase text-xs">Initializing Secure Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-bg-ivory flex text-primary font-sans" id="application-container">
      {/* Premium Dark Side Menu */}
      <aside className="w-64 bg-primary border-r border-gold/30 flex flex-col justify-between print:hidden shrink-0">
        <div className="p-0 space-y-0">
          {/* Logo Brand signature - matching exactly the Luxury layout */}
          <div className="p-[30px_20px_25px_20px] border-b border-gold/10 flex flex-col items-center justify-center text-center">
            <h1 className="font-serif font-medium text-sm tracking-wider text-gold uppercase leading-tight whitespace-nowrap">
              Nandara Nusa Montierra
            </h1>
            <div className="text-[8px] font-mono text-gold opacity-60 mt-1.5 tracking-widest uppercase block">
              CIIS • EXPORT INTELLIGENCE
            </div>
          </div>

          {/* User Profile Mini Card */}
          {currentUser && (
            <div className="px-7 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-white truncate">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-[8px] text-gold/60 font-mono uppercase tracking-tighter truncate">{currentUser.role}</p>
              </div>
            </div>
          )}

          {/* Navigation Links and icons */}
          <nav className="py-6 space-y-1 text-[11px] font-sans uppercase tracking-widest">
            {/* Language Selector built-in */}
            <div className="px-7 pb-4 mb-4 border-b border-white/5">
              <div className="flex gap-1.5 uppercase text-[9px] items-center text-[#D4AF37] mb-2 font-bold">
                <Globe className="w-3" />
                <span>Global Language</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'id', label: 'ID' },
                  { id: 'en', label: 'EN' },
                  { id: 'zh-CN', label: 'ZH' },
                  { id: 'ja', label: 'JA' },
                  { id: 'de', label: 'DE' },
                ].map((lang) => {
                  const targetCookie = `/id/${lang.id}`;
                  const isIdEmpty = lang.id === 'id' && (!document.cookie.includes('googtrans') || document.cookie.includes('/id/id'));
                  const isActive = isIdEmpty || document.cookie.includes(targetCookie);

                  return (
                    <button
                      key={lang.id}
                      onClick={() => {
                        document.cookie = `googtrans=${targetCookie}; path=/`;
                        document.cookie = `googtrans=${targetCookie}; domain=${window.location.hostname}; path=/`;
                        window.location.reload();
                      }}
                      className={`px-2 py-1 text-[9px] font-mono border rounded transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C9A227] text-[#05190F] border-[#C9A227] font-bold'
                          : 'border-[#C9A227]/30 text-gray-400 hover:text-[#C9A227] hover:border-[#C9A227] bg-[#05190F]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'dashboard' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-gold" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-studio')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'ai-studio' 
                  ? 'bg-white/5 text-[#d4af37] font-semibold border-[#d4af37] opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Layout className="w-4 h-4 shrink-0 text-[#d4af37]" />
              <span className="text-[#d4af37]">AI Content Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('showroom')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'showroom' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Coffee className="w-4 h-4 shrink-0 text-gold" />
              <span>B2B Showroom</span>
            </button>

            <button
              onClick={() => setActiveTab('discovery')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'discovery' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-gold" />
              <span>Importer Discovery</span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'crm' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-gold" />
              <span>Lead Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'email' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0 text-gold" />
              <span>Outreach Composer</span>
            </button>

            <button
              onClick={() => setActiveTab('email-management')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'email-management' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Inbox className="w-4 h-4 shrink-0 text-gold" />
              <span>Mail Management</span>
            </button>

            <button
              onClick={() => setActiveTab('samples')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'samples' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Beaker className="w-4 h-4 shrink-0 text-gold" />
              <span>Sample Tracking</span>
            </button>

            <button
              onClick={() => setActiveTab('quotation')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'quotation' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-gold" />
              <span>Quotation Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'curriculum' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0 text-gold" />
              <span>Export Academy</span>
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'glossary' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-gold" />
              <span>Industry Glossary</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'sheets' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-gold" />
              <span>Sheets Sync Config</span>
            </button>

            {/* Super Admin Only Tab */}
            {currentUser && ['nandaranusamontierra@gmail.com', 'nandalatifanibudiarti97@gmail.com'].includes(currentUser.email) && (
              <button
                onClick={() => setActiveTab('personnel')}
                className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                  activeTab === 'personnel' 
                    ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                    : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-gold" />
                <span>Personnel Control</span>
              </button>
            )}
          </nav>
        </div>

        {/* Static signature bottom */}
        <div className="p-[30px] border-t border-white/5 space-y-4 text-[10px] font-mono text-gray-500">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-gold/60 hover:text-gold transition-colors uppercase tracking-widest text-[9px] font-bold py-2 px-1 border border-gold/10 hover:border-gold/30 rounded"
          >
            <LogOut className="w-3 h-3" />
            <span>Terminate Session</span>
          </button>
          
          <div className="space-y-2">
            <p>System Version 2.4.1</p>
            <div className="flex gap-1.5 pt-1 uppercase text-[9px] items-center text-[#D4AF37]">
              <Globe className="w-3" />
              <span>Nandara Global Control</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-[40px] overflow-y-auto space-y-8 max-h-screen">
        {/* Top Header navbar with luxury styling */}
        <header className="flex justify-between items-center pb-6 border-b border-primary/10 print:hidden">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-serif italic tracking-wide text-primary" id="active-tab-title">
              {activeTab === 'dashboard' && "Pipeline Overview"}
              {activeTab === 'ai-studio' && "AI Content Studio & Brand Narrative"}
              {activeTab === 'showroom' && "Nandara Sourcing Showroom & Portals"}
              {activeTab === 'discovery' && "Worldwide Importer Search Engine"}
              {activeTab === 'crm' && "Indonesian Export Leads CRM Board"}
              {activeTab === 'email' && "AI Personalized B2B Pitch Suite"}
              {activeTab === 'email-management' && "Direct Mail Management (Hostinger)"}
              {activeTab === 'samples' && "Specialty Physical Samples Dispatch"}
              {activeTab === 'quotation' && "Export Quota and Commercial Terms"}
              {activeTab === 'curriculum' && "Premium Export Academy & Curriculum"}
              {activeTab === 'sheets' && "Google Sheet Automation Config"}
              {activeTab === 'personnel' && "Admin Hierarchy & Access Control"}
            </h2>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              Coffee Importer Intelligence System • Java, Gayo, Toraja Premium Specialties
            </p>
          </div>

          <div className="flex gap-4 text-[10px] font-mono uppercase tracking-wider items-center">
            {config.googleAppsScriptUrl ? (
              <span className="flex items-center gap-1.5 bg-[#05190F]/5 border border-gold/30 text-emerald-800 p-2 px-3 rounded-md font-bold">
                ✓ Online Sheets Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-[#05190F]/5 border border-[#05190F]/20 text-neutral-600 p-2 px-3 rounded-md">
                ⚠ Offline Local Mode
              </span>
            )}
          </div>
        </header>

        {/* Tab views Routing */}
        <div className="min-h-[500px]" id="routing-views-wrapper">
          {activeTab === 'dashboard' && (
            <DashboardView 
              leads={leads} 
              samples={samples} 
              quotations={quotations} 
              emails={emails} 
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ai-studio' && (
            <AIContentStudioView />
          )}

          {activeTab === 'discovery' && (
            <DiscoveryView 
              onAddLeads={handleAddDiscoveryLeads}
              existingLeads={leads}
            />
          )}

          {activeTab === 'showroom' && (
            <BrandPortalView 
              leads={leads}
              onAddSample={handleAddSample}
              onAddLeadManual={handleAddLeadManual}
              googleAppsScriptUrl={config.googleAppsScriptUrl}
            />
          )}

          {activeTab === 'crm' && (
            <CrmView 
              leads={leads}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateMultipleLeadsStatus={handleUpdateMultipleLeadsStatus}
              onDeleteLead={handleDeleteLead}
              onAddLeadManual={handleAddLeadManual}
              onSelectLeadForEmail={handleSelectLeadForEmail}
              onSelectLeadForSample={handleSelectLeadForSample}
              onSelectLeadForQuote={handleSelectLeadForQuote}
            />
          )}

          {activeTab === 'email' && (
            <EmailGeneratorView 
              leads={leads}
              selectedLead={selectedLeadForEmail}
              onSaveOrUpdateEmail={handleSaveOrUpdateEmail}
              emailLogs={emails}
              quotations={quotations}
            />
          )}

          {activeTab === 'email-management' && (
            <EmailManagementView />
          )}

          {activeTab === 'samples' && (
            <SampleView 
              samples={samples}
              leads={leads}
              onAddSample={handleAddSample}
              onUpdateSampleStatus={handleUpdateSampleStatus}
            />
          )}

          {activeTab === 'quotation' && (
            <QuotationView 
              quotations={quotations}
              leads={leads}
              onAddQuotation={handleAddQuotation}
              onUpdateQuotationStatus={handleUpdateQuotationStatus}
            />
          )}

          {activeTab === 'curriculum' && (
            <CurriculumView leads={leads} />
          )}

          {activeTab === 'glossary' && (
            <GlossaryView />
          )}

          {activeTab === 'sheets' && (
            <SheetsIntegrationView 
              config={config}
              leads={leads}
              emails={emails}
              samples={samples}
              quotations={quotations}
              onUpdateConfig={handleUpdateConfig}
              onSyncAll={handleSyncAll}
            />
          )}

          {activeTab === 'personnel' && (
            <UserManagementView />
          )}
        </div>
      </main>
    </div>
  );
}
