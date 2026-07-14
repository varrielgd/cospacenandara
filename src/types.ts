export interface Lead {
  id: string;
  dateAdded: string;
  companyName: string;
  country: string;
  city: string;
  state?: string;
  website: string;
  contactPage: string;
  email: string;
  phone: string;
  whatsapp?: string;
  linkedin: string;
  leadType: string;
  leadScore: 'A' | 'B' | 'C' | 'A+' | 'B+';
  status:
    | 'New Lead'
    | 'Contacted'
    | 'Replied'
    | 'Sample Requested'
    | 'Sample Sent'
    | 'Negotiation'
    | 'Quotation Sent'
    | 'Order Confirmed'
    | 'Closed Won'
    | 'Closed Lost';
  lastContact: string; // ISO date or descriptive
  notes: string;
  // Dynamic analysis fields (Module 3)
  analysisType?: string;
  analysisFocus?: string;
  analysisPotential?: string;
  analysisMatch?: string;
  analysisWhy?: string;
  
  // Confidence Scores (Real Data Policy)
  websiteConfidence?: 'High' | 'Medium' | 'Low';
  emailConfidence?: 'High' | 'Medium' | 'Low';
  importerConfidence?: 'High' | 'Medium' | 'Low';
  importerProbability?: 'High' | 'Medium' | 'Low';
  
  // New fields from updated schema
  businessType?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  importLicenseNumber?: string;
  annualVolumeBags?: number;
  estimatedBuyingCapacity?: number;
  targetMoqBags?: number;
  preferredIncoterm?: 'FOB' | 'CIF' | 'EXW' | 'CNF';
  isRepeatClient?: boolean;
}

export type EmailStatus = 
  | 'Draft Generated' 
  | 'Pending Review' 
  | 'Edited By User' 
  | 'Approved' 
  | 'Ready To Send' 
  | 'Sent';

export interface EmailLog {
  id: string;
  leadId?: string; // matches importerId in Prisma
  subject: string;
  body: string;
  to?: string; // recipient email
  cc?: string;
  bcc?: string;
  status: EmailStatus;
  approved: boolean;
  attachPdfQuotation: string; // e.g. quote number or "none"
  attachCatalogue: boolean;
  catalogueDriveLink?: string;
  attachSampleOffer: boolean;
  sampleOfferDriveLink?: string;
  // New attachments
  attachCompanyProfile: boolean;
  companyProfileDriveLink?: string;
  attachPriceList: boolean;
  priceListDriveLink?: string;
  attachSampleProgram: boolean;
  sampleProgramDriveLink?: string;
  attachQuotation: boolean;
  quotationDriveLink?: string;
  attachProformaInvoice: boolean;
  proformaInvoiceDriveLink?: string;
  
  // Timestamps
  draftGeneratedAt?: string;
  pendingReviewAt?: string;
  editedByUserAt?: string;
  approvedAt?: string;
  readyToSendAt?: string;
  sentAt?: string;
  sentDate?: string; // legacy support (e.g. YYYY-MM-DD)
  
  // For backwards compatibility
  emailSubject?: string;
  emailBody?: string;
  recipientEmail?: string;
}

export interface Sample {
  id: string;
  leadId: string;
  product: string;
  weight: string; // e.g., "500g", "1kg"
  courier: string;
  trackingNumber: string;
  status: 'Preparing' | 'Shipped' | 'Delivered';
  destinationCountry: string;
  sampleRequestDate: string;
  moistureReading?: number;
}

export interface Quotation {
  quoteNumber: string;
  leadId: string;
  product: string;
  quantity: string; // e.g., "10 Metric Tons"
  price: number; // FOB / CIF rate
  incoterm: string; // e.g., "FOB Belawan", "CIF Hamburg"
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  dateCreated: string;
}



export interface SystemConfig {
  googleAppsScriptUrl: string;
  isSynced: boolean;
}

export interface Supplier {
  id: string;
  companyName: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  coffeeTypes: string | null;
  certifications: string | null;
  minimumOrderQty: string | null;
  createdAt: string;
  updatedAt: string;
  contacts?: SupplierContact[];
  notes?: SupplierNote[];
  activities?: any[];
}

export interface SupplierContact {
  id: string;
  supplierId: string;
  firstName: string;
  lastName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierNote {
  id: string;
  supplierId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
