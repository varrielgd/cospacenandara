import React, { useState } from 'react';
import { Quotation, Lead } from '../types';
import { 
  FileText, 
  MapPin, 
  Printer, 
  DollarSign, 
  Layers, 
  Coffee, 
  RotateCcw,
  Check,
  Award,
  Globe2,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../utils/api';

interface QuotationViewProps {
  quotations: Quotation[];
  leads: Lead[];
  onAddQuotation: (quote: Omit<Quotation, 'quoteNumber' | 'dateCreated'>) => void;
  onUpdateQuotationStatus: (number: string, status: Quotation['status']) => void;
}

export default function QuotationView({ quotations, leads, onAddQuotation, onUpdateQuotationStatus }: QuotationViewProps) {
  const [activeLeadId, setActiveLeadId] = useState('');
  const [buyerName, setBuyerName] = useState('Procurement Manager');
  const [product, setProduct] = useState('Aceh Gayo Grade 1 (Classic)');
  const [quantity, setQuantity] = useState('19.2 Metric Tons (1 Full Container Load)');
  const [price, setPrice] = useState(6800.00); // e.g. Price per Metric Ton
  const [incoterm, setIncoterm] = useState('FOB Belawan Port, Sumatra');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  
  // Phase 3: Dynamic Pricing state
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState('');

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

  const incotermList = [
    'FOB Belawan Port (Sumatra)',
    'FOB Tanjung Priok Port (Java)',
    'CIF Hamburg Port (Europe)',
    'CIF Seattle Port (USA)',
    'CIF Tokyo Port (Japan)',
    'CIF Sydney Port (Australia)'
  ];

  const activeLead = leads.find(l => l.id === activeLeadId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadId) return;

    onAddQuotation({
      leadId: activeLeadId,
      product,
      quantity,
      price,
      incoterm,
      status: 'Draft'
    });

    alert("Quotation generated successfully. Access and print the ledger layout below!");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSuggestPrice = async () => {
    setIsSuggesting(true);
    setSuggestMessage('');
    try {
      const response = await api.post('/api/quotations/suggest-price', {
        product,
        incoterm
      });
      // The API returns price per KG. We need Price per Metric Ton (x 1000)
      const data = response as any;
      const suggestedPricePerMT = data.suggestedPrice * 1000;
      setPrice(suggestedPricePerMT);
      setSuggestMessage(data.message);
    } catch (error) {
      setSuggestMessage('Failed to fetch live market data.');
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="quotation-root">
      {/* Print styles override sheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
            background-color: white !important;
            color: black !important;
          }
          #quotation-print-area, #quotation-print-area * {
            visibility: visible;
          }
          #quotation-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 40px !important;
          }
        }
      `}} />

      {/* Left Column: Register Quotation Input */}
      <div className="lg:col-span-1 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-4 print:hidden h-fit">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="p-2.5 bg-primary text-gold rounded-sm">
            <FileText className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Invoice Generator</h3>
            <p className="text-xs text-text-dim mt-0.5 font-sans">Formulate formal Export Proformas</p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="p-4 bg-[#F6F2E8] border border-primary/10 rounded-sm text-xs font-sans text-primary italic leading-relaxed">
            Please register leads in the CRM registry before building premium export proformas.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Target Importer Lead</label>
              <select
                required
                value={activeLeadId}
                onChange={e => {
                  setActiveLeadId(e.target.value);
                  const selected = leads.find(l => l.id === e.target.value);
                  if (selected) {
                    setBuyerName("Procurement Director");
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

            <div className="space-y-1.5">
              <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Buyer Attn. Representative</label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Specialty Coffee Product</label>
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
              <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Consignment Quantity</label>
              <input
                type="text"
                required
                placeholder="e.g. 19.2 Metric Tons (1 Container)"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Price (USD / Ton)</label>
                  <button 
                    type="button" 
                    onClick={handleSuggestPrice}
                    disabled={isSuggesting}
                    className="text-[9px] flex items-center gap-1 text-gold hover:text-yellow-600 uppercase font-bold tracking-widest disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isSuggesting ? 'Calculating...' : 'AI Suggest Price'}
                  </button>
                </div>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                />
                {suggestMessage && (
                  <p className="text-[9px] font-sans text-emerald-700 flex items-start gap-1 mt-1 leading-tight">
                    <Info className="w-3 h-3 shrink-0" />
                    {suggestMessage}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Incoterm Terms</label>
                <select
                  value={incoterm}
                  onChange={e => setIncoterm(e.target.value)}
                  className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
                >
                  {incotermList.map(inco => (
                    <option key={inco} value={inco}>{inco}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary text-white hover:bg-neutral-950 hover:text-gold border border-gold/45 text-xs font-mono uppercase tracking-widest rounded-sm font-bold cursor-pointer transition-all"
            >
              Issue New Quotation
            </button>
          </form>
        )}
      </div>

      {/* Right Column: Ledger List & Detailed Live Print Preview */}
      <div className="lg:col-span-2 space-y-6">
        {/* Invoice selection index list */}
        <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury print:hidden">
          <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase font-mono mb-3">Issued Quotation Register</h3>
          <div className="flex flex-wrap gap-2.5">
            {quotations.length === 0 ? (
              <p className="text-xs font-mono text-text-dim italic">No exporter proformas generated yet.</p>
            ) : (
              quotations.map((q) => {
                const lead = leads.find(l => l.id === q.leadId);
                return (
                  <button
                    key={q.quoteNumber}
                    onClick={() => setSelectedQuote(q)}
                    className={`px-3 py-2.5 border rounded-sm text-xs font-mono text-left transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedQuote?.quoteNumber === q.quoteNumber
                        ? 'border-gold bg-primary text-gold font-bold shadow-xs'
                        : 'border-primary/10 hover:border-gold/40 text-primary bg-bg-ivory/20'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>#{q.quoteNumber} - {lead ? lead.companyName : "Unknown Entity"}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PRINT READY AREA */}
        {selectedQuote ? (
          <div className="space-y-4">
            {/* Quick status operations on selected quote */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-primary text-white p-5 rounded-lg border border-gold/40 print:hidden shadow-luxury">
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase tracking-widest text-gold font-bold font-mono">Invoice Status Operations</p>
                <p className="text-xs font-mono font-bold">Quotation <span className="text-[#D4AF37]">#{selectedQuote.quoteNumber}</span> &mdash; Status: <span className="uppercase text-gold">{selectedQuote.status}</span></p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedQuote.status === 'Draft' && (
                  <button
                    onClick={() => onUpdateQuotationStatus(selectedQuote.quoteNumber, 'Sent')}
                    className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-sm text-[10px] uppercase font-mono tracking-wider font-semibold cursor-pointer"
                  >
                    Mark "Sent" ✉
                  </button>
                )}
                {selectedQuote.status === 'Sent' && (
                  <>
                    <button
                      onClick={() => onUpdateQuotationStatus(selectedQuote.quoteNumber, 'Accepted')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer"
                    >
                      Accept ✓
                    </button>
                    <button
                      onClick={() => onUpdateQuotationStatus(selectedQuote.quoteNumber, 'Declined')}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-sm text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer"
                    >
                      Reject ✕
                    </button>
                  </>
                )}
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#bfa232] text-primary rounded-sm text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  Print / PDF
                </button>
              </div>
            </div>

            {/* PRINT SHEETS LAYOUT */}
            <div 
              id="quotation-print-area" 
              className="p-8 sm:p-12 rounded-lg border border-primary/5 bg-white shadow-luxury space-y-8 text-black font-sans"
            >
              {/* Header block with elegant Brand signature */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-primary pb-6 gap-4">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-serif font-semibold uppercase tracking-widest text-primary">
                    Nandara Nusa Montierra
                  </h1>
                  <p className="text-[10px] font-mono text-gold uppercase tracking-widest font-semibold">
                    Indonesian Specialty Green Coffee Bean Exporter
                  </p>
                  <p className="text-[10px] text-text-dim">
                    Banda Aceh, Sumatra, Indonesia | sales@nandaramontierra.id
                  </p>
                </div>
                
                <div className="text-right font-mono text-xs sm:w-48">
                  <p className="text-[9px] text-[#4A5568] uppercase tracking-widest font-bold">PROFORMA INVOICE</p>
                  <p className="text-base font-bold text-primary mt-1">#{selectedQuote.quoteNumber}</p>
                  <p className="text-[10px] text-text-dim mt-1.5 uppercase font-semibold">Date: {selectedQuote.dateCreated}</p>
                </div>
              </div>

              {/* Bill To / Bill From Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase font-bold tracking-widest text-[#4A5568] border-b border-gray-100 pb-1">Bill To (Importer Agent):</h4>
                  <p className="font-bold text-primary leading-normal text-sm font-serif">
                    {leads.find(l => l.id === selectedQuote.leadId)?.companyName || "International Coffee Broker"}
                  </p>
                  <p className="text-[#4A5568] leading-relaxed font-sans">
                    Country of Import: {leads.find(l => l.id === selectedQuote.leadId)?.country}
                  </p>
                  <p className="text-text-dim font-mono text-[10px]">
                    Email: {leads.find(l => l.id === selectedQuote.leadId)?.email || "procurement@client.org"}
                  </p>
                </div>

                <div className="space-y-1.5 font-sans">
                  <h4 className="text-[9px] uppercase font-bold tracking-widest text-[#4A5568] border-b border-gray-100 pb-1">Sourcing Agent Credentials:</h4>
                  <p className="font-bold text-[#05190F] text-sm font-serif">Nandara Nusa Montierra</p>
                  <p className="text-[#4A5568] leading-normal font-sans">
                    FOB Sumatra Shipping Depot<br />
                    PT. Nandara Nusantara Sourcing<br />
                    License: Export-ID-94101-MM
                  </p>
                </div>
              </div>

              {/* Item details tab */}
              <div className="border border-primary/10 rounded-sm overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-bg-ivory/40 p-3 font-semibold text-primary font-mono uppercase tracking-widest text-[9px]">
                  <div className="col-span-2">Coffee Product & Spec</div>
                  <div className="text-right">Price per MT (USD)</div>
                  <div className="text-right">Volume</div>
                </div>

                <div className="grid grid-cols-4 p-4 border-t border-primary/10 font-sans items-center bg-white">
                  <div className="col-span-2">
                    <p className="font-serif font-bold text-primary text-sm">{selectedQuote.product}</p>
                    <span className="text-[10px] text-text-dim mt-1 font-sans block leading-relaxed">
                      Moisture content: 11-12.5% | Specialty Grade 1 Selection | Traceable Farms
                    </span>
                  </div>
                  <div className="text-right font-bold text-primary font-mono text-sm">
                    ${selectedQuote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-right text-[#4A5568] font-mono font-semibold">{selectedQuote.quantity}</div>
                </div>
              </div>

              {/* Summary and Incoterm Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs pt-4 border-t border-gray-100 font-sans">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-[#4A5568] tracking-widest">Shipper Terms & Delivery Protocol:</span>
                    <p className="font-serif font-bold text-primary text-sm mt-0.5">{selectedQuote.incoterm}</p>
                  </div>
                  <p className="text-[10px] text-text-dim leading-relaxed font-light font-sans">
                    Price is locked for 30 consecutive calendar days. Includes milling & moisture-sealed packaging in grain pro-liners inside food-grade sea containers.
                  </p>
                </div>

                <div className="space-y-2.5 text-right font-mono bg-bg-ivory/30 p-4 rounded-sm border border-primary/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#4A5568] uppercase text-[9px] tracking-wider font-semibold">CONSIGNMENT NETTO SUB:</span>
                    <span className="font-semibold text-primary font-sans">Calculated on contract</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-primary/10 pt-2 text-[#05190F] font-bold">
                    <span className="uppercase text-[9px] tracking-wider">UNIT CONTRACT PRICE:</span>
                    <span>
                      ${selectedQuote.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} / MT
                    </span>
                  </div>
                </div>
              </div>

              {/* Stamp and signature placeholders */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-primary/10">
                <div className="text-xs">
                  <p className="font-bold text-text-dim uppercase tracking-widest text-[8px]">Issued by:</p>
                  <p className="font-serif font-semibold text-primary mt-8">Nandara Nusa Montierra</p>
                  <p className="text-[10px] text-text-dim font-mono mt-0.5 uppercase tracking-wider">PT. Nandara Nusantara Sourcing</p>
                </div>
                <div className="text-xs text-right">
                  <p className="font-bold text-text-dim uppercase tracking-widest text-[8px]">Acknowledged by:</p>
                  <div className="border-b border-primary/20 w-32 ml-auto mt-10" />
                  <p className="text-[10px] text-text-dim font-mono mt-1 uppercase tracking-wider">Authorized Buyer Stamp</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-primary/15 bg-white rounded-sm text-primary/30 shadow-luxury">
            <FileText className="w-12 h-12 stroke-1 text-gold/40 mx-auto mb-2" />
            <p className="text-xs font-mono uppercase tracking-widest">Select or generate an active invoice proforma above to render PDF view</p>
          </div>
        )}
      </div>
    </div>
  );
}
