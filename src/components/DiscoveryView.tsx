import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../types';
import { api } from '../utils/api';


interface DiscoveryViewProps {
  onAddLeads: (newLeads: Lead[]) => void;
  existingLeads: Lead[];
}

interface DiscoverySession {
  id: string;
  query: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  totalFound: number;
  totalProcessed: number;
  importers: any[];
  error?: string;
}

export default function DiscoveryView({ onAddLeads, existingLeads }: DiscoveryViewProps): React.ReactNode {
  const [country, setCountry] = useState('Germany');
  const [region, setRegion] = useState('');
  const [importerType, setImporterType] = useState('Green Coffee Importer');
  const [isLoading, setIsLoading] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<{ [key: string]: boolean }>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [progress, setProgress] = useState({ total: 0, processed: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSyncingId, setIsSyncingId] = useState<string | null>(null);
  const [marketRecs, setMarketRecs] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const countries = [
    'Germany', 'United States', 'United Kingdom', 'Japan', 'South Korea', 'Taiwan',
    'Australia', 'Netherlands', 'France', 'Italy', 'Singapore', 'New Zealand',
    'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Oman', 'Bahrain',
    'Egypt', 'Jordan', 'Turkey'
  ];

  const importerTypes = [
    'Green Coffee Importer',
    'Specialty Coffee Importer',
    'Coffee Roaster',
    'Coffee Distributor',
    'Coffee Trading Company',
    'Private Label Coffee Brand'
  ];

  // Restore session and leads from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('discoverySessionId');
    const savedLeads = localStorage.getItem('discoveryLastResults');
    
    if (savedSessionId) {
      setCurrentSessionId(savedSessionId);
      setIsLoading(true);
      setStatusMessage('Restoring discovery session...');
    } else if (savedLeads) {
      try {
        setDiscoveredLeads(JSON.parse(savedLeads));
      } catch (e) {
        console.error('Error parsing saved leads:', e);
      }
    }
    fetchRecentSessions();
    fetchMarketRecommendations();
  }, []);

  // Save results to localStorage whenever they change
  useEffect(() => {
    if (discoveredLeads.length > 0) {
      localStorage.setItem('discoveryLastResults', JSON.stringify(discoveredLeads));
    }
  }, [discoveredLeads]);

  const fetchRecentSessions = async () => {
    try {
      const data = await api.get('/api/discovery/recent');
      setRecentSessions(data || []);
    } catch (err) {
      console.error('Error fetching recent sessions:', err);
    }
  };

  const fetchMarketRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const data = await api.get('/api/discovery/market-recommendations') as any;
      setMarketRecs(data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    setDiscoveredLeads([]);
    setSelectedLeads({});
    setProgress({ total: 0, processed: 0 });
    setCurrentSessionId(sessionId);
    localStorage.setItem('discoverySessionId', sessionId);
    setShowHistory(false);
    setStatusMessage('Loading session results...');
  };

  // Poll for discovery results
  useEffect(() => {
    if (!currentSessionId) return;

    const pollStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await api.get(`/api/discovery/status/${currentSessionId}`);

        if (!data) {
          setIsLoading(false);
          setCurrentSessionId(null);
          setError('Session data is unavailable. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => window.location.href = '/', 2000);
          return;
        }

        // Update progress
        setProgress({ total: 30, processed: data.totalProcessed });
        const isSimulated = data.importers && data.importers.some((imp: Lead) => imp.notes && imp.notes.includes('Simulated'));
        
        if (data.status === 'RUNNING') {
          setStatusMessage(isSimulated 
            ? `is currently using deep knowledge fallback. Found ${data.totalFound} importers.`
            : `Deep Scouting... ${data.totalProcessed} real entities found.`);
        }

        // Update discovered leads
        if (data.importers && data.importers.length > 0) {
          const mappedLeads: Lead[] = data.importers.map((importer: any) => ({
            id: importer.id,
            companyName: importer.companyName,
            website: importer.website || '',
            email: importer.email || '',
            phone: importer.phone || '',
            country: importer.country || '',
            leadScore: importer.leadScore || 'C',
            status: (importer.status as any) || 'New',
            notes: importer.notes || '',
            dateAdded: importer.createdAt || new Date().toISOString(),
            city: importer.city || '',
            contactPage: '',
            linkedin: importer.linkedin || '',
            leadType: 'Importer',
            lastContact: ''
          }));
          
          // Only update if the data has actually changed or increased
          setDiscoveredLeads(prev => {
            if (prev.length === mappedLeads.length) return prev;
            return mappedLeads;
          });
          
          // Auto-select new ones
          setSelectedLeads(prev => {
            const updated = { ...prev };
            let hasNew = false;
            mappedLeads.forEach(lead => {
              if (prev[lead.id] === undefined) {
                updated[lead.id] = true;
                hasNew = true;
              }
            });
            return hasNew ? updated : prev;
          });
        }

        // Handle completion or failure
        if (data.status === 'COMPLETED') {
          clearInterval(pollingRef.current!);
          
          if (data.totalFound === 0) {
            setError('The was unable to find specific data for this region. Please try a broader search or a different country.');
            setStatusMessage('');
          } else {
            setStatusMessage(`DISCOVERY COMPLETED! FOUND ${data.totalFound} NEW IMPORTERS.`);
          }
          
          setIsLoading(false);
          setCurrentSessionId(null);
          localStorage.removeItem('discoverySessionId');
          fetchRecentSessions(); // Refresh history list
          
          // Auto-add to CRM after 2 seconds
          if (data.importers && data.importers.length > 0) {
            setTimeout(() => {
              const leadsToImport: Lead[] = data.importers.map((imp: any) => ({
                id: imp.id,
                companyName: imp.companyName,
                website: imp.website || '',
                email: imp.email || '',
                phone: imp.phone || '',
                country: imp.country || '',
                leadScore: imp.leadScore || 'C',
                status: (imp.status as any) || 'New',
                notes: imp.notes || '',
                dateAdded: imp.createdAt || new Date().toISOString(),
                city: imp.city || '',
                contactPage: '',
                linkedin: imp.linkedin || '',
                leadType: 'Importer',
                lastContact: ''
              }));
              handleImportSelected(leadsToImport);
            }, 2000);
          }
        } else if (data.status === 'FAILED') {
          clearInterval(pollingRef.current!);
          setIsLoading(false);
          setCurrentSessionId(null);
          localStorage.removeItem('discoverySessionId');
          setError(data.error || 'Discovery failed');
          setStatusMessage('');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    // Poll every 2 seconds
    pollingRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [currentSessionId]);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Stop any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setIsLoading(true);
    setStatusMessage('Starting discovery session...');
    setError(null);
    setDiscoveredLeads([]); // Clear previous leads immediately
    setSelectedLeads({});
    setProgress({ total: 0, processed: 0 });
    localStorage.removeItem('discoveryLastResults'); // Clear cache

    try {
      const discoveryQuery = `${importerType} in ${region ? `${region}, ` : ''}${country}`;
      const data = await api.post('/api/discovery/start', {
        query: discoveryQuery,
        targetCountry: country,
        region,
        importerType,
        maxResults: 30
      });

      if (!data) {
        throw new Error('Failed to start discovery session.');
      }
      
      // Save session ID to localStorage for persistence across tab switches
      localStorage.setItem('discoverySessionId', data.sessionId);
      
      // Start polling with session ID
      setCurrentSessionId(data.sessionId);
      setStatusMessage('Discovery in progress. Please wait...');
      fetchRecentSessions(); // Add to history list immediately

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Discovery failed. Please verify API configuration or try again.');
      setStatusMessage('');
      setIsLoading(false);
      localStorage.removeItem('discoverySessionId');
    }
  };

  const handleSelectAll = () => {
    const allSelected = discoveredLeads.length > 0 && discoveredLeads.every(l => selectedLeads[l.id]);
    const nextSelected: { [key: string]: boolean } = {};
    if (!allSelected) {
      discoveredLeads.forEach(l => {
        nextSelected[l.id] = true;
      });
    }
    setSelectedLeads(nextSelected);
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleImportSelected = async (leadsToImport?: Lead[]) => {
    const toImport = leadsToImport || discoveredLeads.filter(lead => selectedLeads[lead.id]);
    if (toImport.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const data = await api.post('/api/importers/bulk', { importers: toImport });
      alert(data.message);
      onAddLeads(toImport); // Refresh main CRM list
        
      // Don't clear leads immediately so the user can still see what they just imported
      // Only clear the selection
      setSelectedLeads({});
      setStatusMessage('Importers successfully added to CRM.');
    } catch (err) {
      console.error('Import error:', err);
      alert('Error importing leads.');
    }
  };

  const handleCopyToClipboard = (lead: Lead, e: React.MouseEvent) => {
      e.stopPropagation();
      const text = `Company: ${lead.companyName}\nCountry: ${lead.country}\nWebsite: ${lead.website}\nEmail: ${lead.email}\nPhone: ${lead.phone}`;
      
      // Method 1: execCommand (most reliable on localhost/non-secure)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopiedId(lead.id);
          setTimeout(() => setCopiedId(null), 2000);
          return;
        }
      } catch (err) {
        document.body.removeChild(textArea);
      }

      // Method 2: Navigator API (backup)
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopiedId(lead.id);
            setTimeout(() => setCopiedId(null), 2000);
          })
          .catch(err => {
            console.error('Final copy failure:', err);
            alert('Gagal menyalin. Silakan pilih teks secara manual.');
          });
      } else {
        alert('Browser Anda tidak mendukung fitur salin otomatis.');
      }
    };

  const handleAddToGoogleSheet = async (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSyncingId(lead.id);
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/importers/sync-sheets', { importerId: lead.id });
      alert(`Lead ${lead.companyName} successfully pushed to Google Sheets!`);
    } catch (err) {
      console.error('Google Sheets error:', err);
      alert('Failed to sync with Google Sheets. Please try again.');
    } finally {
      setIsSyncingId(null);
    }
  };

  const handleBulkExportToSheets = async () => {
    const selected = discoveredLeads.filter(lead => selectedLeads[lead.id]);
    if (selected.length === 0) return;

    setIsLoading(true);
    setStatusMessage(`Exporting ${selected.length} leads to Google Sheets...`);
    
    let successCount = 0;
    for (const lead of selected) {
      try {
        const result = await api.post('/api/importers/sync-sheets', { importerId: lead.id });
        if (result) successCount++;
      } catch (e) {
        console.error(`Failed to export ${lead.companyName}`, e);
      }
    }

    setIsLoading(false);
    setStatusMessage(`Successfully exported ${successCount} of ${selected.length} leads to Google Sheets.`);
    alert(`Export complete: ${successCount} leads added to Google Sheets.`);
  };

  const cancelDiscovery = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setIsLoading(false);
    setCurrentSessionId(null);
    localStorage.removeItem('discoverySessionId');
    setStatusMessage('Discovery cancelled.');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#05190F]">Importer Discovery Engine</h2>
            <p className="text-gray-400 text-sm mt-1">Global coffee entity scout & verifier</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                showHistory 
                  ? 'bg-[#05190F] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showHistory ? 'New Search' : 'Discovery History'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm font-mono"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Search Form or History */}
        <div className="w-1/3 border-r border-gray-200 bg-white p-6 overflow-y-auto">
          {showHistory ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#05190F] mb-4 uppercase tracking-widest">Past Discoveries</h3>
              {recentSessions.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No history found.</p>
              ) : (
                recentSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-[#05190F] cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        session.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        session.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                        'bg-blue-50 text-blue-600 animate-pulse'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#05190F] font-semibold line-clamp-2 group-hover:text-[#1a4d2e]">
                      {session.query}
                    </p>
                    <div className="mt-3 text-xs text-gray-400">
                      <span>{session.totalFound || 0} Found</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">

            {/* Progress Bar or Status */}
            {currentSessionId && (
              <div className="space-y-4 p-4 bg-[#1a3a2a] rounded-lg border border-[#d4af37]/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#d4af37]">Session Active</span>
                  <span className="text-[10px] text-[#8fb499]">{currentSessionId.substring(0, 8)}...</span>
                </div>
                
                {progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-[#8fb499] uppercase tracking-widest">
                      <span>Analyzing Market</span>
                      <span>{Math.round((progress.processed / progress.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0f2318] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#d4af37] transition-all duration-500"
                        style={{ width: `${Math.min(100, (progress.processed / progress.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSessionId(null);
                      localStorage.removeItem('discoverySessionId');
                      setIsLoading(false);
                      setStatusMessage('');
                    }}
                    className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    New Search
                  </button>
                  {isLoading && (
                    <button
                      type="button"
                      onClick={cancelDiscovery}
                      className="px-4 py-2 bg-red-900/30 text-red-400 rounded text-[10px] font-mono uppercase tracking-widest hover:bg-red-900/50 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {!currentSessionId && (
              <div className="space-y-6">
                
                {/* Market-Driven Target Recommendations */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-bold text-[#05190F] mb-3 uppercase tracking-widest">Market Target Suggestions</h3>
                  {loadingRecs ? (
                    <div className="flex items-center text-gray-400 text-xs gap-2">
                      <div className="w-3 h-3 border-2 border-[#05190F] border-t-transparent rounded-full animate-spin" /> Analyzing market data...
                    </div>
                  ) : marketRecs.length > 0 ? (
                    <div className="space-y-2">
                      {marketRecs.map((rec, i) => (
                        <div key={i} className="p-3 bg-[#1a3a2a]/50 border border-[#1a3a2a] rounded cursor-pointer hover:border-[#d4af37]/50 transition-colors"
                          onClick={() => {
                            setCountry(rec.targetCountry);
                            setRegion('');
                            setImporterType(rec.searchQuery);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-white">{rec.targetCountry}</h4>
                            <button className="text-[9px] text-[#d4af37] border border-[#d4af37]/30 rounded px-1.5 py-0.5 hover:bg-[#d4af37] hover:text-black transition-colors">
                              Apply
                            </button>
                          </div>
                          <p className="text-[10px] text-[#8fb499] mt-1 leading-tight">{rec.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8fb499]">No recommendations available right now.</p>
                  )}
                </div>

                <form onSubmit={handleDiscover} className="space-y-4">
                {/* Country Selection */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8fb499] mb-2">Target Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#0f2318] border border-[#1a3a2a] rounded-md px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none text-sm"
                    disabled={isLoading}
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Region (Optional) */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8fb499] mb-2">Region (Optional)</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., Bavaria, California..."
                    className="w-full bg-[#0f2318] border border-[#1a3a2a] rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none text-sm"
                    disabled={isLoading}
                  />
                </div>

                {/* Importer Type */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8fb499] mb-2">Importer Type</label>
                  <select
                    value={importerType}
                    onChange={(e) => setImporterType(e.target.value)}
                    className="w-full bg-[#0f2318] border border-[#1a3a2a] rounded-md px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none text-sm"
                    disabled={isLoading}
                  >
                    {importerTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Status or Error Message */}
                {(statusMessage || error) && (
                  <div className={`p-3 rounded-md text-[10px] font-mono uppercase tracking-widest ${error ? 'bg-red-900/30 text-red-400' : 'bg-[#1a3a2a] text-[#8fb499]'}`}>
                    {error ?  : }
                    {error || statusMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-md font-bold uppercase tracking-[0.2em] text-[11px] transition-all ${
                    isLoading
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-[#d4af37] text-[#0a1a12] hover:bg-[#c4a030] shadow-lg shadow-gold/10'
                  }`}
                >
                  {isLoading ? (
                    <>
                      
                      Scouting...
                    </>
                  ) : (
                    <>
                      
                      Start Discovery
                    </>
                  )}
                </button>
              </form>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1 p-6 overflow-y-auto">
          {discoveredLeads.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8fb499]">
              
              <p className="text-lg">No discoveries yet</p>
              <p className="text-sm opacity-70 mt-2">Configure your search criteria and click Discover</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-[#d4af37] hover:underline"
                >
                  {discoveredLeads.length > 0 && discoveredLeads.every(l => selectedLeads[l.id]) 
                    ? 'Deselect All' 
                    : 'Select All'}
                </button>
                <span className="text-xs text-[#8fb499]">
                  {Object.values(selectedLeads).filter(Boolean).length} selected
                </span>
              </div>
              {discoveredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={`bg-[#0f2318] border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedLeads[lead.id] 
                      ? 'border-[#d4af37] shadow-lg shadow-[#d4af37]/10' 
                      : 'border-[#1a3a2a] hover:border-[#2a4a3a]'
                  }`}
                  onClick={() => toggleSelectLead(lead.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedLeads[lead.id]}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-[#1a3a2a] text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <h3 className="font-semibold text-white">{lead.companyName}</h3>
                        {existingLeads.some(ex => (lead.email && ex.email === lead.email) || (ex.companyName.toLowerCase() === lead.companyName.toLowerCase())) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/30 text-blue-400 border border-blue-400/20">
                            Already in CRM
                          </span>
                        )}
                        {lead.leadScore && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            lead.leadScore === 'A' ? 'bg-green-900/50 text-green-400' :
                            lead.leadScore === 'B' ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            Score {lead.leadScore}
                            </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#8fb499]">
                        {lead.website && (
                          <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-[#d4af37]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            
                            Website
                          </a>
                        )}
                        {lead.linkedin && (
                          <a 
                            href={lead.linkedin.startsWith('http') ? lead.linkedin : `https://${lead.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-[#d4af37]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            
                            LinkedIn
                          </a>
                        )}
                        {lead.email && (
                          <a 
                            href={`mailto:${lead.email}`} 
                            className="flex items-center gap-1 hover:text-[#d4af37]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            
                            {lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            
                            {lead.phone}
                          </span>
                        )}
                        {lead.country && (
                          <span className="flex items-center gap-1">
                            
                            {lead.country}{lead.city ? `, ${lead.city}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={(e) => handleCopyToClipboard(lead, e)}
                        className={`p-2 rounded-md transition-all flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest ${
                          copiedId === lead.id 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-[#1a3a2a] text-[#8fb499] hover:text-[#d4af37]'
                        }`}
                        title="Copy to clipboard"
                      >
                        {copiedId === lead.id ?  : }
                        {copiedId === lead.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={(e) => handleAddToGoogleSheet(lead, e)}
                        disabled={isSyncingId === lead.id}
                        className={`p-2 rounded-md transition-all flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest ${
                          isSyncingId === lead.id
                            ? 'bg-[#1a3a2a] opacity-50 cursor-not-allowed'
                            : 'bg-[#1a3a2a] text-[#8fb499] hover:text-[#d4af37]'
                        }`}
                        title="Push to Google Sheets"
                      >
                        {isSyncingId === lead.id ?  : }
                        {isSyncingId === lead.id ? 'Syncing' : 'Sheets'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer / Batch Actions */}
      {discoveredLeads.length > 0 && (
        <div className="p-4 bg-[#0f2318] border-t border-[#1a3a2a] flex items-center justify-between">
          <div className="text-sm text-[#8fb499]">
            <span className="font-bold text-[#d4af37]">{Object.values(selectedLeads).filter(Boolean).length}</span> leads selected for import
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkExportToSheets}
              disabled={isLoading || Object.values(selectedLeads).filter(Boolean).length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#1a3a2a] text-[#8fb499] rounded-md hover:text-[#d4af37] transition-all font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              
              Export to Sheets
            </button>
            <button
              onClick={() => handleImportSelected()}
              disabled={isLoading || Object.values(selectedLeads).filter(Boolean).length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#d4af37] text-[#0a1a12] rounded-md hover:bg-[#c4a030] transition-all font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              
              Add to CRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
