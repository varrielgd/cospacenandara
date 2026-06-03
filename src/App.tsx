import React, { useState, useEffect } from 'react';
import { Lead, EmailLog, Sample, Quotation, SystemConfig } from './types';
import DashboardView from './components/DashboardView';
import DiscoveryView from './components/DiscoveryView';
import CrmView from './components/CrmView';
import EmailGeneratorView from './components/EmailGeneratorView';
import SampleView from './components/SampleView';
import QuotationView from './components/QuotationView';
import SheetsIntegrationView from './components/SheetsIntegrationView';
import BrandPortalView from './components/BrandPortalView';
import CurriculumView from './components/CurriculumView';
import GlossaryView from './components/GlossaryView';
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
  BookOpen
} from 'lucide-react';

const INITIAL_LEADS: Lead[] = [];
const INITIAL_SAMPLES: Sample[] = [];
const INITIAL_EMAILS: EmailLog[] = [];
const INITIAL_QUOTES: Quotation[] = [];

export default function App() {
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

  // Load from LocalStorage or pre-fill with premium demo on first turn
  useEffect(() => {
    const savedActiveTab = localStorage.getItem('nandara_ciis_active_tab');
    if (savedActiveTab) setActiveTabState(savedActiveTab);

    const savedLeads = localStorage.getItem('nandara_ciis_leads');
    const savedEmails = localStorage.getItem('nandara_ciis_emails');
    const savedSamples = localStorage.getItem('nandara_ciis_samples');
    const savedQuotes = localStorage.getItem('nandara_ciis_quotes');
    const savedConfig = localStorage.getItem('nandara_ciis_config');

    const cleanList = <T extends { id?: string; leadId?: string; quoteNumber?: string }>(list: T[]): T[] => {
      return list.filter(item => {
        const idStr = String(item.id || item.leadId || item.quoteNumber || '').toLowerCase();
        return !idStr.includes('demo');
      });
    };

    if (savedLeads) {
      const parsed = cleanList(JSON.parse(savedLeads));
      setLeads(parsed);
      localStorage.setItem('nandara_ciis_leads', JSON.stringify(parsed));
    } else {
      setLeads([]);
      localStorage.setItem('nandara_ciis_leads', JSON.stringify([]));
    }

    if (savedEmails) {
      const parsed = cleanList(JSON.parse(savedEmails));
      setEmails(parsed);
      localStorage.setItem('nandara_ciis_emails', JSON.stringify(parsed));
    } else {
      setEmails([]);
      localStorage.setItem('nandara_ciis_emails', JSON.stringify([]));
    }

    if (savedSamples) {
      const parsed = cleanList(JSON.parse(savedSamples));
      setSamples(parsed);
      localStorage.setItem('nandara_ciis_samples', JSON.stringify(parsed));
    } else {
      setSamples([]);
      localStorage.setItem('nandara_ciis_samples', JSON.stringify([]));
    }

    if (savedQuotes) {
      const parsed = cleanList(JSON.parse(savedQuotes));
      setQuotations(parsed);
      localStorage.setItem('nandara_ciis_quotes', JSON.stringify(parsed));
    } else {
      setQuotations([]);
      localStorage.setItem('nandara_ciis_quotes', JSON.stringify([]));
    }

    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  // Sync to localstorage helper
  const updateLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    localStorage.setItem('nandara_ciis_leads', JSON.stringify(newLeads));
  };

  const updateEmails = (newEmails: EmailLog[]) => {
    setEmails(newEmails);
    localStorage.setItem('nandara_ciis_emails', JSON.stringify(newEmails));
  };

  const updateSamples = (newSamples: Sample[]) => {
    setSamples(newSamples);
    localStorage.setItem('nandara_ciis_samples', JSON.stringify(newSamples));
  };

  const updateQuotations = (newQuotes: Quotation[]) => {
    setQuotations(newQuotes);
    localStorage.setItem('nandara_ciis_quotes', JSON.stringify(newQuotes));
  };

  // State manipulation triggers
  const handleAddDiscoveryLeads = (newLeads: Lead[]) => {
    // Merge new leads avoiding duplicating companies already logged
    const existingNames = leads.map(l => l.companyName.toLowerCase());
    const filteredNew = newLeads.filter(l => !existingNames.includes(l.companyName.toLowerCase()));
    
    const updated = [...leads, ...filteredNew];
    updateLeads(updated);
  };

  const handleUpdateLeadStatus = (leadId: string, newStatus: Lead['status']) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          status: newStatus,
          lastContact: new Date().toISOString().split('T')[0]
        };
      }
      return l;
    });
    updateLeads(updated);
  };

  const handleUpdateMultipleLeadsStatus = (leadIds: string[], newStatus: Lead['status']) => {
    const updated = leads.map(l => {
      if (leadIds.includes(l.id)) {
        return {
          ...l,
          status: newStatus,
          lastContact: new Date().toISOString().split('T')[0]
        };
      }
      return l;
    });
    updateLeads(updated);
  };

  const handleDeleteLead = (leadId: string) => {
    const updated = leads.filter(l => l.id !== leadId);
    updateLeads(updated);
  };

  const handleAddLeadManual = (leadData: Omit<Lead, 'id' | 'dateAdded'>) => {
    const fresh: Lead = {
      ...leadData,
      id: `lead_manual_${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    updateLeads([...leads, fresh]);
  };

  const handleSaveOrUpdateEmail = (emailData: EmailLog) => {
    const exists = emails.some(e => e.id === emailData.id);
    let updatedLists: EmailLog[];
    if (exists) {
      updatedLists = emails.map(e => e.id === emailData.id ? emailData : e);
    } else {
      updatedLists = [...emails, emailData];
    }
    updateEmails(updatedLists);

    // Update status to 'Contacted' automatically if sent
    if (emailData.status === 'Sent') {
      handleUpdateLeadStatus(emailData.leadId, 'Contacted');
    }
  };

  const handleAddSample = (sampleData: Omit<Sample, 'id' | 'sampleRequestDate'>) => {
    const fresh: Sample = {
      ...sampleData,
      id: `sample_pkg_${Date.now()}`,
      sampleRequestDate: new Date().toISOString().split('T')[0]
    };
    updateSamples([...samples, fresh]);

    // Mark status on CRM as "Sample Requested" or "Sample Sent"
    const leadMatch = leads.find(l => l.id === sampleData.leadId);
    if (leadMatch) {
      const targetState = sampleData.status === 'Shipped' ? 'Sample Sent' : 'Sample Requested';
      handleUpdateLeadStatus(sampleData.leadId, targetState);
    }
  };

  const handleUpdateSampleStatus = (sampleId: string, targetStatus: Sample['status'], trackingNumber?: string) => {
    const updated = samples.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          status: targetStatus,
          trackingNumber: trackingNumber !== undefined ? trackingNumber : s.trackingNumber
        };
      }
      return s;
    });
    updateSamples(updated);

    // Update crm state matching shipped/delivered if relevant
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      if (targetStatus === 'Shipped') {
        handleUpdateLeadStatus(sample.leadId, 'Sample Sent');
      } else if (targetStatus === 'Delivered') {
        handleUpdateLeadStatus(sample.leadId, 'Replied'); // Promotes state
      }
    }
  };

  const handleAddQuotation = (quoteData: Omit<Quotation, 'quoteNumber' | 'dateCreated'>) => {
    const fresh: Quotation = {
      ...quoteData,
      quoteNumber: `QT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    updateQuotations([...quotations, fresh]);

    // Automatically advance CRM status to "Quotation Sent" if draft isn't default
    const targetStatus = quoteData.status === 'Sent' ? 'Quotation Sent' : 'Negotiation';
    handleUpdateLeadStatus(quoteData.leadId, targetStatus);
  };

  const handleUpdateQuotationStatus = (number: string, targetStatus: Quotation['status']) => {
    const updated = quotations.map(q => {
      if (q.quoteNumber === number) {
        return { ...q, status: targetStatus };
      }
      return q;
    });
    updateQuotations(updated);

    const quote = quotations.find(q => q.quoteNumber === number);
    if (quote) {
      if (targetStatus === 'Accepted') {
        handleUpdateLeadStatus(quote.leadId, 'Order Confirmed');
      } else if (targetStatus === 'Sent') {
        handleUpdateLeadStatus(quote.leadId, 'Quotation Sent');
      } else if (targetStatus === 'Declined') {
        handleUpdateLeadStatus(quote.leadId, 'Closed Lost');
      }
    }
  };

  const handleUpdateConfig = (newUrl: string) => {
    const updated = { ...config, googleAppsScriptUrl: newUrl };
    setConfig(updated);
    localStorage.setItem('nandara_ciis_config', JSON.stringify(updated));
  };

  // MODULE 7 - Google Sheets synchronization engine (Live integration lookup)
  const handleSyncAll = async () => {
    if (!config.googleAppsScriptUrl) {
      throw new Error("Google Apps Script URL is required to sync sheets.");
    }

    try {
      // Enrich email logs with related spreadsheet columns on the fly
      const enrichedEmails = emails.map(email => {
        const matchingLead = leads.find(l => l.id === email.leadId);
        return {
          ...email,
          companyName: matchingLead ? matchingLead.companyName : 'Unknown Partner',
          notes: matchingLead ? matchingLead.notes : ''
        };
      });

      const response = await fetch(config.googleAppsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Apps script utilizes redirect, CORS is handled via no-cors if backend rules trigger it
        body: JSON.stringify({
          action: 'syncAll',
          leads,
          emails: enrichedEmails,
          samples,
          quotations
        })
      });

      // Simple wait and state save
      const updated = { ...config, isSynced: true };
      setConfig(updated);
      localStorage.setItem('nandara_ciis_config', JSON.stringify(updated));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'CORS or routing mismatch with script execution payload.');
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
          </nav>
        </div>

        {/* Static signature bottom */}
        <div className="p-[30px] border-t border-white/5 space-y-2 text-[10px] font-mono text-gray-500">
          <p>System Version 2.4.1</p>
          <div className="flex gap-1.5 pt-1 uppercase text-[9px] items-center text-[#D4AF37]">
            <Globe className="w-3" />
            <span>Nandara Global Control</span>
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
              {activeTab === 'showroom' && "Nandara Sourcing Showroom & Portals"}
              {activeTab === 'discovery' && "Worldwide Importer Search Engine"}
              {activeTab === 'crm' && "Indonesian Export Leads CRM Board"}
              {activeTab === 'email' && "AI Personalized B2B Pitch Suite"}
              {activeTab === 'samples' && "Specialty Physical Samples Dispatch"}
              {activeTab === 'quotation' && "Export Quota and Commercial Terms"}
              {activeTab === 'curriculum' && "Premium Export Academy & Curriculum"}
              {activeTab === 'sheets' && "Google Sheet Automation Config"}
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
        </div>
      </main>
    </div>
  );
}
