import React, { useState } from 'react';
import { SystemConfig, Lead, EmailLog, Sample, Quotation } from '../types';

interface SheetsIntegrationViewProps {
  config: SystemConfig;
  leads: Lead[];
  emails: EmailLog[];
  samples: Sample[];
  quotations: Quotation[];
  onUpdateConfig: (url: string) => void;
  onSyncAll: () => Promise<void>;
}

export default function SheetsIntegrationView({ 
  config, 
  leads, 
  emails, 
  samples, 
  quotations, 
  onUpdateConfig,
  onSyncAll
}: SheetsIntegrationViewProps) {
  const [urlInput, setUrlInput] = useState(config.googleAppsScriptUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  // Apps Script Code Block
  const appsScriptCode = `/**
 * COFFEE IMPORTER INTELLIGENCE SYSTEM (CIIS)
 * Google Apps Script Backend for Nandara Nusa Montierra
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click Save (Disk icon).
 * 5. Click Deploy > New deployment.
 * 6. Select type "Web app".
 * 7. Set "Execute as" to "Me".
 * 8. Set "Who has access" to "Anyone".
 * 9. Click Deploy, Authorize access, and copy the Web App URL.
 * 10. Paste the Web App URL in the CIIS Settings to enable real-time synchronization!
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheetHeaders(ss);
  
  var action = e.parameter.action;
  
  if (action === "getData") {
    var data = {
      leads: getSheetRows(ss.getSheetByName("LEADS")),
      emails: getSheetRows(ss.getSheetByName("EMAILS")),
      samples: getSheetRows(ss.getSheetByName("SAMPLES")),
      quotations: getSheetRows(ss.getSheetByName("QUOTATIONS")),
      origins: getSheetRows(ss.getSheetByName("ORIGINS"))
    };
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "connected", message: "Nandara CIIS Apps Script is Active!" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheetHeaders(ss);
  
  var result = { success: false, message: "" };
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    if (action === "syncAll") {
      syncTable(ss.getSheetByName("LEADS"), payload.leads, [
        "Lead ID", 
        "Date Added", 
        "Company Name", 
        "Country", 
        "City", 
        "Website", 
        "Contact Page", 
        "Email", 
        "Phone", 
        "LinkedIn", 
        "Lead Type", 
        "Lead Score", 
        "Status", 
        "Last Contact", 
        "Notes", 
        "Website Confidence", 
        "Email Confidence", 
        "Importer Confidence", 
        "Importer Probability", 
        "Recommended Product Match", 
        "Match Justification"
      ], "LEADS");

      syncTable(ss.getSheetByName("EMAILS"), payload.emails, [
        "Lead ID", 
        "Company Name", 
        "Email", 
        "Draft Date", 
        "Approved Date", 
        "Sent Date", 
        "Status", 
        "Last Follow Up", 
        "Notes"
      ], "EMAILS");

      syncTable(ss.getSheetByName("SAMPLES"), payload.samples, [
        "Lead ID", 
        "Product", 
        "Weight", 
        "Courier", 
        "Tracking Number", 
        "Status"
      ], "SAMPLES");

      syncTable(ss.getSheetByName("QUOTATIONS"), payload.quotations, [
        "Quote Number", 
        "Lead ID", 
        "Product", 
        "Quantity", 
        "Price", 
        "Incoterm", 
        "Status"
      ], "QUOTATIONS");
      
      result.success = true;
      result.message = "All sheets successfully updated!";
    } else {
      result.message = "Unknown action: " + action;
    }
  } catch (err) {
    result.success = false;
    result.message = err.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupSheetHeaders(ss) {
  var sheets = {
    "LEADS": [
      "Lead ID", 
      "Date Added", 
      "Company Name", 
      "Country", 
      "City", 
      "Website", 
      "Contact Page", 
      "Email", 
      "Phone", 
      "LinkedIn", 
      "Lead Type", 
      "Lead Score", 
      "Status", 
      "Last Contact", 
      "Notes", 
      "Website Confidence", 
      "Email Confidence", 
      "Importer Confidence", 
      "Importer Probability", 
      "Recommended Product Match", 
      "Match Justification"
    ],
    "EMAILS": [
      "Lead ID", 
      "Company Name", 
      "Email", 
      "Draft Date", 
      "Approved Date", 
      "Sent Date", 
      "Status", 
      "Last Follow Up", 
      "Notes"
    ],
    "SAMPLES": [
      "Lead ID", 
      "Product", 
      "Weight", 
      "Courier", 
      "Tracking Number", 
      "Status"
    ],
    "QUOTATIONS": [
      "Quote Number", 
      "Lead ID", 
      "Product", 
      "Quantity", 
      "Price", 
      "Incoterm", 
      "Status"
    ],
    "ORIGINS": [
      "Origin ID",
      "Name",
      "Type",
      "Soil",
      "Altitude",
      "Process",
      "Flavor Notes",
      "Available Products",
      "Coords X",
      "Coords Y"
    ]
  };
  
  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // We clear formatting and size before writing standard rows and headers
    sheet.clear();
    sheet.appendRow(sheets[name]);
    sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight("bold").setBackground("#05190F").setFontColor("#D4AF37");
  }
}

function getSheetRows(sheet) {
  if (!sheet) return [];
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var rawRow = values[i];
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = rawRow[j];
    }
    rows.push(row);
  }
  return rows;
}

function syncTable(sheet, items, headers, tabName) {
  if (!sheet || !items) return;
  sheet.clear();
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#05190F").setFontColor("#D4AF37");
  
  if (items.length === 0) return;
  
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var key = mapHeaderToKey(header, tabName);
      row.push(item[key] !== undefined ? item[key] : "");
    }
    rows.push(row);
  }
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function mapHeaderToKey(h, tabName) {
  var mappings = {
    "Lead ID": "leadId",
    "Date Added": "dateAdded",
    "Company Name": "companyName",
    "Country": "country",
    "City": "city",
    "Website": "website",
    "Contact Page": "contactPage",
    "Email": "email",
    "Phone": "phone",
    "LinkedIn": "linkedin",
    "Lead Type": "leadType",
    "Lead Score": "leadScore",
    "Status": "status",
    "Last Contact": "lastContact",
    "Notes": "notes",
    "Website Confidence": "websiteConfidence",
    "Email Confidence": "emailConfidence",
    "Importer Confidence": "importerConfidence",
    "Importer Probability": "importerProbability",
    "Recommended Product Match": "analysisMatch",
    "Match Justification": "analysisWhy",
    
    "Draft Date": "draftGeneratedAt",
    "Approved Date": "approvedAt",
    "Sent Date": "sentAt",
    "Last Follow Up": "readyToSendAt",
    
    "Product": "product",
    "Weight": "weight",
    "Courier": "courier",
    "Tracking Number": "trackingNumber",
    "Quote Number": "quoteNumber",
    "Quantity": "quantity",
    "Price": "price",
    "Incoterm": "incoterm"
  };
  
  var key = mappings[h] || h;
  if (tabName === "EMAILS" && h === "Email") {
    return "recipientEmail";
  }
  return key;
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpdateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(urlInput);
    alert('URL saved successfully! Trigger a manual synchronization below.');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setStatusMsg('');
    try {
      await onSyncAll();
      setSyncStatus('success');
      setStatusMsg('Ledger successfully synced with Google Sheets! Sheets: LEADS, EMAILS, SAMPLES, QUOTATIONS.');
    } catch (err: any) {
      setSyncStatus('failed');
      setStatusMsg('Connection failed: ' + (err.message || 'Verify Web App credentials or CORS routing.'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="sheets-integration-root">
      {/* Left Column: Apps Script URL settings & Synced status */}
      <div className="lg:col-span-1 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-5 h-fit">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="p-2.5 bg-primary text-gold rounded-sm">
            
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Ledger Settings</h3>
            <p className="text-xs text-text-dim mt-0.5 font-sans">Google Sheets Synchronization</p>
          </div>
        </div>

        {/* Sync Indicator Dashboard Preview */}
        <div className="p-5 rounded-sm border border-[#F6F2E8] bg-[#F7F4EC]/30 space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center bg-white p-3 border border-primary/5 rounded-sm shadow-xs">
             <div className="flex items-center gap-2">
                 
                 <span className="text-primary font-serif font-bold text-sm">Cloud Ledger Pipeline</span>
             </div>
            {config.googleAppsScriptUrl ? (
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm font-sans text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wide">
                 Connected
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 rounded-sm font-sans text-[9px] font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                 Local Only
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 font-sans">
            <div className="p-3.5 bg-white border border-primary/10 rounded-sm hover:border-gold/50 transition-all cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest font-bold">LEADS</p>
                  
                </div>
                <div className="flex justify-between items-end">
                    <span className="font-serif text-3xl font-bold text-primary leading-none">{leads.length}</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Rows</span>
                </div>
            </div>
            <div className="p-3.5 bg-white border border-primary/10 rounded-sm hover:border-gold/50 transition-all cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest font-bold">EMAILS</p>
                  
                </div>
                <div className="flex justify-between items-end">
                    <span className="font-serif text-3xl font-bold text-primary leading-none">{emails.length}</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Rows</span>
                </div>
            </div>
            <div className="p-3.5 bg-white border border-primary/10 rounded-sm hover:border-gold/50 transition-all cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest font-bold">SAMPLES</p>
                  
                </div>
                <div className="flex justify-between items-end">
                    <span className="font-serif text-3xl font-bold text-primary leading-none">{samples.length}</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Rows</span>
                </div>
            </div>
            <div className="p-3.5 bg-white border border-primary/10 rounded-sm hover:border-gold/50 transition-all cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest font-bold">QUOTES</p>
                  
                </div>
                <div className="flex justify-between items-end">
                    <span className="font-serif text-3xl font-bold text-primary leading-none">{quotations.length}</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Rows</span>
                </div>
            </div>
          </div>
        </div>

        {/* Credentials URL Form */}
        <form onSubmit={handleUpdateUrl} className="space-y-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-primary font-bold uppercase tracking-widest text-[9px] block">Apps Script Web App URL</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="w-full bg-bg-ivory/40 border border-primary/20 rounded-sm px-3 py-2.5 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold outline-hidden font-sans"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-2.5 border border-gold hover:border-neutral-950 text-primary hover:bg-[#F6F2E8]/40 rounded-sm font-mono tracking-widest font-bold text-[9px] cursor-pointer transition-all uppercase"
            >
              Save URL config
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handleManualSync}
              className="flex-1 py-2 bg-primary text-white hover:bg-neutral-950 hover:text-gold border border-gold/45 rounded-sm font-mono tracking-widest font-bold text-[9px] shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all uppercase"
            >
              
              {isSyncing ? "Syncing..." : "Sync Ledger"}
            </button>
          </div>
        </form>

        {/* Action Feed Status logs */}
        {syncStatus !== 'idle' && (
          <div className={`p-4 rounded-sm text-xs space-y-1.5 border ${
            syncStatus === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex justify-between items-start">
               <p className="font-mono uppercase tracking-widest text-[9px] font-bold">{syncStatus === 'success' ? '✔ Sync Completed!' : '✕ Sync Flagged'}</p>
               {syncStatus === 'success' && (
                 <span className="font-mono text-[9px] opacity-75">{new Date().toLocaleTimeString()}</span>
               )}
            </div>
            <p className="text-[11px] leading-relaxed italic font-sans">{statusMsg}</p>
          </div>
        )}
      </div>

      {/* Right Column: Google Sheets Code Terminal Setup */}
      <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury flex flex-col justify-between" id="sheets-configuration-guide">
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold tracking-widest text-[#05190F] uppercase font-mono">Script Editor Console</h3>
              <p className="text-xs text-text-dim mt-0.5 font-sans">Google Sheet automation macros</p>
            </div>
            
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 bg-bg-ivory/40 hover:bg-white border border-primary/10 hover:border-gold rounded-sm text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all text-primary font-bold"
            >
              {isCopied ?  : }
              {isCopied ? "Copied" : "Copy Code"}
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Guide Step description */}
            <div className="bg-primary text-white border border-gold/35 rounded-sm p-5 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-white/10">
                
                <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-gold text-sm">
                  Deploy Google Sheets in 3 Minutes
                </h4>
              </div>
              <ul className="list-decimal list-inside space-y-2 font-light text-gray-200 text-[11px] font-mono leading-relaxed">
                <li>Create a blank Google Sheet in your Google Workspace Drive.</li>
                <li>Go to <span className="font-sans text-white font-bold bg-white/10 px-1.5 py-0.5 rounded-sm">Extensions &gt; Apps Script</span>.</li>
                <li>Clear any template code, paste the script code in the console, and Save.</li>
                <li>Click <span className="font-sans text-white font-bold bg-white/10 px-1.5 py-0.5 rounded-sm">Deploy &gt; New Deployment</span>. Select <span className="font-bold text-gold">Web App</span>.</li>
                <li>Set Executed As: <span className="font-bold text-gold">Me</span>, and Access: <span className="font-bold text-[#D4AF37]">Anyone</span>.</li>
              </ul>
            </div>

            {/* Micro Scroll Code Preview block */}
            <pre className="p-4 bg-primary text-gray-100 font-mono text-[10px] leading-relaxed rounded-sm overflow-x-auto max-h-[250px] border border-white/5 scrollbar-thin">
              {appsScriptCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
