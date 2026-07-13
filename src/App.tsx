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
import ConnectionTestView from './components/ConnectionTestView';
import SupplierView from './components/SupplierView';
import PhysicalInventoryView from './components/PhysicalInventoryView';
import QualityControlView from './components/QualityControlView';
import ExportContractsView from './components/ExportContractsView';
import ShipmentTrackingView from './components/ShipmentTrackingView';
import FXHedgingView from './components/FXHedgingView';
import SystemSettingsView from './components/SystemSettingsView';
import { api } from './utils/api';
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
  ShieldCheck,
  Activity,
  Package,
  Warehouse,
  FlaskConical,
  FileCheck,
  Truck,
  TrendingUp
} from 'lucide-react';

const INITIAL_LEADS: Lead[] = [];
const INITIAL_SAMPLES: Sample[] = [];
const INITIAL_EMAILS: EmailLog[] = [];
const INITIAL_QUOTES: Quotation[] = [];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [activeTab, setActiveTabState] = useState<string>('buyer-crm');
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
      const [leads, samplesData, quotationsData, emailsData] = await Promise.all([
        api.get('/api/importers'),
        api.get('/api/samples'),
        api.get('/api/quotations'),
        api.get('/api/emails'),
      ]);

      setLeads(leads || []);
      setSamples(samplesData || []);
      setQuotations(quotationsData || []);
      setEmails(emailsData || []);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('unauthorized')) {
        console.warn('Unauthorized detected in batch fetch. Logging out.');
        handleLogout();
        return;
      }
      console.error('Error fetching data from database:', err);
    }
  };

  // Listen for auth:logout event from api.ts
  useEffect(() => {
    const handleAuthLogout = () => {
      handleLogout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  // Load from Database
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token and get user info
          const userData = await api.get('/api/auth/me');
          if (userData) {
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
     const leads = await api.get('/api/importers');
     if (leads) setLeads(leads);
   };

   const refreshEmails = async () => {
     const emailsData = await api.get('/api/emails');
     if (emailsData) setEmails(emailsData);
   };

   const refreshSamples = async () => {
     const samplesData = await api.get('/api/samples');
     if (samplesData) setSamples(samplesData);
   };

   const refreshQuotations = async () => {
     const quotationsData = await api.get('/api/quotations');
     if (quotationsData) setQuotations(quotationsData);
   };

  // State manipulation triggers
  const handleAddDiscoveryLeads = () => {
    // Discovery results are already saved to DB by backend
    // Just refresh the frontend list
    refreshLeads();
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await api.put(`/api/importers/${leadId}`, { status: newStatus });
      refreshLeads();
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
      await api.delete(`/api/importers/${leadId}`);
      refreshLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleAddLeadManual = async (leadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    try {
      await api.post('/api/importers', leadData);
      refreshLeads();
    } catch (err) {
      console.error('Error adding lead manually:', err);
    }
  };

  const handleImportLeads = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/api/importers/import', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Importers imported successfully!');
      refreshLeads();
    } catch (err) {
      console.error('Error importing importers:', err);
    }
  };

  const handleSaveOrUpdateEmail = async (emailData: EmailLog) => {
    try {
      const isNew = !emailData.id || emailData.id.includes('draft');
      const url = isNew ? '/api/emails' : `/api/emails/${emailData.id}`;
      const method = isNew ? api.post : api.put;

      await method(url, emailData);
      refreshEmails();
      if (emailData.status === 'Sent') {
        handleUpdateLeadStatus(emailData.leadId, 'Contacted');
      }
    } catch (err) {
      console.error('Error saving email:', err);
    }
  };

  const handleAddSample = async (sampleData: Omit<Sample, 'id' | 'sampleRequestDate'>) => {
    try {
      await api.post('/api/samples', sampleData);
      refreshSamples();
      const targetState = sampleData.status === 'Shipped' ? 'Sample Sent' : 'Sample Requested';
      handleUpdateLeadStatus(sampleData.leadId, targetState);
    } catch (err) {
      console.error('Error adding sample:', err);
    }
  };

  const handleUpdateSampleStatus = async (sampleId: string, targetStatus: Sample['status'], trackingNumber?: string) => {
    try {
      await api.put(`/api/samples/${sampleId}`, { status: targetStatus, trackingNumber });
      refreshSamples();
      const sample = samples.find(s => s.id === sampleId);
      if (sample) {
        if (targetStatus === 'Shipped') {
          handleUpdateLeadStatus(sample.leadId, 'Sample Sent');
        } else if (targetStatus === 'Delivered') {
          handleUpdateLeadStatus(sample.leadId, 'Replied');
        }
      }
    } catch (err) {
      console.error('Error updating sample status:', err);
    }
  };

  const handleAddQuotation = async (quoteData: Omit<Quotation, 'quoteNumber' | 'dateCreated'>) => {
    try {
      await api.post('/api/quotations', quoteData);
      refreshQuotations();
      const targetStatus = quoteData.status === 'Sent' ? 'Quotation Sent' : 'Negotiation';
      handleUpdateLeadStatus(quoteData.leadId, targetStatus);
    } catch (err) {
      console.error('Error adding quotation:', err);
    }
  };

  const handleUpdateQuotationStatus = async (number: string, targetStatus: Quotation['status']) => {
    try {
      const quote = quotations.find(q => q.quoteNumber === number);
      if (!quote) return;

      await api.put(`/api/quotations/${quote.quoteNumber}`, { status: targetStatus });
      refreshQuotations();
      if (targetStatus === 'Accepted') {
        handleUpdateLeadStatus(quote.leadId, 'Order Confirmed');
      } else if (targetStatus === 'Sent') {
        handleUpdateLeadStatus(quote.leadId, 'Quotation Sent');
      } else if (targetStatus === 'Declined') {
        handleUpdateLeadStatus(quote.leadId, 'Closed Lost');
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
  const handleSyncToSheets = async () => {
    try {
      await api.post('/api/dashboard/sync-sheets', {});
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
                  
                  { id: 'en', label: 'EN' },
                  
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

            <div className="px-7 pb-2 mb-2 text-[9px] text-gold/60 font-mono uppercase tracking-widest">
              CRM Modules
            </div>

            <button
              onClick={() => setActiveTab('buyer-crm')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'buyer-crm' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-gold" />
              <span>Buyer CRM Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('physical-inventory')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'physical-inventory' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Warehouse className="w-4 h-4 shrink-0 text-gold" />
              <span>Physical Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('quality-control')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'quality-control' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <FlaskConical className="w-4 h-4 shrink-0 text-gold" />
              <span>Quality Control</span>
            </button>

            <button
              onClick={() => setActiveTab('export-contracts')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'export-contracts' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0 text-gold" />
              <span>Export Contracts</span>
            </button>

            <button
              onClick={() => setActiveTab('shipment-tracking')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'shipment-tracking' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0 text-gold" />
              <span>Shipment Tracking</span>
            </button>

            <button
              onClick={() => setActiveTab('fx-hedging')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'fx-hedging' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-gold" />
              <span>FX & Hedging Desk</span>
            </button>

            <button
              onClick={() => setActiveTab('system-settings')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'system-settings' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-gold" />
              <span>System Settings</span>
            </button>

            <div className="border-t border-white/5 my-3" />

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
              onClick={() => setActiveTab('suppliers')}
              className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                activeTab === 'suppliers' 
                  ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                  : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
              }`}
            >
              <Package className="w-4 h-4 shrink-0 text-gold" />
              <span>Supplier Management</span>
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
              <>
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
                <button
                  onClick={() => setActiveTab('connection-test')}
                  className={`w-full text-left px-7 py-3.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] ${
                    activeTab === 'connection-test' 
                      ? 'bg-white/5 text-gold font-semibold border-gold opacity-100' 
                      : 'text-gray-300 opacity-70 hover:opacity-100 hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0 text-gold" />
                  <span>System Health</span>
                </button>
              </>
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
              {activeTab === 'buyer-crm' && "Buyer CRM Desk"}
              {activeTab === 'physical-inventory' && "Physical Inventory"}
              {activeTab === 'quality-control' && "Quality Control"}
              {activeTab === 'export-contracts' && "Export Contracts"}
              {activeTab === 'shipment-tracking' && "Shipment Tracking"}
              {activeTab === 'fx-hedging' && "FX & Hedging Desk"}
              {activeTab === 'system-settings' && "System Settings"}
              {activeTab === 'ai-studio' && "AI Content Studio & Brand Narrative"}
              {activeTab === 'showroom' && "Nandara Sourcing Showroom & Portals"}
              {activeTab === 'suppliers' && "Supplier Management & Procurement"}
              {activeTab === 'discovery' && "Worldwide Importer Search Engine"}
              {activeTab === 'crm' && "Indonesian Export Leads CRM Board"}
              {activeTab === 'email' && "AI Personalized B2B Pitch Suite"}
              {activeTab === 'email-management' && "Direct Mail Management (Hostinger)"}
              {activeTab === 'samples' && "Specialty Physical Samples Dispatch"}
              {activeTab === 'quotation' && "Export Quota and Commercial Terms"}
              {activeTab === 'curriculum' && "Premium Export Academy & Curriculum"}
              {activeTab === 'sheets' && "Google Sheet Automation Config"}
              {activeTab === 'personnel' && "Admin Hierarchy & Access Control"}
              {activeTab === 'connection-test' && "System Connectivity & Health"}
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

          {activeTab === 'buyer-crm' && (
            <CrmView 
              leads={leads}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateMultipleLeadsStatus={handleUpdateMultipleLeadsStatus}
              onDeleteLead={handleDeleteLead}
              onAddLeadManual={handleAddLeadManual}
              onImportLeads={handleImportLeads}
              onSelectLeadForEmail={handleSelectLeadForEmail}
              onSelectLeadForSample={handleSelectLeadForSample}
              onSelectLeadForQuote={handleSelectLeadForQuote}
            />
          )}

          {activeTab === 'physical-inventory' && (
            <PhysicalInventoryView />
          )}

          {activeTab === 'quality-control' && (
            <QualityControlView />
          )}

          {activeTab === 'export-contracts' && (
            <ExportContractsView />
          )}

          {activeTab === 'shipment-tracking' && (
            <ShipmentTrackingView />
          )}

          {activeTab === 'fx-hedging' && (
            <FXHedgingView />
          )}

          {activeTab === 'system-settings' && (
            <SystemSettingsView />
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

          {activeTab === 'suppliers' && (
            <SupplierView />
          )}

          {activeTab === 'crm' && (
            <CrmView 
              leads={leads}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onUpdateMultipleLeadsStatus={handleUpdateMultipleLeadsStatus}
              onDeleteLead={handleDeleteLead}
              onAddLeadManual={handleAddLeadManual}
              onImportLeads={handleImportLeads}
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
              onSyncAll={handleSyncToSheets}
            />
          )}

          {activeTab === 'personnel' && (
            <UserManagementView />
          )}

          {activeTab === 'connection-test' && (
            <ConnectionTestView />
          )}
        </div>
      </main>
    </div>
  );
}
