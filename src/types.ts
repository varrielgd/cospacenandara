// Original types used across the application
export interface Lead {
  id: string;
  companyName: string;
  website?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  country: string;
  city?: string;
  address?: string;
  businessType?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  importLicenseNumber?: string;
  annualVolumeBags?: number;
  estimatedBuyingCapacity?: number;
  targetMoqBags?: number;
  preferredIncoterm?: string;
  isRepeatClient?: boolean;
  coffeeType?: string;
  greenBeanInterest?: boolean;
  roastedBeanInterest?: boolean;
  leadScore?: 'A+' | 'A' | 'B+' | 'B' | 'C';
  confidenceScore?: number;
  status: string;
  notes?: string;
  emailValidation?: 'VALID' | 'INVALID' | 'CATCH_ALL' | 'UNKNOWN';
  emailValidatedAt?: string;
  dateAdded: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  leadId: string;
  importerId?: string;
  subject: string;
  body: string;
  from: string;
  to: string;
  recipientEmail?: string;
  cc?: string;
  bcc?: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Received' | 'Bounced' | 'Draft Generated' | 'Pending Review' | 'Edited By User';
  direction: 'INBOUND' | 'OUTBOUND';
  isAiGenerated: boolean;
  sentAt?: string;
  receivedAt?: string;
  attachPdfQuotation: string | boolean;
  attachCatalogue?: boolean;
  catalogueDriveLink?: string;
  attachSampleOffer?: boolean;
  sampleOfferDriveLink?: string;
  attachCompanyProfile?: boolean;
  companyProfileDriveLink?: string;
  attachPriceList?: boolean;
  priceListDriveLink?: string;
  attachSampleProgram?: boolean;
  sampleProgramDriveLink?: string;
  attachQuotation?: boolean;
  quotationDriveLink?: string;
  attachProformaInvoice?: boolean;
  proformaInvoiceDriveLink?: string;
  analysisMatch?: any;
  approved?: boolean;
  draftGeneratedAt?: string;
  pendingReviewAt?: string;
  editedByUserAt?: string;
  approvedAt?: string;
  readyToSendAt?: string;
  sentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sample {
  id: string;
  leadId: string;
  sampleRequestDate: string;
  product: string;
  format: 'Green Beans' | 'Roasted Beans' | 'Ground Coffee';
  weight: string;
  trackingNumber?: string;
  courier?: string;
  destination: string;
  status: 'Requested' | 'Quoted' | 'Payment Confirmed' | 'Preparing' | 'Shipped' | 'Delivered' | 'Feedback Received' | 'Commercial Order' | 'Cancelled';
  paymentStatus: 'PENDING' | 'CONFIRMED';
  shipmentDate?: string;
  deliveryDate?: string;
  feedback?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  leadId: string;
  leadCompanyName: string;
  type: 'Sample' | 'Commercial';
  shipmentType: 'Air Freight' | 'LCL Shipment' | 'FCL Shipment' | 'Sample Order';
  packaging: 'Vacuum GrainPro 5kg' | 'GrainPro 10-15kg' | 'GrainPro Jute 30-60kg';
  paymentTerms: 'TT 50% Deposit + 50% Before Shipment' | 'LC At Sight';
  incoterm: 'FOB' | 'CIF' | 'EXW' | 'CNF';
  product: string;
  quantity: number;
  price: number;
  currency: string;
  leadTimeDays: number;
  validUntil: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  pdfPath?: string;
  dateCreated: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  googleAppsScriptUrl: string;
  isSynced: boolean;
}

// New types for AI Buyer Intelligence
export interface PersonContact {
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  phone?: string;
  linkedin?: string;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AutoDiscoverResult {
  classification: any;
  contacts: any;
  allContacts: PersonContact[];
  portfolio: any;
  productMatches: any[];
  bestProducts: string[];
  gapAnalysis: string;
  scores: any;
  insight: any;
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