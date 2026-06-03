import React, { useState, useEffect } from 'react';
import { Lead, EmailLog, EmailStatus, Quotation } from '../types';
import { 
  Mail, 
  Send, 
  Copy, 
  CheckCheck, 
  Sparkles, 
  UserCheck, 
  Coffee, 
  Globe, 
  BookOpen,
  FileSpreadsheet,
  Plus,
  Clock,
  Lock,
  Unlock,
  Paperclip,
  Eye,
  Save,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface EmailGeneratorViewProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSaveOrUpdateEmail: (log: EmailLog) => void;
  emailLogs: EmailLog[];
  quotations: Quotation[];
}

export default function EmailGeneratorView({ 
  leads, 
  selectedLead, 
  onSaveOrUpdateEmail,
  emailLogs,
  quotations
}: EmailGeneratorViewProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  
  // Form States
  const [recipientEmail, setRecipientEmail] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [contactName, setContactName] = useState('Procurement Manager');
  const [coffeeInterest, setCoffeeInterest] = useState('Aceh Gayo Grade 1 (Classic)');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  // Attachments
  const [attachPdfQuotation, setAttachPdfQuotation] = useState('none');
  const [attachCatalogue, setAttachCatalogue] = useState(false);
  const [attachSampleOffer, setAttachSampleOffer] = useState(false);
  
  // Approval Workflow State
  const [currentEmailId, setCurrentEmailId] = useState<string>('');
  const [status, setStatus] = useState<EmailStatus>('Pending Review');
  const [isApproved, setIsApproved] = useState(false);
  
  // Timestamps
  const [timestamps, setTimestamps] = useState<{
    draftGeneratedAt?: string;
    pendingReviewAt?: string;
    editedByUserAt?: string;
    approvedAt?: string;
    readyToSendAt?: string;
    sentAt?: string;
  }>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const coffeeProducts = [
    'Aceh Gayo Grade 1 (Classic)',
    'Sumatra Lintong G1 (Classic)',
    'Sumatra Mandheling (Classic)',
    'Gayo Wild Natural (Modern Process)',
    'Java Preanger Reserve (Modern Process)',
    'Bali Kintamani (Modern Process)',
    'Flores Volcanic (Modern Process)',
    'Toraja Reserve (Modern Process)',
    'Gayo LB Reserve (Rare Microlot)',
    'Lampung Reserve (Fine Robusta)',
    'Temanggung Fine Robusta (Fine Robusta)'
  ];

  // Helper: Format Dates Beautifully
  const getTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
  };

  // Restore or set state based on selection
  useEffect(() => {
    if (selectedLead) {
      setActiveLead(selectedLead);
    } else if (leads.length > 0 && !activeLead) {
      setActiveLead(leads[0]);
    }
  }, [selectedLead, leads]);

  // Load existing email or initialize when activeLead change
  useEffect(() => {
    if (!activeLead) return;

    // Search for existing email log for this lead
    const existing = emailLogs.find(log => log.leadId === activeLead.id);
    
    if (existing) {
      setCurrentEmailId(existing.id);
      setRecipientEmail(existing.recipientEmail || activeLead.email || '');
      setCc(existing.cc || '');
      setBcc(existing.bcc || '');
      setSubject(existing.emailSubject);
      setBody(existing.emailBody);
      setAttachPdfQuotation(existing.attachPdfQuotation || 'none');
      setAttachCatalogue(existing.attachCatalogue || false);
      setAttachSampleOffer(existing.attachSampleOffer || false);
      setStatus(existing.status);
      setIsApproved(existing.approved);
      setTimestamps({
        draftGeneratedAt: existing.draftGeneratedAt,
        pendingReviewAt: existing.pendingReviewAt,
        editedByUserAt: existing.editedByUserAt,
        approvedAt: existing.approvedAt,
        readyToSendAt: existing.readyToSendAt,
        sentAt: existing.sentAt
      });
    } else {
      // Intialize fresh draft structure
      setCurrentEmailId(`email_draft_${Date.now()}`);
      setRecipientEmail(activeLead.email || '');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachPdfQuotation('none');
      setAttachCatalogue(false);
      setAttachSampleOffer(false);
      setStatus('Pending Review');
      setIsApproved(false);
      setTimestamps({
        pendingReviewAt: getTimestamp()
      });

      // Auto recommendation alignment
      if (activeLead.analysisMatch) {
        const matches = activeLead.analysisMatch.split(',');
        if (matches.length > 0) {
          const match = matches[0].trim();
          const matchedProd = coffeeProducts.find(p => p.toLowerCase().includes(match.toLowerCase()));
          if (matchedProd) {
            setCoffeeInterest(matchedProd);
          }
        }
      }
    }
  }, [activeLead, emailLogs]);

  const handleGenerate = async () => {
    if (!activeLead) return;
    setIsGenerating(true);
    setCopied(false);

    try {
      const response = await fetch('/api/leads/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: activeLead.companyName,
          country: activeLead.country,
          leadType: activeLead.leadType,
          coffeeInterest: coffeeInterest,
          contactName: contactName
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Email generator API returned an error.');
      }

      const data = await response.json();
      const generatedSub = data.subject || '';
      const generatedBody = data.body || '';

      const now = getTimestamp();
      setSubject(generatedSub);
      setBody(generatedBody);
      setStatus('Draft Generated');
      setIsApproved(false);

      const updatedTimestamps = {
        ...timestamps,
        draftGeneratedAt: now,
        pendingReviewAt: now
      };
      setTimestamps(updatedTimestamps);

      // Save automatically in local state
      const freshEmail: EmailLog = {
        id: currentEmailId,
        leadId: activeLead.id,
        recipientEmail: recipientEmail || activeLead.email || '',
        cc,
        bcc,
        emailSubject: generatedSub,
        emailBody: generatedBody,
        status: 'Draft Generated',
        approved: false,
        attachPdfQuotation,
        attachCatalogue,
        attachSampleOffer,
        draftGeneratedAt: now,
        pendingReviewAt: now,
        sentDate: new Date().toISOString().split('T')[0]
      };
      onSaveOrUpdateEmail(freshEmail);

    } catch (err: any) {
      alert('Failed to generate professional outreach: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    if (!activeLead) return;
    const now = getTimestamp();
    const isEdit = status !== 'Draft Generated' && status !== 'Approved';
    const nextStatus = isEdit ? 'Edited By User' : status;
    
    setStatus(nextStatus);

    const updatedTimestamps = {
      ...timestamps,
      editedByUserAt: now
    };
    setTimestamps(updatedTimestamps);

    const freshEmail: EmailLog = {
      id: currentEmailId,
      leadId: activeLead.id,
      recipientEmail: recipientEmail,
      cc,
      bcc,
      emailSubject: subject,
      emailBody: body,
      status: nextStatus,
      approved: isApproved, // don't silently lose approval if approved
      attachPdfQuotation,
      attachCatalogue,
      attachSampleOffer,
      ...timestamps,
      editedByUserAt: now,
      sentDate: new Date().toISOString().split('T')[0]
    };

    onSaveOrUpdateEmail(freshEmail);
    alert('Email draft successfully saved locally! Timestamps recorded.');
  };

  const handleApprove = () => {
    if (!activeLead) return;
    const now = getTimestamp();

    setIsApproved(true);
    setStatus('Approved');

    const updatedTimestamps = {
      ...timestamps,
      approvedAt: now,
      readyToSendAt: now
    };
    setTimestamps(updatedTimestamps);

    const freshEmail: EmailLog = {
      id: currentEmailId,
      leadId: activeLead.id,
      recipientEmail: recipientEmail,
      cc,
      bcc,
      emailSubject: subject,
      emailBody: body,
      status: 'Approved',
      approved: true,
      attachPdfQuotation,
      attachCatalogue,
      attachSampleOffer,
      ...timestamps,
      approvedAt: now,
      readyToSendAt: now,
      sentDate: new Date().toISOString().split('T')[0]
    };

    onSaveOrUpdateEmail(freshEmail);
    alert('Email approved successfully! Transmit lock is now UNLOCKED.');
  };

  const handleSendEmail = () => {
    if (!activeLead) return;
    if (!isApproved) {
      alert("Transmission blocked. Every outbound email must be APPROVED first!");
      return;
    }

    const now = getTimestamp();
    setStatus('Sent');

    const updatedTimestamps = {
      ...timestamps,
      sentAt: now
    };
    setTimestamps(updatedTimestamps);

    const freshEmail: EmailLog = {
      id: currentEmailId,
      leadId: activeLead.id,
      recipientEmail: recipientEmail,
      cc,
      bcc,
      emailSubject: subject,
      emailBody: body,
      status: 'Sent',
      approved: true,
      attachPdfQuotation,
      attachCatalogue,
      attachSampleOffer,
      ...timestamps,
      sentAt: now,
      sentDate: new Date().toISOString().split('T')[0]
    };

    onSaveOrUpdateEmail(freshEmail);
    alert(`B2B outreach successfully simulated and transmitted to direct mail pipelines! Marked as "Contacted".`);
  };

  const handleCopy = () => {
    const textToCopy = `To: ${recipientEmail || 'Undisclosed Buyership'}\nCC: ${cc}\nBCC: ${bcc}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Rich style formatting toolbar helpers
  const applyTextModifier = (modifier: string) => {
    const editor = document.getElementById('composer-textarea') as HTMLTextAreaElement;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const activeText = body;
    let modified = '';

    switch(modifier) {
      case 'bold':
        modified = `**${activeText.substring(start, end) || 'Bold-Text'}**`;
        break;
      case 'italic':
        modified = `*${activeText.substring(start, end) || 'Italic-Text'}*`;
        break;
      case 'head':
        modified = `\n### ${activeText.substring(start, end) || 'Heading'}\n`;
        break;
      case 'list':
        modified = `\n- ${activeText.substring(start, end) || 'List Item'}\n`;
        break;
      case 'quote':
        const quoteObj = quotations.find(q => q.quoteNumber === attachPdfQuotation);
        modified = quoteObj 
          ? `\n[Reference Proforma Invoice No: ${quoteObj.quoteNumber} pricing ${quoteObj.price} USD per ton under terms of ${quoteObj.incoterm}]\n`
          : `\n[Reference Attachment Quotation Details]\n`;
        break;
      default:
        modified = '';
    }

    const nextBody = activeText.substring(0, start) + modified + activeText.substring(end);
    setBody(nextBody);
    
    // Set status to edited
    if (status !== 'Draft Generated' && status !== 'Approved' && status !== 'Sent') {
      setStatus('Edited By User');
    }
  };

  // Find quotes matching target lead
  const filteredQuotations = activeLead 
    ? quotations.filter(q => q.leadId === activeLead.id) 
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="email-generator-root">
      
      {/* Left Column: Form Settings & Selection */}
      <div className="lg:col-span-1 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-5" id="outreach-config">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-primary text-gold rounded-sm">
            <Mail className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">B2B Sourcing Target</h3>
            <p className="text-xs text-text-dim mt-0.5">Scout and trigger AI drafting</p>
          </div>
        </div>

        {/* Lead Selector */}
        <div className="space-y-1.5 text-xs font-mono">
          <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Importer Account</label>
          {leads.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-sm font-sans">
              <span>No leads available yet. Find importer leads first!</span>
            </div>
          ) : (
            <select
              value={activeLead?.id || ''}
              onChange={e => {
                const selected = leads.find(l => l.id === e.target.value);
                if (selected) {
                  setActiveLead(selected);
                }
              }}
              className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold font-sans outline-hidden"
            >
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.companyName} ({lead.country} - Grade {lead.leadScore})
                </option>
              ))}
            </select>
          )}
        </div>

        {activeLead && (
          <div className="p-3.5 bg-bg-ivory/60 border border-primary/5 rounded-sm text-xs font-mono space-y-2 text-gray-700 shadow-xs">
            <div className="flex gap-1.5 items-center text-primary font-bold uppercase tracking-widest text-[9px] border-b border-gray-100 pb-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              <span>Target Metadata</span>
            </div>
            <p><span className="text-text-dim uppercase tracking-wider text-[8px] font-bold">Class:</span> {activeLead.leadType}</p>
            <p><span className="text-text-dim uppercase tracking-wider text-[8px] font-bold">Locality:</span> {activeLead.country}</p>
            <p className="truncate">
              <span className="text-text-dim uppercase tracking-wider text-[8px] font-bold">Confidence scores:</span>
              <span className="block mt-0.5 text-[10px] text-emerald-800">🌐 Web: {activeLead.websiteConfidence || 'High'} • ⚙ Importer: {activeLead.importerConfidence || 'High'}</span>
            </p>
          </div>
        )}

        {/* Contact Name Custom Input */}
        <div className="space-y-1.5 text-xs font-mono">
          <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Salutation / Buyer Contact</label>
          <input
            type="text"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
            placeholder="e.g. Procurement Team or Name"
          />
        </div>

        {/* Coffee Products Alignment */}
        <div className="space-y-1.5 text-xs font-mono">
          <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Matched Target Product</label>
          <select
            value={coffeeInterest}
            onChange={e => setCoffeeInterest(e.target.value)}
            className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold font-sans outline-hidden"
          >
            {coffeeProducts.map(prod => (
              <option key={prod} value={prod}>{prod}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!activeLead || isGenerating}
          className="w-full py-3 bg-primary hover:bg-[#0c3320] text-gold hover:text-white text-xs font-mono uppercase tracking-widest border border-gold/45 rounded-sm select-none cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 font-bold"
        >
          <Sparkles className="w-4 h-4 text-gold animate-pulse" />
          {isGenerating ? "Molding Cooperative Draft..." : "Generate AI Draft"}
        </button>
      </div>

      {/* Right Column: AI Generation Playground & Live Composer */}
      <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex flex-col justify-between space-y-5" id="email-playground">
        
        {/* Progress Flow Timeline Status of outbound message */}
        <div className="border-b border-gray-100 pb-4 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Outbound workflow status</h3>
              <p className="text-xs text-text-dim">Secured enterprise email approval channel</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-[9px] font-mono rounded-sm flex items-center gap-1.5 uppercase font-bold border ${
                isApproved 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isApproved ? <Unlock className="w-3 h-3 text-emerald-700" /> : <Lock className="w-3 h-3 text-amber-600" />}
                {isApproved ? 'Approved = TRUE (Unlocked)' : 'Approved = FALSE (Locked)'}
              </span>
            </div>
          </div>

          {/* Flow Visual Trackers */}
          <div className="pt-2 p-3 bg-bg-ivory/50 border border-primary/5 rounded-sm">
            <div className="flex flex-wrap sm:flex-nowrap justify-between gap-1 overflow-x-auto pb-1 text-[9px] font-mono text-gray-500 uppercase tracking-tight">
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${timestamps.draftGeneratedAt ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span className={status === 'Draft Generated' ? 'text-primary font-bold' : ''}>DI Draft</span>
              </div>
              <div className="text-gray-300">→</div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${timestamps.pendingReviewAt ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span className={status === 'Pending Review' ? 'text-primary font-bold' : ''}>Reviewing</span>
              </div>
              <div className="text-gray-300">→</div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${timestamps.editedByUserAt ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span className={status === 'Edited By User' ? 'text-primary font-bold' : ''}>Edited</span>
              </div>
              <div className="text-gray-300">→</div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span className={status === 'Approved' ? 'text-primary font-bold' : ''}>Approved</span>
              </div>
              <div className="text-gray-300">→</div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${status === 'Sent' ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                <span className={status === 'Sent' ? 'text-primary font-bold' : ''}>Sent Live</span>
              </div>
            </div>

            {/* Timestamps audit indicators */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200/50 text-[8px] font-mono text-text-dim">
              <p>📍 Generated: {timestamps.draftGeneratedAt || 'n/a'}</p>
              <p>📍 User Edited: {timestamps.editedByUserAt || 'n/a'}</p>
              <p>📍 Approved: {timestamps.approvedAt || 'n/a'}</p>
              <p>📍 Transmitted: {timestamps.sentAt || 'n/a'}</p>
            </div>
          </div>
        </div>

        {/* Email Headers Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-[#4A5568] font-bold">To (Procurement Email)</label>
            <input 
              type="email" 
              value={recipientEmail}
              onChange={e => {
                setRecipientEmail(e.target.value);
                if (status !== 'Draft Generated' && status !== 'Approved' && status !== 'Sent') {
                  setStatus('Edited By User');
                }
              }}
              className="w-full bg-bg-ivory/20 border border-primary/10 rounded-sm px-2.5 py-1.5 focus:ring-1 focus:ring-gold"
              placeholder="buyer@importer.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-[#4A5568] font-bold">CC</label>
              <input 
                type="text" 
                value={cc}
                onChange={e => setCc(e.target.value)}
                className="w-full bg-bg-ivory/20 border border-primary/10 rounded-sm px-2.5 py-1.5 focus:ring-1 focus:ring-gold"
                placeholder="sales@nandara.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-[#4A5568] font-bold">BCC</label>
              <input 
                type="text" 
                value={bcc}
                onChange={e => setBcc(e.target.value)}
                className="w-full bg-bg-ivory/20 border border-primary/10 rounded-sm px-2.5 py-1.5 focus:ring-1 focus:ring-gold"
                placeholder="trade-archive@coops.org"
              />
            </div>
          </div>
        </div>

        {/* Subject Editor */}
        <div className="text-xs font-mono space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-[#4A5568] font-bold block">Subject Header Line</label>
          <input 
            type="text" 
            value={subject}
            onChange={e => {
              setSubject(e.target.value);
              if (status !== 'Draft Generated' && status !== 'Approved' && status !== 'Sent') {
                setStatus('Edited By User');
              }
            }}
            className="w-full bg-bg-ivory/20 border border-primary/15 rounded-sm px-3 py-2 text-xs text-[#05190F] font-semibold focus:ring-1 focus:ring-gold outline-hidden font-sans"
            placeholder="Introduce direct cooperative trace coffees..."
          />
        </div>

        {/* Big Body Text Area and Editor Features */}
        <div className="space-y-1.5 flex flex-col flex-1 min-h-[300px]">
          <div className="flex items-center justify-between bg-primary/5 p-2 rounded-t-sm border-t border-x border-primary/10 text-[10px] font-mono">
            <span className="font-bold text-[#05190F] uppercase">Rich-Style Editor Buttons</span>
            <div className="flex gap-2.5">
              <button 
                onClick={() => applyTextModifier('bold')}
                className="px-2 py-1 bg-white border border-primary/10 rounded-sm hover:text-gold cursor-pointer"
                title="Format Selection to Bold"
              >
                <b>B</b>
              </button>
              <button 
                onClick={() => applyTextModifier('italic')}
                className="px-2 py-1 bg-white border border-primary/10 rounded-sm hover:text-gold cursor-pointer"
                title="Format Selection to Italic"
              >
                <i>I</i>
              </button>
              <button 
                onClick={() => applyTextModifier('head')}
                className="px-2 py-1 bg-white border border-primary/10 rounded-sm hover:text-gold cursor-pointer"
                title="Insert Block Heading"
              >
                H3
              </button>
              <button 
                onClick={() => applyTextModifier('list')}
                className="px-2 py-1 bg-white border border-primary/10 rounded-sm hover:text-gold cursor-pointer"
                title="Insert Bullet Points"
              >
                • List
              </button>
              <button 
                onClick={() => applyTextModifier('quote')}
                disabled={attachPdfQuotation === 'none'}
                className="px-2 py-1 bg-white border border-primary/10 rounded-sm hover:text-gold disabled:opacity-30 cursor-pointer"
                title="Reference active quote detail block inline"
              >
                📎 Reference Quote
              </button>
            </div>
          </div>

          <textarea
            id="composer-textarea"
            value={body}
            onChange={e => {
              setBody(e.target.value);
              if (status !== 'Draft Generated' && status !== 'Approved' && status !== 'Sent') {
                setStatus('Edited By User');
              }
            }}
            placeholder="Perform an AI scout or click generate to assemble a highly professional coffee trading template..."
            className="w-full flex-1 p-4 bg-bg-ivory/10 border-b border-x border-primary/15 rounded-b-sm font-sans text-xs text-gray-800 leading-relaxed outline-hidden min-h-[180px]"
          />
        </div>

        {/* Attachment parameters */}
        <div className="bg-bg-ivory/40 border border-primary/15 rounded-sm p-4 space-y-3.5 text-xs font-mono">
          <p className="text-[10px] uppercase tracking-widest text-[#05190F] font-bold border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-gold" />
            <span>Outbound Trade Attachments</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Quote Selector dropdown */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-[#4A5568] font-bold block">Attach PDF Quotation</label>
              {filteredQuotations.length === 0 ? (
                <div className="text-[10px] text-gray-400 font-sans italic leading-tight">
                  No generated quotes exist for {activeLead?.companyName}. Use Quotation Engine first.
                </div>
              ) : (
                <select
                  value={attachPdfQuotation}
                  onChange={e => setAttachPdfQuotation(e.target.value)}
                  className="w-full bg-white border border-primary/10 rounded-sm p-1.5 text-[10px] shrink-0"
                >
                  <option value="none">-- Select Proforma Quote --</option>
                  {filteredQuotations.map(q => (
                    <option key={q.quoteNumber} value={q.quoteNumber}>
                      {q.quoteNumber} ({q.product} - ${q.price}/Ton)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="check-cat" 
                checked={attachCatalogue}
                onChange={e => setAttachCatalogue(e.target.checked)}
                className="w-4 h-4 text-primary bg-white border-primary/30 rounded-sm"
              />
              <label htmlFor="check-cat" className="text-[10px] text-primary uppercase font-bold cursor-pointer select-none">
                📕 Attach Catalogue.pdf
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="check-sample" 
                checked={attachSampleOffer}
                onChange={e => setAttachSampleOffer(e.target.checked)}
                className="w-4 h-4 text-primary bg-white border-primary/30 rounded-sm"
              />
              <label htmlFor="check-sample" className="text-[10px] text-primary uppercase font-bold cursor-pointer select-none">
                🏷 Attach SpecSheet.pdf
              </label>
            </div>
          </div>
        </div>

        {/* Lock warning banner if Not Approved */}
        {!isApproved && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-sm text-xs font-sans flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Transmission Guard Activated</p>
              <p className="text-gray-700 text-[11px] leading-relaxed mt-0.5">
                Every outbound message requires strict human check. The <b>Send Email</b> operation is locked until <b>Approve Email</b> is clicked.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Toolbar: Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2.5 justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={!activeLead || isGenerating}
              className="px-4 py-2.5 border border-primary hover:border-neutral-900 bg-bg-ivory/50 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:bg-white"
            >
              <Save className="w-3.5 h-3.5 text-[#05190F]" />
              Save Draft
            </button>

            <button
              onClick={() => setIsPreviewOpen(true)}
              disabled={!subject}
              className="px-4 py-2.5 border border-primary hover:border-neutral-900 bg-bg-ivory/50 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:bg-white disabled:opacity-40"
            >
              <Eye className="w-3.5 h-3.5 text-primary/75" />
              Preview Letter
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={!subject || isApproved}
              className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border border-yellow-700/30 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              {isApproved ? 'Approved ✔' : 'Approve Email'}
            </button>

            <button
              onClick={handleSendEmail}
              disabled={!isApproved || status === 'Sent'}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border border-emerald-900 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5 text-gold" />
              {status === 'Sent' ? 'Outbound Sent' : 'Manual Send Email'}
            </button>
          </div>
        </div>

      </div>

      {/* Preview Modal markup */}
      {isPreviewOpen && activeLead && (
        <div className="fixed inset-0 z-50 bg-primary/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#D4AF37]/50 max-w-2xl w-full rounded-sm shadow-2xl p-7 space-y-5">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold shrink-0" />
                <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-primary">Nandara Sourcing Mail Dispatch</h3>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-primary font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Letter Headers Envelope */}
            <div className="p-4 bg-bg-ivory/40 rounded-sm border border-primary/5 space-y-1.5 text-xs font-mono text-gray-700">
              <p><span className="text-text-dim text-[10px] uppercase font-bold mr-2">To:</span> {recipientEmail || activeLead.email || 'None specified'}</p>
              {cc && <p><span className="text-text-dim text-[10px] uppercase font-bold mr-2">CC:</span> {cc}</p>}
              {bcc && <p><span className="text-text-dim text-[10px] uppercase font-bold mr-2">BCC:</span> {bcc}</p>}
              <p><span className="text-text-dim text-[10px] uppercase font-bold mr-2">Subject:</span> {subject}</p>
              
              {/* Display visual attached labels */}
              <div className="pt-2 border-t border-gray-200 mt-2 flex flex-wrap gap-2 text-[9px] text-[#4A5568]">
                <span className="font-bold uppercase text-[8px] text-primary self-center shrink-0">Attached:</span>
                {attachPdfQuotation !== 'none' && (
                  <span className="p-1 px-2 border border-blue-200 bg-blue-50 text-blue-800 rounded-xs">
                    📄 Proforma_{attachPdfQuotation}.pdf
                  </span>
                )}
                {attachCatalogue && (
                  <span className="p-1 px-2 border border-rose-200 bg-rose-50 text-rose-800 rounded-xs">
                    📕 Product_Catalogue.pdf
                  </span>
                )}
                {attachSampleOffer && (
                  <span className="p-1 px-2 border border-teal-200 bg-teal-50 text-teal-800 rounded-xs">
                    🏷 Specialty_Lots_Specs.pdf
                  </span>
                )}
                {attachPdfQuotation === 'none' && !attachCatalogue && !attachSampleOffer && (
                  <span className="italic text-gray-400 font-sans">No physical assets attached</span>
                )}
              </div>
            </div>

            {/* Letter Body mockup wrapper */}
            <div className="p-5 border border-dashed border-primary/10 rounded-sm bg-stone-50 max-h-72 overflow-y-auto whitespace-pre-line text-xs font-sans text-gray-800 leading-relaxed">
              {body}
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 font-mono text-[10px]">
              <span className="text-text-dim uppercase tracking-wider font-bold">Mail Approval Status: {status}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 border border-primary rounded-sm uppercase tracking-widest font-bold cursor-pointer"
                >
                  {copied ? 'Copied ✔' : 'Copy Text'}
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-5 py-2 bg-primary text-[#D4AF37] hover:text-white rounded-sm uppercase tracking-widest font-bold cursor-pointer"
                >
                  OK Close Preview
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
