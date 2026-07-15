import React, { useState } from 'react';
import { Lead, Sample, Quotation } from '../types';

interface CrmViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, newStatus: Lead['status']) => void;
  onUpdateMultipleLeadsStatus?: (leadIds: string[], newStatus: Lead['status']) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLeadManual: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  onImportLeads: (file: File) => void;
  onSelectLeadForEmail: (lead: Lead) => void;
  onSelectLeadForSample: (lead: Lead) => void;
  onSelectLeadForQuote: (lead: Lead) => void;
}

const COLUMNS: Array<{ label: string; status: Lead['status']; color: string }> = [
  { label: 'New Lead', status: 'New Lead', color: 'bg-slate-100 border-slate-200 text-slate-700' },
  { label: 'Contacted', status: 'Contacted', color: 'bg-sky-50 border-sky-100 text-sky-700' },
  { label: 'Replied', status: 'Replied', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
  { label: 'Sample Req.', status: 'Sample Requested', color: 'bg-purple-50 border-purple-100 text-purple-700' },
  { label: 'Sample Sent', status: 'Sample Sent', color: 'bg-amber-50 border-amber-100 text-amber-700' },
  { label: 'Negotiation', status: 'Negotiation', color: 'bg-orange-50 border-orange-100 text-orange-700' },
  { label: 'Quote Sent', status: 'Quotation Sent', color: 'bg-pink-50 border-pink-100 text-pink-700' },
  { label: 'Confirmed', status: 'Order Confirmed', color: 'bg-teal-50 border-teal-100 text-teal-700' },
  { label: 'Closed Won', status: 'Closed Won', color: 'bg-[#05190F]/5 border-[#05190F]/20 text-[#05190F]' },
  { label: 'Closed Lost', status: 'Closed Lost', color: 'bg-red-50 border-red-100 text-red-600' }
];

export default function CrmView({ 
  leads, 
  onUpdateLeadStatus, 
  onUpdateMultipleLeadsStatus,
  onDeleteLead, 
  onAddLeadManual,
  onImportLeads,
  onSelectLeadForEmail,
  onSelectLeadForSample,
  onSelectLeadForQuote
}: CrmViewProps) {

  // Calculate stats
  const totalBuyers = leads.length;
  const newLeads = leads.filter(l => l.status === 'New Lead').length;
  const negotiations = leads.filter(l => l.status === 'Negotiation').length;
  const samplesRunning = leads.filter(l => l.status === 'Sample Requested' || l.status === 'Sample Sent').length;
  const quotationsSent = leads.filter(l => l.status === 'Quotation Sent').length;
  const shipmentsRunning = 0; // Placeholder for now
  const repeatClients = leads.filter(l => (l as any).isRepeatClient).length;
  const lostAccounts = leads.filter(l => l.status === 'Closed Lost').length;
  const todayFollowups = 0; // Placeholder for now

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportLeads(file);
    }
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<string>('ALL');
  
  // View mode switcher: 'board' vs 'list'
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  
  // Selection states for bulk actions
  const [selectedLeads, setSelectedLeads] = useState<{ [id: string]: boolean }>({});

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('Importer');
  const [country, setCountry] = useState('Germany');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [importLicenseNumber, setImportLicenseNumber] = useState('');
  const [annualVolumeBags, setAnnualVolumeBags] = useState('');
  const [estimatedBuyingCapacity, setEstimatedBuyingCapacity] = useState('');
  const [targetMoqBags, setTargetMoqBags] = useState('');
  const [preferredIncoterm, setPreferredIncoterm] = useState<'FOB' | 'CIF' | 'EXW' | 'CNF'>('FOB');
  const [leadType, setLeadType] = useState('Green Coffee Importer');
  const [leadScore, setLeadScore] = useState<'A' | 'B' | 'C'>('B');
  const [notes, setNotes] = useState('');

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onUpdateLeadStatus(leadId, status);
    }
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;

    onAddLeadManual({
      companyName,
      country,
      city,
      state,
      website,
      contactPage: '',
      email,
      phone,
      whatsapp,
      linkedin,
      businessType,
      primaryContactName,
      primaryContactEmail,
      importLicenseNumber,
      annualVolumeBags: annualVolumeBags ? Number(annualVolumeBags) : undefined,
      estimatedBuyingCapacity: estimatedBuyingCapacity ? Number(estimatedBuyingCapacity) : undefined,
      targetMoqBags: targetMoqBags ? Number(targetMoqBags) : undefined,
      preferredIncoterm,
      leadType,
      leadScore,
      status: 'New Lead',
      lastContact: 'Added manually',
      notes
    } as any); // Using as any for now since we're adding new fields

    // Reset
    setCompanyName('');
    setBusinessType('Importer');
    setCountry('Germany');
    setCity('');
    setState('');
    setWebsite('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setLinkedin('');
    setPrimaryContactName('');
    setPrimaryContactEmail('');
    setImportLicenseNumber('');
    setAnnualVolumeBags('');
    setEstimatedBuyingCapacity('');
    setTargetMoqBags('');
    setPreferredIncoterm('FOB');
    setLeadType('Green Coffee Importer');
    setLeadScore('B');
    setNotes('');
    setShowAddModal(false);
  };

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScore = selectedScoreFilter === 'ALL' || lead.leadScore === selectedScoreFilter;

    return matchesSearch && matchesScore;
  });

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      alert("No leads found matching the current filters to export.");
      return;
    }

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const headers = [
      "Lead ID",
      "Date Added",
      "Company Name",
      "Country",
      "City",
      "Website",
      "Contact Page",
      "Email",
      "Phone",
      "LinkedIn",
      "Lead Category",
      "Lead Score",
      "Status",
      "Last Contact",
      "Notes",
      "Website Confidence",
      "Email Confidence",
      "Importer Confidence",
      "Importer Probability",
      "Product Match",
      "Product Justification"
    ];

    const rows = filteredLeads.map(lead => [
      lead.id,
      lead.dateAdded,
      lead.companyName,
      lead.country,
      lead.city || '',
      lead.website || '',
      lead.contactPage || '',
      lead.email || '',
      lead.phone || '',
      lead.linkedin || '',
      lead.leadType,
      lead.leadScore,
      lead.status,
      lead.lastContact || '',
      lead.notes || '',
      lead.websiteConfidence || '',
      lead.emailConfidence || '',
      lead.importerConfidence || '',
      lead.importerProbability || '',
      lead.analysisMatch || '',
      lead.analysisWhy || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCSV).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nandara_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColor = (score: string) => {
    switch(score) {
      case 'A': return 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20';
      case 'B': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const toggleSelectLead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLeads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAllToggle = () => {
    const allChecked = filteredLeads.every(l => selectedLeads[l.id]);
    const updatedSelected: { [id: string]: boolean } = {};
    if (!allChecked) {
      filteredLeads.forEach(l => {
        updatedSelected[l.id] = true;
      });
    }
    setSelectedLeads(updatedSelected);
  };

  const selectedCount = Object.keys(selectedLeads).filter(id => selectedLeads[id]).length;

  return (
    <div className="space-y-6" id="crm-root">
      {/* Top Filter & Add Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-5 rounded-lg bg-white border border-primary/5 shadow-luxury animate-fade-in">
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* View Model Toggle */}
          <div className="flex bg-[#05190F]/5 p-1 rounded-md border border-primary/10 text-[10px] font-mono mr-2">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3.5 py-1.5 rounded-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
                viewMode === 'board' ? 'bg-[#05190F] text-gold' : 'text-primary/70 hover:text-primary'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-sm uppercase tracking-wider font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-[#05190F] text-gold' : 'text-primary/70 hover:text-primary'
              }`}
            >
              List Rows
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gold">
              
            </span>
            <input 
              type="text" 
              placeholder="Search importer leads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-bg-ivory/40 border border-primary/15 rounded-sm text-xs font-mono focus:ring-1 focus:ring-gold focus:border-gold outline-hidden"
            />
          </div>

          {/* Score filter */}
          <div className="flex items-center gap-1.5">
            
            <select 
              value={selectedScoreFilter} 
              onChange={e => setSelectedScoreFilter(e.target.value)}
              className="bg-bg-ivory/40 border border-primary/15 rounded-sm text-[10px] font-mono px-3 py-2.5 uppercase tracking-wider focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary"
            >
              <option value="ALL">All Grades</option>
              <option value="A">Grade A only</option>
              <option value="B">Grade B only</option>
              <option value="C">Grade C only</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-50 hover:bg-stone-100 border border-primary/20 text-primary rounded-sm text-[10px] font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
          >
            
            Export CSV
          </button>
          
          <label className="w-full sm:w-auto px-5 py-2.5 bg-[#05190F]/5 border border-primary/20 text-primary rounded-sm text-[10px] font-mono uppercase tracking-widest hover:bg-[#05190F]/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold">
            
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#05190F] hover:bg-neutral-950 text-white rounded-sm text-[10px] font-mono uppercase tracking-widest border border-gold/45 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
          >
            
            Add Custom Lead
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
        {[
          { label: 'Total Buyers', value: totalBuyers, color: 'text-primary' },
          { label: 'New Leads', value: newLeads, color: 'text-blue-600' },
          { label: 'Negotiations', value: negotiations, color: 'text-orange-600' },
          { label: 'Samples Running', value: samplesRunning, color: 'text-amber-600' },
          { label: 'Quotations Sent', value: quotationsSent, color: 'text-pink-600' },
          { label: 'Shipments Running', value: shipmentsRunning, color: 'text-teal-600' },
          { label: 'Repeat Clients', value: repeatClients, color: 'text-green-600' },
          { label: 'Lost Accounts', value: lostAccounts, color: 'text-red-600' },
          { label: 'Today Follow-ups', value: todayFollowups, color: 'text-gold' }
        ].map((stat, idx) => (
          <div key={idx} className="p-4 bg-white border border-primary/5 rounded-lg shadow-luxury">
            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Buyer Intelligence & Lead Scoring Guide */}
      <div className="p-6 rounded-lg bg-[#05190F]/5 border border-primary/5 shadow-luxury animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          
          <h2 className="text-sm font-serif text-[#05190F] uppercase tracking-widest font-bold">Panduan Buyer Intelligence & Lead Scoring</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              score: 'A',
              title: 'Elite/Premium Buyer',
              desc: 'Pembeli prioritas tinggi dengan kapasitas volume besar dan reputasi pasar yang kuat. Biasanya roaster besar atau distributor utama.',
              ai: 'Prioritas utama. Kirim sampel premium segera. Tawarkan kontrak jangka panjang dengan harga kompetitif untuk volume besar.',
              color: 'border-[#D4AF37] bg-white',
              tagColor: 'bg-[#D4AF37] text-white'
            },
            {
              score: 'B',
              title: 'Growth/Potential Buyer',
              desc: 'Roaster butik atau distributor spesialis yang sangat menghargkualitas (specialty). Memiliki potensi repeat order yang sangat stabil.',
              ai: 'Bangun hubungan melalui "Traceability" (asal-usul kopi). Tawarkan varietas unik atau micro-lots untuk membedakan diri dari kompetitor.',
              color: 'border-emerald-200 bg-white',
              tagColor: 'bg-emerald-600 text-white'
            },
            {
              score: 'C',
              title: 'Standard/Niche Buyer',
              desc: 'Pembeli baru, kafe skala kecil, atau perusahaan yang baru mulmengeksplorasi kopi Indonesia. Volume kecil namun potensial untuk ekspansi.',
              ai: 'Gunakan pendekatan edukatif. Tawarkan volume fleksibel dan berikan informasi detail tentang profil rasa kopi Indonesia.',
              color: 'border-slate-200 bg-white',
              tagColor: 'bg-slate-500 text-white'
            }
          ].map((item) => (
            <div key={item.score} className={`p-5 rounded-lg border shadow-sm transition-all hover:shadow-md ${item.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm ${item.tagColor}`}>
                  {item.score}
                </span>
                <h3 className="font-bold text-xs text-[#05190F] uppercase tracking-wider">{item.title}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-primary/40 block mb-1">Karakteristik Buyer</span>
                  <p className="text-[11px] text-primary/80 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
                
                <div className="pt-3 border-t border-black/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gold font-bold">Rekomendasi Strategi AI</span>
                  </div>
                  <p className="text-[10px] italic text-primary/90 leading-relaxed font-sans">
                    {item.ai}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-primary/10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-white/50 rounded border border-primary/5">
            
            <div>
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Analisis Wilayah (Geographical Intelligence)</h4>
              <p className="text-[10px] text-primary/60 leading-relaxed">Lokasi menentukan biaya logistik dan preferensi rasa. Pasar Asia Timur menyukrasa clean, sementara Eropa cenderung menyukbody yang kuat.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/50 rounded border border-primary/5">
            
            <div>
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Website & Email Confidence</h4>
              <p className="text-[10px] text-primary/60 leading-relaxed">Tingkat akurasi data digital. Skor tinggi berarti website aktif dan email terverifikasi sebagsaluran komunikasi bisnis resmi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW MODE */}
      {viewMode === 'board' && (
        <div className="overflow-x-auto pb-4" id="kanban-scroller">
          <div className="flex gap-4 min-w-[1700px] h-[calc(100vh-270px)] min-h-[550px] font-sans">
            {COLUMNS.map((column) => {
              const columnLeads = filteredLeads.filter(l => l.status === column.status);
              return (
                <div 
                  key={column.status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.status)}
                  className="w-80 flex flex-col rounded-lg bg-white/40 border border-primary/5 p-4.5 h-full select-none shadow-xs"
                >
                  {/* Column Header */}
                  <div className={`p-3 rounded-sm border mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest font-semibold ${column.color}`}>
                    <span className="truncate">{column.label}</span>
                    <span className="px-2 py-0.5 rounded-sm bg-white border border-primary/5 text-[9px] font-bold">
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {columnLeads.length === 0 ? (
                      <div className="h-full border border-dashed border-primary/10 rounded-sm py-12 flex flex-col items-center justify-center text-primary/30">
                        
                        <p className="text-[9px] font-mono uppercase tracking-widest">Drop prospects</p>
                      </div>
                    ) : (
                      columnLeads.map((lead) => {
                        const isChecked = !!selectedLeads[lead.id];
                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className={`p-5 bg-white border rounded-lg shadow-luxury hover:shadow-luxury-hover hover:border-gold/40 transition-all cursor-grab active:cursor-grabbing space-y-3 group relative ${
                              isChecked ? 'border-primary ring-1 ring-primary/30' : 'border-primary/5'
                            }`}
                          >
                            {/* Checkbox select integration inside Kanban card */}
                            <button
                              onClick={(e) => toggleSelectLead(lead.id, e)}
                              className={`absolute top-5 left-4 p-0 w-4.5 h-4.5 rounded-sm border transition-all cursor-pointer flex items-center justify-center ${
                                isChecked 
                                  ? 'bg-[#05190F] border-[#05190F] text-gold' 
                                  : 'border-primary/20 text-transparent hover:border-gold'
                              }`}
                            >
                              <div className="w-1.5 h-1.5 bg-gold rounded-full opacity-0 group-hover:opacity-100" style={{ display: isChecked ? 'none' : 'block' }} />
                              <span className="text-[10px] font-bold leading-none text-gold" style={{ display: isChecked ? 'block' : 'none' }}>✓</span>
                            </button>

                            {/* Title & Score content shifted right for checkbox space */}
                            <div className="space-y-1.5 pl-7">
                              <div className="flex justify-between items-start gap-2">
                                <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wider font-semibold border ${getScoreColor(lead.leadScore)}`}>
                                  Grade {lead.leadScore}
                                </span>
                                
                                {/* Card Menu Dropdown / Moves for extreme iframe compatibility */}
                                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                  {/* Move Left */}
                                  {COLUMNS.findIndex(c => c.status === column.status) > 0 && (
                                    <button 
                                      title="Move status left"
                                      onClick={() => {
                                        const currentIdx = COLUMNS.findIndex(c => c.status === column.status);
                                        onUpdateLeadStatus(lead.id, COLUMNS[currentIdx - 1].status);
                                      }}
                                      className="p-1 hover:bg-[#05190F]/5 rounded-sm text-[#05190F] cursor-pointer"
                                    >
                                      
                                    </button>
                                  )}
                                  {/* Move Right */}
                                  {COLUMNS.findIndex(c => c.status === column.status) < COLUMNS.length - 1 && (
                                    <button 
                                      title="Move status right"
                                      onClick={() => {
                                        const currentIdx = COLUMNS.findIndex(c => c.status === column.status);
                                        onUpdateLeadStatus(lead.id, COLUMNS[currentIdx + 1].status);
                                      }}
                                      className="p-1 hover:bg-[#05190F]/5 rounded-sm text-[#05190F] cursor-pointer"
                                    >
                                      
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => {
                                      if (confirm(`Remove lead ${lead.companyName} from database?`)) {
                                        onDeleteLead(lead.id);
                                      }
                                    }}
                                    className="p-1 hover:bg-red-50 hover:text-red-600 rounded-sm text-gray-300 transition-all cursor-pointer"
                                    title="Delete Lead"
                                  >
                                    
                                  </button>
                                </div>
                              </div>
                              <h4 className="text-xs font-bold text-primary font-sans tracking-wide leading-tight group-hover:text-gold transition-colors">
                                {lead.companyName}
                              </h4>
                              <p className="text-[10px] text-text-dim font-mono uppercase tracking-wider flex items-center gap-0.5">
                                
                                {lead.country}
                              </p>
                            </div>

                            {/* Additional Meta Tags */}
                            <div className="flex gap-1 flex-wrap pl-7">
                              <span className="text-[9px] bg-bg-ivory/50 border border-primary/5 font-mono text-text-dim px-2 py-0.5 rounded-sm truncate max-w-full">
                                {lead.leadType}
                              </span>
                            </div>

                            {/* Direct action shortcuts inside CRM */}
                            <div className="flex gap-1.5 pt-2 border-t border-gray-100 justify-end" onClick={e => e.stopPropagation()}>
                              <button
                                title="Compose Outreach Email"
                                onClick={() => onSelectLeadForEmail(lead)}
                                className="p-1.5 bg-bg-ivory/30 hover:bg-gold/15 border border-[#05190F]/10 text-primary hover:text-gold rounded-sm transition-all cursor-pointer"
                              >
                                
                              </button>
                              
                              <button
                                title="Prepare Sample Box"
                                onClick={() => onSelectLeadForSample(lead)}
                                className="p-1.5 bg-bg-ivory/30 hover:bg-gold/15 border border-[#05190F]/10 text-amber-700 rounded-sm transition-all cursor-pointer"
                              >
                                
                              </button>
                              
                              <button
                                title="Create Export Invoice Proforma"
                                onClick={() => onSelectLeadForQuote(lead)}
                                className="p-1.5 bg-bg-ivory/30 hover:bg-emerald-50 border border-[#05190F]/10 text-emerald-800 rounded-sm transition-all cursor-pointer"
                              >
                                
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST ROWS TABLE VIEW MODE */}
      {viewMode === 'list' && (
        <div className="p-6 bg-white border border-primary/5 rounded-lg shadow-luxury overflow-hidden animate-fade-in" id="list-grid">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#05190F]/10 font-mono text-[10px] uppercase text-primary/70 tracking-widest pb-3">
                  <th className="p-4 w-12">
                    <button
                      onClick={handleSelectAllToggle}
                      className="w-4.5 h-4.5 border border-primary/20 rounded-xs flex items-center justify-center cursor-pointer hover:border-gold bg-bg-ivory/50"
                    >
                      {filteredLeads.length > 0 && filteredLeads.every(l => selectedLeads[l.id]) ? (
                        <span className="text-[#05190F] font-bold text-xs">✓</span>
                      ) : null}
                    </button>
                  </th>
                  <th className="p-4 pl-1">Exporter Account Importer</th>
                  <th className="p-4">Global Segment</th>
                  <th className="p-4">Territory</th>
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4">Last Contacted</th>
                  <th className="p-4 text-right pr-6">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-primary/30">
                      
                      <p className="font-mono text-xs uppercase tracking-widest">No matching coffee leads found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isChecked = !!selectedLeads[lead.id];
                    const activeCol = COLUMNS.find(c => c.status === lead.status);
                    return (
                      <tr 
                        key={lead.id}
                        className={`border-b border-gray-100 hover:bg-[#F6F2E8]/20 transition-colors text-xs ${
                          isChecked ? 'bg-[#D4AF37]/5' : ''
                        }`}
                      >
                        <td className="p-4">
                          <button
                            onClick={() => toggleSelectLead(lead.id)}
                            className={`w-4.5 h-4.5 border rounded-xs flex items-center justify-center cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-[#05190F] border-[#05190F] text-gold' 
                                : 'border-primary/20 text-transparent hover:border-gold'
                            }`}
                          >
                            <span className="text-gold font-bold text-[10px]">✓</span>
                          </button>
                        </td>
                        <td className="p-4 pl-1">
                          <div className="space-y-1">
                            <h4 className="font-bold text-primary font-sans text-sm">{lead.companyName}</h4>
                            <div className="flex gap-2 items-center flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wider font-semibold border ${getScoreColor(lead.leadScore)}`}>
                                Grade {lead.leadScore}
                              </span>
                              {lead.analysisMatch && (
                                <span className="text-[9px] font-mono text-gold-hover truncate max-w-xs block font-medium">Matches: {lead.analysisMatch}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-bg-ivory/50 border border-primary/5 text-slate-600 px-2.5 py-1 rounded-sm tracking-wide text-[10px]">
                            {lead.leadType}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            
                            {lead.city ? `${lead.city}, ` : ''}{lead.country}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 border rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold ${
                            activeCol?.color || 'bg-gray-100 text-gray-700'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-text-dim text-[11px] text-gray-500">
                          {lead.lastContact}
                        </td>
                        <td className="p-4 text-right pr-6.5">
                          <div className="flex gap-1 justify-end items-center">
                            <button
                              onClick={() => onSelectLeadForEmail(lead)}
                              title="Compose Outreach Offer"
                              className="p-1 px-2 border hover:bg-gold/15 rounded-sm hover:border-gold text-gold transition-all cursor-pointer font-mono text-[10px] flex items-center gap-1 uppercase"
                            >
                              
                              <span>Outreach</span>
                            </button>

                            <button
                              onClick={() => onSelectLeadForSample(lead)}
                              title="Prepare Sample Dispatch"
                              className="p-1 px-2 border hover:bg-gold/15 rounded-sm hover:border-gold text-amber-700 transition-all cursor-pointer font-mono text-[10px] flex items-center gap-1 uppercase"
                            >
                              
                              <span>Sample</span>
                            </button>

                            <button
                              onClick={() => onSelectLeadForQuote(lead)}
                              title="Build Quotation"
                              className="p-1 px-2 border hover:bg-emerald-50 rounded-sm hover:border-emerald-700 text-emerald-800 transition-all cursor-pointer font-mono text-[10px] flex items-center gap-1 uppercase"
                            >
                              
                              <span>Quote</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete lead ${lead.companyName}?`)) {
                                  onDeleteLead(lead.id);
                                }
                              }}
                              title="Delete Lead Account"
                              className="p-1.5 hover:bg-red-50 hover:text-red-700 rounded-sm text-gray-300 transition-all cursor-pointer"
                            >
                              
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -to-x -translate-x-1/2 z-50 bg-[#05190F] border border-gold/45 rounded-lg p-4 px-6 shadow-2xl flex items-center gap-6 text-white animate-fade-in font-sans">
          <div className="font-mono text-xs shrink-0">
            <span className="text-gold font-bold uppercase tracking-wider text-[10px] block">Nandara Sourcing Bulk Console</span>
            <p className="text-[10px] text-gray-300 font-sans mt-0.5">
              <b className="text-gold">{selectedCount}</b> accounts checklist active
            </p>
          </div>
          
          <div className="flex gap-2.5 items-center flex-wrap">
            <button
              onClick={() => {
                const selectedIds = Object.keys(selectedLeads).filter(id => selectedLeads[id]);
                if (onUpdateMultipleLeadsStatus) {
                  onUpdateMultipleLeadsStatus(selectedIds, 'Contacted');
                } else {
                  selectedIds.forEach(id => onUpdateLeadStatus(id, 'Contacted'));
                }
                setSelectedLeads({});
                alert(`Advanced ${selectedIds.length} leads to "Contacted" status successfully!`);
              }}
              className="px-4.5 py-2.5 bg-gold hover:bg-[#bfa232] text-primary rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-md text-[#05190F] transition-all"
            >
              Move to 'Contacted' ➔
            </button>
            
            <button
              onClick={() => {
                const selectedIds = Object.keys(selectedLeads).filter(id => selectedLeads[id]);
                if (confirm(`Remove all ${selectedIds.length} selected lead accounts from database permanently?`)) {
                  selectedIds.forEach(id => onDeleteLead(id));
                  setSelectedLeads({});
                  alert(`Successfully deleted ${selectedIds.length} accounts.`);
                }
              }}
              className="px-4 py-2.5 bg-red-800 hover:bg-rose-900 border border-red-700/40 text-white rounded-sm font-mono text-[10px] uppercase tracking-wider cursor-pointer transition-all"
            >
              Deconstruct Selected
            </button>

            <button
              onClick={() => setSelectedLeads({})}
              className="px-3 py-2.5 hover:bg-white/10 text-gray-300 rounded-sm font-mono text-[9px] uppercase tracking-widest cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-primary/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="add-lead-modal">
          <div className="bg-bg-ivory border border-gold/30 max-w-lg w-full rounded-sm shadow-2xl p-7 relative space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-primary/10">
              <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Create Custom Export Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#05190F] opacity-60 hover:opacity-100 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-3 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                    placeholder="e.g. Hamburg Coffee Traders"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Country</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-2.5 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                  >
                    {[
                      'Germany', 'United States', 'United Kingdom', 'Japan', 'South Korea', 'Taiwan', 'Australia', 'Netherlands', 'France', 'Italy', 'Singapore', 'New Zealand'
                    ].map(co => (
                      <option key={co} value={co}>{co}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-white border border-primary/15 rounded-sm px-3 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                  placeholder="e.g. Hamburg or Tokyo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Public Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-3 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                    placeholder="e.g. buying@hamburgcoffee.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Website Domain</label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-3 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                    placeholder="e.g. https://www.domain.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-3 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                    placeholder="e.g. +49 40 12345"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Company LinkedIn</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-3 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Lead Category</label>
                  <select
                    value={leadType}
                    onChange={e => setLeadType(e.target.value)}
                    className="w-full bg-white border border-primary/15 rounded-sm px-2.5 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                  >
                    {['Green Coffee Importer', 'Specialty Coffee Importer', 'Coffee Roaster', 'Coffee Distributor', 'Coffee Trading Company', 'Private Label Coffee Brand'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Assigned Lead Score</label>
                  <select
                    value={leadScore}
                    onChange={e => setLeadScore(e.target.value as 'A' | 'B' | 'C')}
                    className="w-full bg-white border border-primary/15 rounded-sm px-2.5 py-2 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans"
                  >
                    <option value="A">Grade A (Priority Direct Importer)</option>
                    <option value="B">Grade B (Boutique Specialty Roaster)</option>
                    <option value="C">Grade C (Local Cafe / Retailer)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-primary uppercase tracking-wider text-[9px] font-bold block">Notes / Specialty Coffee Match Context</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-white border border-primary/15 rounded-sm p-3 focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary font-sans leading-relaxed"
                  placeholder="Describe coffee origin preferences (e.g. Sumatra Mandheling, Aceh Gayo Specialty, Flores Organic)..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-primary/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-primary/15 text-primary rounded-sm text-[10px] uppercase font-semibold cursor-pointer tracking-wider hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#05190F] hover:bg-neutral-900 border border-gold/40 text-gold hover:text-white rounded-sm text-[10px] uppercase font-bold cursor-pointer tracking-wider transition-all"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
