import React, { useState } from 'react';
import { Lead, Sample } from '../types';
import { 
  Coffee, 
  MapPin, 
  CheckCircle, 
  Award, 
  ChevronRight, 
  ShieldCheck, 
  Beaker, 
  Send, 
  Layers, 
  FileText, 
  Calendar,
  Sparkles,
  Info,
  Compass
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import IndonesiaMap from './IndonesiaMap';

interface BrandPortalViewProps {
  leads: Lead[];
  onAddSample: (sample: Omit<Sample, 'id' | 'sampleRequestDate'>) => void;
  onAddLeadManual: (lead: Omit<Lead, 'id' | 'dateAdded'>) => void;
  googleAppsScriptUrl?: string; // Powered by dynamic Google Sheets integration
}

interface CoffeeProduct {
  id: string;
  name: string;
  collection: 'Classic Origins' | 'Modern Specialty' | 'Rare & Microlot' | 'Fine Robusta';
  origin: string;
  altitude: string;
  varietal: string;
  process: string;
  moisture: string;
  screenSize: string;
  cuppingScore: number;
  body: string;
  acidity: string;
  harvest: string;
  packaging: string;
  shelfLife: string;
  cupProfile: string;
  radarData: Array<{ subject: string; score: number }>;
}

const PRODUCTS_CATALOGUE: CoffeeProduct[] = [
  {
    id: "gayo_g1",
    name: "Aceh Gayo Grade 1",
    collection: "Classic Origins",
    origin: "Sumatera (Aceh Gayo Highlands)",
    altitude: "1,200 - 1,500 masl",
    varietal: "Gayo 1, Gayo 2, Ateng",
    process: "Wet Hulled (Giling Basah)",
    moisture: "Max 13%",
    screenSize: "16-18 (Double Picked)",
    cuppingScore: 83.5,
    body: "Full & Syrupy",
    acidity: "Low & Sweet",
    harvest: "October - December & March - May",
    packaging: "GrainPro + Jute Bag",
    shelfLife: "24 Months",
    cupProfile: "Karakter rasa klasik Indonesia dengan aroma cedarwood, tobacco notes, cokelat hitam pekat, dan sweet herbal finish.",
    radarData: [
      { subject: 'Aroma', score: 8.0 },
      { subject: 'Acidity', score: 6.0 },
      { subject: 'Body', score: 9.0 },
      { subject: 'Sweetness', score: 7.0 },
      { subject: 'Complexity', score: 7.0 },
      { subject: 'Balance', score: 8.0 },
    ]
  },
  {
    id: "gayo_wild",
    name: "Gayo Wild Natural",
    collection: "Modern Specialty",
    origin: "Sumatera (Gayo Highlands)",
    altitude: "1,200 – 1,700 masl",
    varietal: "Tim Tim, Bourbon",
    process: "Wild Natural",
    moisture: "Max 12%",
    screenSize: "15-17",
    cuppingScore: 85.5,
    body: "Medium & Juicy",
    acidity: "Complex & Bright",
    harvest: "October - December",
    packaging: "GrainPro + Vacuum Bag",
    shelfLife: "24 Months",
    cupProfile: "Aromatics of sweet berries. Cup profile features dried strawberry, citrus zest, dark chocolate elegance, brown sugar sweetness, and dried fruits finish.",
    radarData: [
      { subject: 'Aroma', score: 9.0 },
      { subject: 'Acidity', score: 8.5 },
      { subject: 'Body', score: 7.0 },
      { subject: 'Sweetness', score: 8.0 },
      { subject: 'Complexity', score: 9.0 },
      { subject: 'Balance', score: 8.0 },
    ]
  },
  {
    id: "java_preanger",
    name: "Java Preanger Reserve",
    collection: "Modern Specialty",
    origin: "Java (Java Preanger Volcanic Highlands)",
    altitude: "1,300 – 1,600 masl",
    varietal: "Andungsari, Sigarar Utang",
    process: "Semi-Washed",
    moisture: "Max 12.5%",
    screenSize: "16-17",
    cuppingScore: 84.5,
    body: "Smooth & Round",
    acidity: "Elegant & Symmetrical",
    harvest: "June - September",
    packaging: "GrainPro + Vacuum Bag",
    shelfLife: "24 Months",
    cupProfile: "Rasa yang bersih, seimbang, dengan manis karamel yang elegan, sentuhan teh hitam, citrus lembut, dan clean finish.",
    radarData: [
      { subject: 'Aroma', score: 8.5 },
      { subject: 'Acidity', score: 7.5 },
      { subject: 'Body', score: 7.5 },
      { subject: 'Sweetness', score: 8.5 },
      { subject: 'Complexity', score: 7.5 },
      { subject: 'Balance', score: 8.5 },
    ]
  },
  {
    id: "bali_kintamani",
    name: "Bali Kintamani",
    collection: "Modern Specialty",
    origin: "Bali (Kintamani Highlands)",
    altitude: "1,200 - 1,400 masl",
    varietal: "USDA 762, Kartika",
    process: "Natural Process",
    moisture: "Max 12%",
    screenSize: "15-17",
    cuppingScore: 84.75,
    body: "Juicy & Creamy",
    acidity: "Vibrant Citrus",
    harvest: "May - August",
    packaging: "GrainPro + Vacuum Bag",
    shelfLife: "24 Months",
    cupProfile: "Khas dataran tinggi Bali yang dikelilingi kebun jeruk. Rasa kesegaran buah tropical fruit, orange peel, sweet honey, dan body yang tebal.",
    radarData: [
      { subject: 'Aroma', score: 8.5 },
      { subject: 'Acidity', score: 8.0 },
      { subject: 'Body', score: 7.5 },
      { subject: 'Sweetness', score: 8.0 },
      { subject: 'Complexity', score: 8.0 },
      { subject: 'Balance', score: 8.0 },
    ]
  },
  {
    id: "flores_volcanic",
    name: "Flores Volcanic Fully Washed",
    collection: "Modern Specialty",
    origin: "Flores (Bajawa Plateau)",
    altitude: "1,250 - 1,600 masl",
    varietal: "S-Line, Kartika",
    process: "Fully Washed",
    moisture: "Max 12.5%",
    screenSize: "15-18",
    cuppingScore: 84.25,
    body: "Medium & Velvet",
    acidity: "Soft Citrus Brightness",
    harvest: "June - September",
    packaging: "GrainPro + Vacuum Bag",
    shelfLife: "24 Months",
    cupProfile: "Tumbuh di tanah vulkanik subur NTT. Aroma nutty yang segar, chocolatey, soft citrus brightness, dan very clean aftertaste.",
    radarData: [
      { subject: 'Aroma', score: 8.0 },
      { subject: 'Acidity', score: 7.5 },
      { subject: 'Body', score: 8.0 },
      { subject: 'Sweetness', score: 7.5 },
      { subject: 'Complexity', score: 7.0 },
      { subject: 'Balance', score: 8.0 },
    ]
  },
  {
    id: "toraja_reserve",
    name: "Toraja Reserve",
    collection: "Modern Specialty",
    origin: "Sulawesi (Tana Toraja Kalosi)",
    altitude: "1,300 - 1,800 masl",
    varietal: "S795, Bourbon",
    process: "Fully Washed & Wet Hulled Blend",
    moisture: "Max 12.8%",
    screenSize: "16-18",
    cuppingScore: 85.0,
    body: "Thick & Smooth Body",
    acidity: "Low & Saturated",
    harvest: "July - October",
    packaging: "GrainPro + Vacuum Bag",
    shelfLife: "24 Months",
    cupProfile: "Karakter kopi Sulawesi yang tebal berkabut (smooth body) dengan kompleksitas rasa rempah manis, layered dark cacao, dan black pepper.",
    radarData: [
      { subject: 'Aroma', score: 8.0 },
      { subject: 'Acidity', score: 6.0 },
      { subject: 'Body', score: 9.0 },
      { subject: 'Sweetness', score: 7.5 },
      { subject: 'Complexity', score: 8.0 },
      { subject: 'Balance', score: 8.0 },
    ]
  },
  {
    id: "gayo_lb",
    name: "Gayo LB Reserve",
    collection: "Rare & Microlot",
    origin: "Sumatera (Gayo Highlands High Traceable Canopy)",
    altitude: "1,500 - 1,850 masl",
    varietal: "Abyssinia, Bourbon",
    process: "Specialty Semi-Washed",
    moisture: "Max 12.2%",
    screenSize: "17-18",
    cuppingScore: 86.5,
    body: "Silky & Rich",
    acidity: "Refined & Tangy",
    harvest: "November - February (Limited Yield)",
    packaging: "GrainPro + Vacuum Bag",
    shelfLife: "24 Months",
    cupProfile: "Koleksi microlot langka untuk specialty roasters internasional. Floral jasmine aroma, notes of juicy white peach, honey manis, bergamot, dan clean cedarwood finish.",
    radarData: [
      { subject: 'Aroma', score: 9.5 },
      { subject: 'Acidity', score: 8.0 },
      { subject: 'Body', score: 8.0 },
      { subject: 'Sweetness', score: 9.0 },
      { subject: 'Complexity', score: 9.5 },
      { subject: 'Balance', score: 8.8 },
    ]
  },
  {
    id: "lampung_reserve",
    name: "Lampung Reserve Robusta",
    collection: "Fine Robusta",
    origin: "Sumatera (Lampung Coast Highlands)",
    altitude: "400 - 800 masl",
    varietal: "Robusta BP Series",
    process: "Natural Process",
    moisture: "Max 13%",
    screenSize: "14-16",
    cuppingScore: 81.0,
    body: "Heavy & Chewy",
    acidity: "Virtually None",
    harvest: "May - August",
    packaging: "GrainPro + Jute Bag",
    shelfLife: "24 Months",
    cupProfile: "Premium Robusta, medium-dark roasted profile. Bold dark chocolate, toasted walnut, nutty aroma, and extremely low acidity. Perfect for high-end espresso base blends.",
    radarData: [
      { subject: 'Aroma', score: 7.0 },
      { subject: 'Acidity', score: 3.0 },
      { subject: 'Body', score: 9.5 },
      { subject: 'Sweetness', score: 6.0 },
      { subject: 'Complexity', score: 5.5 },
      { subject: 'Balance', score: 7.5 },
    ]
  },
  {
    id: "temanggung_fine",
    name: "Temanggung Fine Robusta",
    collection: "Fine Robusta",
    origin: "Java (Temanggung Highlands)",
    altitude: "800 - 1,000 masl",
    varietal: "Robusta SA 237",
    process: "Natural Process",
    moisture: "Max 12.5%",
    screenSize: "15-17",
    cuppingScore: 82.5,
    body: "Full & Clean",
    acidity: "Soft Milk Sweetness",
    harvest: "June - September",
    packaging: "GrainPro + Jute Bag",
    shelfLife: "24 Months",
    cupProfile: "Fine Robusta berkualitas tinggi dari Temanggung. Karakter rasa yang sangat tebal namun bersih, aroma roasted hazelnut, malted sweetness, dan black tea notes.",
    radarData: [
      { subject: 'Aroma', score: 7.5 },
      { subject: 'Acidity', score: 4.0 },
      { subject: 'Body', score: 9.0 },
      { subject: 'Sweetness', score: 7.0 },
      { subject: 'Complexity', score: 6.0 },
      { subject: 'Balance', score: 8.0 },
    ]
  }
];

interface OriginTerritory {
  id: string;
  name: string;
  type: string;
  soil: string;
  elevation: string;
  varietals: string;
  character: string;
  process: string;
  flavorNotes: string;
  availableProducts: string;
  lat: number;
  lng: number;
}

const ORIGINS_DATA: OriginTerritory[] = [
  {
    id: "aceh_gayo",
    name: "Aceh Gayo",
    type: "Arabica",
    soil: "Andosol & Regosol (Rich Volcanic Soil)",
    elevation: "1,200 – 1,700 masl",
    varietals: "Gayo 1, Gayo 2, Ateng, Tim Tim",
    character: "Wet-hulled processing offers spicy, herbal complexity, deep cedar aroma, very full syrupy body, and gentle, clean acidity.",
    process: "Wet Hulled (Giling Basah) / Natural",
    flavorNotes: "Cedarwood, dark chocolate, sweet tobacco, herbal finish",
    availableProducts: "Aceh Gayo Grade 1, Gayo Wild Natural, Gayo LB Reserve",
    lat: 4.69,
    lng: 96.84,
  },
  {
    id: "mandheling",
    name: "Mandheling",
    type: "Arabica",
    soil: "Volcanic clay loam",
    elevation: "1,100 – 1,400 masl",
    varietals: "Typica, Lasuna",
    character: "Wet-hulled processing offers spicy, earthy complexity, tobacco notes, dense herbal finish, and extremely heavy body.",
    process: "Wet Hulled (Giling Basah)",
    flavorNotes: "Herbal complexity, dark cocoa, cedarwood, massive syrupy body",
    availableProducts: "Sumatra Mandheling Premium",
    lat: 1.0,
    lng: 99.0,
  },
  {
    id: "lintong",
    name: "Lintong",
    type: "Arabica",
    soil: "Highly fertile, rich organic volcanic ash",
    elevation: "1,300 – 1,500 masl",
    varietals: "Sigarar Utang, Lasuna",
    character: "Clean cup with rich sweetness, herbal complexity, earthy cedar notes, bold persistent body with lower acidic tones.",
    process: "Wet Hulled (Giling Basah)",
    flavorNotes: "Spicy herbal complex, premium dark chocolate, cedar woods, pristine clean body",
    availableProducts: "Lintong Specialty Direct Trade",
    lat: 2.22,
    lng: 98.83,
  },
  {
    id: "toraja",
    name: "Toraja",
    type: "Arabica",
    soil: "Latosol (High Iron Volcanic Clay)",
    elevation: "1,300 – 1,800 masl",
    varietals: "S795, Typica, Bourbon",
    character: "Thick, smooth body with low acidity. Saturated with rich dark cacao notes, cinnamon spice undertone, and floral complexities.",
    process: "Fully Washed & Wet Hulled Blend",
    flavorNotes: "Thick smooth body, saturated dark cocoa layers, sweet cinnamon undertones, black pepper sparks",
    availableProducts: "Toraja Reserve",
    lat: -3.0,
    lng: 119.8,
  },
  {
    id: "temanggung",
    name: "Temanggung",
    type: "Fine Robusta",
    soil: "Mount Sumbing/Sindoro Fertile volcanic clay",
    elevation: "800 – 1,000 masl",
    varietals: "Robusta SA 237",
    character: "Highly pristine 'Fine Robusta' status. Clean malted barley aroma, sweet hazelnuts, black tea notes, exceptionally round body.",
    process: "Natural Process",
    flavorNotes: "Clean malted barley, sweet hazelnut, soft milk chocolate, black tea notes with extremely round body",
    availableProducts: "Temanggung Fine Robusta",
    lat: -7.3,
    lng: 110.2,
  },
  {
    id: "lampung",
    name: "Lampung",
    type: "Fine Robusta",
    soil: "Sandy loam volcanic mix",
    elevation: "400 – 800 masl",
    varietals: "Robusta BP Selected Clones",
    character: "Rich toasted walnut fragrance, heavy syrupy texture, virtually no acidity, deep premium chocolate notes.",
    process: "Natural Process",
    flavorNotes: "Rich toasted walnut fragrance, heavy syrupy texture, deep dark cocoa layers, virtually zero acidity",
    availableProducts: "Lampung Reserve Robusta",
    lat: -5.0,
    lng: 105.0,
  },
  {
    id: "flores_bajawa",
    name: "Flores Bajawa",
    type: "Arabica",
    soil: "Eutrandept volcanic fertile ash",
    elevation: "1,200 – 1,600 masl",
    varietals: "Bourbon, S-Line, Catimor",
    character: "Clean nutty aromatics, medium-to-full body, velvety and smooth mouthfeel with elegant sweet melon and soft lemon acidity.",
    process: "Fully Washed",
    flavorNotes: "Vibrant sweet melon, soft lemon acidity, elegant velvety smooth mouthfeel with chocolate undertones",
    availableProducts: "Flores Volcanic Fully Washed",
    lat: -8.8,
    lng: 121.0,
  }
];

interface CustomCuppingNote {
  aroma: number;
  acidity: number;
  body: number;
  sweetness: number;
  complexity: number;
  balance: number;
  comments: string;
  cuppedBy: string;
  cuppingDate: string;
  roastLevel: string;
  totalScore: number;
}

export default function BrandPortalView({ leads, onAddSample, onAddLeadManual, googleAppsScriptUrl }: BrandPortalViewProps) {
  const [portalTab, setPortalTab] = useState<'home' | 'origins' | 'products' | 'about' | 'export'>('home');
  const [selectedProduct, setSelectedProduct] = useState<CoffeeProduct>(PRODUCTS_CATALOGUE[1]); // Default to Gayo Wild Natural
  
  // Dynamic origins list, default to initial static 7 origins
  const [originsList, setOriginsList] = useState<OriginTerritory[]>(ORIGINS_DATA);
  const [activeOrigin, setActiveOrigin] = useState<OriginTerritory | null>(ORIGINS_DATA[0]); // Default to Sumatra
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  const handleSyncSheetsOrigins = async () => {
    if (!googleAppsScriptUrl) {
      alert("Please configure your Google Apps Script URL in the Sheets Sync Config tab to load origins dynamically.");
      return;
    }
    setIsLoadingSheet(true);
    try {
      const url = `${googleAppsScriptUrl}${googleAppsScriptUrl.includes('?') ? '&' : '?'}action=getData`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.origins && Array.isArray(data.origins) && data.origins.length > 0) {
        const sheetOrigins: OriginTerritory[] = data.origins.map((row: any) => {
          const lat = parseFloat(row["Coords Y"] || row["lat"]) || 0;
          const lng = parseFloat(row["Coords X"] || row["lng"]) || 0;
          return {
            id: String(row["Origin ID"] || row["Origin ID"] || row["id"] || "").toLowerCase().trim(),
            name: String(row["Name"] || row["name"] || "").trim(),
            type: String(row["Type"] || row["type"] || "Arabica").trim(),
            soil: String(row["Soil"] || row["soil"] || "Volcanic Soil").trim(),
            elevation: String(row["Altitude"] || row["elevation"] || "1,200 masl").trim(),
            varietals: String(row["Varietals"] || row["varietals"] || "Typica, Bourbon").trim(),
            character: String(row["Flavor Notes"] || row["Flavor Notes"] || row["character"] || "").trim(),
            process: String(row["Process"] || row["process"] || "Fully Washed").trim(),
            flavorNotes: String(row["Flavor Notes"] || row["Flavor Notes"] || row["flavorNotes"] || "").trim(),
            availableProducts: String(row["Available Products"] || row["Available Products"] || row["availableProducts"] || "").trim(),
            lat,
            lng
          };
        }).filter((o: any) => o.id && o.name);

        if (sheetOrigins.length > 0) {
          const combined = [...sheetOrigins];
          ORIGINS_DATA.forEach(localOrg => {
            if (!combined.some(o => o.id === localOrg.id)) {
              combined.push(localOrg);
            }
          });
          setOriginsList(combined);
          if (activeOrigin && !combined.some(o => o.id === activeOrigin.id)) {
            setActiveOrigin(combined[0]);
          }
          alert(`Successfully synced ${sheetOrigins.length} custom coffee origins from Google Sheets!`);
        } else {
          alert("Origins tab found in Google Sheet but contained no records or headers were misconfigured.");
        }
      } else {
        alert("Origins data not found. Please verify you pasted the updated script in your Google Sheets Apps Script IDE and enabled access.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to synchronize custom origins from Google Sheets: " + err.message);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Roast Custom Cupping Notes Registry
  const [customNotes, setCustomNotes] = useState<Record<string, CustomCuppingNote[]>>(() => {
    try {
      const saved = localStorage.getItem('nandara_custom_cupping_notes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Active Session per Product map
  const [activeSessionIdx, setActiveSessionIdx] = useState<Record<string, number>>({});

  // Slide parameters
  const [formCuppedBy, setFormCuppedBy] = useState('Head Roaster');
  const [formRoastLevel, setFormRoastLevel] = useState('Medium');
  const [formAroma, setFormAroma] = useState(8.0);
  const [formAcidity, setFormAcidity] = useState(8.0);
  const [formBody, setFormBody] = useState(8.0);
  const [formSweetness, setFormSweetness] = useState(8.0);
  const [formComplexity, setFormComplexity] = useState(8.0);
  const [formBalance, setFormBalance] = useState(8.0);
  const [formComments, setFormComments] = useState('');

  // Synchronize sliders on product catalogue trigger
  React.useEffect(() => {
    if (selectedProduct) {
      const getScoreBySubject = (subj: string) => {
        const item = selectedProduct.radarData.find(d => d.subject === subj);
        return item ? item.score : 8.0;
      };
      setFormAroma(getScoreBySubject('Aroma'));
      setFormAcidity(getScoreBySubject('Acidity'));
      setFormBody(getScoreBySubject('Body'));
      setFormSweetness(getScoreBySubject('Sweetness'));
      setFormComplexity(getScoreBySubject('Complexity'));
      setFormBalance(getScoreBySubject('Balance'));
      setFormComments('');
    }
  }, [selectedProduct]);

  const productSessions = customNotes[selectedProduct.id] || [];
  const currentActiveIdx = activeSessionIdx[selectedProduct.id] !== undefined 
    ? activeSessionIdx[selectedProduct.id] 
    : (productSessions.length - 1);
  const activeSession = productSessions[currentActiveIdx];

  const computedTotalScore = formAroma + formAcidity + formBody + formSweetness + formComplexity + formBalance + 40;

  const handleResetSliders = () => {
    const getScoreBySubject = (subj: string) => {
      const item = selectedProduct.radarData.find(d => d.subject === subj);
      return item ? item.score : 8.0;
    };
    setFormAroma(getScoreBySubject('Aroma'));
    setFormAcidity(getScoreBySubject('Acidity'));
    setFormBody(getScoreBySubject('Body'));
    setFormSweetness(getScoreBySubject('Sweetness'));
    setFormComplexity(getScoreBySubject('Complexity'));
    setFormBalance(getScoreBySubject('Balance'));
    setFormComments('');
  };

  const handleSaveCuppingSession = () => {
    const newSession: CustomCuppingNote = {
      aroma: formAroma,
      acidity: formAcidity,
      body: formBody,
      sweetness: formSweetness,
      complexity: formComplexity,
      balance: formBalance,
      comments: formComments.trim(),
      cuppedBy: formCuppedBy.trim() || 'Head Roaster',
      cuppingDate: new Date().toISOString().split('T')[0],
      roastLevel: formRoastLevel,
      totalScore: computedTotalScore
    };

    const updatedSessions = [...productSessions, newSession];
    const updatedNotes = {
      ...customNotes,
      [selectedProduct.id]: updatedSessions
    };

    setCustomNotes(updatedNotes);
    localStorage.setItem('nandara_custom_cupping_notes', JSON.stringify(updatedNotes));

    setActiveSessionIdx(prev => ({
      ...prev,
      [selectedProduct.id]: updatedSessions.length - 1
    }));

    setFormComments('');
    alert(`Success: Standard SCA Cupping Session saved for ${selectedProduct.name}! Logged score: ${computedTotalScore.toFixed(2)} Points.`);
  };

  const handleDeleteCuppingSession = (indexToDelete: number) => {
    const updatedSessions = productSessions.filter((_, idx) => idx !== indexToDelete);
    const updatedNotes = {
      ...customNotes,
      [selectedProduct.id]: updatedSessions
    };

    setCustomNotes(updatedNotes);
    localStorage.setItem('nandara_custom_cupping_notes', JSON.stringify(updatedNotes));

    if (currentActiveIdx >= updatedSessions.length) {
      setActiveSessionIdx(prev => ({
        ...prev,
        [selectedProduct.id]: Math.max(0, updatedSessions.length - 1)
      }));
    }
  };
  
  // Sample request form states
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [requestItem, setRequestItem] = useState('Gayo Wild Natural');
  const [requestWeight, setRequestWeight] = useState('500g');
  const [requestCourier, setRequestCourier] = useState('DHL Express');
  const [requestNotes, setRequestNotes] = useState('');
  
  // Custom prospect (lead + sample) states
  const [isProspectMode, setIsProspectMode] = useState(false);
  const [prospectCompany, setProspectCompany] = useState('');
  const [prospectCountry, setProspectCountry] = useState('Germany');
  const [prospectEmail, setProspectEmail] = useState('');
  const [prospectCity, setProspectCity] = useState('');

  const handleCreateSampleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetLeadId = selectedLeadId;
    
    if (isProspectMode) {
      if (!prospectCompany || !prospectEmail) {
        alert("Please provide prospect company and email address.");
        return;
      }
      
      const newLeadId = `lead_portal_${Date.now()}`;
      onAddLeadManual({
        companyName: prospectCompany,
        country: prospectCountry,
        city: prospectCity || 'HQ',
        website: '',
        contactPage: '',
        email: prospectEmail,
        phone: '',
        linkedin: '',
        leadType: 'Specialty Coffee Roaster',
        leadScore: 'B',
        status: 'Sample Requested',
        lastContact: 'Requested via B2B Portal',
        notes: `Prospect self-registered on Nandara B2B Portal. Requested sample of ${requestItem}. Notes: ${requestNotes}`
      });
      
      // Store the recently generated matching ID
      targetLeadId = newLeadId;
      alert("Prospect corporate registration completed successfully! Added to CRM.");
    } else {
      if (!targetLeadId) {
        alert("Please select a registered corporate lead.");
        return;
      }
    }

    // Capture destination country
    let destCo = "Germany";
    if (isProspectMode) {
      destCo = prospectCountry;
    } else {
      const matchLed = leads.find(l => l.id === targetLeadId);
      if (matchLed) destCo = matchLed.country;
    }

    onAddSample({
      leadId: isProspectMode ? `lead_portal_last` : targetLeadId, // App.tsx will handle mapping or we default
      product: requestItem,
      weight: requestWeight,
      courier: requestCourier,
      trackingNumber: "",
      status: "Preparing",
      destinationCountry: destCo
    });

    alert(`Physical Sample of ${requestItem} (${requestWeight}) has been queued in PT. Nandara Warehouse!`);
    
    // Reset form
    setProspectCompany('');
    setProspectEmail('');
    setProspectCity('');
    setRequestNotes('');
    setIsProspectMode(false);
  };

  return (
    <div className="bg-white border border-primary/5 rounded-lg shadow-luxury overflow-hidden flex flex-col font-sans" id="brand-portal-root">
      {/* Brand Portal Navbar */}
      <div className="bg-[#05190F] p-5 border-b border-gold/20 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center bg-white/5 shrink-0">
            <Coffee className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-semibold text-white tracking-widest uppercase">PT. Nandara Nusa Montierra</h3>
            <p className="text-[9px] font-mono text-[#D4AF37] tracking-widest uppercase">Corporate Sourcing Showroom & Portals</p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono uppercase tracking-wider">
          {[
            { id: 'home', label: '🏠 Showroom' },
            { id: 'origins', label: '🗺 Terroir Map' },
            { id: 'products', label: '☕ Digital Catalog' },
            { id: 'about', label: '🏢 Sourcing Commitment' },
            { id: 'export', label: '📦 Export & Samples' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPortalTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-sm border transition-all cursor-pointer font-bold ${
                portalTab === tab.id 
                  ? 'bg-gold border-gold text-primary shadow-xs' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Portal Inner Content */}
      <div className="p-8 bg-bg-ivory/20 min-h-[550px]" id="portal-inner-pane">
        
        {/* HOMEPAGE VIEW */}
        {portalTab === 'home' && (
          <div className="space-y-12 animate-fade-in" id="portal-home">
            {/* Elegant Atmospheric Perkebunan Berkabut Hero */}
            <div className="rounded-lg border border-gold/20 relative overflow-hidden min-h-[460px] sm:min-h-[480px] py-10 sm:py-16 flex items-center bg-[#05190F]" id="showcase-hero">
              {/* Fake foggy overlay decoration */}
              <div className="absolute inset-0 bg-linear-to-r from-[#05190F]/95 via-[#05190F]/80 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-cover bg-center opacity-30 mix-blend-screen" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop')" }} referrerPolicy="no-referrer" />
              
              <div className="max-w-2xl px-6 sm:px-12 py-4 space-y-5 relative z-20">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/30 text-gold text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-sm">
                    🌾 Traceable Sourcing Partner
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-[44px] font-serif text-white tracking-wide leading-tight">
                  CURATED INDONESIAN COFFEE ORIGINS FOR THE GLOBAL SPECIALTY MARKET
                </h1>
                <p className="text-gray-300 text-sm font-light leading-relaxed max-w-xl">
                  We source the finest Indonesian coffee directly from trusted mountain cooperatives and prepare them with strict export-grade standards for premium roasters globally.
                </p>
                <div className="pt-4">
                  <button 
                    onClick={() => setPortalTab('products')}
                    className="px-6 py-3.5 bg-gold hover:bg-gold-hover text-[#05190F] uppercase text-xs font-mono tracking-widest rounded-sm font-bold shadow-luxury hover:text-white transition-all cursor-pointer border border-gold/30"
                  >
                    Explore Our Origins ➔
                  </button>
                </div>
              </div>
            </div>

            {/* Why Choose Us: 3 pillars */}
            <div className="space-y-6" id="why-choose-us">
              <div className="text-center space-y-1">
                <h3 className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase font-bold">Why Choose Nandara Nusa Montierra</h3>
                <h2 className="text-2xl font-serif italic text-primary">Uncompromising Sourcing Principles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Curated Origin",
                    desc: "Sourcing the world’s most distinct volcanic microlots directly from microclimates in Gayo, Toraja, Java Preanger, Bali, and Flores.",
                    icon: <Compass className="w-5 h-5 text-gold" />
                  },
                  {
                    title: "Quality First",
                    desc: "Every single delivery is rigorously cupped, moisture-checked, and hand-graded strictly to ensure Specialty Q-Grading excellence.",
                    icon: <Award className="w-5 h-5 text-gold" />
                  },
                  {
                    title: "Reliable Partner",
                    desc: "Delivering consistent, impeccably packed container lots and professional export logistics for sustainable long-term partnerships.",
                    icon: <ShieldCheck className="w-5 h-5 text-gold" />
                  }
                ].map((pillar, idx) => (
                  <div key={idx} className="p-6 bg-white border border-primary/5 rounded-lg shadow-luxury space-y-3 hover:border-gold/30 transition-colors">
                    <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center">
                      {pillar.icon}
                    </div>
                    <h4 className="font-serif font-medium text-primary text-base">{pillar.title}</h4>
                    <p className="text-xs text-text-dim leading-relaxed font-light">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Timeline: How We Work */}
            <div className="p-8 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-6" id="how-we-work">
              <div className="space-y-1">
                <h4 className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">The Export Journey</h4>
                <h3 className="text-xl font-serif text-[#05190F]">Intricate Sourcing to Vessel Shipping</h3>
              </div>

              <div className="relative pt-4">
                {/* Horizontal Bar */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block" />
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {[
                    { step: "01", name: "Sourcing", desc: "Cooperative Direct trade with highland growers." },
                    { step: "02", name: "Selection", desc: "Rigorous cupping and moisture quality controls." },
                    { step: "03", name: "Preparation", desc: "Milling, hand-sorting, and polishing." },
                    { step: "04", name: "Packing", desc: "Secured GrainPro and hermetic vacuum lining." },
                    { step: "05", name: "Shipping", desc: "Container consolidation and Belawan port dispatch." }
                  ].map((proc, idx) => (
                    <div key={idx} className="relative bg-bg-ivory/20 p-4 border border-primary/5 rounded-sm space-y-2 z-10">
                      <span className="text-[10px] font-mono text-gold font-bold">{proc.step}</span>
                      <h5 className="font-mono text-xs uppercase tracking-wider text-primary font-bold">{proc.name}</h5>
                      <p className="text-[11px] text-gray-500 font-sans leading-tight">{proc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cuplikan Kategori Koleksi Produk */}
            <div className="space-y-5" id="featured-collections">
              <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                <div>
                  <h3 className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">Featured Collections</h3>
                  <h2 className="text-2xl font-serif italic text-[#05190F]">Four Dimensions of Mount Flavor</h2>
                </div>
                <button 
                  onClick={() => setPortalTab('products')} 
                  className="text-xs font-mono text-gold select-none hover:underline tracking-wider uppercase font-bold"
                >
                  Configure Catalog Room ➔
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs">
                {[
                  {
                    coll: "Classic Origins",
                    title: "Wet Hulled Traditional",
                    desc: "Sumatra's famous Giling Basah method. Super heavy body, sweet cedarwood.",
                    matched: "Aceh Gayo Grade 1"
                  },
                  {
                    coll: "Modern Specialty",
                    title: "Processed Arabicas",
                    desc: "Meticulous single-origins up to 1,700 masl. Fully washed & Natural processes.",
                    matched: "Gayo Wild Natural, Bali Kintamani"
                  },
                  {
                    coll: "Rare & Microlot",
                    title: "Competitive Sourcing",
                    desc: "Extremely rare lots scoring 86.5+. Prepared strictly for specialized roasters.",
                    matched: "Gayo LB Reserve"
                  },
                  {
                    coll: "Fine Robusta",
                    title: "Espresso Masters",
                    desc: "Heavy chocolate cream, high altitudes. Crisp and highly clean Robusta clones.",
                    matched: "Lampung Reserve, Temanggung Fine"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-5 bg-white border border-primary/5 rounded-lg space-y-3.5 shadow-xs">
                    <span className="text-[8px] font-mono tracking-widest text-gold uppercase px-2 py-0.5 bg-primary/5 border border-gold/15 rounded-sm font-semibold">{item.coll}</span>
                    <h4 className="font-serif font-semibold text-primary text-sm leading-tight mt-1">{item.title}</h4>
                    <p className="text-[11px] text-text-dim font-sans leading-relaxed">{item.desc}</p>
                    <p className="text-[10px] font-mono text-primary pt-2 border-t border-gray-100 uppercase tracking-widest"><b>Featured:</b> {item.matched}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ORIGINS INTERACTIVE MAP VIEW */}
        {portalTab === 'origins' && (
          <div className="space-y-6 animate-fade-in" id="portal-origins">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sourcing Map Block */}
              <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-4">
                <IndonesiaMap
                  origins={originsList}
                  activeOrigin={activeOrigin}
                  onSelectOrigin={(org) => setActiveOrigin(org)}
                  isLoadingSheet={isLoadingSheet}
                  onSyncSheetsOrigins={handleSyncSheetsOrigins}
                  hasSheetsUrl={!!googleAppsScriptUrl}
                />
              </div>

              {/* Terroir Specification Sheet: Origin Intelligence Panel */}
              <div className="p-6 rounded-lg bg-[#F7F4EC] border border-[#05190F]/15 shadow-luxury h-fit space-y-5" id="terroir-details">
                {activeOrigin ? (
                  <div className="space-y-4 animate-fade-in text-xs font-mono">
                    <div className="border-b border-[#05190F]/10 pb-3">
                      <span className="p-1 px-2.5 text-[8px] bg-[#05190F] text-[#C9A227] border border-[#C9A227]/30 rounded-sm uppercase tracking-widest font-bold inline-block">
                        {activeOrigin.type} Terroir
                      </span>
                      <h3 className="text-xl font-serif italic text-[#05190F] mt-2 normal-case font-bold">
                        {activeOrigin.name}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Altitude Specification */}
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#05190F]/70 block font-bold leading-none mb-1">
                          Altitude / Elevation:
                        </span>
                        <p className="text-[#05190F] font-sans text-sm font-bold leading-relaxed">{activeOrigin.elevation}</p>
                      </div>

                      {/* Geological Sourced Soil */}
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#05190F]/70 block font-bold leading-none mb-1">
                          Geological Soil base:
                        </span>
                        <p className="text-[#05190F]/80 font-sans text-xs font-medium leading-relaxed">{activeOrigin.soil}</p>
                      </div>

                      {/* Sourcing Process and Export Preparation */}
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#05190F]/70 block font-bold leading-none mb-1">
                          Processing Method:
                        </span>
                        <p className="text-[#05190F]/90 font-sans text-xs font-semibold leading-relaxed p-1.5 bg-[#05190F]/5 rounded-sm border border-[#05190F]/10">{activeOrigin.process}</p>
                      </div>

                      {/* Flavor Profile and Master Cupping Notes */}
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#05190F]/70 block font-bold leading-none mb-1">
                          Flavor Profile Notes:
                        </span>
                        <p className="text-[#05190F]/90 font-serif text-sm italic leading-relaxed pt-0.5">{activeOrigin.flavorNotes}</p>
                      </div>

                      {/* Sourcing Inventory Reference */}
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#05190F]/70 block font-bold leading-none mb-1">
                          Sourcing Available Products:
                        </span>
                        <p className="text-[#05190F] font-sans text-xs leading-relaxed font-semibold mt-1 p-2 bg-[#C9A227]/10 text-[#05190F] border border-[#C9A227]/30 rounded-sm italic">
                          {activeOrigin.availableProducts}
                        </p>
                      </div>

                      <div className="p-3 bg-[#05190F] text-white border border-[#C9A227]/20 rounded-sm font-sans text-xs leading-relaxed pt-3">
                        <span className="font-mono text-[9px] tracking-widest text-[#C9A227] block font-bold uppercase mb-1">
                          IMPORTER TERROIR PROFILE:
                        </span>
                        "{activeOrigin.character}"
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#05190F]/10">
                      <p className="text-[9px] text-[#05190F]/70 uppercase tracking-widest font-bold mb-2">Direct Trade Catalog Matchings:</p>
                      <div className="space-y-1.5">
                        {PRODUCTS_CATALOGUE.filter(p => {
                          const originNameFirstWord = activeOrigin.name.split(' ')[0].toLowerCase().trim();
                          const originIdClean = activeOrigin.id.replace('_', '').substring(0, 4);
                          return p.origin.toLowerCase().includes(originNameFirstWord) || 
                                 p.origin.toLowerCase().includes(originIdClean) ||
                                 activeOrigin.availableProducts.toLowerCase().includes(p.name.toLowerCase());
                        }).map(coffee => (
                          <button
                            key={coffee.id}
                            onClick={() => {
                              setSelectedProduct(coffee);
                              setPortalTab('products');
                            }}
                            className="w-full text-left p-2 hover:bg-[#05190F] hover:text-[#C9A227] bg-white border border-[#05190F]/10 rounded-sm flex justify-between items-center transition-all cursor-pointer group"
                          >
                            <span className="font-sans font-semibold text-[#05190F] group-hover:text-[#C9A227]">{coffee.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#C9A227] group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed border-[#05190F]/15 rounded-sm text-[#05190F]/45">
                    <Info className="w-8 h-8 stroke-1 mx-auto text-[#C9A227]/40 mb-2" />
                    <p className="text-xs uppercase tracking-widest">Select an Indonesia Volcanic Territorium to inspect detailed coffee intelligence</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS DIGITAL CATALOG */}
        {portalTab === 'products' && (
          <div className="space-y-6 animate-fade-in" id="portal-products">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Product Listing card */}
              <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury h-fit space-y-6">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase font-bold">E-Catalog Room</h3>
                  <h2 className="text-lg font-serif italic text-primary">PT. Nandara Nusantara Sourced Inventory</h2>
                </div>

                {/* Subgroups */}
                <div className="space-y-5">
                  {[
                    { key: "Classic Origins", label: "Classic Indonesian Origins" },
                    { key: "Modern Specialty", label: "Modern Specialty Process" },
                    { key: "Rare & Microlot", label: "Rare & Microlot Collection" },
                    { key: "Fine Robusta", label: "Fine Premium Robusta Collection" }
                  ].map((group) => {
                    const groupItems = PRODUCTS_CATALOGUE.filter(p => p.collection === group.key || (group.key === "Classic Origins" && p.collection === "Classic Origins"));
                    return (
                      <div key={group.key} className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim font-bold block border-b border-gray-100 pb-1">
                          {group.label}
                        </span>
                        <div className="space-y-1">
                          {groupItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => setSelectedProduct(item)}
                              className={`w-full text-left p-2.5 px-3 rounded-sm border transition-all text-xs font-sans flex justify-between items-center cursor-pointer ${
                                selectedProduct.id === item.id
                                  ? 'bg-primary border-primary text-gold font-bold shadow-xs'
                                  : 'border-primary/5 hover:border-gold/30 bg-bg-ivory/10 text-primary'
                              }`}
                            >
                              <span>{item.name}</span>
                              <span className="font-mono text-[10px] font-bold text-gold">Q: {item.cuppingScore}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Specification Detail card */}
              <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <span className="px-2 py-0.5 text-[8px] bg-[#05190F]/5 text-primary border border-stone-200 uppercase font-mono tracking-widest font-bold inline-block">
                      {selectedProduct.collection}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif text-primary mt-1.5 font-medium leading-tight select-none">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-xs text-text-dim font-mono tracking-wider items-center flex gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                      Sourced From: {selectedProduct.origin}
                    </p>
                  </div>
                  
                  {/* Digital Inquire Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setRequestItem(selectedProduct.name);
                        setPortalTab('export');
                      }}
                      className="px-4 py-2.5 bg-[#05190F] hover:bg-neutral-950 text-gold hover:text-white rounded-sm text-[10px] font-mono uppercase tracking-widest cursor-pointer border border-gold/45 transition-all font-bold"
                    >
                      Request Coffee Sample Box
                    </button>
                  </div>
                </div>

                {/* Specification Tab Table Grid */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#05190F] font-bold border-b border-gray-100 pb-1.5">
                    📖 Technical Specifications Sheet
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3.5 text-xs font-mono">
                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Altitude Elevation</span>
                      <span className="text-primary font-bold font-sans">{selectedProduct.altitude}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Botanical Varietals</span>
                      <span className="text-primary font-bold font-sans">{selectedProduct.varietal}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Processing Method</span>
                      <span className="text-primary font-bold font-sans">{selectedProduct.process}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Moisture Content</span>
                      <span className="text-primary font-bold">{selectedProduct.moisture}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Export Screen Size</span>
                      <span className="text-primary font-bold">{selectedProduct.screenSize}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Scoring Q-Grade</span>
                      <span className="text-gold font-bold">{selectedProduct.cuppingScore} Points</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Body / Viscosity</span>
                      <span className="text-primary font-sans font-semibold">{selectedProduct.body}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Acidity Class</span>
                      <span className="text-primary font-sans font-semibold">{selectedProduct.acidity}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Harvesting Season</span>
                      <span className="text-primary font-sans">{selectedProduct.harvest}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Fresh Packaging</span>
                      <span className="text-primary font-sans">{selectedProduct.packaging}</span>
                    </div>

                    <div className="space-y-0.5 pb-2 border-b border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest text-[#4A5568] block font-bold">Hermetic Shelf Life</span>
                      <span className="text-primary">{selectedProduct.shelfLife}</span>
                    </div>
                  </div>
                </div>

                {/* Cup characteristics & Radar view */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                  <div className="space-y-3.5">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#05190F] font-bold block border-b border-gray-200 pb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span>Cup Taste Profile & Characteristics</span>
                    </h3>
                    <p className="text-xs text-gray-700 font-sans italic font-light italic leading-relaxed pt-1 bg-stone-50 border-l-[3px] border-gold p-4 rounded-r-md">
                      "{selectedProduct.cupProfile}"
                    </p>
                    <p className="text-[11px] text-text-dim text-justify leading-relaxed">
                      Sourced meticulously under the direct cooperatives trace parameters of Pt. Nandara Nusantara. Stored, milled, and hand-selected under maximum temperature regulations to preserve precious flavor volatiles before global vessel dispatch.
                    </p>
                  </div>

                  {/* Radar cup chart */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#05190F] font-bold block text-right border-b border-gray-100 pb-1.5 flex justify-between items-center">
                      <span>🎖 Sensory evaluation chart</span>
                      {activeSession && <span className="text-[8px] bg-[#05190F]/5 border border-primary/10 px-1 py-0.5 text-gray-500 rounded-sm font-normal">Dual Sourced Comparison</span>}
                    </h3>
                    
                    <div className="h-56 relative w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={
                          selectedProduct.radarData.map(item => ({
                            subject: item.subject,
                            official: item.score,
                            custom: activeSession 
                              ? (
                                  item.subject === 'Aroma' ? activeSession.aroma :
                                  item.subject === 'Acidity' ? activeSession.acidity :
                                  item.subject === 'Body' ? activeSession.body :
                                  item.subject === 'Sweetness' ? activeSession.sweetness :
                                  item.subject === 'Complexity' ? activeSession.complexity :
                                  item.subject === 'Balance' ? activeSession.balance :
                                  item.score
                                )
                              : undefined
                          }))
                        }>
                          <PolarGrid stroke="#05190F" strokeOpacity={0.1} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'monospace' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#4A5568', fontSize: 8 }} />
                          <Radar name="Official Grade" dataKey="official" stroke="#D4AF37" fill="#05190F" fillOpacity={0.15} />
                          {activeSession && (
                            <Radar name={`${activeSession.roastLevel} Roast`} dataKey="custom" stroke="#05190F" fill="#D4AF37" fillOpacity={0.35} />
                          )}
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Interactive roaster sensory evaluation desk */}
                <div className="pt-6 border-t border-[#05190F]/10 space-y-6">
                  <div className="bg-[#05190F]/5 rounded-lg border border-[#05190F]/10 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#05190F]/10">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-[#05190F] uppercase tracking-wider flex items-center gap-1.5">
                          <Beaker className="w-4 h-4 text-gold shrink-0 animate-pulse" />
                          <span>🔬 ROASTER SENSORY LAB: CUSTOM CUPPING NOTES</span>
                        </h4>
                        <p className="text-[11px] text-[#4A5568] mt-0.5">Empowering specialty roasters to score, compare, and catalog custom roast batches directly over origin baselines.</p>
                      </div>
                      {activeSession && (
                        <span className="p-1 px-2.5 bg-gold text-[#05190F] font-mono text-[9px] uppercase tracking-widest rounded-sm font-bold border border-gold/45 shadow-xs shrink-0 mt-1 sm:mt-0">
                          Comparing Roast: {activeSession.roastLevel} ({activeSession.totalScore.toFixed(2)} SCA)
                        </span>
                      )}
                    </div>

                    {/* Dual panel slides & logs */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-xs font-mono">
                      {/* Parameters Panel */}
                      <div className="xl:col-span-7 space-y-5">
                        <h5 className="text-[10px] uppercase tracking-widest text-[#05190F] font-bold pb-1.5 border-b border-primary/5">
                          1. Record Cupping Parameters
                        </h5>
                        
                        {/* Form elements in clean grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider font-bold block text-[#05190F]">Cupped By Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Head Roaster"
                              value={formCuppedBy}
                              onChange={e => setFormCuppedBy(e.target.value)}
                              className="w-full bg-white border border-[#05190F]/15 font-sans rounded-sm px-3 py-2 text-xs text-[#05190F] focus:ring-1 focus:ring-gold outline-hidden"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider font-bold block text-[#05190F]">Roast Profile Level</label>
                            <select 
                              value={formRoastLevel}
                              onChange={e => setFormRoastLevel(e.target.value)}
                              className="w-full bg-white border border-[#05190F]/15 font-sans rounded-sm p-2 text-xs focus:ring-1 focus:ring-gold outline-hidden"
                            >
                              {['Light', 'Medium-Light', 'Medium', 'Medium-Dark'].map(r => (
                                <option key={r} value={r}>{r} Roast</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider font-bold block text-[#05190F]">Live Projection</label>
                            <div className="w-full bg-gradient-to-r from-emerald-950 to-[#05190F] border border-gold/30 rounded-sm py-2 px-3 flex items-center justify-between text-gold">
                              <span className="text-[8px] uppercase tracking-wide opacity-80">SCA SCORE</span>
                              <span className="text-sm font-bold text-white font-mono">{computedTotalScore.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Sliders Grid */}
                        <div className="bg-white/80 p-5 border border-primary/5 rounded-md shadow-xs space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-primary/5">
                            <span className="text-[9px] uppercase tracking-widest text-[#05190F] font-bold">2. Fine-tune Attributes</span>
                            <span className="text-[9px] text-[#4A5568] uppercase font-bold">Standard 0-10 Rating</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            {[
                              { id: 'aroma', label: '👃 Aroma / Fragrance', val: formAroma, setter: setFormAroma },
                              { id: 'acidity', label: '🍋 Acidity Brightness', val: formAcidity, setter: setFormAcidity },
                              { id: 'body', label: '👅 Body / Mouthfeel', val: formBody, setter: setFormBody },
                              { id: 'sweetness', label: '🍯 Sweetness Level', val: formSweetness, setter: setFormSweetness },
                              { id: 'complexity', label: '✨ Complexity & Aftertaste', val: formComplexity, setter: setFormComplexity },
                              { id: 'balance', label: '⚖ Balance Harmony', val: formBalance, setter: setFormBalance }
                            ].map((slider) => (
                              <div key={slider.id} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-sans font-medium text-gray-700">{slider.label}</span>
                                  <span className="font-bold text-[#05190F]">{slider.val.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="range"
                                    min="5"
                                    max="10"
                                    step="0.1"
                                    value={slider.val}
                                    onChange={e => slider.setter(parseFloat(e.target.value))}
                                    className="w-full accent-gold bg-[#05190F]/10 cursor-pointer h-1.5 rounded-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tasting sensory commentary */}
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider font-bold block text-[#05190F]">3. Sensory Tasting Comments & Micro-lot Observations</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Exquisite lemon-grass top notes with caramelized brown sugar sweetness. Acidity is beautifully structural on medium roast stage..."
                            value={formComments}
                            onChange={e => setFormComments(e.target.value)}
                            className="w-full bg-white border border-[#05190F]/15 font-sans rounded-sm p-3 text-xs leading-relaxed text-[#05190F] focus:ring-1 focus:ring-gold outline-hidden"
                          />
                        </div>

                        {/* Actions bar */}
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={handleResetSliders}
                            className="px-4 py-2 border border-[#05190F]/15 hover:bg-stone-100 rounded-sm uppercase tracking-wider text-[10px] font-semibold text-[#05190F] cursor-pointer transition-colors"
                          >
                            Reset to Default
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleSaveCuppingSession}
                            className="px-6 py-2 bg-[#05190F] hover:bg-neutral-950 text-gold hover:text-white border border-gold/45 rounded-sm font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-luxury transition-all"
                          >
                            Save Session Log ➔
                          </button>
                        </div>
                      </div>

                      {/* History log timeline Panel */}
                      <div className="xl:col-span-5 flex flex-col h-full bg-white/70 p-5 border border-primary/5 rounded-md shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-[#05190F]/10 pb-2">
                          <span className="text-[10px] uppercase tracking-widest text-[#05190F] font-bold">Cupping Session Registry</span>
                          <span className="p-1 px-1.5 bg-[#05190F]/5 border border-[#05190F]/10 text-[9px] font-bold rounded-sm">
                            {productSessions.length} logged
                          </span>
                        </div>

                        {productSessions.length === 0 ? (
                          <div className="flex-grow flex flex-col items-center justify-center p-8 py-16 border border-dashed border-[#05190F]/10 rounded-sm text-center text-[#05190F]/40 space-y-2">
                            <Coffee className="w-8 h-8 stroke-1 text-[#D4AF37] animate-pulse" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] uppercase tracking-wider font-bold">No sessions logged yet</p>
                              <p className="text-[9px] font-sans">Sliders reflect origin baseline score of {selectedProduct.cuppingScore} SCA.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                            {productSessions.map((session, index) => {
                              const isActive = index === currentActiveIdx;
                              return (
                                <div 
                                  key={index} 
                                  onClick={() => {
                                    setActiveSessionIdx(prev => ({
                                      ...prev,
                                      [selectedProduct.id]: index
                                    }));
                                  }}
                                  className={`p-4 border rounded-sm relative group transition-all text-xs cursor-pointer ${
                                    isActive 
                                      ? 'bg-gradient-to-br from-[#05190F]/5 to-[#F6F2E8]/40 border-gold shadow-md' 
                                      : 'bg-white/80 border-primary/5 hover:border-gold/30 hover:bg-stone-50'
                                  }`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCuppingSession(index);
                                    }}
                                    className="absolute top-3 right-3 text-red-700 hover:text-red-950 font-mono text-[9px] uppercase cursor-pointer"
                                    title="Delete Cupping Session"
                                  >
                                    Delete ✕
                                  </button>

                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start font-mono text-[8px] text-[#4A5568] uppercase tracking-wider">
                                      <span>👤 {session.cuppedBy}</span>
                                      <span>📅 {session.cuppingDate}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <h6 className="font-serif font-bold text-primary text-xs flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          session.roastLevel === 'Light' ? 'bg-[#D4AF37]' :
                                          session.roastLevel === 'Medium-Light' ? 'bg-amber-600' :
                                          session.roastLevel === 'Medium' ? 'bg-amber-800' : 'bg-stone-800'
                                        }`} />
                                        {session.roastLevel} Roast
                                      </h6>
                                      <span className="font-mono text-xs font-black text-gold">
                                        {session.totalScore.toFixed(2)} SCA
                                      </span>
                                    </div>

                                    {/* Scores row key attributes */}
                                    <div className="bg-[#05190F]/5 p-2 rounded-xs grid grid-cols-6 gap-1 text-center text-[9px] font-mono leading-none border border-primary/5">
                                      <div>
                                        <span className="text-gray-500 block text-[7px] tracking-tight uppercase">Arm</span>
                                        <b className="text-[#05190F]">{session.aroma}</b>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-[7px] tracking-tight uppercase">Acd</span>
                                        <b className="text-[#05190F]">{session.acidity}</b>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-[7px] tracking-tight uppercase">Bdy</span>
                                        <b className="text-[#05190F]">{session.body}</b>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-[7px] tracking-tight uppercase">Swt</span>
                                        <b className="text-[#05190F]">{session.sweetness}</b>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-[7px] tracking-tight uppercase">Cpx</span>
                                        <b className="text-[#05190F]">{session.complexity}</b>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-[7px] tracking-tight uppercase">Bal</span>
                                        <b className="text-[#05190F]">{session.balance}</b>
                                      </div>
                                    </div>

                                    {session.comments && (
                                      <p className="text-[11px] text-gray-700 italic font-sans leading-relaxed bg-white p-2.5 border-l-2 border-gold rounded-r-sm shadow-xs select-none">
                                        "{session.comments}"
                                      </p>
                                    )}

                                    <div className="flex justify-between items-center text-[8px] uppercase tracking-wider font-semibold opacity-70">
                                      <span>Batch #{(index + 1)}</span>
                                      <span className="text-[#05190F] font-bold">{isActive ? '✓ Selected Overlay' : '⚡ Click to Select'}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ABOUT US STORY VIEW */}
        {portalTab === 'about' && (
          <div className="p-8 sm:p-12 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-8 animate-fade-in" id="portal-about">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-5 text-sm font-sans">
                <div className="space-y-1.5 border-b border-gray-100 pb-3">
                  <h3 className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">PT. Sourcing Commitment</h3>
                  <h2 className="text-2xl font-serif text-[#05190F] italic font-medium">B2B Sourcing Partners you can count on</h2>
                </div>

                <p className="text-gray-700 leading-relaxed font-light text-justify">
                  PT. Nandara Nusa Montierra lahir dari keinginan mendalam untuk membawa kopi-kopi terbaik dari petani di pedalaman nusantara langsung ke roastery specialty di seluruh penjuru dunia. Kami membangun hubungan kemitraan jangka panjang yang erat dengan koperasi petani lokal, melestarikan warisan pengolahan tradisional yang dipadukan dengan kontrol higienis yang modern.
                </p>

                <p className="text-gray-700 leading-relaxed font-light text-justify">
                  Kami percaya akan transparansi penuh (transparent sources). Menghubungkan pembeli internasional dengan cerita-cerita otentik di balik kopi mereka, baik dari ketinggian gunung vulkanik subur yang berkabut di Sumatra, lereng curam di Sulawesi, hingga tanah vulkanik basah di Flores dan Jawa Barat.
                </p>

                <div className="p-4 bg-bg-ivory/60 border border-primary/10 rounded-sm font-mono text-xs text-primary space-y-1">
                  <span className="text-[9px] uppercase tracking-widest text-gold block font-bold mb-1">✓ SOURCING AUDIT MARKS</span>
                  <p>• 100% Direct Sourced Smallholders Cooperatives</p>
                  <p>• Volcanic Silt & High Canopy Elevation Guarantee</p>
                  <p>• Specialty Q-Grades strictly exceeding 82+ scores</p>
                </div>
              </div>

              {/* Office Contact details & Verification legal parameters */}
              <div className="p-6 bg-bg-ivory/30 rounded-lg border border-primary/5 space-y-6 font-mono text-xs">
                <div className="border-b border-primary/10 pb-3">
                  <h4 className="text-primary font-bold uppercase tracking-wider text-[10px]">Headquarters & Registry Legalities</h4>
                  <p className="text-text-dim text-[11px] mt-0.5">Exporter Verification & Compliance Coordinates</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-primary font-bold block mb-1">🏢 Registered Office Address:</span>
                    <p className="text-gray-700 text-xs font-sans leading-relaxed">
                      Jl. Kartini 3 No.25, Kel. Kartini, Kec. Sawah Besar,<br />
                      Jakarta Pusat, DKI Jakarta — 10720, Indonesia.
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-primary font-bold block mb-1">☕ Processing Milling Station:</span>
                    <p className="text-gray-700 text-xs font-sans leading-relaxed">
                      Sumatra Belawan Dry Mill Area, Sidorame Barat, Medan.<br />
                      Central Java Temanggung Station, Secang, Temanggung.
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-primary font-bold block mb-1">🔗 Export Credentials Licenses:</span>
                    <p className="text-gray-700 text-xs font-sans leading-normal">
                      NIB Number: 9120104920155<br />
                      Sourcing Permit ID: EX-COFFEE-ID-94101A<br />
                      Cooperative Sourcing Bond: PT-NANDARA-NUSA-1
                    </p>
                  </div>

                  <div className="p-4 rounded bg-[#05190F] border border-[#D4AF37]/45 text-white space-y-2 font-sans text-xs">
                    <p className="font-serif font-semibold text-[#D4AF37] flex items-center gap-1.5 uppercase text-xs">
                      <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                      Direct Connection
                    </p>
                    <p className="font-light text-gray-300 leading-relaxed text-[11px]">
                      Our team regularly travels into the Gayo Highlands and Flores valleys to authenticate traceability. Contact our corporate desk directly at desk@nandaramontierra.id for custom micro-lot reservations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPORT REGULATION & SAMPLE FORM VIEW */}
        {portalTab === 'export' && (
          <div className="space-y-6 animate-fade-in" id="portal-export">
            
            {/* Guide Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
              {/* Sourcing reference guidelines */}
              <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-5">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase font-bold">B2B Sourcing Protocol</h3>
                  <h2 className="text-base font-serif italic text-primary">Export & Sample request Regulations</h2>
                </div>

                <div className="space-y-4">
                  {/* Cupping criteria evaluation table */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-primary block font-bold font-mono">Cupping Score Reference Grid (Q Grading):</span>
                    <div className="border border-primary/10 rounded-sm overflow-hidden font-mono text-[10px]">
                      <div className="grid grid-cols-3 bg-bg-ivory/50 p-2 font-bold uppercase text-primary border-b border-primary/10">
                        <div>Score Range</div>
                        <div className="col-span-2">Sourcing Qualification Class</div>
                      </div>
                      <div className="grid grid-cols-3 p-2 border-b border-primary/10 bg-white">
                        <div className="font-bold text-gray-400">80.00 - 82.99</div>
                        <div className="col-span-2 text-gray-500 font-sans">Commercial / Premium Grade (Lampung Reserve Robusta Clones)</div>
                      </div>
                      <div className="grid grid-cols-3 p-2 border-b border-primary/10 bg-white">
                        <div className="font-bold text-emerald-800">83.00 - 85.00</div>
                        <div className="col-span-2 text-[#05190F] font-sans font-semibold text-emerald-950">Specialty Grade (Aceh Gayo G1, J Preanger, B Kintamani, F Volcanic)</div>
                      </div>
                      <div className="grid grid-cols-3 p-2 bg-white">
                        <div className="font-bold text-gold">86.00+ Points</div>
                        <div className="col-span-2 text-primary font-bold font-sans">Rare High-end / Microlot (Gayo LB Reserve Spec)</div>
                      </div>
                    </div>
                  </div>

                  {/* Standard Packing Guidelines */}
                  <div className="space-y-1.5 font-sans">
                    <span className="text-[9px] uppercase tracking-widest text-primary block font-bold font-mono">Export Packing Standards:</span>
                    <p className="text-gray-600">
                      All specialty green bean ship consignments are packed meticulously utilizing **GrainPro liners** wrapped inside dense jute bags to safeguard humidity levels (Max 12.5% moisture). Exceptional micro-lots are isolated inside **A-grade vacuum seal pouches** directly at origin dry-mills.
                    </p>
                  </div>

                  {/* Standard Sample Protocol */}
                  <div className="space-y-1.5 font-sans">
                    <span className="text-[9px] uppercase tracking-widest text-primary block font-bold font-mono">Complementary Sample Policy:</span>
                    <p className="text-gray-600">
                      We offer free 500g physical sample bags shipped globally via DHL Express or FedEx Priority to verified international green coffee importers and commercial roasters. Feedback cupping logs are politely requested within 14 calendar days of receipt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Request Form */}
              <div className="p-6 rounded-lg bg-white border border-primary/5 shadow-luxury space-y-4">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase font-bold">International Sourcing Desk</h3>
                  <h2 className="text-base font-serif italic text-primary">Pre-Order Physical Sample Pouch</h2>
                </div>

                <form onSubmit={handleCreateSampleRequest} className="space-y-4 text-xs font-mono">
                  {/* Toggle Mode */}
                  <div className="flex gap-4 p-2.5 bg-bg-ivory/50 border border-primary/5 rounded-sm justify-between">
                    <span className="text-[10px] text-primary uppercase font-bold self-center">Prospect Status:</span>
                    <div className="flex gap-1.5 text-[9px] uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => setIsProspectMode(false)}
                        className={`p-1 px-2 border rounded-sm font-bold cursor-pointer ${
                          !isProspectMode ? 'bg-primary border-primary text-gold' : 'bg-white border-primary/10 text-primary'
                        }`}
                      >
                        Active CRM Lead
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsProspectMode(true)}
                        className={`p-1 px-2 border rounded-sm font-bold cursor-pointer ${
                          isProspectMode ? 'bg-primary border-primary text-gold' : 'bg-white border-primary/10 text-primary'
                        }`}
                      >
                        New Prospect
                      </button>
                    </div>
                  </div>

                  {/* Lead details inputs depends on Toggle */}
                  {!isProspectMode ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest text-[#4A5568] block font-bold">Select Active Lead Importer *</label>
                      {leads.length === 0 ? (
                        <p className="p-2 border border-dashed border-red-200 text-red-600 bg-red-50 text-[10px] rounded-sm font-sans italic">
                          No active CRM leads created. Please register a lead or use "New Prospect" toggle.
                        </p>
                      ) : (
                        <select
                          value={selectedLeadId}
                          onChange={e => setSelectedLeadId(e.target.value)}
                          className="w-full bg-white border border-stone-200 px-2.5 py-2.5 rounded-sm font-sans text-primary text-xs focus:ring-1 focus:ring-gold focus:border-gold outline-hidden"
                        >
                          <option value="">Select Importer...</option>
                          {leads.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.companyName} ({l.country})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 p-3.5 bg-bg-ivory/30 border border-gold/10 rounded-sm">
                      <p className="text-[8px] uppercase tracking-widest text-[#D4AF37] font-bold pb-1 bg-white/20 border-b border-primary/5">Corporate Verification Forms</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider font-bold block text-text-dim">Company Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Arabica Roasters LLC"
                            value={prospectCompany}
                            onChange={e => setProspectCompany(e.target.value)}
                            className="w-full bg-white border border-stone-200 p-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold rounded-sm outline-hidden font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider font-bold block text-text-dim">Procurement Email *</label>
                          <input
                            type="email"
                            required
                            placeholder="buying@roasters.com"
                            value={prospectEmail}
                            onChange={e => setProspectEmail(e.target.value)}
                            className="w-full bg-white border border-stone-200 p-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold rounded-sm outline-hidden font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider font-bold block text-text-dim">Destination Country</label>
                          <select
                            value={prospectCountry}
                            onChange={e => setProspectCountry(e.target.value)}
                            className="w-full bg-white border border-stone-200 p-2 text-xs focus:ring-1 focus:ring-gold focus:border-gold rounded-sm outline-hidden font-sans"
                          >
                            {['Germany', 'United States', 'United Kingdom', 'Japan', 'South Korea', 'Taiwan', 'Australia', 'Netherlands', 'Singapore'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-wider font-bold block text-text-dim">City Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Munich"
                            value={prospectCity}
                            onChange={e => setProspectCity(e.target.value)}
                            className="w-full bg-white border border-stone-200 p-2 text-xs text-primary focus:ring-1 focus:ring-gold focus:border-gold rounded-sm outline-hidden font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product & Weight inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-[#4A5568] block font-bold">Coffee Origin Lot</label>
                      <select
                        value={requestItem}
                        onChange={e => setRequestItem(e.target.value)}
                        className="w-full bg-white border border-stone-200 p-2 rounded-sm outline-hidden font-sans text-xs focus:ring-1 focus:ring-gold"
                      >
                        {PRODUCTS_CATALOGUE.map(coef => (
                          <option key={coef.id} value={coef.name}>{coef.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-[#4A5568] block font-bold">Sample Pouch Weight</label>
                      <select
                        value={requestWeight}
                        onChange={e => setRequestWeight(e.target.value)}
                        className="w-full bg-white border border-stone-200 p-2 rounded-sm outline-hidden font-sans text-xs focus:ring-1 focus:ring-gold"
                      >
                        {['200g', '500g (Recommended)', '1kg'].map(wt => (
                          <option key={wt} value={wt}>{wt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Courier selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-[#4A5568] block font-bold">Preferential Courier Express</label>
                    <select
                      value={requestCourier}
                      onChange={e => setRequestCourier(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 rounded-sm outline-hidden font-sans text-xs focus:ring-1 focus:ring-gold"
                    >
                      {['DHL Express', 'FedEx Priority', 'TNT Worldwide'].map(cou => (
                        <option key={cou} value={cou}>{cou}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-[#4A5568] block font-bold">Cupping Feedback Commitment Note</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Interested in clean floral profiles of Sumatra Wild Natural or Flores fully washed for WBC..."
                      value={requestNotes}
                      onChange={e => setRequestNotes(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2.5 rounded-sm outline-hidden font-sans text-xs focus:ring-1 focus:ring-gold leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isProspectMode && !selectedLeadId}
                    className="w-full py-3 bg-primary text-white hover:bg-neutral-950 hover:text-gold border border-gold/40 rounded-sm uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center justify-center gap-1 bg-emerald-950 disabled:opacity-40 select-none text-xs font-mono"
                  >
                    <Send className="w-4 h-4 text-gold shrink-0 animate-pulse" />
                    Transmit Sample Request
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
