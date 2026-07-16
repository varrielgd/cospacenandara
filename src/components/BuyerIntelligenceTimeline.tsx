import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface TimelineEvent {
  id: string;
  importerId: string;
  eventType: string;
  source: string;
  title: string;
  description: string | null;
  metadata: any;
  score: number | null;
  confidence: number | null;
  eventDate: string;
}

interface BuyerProfile {
  industry: string;
  companyType: string;
  importerScore: number;
  coffeeMatchScore: number;
  specialtyPotential: string;
  originPreference: string;
  preferredProcessing: string;
  likelyBuyingVolume: string;
  decisionMakerConfidence: string;
  communicationStyle: string;
  estimatedPurchaseFrequency: string;
  riskLevel: string;
  opportunityLevel: string;
  relationshipScore: string;
  nextBestAction: string;
  nextActionReason: string;
  productRelevance: Array<{ product: string; match: string; reason: string }>;
}

interface Props {
  importerId: string;
  importerName: string;
  websiteUrl: string;
  onIntelligenceLoaded?: (profile: BuyerProfile) => void;
}

const EVENT_ICONS: Record<string, string> = {
  'Website Analysis': '🌐',
  'Company Research': '🔍',
  'LinkedIn Analysis': '💼',
  'Previous Email Sent': '📤',
  'Buyer Reply': '📥',
  'Follow Up': '📨',
  'Quotation Sent': '📄',
  'Sample Offered': '📦',
  'Sample Sent': '📦',
  'Sample Delivered': '✅',
  'Sample Feedback': '💬',
  'Negotiation': '🤝',
  'Price Discussion': '💰',
  'Harvest Update': '🌾',
  'Meeting': '🤝',
  'Shipment': '🚢',
  'Contract': '📝',
  'Relationship Update': '❤️',
  'Internal Note': '📌',
  'AI Insight': '🤖'
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  'Cold': 'bg-blue-100 text-blue-800 border-blue-200',
  'Warm': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Hot': 'bg-orange-100 text-orange-800 border-orange-200',
  'Negotiation': 'bg-purple-100 text-purple-800 border-purple-200',
  'Ready to Buy': 'bg-green-100 text-green-800 border-green-200',
  'Long-term Client': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Lost': 'bg-red-100 text-red-800 border-red-200',
  'Dormant': 'bg-gray-100 text-gray-800 border-gray-200'
};

const MATCH_COLORS: Record<string, string> = {
  'Excellent': 'text-emerald-600 bg-emerald-50',
  'Good': 'text-blue-600 bg-blue-50',
  'Medium': 'text-yellow-600 bg-yellow-50',
  'Low': 'text-gray-500 bg-gray-50'
};

export default function BuyerIntelligenceTimeline({ importerId, importerName, websiteUrl, onIntelligenceLoaded }: Props) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showProductRelevance, setShowProductRelevance] = useState(false);

  const loadTimeline = async () => {
    if (!importerId) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/api/emails/timeline/${importerId}`);
      setTimeline(data.timeline || []);
      if (data.profile) {
        setProfile(data.profile);
        if (onIntelligenceLoaded) onIntelligenceLoaded(data.profile);
      }
    } catch (err) {
      console.error('[Timeline] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (importerId) {
      loadTimeline();
    }
  }, [importerId]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await api.post('/api/emails/sync-timeline', { importerId });
      alert(`Timeline synced: ${result.eventCount} events loaded from history`);
      loadTimeline();
    } catch (err: any) {
      alert('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) {
      alert('No website URL available for this buyer.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await api.post('/api/emails/analyze-website-deep', {
        importerId,
        websiteUrl
      });
      if (result.profile) {
        setProfile(result.profile);
        if (onIntelligenceLoaded) onIntelligenceLoaded(result.profile);
      }
      alert(`Website analysis complete! Business model: ${result.analysis?.businessModel || 'Unknown'}`);
      loadTimeline();
    } catch (err: any) {
      alert('Analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* AI Buyer Profile Summary */}
      {profile && (
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-sm p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[9px] uppercase tracking-widest font-bold text-emerald-800">AI Buyer Profile</h4>
            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${RELATIONSHIP_COLORS[profile.relationshipScore] || 'bg-gray-100 text-gray-600'}`}>
              {profile.relationshipScore}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
            <p><span className="text-gray-400">Industry:</span> {profile.industry}</p>
            <p><span className="text-gray-400">Type:</span> {profile.companyType}</p>
            <p><span className="text-gray-400">Importer Score:</span> 
              <span className="font-bold ml-1">{profile.importerScore}/100</span>
            </p>
            <p><span className="text-gray-400">Coffee Match:</span> 
              <span className="font-bold ml-1">{profile.coffeeMatchScore}/100</span>
            </p>
            <p><span className="text-gray-400">Specialty:</span> {profile.specialtyPotential}</p>
            <p><span className="text-gray-400">Volume:</span> {profile.likelyBuyingVolume}</p>
            <p><span className="text-gray-400">Risk:</span> {profile.riskLevel}</p>
            <p><span className="text-gray-400">Opportunity:</span> {profile.opportunityLevel}</p>
          </div>

          {/* Next Best Action */}
          <div className="bg-emerald-100/50 border border-emerald-200 rounded-sm p-2 mt-1">
            <p className="text-[8px] uppercase tracking-widest font-bold text-emerald-700">Next Best Action</p>
            <p className="text-[10px] font-bold text-emerald-900">{profile.nextBestAction}</p>
            <p className="text-[8px] text-emerald-700 mt-0.5">{profile.nextActionReason}</p>
          </div>

          {/* Product Relevance Toggle */}
          {profile.productRelevance && profile.productRelevance.length > 0 && (
            <div>
              <button
                onClick={() => setShowProductRelevance(!showProductRelevance)}
                className="text-[8px] uppercase tracking-widest font-bold text-primary hover:text-gold cursor-pointer"
              >
                {showProductRelevance ? '▼ Hide' : '▶ Show'} Product Relevance ({profile.productRelevance.length} products)
              </button>
              {showProductRelevance && (
                <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                  {profile.productRelevance.map((pr, i) => (
                    <div key={i} className="flex items-start gap-1.5 p-1 rounded-sm bg-white/50">
                      <span className={`px-1 py-0.5 text-[7px] font-bold rounded-sm ${MATCH_COLORS[pr.match] || 'text-gray-500'}`}>
                        {pr.match}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-semibold truncate">{pr.product}</p>
                        <p className="text-[7px] text-gray-500 truncate">{pr.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAnalyzeWebsite}
          disabled={isAnalyzing || !websiteUrl}
          className="flex-1 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Website'}
        </button>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex-1 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer disabled:opacity-40"
        >
          {isSyncing ? 'Syncing...' : 'Sync History'}
        </button>
      </div>

      {/* Timeline Events */}
      <div>
        <h4 className="text-[9px] uppercase tracking-widest font-bold text-primary mb-2 flex items-center justify-between">
          <span>Activity Timeline ({timeline.length} events)</span>
          {isLoading && <span className="text-gray-400 animate-pulse">Loading...</span>}
        </h4>

        {timeline.length === 0 && !isLoading && (
          <div className="text-center py-6 text-gray-400">
            <p className="text-[10px]">No timeline events yet.</p>
            <p className="text-[8px] mt-1">Click "Sync History" to load existing data or "Analyze Website" to start.</p>
          </div>
        )}

        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {timeline.map((event) => (
            <div
              key={event.id}
              className="bg-white border border-gray-100 rounded-sm hover:border-primary/20 cursor-pointer transition-all"
              onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
            >
              <div className="p-2 flex items-start gap-2">
                <span className="text-sm shrink-0 mt-0.5">{EVENT_ICONS[event.eventType] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-semibold truncate">{event.title}</p>
                    <span className="text-[7px] text-gray-400 shrink-0">{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[7px] px-1 py-0.5 bg-gray-100 rounded-sm text-gray-500 uppercase">{event.eventType}</span>
                    <span className="text-[7px] px-1 py-0.5 bg-gray-50 rounded-sm text-gray-400">{event.source}</span>
                    {event.score !== null && (
                      <span className={`w-1.5 h-1.5 rounded-full ${getScoreColor(event.score)}`} title={`Score: ${event.score}`} />
                    )}
                  </div>
                  {expandedEvent === event.id && event.description && (
                    <p className="text-[8px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-50">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}