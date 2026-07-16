import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

// Types matching backend AutoDiscoverResult
interface CompanyClassification {
  companyName: string;
  tradingName?: string;
  country: string;
  city: string;
  address?: string;
  website: string;
  businessType: string;
  founded?: string;
  employeeEstimate?: string;
  businessScale?: string;
  confidenceScore: number;
  isCoffeeBusiness: boolean;
  warning?: string;
  coffeeCategories?: string[];
  services?: string[];
  industries?: string[];
  targetCustomers?: string[];
}

interface ContactInfo {
  companyEmail: string | null;
  procurementEmail: string | null;
  salesEmail: string | null;
  coffeeBuyingEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  contactPerson: string | null;
  jobTitle: string | null;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CoffeePortfolio {
  origins: string[];
  products: string[];
  processingMethods: string[];
  certifications: string[];
  roastingStyle: string;
  currentSuppliers: string[];
  privateLabels: string[];
  buyingInterests: string[];
  packagingTypes: string[];
  estimatedAnnualVolume: string;
  specialtyFocus: string;
}

interface ProductMatchDetail {
  productName: string;
  matchScore: number;
  reason: string;
  gapAnalysis: string;
}

interface BuyerScores {
  opportunityScore: number;
  relationshipDifficulty: number;
  buyingPotential: number;
  estimatedVolume: string;
  premiumPotential: number;
  specialtyCoffeeInterest: number;
  decisionComplexity: number;
  priceSensitivity: number;
  responseProbability: number;
  riskLevel: string;
}

interface BuyerInsight {
  businessSummary: string;
  businessModel: string;
  currentCoffeeStrategy: string;
  possiblePainPoints: string[];
  potentialOpportunities: string[];
  recommendedSalesAngle: string;
  recommendedCommunicationStyle: string;
}

interface AutoDiscoverResult {
  classification: CompanyClassification;
  contacts: ContactInfo;
  portfolio: CoffeePortfolio;
  productMatches: ProductMatchDetail[];
  bestProducts: string[];
  gapAnalysis: string;
  scores: BuyerScores;
  insight: BuyerInsight;
  importerId?: string;
  isNewBuyer: boolean;
  timeline: string[];
  outreachStrategy: {
    emailType: string;
    reason: string;
  };
  emailDraft: {
    subject: string;
    body: string;
  };
  recommendedAttachments: string[];
  cached?: boolean;
}

interface TimelineEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
  source: string;
}

const EVENT_ICONS: Record<string, string> = {
  'Website Analysis': '🌐',
  'Company Research': '🔍',
  'Contact Extraction': '👤',
  'Portfolio Analysis': '☕',
  'Product Matching': '🎯',
  'CRM Creation': '👤',
  'Email Generation': '📧',
  'AI Insight': '🤖',
};

const BUSINESS_TYPE_COLORS: Record<string, string> = {
  'Coffee Importer': 'bg-blue-100 text-blue-800 border-blue-200',
  'Coffee Trader': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Coffee Roaster': 'bg-orange-100 text-orange-800 border-orange-200',
  'Coffee Chain': 'bg-purple-100 text-purple-800 border-purple-200',
  'Coffee Retailer': 'bg-pink-100 text-pink-800 border-pink-200',
  'Private Label': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Coffee Distributor': 'bg-teal-100 text-teal-800 border-teal-200',
  'Coffee Manufacturer': 'bg-red-100 text-red-800 border-red-200',
  'Coffee Exporter': 'bg-green-100 text-green-800 border-green-200',
  'Broker': 'bg-gray-100 text-gray-800 border-gray-200',
  'Green Coffee Buyer': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Cafe Group': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Unknown': 'bg-gray-100 text-gray-600 border-gray-200',
};

const MATCH_COLORS: Record<string, string> = {
  'Excellent': 'text-emerald-600 bg-emerald-50',
  'Good': 'text-blue-600 bg-blue-50',
  'Medium': 'text-yellow-600 bg-yellow-50',
  'Low': 'text-gray-500 bg-gray-50',
};

interface Props {
  initialWebsiteUrl?: string;
  onBuyerCreated?: (result: AutoDiscoverResult) => void;
  onEmailGenerated?: (email: { subject: string; body: string }) => void;
}

export default function AIBuyerIntelligence({ initialWebsiteUrl = '', onBuyerCreated, onEmailGenerated }: Props) {
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [result, setResult] = useState<AutoDiscoverResult | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'cache' | 'refresh' | 'force'>('cache');

  const loadTimeline = async (importerId: string) => {
    try {
      const data = await api.get(`/api/emails/timeline/${importerId}`);
      setTimeline(data.timeline || []);
    } catch (err) {
      console.error('[AI Buyer Intelligence] Timeline load error:', err);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      alert('Please enter a website URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCurrentPhase('Analyzing website...');

    try {
      const isForce = analysisMode === 'force';
      console.log(`[AI Buyer Intelligence] Mode: ${analysisMode.toUpperCase()}, Force: ${isForce}`);
      
      const data = await api.post('/api/auto-discover', { websiteUrl, force: isForce });
      
      setResult(data);
      setCurrentPhase('Analysis complete');

      if (data.importerId) {
        loadTimeline(data.importerId);
      }

      if (data.emailDraft && onEmailGenerated) {
        onEmailGenerated(data.emailDraft);
      }

      if (onBuyerCreated) {
        onBuyerCreated(data);
      }

      if (data.cached) {
        alert(`📦 Analysis loaded from cache (${new Date().toLocaleDateString()})`);
      } else {
        alert(`✅ Analysis complete! ${data.isNewBuyer ? 'New buyer created' : 'Buyer updated'} in CRM.`);
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      alert('Analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setCurrentPhase('');
    }
  };

  const handleSyncHistory = async () => {
    if (!result?.importerId) {
      alert('No buyer selected. Please analyze a website first.');
      return;
    }

    setIsSyncing(true);
    try {
      const syncResult = await api.post('/api/emails/sync-timeline', { importerId: result.importerId });
      alert(`Timeline synced: ${syncResult.eventCount} events loaded from history`);
      loadTimeline(result.importerId);
    } catch (err: any) {
      alert('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoDiscover = async () => {
    await handleAnalyzeWebsite();
  };

  const handleRefresh = async () => {
    if (!result?.importerId) return;

    setIsAnalyzing(true);
    try {
      const refreshData = await api.post(`/api/auto-discover/refresh/${result.importerId}`, {});
      setResult(refreshData);
      if (refreshData.importerId) {
        loadTimeline(refreshData.importerId);
      }
      alert('Analysis refreshed with latest data');
    } catch (err: any) {
      alert('Refresh failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyEmail = () => {
    if (!result?.emailDraft) return;
    navigator.clipboard.writeText(`To: ${result.contacts.procurementEmail || result.contacts.companyEmail || ''}\nSubject: ${result.emailDraft.subject}\n\n${result.emailDraft.body}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderClassification = () => {
    if (!result?.classification) return null;
    const { classification } = result;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Company Classification</h4>
          {classification.warning && (
            <span className="text-[8px] px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-sm">
              ⚠ Low Confidence
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Company Name</p>
            <p className="text-[10px] font-semibold text-primary mt-0.5">{classification.companyName}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Location</p>
            <p className="text-[10px] text-primary mt-0.5">{classification.city}, {classification.country}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Website</p>
            <a href={classification.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline mt-0.5 block truncate">
              {classification.website}
            </a>
          </div>
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Business Type</p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 text-[8px] font-bold rounded-sm border ${
              BUSINESS_TYPE_COLORS[classification.businessType] || BUSINESS_TYPE_COLORS['Unknown']
            }`}>
              {classification.businessType}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">Confidence Score</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreColor(classification.confidenceScore)} transition-all`}
                  style={{ width: `${classification.confidenceScore}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-primary">{classification.confidenceScore}%</span>
            </div>
            {classification.warning && (
              <p className="text-[8px] text-amber-700 mt-1 italic">{classification.warning}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContacts = () => {
    if (!result?.contacts) return null;
    const { contacts } = result;

    const contactItems = [
      { label: 'Company Email', value: contacts.companyEmail },
      { label: 'Procurement Email', value: contacts.procurementEmail },
      { label: 'Sales Email', value: contacts.salesEmail },
      { label: 'Coffee Buying Email', value: contacts.coffeeBuyingEmail },
      { label: 'Phone', value: contacts.phone },
      { label: 'WhatsApp', value: contacts.whatsapp },
      { label: 'LinkedIn', value: contacts.linkedin },
      { label: 'Contact Person', value: contacts.contactPerson },
      { label: 'Job Title', value: contacts.jobTitle },
    ].filter(item => item.value);

    if (contactItems.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Contact Extraction</h4>
        <div className="grid grid-cols-2 gap-2">
          {contactItems.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">{item.label}</p>
              <p className="text-[10px] text-primary break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPortfolio = () => {
    if (!result?.portfolio) return null;
    const { portfolio } = result;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Coffee Portfolio Analysis</h4>
        
        {portfolio.origins.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Origins</p>
            <div className="flex flex-wrap gap-1">
              {portfolio.origins.map((origin, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[8px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm">
                  {origin}
                </span>
              ))}
            </div>
          </div>
        )}

        {portfolio.products.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Products</p>
            <div className="flex flex-wrap gap-1">
              {portfolio.products.map((product, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[8px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}

        {portfolio.certifications.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Certifications</p>
            <div className="flex flex-wrap gap-1">
              {portfolio.certifications.map((cert, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[8px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-sm">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Roasting Style</p>
            <p className="text-primary mt-0.5">{portfolio.roastingStyle}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Specialty Focus</p>
            <p className="text-primary mt-0.5">{portfolio.specialtyFocus}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Est. Annual Volume</p>
            <p className="text-primary mt-0.5">{portfolio.estimatedAnnualVolume}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Processing Methods</p>
            <p className="text-primary mt-0.5">{portfolio.processingMethods.join(', ') || 'N/A'}</p>
          </div>
        </div>

        {portfolio.currentSuppliers.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Current Suppliers</p>
            <p className="text-[10px] text-primary">{portfolio.currentSuppliers.join(', ')}</p>
          </div>
        )}
      </div>
    );
  };

  const renderProductMatching = () => {
    if (!result?.productMatches || result.productMatches.length === 0) return null;

    const strongMatches = result.productMatches.filter(m => m.matchScore >= 60);
    if (strongMatches.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Nandara Product Matching</h4>
        
        <div className="space-y-2">
          {strongMatches.slice(0, 5).map((match, idx) => (
            <div key={idx} className="p-2 bg-gray-50 rounded-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-primary">{match.productName}</p>
                <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-sm ${
                  match.matchScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                  match.matchScore >= 60 ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {match.matchScore}%
                </span>
              </div>
              <p className="text-[8px] text-gray-600 mb-1">{match.reason}</p>
              <p className="text-[8px] text-gray-500 italic">Gap: {match.gapAnalysis}</p>
            </div>
          ))}
        </div>

        {result.bestProducts.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Best Recommended Products</p>
            <div className="flex flex-wrap gap-1">
              {result.bestProducts.map((product, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[8px] font-bold bg-gold/10 text-primary border border-gold/30 rounded-sm">
                  {product}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBuyerScores = () => {
    if (!result?.scores) return null;
    const { scores } = result;

    const scoreItems = [
      { label: 'Opportunity Score', value: scores.opportunityScore, key: 'opportunity' },
      { label: 'Buying Potential', value: scores.buyingPotential, key: 'potential' },
      { label: 'Premium Potential', value: scores.premiumPotential, key: 'premium' },
      { label: 'Specialty Interest', value: scores.specialtyCoffeeInterest, key: 'specialty' },
      { label: 'Response Probability', value: scores.responseProbability, key: 'response' },
    ];

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Buyer Scoring</h4>
        
        <div className="grid grid-cols-1 gap-2">
          {scoreItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] text-gray-600">{item.label}</span>
                  <span className="text-[9px] font-bold text-primary">{item.value}/100</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(item.value)} transition-all`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 text-[10px]">
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Relationship Difficulty</p>
            <p className="text-primary font-semibold">{scores.relationshipDifficulty}/100</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Decision Complexity</p>
            <p className="text-primary font-semibold">{scores.decisionComplexity}/100</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Price Sensitivity</p>
            <p className="text-primary font-semibold">{scores.priceSensitivity}/100</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Risk Level</p>
            <p className="text-primary font-semibold">{scores.riskLevel}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[8px] uppercase text-gray-400 font-bold">Est. Annual Volume</p>
            <p className="text-primary font-semibold">{scores.estimatedVolume}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderInsight = () => {
    if (!result?.insight) return null;
    const { insight } = result;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Buyer Insight</h4>

        <div>
          <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Business Summary</p>
          <p className="text-[10px] text-primary leading-relaxed">{insight.businessSummary}</p>
        </div>

        <div>
          <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Business Model</p>
          <p className="text-[10px] text-primary">{insight.businessModel}</p>
        </div>

        <div>
          <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Current Coffee Strategy</p>
          <p className="text-[10px] text-primary">{insight.currentCoffeeStrategy}</p>
        </div>

        {insight.possiblePainPoints.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-wider text-red-600 font-bold mb-1">Possible Pain Points</p>
            <ul className="list-disc list-inside space-y-0.5">
              {insight.possiblePainPoints.map((point, idx) => (
                <li key={idx} className="text-[9px] text-red-800">{point}</li>
              ))}
            </ul>
          </div>
        )}

        {insight.potentialOpportunities.length > 0 && (
          <div>
            <p className="text-[8px] uppercase tracking-wider text-emerald-600 font-bold mb-1">Potential Opportunities</p>
            <ul className="list-disc list-inside space-y-0.5">
              {insight.potentialOpportunities.map((opp, idx) => (
                <li key={idx} className="text-[9px] text-emerald-800">{opp}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Recommended Sales Angle</p>
          <p className="text-[10px] text-primary font-semibold">{insight.recommendedSalesAngle}</p>
        </div>

        <div>
          <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Communication Style</p>
          <span className="inline-block px-2 py-1 text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-sm">
            {insight.recommendedCommunicationStyle}
          </span>
        </div>
      </div>
    );
  };

  const renderOutreachStrategy = () => {
    if (!result?.outreachStrategy) return null;
    const { outreachStrategy } = result;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Outreach Strategy</h4>
        
        <div className="p-3 bg-primary/5 border border-primary/10 rounded-sm">
          <p className="text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-1">Recommended Approach</p>
          <p className="text-[11px] font-bold text-primary">{outreachStrategy.emailType.replace(/_/g, ' ')}</p>
          <p className="text-[9px] text-gray-600 mt-1">{outreachStrategy.reason}</p>
        </div>
      </div>
    );
  };

  const renderEmailPreview = () => {
    if (!result?.emailDraft) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Generated Email Draft</h4>
          <button
            onClick={handleCopyEmail}
            className="text-[8px] px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-sm transition-colors"
          >
            {copiedEmail ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">To</p>
            <p className="text-[10px] text-primary">{result.contacts.procurementEmail || result.contacts.companyEmail || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Subject</p>
            <p className="text-[10px] font-semibold text-primary">{result.emailDraft.subject}</p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold">Body</p>
            <div className="mt-1 p-2 bg-gray-50 rounded-sm border border-gray-200 max-h-60 overflow-y-auto">
              <pre className="text-[9px] text-primary whitespace-pre-wrap font-sans">{result.emailDraft.body}</pre>
            </div>
          </div>
        </div>

        {result.recommendedAttachments.length > 0 && (
          <div>
            <p className="text-[8px] uppercase text-gray-400 font-bold mb-1">Recommended Attachments</p>
            <div className="flex flex-wrap gap-1">
              {result.recommendedAttachments.map((att, idx) => (
                <span key={idx} className="px-2 py-0.5 text-[8px] bg-gold/10 text-primary border border-gold/30 rounded-sm">
                  {att}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimeline = () => {
    if (timeline.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary">Buyer Timeline</h4>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {timeline.map((event, idx) => (
            <div key={event.id || idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-sm border border-gray-100">
              <span className="text-sm shrink-0">{EVENT_ICONS[event.eventType] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold text-primary">{event.title}</p>
                {event.description && (
                  <p className="text-[8px] text-gray-500 mt-0.5">{event.description}</p>
                )}
                <p className="text-[7px] text-gray-400 mt-0.5">
                  {event.source} • {new Date(event.eventDate).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Section 1: Input */}
      <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
        <h3 className="text-[9px] uppercase tracking-widest font-bold text-primary">AI BUYER INTELLIGENCE</h3>
        
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Website URL</label>
          <input
            type="text"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://example-coffee-company.com"
            className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[8px] uppercase tracking-wider text-gray-500 font-bold block">Analysis Mode</label>
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="analysisMode"
                value="cache"
                checked={analysisMode === 'cache'}
                onChange={() => setAnalysisMode('cache')}
                className="text-primary focus:ring-gold"
              />
              <span className="text-[9px] text-primary">Use Cache (30 days)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="analysisMode"
                value="refresh"
                checked={analysisMode === 'refresh'}
                onChange={() => setAnalysisMode('refresh')}
                className="text-primary focus:ring-gold"
              />
              <span className="text-[9px] text-primary">Refresh Analysis</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="analysisMode"
                value="force"
                checked={analysisMode === 'force'}
                onChange={() => setAnalysisMode('force')}
                className="text-primary focus:ring-gold"
              />
              <span className="text-[9px] text-primary font-bold">Force Re-analyze</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleAnalyzeWebsite}
            disabled={isAnalyzing || !websiteUrl}
            className="py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40 transition-all"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Website'}
          </button>
          <button
            onClick={handleSyncHistory}
            disabled={isSyncing || !result?.importerId}
            className="py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40 transition-all"
          >
            {isSyncing ? 'Syncing...' : 'Sync History'}
          </button>
          <button
            onClick={handleAutoDiscover}
            disabled={isAnalyzing || !websiteUrl}
            className="py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold text-primary cursor-pointer disabled:opacity-40 transition-all"
          >
            {isAnalyzing ? 'Running...' : 'Auto Discover'}
          </button>
        </div>

        {currentPhase && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <p className="text-[9px] text-blue-800 font-semibold">{currentPhase}</p>
          </div>
        )}

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-[9px] text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Section 3: Classification */}
          {renderClassification()}

          {/* Section 4: Contacts */}
          {renderContacts()}

          {/* Section 5: Portfolio */}
          {renderPortfolio()}

          {/* Section 6: Product Matching */}
          {renderProductMatching()}

          {/* Section 7: Buyer Scores */}
          {renderBuyerScores()}

          {/* Section 8: Buyer Insight */}
          {renderInsight()}

          {/* Section 11: Outreach Strategy */}
          {renderOutreachStrategy()}

          {/* Section 12: Email Preview */}
          {renderEmailPreview()}

          {/* Section 10: Timeline */}
          {renderTimeline()}

          {/* Actions */}
          <div className="flex gap-2">
            {result.importerId && (
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isAnalyzing}
                  className="flex-1 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40 transition-all"
                >
                  Refresh Analysis
                </button>
                <button
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="flex-1 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold text-primary cursor-pointer transition-all"
                >
                  {showEmailPreview ? 'Hide' : 'Show'} Email Draft
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}