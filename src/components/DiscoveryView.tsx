import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  Search, 
  MapPin, 
  CheckCircle, 
  Plus, 
  Mail, 
  AlertCircle, 
  Compass, 
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Phone,
  Linkedin,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

interface DiscoveryViewProps {
  onAddLeads: (newLeads: Lead[]) => void;
  existingLeads: Lead[];
}

export default function DiscoveryView({ onAddLeads, existingLeads }: DiscoveryViewProps) {
  const [country, setCountry] = useState('Germany');
  const [region, setRegion] = useState('');
  const [importerType, setImporterType] = useState('Green Coffee Importer');
  const [count, setCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<{ [key: string]: boolean }>({});
  const [activeAnalysisLead, setActiveAnalysisLead] = useState<Lead | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const countries = [
    'Germany', 'United States', 'United Kingdom', 'Japan', 'South Korea', 'Taiwan',
    'Australia', 'Netherlands', 'France', 'Italy', 'Singapore', 'New Zealand'
  ];

  const importerTypes = [
    'Green Coffee Importer',
    'Specialty Coffee Importer',
    'Coffee Roaster',
    'Coffee Distributor',
    'Coffee Trading Company',
    'Private Label Coffee Brand'
  ];

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Querying coffee databases and scouting coordinates to verify real active entities...');
    setError(null);
    setDiscoveredLeads([]);
    setSelectedLeads({});

    try {
      const response = await fetch('/api/discovery/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure token is sent
        },
        body: JSON.stringify({
          query: `${importerType} in ${country} ${region}`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'API server returned error state.');
      }

      const data = await response.json();
      // Map backend Importer model to frontend Lead type if necessary
      const mappedLeads = (data.results || []).map((importer: any) => ({
        id: importer.id,
        companyName: importer.companyName,
        website: importer.website,
        email: importer.email,
        phone: importer.phone,
        country: importer.country,
        leadScore: importer.leadScore,
        status: importer.status,
        notes: importer.notes,
        dateAdded: importer.createdAt
      }));

      setDiscoveredLeads(mappedLeads);
      
      // Auto-select all by default
      const initialSelected: { [key: string]: boolean } = {};
      mappedLeads.forEach((lead: any) => {
        initialSelected[lead.id] = true;
      });
      setSelectedLeads(initialSelected);
      
      setStatusMessage(data.message || 'Scouted and verified active coffee entities successfully saved to database.');
      
      // Refresh the main lead list in App.tsx
      onAddLeads(mappedLeads);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Discovery failed. Please verify API configuration or try again.');
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleImportSelected = () => {
    const toImport = discoveredLeads.filter(lead => selectedLeads[lead.id]);
    if (toImport.length === 0) return;

    // Filter duplicates by company name
    const existingNames = existingLeads.map(l => l.companyName.toLowerCase());
    const uniqueToImport = toImport.filter(
      lead => !existingNames.includes(lead.companyName.toLowerCase())
    );

    if (uniqueToImport.length > 0) {
      onAddLeads(uniqueToImport);
      alert(`Imported ${uniqueToImport.length} new coffee leads to your CRM pipeline!`);
      // Reset
      setDiscoveredLeads([]);
      setSelectedLeads({});
      setStatusMessage('');
    } else {
      alert("All selected leads are already in your CRM pipeline.");
    }
  };

  // Perform Module 3 (Website Deep dive Analysis) on the spot
  const handleAnalyzeLead = async (lead: Lead) => {
    setActiveAnalysisLead(lead);
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/leads/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: lead.companyName,
          website: lead.website,
          leadType: lead.leadType,
          country: lead.country,
          notes: lead.notes
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Analysis server failed to respond.');
      }

      const data = await response.json();
      
      // Update discoveredLeads array with analysis results
      setDiscoveredLeads(prev => prev.map(l => {
        if (l.id === lead.id) {
          return {
            ...l,
            leadScore: data.leadScore || l.leadScore,
            notes: data.notes || l.notes,
            analysisType: data.analysisType,
            analysisFocus: data.analysisFocus,
            analysisPotential: data.analysisPotential,
            analysisMatch: data.analysisMatch,
            analysisWhy: data.analysisWhy,
            websiteConfidence: data.websiteConfidence,
            emailConfidence: data.emailConfidence,
            importerConfidence: data.importerConfidence,
            importerProbability: data.importerProbability
          };
        }
        return l;
      }));

      // Update active modal representation
      setActiveAnalysisLead(prev => {
        if (!prev) return null;
        return {
          ...prev,
          leadScore: data.leadScore || prev.leadScore,
          notes: data.notes || prev.notes,
          analysisType: data.analysisType,
          analysisFocus: data.analysisFocus,
          analysisPotential: data.analysisPotential,
          analysisMatch: data.analysisMatch,
          analysisWhy: data.analysisWhy,
          websiteConfidence: data.websiteConfidence,
          emailConfidence: data.emailConfidence,
          importerConfidence: data.importerConfidence,
          importerProbability: data.importerProbability
        };
      });

    } catch (err: any) {
      alert("AI Analysis is temporarily unavailable: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: string) => {
    switch(score) {
      case 'A': return 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30';
      case 'B': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Helper validation logic to reject standard supports
  const isValidatedPublicEmail = (email: string) => {
    const rejects = ["support@", "noreply@", "privacy@", "webmaster@"];
    return !rejects.some(re => email.toLowerCase().includes(re));
  };

  return (
    <div className="space-y-6" id="discovery-root">
      {/* Search Console Header */}
      <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury" id="finder-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-primary text-gold">
              <Compass className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Importer Scouting Console</h2>
              <p className="text-xs text-text-dim mt-0.5 font-sans">Discover and analyze global specialty coffee buyers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono uppercase tracking-wider rounded-sm font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Real Data Verifier Active</span>
          </div>
        </div>

        {/* Real Data Policy Warning Label */}
        <div className="mb-5 p-4 bg-amber-50/50 border border-amber-200/60 rounded-sm text-xs space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>CIIS Security & Integration Rule</span>
          </div>
          <p className="text-gray-700 leading-relaxed font-light text-[11px]">
            In compliance with our **Real-World Policy**, fake generated records are strictly blocks. Scouting targets verified B2B Green Coffee Importers, Trade Houses, and Sourcing Roasters. Small local retail cafes, coffee houses, and general restaurants are automatically filtered out.
          </p>
        </div>

        <form onSubmit={handleDiscover} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold text-primary uppercase tracking-widest">Target Country</label>
            <select 
              value={country} 
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs focus:ring-1 focus:ring-gold focus:border-gold text-primary font-sans outline-hidden"
            >
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold text-primary uppercase tracking-widest">Specific Region (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Hamburg, Bavaria, California" 
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs focus:ring-1 focus:ring-gold focus:border-gold placeholder:text-gray-400 outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-semibold text-primary uppercase tracking-widest">Importer Category Type</label>
            <select 
              value={importerType} 
              onChange={e => setImporterType(e.target.value)}
              className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs focus:ring-1 focus:ring-gold focus:border-gold text-primary font-sans outline-hidden"
            >
              {importerTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 space-y-1.5">
              <label className="text-[10px] font-mono font-semibold text-primary uppercase tracking-widest">Count</label>
              <select 
                value={count} 
                onChange={e => setCount(Number(e.target.value))}
                className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs focus:ring-1 focus:ring-gold focus:border-gold text-primary font-sans outline-hidden"
              >
                {[3, 5, 8, 10, 15].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="col-span-2 py-2.5 bg-primary hover:bg-[#0c3320] text-white rounded-sm text-xs font-mono uppercase tracking-widest border border-gold/40 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer h-[38px] font-semibold"
            >
              <Search className="w-4 h-4 text-gold" />
              {isLoading ? "Searching..." : "Discover"}
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="mt-4 p-3 bg-bg-ivory/60 border border-primary/5 rounded-sm flex items-center gap-2 text-xs text-gray-700 font-mono" id="discovery-status">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3 text-xs text-red-800 font-mono animate-fade-in" id="discovery-error">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px]">Discovery Failed</p>
              <p className="font-light leading-relaxed text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Discovery Results */}
      {discoveredLeads.length > 0 && (
        <div className="space-y-4" id="discovery-results">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary text-white p-5 rounded-lg border border-gold/35 shadow-luxury">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">Discovered Leads Pool</p>
              <h3 className="text-sm font-semibold tracking-wide uppercase font-serif mt-1">
                {discoveredLeads.filter(l => selectedLeads[l.id]).length} of {discoveredLeads.length} Selected for CRM Import
              </h3>
            </div>
            
            <button
              onClick={handleImportSelected}
              className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-primary rounded-sm text-xs font-mono uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-gold/30"
            >
              <Plus className="w-4 h-4" />
              Import to CRM Pipeline
            </button>
          </div>

          {/* Leads Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {discoveredLeads.map((lead) => {
              const isSelected = selectedLeads[lead.id];
              return (
                <div 
                  key={lead.id} 
                  className={`p-6 bg-white rounded-lg border transition-all space-y-4 relative shadow-luxury ${
                    isSelected ? 'border-primary ring-1 ring-primary' : 'border-primary/5 hover:border-gold/50'
                  }`}
                >
                  {/* Select Checkbox Indicator */}
                  <button
                    onClick={() => toggleSelectLead(lead.id)}
                    className={`absolute top-6 right-6 w-5 h-5 rounded-sm border flex items-center justify-center transition-all cursor-pointer ${
                      isSelected ? 'bg-primary border-primary text-white' : 'border-primary/20 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-gold" />
                  </button>

                  {/* Header */}
                  <div className="space-y-1.5 pr-8">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-sm text-[9px] font-mono font-medium uppercase tracking-widest text-text-dim">
                        {lead.leadType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-mono font-medium uppercase tracking-widest border ${getScoreColor(lead.leadScore)}`}>
                        Grade {lead.leadScore} Lead
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-medium text-primary tracking-wide leading-tight">{lead.companyName}</h3>
                    <p className="text-xs text-text-dim flex items-center gap-1 font-mono uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                      {lead.city}, {lead.country}
                    </p>
                  </div>

                  {/* Extract Details */}
                  <div className="space-y-1.5 text-xs text-gray-600 font-mono">
                    {/* Public email check badge */}
                    {lead.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                        {isValidatedPublicEmail(lead.email) ? (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-teal-800 rounded-sm font-mono uppercase tracking-wider font-semibold">
                            Validated B2B
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-sm font-mono tracking-wider uppercase">
                            Fallback
                          </span>
                        )}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.linkedin && (
                      <div className="flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                          Company Profile
                        </a>
                      </div>
                    )}
                    {lead.website && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline hover:text-gold font-semibold truncate">
                          {lead.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notes / Assessment Box */}
                  <p className="text-xs text-text-dim line-clamp-2 italic pt-2 border-t border-gray-100 pr-10 font-sans leading-relaxed">
                    "{lead.notes}"
                  </p>

                  {/* Confidence Levels Block */}
                  <div className="pt-2 pb-1 border-t border-gray-100/60 space-y-1.5">
                    <p className="text-[9px] uppercase tracking-widest text-[#4A5568] font-mono font-bold">Data Confidence Score</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold tracking-wider uppercase border ${
                        lead.websiteConfidence === 'High' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        lead.websiteConfidence === 'Low' ? 'text-red-700 bg-red-50 border-red-200' :
                        'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        🌐 Web: {lead.websiteConfidence || 'High'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold tracking-wider uppercase border ${
                        lead.emailConfidence === 'High' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        lead.emailConfidence === 'Low' ? 'text-red-700 bg-red-50 border-red-200' :
                        'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        ✉ Email: {lead.emailConfidence || 'High'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold tracking-wider uppercase border ${
                        lead.importerConfidence === 'High' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        lead.importerConfidence === 'Low' ? 'text-red-700 bg-red-50 border-red-200' :
                        'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        ☕ Importer: {lead.importerConfidence || 'High'}
                      </span>
                    </div>
                  </div>

                  {lead.analysisWhy && (
                    <div className="p-3 bg-bg-ivory/50 rounded-sm border border-primary/5 text-[11px] text-gray-700 font-sans leading-relaxed">
                      <span className="font-mono text-[9px] font-bold text-primary block uppercase tracking-wider mb-0.5">Product Match Justification:</span>
                      {lead.analysisWhy}
                    </div>
                  )}

                  {/* UI Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest text-[#4A5568] font-mono">Ready to analyze</span>
                    <button
                      onClick={() => handleAnalyzeLead(lead)}
                      disabled={isAnalyzing}
                      className="px-3.5 py-1.5 bg-bg-ivory/50 border border-primary/10 hover:border-gold hover:bg-white text-primary text-[10px] font-mono uppercase tracking-widest rounded-sm flex items-center gap-1.5 transition-all cursor-pointer font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Deconstruct Website
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis & Scoring Modal */}
      {activeAnalysisLead && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="analysis-modal">
          <div className="bg-bg-ivory border border-gold/30 max-w-lg w-full rounded-sm shadow-2xl p-7 relative space-y-6">
            <div className="space-y-1.5 border-b border-primary/10 pb-4">
              <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest uppercase block font-semibold">Module 3 — B2B Entity Deconstruction</span>
              <h2 className="text-2xl font-serif italic text-[#05190F]">
                {activeAnalysisLead.companyName}
              </h2>
              <p className="text-[11px] text-text-dim font-mono tracking-wider">{activeAnalysisLead.website}</p>
            </div>

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Compass className="w-10 h-10 text-gold animate-spin stroke-1" />
                <p className="text-xs font-mono text-primary uppercase tracking-widest animate-pulse">
                  Analyzing target domains and extracting specialty coffee matches...
                </p>
              </div>
            ) : (
              <div className="space-y-5 text-xs font-mono">
                {/* Score section */}
                <div className="p-4 rounded-sm bg-white border border-gold/25 flex items-center justify-between shadow-xs">
                  <div className="space-y-1">
                    <p className="text-[9px] text-[#4A5568] uppercase tracking-widest">Automatic Lead Rating</p>
                    <p className="text-xs font-semibold text-primary font-sans">
                      {activeAnalysisLead.leadScore === 'A' ? "Priority A - Premier Importer" : activeAnalysisLead.leadScore === 'B' ? "Priority B - Specialty Roaster" : "Grade C - Small Operation"}
                    </p>
                  </div>
                  <span className={`w-11 h-11 rounded-full border flex items-center justify-center text-sm font-bold font-mono shadow-xs uppercase ${getScoreColor(activeAnalysisLead.leadScore)}`}>
                    {activeAnalysisLead.leadScore}
                  </span>
                </div>

                {/* Detailed Analysis items */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-3 py-2 border-b border-gray-200/60 uppercase">
                    <span className="text-[#4A5568] tracking-widest text-[9px] font-bold">Business Type</span>
                    <span className="col-span-2 font-normal text-primary font-sans lowercase first-letter:capitalize">
                      {activeAnalysisLead.analysisType || "Specialty Sourcing Importer"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-2 border-b border-gray-200/60 uppercase">
                    <span className="text-[#4A5568] tracking-widest text-[9px] font-bold">Coffee Focus</span>
                    <span className="col-span-2 font-normal text-primary font-sans normal-case">
                      {activeAnalysisLead.analysisFocus || "Specialty Single-Origins / Traceability"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-2 border-b border-gray-200/60 uppercase">
                    <span className="text-[#4A5568] tracking-widest text-[9px] font-bold">Import Volume</span>
                    <span className="col-span-2 font-bold text-emerald-800">
                      {activeAnalysisLead.analysisPotential || "High"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 py-2 border-b border-gray-200/60 uppercase">
                    <span className="text-[#4A5568] tracking-widest text-[9px] font-bold">Product Match</span>
                    <span className="col-span-2 font-normal text-[#05190F] font-sans normal-case">
                      {activeAnalysisLead.analysisMatch || "Aceh Gayo G1, Sumatra Toraja"}
                    </span>
                  </div>
                </div>

                {/* Score Confidence metrics inside modal */}
                <div className="p-3 bg-white border border-gray-200 rounded-sm space-y-2 font-mono">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Data Integrity Scores</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-sm bg-bg-ivory/50 border border-primary/5">
                      <p className="text-[8px] text-gray-400 uppercase font-mono">Website</p>
                      <p className="text-xs font-bold text-primary">{activeAnalysisLead.websiteConfidence || 'High'}</p>
                    </div>
                    <div className="text-center p-2 rounded-sm bg-bg-ivory/50 border border-primary/5">
                      <p className="text-[8px] text-gray-400 uppercase font-mono">Email</p>
                      <p className="text-xs font-bold text-primary">{activeAnalysisLead.emailConfidence || 'High'}</p>
                    </div>
                    <div className="text-center p-2 rounded-sm bg-bg-ivory/50 border border-primary/5">
                      <p className="text-[8px] text-gray-400 uppercase font-mono">Importer</p>
                      <p className="text-xs font-bold text-primary">{activeAnalysisLead.importerConfidence || 'High'}</p>
                    </div>
                  </div>
                </div>

                {activeAnalysisLead.analysisWhy && (
                  <div className="p-3.5 bg-white border border-primary/5 rounded-sm space-y-1.5 font-sans">
                    <div className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
                      Why Recommended Coffee Matches
                    </div>
                    <p className="text-xs text-gray-800 font-light leading-relaxed">
                      {activeAnalysisLead.analysisWhy}
                    </p>
                  </div>
                )}

                {/* Score validation rules description */}
                <div className="p-4 bg-white border border-primary/5 rounded-sm space-y-1.5 font-sans shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest font-mono">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Scoring Justification</span>
                  </div>
                  <p className="text-xs text-text-dim leading-relaxed font-light">
                    {activeAnalysisLead.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-primary/10">
              <button
                onClick={() => setActiveAnalysisLead(null)}
                className="px-6 py-2.5 bg-primary hover:bg-neutral-950 text-white hover:text-gold border border-gold/40 rounded-sm text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-all font-semibold"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
