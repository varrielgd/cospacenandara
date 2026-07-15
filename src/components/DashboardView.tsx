import React, { useState, useEffect } from 'react';
import { Lead, Sample, Quotation, EmailLog } from '../types';
import { 
  Users, 
  Mail, 
  Beaker, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Award,
  Globe,
  Coffee,
  TrendingDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api } from '../utils/api';

interface DashboardViewProps {
  leads: Lead[];
  samples: Sample[];
  quotations: Quotation[];
  emails: EmailLog[];
  onNavigate: (tab: string) => void;
}

interface MarketPulse {
  arabicaPrice: number | null;
  arabicaChange: number | null;
  arabicaPricePerKg: number | null;
  estimatedFobSumatra: number | null;
  usdIdr: number | null;
  eurUsd: number | null;
  gbpUsd: number | null;
  jpyUsd: number | null;
  marketSentiment: string;
  fetchedAt: string;
}

export default function DashboardView({ leads, samples, quotations, emails, onNavigate }: DashboardViewProps) {
  const [market, setMarket] = useState<MarketPulse | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState(false);

  const fetchMarket = async (forceRefresh = false) => {
    setMarketLoading(true);
    setMarketError(false);
    try {
      const data = forceRefresh
        ? await api.post('/api/market/refresh', {})
        : await api.get('/api/market');
      
      const snap = forceRefresh ? (data as any).data ?? data : data;
      setMarket(snap as MarketPulse);
    } catch (err) {
      console.error('Market fetch error:', err);
      setMarketError(true);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);
  // Compute Metrics
  const totalLeads = leads.length;
  const aLeads = leads.filter(l => l.leadScore === 'A').length;
  const bLeads = leads.filter(l => l.leadScore === 'B').length;
  const cLeads = leads.filter(l => l.leadScore === 'C').length;
  
  const emailsSent = emails.length;
  
  // Count Replied leads
  const replies = leads.filter(l => l.status === 'Replied' || l.status === 'Sample Requested' || l.status === 'Sample Sent' || l.status === 'Negotiation' || l.status === 'Quotation Sent' || l.status === 'Order Confirmed' || l.status === 'Closed Won').length;
  
  const samplesSent = samples.filter(s => s.status === 'Shipped' || s.status === 'Delivered').length;
  
  const negotiations = leads.filter(l => l.status === 'Negotiation' || l.status === 'Quotation Sent').length;
  
  // Conversion Rate (Closed Won leads / Total leads)
  const closedWonCount = leads.filter(l => l.status === 'Closed Won' || l.status === 'Order Confirmed').length;
  const conversionRate = totalLeads > 0 ? (closedWonCount / totalLeads) * 100 : 0;

  // Chart 1: Leads by Country
  const countryCounts = leads.reduce((acc: { [key: string]: number }, lead) => {
    acc[lead.country] = (acc[lead.country] || 0) + 1;
    return acc;
  }, {});
  
  const countryData = Object.keys(countryCounts).map(country => ({
    name: country,
    leads: countryCounts[country]
  })).sort((a, b) => b.leads - a.leads).slice(0, 5);

  // Chart 2: Pipeline State Count
  const pipelineStates = [
    { name: 'New', count: leads.filter(l => l.status === 'New Lead').length },
    { name: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Engaged / Replied', count: leads.filter(l => l.status === 'Replied' || l.status === 'Sample Requested').length },
    { name: 'Samples', count: leads.filter(l => l.status === 'Sample Sent').length },
    { name: 'Negotiation', count: leads.filter(l => l.status === 'Negotiation' || l.status === 'Quotation Sent').length },
    { name: 'Closed Won', count: closedWonCount }
  ];

  // Lead Quality Pie Chart
  const scoreData = [
    { name: 'A Lead (High Potential)', value: aLeads, color: '#D4AF37' },
    { name: 'B Lead (Roaster/Medium)', value: bLeads, color: '#2C5E43' },
    { name: 'C Lead (Small Operation)', value: cLeads, color: '#6B8E23' }
  ].filter(item => item.value > 0);

  // Dynamic Sourcing Origin Interests based on Lead Matches!
  const originCounts = leads.reduce((acc: { [key: string]: number }, lead) => {
    const matched = lead.analysisMatch || '';
    matched.split(',').forEach(term => {
      const trimmed = term.trim();
      if (!trimmed) return;
      let key = 'Other';
      if (trimmed.toLowerCase().includes('gayo') && trimmed.toLowerCase().includes('natural')) {
        key = 'Gayo Wild Natural';
      } else if (trimmed.toLowerCase().includes('gayo')) {
        key = 'Aceh Gayo Grade 1';
      } else if (trimmed.toLowerCase().includes('toraja') || trimmed.toLowerCase().includes('sulawesi')) {
        key = 'Toraja Reserve';
      } else if (trimmed.toLowerCase().includes('flores') || trimmed.toLowerCase().includes('bajawa')) {
        key = 'Flores Volcanic';
      } else if (trimmed.toLowerCase().includes('java') || trimmed.toLowerCase().includes('preanger')) {
        key = 'Java Preanger';
      } else if (trimmed.toLowerCase().includes('lintong') || trimmed.toLowerCase().includes('mandheling')) {
        key = 'Sumatra Classical';
      } else if (trimmed.toLowerCase().includes('robusta') || trimmed.toLowerCase().includes('lampung')) {
        key = 'Fine Robusta';
      }
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {});

  const totalOriginHits = Object.values(originCounts).reduce((a, b) => a + b, 0);
  const originData = Object.keys(originCounts).map(name => {
    const hits = originCounts[name];
    const pct = totalOriginHits > 0 ? (hits / totalOriginHits) * 100 : 0;
    return { 
      name, 
      pct: Math.round(pct), 
      status: pct > 40 ? 'Critical Demand' : pct > 20 ? 'Increasing' : 'Steady' 
    };
  }).sort((a, b) => b.pct - a.pct);

  // Dynamic Recommended Actions Checklist
  const suggestedActions = leads.length === 0 ? [] : [
    { 
      title: "Discover partners in United States / Germany", 
      desc: "Nandara Gayo bean is in record demand. Search North American & European buyer lists.",
      actionLabel: "Find Importers",
      tab: "discovery"
    },
    { 
      title: "Active Sales Pipeline Checkup", 
      desc: `${leads.filter(l => l.status === 'New Lead').length} new leads discovered. Generate personalized emails.`,
      actionLabel: "Open Sales CRM",
      tab: "crm"
    },
    { 
      title: "Prepare pending coffee sample crates", 
      desc: `${samples.filter(s => s.status === 'Preparing').length} sample packages currently being processed in warehouse.`,
      actionLabel: "Track Samples",
      tab: "samples"
    },
  ];

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Brand Hero Cover */}
      <div className="p-8 sm:p-12 rounded-lg bg-primary border border-gold/30 relative overflow-hidden text-white" id="brand-welcome-hero">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 text-gold rounded-sm text-[10px] font-mono uppercase tracking-widest">
            Nandara Nusa Montierra
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium tracking-wide text-white leading-tight">
            Coffee Importer <span className="text-gold italic">Intelligence</span> System
          </h1>
          <p className="text-gray-300 text-sm font-light leading-relaxed">
            Empowering the direct global export of Indonesian Specialty Green Coffee. Track international green importers, extract targeted business emails, grade leads, and automate sample distribution.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[9px] text-[#D4AF37] font-mono tracking-wider uppercase">
            <span className="bg-white/5 border border-gold/10 px-2.5 py-1 rounded-sm">Aceh Gayo G1</span>
            <span className="bg-white/5 border border-gold/10 px-2.5 py-1 rounded-sm">Gayo Wild Natural</span>
            <span className="bg-white/5 border border-gold/10 px-2.5 py-1 rounded-sm">Toraja Specialty</span>
            <span className="bg-white/5 border border-gold/10 px-2.5 py-1 rounded-sm">Flores Bajawa</span>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-grid">
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex items-center gap-4 transition-all hover:shadow-luxury-hover">
          <div className="p-3 bg-primary/5 text-primary rounded-sm">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest">Total Leads</p>
            <h3 className="text-3xl font-serif font-medium text-primary mt-1">{totalLeads}</h3>
            <div className="flex gap-1.5 mt-1.5 text-[9px] text-[#D4AF37] font-mono uppercase tracking-wider">
              <span>★ A-LEADS: {aLeads}</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex items-center gap-4 transition-all hover:shadow-luxury-hover">
          <div className="p-3 bg-primary/5 text-primary rounded-sm">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest">Outreach Emails</p>
            <h3 className="text-3xl font-serif font-medium text-primary mt-1">{emailsSent}</h3>
            <p className="text-[9px] text-emerald-800 font-mono tracking-wide uppercase mt-1.5">✓ Replies: {replies}</p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex items-center gap-4 transition-all hover:shadow-luxury-hover">
          <div className="p-3 bg-primary/5 text-primary rounded-sm">
            <Beaker className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest">Samples Sent</p>
            <h3 className="text-3xl font-serif font-medium text-primary mt-1">{samplesSent}</h3>
            <p className="text-[9px] text-text-dim font-mono uppercase mt-1.5">Prep: {samples.filter(s => s.status === 'Preparing').length}</p>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex items-center gap-4 transition-all hover:shadow-luxury-hover">
          <div className="p-3 bg-primary/5 text-primary rounded-sm">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest">Conversion Rate</p>
            <h3 className="text-3xl font-serif font-medium text-primary mt-1">
              {conversionRate.toFixed(1)}%
            </h3>
            <p className="text-[9px] text-[#D4AF37] font-mono uppercase mt-1.5">Confirmed: {closedWonCount}</p>
          </div>
        </div>
      </div>

      {/* Advanced Analytic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-and-actions">
        {/* Chart 1: Pipeline Breakdown (Large Grid) */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xs font-semibold tracking-widest text-primary uppercase font-mono">Export Pipeline Funnel</h3>
              <p className="text-xs text-text-dim font-sans mt-0.5">Sales cycle progression of international prospects</p>
            </div>
            <span className="p-1 px-2.5 text-[9px] bg-primary/5 text-primary rounded-sm border border-primary/10 font-mono uppercase tracking-widest">Live Sync</span>
          </div>

          <div className="h-64 mt-4" id="pipeline-bar-chart">
            {leads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Layers className="w-10 h-10 stroke-1 mb-2 text-gray-300" />
                <p className="text-xs">No active pipeline data available.</p>
                <button 
                  onClick={() => onNavigate('discovery')}
                  className="mt-3 text-xs text-gold underline font-mono hover:text-primary tracking-wider uppercase"
                >
                  Discover Leads
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineStates} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#05190F', border: '1px solid #D4AF37', borderRadius: '4px' }}
                    labelStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '11px', fontFamily: 'serif' }}
                    itemStyle={{ color: '#FFF', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#05190F" radius={[2, 2, 0, 0]}>
                    {pipelineStates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? '#D4AF37' : '#05190F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Lead Grades & Breakdown */}
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-xs font-semibold tracking-widest text-[#05190F] uppercase font-mono">Lead Quality Scores</h3>
            <p className="text-xs text-text-dim mt-0.5 font-sans">Structured automatic grading distribution</p>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            {leads.length === 0 ? (
              <p className="text-xs text-gray-400 font-mono">Scout leads to process grades</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#05190F', border: '1px solid #D4AF37', borderRadius: '4px' }}
                    itemStyle={{ color: '#FFF', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-serif font-medium text-primary">{aLeads}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#4A5568] font-mono mt-0.5">A-Grade</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-[11px] items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span className="text-gray-600 font-mono">A Leads (Micro-lot Importers)</span>
              </div>
              <span className="font-bold text-[#05190F]">{aLeads}</span>
            </div>
            <div className="flex justify-between text-[11px] items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#05190F]" />
                <span className="text-gray-600 font-mono">B Leads (Specialty Roasters)</span>
              </div>
              <span className="font-bold text-[#05190F]">{bLeads}</span>
            </div>
            <div className="flex justify-between text-[11px] items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6B8E23]" />
                <span className="text-gray-600 font-mono">C Leads (Smaller Shops)</span>
              </div>
              <span className="font-bold text-[#05190F]">{cLeads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Origin Distribution & Strategic Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="origin-and-intelligence">
        {/* Origin Target Match Analysis (Product focus) */}
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury">
          <h3 className="text-xs font-semibold tracking-widest text-[#05190F] uppercase font-mono mb-1">Origin Market Interest</h3>
          <p className="text-xs text-text-dim mb-6 font-sans">Indonesian Specialty demand analytics</p>
          
          <div className="space-y-4">
            {originData.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 font-mono">
                No market interest logs yet. Connect real leads to calculate origin trends.
              </div>
            ) : (
              originData.map((ori) => (
                <div key={ori.name}>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-gray-700 mb-1">
                    <span>{ori.name}</span>
                    <span className={ori.status === 'Critical Demand' ? 'text-gold font-bold' : ori.status === 'Increasing' ? 'text-primary' : 'text-gray-400'}>{ori.status}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${ori.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Global Hub Target List */}
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury">
          <h3 className="text-xs font-semibold tracking-widest text-[#05190F] uppercase font-mono mb-1">Top Country Targets</h3>
          <p className="text-xs text-text-dim mb-6 font-sans">Active target geographies in pipeline</p>

          <div className="divide-y divide-gray-100">
            {countryData.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 font-mono">
                No active country prospects logged.
              </div>
            ) : (
              countryData.map((co, index) => (
                <div key={co.name} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center font-bold text-[#05190F] font-mono text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-800 font-sans">{co.name}</span>
                  </div>
                  <span className="font-mono bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-sm text-[10px]">
                    {co.leads} leads
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nandara Export Suggested Actions / Workspace Control */}
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-[#05190F] uppercase font-mono mb-1">Recommended Actions</h3>
            <p className="text-xs text-text-dim mb-4 font-sans">Intelligent suggestions for global growth</p>
            
            <div className="space-y-3">
              {suggestedActions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-mono">
                  No active recommendations yet. Scout importers or add a lead manually to begin.
                </div>
              ) : (
                suggestedActions.map((act, idx) => (
                  <div key={idx} className="p-3 bg-bg-ivory/60 border border-primary/5 rounded-sm space-y-1">
                    <p className="text-xs font-semibold text-primary font-sans leading-tight">{act.title}</p>
                    <p className="text-[10px] text-text-dim font-sans leading-tight">{act.desc}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('discovery')}
            className="w-full mt-5 py-2.5 bg-primary hover:bg-neutral-950 text-white hover:text-gold text-[10px] font-mono uppercase tracking-widest rounded-sm border border-gold/40 transition-all cursor-pointer font-bold"
          >
            Launch Importer Discovery
          </button>
        </div>

        {/* Market Pulse Widget */}
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center mb-6 border-b border-primary/5 pb-4">
            <div>
              <h2 className="text-xl font-serif font-medium text-primary flex items-center gap-2">
                <Globe className="w-5 h-5 text-gold" />
                Market Pulse
              </h2>
              <p className="text-[10px] font-sans text-text-dim mt-1 uppercase tracking-widest">Real-time Coffee & FX</p>
            </div>
            <button 
              onClick={() => fetchMarket(true)} 
              disabled={marketLoading}
              className="p-1.5 hover:bg-bg-ivory rounded-sm text-text-dim hover:text-primary transition-colors disabled:opacity-50"
              title="Force Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${marketLoading ? 'animate-spin text-gold' : ''}`} />
            </button>
          </div>

          {marketLoading && !market ? (
            <div className="py-12 text-center text-text-dim text-sm font-mono flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-gold" />
              Syncing Market Data...
            </div>
          ) : marketError ? (
            <div className="py-8 text-center text-red-800 text-sm font-mono flex flex-col items-center gap-3 bg-red-50 rounded-sm">
              <AlertCircle className="w-6 h-6" />
              Unable to fetch market data.
              <button onClick={() => fetchMarket()} className="underline text-xs mt-2">Try Again</button>
            </div>
          ) : market ? (
            <div className="space-y-5">
              {/* Arabica Block */}
              <div className="p-4 bg-bg-ivory/60 border border-primary/5 rounded-sm">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest font-semibold">Arabica C-Futures (NYSE)</p>
                  {market.arabicaChange !== null && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm flex items-center gap-1 ${market.arabicaChange > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {market.arabicaChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(market.arabicaChange)}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-serif text-primary">${market.arabicaPrice || '--'}</h3>
                  <span className="text-xs text-text-dim">/ lb</span>
                </div>
                <p className="text-[10px] text-text-dim font-mono mt-2">Est. Spot FOB Sumatra: <span className="text-gold font-bold">~${market.estimatedFobSumatra || '--'}/kg</span></p>
              </div>

              {/* FX Block */}
              <div className="p-4 bg-bg-ivory/60 border border-primary/5 rounded-sm">
                <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest font-semibold mb-3">Live Exchange Rates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] text-text-dim font-mono mb-1">USD/IDR</p>
                    <p className="text-sm font-semibold text-primary">{market.usdIdr?.toLocaleString('id-ID') || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-text-dim font-mono mb-1">EUR/USD</p>
                    <p className="text-sm font-semibold text-primary">{market.eurUsd || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-text-dim font-mono mb-1">GBP/USD</p>
                    <p className="text-sm font-semibold text-primary">{market.gbpUsd || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-text-dim font-mono mb-1">USD/JPY</p>
                    <p className="text-sm font-semibold text-primary">{market.jpyUsd || '--'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono pt-2">
                <span>Sentiment: <span className={market.marketSentiment === 'Bullish' ? 'text-emerald-600' : market.marketSentiment === 'Bearish' ? 'text-red-600' : ''}>{market.marketSentiment}</span></span>
                <span>Updated: {new Date(market.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
