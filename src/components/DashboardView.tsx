import React, { useState, useEffect } from 'react';
import { Lead, Sample, Quotation, EmailLog } from '../types';

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
      {/* Brand Hero */}
      <div className="p-8 sm:p-10 rounded-lg bg-[#05190F] relative overflow-hidden text-white" id="brand-welcome-hero">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center px-2.5 py-1 bg-white/10 border border-white/20 text-white/70 rounded-md text-[9px] font-mono uppercase tracking-widest">
            Nandara Nusa Montierra
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Coffee Importer <span className="text-white/60">Intelligence</span> System
          </h1>
          <p className="text-white/60 text-sm font-light leading-relaxed">
            Empowering the direct global export of Indonesian Specialty Green Coffee. Track international green importers, extract targeted business emails, grade leads, and automate sample distribution.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[9px] text-white/50 font-mono tracking-wider uppercase">
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Aceh Gayo G1</span>
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Gayo Wild Natural</span>
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Toraja Specialty</span>
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">Flores Bajawa</span>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
          <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold">Total Leads</p>
          <h3 className="text-4xl font-bold text-[#05190F] mt-2">{totalLeads}</h3>
          <div className="mt-2 text-[9px] text-[#05190F]/50 font-mono uppercase tracking-wider">
            A-LEADS: {aLeads}
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
          <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold">Outreach Emails</p>
          <h3 className="text-4xl font-bold text-[#05190F] mt-2">{emailsSent}</h3>
          <p className="text-[9px] text-emerald-600 font-mono tracking-wide uppercase mt-2">Replies: {replies}</p>
        </div>

        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
          <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold">Samples Sent</p>
          <h3 className="text-4xl font-bold text-[#05190F] mt-2">{samplesSent}</h3>
          <p className="text-[9px] text-gray-400 font-mono uppercase mt-2">Prep: {samples.filter(s => s.status === 'Preparing').length}</p>
        </div>

        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all">
          <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold">Conversion Rate</p>
          <h3 className="text-4xl font-bold text-[#05190F] mt-2">
            {conversionRate.toFixed(1)}%
          </h3>
          <p className="text-[9px] text-gray-400 font-mono uppercase mt-2">Confirmed: {closedWonCount}</p>
        </div>
      </div>

      {/* Analytic Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="charts-and-actions">
        {/* Chart 1: Pipeline Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)]">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#05190F] uppercase">Export Pipeline Funnel</h3>
              <p className="text-xs text-gray-400 font-sans mt-0.5">Sales cycle progression of international prospects</p>
            </div>
            <span className="p-1 px-2.5 text-[9px] bg-[#05190F]/5 text-[#05190F] rounded-md border border-[#05190F]/10 font-mono uppercase tracking-widest">Live</span>
          </div>

          <div className="h-64 mt-4" id="pipeline-bar-chart">
            {leads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-xs">No active pipeline data available.</p>
                <button 
                  onClick={() => onNavigate('discovery')}
                  className="mt-3 text-xs text-[#05190F] underline font-mono hover:opacity-70 tracking-wider uppercase"
                >
                  Discover Leads
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineStates} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }} />
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

        {/* Chart 2: Lead Grades */}
        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)]">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-xs font-bold tracking-widest text-[#05190F] uppercase">Lead Quality Scores</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">Automatic grading distribution</p>
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
                  <Tooltip contentStyle={{ fontSize: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[#05190F]">{aLeads}</span>
              <span className="text-[8px] uppercase tracking-widest text-gray-400 font-mono mt-0.5">A-Grade</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-[11px] items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#05190F]" />
                <span className="text-gray-500 font-mono">A Leads</span>
              </div>
              <span className="font-bold text-[#05190F]">{aLeads}</span>
            </div>
            <div className="flex justify-between text-[11px] items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2C5E43]" />
                <span className="text-gray-500 font-mono">B Leads</span>
              </div>
              <span className="font-bold text-[#05190F]">{bLeads}</span>
            </div>
            <div className="flex justify-between text-[11px] items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6B8E23]" />
                <span className="text-gray-500 font-mono">C Leads</span>
              </div>
              <span className="font-bold text-[#05190F]">{cLeads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Origin Distribution & Strategic Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="origin-and-intelligence">
        {/* Origin Target Match Analysis */}
        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)]">
          <h3 className="text-xs font-bold tracking-widest text-[#05190F] uppercase mb-1">Origin Market Interest</h3>
          <p className="text-xs text-gray-400 mb-6 font-sans">Indonesian Specialty demand analytics</p>
          
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
        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)]">
          <h3 className="text-xs font-bold tracking-widest text-[#05190F] uppercase mb-1">Top Country Targets</h3>
          <p className="text-xs text-gray-400 mb-6 font-sans">Active target geographies in pipeline</p>

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

        {/* Recommended Actions */}
        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-widest text-[#05190F] uppercase mb-1">Recommended Actions</h3>
            <p className="text-xs text-gray-400 mb-4 font-sans">Strategic suggestions for growth</p>
            
            <div className="space-y-3">
              {suggestedActions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-mono">
                  No active recommendations yet. Scout importers or add a lead manually to begin.
                </div>
              ) : (
                suggestedActions.map((act, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-md space-y-1">
                  <p className="text-xs font-semibold text-[#05190F] font-sans leading-tight">{act.title}</p>
                  <p className="text-[10px] text-gray-400 font-sans leading-tight">{act.desc}</p>
                </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('discovery')}
            className="w-full mt-5 py-2.5 bg-[#05190F] hover:bg-[#0a2e1a] text-white text-[11px] font-bold uppercase tracking-widest rounded-md border border-[#05190F] transition-all cursor-pointer"
          >
            Launch Discovery
          </button>
        </div>

        {/* Market Pulse Widget */}
        <div className="p-6 rounded-lg bg-white border border-gray-100 shadow-[var(--shadow-card)] col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#05190F]">
                Market Pulse
              </h2>
              <p className="text-[10px] font-sans text-gray-400 mt-1 uppercase tracking-widest">Real-time Coffee & FX</p>
            </div>
            <button 
              onClick={() => fetchMarket(true)} 
              disabled={marketLoading}
              className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 hover:text-[#05190F] transition-colors disabled:opacity-50"
              title="Force Refresh Data"
            >
              Refresh
            </button>
          </div>

          {marketLoading && !market ? (
            <div className="py-12 text-center text-gray-400 text-sm font-mono flex flex-col items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#05190F] border-t-transparent rounded-full animate-spin" />
              Syncing Market Data...
            </div>
          ) : marketError ? (
            <div className="py-8 text-center text-red-700 text-sm font-mono flex flex-col items-center gap-3 bg-red-50 rounded-md">
              Market data unavailable.
              <button onClick={() => fetchMarket()} className="underline text-xs mt-2">Try Again</button>
            </div>
          ) : market ? (
            <div className="space-y-5">
              {/* Arabica Block */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold">Arabica C-Futures (NYSE)</p>
                  {market.arabicaChange !== null && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      market.arabicaChange > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {market.arabicaChange > 0 ? '▲' : '▼'} {Math.abs(market.arabicaChange)}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-[#05190F]">${market.arabicaPrice || '--'}</h3>
                  <span className="text-xs text-gray-400">/ lb</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono mt-2">Est. FOB Sumatra: <span className="text-[#05190F] font-bold">~${market.estimatedFobSumatra || '--'}/kg</span></p>
              </div>

              {/* FX Block */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-md">
                <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold mb-3">Live Exchange Rates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] text-gray-400 font-mono mb-1">USD/IDR</p>
                    <p className="text-sm font-bold text-[#05190F]">{market.usdIdr?.toLocaleString('id-ID') || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-mono mb-1">EUR/USD</p>
                    <p className="text-sm font-bold text-[#05190F]">{market.eurUsd || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-mono mb-1">GBP/USD</p>
                    <p className="text-sm font-bold text-[#05190F]">{market.gbpUsd || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-mono mb-1">USD/JPY</p>
                    <p className="text-sm font-bold text-[#05190F]">{market.jpyUsd || '--'}</p>
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
