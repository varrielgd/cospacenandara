import React, { useState } from 'react';
import { Sample, Lead } from '../types';

interface SampleViewProps {
  samples: Sample[];
  leads: Lead[];
  onAddSample: (sample: Omit<Sample, 'id' | 'sampleRequestDate'>) => void;
  onUpdateSampleStatus: (sampleId: string, status: Sample['status'], trackingNumber?: string) => void;
}

export default function SampleView({ samples, leads, onAddSample, onUpdateSampleStatus }: SampleViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [product, setProduct] = useState('Aceh Gayo Grade 1');
  const [weight, setWeight] = useState('500g');
  const [courier, setCourier] = useState('DHL Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [status, setStatus] = useState<'Preparing' | 'Shipped' | 'Delivered'>('Preparing');
  const [destinationCountry, setDestinationCountry] = useState('Germany');
  const [moistureReading, setMoistureReading] = useState(11.5);

  const productsList = [
    'Aceh Gayo Grade 1 (Classic)',
    'Sumatra Lintong G1 (Classic)',
    'Sumatra Mandheling Double Picked (Classic)',
    'Gayo Wild Natural (Modern Process)',
    'Java Preanger Reserve (Modern Process)',
    'Bali Kintamani (Modern Process)',
    'Flores Volcanic (Modern Process)',
    'Toraja Reserve (Modern Process)',
    'Gayo LB Reserve (Rare Microlot)',
    'Lampung Reserve (Fine Robusta)',
    'Temanggung Fine Robusta (Fine Robusta)'
  ];

  const courierList = [
    'DHL Express',
    'FedEx Priority',
    'TNT Worldwide',
    'USPS First-Class International',
    'Singapore Post'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    onAddSample({
      leadId,
      product,
      weight,
      courier,
      trackingNumber,
      status,
      destinationCountry,
      moistureReading
    });

    // Reset
    setShowAddForm(false);
    setTrackingNumber('');
  };

  const getStatusColor = (st: Sample['status']) => {
    switch(st) {
      case 'Preparing': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Shipped': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Delivered': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (st: Sample['status']) => {
    switch(st) {
      case 'Preparing': return ;
      case 'Shipped': return ;
      case 'Delivered': return ;
      default: return ;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="sample-root">
      {/* Left Column: Register Dispatch Sample */}
      <div className="lg:col-span-1 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-4 h-fit" id="register-dispatch">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-primary text-gold rounded-sm">
            
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Sample Dispatcher</h3>
            <p className="text-xs text-text-dim mt-0.5 font-sans">Track and dispatch premium physical micro-lot samples</p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="p-4 bg-[#F6F2E8] border border-primary/10 text-primary text-xs rounded-sm font-sans italic leading-relaxed">
            Please register leads in the CRM registry before dispatching premium physical micro-lot samples.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Target Importer Lead</label>
              <select
                required
                value={leadId}
                onChange={e => {
                  setLeadId(e.target.value);
                  const selected = leads.find(l => l.id === e.target.value);
                  if (selected) {
                    setDestinationCountry(selected.country);
                  }
                }}
                className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
              >
                <option value="">Select Importer...</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.companyName} ({lead.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Sample Product</label>
                <select
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                >
                  {productsList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Weight Netto</label>
                <select
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                >
                  {['200g', '500g', '1kg', '2kg', '3kg (Standard Lot)'].map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Cargo Courier</label>
                <select
                  value={courier}
                  onChange={e => setCourier(e.target.value)}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                >
                  {courierList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Destination</label>
                <input
                  type="text"
                  required
                  value={destinationCountry}
                  onChange={e => setDestinationCountry(e.target.value)}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                  placeholder="Germany"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Tracking AWB ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. DHL-549102-AWB"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block flex justify-between items-center">
                  <span>Moisture (%)</span>
                  {moistureReading > 12.5 && <span className="text-red-500 font-bold">⚠️ HIGH</span>}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={moistureReading}
                  onChange={e => setMoistureReading(parseFloat(e.target.value))}
                  className={`w-full bg-bg-ivory/40 border rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans ${moistureReading > 12.5 ? 'border-red-500 bg-red-50' : 'border-primary/20'}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
              >
                <option value="Preparing">Preparing Box (Milled & Sealed)</option>
                <option value="Shipped">Shipped In-Transit</option>
                <option value="Delivered">Delivered (Awaiting Cupping Feed)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!leadId}
              className="w-full py-3 bg-primary text-white hover:bg-neutral-950 hover:text-gold border border-gold/45 text-xs font-mono uppercase tracking-widest rounded-sm transition-all cursor-pointer font-bold select-none disabled:opacity-40"
            >
              Log Sample Cravings
            </button>
          </form>
        )}
      </div>

      {/* Right Column: Track & Trace Ledger */}
      <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex flex-col justify-between" id="track-trace-ledger">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Sample Crate Ledger</h3>
              <p className="text-xs text-text-dim mt-0.5 font-sans">Meticulous shipping details for active exporter credentials</p>
            </div>
            <span className="text-[10px] bg-bg-ivory text-primary rounded-sm border border-primary/10 px-3 py-1 font-mono uppercase tracking-wider font-semibold">
              Total Dispatches: {samples.length} units
            </span>
          </div>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {samples.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-primary/10 rounded-sm text-primary/30">
                
                <p className="text-xs font-mono uppercase tracking-widest">No physical coffee samples dispatched yet</p>
              </div>
            ) : (
              samples.slice().reverse().map((sample) => {
                const associatedLead = leads.find(l => l.id === sample.leadId);
                return (
                  <div 
                    key={sample.id}
                    className="p-5 bg-white border border-primary/5 rounded-lg text-xs font-mono space-y-3.5 relative group hover:border-[#D4AF37] transition-colors shadow-luxury hover:shadow-luxury-hover"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-serif font-medium text-[#05190F] tracking-wide">
                          {associatedLead ? associatedLead.companyName : "Unknown Importer"}
                        </h4>
                        <p className="text-[10px] text-text-dim flex items-center gap-1 font-mono mt-0.5 uppercase tracking-wider">
                          
                          Destination: {sample.destinationCountry}
                        </p>
                      </div>

                      <div className={`p-1.5 px-2.5 border rounded-sm flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider font-mono ${getStatusColor(sample.status)}`}>
                        {getStatusIcon(sample.status)}
                        <span>{sample.status}</span>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100 text-[11px] text-gray-600">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block">Indonesian Micro-Lot</span>
                        <span className="font-bold text-primary font-sans text-xs">{sample.product}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block">Netto / Courier</span>
                        <span className="text-primary font-bold font-sans text-xs">
                          {sample.weight} via {sample.courier}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block">Moisture</span>
                        <span className={`font-bold font-sans text-xs ${sample.moistureReading && sample.moistureReading > 12.5 ? 'text-red-600' : 'text-primary'}`}>
                          {sample.moistureReading ? `${sample.moistureReading.toFixed(1)}%` : '11.0% (Est)'}
                        </span>
                      </div>
                    </div>

                    {/* Mold Risk Alert */}
                    {sample.moistureReading && sample.moistureReading > 12.5 && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                        
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest font-mono">High Moisture Alert</p>
                          <p className="text-[11px] font-sans leading-tight">Reading of {sample.moistureReading}% exceeds 12.5% threshold. High risk of mold growth during transit.</p>
                        </div>
                      </div>
                    )}

                    {/* Tracking Actions */}
                    <div className="flex justify-between items-center pt-3 text-[10px] text-text-dim">
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider">
                        
                        Dispatched: {sample.sampleRequestDate}
                      </span>

                      {sample.trackingNumber ? (
                        <span className="font-bold bg-bg-ivory/50 px-2.5 py-0.5 border border-primary/10 rounded-sm text-primary">
                          AWB: {sample.trackingNumber}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            placeholder="Add tracking AWB..."
                            className="bg-bg-ivory border border-primary/20 rounded-sm px-2 py-1 text-[9px] focus:ring-1 focus:ring-gold focus:border-gold outline-hidden text-primary"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  onUpdateSampleStatus(sample.id, sample.status, val);
                                }
                              }
                            }}
                          />
                          <span className="text-[8px] text-primary/40 uppercase font-bold tracking-wider">Press Enter</span>
                        </div>
                      )}
                    </div>

                    {/* Status Update Quick Toggles to walk states */}
                    <div className="pt-2 border-t border-gray-200/50 flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                      {sample.status === 'Preparing' && (
                        <button
                          onClick={() => onUpdateSampleStatus(sample.id, 'Shipped')}
                          className="px-3 py-1.5 bg-primary text-[#D4AF37] hover:bg-neutral-950 hover:text-white rounded-sm border border-gold/30 text-[9px] uppercase tracking-widest cursor-pointer font-bold transition-all"
                        >
                          Mark Shipped ✈
                        </button>
                      )}
                      {sample.status === 'Shipped' && (
                        <button
                          onClick={() => onUpdateSampleStatus(sample.id, 'Delivered')}
                          className="px-3 py-1.5 bg-gold text-[#05190F] hover:bg-emerald-800 hover:bg-white rounded-sm text-[9px] uppercase tracking-widest cursor-pointer font-bold transition-all"
                        >
                          Mark Delivered ✓
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
