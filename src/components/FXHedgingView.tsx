import React, { useState, useEffect } from 'react';
import { Quotation, Lead } from '../types';
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { api } from '../utils/api';

interface FXHedgingViewProps {
  quotations: Quotation[];
  leads: Lead[];
}

export default function FXHedgingView({ quotations, leads }: FXHedgingViewProps) {
  const [usdIdr, setUsdIdr] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/market') as any;
      if (data && data.usdIdr) {
        setUsdIdr(data.usdIdr);
      }
    } catch (err) {
      console.error('Failed to fetch FX rates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  // Filter outstanding quotations (Draft or Sent)
  const outstandingQuotes = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent');
  
  // Calculate total exposure
  const totalUsdExposure = outstandingQuotes.reduce((sum, q) => {
    if (q.currency === 'USD') {
      // Parse quantity (e.g. "19.2 Metric Tons (1 Container)" -> 19.2 * 1000 = 19200 kg or treat price as per MT)
      // Assuming price is per MT and quantity has "Metric Tons" or similar.
      // Let's use a simpler heuristic for the UI: Price * (ParseFloat(quantity) or 1)
      const qtyNum = parseFloat(q.quantity) || 1;
      return sum + (q.price * qtyNum);
    }
    return sum;
  }, 0);

  const totalIdrEst = usdIdr ? totalUsdExposure * usdIdr : 0;
  // Hedging Warning Threshold: e.g., if IDR is very strong (below 15,500), exporter receives less Rupiah
  const isHighRisk = usdIdr !== null && usdIdr < 15500;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-gold rounded-sm">
            <ShieldAlert className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">FX & Hedging Desk</h3>
            <p className="text-xs text-text-dim mt-0.5 font-sans">Monitor export currency exposure and manage exchange rate risks</p>
          </div>
        </div>
        <button 
          onClick={fetchMarket}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-primary/20 text-xs font-mono uppercase text-primary hover:bg-bg-ivory transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gold' : ''}`} />
          Refresh Rates
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury">
            <p className="text-[10px] font-sans text-text-dim uppercase tracking-widest mb-1">Live USD/IDR Rate</p>
            <h3 className="text-3xl font-serif text-primary">
              {loading ? '--' : usdIdr ? `Rp ${usdIdr.toLocaleString('id-ID')}` : 'Unavailable'}
            </h3>
            {isHighRisk && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-sm flex gap-2 text-red-800 text-xs font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>IDR is strengthening. Warning: Potential loss of revenue upon USD conversion. Consider locking forward rates.</p>
              </div>
            )}
            {!isHighRisk && usdIdr && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex gap-2 text-emerald-800 text-xs font-sans">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <p>Favorable exchange rate for exporters. Conversion yields optimal margins.</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-lg bg-primary text-white border border-gold/30 shadow-luxury relative overflow-hidden">
             <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent pointer-events-none" />
            <p className="text-[10px] font-sans text-gray-300 uppercase tracking-widest mb-1">Total Outstanding USD Exposure</p>
            <h3 className="text-3xl font-serif text-gold">
              ${totalUsdExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-2">
              ≈ Rp {totalIdrEst.toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Exposure Table */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury">
          <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono mb-4">Pipeline Contracts Exposure</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-mono tracking-wider text-text-dim">
                  <th className="pb-3 px-2 font-medium">Quote ID</th>
                  <th className="pb-3 px-2 font-medium">Importer</th>
                  <th className="pb-3 px-2 font-medium">Date</th>
                  <th className="pb-3 px-2 font-medium">Status</th>
                  <th className="pb-3 px-2 font-medium text-right">USD Value</th>
                </tr>
              </thead>
              <tbody className="text-xs font-sans">
                {outstandingQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 italic font-mono">
                      No outstanding USD quotations found.
                    </td>
                  </tr>
                ) : (
                  outstandingQuotes.map((q) => {
                    const lead = leads.find(l => l.id === q.leadId);
                    const qtyNum = parseFloat(q.quantity) || 1;
                    const value = q.price * qtyNum;
                    
                    return (
                      <tr key={q.quoteNumber} className="border-b border-gray-50 hover:bg-bg-ivory/30 transition-colors">
                        <td className="py-3 px-2 font-mono text-primary">{q.quoteNumber}</td>
                        <td className="py-3 px-2 text-gray-800">{lead?.companyName || 'Unknown'}</td>
                        <td className="py-3 px-2 text-text-dim">{new Date(q.dateCreated).toLocaleDateString('en-GB')}</td>
                        <td className="py-3 px-2">
                          <span className="px-2.5 py-1 bg-yellow-50 text-yellow-800 rounded-sm text-[10px] font-mono uppercase tracking-wider border border-yellow-200">
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-medium text-primary">
                          ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
