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
      <div className="min-h-screen bg-[#05190F] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="font-sans font-semibold text-white tracking-widest uppercase text-xs">Initializing Secure Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#05190F] flex text-primary font-sans" id="application-container">
      {/* Minimalist Dark Green Sidebar */}
      <aside className="w-60 bg-[#05190F] border-r border-white/8 flex flex-col justify-between print:hidden shrink-0">
        <div className="overflow-y-auto">
          {/* Brand Header */}
          <div className="px-6 py-7 border-b border-white/8">
            <h1 className="font-sans font-bold text-sm text-white uppercase tracking-wider leading-tight">
              Nandara Nusa Montierra
            </h1>
            <div className="text-[9px] font-mono text-white/40 mt-1.5 tracking-widest uppercase">
              CIIS • EXPORT INTELLIGENCE
            </div>
          </div>

          {/* User Profile */}
          {currentUser && (
            <div className="px-6 py-3.5 border-b border-white/8">
              <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center mb-2">
                <span className="text-white font-bold text-xs">{currentUser.firstName?.[0]}{currentUser.lastName?.[0]}</span>
              </div>
              <p className="text-[11px] font-semibold text-white truncate">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-tight truncate">{currentUser.role}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="py-4 space-y-0.5 px-3">
            {/* Language Selector */}
            <div className="px-3 py-3 mb-1">
              <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest mb-2">Language</div>
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
                      className={`px-2.5 py-1 text-[9px] font-mono border rounded-md transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white text-[#05190F] border-white font-bold'
                          : 'border-white/20 text-white/50 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-3 pb-1.5 pt-2 text-[9px] text-white/30 font-mono uppercase tracking-widest">CRM</div>

            {[
              { tab: 'buyer-crm', label: 'Buyer CRM Desk' },
              { tab: 'physical-inventory', label: 'Physical Inventory' },
              { tab: 'quality-control', label: 'Quality Control' },
              { tab: 'export-contracts', label: 'Export Contracts' },
              { tab: 'shipment-tracking', label: 'Shipment Tracking' },
              { tab: 'fx-hedging', label: 'FX & Hedging Desk' },
              { tab: 'system-settings', label: 'System Settings' },
            ].map(({ tab, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-[#05190F] font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                {label}
              </button>
            ))}

            <div className="border-t border-white/8 my-3" />
            <div className="px-3 pb-1.5 text-[9px] text-white/30 font-mono uppercase tracking-widest">Intelligence</div>

            {[
              { tab: 'dashboard', label: 'Dashboard' },
              { tab: 'ai-studio', label: 'Content Studio' },
              { tab: 'showroom', label: 'B2B Showroom' },
              { tab: 'suppliers', label: 'Supplier Management' },
              { tab: 'discovery', label: 'Importer Discovery' },
              { tab: 'crm', label: 'Lead Pipeline' },
              { tab: 'email', label: 'Outreach Composer' },
              { tab: 'email-management', label: 'Mail Management' },
              { tab: 'samples', label: 'Sample Tracking' },
              { tab: 'quotation', label: 'Quotation Engine' },
              { tab: 'curriculum', label: 'Export Academy' },
              { tab: 'glossary', label: 'Industry Glossary' },
              { tab: 'sheets', label: 'Sheets Sync Config' },
            ].map(({ tab, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-[#05190F] font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                {label}
              </button>
            ))}

            {/* Super Admin Only */}
            {currentUser && ['nandaranusamontierra@gmail.com', 'nandalatifanibudiarti97@gmail.com'].includes(currentUser.email) && (
              <>
                <div className="border-t border-white/8 my-3" />
                <div className="px-3 pb-1.5 text-[9px] text-white/30 font-mono uppercase tracking-widest">Admin</div>
                {[
                  { tab: 'personnel', label: 'Personnel Control' },
                  { tab: 'connection-test', label: 'System Health' },
                ].map(({ tab, label }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-white text-[#05190F] font-bold'
                        : 'text-white/60 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-5 py-5 border-t border-white/8 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-md text-[11px] font-semibold text-white/50 hover:text-white hover:bg-white/8 transition-all cursor-pointer uppercase tracking-wider"
          >
            Sign Out
          </button>
          <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">v2.4.1 • Nandara Global</div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 bg-[#f7f7f5] overflow-y-auto max-h-screen">
        {/* Top Header */}
        <header className="flex justify-between items-center px-8 py-5 bg-white border-b border-gray-200 print:hidden">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold tracking-tight text-[#05190F]" id="active-tab-title">
              {activeTab === 'dashboard' && "Pipeline Overview"}
              {activeTab === 'buyer-crm' && "Buyer CRM Desk"}
              {activeTab === 'physical-inventory' && "Physical Inventory"}
              {activeTab === 'quality-control' && "Quality Control"}
              {activeTab === 'export-contracts' && "Export Contracts"}
              {activeTab === 'shipment-tracking' && "Shipment Tracking"}
              {activeTab === 'fx-hedging' && "FX & Hedging Desk"}
              {activeTab === 'system-settings' && "System Settings"}
              {activeTab === 'ai-studio' && "Content Studio"}
              {activeTab === 'showroom' && "B2B Showroom & Portals"}
              {activeTab === 'suppliers' && "Supplier Management"}
              {activeTab === 'discovery' && "Importer Discovery Engine"}
              {activeTab === 'crm' && "Export Leads CRM"}
              {activeTab === 'email' && "Outreach Composer"}
              {activeTab === 'email-management' && "Mail Management"}
              {activeTab === 'samples' && "Sample Tracking"}
              {activeTab === 'quotation' && "Quotation Engine"}
              {activeTab === 'curriculum' && "Export Academy"}
              {activeTab === 'sheets' && "Sheets Sync Config"}
              {activeTab === 'personnel' && "Personnel Control"}
              {activeTab === 'connection-test' && "System Health"}
            </h2>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
              Nandara CIIS • Java, Gayo, Toraja Specialties
            </p>
          </div>

          <div className="flex gap-3 text-[10px] font-mono uppercase tracking-wider items-center">
            {config.googleAppsScriptUrl ? (
              <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 py-1.5 px-3 rounded-md font-bold">
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-500 py-1.5 px-3 rounded-md">
                Offline
              </span>
            )}
          </div>
        </header>

        {/* Tab views Routing */}
        <div className="p-8 min-h-[500px]" id="routing-views-wrapper">
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
            <FXHedgingView quotations={quotations} leads={leads} />
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
