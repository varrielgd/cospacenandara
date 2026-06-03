import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  BookOpen, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  Calculator, 
  FileText, 
  Coffee, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Info, 
  HelpCircle, 
  DollarSign, 
  ArrowRight,
  ClipboardList,
  Mail,
  Layers,
  Handshake,
  Ship,
  Users,
  Target,
  Printer,
  ChevronRight,
  Beaker,
  Check,
  Flame,
  Copy,
  ChevronDown,
  ChevronUp,
  Globe,
  Search,
  Languages
} from 'lucide-react';

const ROAST_PROFILES_MAP: Record<string, {
  name: string;
  process: string;
  moisture: string;
  density: string;
  dryingPhaseAdvice: string;
  maillardAdvice: string;
  developmentAdvice: string;
  levels: Record<'light' | 'medium' | 'medium_dark' | 'dark', {
    chargeTemp: number;
    turningPointTemp: number;
    turningPointTime: string;
    dryEndTemp: number;
    dryEndTime: string;
    firstCrackTemp: number;
    firstCrackTime: string;
    dropTemp: number;
    dropTime: string;
    dtr: string;
    profileDescription: string;
    flavorOutcome: string;
  }>;
}> = {
  gayo_g1: {
    name: "Aceh Gayo Grade 1",
    process: "Wet Hulled (Giling Basah)",
    moisture: "12.5% - 13.0%",
    density: "Dense, Soft Cell Structure (Giling Basah)",
    dryingPhaseAdvice: "Gunakan panas awal yang moderat (Charge Temp 190°C). Kelembaban tinggi membutuhkan waktu pengeringan yang cukup (dry end pada 4-5 menit) agar kelembaban keluar merata, mencegah penguapan mendadak yang merusak struktur sel.",
    maillardAdvice: "Menjaga energi sedang agar fase Maillard berjalan stabil. Fase ini mengkaramelisasi gula kompleks menjadi rasa cokelat hitam yang kaya dan rempah manis.",
    developmentAdvice: "DTR ideal 16-18%. Selesaikan pada Medium-Dark (214°C) untuk menekan rasa selaan tanah yang kurang bersih namun mempertahankan bodi tebal khas Sumatera.",
    levels: {
      light: {
        chargeTemp: 185, turningPointTemp: 82, turningPointTime: "1:20", dryEndTemp: 150, dryEndTime: "4:50", firstCrackTemp: 196, firstCrackTime: "9:10", dropTemp: 202, dropTime: "10:30", dtr: "12.5%",
        profileDescription: "Menonjolkan herba segar dan bodi sedang.", flavorOutcome: "Earthy, Fresh Herbs, Light Citrus"
      },
      medium: {
        chargeTemp: 190, turningPointTemp: 85, turningPointTime: "1:15", dryEndTemp: 150, dryEndTime: "4:30", firstCrackTemp: 196, firstCrackTime: "8:50", dropTemp: 208, dropTime: "10:45", dtr: "15.0%",
        profileDescription: "Seimbang antara bodi tebal dan manis cokelat.", flavorOutcome: "Dark Chocolate, Cedarwood, Brown Sugar"
      },
      medium_dark: {
        chargeTemp: 195, turningPointTemp: 90, turningPointTime: "1:10", dryEndTemp: 150, dryEndTime: "4:15", firstCrackTemp: 196, firstCrackTime: "8:25", dropTemp: 214, dropTime: "10:50", dtr: "18.0%",
        profileDescription: "Profil ekspor klasik. Mengeluarkan bodi luar biasa padat dan aroma cedar yang dominan.", flavorOutcome: "Thick Cacao, Tobacco, Sweet Cedarwood, Low Acidity"
      },
      dark: {
        chargeTemp: 200, turningPointTemp: 95, turningPointTime: "1:05", dryEndTemp: 150, dryEndTime: "4:00", firstCrackTemp: 196, firstCrackTime: "8:00", dropTemp: 220, dropTime: "11:00", dtr: "21.0%",
        profileDescription: "Menghilangkan seluruh keasaman, menghasilkan kepahitan manis arang cokelat.", flavorOutcome: "Dark Cocoa, Roasted Walnut, Bold Smoky Finish"
      }
    }
  },
  gayo_wild: {
    name: "Gayo Wild Natural",
    process: "Wild Natural",
    moisture: "11.5% - 12.0%",
    density: "Dense & High Sugars",
    dryingPhaseAdvice: "Naturals memiliki lapisan gula karamel bebas tinggi di permukaan luar. Gunakan Charge Temp rendah (185°C) dan tingkatkan aliran udara (airflow) setelah menit ke-3 untuk membuang kulit ari (chaff) yang rontok dengan cepat agar tidak terbakar di drum.",
    maillardAdvice: "Perpanjang fase Maillard secara halus agar rasa asam buah-buahan bersinergi dengan manis kompleks brown sugar.",
    developmentAdvice: "DTR pendek (12-14%). Drop cepat setelah First Crack selesai untuk melestarikan rasa strawberry kering dan kesegaran citrus.",
    levels: {
      light: {
        chargeTemp: 180, turningPointTemp: 80, turningPointTime: "1:25", dryEndTemp: 148, dryEndTime: "4:45", firstCrackTemp: 194, firstCrackTime: "9:30", dropTemp: 200, dropTime: "10:40", dtr: "11.0%",
        profileDescription: "Keasaman tropis super terang dengan floral aromatics melimpah.", flavorOutcome: "Dried Strawberry, Bergamot, Vibrant Lemon Zest"
      },
      medium: {
        chargeTemp: 185, turningPointTemp: 83, turningPointTime: "1:20", dryEndTemp: 148, dryEndTime: "4:20", firstCrackTemp: 194, firstCrackTime: "9:00", dropTemp: 204, dropTime: "10:40", dtr: "14.5%",
        profileDescription: "Profil paling direkomendasikan. Rasa buah matang berpadu dengan bodi juicy.", flavorOutcome: "Strawberry Jam, Dark Chocolate Elegance, Brown Sugar"
      },
      medium_dark: {
        chargeTemp: 190, turningPointTemp: 87, turningPointTime: "1:15", dryEndTemp: 148, dryEndTime: "4:00", firstCrackTemp: 194, firstCrackTime: "8:40", dropTemp: 210, dropTime: "10:35", dtr: "17.0%",
        profileDescription: "Manis karamel berat dengan notes buah masak gelap.", flavorOutcome: "Blackberry, Toffee, Dark Roast Cacao"
      },
      dark: {
        chargeTemp: 195, turningPointTemp: 90, turningPointTime: "1:10", dryEndTemp: 148, dryEndTime: "3:50", firstCrackTemp: 194, firstCrackTime: "8:20", dropTemp: 216, dropTime: "10:40", dtr: "20.0%",
        profileDescription: "Acidity hilang sepenuhnya, diganti karamelisasi pekat pahit manis.", flavorOutcome: "Molasses, Charred Berry, Bakers Chocolate"
      }
    }
  },
  java_preanger: {
    name: "Java Preanger Reserve",
    process: "Semi-Washed",
    moisture: "12.0% - 12.5%",
    density: "Dense, Volcanic Terroir",
    dryingPhaseAdvice: "Biji arabika Jawa berdensitas tinggi dapat menahan transfer energi panas yang agresif di awal. Mulai dengan Charge Temp tinggi (205°C) dengan gas penuh 85-90% untuk mempercepat laju kenaikan suhu (RoR).",
    maillardAdvice: "Turunkan laju pembakar (gas) secara bertahap begitu menguning (Yellowing) untuk memperpanjang transisi Maillard demi mengembangkan cita rasa manis teh.",
    developmentAdvice: "DTR 14-16% dengan penyelesaian drop di 208°C (Medium) untuk mengeluarkan rasa teh hitam citrus yang elegan dan manis karamel.",
    levels: {
      light: {
        chargeTemp: 195, turningPointTemp: 88, turningPointTime: "1:15", dryEndTemp: 152, dryEndTime: "4:15", firstCrackTemp: 195, firstCrackTime: "8:30", dropTemp: 202, dropTime: "9:40", dtr: "11.5%",
        profileDescription: "Floral jasmine dan citrus cerah mendominasi cangkir.", flavorOutcome: "Black Tea, Jasmine, Vibrant Lime"
      },
      medium: {
        chargeTemp: 205, turningPointTemp: 92, turningPointTime: "1:10", dryEndTemp: 152, dryEndTime: "3:55", firstCrackTemp: 195, firstCrackTime: "8:05", dropTemp: 208, dropTime: "9:35", dtr: "15.5%",
        profileDescription: "Keseimbangan sempurna dari keasaman citrus dan kemanisan toffee.", flavorOutcome: "Teh Hitam, Citrus Honey, Clean Toffee Finish"
      },
      medium_dark: {
        chargeTemp: 210, turningPointTemp: 96, turningPointTime: "1:05", dryEndTemp: 152, dryEndTime: "3:40", firstCrackTemp: 195, firstCrackTime: "7:45", dropTemp: 213, dropTime: "9:30", dtr: "18.0%",
        profileDescription: "Bodi lebih kental dengan asiditas rendah yang anggun.", flavorOutcome: "Caramelized Sugars, Sweet Orange, Milk Chocolate"
      },
      dark: {
        chargeTemp: 215, turningPointTemp: 100, turningPointTime: "1:00", dryEndTemp: 152, dryEndTime: "3:30", firstCrackTemp: 195, firstCrackTime: "7:25", dropTemp: 218, dropTime: "9:45", dtr: "21.5%",
        profileDescription: "Pahit manis karamel berat.", flavorOutcome: "Dark Molasses, Cocoa Nibs, Roasted Almond"
      }
    }
  },
  bali_kintamani: {
    name: "Bali Kintamani",
    process: "Natural Process",
    moisture: "11.5% - 12.0%",
    density: "Medium Dense, High Citrus Terroir",
    dryingPhaseAdvice: "Suhu muat (Charge Temp) moderat (195°C). Dikarenakan kedekatan penanaman dengan kebun jeruk, asiditas asam sitratnya sangat dominan. Pertahankan RoR yang konsisten di awal agar tidak crash saat pengeringan.",
    maillardAdvice: "Selesaikan Maillard dengan laju sedang untuk melestarikan keasaman alami citrus yang segar.",
    developmentAdvice: "DTR sedang-rendah (13-14%) untuk menjaga kejernihan tropical fruit tanpa hangus. Selesaikan tepat di akhir first crack.",
    levels: {
      light: {
        chargeTemp: 190, turningPointTemp: 84, turningPointTime: "1:22", dryEndTemp: 149, dryEndTime: "4:30", firstCrackTemp: 194, firstCrackTime: "9:10", dropTemp: 201, dropTime: "10:20", dtr: "11.3%",
        profileDescription: "Karakter jeruk nipis cerah laksana jus segar.", flavorOutcome: "Orange Peel, Tangy Grapefruit, Clean Citric Acid"
      },
      medium: {
        chargeTemp: 195, turningPointTemp: 87, turningPointTime: "1:17", dryEndTemp: 149, dryEndTime: "4:05", firstCrackTemp: 194, firstCrackTime: "8:40", dropTemp: 203, dropTime: "10:05", dtr: "13.6%",
        profileDescription: "Rasa tropical fruit super seimbang dengan manis madu kental.", flavorOutcome: "Orange Zest, Sweet Honey, Thick Creamy Body"
      },
      medium_dark: {
        chargeTemp: 200, turningPointTemp: 91, turningPointTime: "1:12", dryEndTemp: 149, dryEndTime: "3:50", firstCrackTemp: 194, firstCrackTime: "8:15", dropTemp: 208, dropTime: "9:55", dtr: "16.8%",
        profileDescription: "Bodi tebal dengan jeruk manis karamel.", flavorOutcome: "Candied Orange, Milk Choc, Caramelized Cane Sugars"
      },
      dark: {
        chargeTemp: 205, turningPointTemp: 95, turningPointTime: "1:08", dryEndTemp: 149, dryEndTime: "3:35", firstCrackTemp: 194, firstCrackTime: "7:50", dropTemp: 215, dropTime: "10:00", dtr: "20.5%",
        profileDescription: "Sangat pahit manis, minim asiditas.", flavorOutcome: "Cacao Liqueur, Dark Molasses, Smokey Wood"
      }
    }
  },
  flores_volcanic: {
    name: "Flores Volcanic Fully Washed",
    process: "Fully Washed",
    moisture: "12.0% - 12.5%",
    density: "Very Dense Volcanic",
    dryingPhaseAdvice: "Fully washed arabika dari Bajawa membutuhkan induksi panas yang kuat sejak awal (Charge 210°C). Gunakan laju pembakar (gas) tinggi untuk menembus densitas sel selulosa yang rapat.",
    maillardAdvice: "Fase ini harus dipangkas secara efisien guna mempertahankan profil aftertaste yang sangat bersih (clean aftertaste).",
    developmentAdvice: "DTR 15% dengan laju drop stabil. Sifat aslinya yang manis nutty-cokelat paling bersinar pada roast level medium.",
    levels: {
      light: {
        chargeTemp: 200, turningPointTemp: 90, turningPointTime: "1:15", dryEndTemp: 151, dryEndTime: "4:00", firstCrackTemp: 196, firstCrackTime: "8:20", dropTemp: 202, dropTime: "9:30", dtr: "12.0%",
        profileDescription: "Nutty segar diringi asiditas lemon yang halus.", flavorOutcome: "Vibrant Hazelnut, Green Apple, Clean Finish"
      },
      medium: {
        chargeTemp: 210, turningPointTemp: 95, turningPointTime: "1:10", dryEndTemp: 151, dryEndTime: "3:45", firstCrackTemp: 196, firstCrackTime: "7:55", dropTemp: 207, dropTime: "9:20", dtr: "15.2%",
        profileDescription: "Sangat seimbang. Kelompok cita rasa cokelat dan kacang bersatu padu.", flavorOutcome: "Roasted Hazelnut, Milk Chocolate, Soft Sweet Citrus"
      },
      medium_dark: {
        chargeTemp: 215, turningPointTemp: 100, turningPointTime: "1:05", dryEndTemp: 151, dryEndTime: "3:30", firstCrackTemp: 196, firstCrackTime: "7:30", dropTemp: 212, dropTime: "9:15", dtr: "18.5%",
        profileDescription: "Cokelat hitam tebal bercampur karamel manis.", flavorOutcome: "Dark Cocoa Powder, Toasted Almond, Caramel"
      },
      dark: {
        chargeTemp: 220, turningPointTemp: 104, turningPointTime: "1:00", dryEndTemp: 151, dryEndTime: "3:15", firstCrackTemp: 196, firstCrackTime: "7:10", dropTemp: 218, dropTime: "9:25", dtr: "21.6%",
        profileDescription: "Bittersweet murni bebas asiditas.", flavorOutcome: "Heavy Carbon Cocoa, Black Pepper, Wood"
      }
    }
  },
  toraja_reserve: {
    name: "Toraja Reserve Blend",
    process: "Fully Washed & Wet Hulled Blend",
    moisture: "12.2% - 12.8%",
    density: "Heterogeneous Blend",
    dryingPhaseAdvice: "Mengolah kopi campuran membutuhkan kelembutan. Pasokan panas muat pada 195°C dengan peningkatan aliran udara awal agar porsi Wet Hulled tidak hangus di drum sedangkan porsi Washed tetap memperoleh pemanasan internal yang cukup.",
    maillardAdvice: "Perpanjang fase Maillard secara bertahap untuk menghasilkan harmoni yang halus di antara kedua komponen.",
    developmentAdvice: "DTR 16-17.5% untuk bodi penuh berlapis rempah dan kakao. Selesaikan di sela-sela Medium hingga Medium-Dark.",
    levels: {
      light: {
        chargeTemp: 190, turningPointTemp: 84, turningPointTime: "1:20", dryEndTemp: 150, dryEndTime: "4:35", firstCrackTemp: 195, firstCrackTime: "9:00", dropTemp: 201, dropTime: "10:15", dtr: "12.2%",
        profileDescription: "Rasa rempah rempah segar yang unik dan bodi ringan.", flavorOutcome: "Lemongrass, Cinnamon, Milk Choc"
      },
      medium: {
        chargeTemp: 195, turningPointTemp: 88, turningPointTime: "1:15", dryEndTemp: 150, dryEndTime: "4:10", firstCrackTemp: 195, firstCrackTime: "8:35", dropTemp: 210, dropTime: "10:10", dtr: "15.6%",
        profileDescription: "Bodi tebal mulus, rasa rempah manis dan kakao tersinkronisasi.", flavorOutcome: "Sweet Cacao, Layered Spices, Light Blackberry"
      },
      medium_dark: {
        chargeTemp: 200, turningPointTemp: 92, turningPointTime: "1:10", dryEndTemp: 150, dryEndTime: "3:50", firstCrackTemp: 195, firstCrackTime: "8:10", dropTemp: 213, dropTime: "10:00", dtr: "18.3%",
        profileDescription: "Definisi rasa Sulawesi klasik. Bodi pekat murni bernuansa lada hitam.", flavorOutcome: "Dark Chocolate, Black Pepper, Cedar Smoke, Rich Caramel"
      },
      dark: {
        chargeTemp: 205, turningPointTemp: 96, turningPointTime: "1:05", dryEndTemp: 150, dryEndTime: "3:35", firstCrackTemp: 195, firstCrackTime: "7:45", dropTemp: 218, dropTime: "9:55", dtr: "21.8%",
        profileDescription: "Arang rempah yang pekat dan berenergi tebal.", flavorOutcome: "Smoked Pepper, Dark Molasses, Heavy Cocoa"
      }
    }
  },
  gayo_lb: {
    name: "Gayo LB Reserve",
    process: "Specialty Semi-Washed (Bourbon Microlot)",
    moisture: "11.8% - 12.2%",
    density: "Super Dense High Altitude (1,500 - 1,850 masl)",
    dryingPhaseAdvice: "Microlot berketinggian ekstrem ini sangat padat dengan konsentrasi asam dan gula buah alami yang tinggi. Gunakan Charge Temp tinggi (212°C) namun turunkan gas cepat begitu mencapai Turning Point guna melatih laju RoR yang menurun elegan (Steady Declining RoR).",
    maillardAdvice: "Fase Maillard singkat namun konvektif tinggi untuk menjaga tingkat keasaman floral yang elegan agar tidak pudar (avoid bake).",
    developmentAdvice: "DTR pendek (11-13%). Selesaikan segera setelah First Crack selesai pada 200°C untuk menonjolkan aroma melati (jasmine), persik (white peach), madu, dan aroma jeruk bergamot.",
    levels: {
      light: {
        chargeTemp: 205, turningPointTemp: 92, turningPointTime: "1:12", dryEndTemp: 151, dryEndTime: "3:50", firstCrackTemp: 194, firstCrackTime: "7:55", dropTemp: 199, dropTime: "8:55", dtr: "11.2%",
        profileDescription: "Menonjolkan kecantikan floral melati terbaik yang sangat wangi.", flavorOutcome: "Jasmine Blossom, Bergamot Oil, White Peach, Lemongrass"
      },
      medium: {
        chargeTemp: 212, turningPointTemp: 96, turningPointTime: "1:08", dryEndTemp: 151, dryEndTime: "3:35", firstCrackTemp: 194, firstCrackTime: "7:30", dropTemp: 201, dropTime: "8:35", dtr: "12.6%",
        profileDescription: "Kombinasi luar biasa dari manis peach, madu murni, dan aroma citrus.", flavorOutcome: "Juicy White Peach, Floral Honeysuckle, Sweet Bergamot, Silky Tea Finish"
      },
      medium_dark: {
        chargeTemp: 216, turningPointTemp: 100, turningPointTime: "1:03", dryEndTemp: 151, dryEndTime: "3:20", firstCrackTemp: 194, firstCrackTime: "7:05", dropTemp: 206, dropTime: "8:20", dtr: "15.0%",
        profileDescription: "Rasa buah kental dengan kemanisan sirup karamel madu.", flavorOutcome: "Caramelized Apricot, Wildflower Honey, Milk Chocolate"
      },
      dark: {
        chargeTemp: 220, turningPointTemp: 104, turningPointTime: "0:58", dryEndTemp: 151, dryEndTime: "3:05", firstCrackTemp: 194, firstCrackTime: "6:40", dropTemp: 212, dropTime: "8:10", dtr: "18.5%",
        profileDescription: "Rasa buah gelap manis tebal, minim karakter floral.", flavorOutcome: "Plum Jam, Molasses, Cocoa Liqueur"
      }
    }
  },
  lampung_reserve: {
    name: "Lampung Reserve Robusta",
    process: "Natural Process",
    moisture: "12.5% - 13.0%",
    density: "Robusta Dense BP Series",
    dryingPhaseAdvice: "Sebagai Fine Robusta, sasarannya adalah merusak asam klorogenat astringen tanpa membumihanguskan aromatik nutty alami. Gunakan Charge Temp 205°C dengan transfer konduktif yang merata.",
    maillardAdvice: "Perpanjang fase Maillard secara signifikan untuk mematangkan rasa malted caramel.",
    developmentAdvice: "DTR panjang (20-22%). Penyangraian harus dalam (Medium-Dark hingga Dark, 218°C) untuk meluluhkan kandungan bodi menjadi cokelat pahit pekat, mentega kacang kenari, dan ketiadaan asiditas.",
    levels: {
      light: {
        chargeTemp: 195, turningPointTemp: 86, turningPointTime: "1:20", dryEndTemp: 152, dryEndTime: "4:40", firstCrackTemp: 198, firstCrackTime: "9:45", dropTemp: 208, dropTime: "11:15", dtr: "13.3%",
        profileDescription: "Terlalu gandum/sereal, tidak disarankan untuk robusta.", flavorOutcome: "Toasted Wheat, Cereal, Woody"
      },
      medium: {
        chargeTemp: 200, turningPointTemp: 90, turningPointTime: "1:15", dryEndTemp: 152, dryEndTime: "4:15", firstCrackTemp: 198, firstCrackTime: "9:15", dropTemp: 212, dropTime: "11:00", dtr: "16.0%",
        profileDescription: "Profil robusta bersih dengan rasa manis malt yang tebal.", flavorOutcome: "Malted Sweetness, Hazelnut, Black Tea Stout"
      },
      medium_dark: {
        chargeTemp: 205, turningPointTemp: 94, turningPointTime: "1:10", dryEndTemp: 152, dryEndTime: "3:55", firstCrackTemp: 198, firstCrackTime: "8:45", dropTemp: 218, dropTime: "10:55", dtr: "20.5%",
        profileDescription: "Definisi espresso base terbaik. Sangat gurih, berminyak tebal, lumer di lidah.", flavorOutcome: "Bold Dark Chocolate, Toasted Walnut, Extreme Low Acidity, Heavy Crema"
      },
      dark: {
        chargeTemp: 210, turningPointTemp: 98, turningPointTime: "1:05", dryEndTemp: 152, dryEndTime: "3:35", firstCrackTemp: 198, firstCrackTime: "8:20", dropTemp: 222, dropTime: "11:00", dtr: "24.2%",
        profileDescription: "Sangrai arang cokelat, pahit tebal mutlak untuk campuran kopi susu kental manis.", flavorOutcome: "Smoky Charcoal, Dark Bakers Cocoa, Ashy Walnut"
      }
    }
  },
  temanggung_fine: {
    name: "Temanggung Fine Robusta",
    process: "Natural Process",
    moisture: "12.0% - 12.5%",
    density: "Highland Robusta SA 237",
    dryingPhaseAdvice: "Robusta dataran tinggi Temanggung memiliki kualitas sensori yang luar biasa bersih. Gunakan profil gas yang menurun perlahan, muat suhu di 208°C.",
    maillardAdvice: "Fase Maillard sedang untuk membangun karamel manis laksana susu cokelat kental tanpa bau tanah bakar.",
    developmentAdvice: "DTR 17-19%. Drop di 212°C sebagai Medium Roast untuk mengapresiasi manis hazelnut panggang and malted sweetness yang memesona.",
    levels: {
      light: {
        chargeTemp: 198, turningPointTemp: 87, turningPointTime: "1:18", dryEndTemp: 151, dryEndTime: "4:20", firstCrackTemp: 197, firstCrackTime: "9:10", dropTemp: 206, dropTime: "10:35", dtr: "13.5%",
        profileDescription: "Malt sereal beraroma gandum manis halus.", flavorOutcome: "Sweet Malt, Grass, Toasted Peanut"
      },
      medium: {
        chargeTemp: 208, turningPointTemp: 91, turningPointTime: "1:13", dryEndTemp: 151, dryEndTime: "3:55", firstCrackTemp: 197, firstCrackTime: "8:40", dropTemp: 212, dropTime: "10:25", dtr: "17.0%",
        profileDescription: "Sangat direkomendasikan untuk Fine Robusta seduh manual. Bersih, gurih, bodi sutra.", flavorOutcome: "Roasted Hazelnut, Malted Chocolate Sweetness, Black Tea Notes, Clean Cup"
      },
      medium_dark: {
        chargeTemp: 212, turningPointTemp: 95, turningPointTime: "1:08", dryEndTemp: 151, dryEndTime: "3:35", firstCrackTemp: 197, firstCrackTime: "8:10", dropTemp: 217, dropTime: "10:15", dtr: "20.3%",
        profileDescription: "Cokelat hitam pekat dengan sensasi kacang almond bakar.", flavorOutcome: "Dark Molasses, Cocoa Nibs, Almond Paste"
      },
      dark: {
        chargeTemp: 216, turningPointTemp: 99, turningPointTime: "1:03", dryEndTemp: 151, dryEndTime: "3:15", firstCrackTemp: 197, firstCrackTime: "7:40", dropTemp: 221, dropTime: "10:10", dtr: "24.5%",
        profileDescription: "Rasa arang gula aren dengan rasa tembakau halus.", flavorOutcome: "Burnt Sugar, Strong Cocoa Liquor, Tobacco notes"
      }
    }
  }
};

const B2B_FAQ_ITEMS = [
  {
    id: "gayo-price",
    category: "buyer_objections",
    negotiationInsight: "Bila buyer menawar harga rendah, geser fokus dari komoditas 'volume' ke jaminan 'stabilitas aw' dan pengerjaan manual 'triple-picked' demi kestabilan rasa saat pengapalan jauh.",
    translations: {
      id: {
        question: "Mengapa kopi Semi-Washed Gayo Anda lebih mahal dibanding Grade 1 komersial dari kolektor besar?",
        answer: "Kopi Semi-Washed Gayo kami berasal dari kebun single-origin berketinggian tinggi (>1.500 mdpl) di Bener Meriah, dipetik merah 100%, dikeringkan perlahan di para-para terlindung (raised beds), bukan di aspal jalanan. Kadar cacat fisik (defect rate) di bawah 1% (triple-picked), serta nilai aw stabil di rentang 0.52-0.58 untuk menjamin stabilitas penyimpanan selama pengapalan laut jarak jauh."
      },
      en: {
        question: "Why is your Semi-Washed Gayo more expensive than commercial Grade 1 from major collectors?",
        answer: "Our Gayo Semi-Washed coffee is sourced from single-origin high-altitude estates (>1,500 masl) in Bener Meriah, 100% red cherry picked, and slowly dried on raised beds rather than street asphalt. The defect rate is below 1% (triple-picked), and water activity (aw) is stabilized between 0.52-0.58 to ensure longevity and freshness during long ocean transits."
      },
      zh: {
        question: "为什么您的半水洗加奥（Gayo Semi-Washed）咖啡比大收集商的商业级Grade 1更贵？",
        answer: "我们的加奥半水洗咖啡源自贝纳尔梅里亚（Bener Meriah）海拔1,500米以上的单一口产区，100%手工采摘红熟果，并于高架阳光棚下慢速干燥，而非路面沥青上。瑕疵率控制在1%以下（三次人工手选），水分活性（aw）稳定在0.52-0.58之间，确保长途海运过程中的稳定性与新鲜度。"
      },
      ja: {
        question: "なぜあなたのガヨ・セミウォッシュドは大手コレクターの商業用グレード1より高いのですか？",
        answer: "当社の半水洗（セミウォッシュド）ガヨコーヒーは、ベネル・ムリアの標高1,500m以上の単一農園から調達され、100%完熟赤実のみを手摘みし、アスファルト上ではなく、高床式ベッドでゆっくりと乾燥されています。欠点率は1%未満（3回ハンドピック）で、水分活性（aw）は0.52-0.58に安定しており、長期海上輸送中の鮮度維持を保証します。"
      },
      de: {
        question: "Warum ist Ihr halbgewaschener Gayo teurer als der kommerzielle Grade 1 von Großhändlern?",
        answer: "Unser halbgewaschener Gayo-Kaffee stammt aus Single-Origin-Plantagen in extremer Höhenlage (>1.500 m ü. M.) in Bener Meriah. Er wird zu 100 % aus reifen roten Kirschen handverlesen und schonend auf Hochbeeten statt auf Straßenasphalt getrocknet. Die Defektquote liegt unter 1 % (dreifach handverlesen), und die Wasseraktivität (aw) ist stabil auf 0,52-0,58 kalibriert, um Frische während des Seetransports zu garantieren."
      }
    }
  },
  {
    id: "cargo-sweat",
    category: "buyer_objections",
    negotiationInsight: "Kondensasi kontainer adalah momok menakutkan bagi importir global. Menunjukkan pencegahan berlapis (GrainPro + Desiccant 300% absorbency) memberi mereka kedamaian spiritual (peace of mind).",
    translations: {
      id: {
        question: "Bagaimana Anda menangani keterlambatan pengiriman atau embun kontainer (cargo sweat) di laut lepas?",
        answer: "Kami menggunakan tas pelindung kelembaban berteknologi tinggi (GrainPro Liner / ultra-hermetic bags) untuk semua karung goni ekspor kami. Kontainer juga dilapisi dengan dry-bag desiccant berspesifikasi tinggi (absorbency >300%) untuk menyerap fluktuasi kelembaban ekstrem saat melintasi garis khatulistiwa."
      },
      en: {
        question: "How do you handle shipping delays or cargo sweat in the ocean containers?",
        answer: "We utilize ultra-hermetic protection liner bags (like GrainPro) inside heavy-duty jute bags for all export shipments. Furthermore, we install high-grade container dry-bag desiccants (potency >300% absorption) to fully capture extreme humidity fluctuations when crossing the equator, eliminating cargo sweat risks."
      },
      zh: {
        question: "您如何处理海运延误或集装箱内的货物返潮（货物出汗）问题？",
        answer: "我们在所有出口麻袋内都使用高阻隔超气密内衬保护袋（如GrainPro）。此外，我们在集装箱内挂置高规格吸湿防霉干燥剂（吸湿率超300%），以吸收集装箱穿越赤道时剧烈的温湿度波动，杜绝货物返潮和集装箱雨风险。"
      },
      ja: {
        question: "海上輸送の遅延や、コンテナ内での「貨物の汗（結露）」にはどのように対処していますか？",
        answer: "当社はすべての輸出用麻袋の内部に、ウルトラヘルメチック（超高気密）保護ライナーバッグ（GrainPro社製など）を使用しています。さらに、赤道を通過する際の極端な湿度変動を完全に吸収し、コンドプレーション（結露）を防ぐため、高吸湿性コンテナ用乾燥剤（吸水率300%以上）を設置します。"
      },
      de: {
        question: "Wie gehen Sie mit Lieferverzögerungen oder Kondenswasserbildung (Cargo Sweat) im Container um?",
        answer: "Wir verwenden für alle Export-Jutesäcke hochgradige, ultrahermetische Schutzliner (z. B. GrainPro). Zusätzlich bringen wir im Überseecontainer Hochleistungs-Trockenmittelbeutel (mit einer Absorptionskapazität von >300 %) an, um extreme Feuchtigkeitsschwankungen bei der Äquatorüberquerung auszugleichen und Kondenswasserschäden komplett zu verhindern."
      }
    }
  },
  {
    id: "preanger-specs",
    category: "product_knowledge",
    negotiationInsight: "Java Preanger Honey dikenal manis nan eksotis. Pengungkapan persentase mukosilase/lendir buah yang disisakan (50%) memberikan kredibilitas metode pengasuhan pasca-panen Anda.",
    translations: {
      id: {
        question: "Bisakah Anda memberikan spesifikasi fisik dan kimia tepercaya untuk Java Preanger Honey?",
        answer: "Spesifikasi Java Preanger Honey kami: Kadar Air: 11.2% - 11.9% | Defect Rate: < 1.5% (SCA Grade 1 Premium) | Ukuran Biji: Screen size 16 (6-7mm) > 90% | Densitas: > 720 g/L | Nilai aw: 0.54 aw | Pengolahan: Honey Process (lapisan lendir buah disisakan 50% saat penjemuran untuk aroma floral manis karamel)."
      },
      en: {
        question: "Can you provide the precise physical and chemical specifications for your Java Preanger Honey?",
        answer: "Java Preanger Honey specs: Moisture: 11.2% - 11.9% | Defect Rate: < 1.5% (SCA Grade 1 Premium) | Size: Screen size 16 (6-7mm) > 90% | Density: > 720 g/L | aw Value: 0.54 aw | Process: Honey process (50% mucilage left intact during drying to develop rich floral, tropical fruit, and sweet caramel notes)."
      },
      zh: {
        question: "您能提供爪哇Preanger蜜处理（Java Preanger Honey）的精准理化规格指标吗？",
        answer: "爪哇Preanger蜜处理规格：水分：11.2% - 11.9% | 瑕疵率：< 1.5%（SCA标准精品1级） | 目数大小：16目以上（6-7mm）占比大于90% | 密度：> 720克/升 | 水分活性：0.54 aw | 工艺方法：50%果胶保留进行日晒蜜处理，从而展现出浓郁的花香、热带水果和甜焦糖风味。"
      },
      ja: {
        question: "ジャワ・プレアンゲル・ハニーの正確な物理的・化学的規格を教えていただけますか？",
        answer: "ジャワ・プレアンゲル・ハニーの規格：水分含有量：11.2% - 11.9% | 欠点率：1.5%未満（SCA認定プレミアムグレード1） | スクリーンサイズ：サイズ16（6-7mm）が90%以上 | 密度：720g/L以上 | 水分活性：0.54 aw | 精製：ハニープロセス（乾燥中にミューシレージを50%残すことで、華やかなフローラル感、トロピカルフルーツ、濃厚なカラメルの甘みを引き出します）。"
      },
      de: {
        question: "Können Sie die genauen physikalischen und chemischen Spezifikationen für Ihren Java Preanger Honey bereitstellen?",
        answer: "Java Preanger Honey Spezifikationen: Feuchtigkeitsgehalt: 11,2 % - 11,9 % | Defektquote: < 1,5 % (SCA Grade 1 Premium) | Bohnengröße: Screen size 16 / 6-7mm (> 90 %) | Dichte: > 720 g/L | aw-Wert: 0,54 aw | Aufbereitung: Honey-Aufbereitung (50 % Fruchtfleischschleim bleibt während der Trocknung intakt, um reiche blumige Aromen, Tropenfrüchte und süße Karamellnoten auszubilden)."
      }
    }
  },
  {
    id: "lampung-clean",
    category: "product_knowledge",
    negotiationInsight: "Robusta sering dituduh apek karena dijemur di tanah. Penjelasan raised beds (para-para tinggi) mematahkan stigma ini dan menaikkan nilai tawar Robusta Specialty di mata pembeli premium.",
    translations: {
      id: {
        question: "Bagaimana proses Lampung Robusta Anda, dan bagaimana menyajikan rasa yang bersih tanpa defect kapang (mouldy)?",
        answer: "Lampung Robusta kami diproses secara Natural Klasik namun dipetik merah 100% selektif. Penjemuran dilakukan di meja bambu tinggi/para-para bersirkulasi udara kontinu untuk mencegah kontak tanah langsung yang memicu cita rasa apek atau kapang. Flotation tank digunakan di awal untuk membuang ceri ringan berlubang penentu rasa pahit kasar. Cita rasa: cokelat tebal (dark cocoa), aroma kacang panggang, bodi tebal, tanpa rasa tanah."
      },
      en: {
        question: "What is the processing style of your Lampung Robusta, and how do you achieve clean cup characteristics?",
        answer: "Our Lampung Robusta is processed through classical Natural method, but with 100% strict red cherry selection. Drying is carried out on elevated raised African beds with continuous air circulation to completely avoid soil contact that causes earthy/mouldy taints. Initial floating tanks discard lightweight hollow cherries. Profile: rich dark cacao, toasted hazelnut, massive crema-friendly body, and absolutely clean cup."
      },
      zh: {
        question: "您的楠榜罗布斯塔（Lampung Robusta）是如何加工的？如何保证干净、无发霉等瑕疵风味？",
        answer: "我们的楠榜罗布斯塔（Lampung Robusta）采用经典的非水洗日晒法，但执行100%全红果采摘。使用高架非洲晾晒网床，拥有连续空气循环，彻底避免与地面的直接接触（避免泥土味或发霉瑕疵）。前期利用浮选槽去空心浮豆。杯测带有黑巧克力和坚果香气，极为干净，醇厚度极佳，完全没有土腥味。"
      },
      ja: {
        question: "ランプン・ロブスタはどのように精製され、どのようにカビ臭さのないクリーンな味わいを実現していますか？",
        answer: "当社のランプン・ロブスタは、伝統的なナチュラル（日晒）プロセスですが、100%赤実の厳密な選別を行っています。乾燥は床への直置きを一切排除した通気性の高い高床式棚（アフリカンベッド）で行われ、カビ臭や土臭を防止します。最初に浮選タンクで未熟な軽い豆（虫食い）を排除。ダークチョコ、ナッツ香、非常にクリーンなコクがあります。"
      },
      de: {
        question: "Wie wird Ihr Lampung Robusta aufbereitet und wie erreichen Sie ein sauberes Tassenprofil ohne Schimmelgeschmack?",
        answer: "Unser Lampung Robusta wird klassisch trocken (Natural) aufbereitet, jedoch mit einer 100 % strengen roten Kirschenauslese. Die Trocknung erfolgt auf erhöhten afrikanischen Betten mit kontinuierlicher Luftzirkulation, um Erdkontakt (Ursache für erdigen/muffigen Geschmack) komplett auszuschließen. Schwimmtanks sortieren hohle Kirschen aus. Profil: dunkler Kakao, geröstete Haselnuss, vollmundiger Crema-Körper, extrem sauberer Abgang."
      }
    }
  },
  {
    id: "kintamani-roast",
    category: "roasting",
    negotiationInsight: "Buyer yang mencari cita rasa buah asam sitrus yang tajam dari dataran tinggi Kintamani wajib disarankan profil Light-to-Medium. Penjelasan DTR rendah membuktikan keahlian sangrai pasca-panen Anda.",
    translations: {
      id: {
        question: "Tingkat sangrai mana yang paling baik mengeluarkan keasaman buah segar di Bali Kintamani Fully Washed?",
        answer: "Tingkat sangrai Light-to-Medium (Drop Temp 200°C s.d 202°C pada mesin Giesen) dengan rasio DTR rendah (12-14%). Ini mengawetkan karakter asam sitrat (citric acidity) buah jeruk kintamani murni dan memicu aroma teh melati segar. Menghindari masuknya aroma gosong/karamel pekat yang menutupi karakter buah asli."
      },
      en: {
        question: "Which roasting level expresses the highest fruit acidity of Bali Kintamani Fully Washed coffee?",
        answer: "A Light-to-Medium roast profile (Drop Temp 200°C - 202°C on Giesen machines) with a low DTR ratio (12-14%) best preserves the orange-like citric acidity and dynamic jasmine tea aromas typical of Bali Kintamani. Heavy caramel reserves or dark roast notes mask the unique origin-specific fruit acids."
      },
      zh: {
        question: "巴厘岛金塔马尼全水洗（Bali Kintamani Fully Washed）最适合哪种烘焙程度来展现其水果酸质？",
        answer: "巴厘岛金塔马尼全水洗最适合浅度至中度烘焙（Giesen烘焙机排豆温度200°C至202°C），发展时间比（DTR）保持在12-14%的低水平。这样能完美锁住其特有的柑橘类柠檬酸活性和茉莉花茶香，避免深烘焙后碳化焦糖风味掩盖产区独特的芬芳果酸。"
      },
      ja: {
        question: "バリ・キンタマーニ・フルウォッシュドのもつフレッシュな柑橘系の酸味を最も引き出すのはどの焙煎度ですか？",
        answer: "バリ・キンタマーニ・フルウォッシュドの柑橘系シトラス酸を最もうまく引き出すのは、低DTR比（12-14%）のライト〜ミディアムロースト（ギーセン焙煎機でハゼ終わりの200°C〜202°Cでドロップ）です。深煎りを避けることで、オリジン特有のスッキリしたオレンジやジャスミンの上品な香りがカラメル香に覆い隠されるのを防ぎます。"
      },
      de: {
        question: "Welcher Röstgrad bringt die frische Fruchtsäure des Bali Kintamani Fully Washed am besten zur Geltung?",
        answer: "Ein Light-to-Medium-Röstprofil (Drop-Temperatur 200 °C - 202 °C auf Giesen-Maschinen) mit einer niedrigen DTR-Rate (12-14 %) bewahrt die zitrische Orangensäure und die jasmine-artigen Teearomen des Bali Kintamani am besten. Dunklere Röstungen caramelisieren zu stark und überdecken die delikaten Fruchtsäuren der Ursprungsregion."
      }
    }
  },
  {
    id: "charge-temp-calib",
    category: "roasting",
    negotiationInsight: "Hubungan densitas biji dengan Charge Temp menunjukkan penguasaan fisika termal roastery Anda. Ini membuktikan bahwa kita tidak memanggang kopi secara asalan/feeling.",
    translations: {
      id: {
        question: "Bagaimana menyesuaikan Charge Temp untuk biji berkepadatan sangat tinggi dibanding Robusta dataran rendah?",
        answer: "Biji berkepadatan tinggi (SHB / Hard Density seperti Gayo Arabika > 1.500m) dapat menyerap panas sangat cepat tanpa gosong; kami pakai Charge Temp tinggi (205°C - 210°C). Sebaliknya, Robusta dataran rendah dengan densitas sel yang lebih longgar membutuhkan suhu muat lebih sejuk (190°C - 195°C) ditambah aliran udara agresif agar teras biji matang merata tanpa risiko mencederai kulit luar (scorching)."
      },
      en: {
        question: "How do you adjust Charge Temp for hard density mountain beans versus softer lowland robusta?",
        answer: "High-density mountain beans (SHB / Strictly Hard Bean, like Gayo Arabica at >1,500 masl) absorb heat incredibly well; we roast with a robust Charge Temp (205°C - 210°C). Lowland Robusta, possessing a looser cellulose matrix, requires a cooler Charge Temp (190°C - 195°C) and aggressive exhaust airflow early on to cook the core evenly without surface scorching."
      },
      zh: {
        question: "对于高密度硬山豆（SHB）与较松软的低地罗布斯塔，您如何调整投豆温度（Charge Temp）？",
        answer: "高海拔硬豆（如海拔1500m以上的加奥阿拉比卡，SHB硬度级）具有紧密的蜂窝结构，能耐受并迅速吸收高热能而不易焦糊；我们使用较高的投豆温度（205°C - 210°C）。相反，对于气孔网较为疏松的低海拔罗布斯塔，则必须使用较低的投料温度（190°C - 195°C）并提前加大风门，以防表面烧焦且内部不熟。"
      },
      ja: {
        question: "標高の高い硬質豆（高密度）と、標高の低い柔らかいロブスタ豆では、チャージ温度をどう調整しますか？",
        answer: "高地産の高密度硬質豆（標高1500m以上のガヨ・アラビカなどのSHB）は熱吸収に優れているため、205°C〜210°Cの高いチャージ温度（投豆温度）で焙煎します。一方、セルの密度が緩い低地産ロブスタは、表面の焦げを避けて core（中心部）まで均一に火を通すために低いチャージ温度（190°C〜195°C）と初期の積極的な排気エアフロー制御が必要です。"
      },
      de: {
        question: "Wie passen Sie die Charge-Temperatur für extrem harte Hochlandbohnen im Vergleich zu weicheren Tiefland-Robustas an?",
        answer: "Hochelastische, dichte Bergbohnen (SHB-Bohnen wie Gayo Arabica > 1.500 m) absorbieren Hitze sehr schnell; wir rösten sie mit einer hohen Charge-Temperatur (205 °C - 210 °C). Weichere Tiefland-Robustabohnen haben lose Zellwände und erfordern eine sanftere Charge-Temperatur (190 °C - 195 °C) sowie einen starken Luftstrom zu Beginn, damit der Kern gart ohne die Bohne zu verbrennen (Scorching)."
      }
    }
  },
  {
    id: "export-docs",
    category: "payments",
    negotiationInsight: "Kepastian dokumen ekspor membedakan petani lokal vs eksportir profesional berijazah internasional. Penting menyorot registrasi FDA dan Phytosanitary Certificate secara aktif.",
    translations: {
      id: {
        question: "Dokumen ekspor apa saja yang wajib untuk customs clearance di Taiwan, Jepang, dan Amerika Serikat?",
        answer: "Dokumen standar ekspor meliputi: Bill of Lading (B/L), Commercial Invoice, Packing List, Certificate of Origin (SKA Form K/K), CoO. Khusus Taiwan & Jepang wajib menyertakan Phytosanitary Certificate (bebas hama dari badan karantina pertanian) dan CO (Certificate of Analysis). Untuk Amerika Serikat (USA), eksportir dan importir wajib terdaftar di FDA (Food and Drug Administration) dengan mengirimkan berkas Prior Notice (PN) sebelum kapal berlabuh."
      },
      en: {
        question: "Which export documents are mandatory for customs clearance in Taiwan, Japan, and USA?",
        answer: "Major export documents: Bill of Lading (B/L), Invoice, Packing List, and Certificate of Origin (CoO). For Taiwan and Japan: Phytosanitary Certificate (pest-free safety clearance certified by Agricultural Quarantine Agencies) and Certificate of Analysis (CoA) are strict mandates. For USA imports: The exporter must fulfill FDA registration, and the buyer must file a Prior Notice (PN) with the FDA before cargo arrives at US ports."
      },
      zh: {
        question: "出口单证通关方面，销往中国台湾、日本和美国各需要准备哪些强制证书和文件？",
        answer: "通关出口核心单证：提单（B/L）、商业发票、装箱单和原产地证（CoO）。中国台湾和日本必须强制提供由农业检意局签发的【植物检疫证书】（Phytosanitary Certificate）以及分析证书（CoA）。美国（USA）出口商和进口商均须进行【美国食品药品监督管理局（FDA）】注册认证，且货物到港前必须提交【预先通知/Prior Notice (PN)】"
      },
      ja: {
        question: "台湾、日本、および米国での通関手続きに必須の輸出書類は何ですか？",
        answer: "必要な標準通関書類：船荷証券（B/L）、商業インボイス、パッキングリスト、原産地証明書（CoO）。台湾・日本：農林水産（輸出入）検疫局が発行する「植物検疫証明書（Phytosanitary Certificate）」および分析証明書（CoA）の添付が厳格に義務付けられています。アメリカ合衆国（USA）：輸出業者・輸入業者ともにFDA（食品医薬品局）登録が必須であり、貨物が米国港に到着する前に「事前告知（Prior Notice: PN）」の提出が必要です。"
      },
      de: {
        question: "Welche Exportdokumente sind für die Zollabfertigung in Taiwan, Japan und den USA zwingend erforderlich?",
        answer: "Standard-Exportdokumente: Frachtbrief (Bill of Lading - B/L), Handelsrechnung, Packliste, Ursprungszeugnis (Certificate of Origin). Taiwan & Japan: Ein offizielles Phytosanitär-Zertifikat (Pflanzengesundheitszeugnis) und ein Analysezertifikat (CoA) sind Voraussetzung. USA: Exporteure und Importeure müssen bei der FDA (Food and Drug Administration) registriert sein, und vor dem Einlaufen des Schiffs im US-Hafen muss die Vorabanmeldung (Prior Notice - PN) erfolgen."
      }
    }
  },
  {
    id: "payments-lc",
    category: "payments",
    negotiationInsight: "Pembayaran L/C At Sight (Letter of Credit) adalah opsi terbaik untuk transaksi senilai puluhan ribu USD dengan pembeli korporat baru. Ini mengamankan eksportir dari wanprestasi bayar.",
    translations: {
      id: {
        question: "Apakah Anda menerima metode pembayaran L/C atau harus T/T?",
        answer: "Kami menerima T/T dengan DP 30-50% di awal, sisa pembayaran dilunasi saat pemuatan peti kemas dan penyerahan copy dokumen scan Bill of Lading (B/L). Untuk pembelian volume besar berskala kontinu (min 1 Container Load / FCL 20ft), kami menerima metode L/C At Sight (Letter of Credit) Irrevocable melalui bank devisa koresponden utama Indonesia demi keamanan transaksi dua arah."
      },
      en: {
        question: "Do you accept payment via L/C (Letter of Credit) or strictly Telegraphic Transfer (T/T)?",
        answer: "We standardly operate with T/T payments (30-50% Down Payment), with the remaining balance settled upon loading against copies of the original Bill of Lading (B/L). For large, repeating volumes (minimum 1 Full Container Load - 20ft FCL), we accept Irrevocable L/C At Sight (Letter of Credit) routed through reputable international correspondent banks for mutual security."
      },
      zh: {
        question: "您接受信用证（L/C）在线付款方式吗？还是只接受电汇（T/T）结算？",
        answer: "对于小批量订单，我们提供电汇方式（T/T，30-50%预付订金），余款凭原提单（B/L）复印件于装船后支付。针对长期稳定的集装箱整柜订单（最小采购量：1座20公尺整柜 / FCL 20ft 柜），我们接受开立【不可撤销即期信用证】（Irrevocable L/C At Sight）以保证双边贸易安全。"
      },
      ja: {
        question: "お支払いは不可撤信（L/C信用状決済）も可能ですか？それともT/T（電信送金）のみですか？",
        answer: "通常お取引は30-50%の前受金（DP）を伴うT/T電信送金を採用しており、残高は船積書類一式（B/L等コピー）提示時での決済となります。ただし、コンテナ単位（20フィートFCL以上）の大口の継続輸入契約の場合は、相互의安全のために主要為替取引銀行を通じた「変更不可・即期信用状（Irrevocable L/C At Sight）」に対応いたします。"
      },
      de: {
        question: "Akzeptieren Sie die Zahlung per Akkreditiv (L/C) oder ausschließlich per telegrafischer Überweisung (T/T)?",
        answer: "Standardmäßig arbeiten wir mit Telegraphic Transfer (T/T, 30 % - 50 % Anzahlung); die Restzahlung erfolgt nach Containerbeladung gegen Vorlage der Bill of Lading (B/L) in Kopie. Bei regelmäßigen Abnahmen ab 1 vollen 20-Fuß-Container (FCL) akzeptieren wir die Abwicklung über ein unwiderrufliches Sichtakkreditiv (Irrevocable L/C At Sight) über internationale Korrespondenzbanken."
      }
    }
  }
];

interface CurriculumViewProps {
  leads?: Lead[];
}

export default function CurriculumView({ leads = [] }: CurriculumViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'blueprint' | 'funnel' | 'negotiation' | 'shipping_payment' | 'fobcif' | 'documents' | 'roasting' | 'qc' | 'scams' | 'tracker' | 'sample_flow' | 'sample_quotation' | 'faq'
  >('blueprint');
  
  // FAQ state
  const [faqLanguage, setFaqLanguage] = useState<'id' | 'en' | 'zh' | 'ja' | 'de'>('id');
  const [faqCategory, setFaqCategory] = useState<'buyer_objections' | 'product_knowledge' | 'roasting' | 'payments'>('buyer_objections');
  const [faqSearch, setFaqSearch] = useState<string>('');
  const [faqExpandedIndex, setFaqExpandedIndex] = useState<number | null>(null);
  const [faqCopiedId, setFaqCopiedId] = useState<string | null>(null);

  // Interactive SCA Cupping Score Simulator State
  const [cupAroma, setCupAroma] = useState<number>(8.0);
  const [cupFlavor, setCupFlavor] = useState<number>(8.0);
  const [cupAftertaste, setCupAftertaste] = useState<number>(8.0);
  const [cupAcidity, setCupAcidity] = useState<number>(8.0);
  const [cupBody, setCupBody] = useState<number>(8.0);
  const [cupBalance, setCupBalance] = useState<number>(8.0);
  const [cupOverall, setCupOverall] = useState<number>(8.0);
  
  // Custom 5 Cups Checkboxes
  const [cupUniformity, setCupUniformity] = useState<boolean[]>([true, true, true, true, true]);
  const [cupCleanCup, setCupCleanCup] = useState<boolean[]>([true, true, true, true, true]);
  const [cupSweetness, setCupSweetness] = useState<boolean[]>([true, true, true, true, true]);
  
  // Defects
  const [defectCups, setDefectCups] = useState<number>(0);
  const [defectType, setDefectType] = useState<2 | 4>(2); // 2 = Taint (minor), 4 = Fault (major moldy/sour/phenol)

  // calculations for SCA score
  const calcCleanCup = cupCleanCup.filter(Boolean).length * 2;
  const calcUniformity = cupUniformity.filter(Boolean).length * 2;
  const calcSweetness = cupSweetness.filter(Boolean).length * 2;
  const defectDeduction = defectCups * defectType;
  
  const baseScaScore = cupAroma + cupFlavor + cupAftertaste + cupAcidity + cupBody + cupBalance + calcCleanCup + calcUniformity + calcSweetness + cupOverall;
  const finalScaScore = Math.max(0, Math.min(100, baseScaScore - defectDeduction));

  // Interactive Sample Quotation Formulator State
  const [sampleQuoteLeadId, setSampleQuoteLeadId] = useState<string>('');
  const [sampleQuoteProduct, setSampleQuoteProduct] = useState<string>('Gayo Wild Natural (Modern Process)');
  const [sampleQuoteQuantity, setSampleQuoteQuantity] = useState<number>(5); // Kg
  const [sampleQuotePricePerKg, setSampleQuotePricePerKg] = useState<number>(12.5); // USD/Kg
  const [sampleQuoteShipping, setSampleQuoteShipping] = useState<number>(95.0); // USD Courier Delivery
  const [sampleQuotePhyto, setSampleQuotePhyto] = useState<boolean>(true); // default true (add USD 16.50)
  const [sampleQuoteVacuum, setSampleQuoteVacuum] = useState<boolean>(true); // default true (add USD 5.00)
  const [sampleQuoteNotes, setSampleQuoteNotes] = useState<string>('');
  const [sampleQuoteIncoterm, setSampleQuoteIncoterm] = useState<string>('DAP Air Freight (Delivered at Place)');
  const [showSampleQuoteReceipt, setShowSampleQuoteReceipt] = useState<boolean>(false);
  const [generatedSampleQuoteNumber, setGeneratedSampleQuoteNumber] = useState<string>('');
  const [quoterSignatureName, setQuoterSignatureName] = useState<string>('Ir. Varriel G.D., Q-Grader');

  // Calculations for Sample Quotation
  const commodityCost = sampleQuoteQuantity * sampleQuotePricePerKg;
  const phytoCost = sampleQuotePhyto ? 16.50 : 0;
  const vacuumCost = sampleQuoteVacuum ? 5.00 : 0;
  const sampleQuoteTotal = commodityCost + sampleQuoteShipping + phytoCost + vacuumCost;
  
  // Quiz states for Buyer Qualification test
  const [qualDomain, setQualDomain] = useState<boolean>(true);
  const [qualCourier, setQualCourier] = useState<boolean>(false);
  const [qualDemand, setQualDemand] = useState<boolean>(true);
  const [qualMaps, setQualMaps] = useState<boolean>(false);

  // Roasting Masterclass state selectors
  const [roastSelectedProduct, setRoastSelectedProduct] = useState<string>('gayo_g1');
  const [roastSelectedLevel, setRoastSelectedLevel] = useState<'light' | 'medium' | 'medium_dark' | 'dark'>('medium');
  const [roastBatchWeight, setRoastBatchWeight] = useState<number>(12); // Kgs
  const [roastAirflowPercent, setRoastAirflowPercent] = useState<number>(65); // %
  const [roastDrumRpm, setRoastDrumRpm] = useState<number>(55); // RPM
  const [roastDensityLevel, setRoastDensityLevel] = useState<'soft' | 'medium' | 'hard'>('medium');
  
  // Custom user-defined density modifications for the Roast Curve Simulator
  const [softDensityCtOffset, setSoftDensityCtOffset] = useState<number>(-12);
  const [softDensityAirflowOffset, setSoftDensityAirflowOffset] = useState<number>(-5);
  const [hardDensityCtOffset, setHardDensityCtOffset] = useState<number>(15);
  const [hardDensityAirflowOffset, setHardDensityAirflowOffset] = useState<number>(8);
  
  // High-converting B2B outreach email pitching states
  const [pitchSelectedProduct, setPitchSelectedProduct] = useState<string>('gayo_g1');
  const [pitchSelectedAngle, setPitchSelectedAngle] = useState<'direct_trade' | 'traceability_sensory' | 'quick_sample_offer'>('quick_sample_offer');
  const [pitchCopiedStatus, setPitchCopiedStatus] = useState<'none' | 'subject' | 'body'>('none');
  
  // Curriculum Selected Template State for nine crops
  const [currSelectedTemplate, setCurrSelectedTemplate] = useState<string>('gayo_g1');
  const [currCopiedStatus, setCurrCopiedStatus] = useState<'none' | 'subject' | 'body'>('none');
  
  // Country specific regulatory state selector
  const [selectedDocCountry, setSelectedDocCountry] = useState<'usa' | 'eu' | 'china' | 'taiwan'>('usa');
  
  // Interactive FOB vs CIF Simulator State
  const [fobPrice, setFobPrice] = useState<number>(6.5); // Per Kg (USD)
  const [quantityKg, setQuantityKg] = useState<number>(19200); // 1 FCL standard 20ft contains roughly 19.2 Metric Tons
  const [freightCost, setFreightCost] = useState<number>(3200); // Standard Sea Freight to EU/USA
  const [insuranceRate, setInsuranceRate] = useState<number>(0.25); // Percentage of total cargo value

  // Interactive Checklist State matching the user's provided task flow images
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    learn_invoice: false,
    learn_packing_list: false,
    learn_coo: false,
    learn_peb: false,
    learn_hs_code: false,
    learn_moisture: false,
    learn_defect: false,
    learn_grading: false,
    learn_screen: false,
    follow_up: false,
    send_sample: false,
    track_sample: false,
    request_feedback: false,
    negotiate_small: false,
    total_eval: false,
    // New checklists linked to expanded lessons
    learn_email_gayo: false,
    learn_email_java: false,
    learn_funnel_tofu: false,
    learn_funnel_b2b: false,
    learn_nego_price: false,
    learn_nego_incoterm: false,
    learn_shipping_grainpro: false,
    learn_payment_protection: false,
  });

  const toggleTask = (key: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculations for simulated cost breakdown
  const cargoValue = fobPrice * quantityKg;
  const insuranceCost = (cargoValue + freightCost) * (insuranceRate / 100);
  const cifPriceTotal = cargoValue + freightCost + insuranceCost;
  const cifPricePerKg = cifPriceTotal / quantityKg;

  const progressPercentage = Math.round(
    (Object.values(completedTasks).filter(Boolean).length / Object.keys(completedTasks).length) * 100
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in" id="curriculum-view-root">
      {/* Top Banner Overview */}
      <div className="bg-[#05190F] border border-[#C9A227]/30 rounded-lg p-6 md:p-8 text-white relative overflow-hidden shadow-luxury">
        <div className="absolute inset-0 bg-[radial-gradient(#C9A227_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-10" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9A227] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A227] font-bold">PT. Nandara Nusa Montierra • Corporate Export Academy</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif italic text-white leading-tight">
            Nandara Export Curriculum & Masterclass
          </h1>
          <p className="text-xs md:text-sm text-gray-300 font-sans max-w-3xl leading-relaxed">
            Kurikulum perdagangan internasional kopi terlengkap yang dirancang khusus untuk kondisi lapangan eksportir Indonesia secara jujur. Pelajari cara bypass buyer scam, email pitch terbukti tembus roaster global, strategi negosiasi harga, instalasi GrainPro, serta simulator komersial FOB/CIF.
          </p>
        </div>
      </div>

      {/* Curriculum Stage Segment Ribbon */}
      <div className="bg-[#F7F4EC] border border-[#05190F]/10 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#05190F] text-[#C9A227] rounded-full">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif italic font-bold text-sm text-[#05190f]">Export Academy Learning Progress</h4>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Selesaikan seluruh modul interaktif untuk sertifikasi</p>
          </div>
        </div>
        <div className="w-full md:w-96 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#C9A227] to-[#05190F] h-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-[#05190F]">{progressPercentage}% Complete</span>
        </div>
      </div>

      {/* Subtab Navigation Panel */}
      <div className="border-b border-[#05190F]/10 flex flex-wrap gap-1 md:gap-2 pb-1" id="curriculum-subtabs">
        {[
          { id: 'blueprint', label: 'Secrets of Pecah Telur', icon: Sparkles },
          { id: 'funnel', label: 'B2B Marketing Funnel', icon: Layers },
          { id: 'sample_flow', label: 'Sample Flow Analysis', icon: ClipboardList },
          { id: 'sample_quotation', label: 'Sample Quotation Builder', icon: Calculator },
          { id: 'negotiation', label: 'Price & Lead Closing', icon: Handshake },
          { id: 'shipping_payment', label: 'Logistics & Payments', icon: Ship },
          { id: 'documents', label: 'Export Documents', icon: FileText },
          { id: 'roasting', label: 'Roasting Masterclass', icon: Flame },
          { id: 'qc', label: 'QC & Cupping Score', icon: Coffee },
          { id: 'fobcif', label: 'FOB & CIF Simulator', icon: Calculator },
          { id: 'scams', label: 'Anti-Scam Protection', icon: ShieldAlert },
          { id: 'faq', label: 'B2B Export FAQ', icon: HelpCircle },
          { id: 'tracker', label: 'Interactive Task Roadmap', icon: ClipboardList },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-sm font-mono text-[10px] md:text-[11px] tracking-wider uppercase font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                isActive 
                  ? 'bg-[#05190F] text-[#C9A227] border-[#C9A227]' 
                  : 'text-[#05190F]/70 hover:text-[#05190F] hover:bg-[#05190F]/5 border-transparent'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab Contents Container */}
      <div className="grid grid-cols-1 gap-8" id="curriculum-body-views">

        {/* 1. SECRETS OF PECAH TELUR (Enhanced with Cold Email Pitch & Templates) */}
        {activeSubTab === 'blueprint' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C9A227]" /> 
                    Strategi 30 Hari Pecah Telur (First Order Secrets)
                  </h3>
                  <h2 className="text-2xl font-serif italic text-[#05190F]">Rahasia Akselerasi Transaksi Ekspor Perdana & Email Sourcing</h2>
                  
                  <p className="text-xs text-gray-700 leading-relaxed font-sans">
                    Mendapatkan pembeli pertama ("pecah telur") dalam industri ekspor kopi hijau specialty menuntut ketepatan komunikasi taktis dan pembagian risiko yang cerdas. Banyak eksportir pemula gagal karena terlalu kaku atau kurang responsif dalam menyuplai sampel terverifikasi.
                  </p>

                  <div className="border-l-2 border-[#C9A227] pl-4 italic text-xs text-gray-600 font-sans my-4 bg-[#F7F4EC]/60 p-3 rounded-r-md">
                    "Kunci utama pecah telur bukan pada perang harga termurah, melainkan pada kecepatan menyediakan sampel berkualitas tinggi dengan informasi traceability yang mutlak jujur."
                  </div>

                  <div className="space-y-4 mt-6">
                    <h4 className="font-serif font-bold text-[#05190F] text-base">Fase 1: Filter Potensial Importer Tercepat</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      Jangan menghabiskan waktu bertukar pesan dengan distributor lokal kelas tiga atau broker perantara yang tidak jelas. Gunakan modul <strong>Importer Registry</strong> di dashboard ini untuk menyasar importir resmi di wilayah Uni Eropa (Hamburg, Rotterdam), Jepang, atau Amerika Serikat yang memiliki komitmen direct trade.
                    </p>

                    <h4 className="font-serif font-bold text-[#05190F] text-base">Fase 2: Teknik Gaya & Bahasa Outreach Lead (Anti-Gagal)</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      Hindari bahasa template pemasaran masal ("Dear Sir/Madam, we are cheap exporter"). Buyer kopi global sangat membenci email template yang tidak profesional. 
                      Gunakan gaya penulisan <strong>Spec-First & Origin Honesty</strong>: tulis secara lugas, sebutkan varietas spesifik, ketinggian kebun riil, kadar air yang diuji di laboratorium mini koperasi Anda, serta jumlah limit defect fisik yang bisa Anda jamin demi kredibilitas tertinggi.
                    </p>

                    <h4 className="font-serif font-bold text-[#05190F] text-base">Fase 3: Jembatan Trial Order LCL (Less than Container Load)</h4>
                    <p className="text-xs text-gray-600 leading-relaxed font-sans">
                      Untuk mengurangi ketakutan importir terhadap penipuan pengiriman dari Asia Tenggara, tawarkan skema <strong>Trial LCL Order</strong> (kurang dari satu kontainer penuh, misalnya 1 - 2 ton) sebelum memesan kontainer FCL (19.2 ton). Hal ini mempercepat proses uji kelayakan di gudang mereka.
                    </p>
                  </div>
                </div>

                {/* EMAIL TEMPLATES (GAYA DAN BAHASA DENGAN ISI EMAIL YANG PASTI DIRESPON) */}
                <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-6">
                  <div className="border-b border-[#05190F]/10 pb-4">
                    <h3 className="text-xs font-mono tracking-widest text-[#05190F] font-bold uppercase flex items-center gap-1.5 mb-1">
                      <Mail className="w-4 h-4 text-[#C9A227] animate-pulse" /> Outreach Spec Templates
                    </h3>
                    <h2 className="text-xl font-serif italic text-[#05190F]">Template Email Penawaran yang Pasti Direspon</h2>
                    <p className="text-xs text-gray-500 font-sans mt-1">
                      Pilih dari salah satu dari 9 produk kopi premium Anda di bawah ini untuk melihat template email dingin (cold email) profesional, jujur, dan berorientasi spesifikasi teknis tinggi (SCA standard) yang siap dikirimkan kepada buyer internasional.
                    </p>
                  </div>

                  {/* 9-Product Selection Pills */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold block">Pilih Produk Kopi Anda:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-1 text-xs">
                      {[
                        { id: 'gayo_g1', label: 'Aceh Gayo G1' },
                        { id: 'gayo_wild', label: 'Gayo Wild Natural' },
                        { id: 'java_preanger', label: 'Java Preanger' },
                        { id: 'bali_kintamani', label: 'Bali Kintamani' },
                        { id: 'flores_volcanic', label: 'Flores Volcanic' },
                        { id: 'toraja_reserve', label: 'Toraja Reserve' },
                        { id: 'gayo_lb', label: 'Gayo LB Reserve' },
                        { id: 'lampung_reserve', label: 'Lampung Robusta' },
                        { id: 'temanggung_fine', label: 'Temanggung Robusta' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCurrSelectedTemplate(p.id)}
                          className={`px-2 py-2 text-[10px] font-mono tracking-tight font-bold rounded cursor-pointer border transition-all text-center leading-tight ${
                            currSelectedTemplate === p.id
                              ? 'bg-[#05190F] text-[#C9A227] border-[#C9A227] shadow'
                              : 'bg-stone-50 text-gray-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Selected Template Display */}
                  {(() => {
                    const OUTREACH_TEMPLATES_DATA: Record<string, {
                      name: string;
                      badge: string;
                      badgeColor: string;
                      shortDesc: string;
                      subject: string;
                      tone: string;
                      body: string;
                      strategicInsight: string;
                      taskKey: string;
                    }> = {
                      gayo_g1: {
                        name: "Aceh Gayo G1 (Giling Basah - Wet Hulled)",
                        badge: "Earthy & Sweet Giling Basah",
                        badgeColor: "bg-emerald-100 text-emerald-800",
                        shortDesc: "Template ekspor khusus untuk kopi Aceh Gayo G1 dengan parameter moisture, defects, dan profile rasa earthy yang transparan dan jujur demi meyakinkan buyer Eropa & AS.",
                        subject: "Direct Sourcing Proposal: Sumatra Aceh Gayo Grade 1 (Wet-Hulled) - Fresh Crop",
                        tone: "Spec-Driven, Professional, Transparent",
                        body: `Dear [Importer/Green Coffee Buyer Name],

We are PT. Nandara Nusa Montierra, a direct exporter cooperating with smallholder farming clusters in [Bener Meriah/Takengon], Sumatra. Knowing your focus on distinct, sweet, earthy specialty lots, we would like to present our current crop of Sumatra Gayo Arabica (Double-Picked Grade-1).

We choose to be 100% transparent with our lot specifications:
• Botanical Variety: Catimor Jalong, Ateng Super
• Process: Wet-Hulled (Giling Basah) 
• Elevation: 1,200 to 1,450 MASL
• Screen size: Min 17/18 (Large Beans, 90% uniform)
• Moisture Content: 12.0% (measured using calibrated Kett Tester)
• Defect limits: Max 4-5 secondary defects per 300g sample (SCA standard, 0 primary defect)
• Cupping profile: Heavy, syrupy body, vibrant cedar wood, fresh herbs, chocolatey sweetness, and long pleasant brown sugar aftertaste. (Calibrated SCA Score: 83.50)

Our stock is already milled and secured in food-grade warehouse lining at 21°C in Medan, North Sumatra. We understand the risk of humidity damage during transit across the equator, which is why we ship all our export bags lined with original GrainPro hermetic protection.

We can provide an on-demand LCL (Less-than-Container Load) trial shipment of 1,000 - 3,000 kg so you can test roast and cupping performance before committing to FCL contract bounds.

Would you like us to dispatch a 200g vacuum-sealed green sample to your roastery address? Please provide your DHL/FedEx courier account details for instant parcel pickup coordinates, or let us know if we should invoice the shipping fee directly.

Sincerely,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Sumatra Gayo Wet-Hulled (Giling Basah) sangat dicari karena body-nya yang tebal & aroma cedarwood yang eksotis. Buyer internasional sangat sensitif terhadap kelembaban giling basah yang sering tidak stabil. Dengan menyatakan moisture diukur menggunakan digital Kett tester secara konstan di angka 12.0%, Anda langsung menyejajarkan diri sebagai eksportir modern dan terpercaya.",
                        taskKey: "learn_email_gayo"
                      },
                      gayo_wild: {
                        name: "Gayo Wild Natural (Specialty Yeast-Aerobic)",
                        badge: "Bright Fruit Bomb Microlot",
                        badgeColor: "bg-rose-100 text-rose-800",
                        shortDesc: "Sudut pandang penawaran eksklusif untuk lot Gayo Wild Natural berkarakter sensori buah berry merah segar dan kemanisan luar biasa, menargetkan pasar specialty premium.",
                        subject: "Micro-Lot Allocation: Sumatra Gayo Wild Natural (Yeast-Aerobic Sourcing)",
                        tone: "Enthusiastic, Flavor-Centric, Premium Asset",
                        body: `Dear [Green Coffee Buyer Name],

At PT. Nandara Nusa Montierra, our sensory panel is extremely excited to announce the final sorting of our limited reserve allocation: Sumatra Gayo Wild Natural (Micro-Lot, Cup Score 85.75).

This premium lot represents a highly specialized natural fermentation technique executed on solar raised African beds in Takengon, Sumatra:
• Cultivar Selection: Pure Abyssinia, Ateng Super
• Processing Profile: Wild Natural (Yeast-Aerobic slow cherry fermentation)
• Farm Elevation: 1,300 to 1,500 MASL
• Physical Metrics: Moisture 11.5% constant, Water Activity (aW) under 0.60
• Defect limit: Specialty Grade (Strictly 0 primary defects, <3 secondary defects per 300g sample)
• Cupping profile: Explosive notes of ripe strawberry jam, bergamot oil clarity, pulpy mango texture, and thick brown sugar candy sweetness.

We pack all our wild natural microlots with double-layer GrainPro hermetic liners and ship with dry container-desiccants to fully lock in these delicate floral-fruity esters during oceanic shipping across transit lines.

As this is a boutique microlot, we are reserving 350-gram vacuum pre-shipment sample boxes for selective roasting partners that value high-complexity fruit profiles. 

Please let us know where we can dispatch a sample box for your next cupping rotation.

Sincerely,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Kopi natural Indonesia berkembang sangat pesat. Nilai tambah 'Yeast-Aerobic Natural' menceritakan proses fermentasi higienis terkontrol. Menyebutkan 'Water Activity (aW) under 0.60' membuktikan bahwa Anda mengerti standar stabilitas mold/jamur laboratorium modern, yang merupakan dambaan para green buyer specialty.",
                        taskKey: "learn_email_gayo"
                      },
                      java_preanger: {
                        name: "Java Preanger Reserve (Semi-Washed Premium)",
                        badge: "Floral Lemongrass Volcanic Lot",
                        badgeColor: "bg-blue-100 text-blue-800",
                        shortDesc: "Template penawaran untuk Java Sunda Preanger dari lereng vulkanik Jawa Barat dengan karakter floral teh melati, manis madu, dan kelicinan bodi yang elegan.",
                        subject: "Boutique Sourcing: Java Sunda Preanger Reserve (Volcanic Semi-Washed Crop)",
                        tone: "Estate-Focused, Origin-Driven, Elegant Specs",
                        body: `Dear [Green Coffee Sourcing Director Name],

At PT. Nandara Nusa Montierra, we are preparing the final mill of our estate-selected Java Sunda Preanger Reserve, harvested from volcanic mountain peaks on Mount Puntang, West Java. We have kept this Micro-Lot entirely segregated to preserve its elegant fruit and floral tea-like profiles.

We invite your green coffee assessment with these raw physical parameters:
• Terroir Estate: Mount Puntang, West Java
• Elevation: 1,400 to 1,600 MASL
• Cultivar Variety: Typica, Sigarar Utang, Kartika
• Processing Method: Traditional Semi-Washed (clean 24-hr fermentation)
• Grain Profile: Moisture 11.2% constant, density 720g/L
• Bean Screen Size: Screen 16+ Large Beans (90% uniform)
• Defect limits: SCA Specialty standard (zero primary defects, max 3 secondary defects per 300g)
• Cupping profile notes: Intense sweet jasmine aroma, citric lime-like acidity, buttery mouthfeel, paired with cocoa nib and West Java volcanic forest honey sweetness. (Cupping Mark: 84.25 SCA)

To secure this lot, we maintain full traceability with digital logging. Every bag shipped will contain batch certificates detailing the farmer cluster and harvest date.

We can organize container dispatch under FOB Tanjung Priok Port or CIF Hamburg terms. Please let us know if we should send a 350-gram sample box. 

We can also organize a live video stream of the physical cupping and defect sorting at our warehouse to support your assessment.

Best regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Java Preanger Sunda termasyhur berkat kemanisan buah segar dan kehalusan rasa. Penawaran live streaming cupping / sortasi di gudang menunjukkan transparansi ekstrem yang sangat jarang ditawarkan kompetitior, mendongkrak minat interaksi awal buyer.",
                        taskKey: "learn_email_java"
                      },
                      bali_kintamani: {
                        name: "Bali Kintamani (Citrus Zesty Natural)",
                        badge: "Orange & Citrus Zest Bomb",
                        badgeColor: "bg-orange-100 text-orange-850",
                        shortDesc: "Template penawaran Bali Kintamani yang menonjolkan keunikan terroir tumpang sari jeruk (orange crops), manis karamel, dan tingkat keasaman sitrat yang bersih.",
                        subject: "Specialty Offer: Bali Kintamani Natural (Orange & Grapefruit Terroir)",
                        tone: "Roaster-Centric, Story-Driven, Vibrant",
                        body: `Dear [Master Roaster/Sourcing Specialist Name],

I am writing directly from PT. Nandara Nusa Montierra in Indonesia. We have just completed the dry milling of a boutique lot of Single-Origin Bali Kintamani. This lot is processed using a clean natural process at high elevation (1,300 MASL) within the shaded volcanic crater.

We are presenting this lot with full specification transparent disclosure for your green coffee portfolio:
• Origin/Estate: Highlands of Kintamani Volcanic Plateau, Bali
• Botanical Selection: Bourbon, Kartika, USDA 762
• Process Method: Natural Process (slow sun-dried on solar raised beds)
• Screen Grade: Screen 16+ Large Uniform Green Beans (>92%)
• Moisture Calibration: 11.4% constant
• Grain Density: 715 g/L
• Defect Limits: SCA Specialty standards (strictly zero primary, max 4 secondary per 300g)
• Cupping profile notes: Remarkable orange citrus zest, vibrant mandarin acidity, crisp clean mouthfeel, honey sweetness, and jasmine dry finish. (Cupping Mark: 84.50 SCA)

Bali Kintamani’s orange terroir is famous worldwide, but often hard to source direct with real quality parameters. We pack all Bali lots with dry-container desiccants in original GrainPro bags to shield the precious citric elements from heat during transit.

We are ready to dispatch an air-freight sample of 350 grams to your laboratory. Let us know if you would like to arrange this, or if you require a FOB Surabaya or CIF custom quote.

Warm regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Fakta unik bahwa kebun kopi Bali Kintamani tumpang sari dengan pohon jeruk memberikan lore atau kisah herba organik menarik bagi roaster global. Buyer sangat menyukai kisah di balik cherry kopi (storytelling).",
                        taskKey: "learn_email_java"
                      },
                      flores_volcanic: {
                        name: "Flores Volcanic Fully Washed (Bajawa)",
                        badge: "Clean Hazelnut & Chocolate",
                        badgeColor: "bg-amber-100 text-amber-800",
                        shortDesc: "Template penawaran untuk Flores Bajawa Fully Washed bercita rasa cokelat-kacang yang kuat, sangat diminati oleh pasar komersial modern maupun specialty blend.",
                        subject: "Sourcing Inquiry: Flores Bajawa Volcanic G1 Fully Washed (Clean Chocolate & Nutty Lot)",
                        tone: "Reliable, Spec-Driven, Direct",
                        body: `Dear [Coffee Quality Control Lead / Green Sourcing Team],

We are contacting you from PT. Nandara Nusa Montierra, a direct trading exporter based in Indonesia. On behalf of our smallholder farming coop in Bajawa Highlands, Flores, we would like to present our Flores Volcanic Fully Washed Grade-1 (Current Crop).

If you are looking for a highly reliable, sweet, and clean single-origin or a structured espresso blender, our Flores Bajawa offers excellent classic continental profiles:
• Cultivar: Kartika, S-Line, Lini S
• Harvest Elevation: 1,300 - 1,550 MASL
• Processing Method: Fully Washed (double washed & 24hr fermentation)
• Screen Grade: Screen 16/17 (Large, 94% uniform)
• Moisture Content: 11.0% constant moisture level
• Grain Density: High density (>725 g/L)
• Defect limits: SCA Specialty standards (strictly 0 primary defect, max 4 secondary defects per 300g sample)
• Cupping Profile Specs: Intense roasted hazelnut base, smooth milk chocolate melt, crisp green apple acidity, with a clean sweet lingering aftertaste. (Cupping Mark: 83.75 SCA)

Every bag is secured in double-layer Original GrainPro bags with dry container desiccants to guarantee that the clean fully-washed nutty characteristics remain pristine during export.

We value quality assurance and can dispatch a 350-gram green sample to your roaster next week. Could you share your courier express coordinates (DHL/UPS/FedEx)?

Best regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Flores Bajawa sangat terkenal akan karakter chocolatey and nutty yang tebal dan bersih. Dengan menguraikan proses fully washed 'double washed & 24hr fermentation', pembeli langsung mengetahui kopi ini bebas rasa tanah/earthy sisa pencucian buruk.",
                        taskKey: "learn_email_java"
                      },
                      toraja_reserve: {
                        name: "Toraja Reserve (Heritage Hybrid Premium)",
                        badge: "Complex Cardamom & Cedar",
                        badgeColor: "bg-stone-200 text-stone-850",
                        shortDesc: "Pecinta kopi klasik menyukai Sulawesi Toraja. Template ini mengedepankan kompleksitas herba rempah cardamom dan bodi cokelat gelap dari pegunungan karts Sulawesi.",
                        subject: "Direct Specialty: Sulawesi Toraja Reserve G1 (Volcanic Micro-climate Heritage)",
                        tone: "Technical, Heritage-Focused, Deep Complexity",
                        body: `Dear [Green Coffee Buyer / Specialty Sourcing Specialist],

I am writing directly from PT. Nandara Nusa Montierra, Indonesia. We have recently completed the slow drying of a micro-climate heritage selection: Sulawesi Toraja Reserve G1 (Current Crop).

Our Toraja Reserve is cultivated by native Toraja highland communities in high-elevation volcanic mountain slopes (1,400 to 1,700 MASL). We oversee the collection and slow double hand-sorting to ensure a pristine lot:
• Botanical Cultivar: Genuine S795, Typica
• Elevation: 1,400 to 1,700 MASL
• Processing Profile: Hybrid Semi-Washed (traditional pulp, slow-dried on raised bamboo racks)
• Grain Profile: Moisture 11.5% constant, density 718g/L
• Defect limits: Specialty standard (zero primary defects, max 3 secondary defects per 300g sample)
• Cupping profile notes: Complex warm spices, sweet cacao nibs, subtle black pepper, herbal cedar hints, and a rich caramel molasses finish. (SCA Cupping Mark: 84.00 SCA)

Sulawesi Toraja is legendary for its exotic cardamom and herbal-earthy density, yet direct trade lots with consistent sorting are rare. We package this crop in Original GrainPro liners to keep the volatile cardamom oils safe from evaporation during transit.

We would love to submit a 200g vacuum-sealed green sample. Please share the safest shipping address for your physical cupping tables.

Warm regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Mengatur sortasi 'double hand-sorting' untuk kopi Toraja sangat penting karena proses tradisional kerap membawa defect fisik tinggi. Pembeli akan menghargai jaminan 'maximum 3 secondary defects' yang menunjukkan disiplin kontrol mutu Nandara.",
                        taskKey: "learn_email_java"
                      },
                      gayo_lb: {
                        name: "Gayo Longberry Reserve (Rare Alpine Selection)",
                        badge: "Exquisite White Peach Floral",
                        badgeColor: "bg-indigo-100 text-indigo-800",
                        shortDesc: "Lot termewah di katalog Anda. Sangat langka, dipetik dari ketinggian ekstrem 1850 masl, menawarkan karakter mirip Geisha: white peach syrup dan honeysuckle.",
                        subject: "Exclusive Microlot Sourcing: Sumatra Gayo Longberry Reserve (1,850 MASL Alpine Lot)",
                        tone: "Exclusive, Highly Sensory-Driven, Elite Quality",
                        body: `Dear [Green Coffee Sourcing Director / Founder],

At PT. Nandara Nusa Montierra, we are extending an exclusive, highly restricted allocation of our rarest alpine micro-lot: Gayo Longberry Reserve Bourbon (Calibrated SCA Score: 87.50).

Grown in the highest micro-climates of Bener Meriah (1,850 MASL), this lot represents a natural mutation of the Typica/Bourbon tree yielding elongated beans of extreme density:
• Botanical Variety: 100% Longberry Bourbon Mutation
• Altitude: 1,500 - 1,850 MASL (Extreme Alpine Estate)
• Processing Method: Specialty Semi-Washed (36hr cool-fermented)
• Physical Character: Moisture 10.8% constant, density 735g/L (Rock Hard Bohnen)
• Defect Limits: Zero primary defects, zero secondary defects (triple hand-sorted)
• Sensory Mark: Highly expressive white peach syrup, fresh honeysuckle perfume, oil citric bergamot, with a silky black tea mouthfeel.

This is a true competition-level lot designed for champion roasters or high-end micro-roastery lineups looking for a spectacular floral fruit bomb. We are offering this lot under strict first-come, first-served allocation bounds.

We have prepared exactly fifteen pre-shipment sample boxes of 200g vacuum pouches. If you would like to cup this lot, please secure your priority slot details immediately with your courier shipping coordinates.

Sincere regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Longberry Gayo berharga mahal karena pohonnya rapuh dan langka. Menyebutkan 'zero primary and zero secondary defects' (triple hand-sorted) memberi sinyal kualitas kompetisi dunia yang menggiurkan bagi micro-roasters kelas atas.",
                        taskKey: "learn_email_gayo"
                      },
                      lampung_reserve: {
                        name: "Lampung Reserve Robusta (Crema Booster)",
                        badge: "Intense Hazelnut Butter & Dark Cocoa",
                        badgeColor: "bg-amber-100 text-amber-900",
                        shortDesc: "Robusta andalan Lampung. Diproses bersih di atas solar raised beds, memberikan crema super tebal dan rasa cokelat murni tanpa cacat rasa ban terbakar atau tanah/moldy.",
                        subject: "Fine Robusta Blending Sourcing: Lampung Natural G1 (Espresso Crema Booster)",
                        tone: "Technical, Blend-Optimized, High Sincerity",
                        body: `Dear [Coffee Quality Control Lead / Green Sourcing Team],

We are contacting you from PT. Nandara Nusa Montierra, a direct trading exporter based in Indonesia. On behalf of our smallholder farming cooperative in Lampung, Sumatra, we would like to present our Lampung Reserve Fine Robusta Natural Grade-1 (Current Crop).

If you use Robusta as a dense dark-chocolate crema booster for espresso blends, our Lampung Natural offers an incredibly clean cup with zero soil/mouldy defects:
• Cultivar: Selected Lampung Canephora Clones
• Harvest Elevation: 600 - 800 MASL
• Processing Method: Natural (hand-floated, sun-dried on solar raised beds)
• Screen Grade: Large screen 16 (94% uniform)
• Moisture Specs: 11.8% moisture level constant
• Grain Density: High density (>740 g/L)
• Cupping Profile Specs: Intense toasted hazelnut, heavy syrupy dark chocolate body, thick crema, wood-free zero dust clean finish.

Unlike commercial grade Robusta which is dried on soil roads, our Fine Robusta is dried strictly on elevated beds with air ventilation. This deletes earthy and rubbery tastes, providing a reliable blending ingredient that can be roasted light-to-medium for espresso base construction.

We appreciate the value of QA testing. May we ship a 350-gram product sample to your roaster? Please let us know your DHL/FedEx courier details or shipping instructions.

Best regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Banyak roaster barat menghindari robusta karena aroma herbisida atau bau ban terbakar. Kuncinya adalah 'solar raised beds drying'. Menekankan hal ini di email Anda akan langsung menarik minat blender espresso yang mencari crema tebal.",
                        taskKey: "learn_email_gayo"
                      },
                      temanggung_fine: {
                        name: "Temanggung Fine Robusta (Premium Clean Natural)",
                        badge: "Malted Milk Chocolate Robusta",
                        badgeColor: "bg-amber-100 text-amber-950",
                        shortDesc: "Robusta pegunungan kering Temanggung. Terkenal bersih, beraroma malt dan hazelnut manis. Sangat ideal untuk pencinta kopi robusta gourmet di Asia & Eropa.",
                        subject: "Sourcing Premium Fine Robusta: Temanggung Clean Natural (Sweet Malted Chocolate)",
                        tone: "Professional, Analytical, Sincere Sourcing",
                        body: `Dear [Green Coffee Sourcing Director / QC Lead],

We are contacting you on behalf of PT. Nandara Nusa Montierra, Indonesia. We are preparing the final mill of high-altitude Temanggung Fine Robusta Natural, harvested from the highland volcanic soils of Central Java (800 - 1,005 MASL).

If you are looking to source high-altitude Fine Robusta that exhibits zero muddy cup taints and exceptional sweetness, our Temanggung Natural marks all parameters:
• Cultivar: High-Altitude Temanggung Robusta Selection
• Elevation: 800 - 1,005 MASL (Dry Highland Climate)
• Processing Method: Clean Natural (slow-dried on elevated bamboo racks)
• Grain Moisture: 11.5% constant (calibrated with Kett tester)
• Screen Size: Screen 16+ Large Uniform Green Beans
• Defect limits: Under 6 secondary defects per 300g (Fine Robusta high export specification)
• Cupping profile notes: Sweet malted barley drink, smooth toasted cashew butter, clean milk chocolate finish, and a highly persistent sweet crema profile.

Temanggung's unique cold volcanic micro-climate pushes the sugar concentration inside the Canephora bean higher than low-altitude robustas, reducing bitterness and maximizing roasted sweetness. This makes it a perfect component for specialty espresso blends or single-origin fine robusta bags.

We have a 350g green sample ready to dispatch. Please let us know if we should courier it directly to your laboratory.

Best regards,
PT. Nandara Nusa Montierra Exports
Indonesia
export@nandaramontierra.id`,
                        strategicInsight: "Kopi Temanggung memiliki bodi manis khas sereal gandum/malt. Terroir vulkanik kering di Temanggung membuat buah matang lambat, mengkonsentrasikan gula alami yang menggila. Sempurna untuk buyer gourmet robusta.",
                        taskKey: "learn_email_gayo"
                      }
                    };

                    const activeTemp = OUTREACH_TEMPLATES_DATA[currSelectedTemplate] || OUTREACH_TEMPLATES_DATA.gayo_g1;

                    const handleCopyCurrText = (text: string, type: 'subject' | 'body') => {
                      navigator.clipboard.writeText(text);
                      setCurrCopiedStatus(type);
                      setTimeout(() => setCurrCopiedStatus('none'), 2000);
                    };

                    return (
                      <div className="border border-gold/30 rounded bg-[#F7F4EC]/45 p-5 space-y-4 text-left animate-fade-in font-sans">
                        {/* Header info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#05190F]/10 pb-2">
                          <div className="space-y-0.5">
                            <span className="font-serif font-bold text-[#05190F] text-sm block">{activeTemp.name}</span>
                            <span className={`inline-block text-[9px] font-mono font-bold uppercase rounded px-2 py-0.5 ${activeTemp.badgeColor}`}>
                              {activeTemp.badge}
                            </span>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => toggleTask(activeTemp.taskKey)}
                            className={`text-[9.5px] font-mono px-3 py-1 border rounded cursor-pointer transition-all ${
                              completedTasks[activeTemp.taskKey] ? 'bg-emerald-800 text-white border-emerald-800 font-bold' : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            {completedTasks[activeTemp.taskKey] ? '✓ Selesai Dipelajari' : 'Tandai Selesai Pelajaran'}
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-650 leading-relaxed font-sans">{activeTemp.shortDesc}</p>

                        <div className="text-[10px] text-gray-500 font-mono space-y-0.5 border-l-2 border-[#C9A227] pl-2.5">
                          <p><strong>Tone & Style:</strong> {activeTemp.tone}</p>
                          <p><strong>Bahasa:</strong> Bahasa Inggris Formal (Internasional B2B standard)</p>
                        </div>

                        {/* Subject block */}
                        <div className="p-3 bg-white border border-stone-200 rounded space-y-1 relative font-mono text-[11px]">
                          <div className="flex justify-between items-center text-gray-400 text-[9px] uppercase font-bold">
                            <span>Email Subject:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCurrText(activeTemp.subject, 'subject')}
                              className="text-[#05190F] hover:text-[#C9A227] flex items-center gap-1 cursor-pointer font-bold transition-all text-[9.5px]"
                            >
                              {currCopiedStatus === 'subject' ? (
                                <><Check className="w-3 h-3 text-emerald-600 animate-bounce" /> Copied!</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy Subject</>
                              )}
                            </button>
                          </div>
                          <p className="text-[#05190F] font-bold text-xs font-sans mt-0.5 leading-normal selection:bg-[#C9A227]/30">{activeTemp.subject}</p>
                        </div>

                        {/* Body pre block */}
                        <div className="p-4 bg-white border border-stone-200 rounded space-y-2 relative font-mono text-[11px]">
                          <div className="flex justify-between items-center text-gray-400 text-[9px] uppercase font-bold border-b border-stone-150 pb-1.5">
                            <span>Email Body:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCurrText(activeTemp.body, 'body')}
                              className="text-[#05190F] hover:text-[#C9A227] flex items-center gap-1 cursor-pointer font-bold transition-all text-[9.5px]"
                            >
                              {currCopiedStatus === 'body' ? (
                                <><Check className="w-4 h-4 text-emerald-600 animate-bounce" /> Copied!</>
                              ) : (
                                <><Copy className="w-3.5 h-3.5" /> Copy Email Body</>
                              )}
                            </button>
                          </div>
                          <pre className="text-gray-750 text-[10.5px] leading-relaxed overflow-y-auto max-h-[300px] whitespace-pre-wrap font-sans select-all selection:bg-[#C9A227]/30">{activeTemp.body}</pre>
                        </div>

                        {/* Strategic Insight */}
                        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded flex gap-2 items-start font-sans text-stone-750 text-[11.5px] leading-relaxed">
                          <span className="text-emerald-700 text-sm">💡</span>
                          <div className="space-y-1">
                            <strong className="text-emerald-950 font-bold block">Rekomendasi Taktis Sourcing (Indonesian Insight)</strong>
                            <p>{activeTemp.strategicInsight}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sidebar Guide */}
              <div className="space-y-6">
                <div className="bg-[#FAF8F5] border border-[#05190F]/15 p-5 rounded-lg shadow-luxury space-y-4">
                  <h4 className="font-mono text-[9px] tracking-widest text-[#C9A227] uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-[#C9A227]" /> Honesty Rules the Deal
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                    <strong>Penting:</strong> Jangan pernah memanipulasi kadar air kopi atau menyembunyikan jamur di tengah tumpukan karung goni. Kopi Anda akan melewati pengujian laboratorium di Pelabuhan Impor Amerika atau Jerman. Jika kadar air melebihi batas toleransi negara tujuan, kargo bisa disita atau dihancurkan dengan biaya sepenuhnya dibebankan pada Anda.
                  </p>
                  <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                    Eksportir yang jujur menuliskan spesifikasi apa adanya, sehingga buyer bisa menyesuaikan kurva roasting mereka secara presisi.
                  </p>
                </div>

                <div className="bg-[#05190F] text-white p-5 rounded-lg shadow-luxury space-y-3 border border-[#C9A227]/20">
                  <FileText className="w-7 h-7 text-[#C9A227]" />
                  <h4 className="font-serif font-bold text-xs text-[#C9A227]">Verifikasi Parameter Terroir</h4>
                  <p className="text-[10px] text-gray-300 font-mono leading-relaxed">
                    Setiap quotation ekspor kopi yang Anda buat di Nandara platform disertai dengan sertifikat parameter terroir digital untuk membuktikan keaslian teritorial kopi demi mengurangi gesekan verifikasi.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. B2B MARKETING FUNNEL (Tailored for Coffee Exporting) */}
        {activeSubTab === 'funnel' && (
          <div className="space-y-6 animate-fade-in text-xs font-mono">
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#C9A227]" /> Specialty Coffee Export Marketing Funnel
              </h3>
              <h2 className="text-lg font-serif italic text-[#05190F]">Corong Pemasaran Komoditas Ekspor (B2B Coffee Marketing Funnel)</h2>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Pemasaran B2B ekspor kopi hijau specialty tidak menggunakan iklan e-commerce masal. Corong pemasaran dirancang dari hulu ke hilir untuk memilah buyer andal dan menjamin pesanan kontainer berulang.
              </p>

              {/* Graphical Funnel UI */}
              <div className="space-y-4 pt-4">

                {/* STAGE 1: TOFU */}
                <div className="border border-[#05190F]/15 rounded-sm p-4 bg-[#05190F] text-white flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="px-3 py-1.5 bg-[#C9A227] text-[#05190F] font-bold rounded-sm text-center">
                    ToFU <br/>
                    <span className="text-[10px]">100%</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-serif italic font-bold text-sm text-[#C9A227]">AWARENESS: B2B Prospect Discovery</h4>
                    <p className="text-gray-300 font-sans text-[11px] leading-relaxed">
                      Saring ribuan data bea cukai global menggunakan <strong>Specialty Importer Registry</strong> untuk mencantumkan roaster yang secara periodik mendatangkan kopi asal Indonesia. Jangkau mereka lewat email perkenalan terstruktur dan pesan LinkedIn yang berfokus pada terroir spesifik (Bukan sekedar jualan general).
                    </p>
                    <div className="pt-2 text-[9px] text-[#C9A227] flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={completedTasks.learn_funnel_tofu} 
                        onChange={() => toggleTask('learn_funnel_tofu')}
                        className="accent-[#C9A227]" 
                      />
                      <span>Saya telah memahami fase pencarian prospek global ToFU</span>
                    </div>
                  </div>
                </div>

                {/* STAGE 2: MOFU */}
                <div className="border border-[#05190F]/15 rounded-sm p-4 bg-[#FAF8F5] text-gray-950 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="px-3 py-1.5 bg-[#05190F] text-[#C9A227] font-bold rounded-sm text-center">
                    MoFU <br/>
                    <span className="text-[10px]">45%</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-serif italic font-bold text-sm text-[#05190F]">CONSIDERATION: Evaluation & Mini-Lot Cupping Box</h4>
                    <p className="text-gray-600 font-sans text-[11px] leading-relaxed">
                      Saat importir membalas email Anda, tawarkan pengiriman box sampel eksklusif. Kemas mikro-kopi dalam kemasan kedap udara berkantong vacuum-seal 200g. Lampirkan lembar analisis fisik lab (Kadar air, defect count, sebaran ukuran green bean, skor cupping internal) serta tautan QR video penyortiran kopi jujur di gudang pertanian.
                    </p>
                    <div className="pt-2 text-[9px] text-emerald-800 flex items-center gap-2 font-bold">
                      <input 
                        type="checkbox" 
                        checked={completedTasks.learn_funnel_b2b} 
                        onChange={() => toggleTask('learn_funnel_b2b')}
                        className="accent-[#05190F]" 
                      />
                      <span>Tandai selesai mempelajari taktik pengiriman boks sampel</span>
                    </div>
                  </div>
                </div>

                {/* STAGE 3: INTERMEDIATE */}
                <div className="border border-[#05190F]/15 rounded-sm p-4 bg-white text-gray-900 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="px-3 py-1.5 bg-[#05190F]/10 text-gray-800 font-bold rounded-sm text-center">
                    Trial <br/>
                    <span className="text-[10px]">15%</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-serif italic font-bold text-sm text-[#05190F]">DECISION: Trial Order LCL (Less than Container Load)</h4>
                    <p className="text-gray-600 font-sans text-[11px] leading-relaxed">
                      Fase krusial untuk menutup keraguan risiko buyer. Jangan tawarkan 1 kontainer penuh (~19.2 ton) di fase awal jika buyer belum percaya. Tawarkan pallet LCL berukuran 1 - 3 ton. Pengiriman LCL membuktikan bahwa Anda mampu meloloskan kargo pabean Indonesia dengan regulasi karantina tumbuhan yang sah dan andal.
                    </p>
                  </div>
                </div>

                {/* STAGE 4: BOFU */}
                <div className="border-2 border-dashed border-[#C9A227] rounded-sm p-4 bg-amber-50/20 text-gray-900 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="px-3 py-1.5 bg-[#C9A227] text-white font-bold rounded-sm text-center">
                    BoFU <br/>
                    <span className="text-[10px]">5%</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-serif italic font-bold text-sm text-[#05190F]">ADVOCACY / RETENTION: container Contract Allocation & Repeat Order</h4>
                    <p className="text-gray-600 font-sans text-[11px] leading-relaxed">
                      Transformasikan trial ke dalam pembelian tahunan FCL (Full Container Load). Tawarkan skema <strong>Forward Contract</strong> yaitu penguncian alokasi panen musiman berikutnya dengan diskon harga per Kilogram yang rasional. Sediakan pembaruan video cuaca berkala di kebun agar importir bisa memproyeksikan target pasokan roasting mereka.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 3. NEGOTIATION & CLOSING (Tactics to Win Deals) */}
        {activeSubTab === 'negotiation' && (
          <div className="space-y-6 animate-fade-in text-xs font-mono">
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                <Handshake className="w-4 h-4 text-[#C9A227]" /> B2B Price & Terms Negotiation Standard
              </h3>
              <h2 className="text-lg font-serif italic text-[#05190F]">Taktik Negosiasi Harga & Teknik Memastikan Closing Tanpa Perang Harga</h2>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Bagian ini membekali Anda cara bernegosiasi secara bermartabat dengan importir barat maupun distributor Asia tanpa merugikan margin keuntungan petani koperasi Anda di tanah air.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

                <div className="bg-[#FAF8F5] border border-gray-100 p-4 rounded-sm space-y-3">
                  <h4 className="font-bold text-[#05190F] uppercase tracking-wide flex items-center gap-1.5">
                    🤝 1. Taktik Penawaran Harga Berjenjang (Volume Price Ladder)
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-sans text-[11px]">
                    Jangan pernah memberikan satu harga mati yang kaku. Selalu sediakan rentang pilihan karena pembeli B2B sangat menyukai fleksibilitas kuantitas. Sediakan tangga harga berdasarkan beban risiko logistik:
                  </p>
                  <ul className="text-gray-700 bg-white p-2.5 rounded border border-gray-200 list-mono space-y-1 font-mono text-[10.5px]">
                    <li>• Pallet LCL (0.5 - 2 Tons): <strong>$8.50 / Kg CIF</strong></li>
                    <li>• Pallet LCL (3 - 8 Tons): <strong>$7.80 / Kg CIF</strong></li>
                    <li>• Kontainer 20ft FCL (~19.2 Tons): <strong>$6.70 / Kg FOB</strong></li>
                  </ul>
                  <p className="text-xs text-gray-600 font-sans">
                    Dengan menyajikan ini, Anda secara psikologis memaksa buyer untuk beralih dari memikirkan "Apakah saya akan beli dari Anda?" menjadi "Volume berapa yang paling pas untuk saya uji coba?"
                  </p>
                  <div className="pt-2 text-[9px] text-[#05190F] flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={completedTasks.learn_nego_price} 
                      onChange={() => toggleTask('learn_nego_price')}
                      className="accent-[#05190F]" 
                    />
                    <span>Saya telah mencatat taktik Volume Price Ladder</span>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] border border-gray-100 p-4 rounded-sm space-y-3">
                  <h4 className="font-bold text-[#05190F] uppercase tracking-wide flex items-center gap-1.5">
                    ⚠️ 2. Menghadapi Permintaan Diskon Ekstrim (Incoterms Lever)
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-sans text-[11px]">
                    <strong>Skenario:</strong> Buyer menyukai cupping sampel Anda tapi menawar harga kopi Anda turun $1.00 - $1.50 per Kilogram dengan alasan ongkir kontainer mereka mahal.
                  </p>
                  <p className="text-red-800 leading-relaxed font-sans text-[11px] font-semibold">
                    <strong>Pola Tanggapan Salah:</strong> Langsung menyetujui karena takut kehilangan buyer, padahal margin modal tani Anda habis tergerus.
                  </p>
                  <p className="text-[#05190F] leading-relaxed font-sans text-[11px] font-semibold">
                    <strong>Pola Tanggapan Benar (Incoterms Switch):</strong> "We cannot compromise on our green bean sourcing costs because we pay fair ethical wages directly to the micro-lot farmers. However, if you would like to minimize shipping overheads, we can instantly switch your terms from CIF to FOB Tanjung Priok Port so you can leverage your own corporate carrier discounts."
                  </p>
                  <div className="pt-2 text-[9px] text-[#05190F] flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={completedTasks.learn_nego_incoterm} 
                      onChange={() => toggleTask('learn_nego_incoterm')}
                      className="accent-[#05190F]" 
                    />
                    <span>Telah melatih tanggapan Incoterms Switch</span>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] border border-gray-100 p-4 rounded-sm space-y-3 md:col-span-2">
                  <h4 className="font-bold text-[#05190F] uppercase tracking-wide">
                    🎯 Teknik Symmetrical Information Untuk Closing Anti-Gagal
                  </h4>
                  <p className="text-gray-600 font-sans text-xs">
                    Buyer takut ditipu barang busuk atau kargo telat, eksportir takut ditipu pembayaran palsu. Atasi ketakutan ini secara telak dengan asimetri informasi menggunakan teknologi:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px] text-gray-700">
                    <div className="p-3 bg-white border border-gray-200">
                      <strong>1. Video Call Di Gudang</strong>
                      <p className="text-gray-500 font-sans text-[10px] mt-1">Lakukan siaran video singkat saat kopi dimasukkan ke ayakan sortir untuk memperlihatkan kondisi riil tim sortasi.</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200">
                      <strong>2. Segel Nomor Karung</strong>
                      <p className="text-gray-500 font-sans text-[10px] mt-1">Sertakan id plat segel pabean dan foto nomor karung goni kepada buyer sebelum kontainer ditarik ke dermaga ekspor.</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-200">
                      <strong>3. Log Kelembapan Lab</strong>
                      <p className="text-gray-500 font-sans text-[10px] mt-1">Bagi hasil pengukuran harian kadar kelembapan gudang penumpukan secara konsisten menggunakan spreadsheet online yang transparan.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 4. SHIPPING & PAYMENTS (Pecah Detail GrainPro, container logs, TT, L/C, CAD) */}
        {activeSubTab === 'shipping_payment' && (
          <div className="space-y-6 animate-fade-in text-xs font-mono">
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-[#C9A227]" /> Ocean Logistics & Payment Systems
              </h3>
              <h2 className="text-lg font-serif italic text-[#05190F]">Sistem Proteksi Pengiriman & Mekanisme Pembayaran Aman</h2>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Penanganan pengiriman laut melintasi khatulistiwa dan pemilihan termin pembayaran adalah tumpuan likuiditas bisnis ekspor Anda. Pahami standar pelindungan cargo demi menjaga integritas mutu kopi.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

                {/* LOGISTICS & GRAINPRO */}
                <div className="border border-gray-100 p-5 rounded-sm bg-[#F7F4EC]/40 space-y-4">
                  <h3 className="font-serif font-bold text-sm text-[#05190F] flex items-center gap-1.5 border-b border-gray-200 pb-2">
                    📦 1. Proteksi Logistik & GrainPro Hermetic Technology
                  </h3>
                  <p className="text-gray-600 font-sans leading-relaxed text-[11.5px]">
                    Kapal kargo membutuhkan waktu 10 hingga 45 hari untuk mencapai pelabuhan Eropa atau Amerika Serikat. Di sepanjang rute khatulistiwa, udara laut bergaram tinggi dan fluktuasi kelembapan udara dapat memicu "efek hujan dalam kontainer" yang merusak rasa segar green bean.
                  </p>
                  <div className="bg-white p-3 border border-gray-200 space-y-2 rounded-sm text-[11px] text-gray-700">
                    <p className="font-bold text-[#05190F]">🛡️ Standar Pelindungan Karung Ekspor Kopi Nandara:</p>
                    <ul className="list-disc list-inside space-y-1 font-sans text-[10.5px] text-gray-600 pl-1">
                      <li><strong>Kantong Hermetik GrainPro:</strong> Selalu gunakan kantong plastik komposit GrainPro Ultra-Hermetik sebagai liner dalam sebelum dimasukkan ke karung goni biasa. Ini mengunci oksigen di bawah 1% dan menjaga kadar air stabil di 11.5% konstan.</li>
                      <li><strong>Lining Kardus Kontainer:</strong> Lapisi seluruh dinding bagian dalam kontainer 20ft besi dengan lembaran kertas karton coklat bergelombang penyerap uap untuk memitigasi kondensasi uap basah kapal.</li>
                      <li><strong>Gantungan silica Gel Kering:</strong> Gantung 6-8 kantong besar absorpsi gel silika kargo seberat 1.5Kg di balok pengikat sudut atas kontainer baja pengiriman.</li>
                    </ul>
                  </div>
                  <div className="pt-2 text-[9px] text-emerald-800 flex items-center gap-2 font-bold">
                    <input 
                      type="checkbox" 
                      checked={completedTasks.learn_shipping_grainpro} 
                      onChange={() => toggleTask('learn_shipping_grainpro')}
                      className="accent-[#05190F]" 
                    />
                    <span>Saya mengerti teknik kemasan GrainPro ekspor</span>
                  </div>
                </div>

                {/* PAYMENTS PROTOCAL */}
                <div className="border border-gray-100 p-5 rounded-sm bg-[#F7F4EC]/40 space-y-4">
                  <h3 className="font-serif font-bold text-sm text-[#05190F] flex items-center gap-1.5 border-b border-gray-200 pb-2">
                    💵 2. Struktur Pembayaran Ekspor Yang Aman & Likuid
                  </h3>
                  <p className="text-gray-600 font-sans leading-relaxed text-[11.5px]">
                    Sebelum kargo ditarik ke dermaga asal, tentukan mana instrumen termin pembayaran yang menjamin kelangsungan arus kas sirkulasi modal usaha PT/koperasi Anda:
                  </p>
                  <div className="bg-white p-3 border border-gray-200 space-y-2.5 rounded-sm text-[11px] text-gray-700">
                    <div className="space-y-1">
                      <p className="font-bold text-[#05190F]">A. T/T Advance Balance against Draft BL (Sangat Direkomendasikan)</p>
                      <p className="font-sans text-[10px] text-gray-500 leading-normal pl-3">
                        Pola ideal untuk transaksi pertama: Pembeli membayar 30% Down Payment (DP) dimuka sebelum panen dikupas, dan 70% sisanya dilunasi melalui transfer kawat bank (TT) seketika setelah Anda mengirimkan foto pindaian draf Bill of Lading (B/L) asli dari agen pelayaran terdaftar.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[#05190F]">B. Irrevocable At Sight L/C (Letter of Credit)</p>
                      <p className="font-sans text-[10px] text-gray-500 leading-normal pl-3">
                        Bank importir menjamin pembayaran penuh secara tertulis jika Anda menyerahkan dokumen ekspor yang 100% sempurna tanpa salah spasi atau salah huruf di terminal operasional valas bank devisa koresponden lokal.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-[#05190F]">C. CAD (Cash Against Documents)</p>
                      <p className="font-sans text-[10px] text-gray-500 leading-normal pl-3">
                        Melibatkan bank escrow perantara. Penjual mengirimkan dokumen ekspor asli ke bank pembeli. Bank pembeli hanya berhak melepas dokumen tersebut ke pihak importir jika mereka sudah menyetor pembayaran lunas ke rekening giro valuta asing Anda.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 text-[9px] text-[#05190F] flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={completedTasks.learn_payment_protection} 
                      onChange={() => toggleTask('learn_payment_protection')}
                      className="accent-[#05190F]" 
                    />
                    <span>Saya memahami mekanisme pembayaran TT, L/C, CAD</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 5. FOB & CIF SIMULATOR COMPREHENSIVE */}
        {activeSubTab === 'fobcif' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Simulator Inputs */}
              <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-6 lg:col-span-1">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1">
                    <Calculator className="w-4 h-4" /> Simulator Input parametrik
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">Sesuaikan parameter kargo untuk menganalisa kalkulasi harga ekspor.</p>
                </div>

                <div className="space-y-4">
                  {/* FOB Base Price per Kg */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-700 flex justify-between">
                      <span>Base FOB Price (USD/Kg):</span>
                      <span className="text-[#05190F] font-bold">${fobPrice.toFixed(2)}</span>
                    </label>
                    <input 
                      type="range" 
                      min="3.0" 
                      max="12.0" 
                      step="0.1" 
                      value={fobPrice} 
                      onChange={(e) => setFobPrice(parseFloat(e.target.value))}
                      className="w-full accent-[#05190F] cursor-ew-resize"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                      <span>$3.00 (FOB Robusta)</span>
                      <span>$12.00 (FOB Specialty Arabica)</span>
                    </div>
                  </div>

                  {/* Quantity Kg */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-700 flex justify-between">
                      <span>Quantity (Kg):</span>
                      <span className="text-[#05190F] font-bold">{quantityKg.toLocaleString()} Kg ({(quantityKg/1000).toFixed(1)} MT)</span>
                    </label>
                    <input 
                      type="range" 
                      min="1000" 
                      max="38400" 
                      step="500" 
                      value={quantityKg} 
                      onChange={(e) => setQuantityKg(parseInt(e.target.value))}
                      className="w-full accent-[#05190F] cursor-ew-resize"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                      <span>1,000 Kg (LCL Trial)</span>
                      <span>19,200 Kg (1 FCL 20ft)</span>
                      <span>38,400 Kg (2 FCL)</span>
                    </div>
                  </div>

                  {/* Ocean Freight Cost */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-700 flex justify-between">
                      <span>Ocean Freight Cost (USD):</span>
                      <span className="text-[#05190F] font-bold">${freightCost.toLocaleString()}</span>
                    </label>
                    <input 
                      type="range" 
                      min="800" 
                      max="8000" 
                      step="100" 
                      value={freightCost} 
                      onChange={(e) => setFreightCost(parseInt(e.target.value))}
                      className="w-full accent-[#05190F] cursor-ew-resize"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                      <span>$800 (Inter-Asia)</span>
                      <span>$3,200 (Asia-Europe)</span>
                      <span>$8,000 (US East Coast)</span>
                    </div>
                  </div>

                  {/* Insurance Rate */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-700 flex justify-between">
                      <span>Marine Cargo Insurance (%):</span>
                      <span className="text-[#05190F] font-bold">{insuranceRate.toFixed(2)}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0.05" 
                      max="1.0" 
                      step="0.05" 
                      value={insuranceRate} 
                      onChange={(e) => setInsuranceRate(parseFloat(e.target.value))}
                      className="w-full accent-[#05190F] cursor-ew-resize"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                      <span>0.05% (Standard)</span>
                      <span>1.0% (Risk Premium Area)</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Calculator Results Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#FAF8F5] border-2 border-[#05190F]/20 p-6 rounded-lg shadow-luxury space-y-6">
                  <div className="flex justify-between items-center border-b border-[#05190F]/10 pb-4">
                    <div>
                      <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase">Commercial Terms Analysis</h3>
                      <h2 className="text-xl font-serif italic text-[#05190F]">FOB vs CIF Cost Breakdown</h2>
                    </div>
                    <span className="text-[9px] font-mono p-1 px-2.5 bg-[#05190F] text-[#C9A227] rounded-sm uppercase tracking-wider font-bold">
                      Calculated Live
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FOB Column */}
                    <div className="p-4 bg-white border border-[#05190F]/10 rounded-lg space-y-2.5">
                      <span className="p-1 px-2 bg-[#05190F]/5 text-[#05190F] text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm border border-[#05190F]/10">FOB (Free On Board)</span>
                      <p className="text-xs text-gray-500 font-sans leading-relaxed pt-1">
                        Eksportir bertanggung jawab atas seluruh biaya pabean, dokumen ekspor, dan pengiriman barang hingga ke atas kapal kontainer pelabuhan asal (cth: Pelabuhan Belawan, Tanjung Priok). Risiko dipindahkan ke pembeli setelah kontainer melewati dinding pagar pengaman kapal pelabuhan asal.
                      </p>
                      
                      <div className="border-t border-[#05190F]/5 pt-4 space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Unit Price:</span>
                          <span className="font-bold text-gray-800">${fobPrice.toFixed(2)} / Kg</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Freight charge:</span>
                          <span className="text-gray-400">Buyer's Responsibility</span>
                        </div>
                        <div className="flex justify-between text-[#05190F] font-bold text-sm border-t border-dashed border-gray-100 pt-2">
                          <span>FOB Value:</span>
                          <span>${cargoValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>

                    {/* CIF Column */}
                    <div className="p-4 bg-white border-2 border-[#C9A227]/30 rounded-lg space-y-2.5 relative">
                      <span className="p-1 px-2 bg-[#C9A227]/15 text-[#05190F] text-[9px] font-mono font-bold tracking-widest uppercase rounded-sm border border-[#C9A227]/40">CIF (Cost, Insurance & Freight)</span>
                      <p className="text-xs text-gray-500 font-sans leading-relaxed pt-1">
                        Eksportir bertindak untuk menanggung sepenuhnya biaya kargo kopi (<span className="italic">Cost</span>), premi asuransi laut (<span className="italic">Insurance</span>), dan biaya kapal angkut samudera (<span className="italic">Freight</span>) hingga kontainer turun aman di pelabuhan tujuan (cth: Hamburg Port).
                      </p>

                      <div className="border-t border-[#05190F]/5 pt-4 space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Base Cargo Cost:</span>
                          <span className="text-gray-800">${cargoValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Ocean Freight:</span>
                          <span className="text-gray-800">${freightCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Insurance cost:</span>
                          <span className="text-gray-800">${insuranceCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-1">
                          <span>Unit CIF Equivalent:</span>
                          <span className="font-bold text-[#C9A227]">${cifPricePerKg.toFixed(3)} / Kg</span>
                        </div>
                        <div className="flex justify-between text-[#05190F] font-bold text-sm border-t border-dashed border-gray-100 pt-2">
                          <span>Total CIF Invoice:</span>
                          <span>${cifPriceTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#05190F]/10 rounded-lg text-xs space-y-2 font-sans">
                    <h4 className="font-serif font-bold text-[#05190F] flex items-center gap-1.5 text-xs">
                      <Info className="w-4 h-4 text-[#C9A227]" /> Insight Strategi Negosiasi:
                    </h4>
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      Impor komoditas kopi premium sering kali dinegosiasikan dalam klausul <strong>FOB</strong> karena roastery global (cth: di Jerman/Jepang) biasanya memiliki jalur logistik kapal angkut langganan sendiri (<span className="font-bold">Freight Forwarder Partner</span>) untuk meraih efisiensi tarif muat bulk kontainer. Sebaliknya, pembeli skala kecil/menengah akan lebih memilih klausul <strong>CIF</strong> untuk kemudahan operasional pendaratan kargo mereka.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* 6. EXPORT DOCUMENTS */}
        {activeSubTab === 'documents' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Info Banner */}
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Modul Ekspor Kopi: Dokumen Administrasi & Kepabeanan
                  </h3>
                  <h2 className="text-2xl font-serif italic text-[#05190F]">Kelengkapan Dokumen Wajib Ekspor & Sertifikasi Negara Tujuan</h2>
                </div>
                <div className="text-[10px] font-mono text-amber-800 bg-amber-50 p-1 px-3 border border-amber-200 uppercase rounded-sm font-bold">
                  Acuan Ekspor Kopi Hijau Indonesia 2026
                </div>
              </div>

              <p className="text-xs text-gray-600 font-sans leading-relaxed max-w-4xl">
                Layanan ekspor kopi hijau menuntut ketiadaan cacat administrasi. Satu dokumen yang hilang atau salah mencantumkan nomor segel kontainer dapat berakibat kargo tertahan berminggu-minggu di pelabuhan tujuan dengan biaya demurrage hingga ribuan USD per hari. Pelajari dokumen wajib serta penyesuaian regulasi terbaru di bawah ini.
              </p>
            </div>

            {/* Main Documents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: 6 Core Standard Documents */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-serif italic font-bold text-base text-[#05190F] border-b border-gray-150 pb-2">
                  📄 6 Dokumen Standar Utama Ekspor
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* INVOICE */}
                  <div 
                    onClick={() => toggleTask('learn_invoice')} 
                    className={`p-4 border rounded-sm transition-all cursor-pointer ${
                      completedTasks.learn_invoice ? 'bg-emerald-50 border-emerald-500/30' : 'bg-[#F7F4EC]/30 border-[#05190F]/10 hover:border-[#C9A227]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[#05190F] text-xs uppercase tracking-wider block">1. Commercial Invoice</span>
                      <input type="checkbox" checked={completedTasks.learn_invoice} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                    <p className="text-[10px] text-[#C9A227] font-mono mt-1 uppercase tracking-widest font-bold">Wajib Pabean</p>
                    <p className="text-xs text-gray-750 leading-relaxed font-sans mt-3">
                      Bukti tagihan resmi yang memuat nomor kontrak, deskripsi tepat kopi (Grades, Varietas), Unit Price, Incoterms (cth: FOB Belawan), Detail Pelabuhan Muat & Bongkar, serta tanda tangan basah pimpinan PT. Nandara Nusa Montierra.
                    </p>
                  </div>

                  {/* PACKING LIST */}
                  <div 
                    onClick={() => toggleTask('learn_packing_list')} 
                    className={`p-4 border rounded-sm transition-all cursor-pointer ${
                      completedTasks.learn_packing_list ? 'bg-emerald-50 border-emerald-500/30' : 'bg-[#F7F4EC]/30 border-[#05190F]/10 hover:border-[#C9A227]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[#05190F] text-xs uppercase tracking-wider block">2. Packing List</span>
                      <input type="checkbox" checked={completedTasks.learn_packing_list} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                    <p className="text-[10px] text-[#C9A227] font-mono mt-1 uppercase tracking-widest font-bold">Wajib Pabean</p>
                    <p className="text-xs text-gray-750 leading-relaxed font-sans mt-3">
                      Menyajikan rincian pengemasan fisik. Wajib merinci jumlah karung goni (Jute Bags), berat bersih (Net Weight), berat kotor (Gross Weight), nomor seri segel bea cukai (Customs Seal No), dan tanda pengenal kontainer (Container ID).
                    </p>
                  </div>

                  {/* BILL OF LADING */}
                  <div 
                    onClick={() => toggleTask('learn_email_gayo')} 
                    className={`p-4 border rounded-sm transition-all cursor-pointer ${
                      completedTasks.learn_email_gayo ? 'bg-emerald-50 border-emerald-500/30' : 'bg-[#F7F4EC]/30 border-[#05190F]/10 hover:border-[#C9A227]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[#05190F] text-xs uppercase tracking-wider block">3. Bill of Lading (B/L)</span>
                      <input type="checkbox" checked={completedTasks.learn_email_gayo} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                    <p className="text-[10px] text-[#C9A227] font-mono mt-1 uppercase tracking-widest font-bold">Bukti Kepemilikan</p>
                    <p className="text-xs text-gray-750 leading-relaxed font-sans mt-3">
                      Surat tanda terima barang yang dikeluarkan oleh perusahaan pelayaran (Carrier) setelah kontainer naik ke atas kapal. Berfungsi sebagai bukti kontrak angkutan dan dokumen kepemilikan kargo lepas sah.
                    </p>
                  </div>

                  {/* COO */}
                  <div 
                    onClick={() => toggleTask('learn_coo')} 
                    className={`p-4 border rounded-sm transition-all cursor-pointer ${
                      completedTasks.learn_coo ? 'bg-emerald-50 border-emerald-500/30' : 'bg-[#F7F4EC]/30 border-[#05190F]/10 hover:border-[#C9A227]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[#05190F] text-xs uppercase tracking-wider block">4. COO / Surat Keterangan Asal (SKA)</span>
                      <input type="checkbox" checked={completedTasks.learn_coo} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                    <p className="text-[10px] text-[#C9A227] font-mono mt-1 uppercase tracking-widest font-bold">Instansi KADIN/Disperindag</p>
                    <p className="text-xs text-gray-750 leading-relaxed font-sans mt-3">
                      Sertifikat asal muasal kargo yang dirilis Dinas Perdagangan wilayah setempat. Digunakan oleh importir untuk mengklaim pemotongan bea masuk preferensial (FTA/GSP) di pabean negara tujuan pembeli.
                    </p>
                  </div>

                  {/* PEB */}
                  <div 
                    onClick={() => toggleTask('learn_peb')} 
                    className={`p-4 border rounded-sm transition-all cursor-pointer ${
                      completedTasks.learn_peb ? 'bg-emerald-50 border-emerald-500/30' : 'bg-[#F7F4EC]/30 border-[#05190F]/10 hover:border-[#C9A227]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[#05190F] text-xs uppercase tracking-wider block">5. PEB & NPE (Nota Pelayanan Ekspor)</span>
                      <input type="checkbox" checked={completedTasks.learn_peb} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                    <p className="text-[10px] text-[#C9A227] font-mono mt-1 uppercase tracking-widest font-bold">Sistem Bea Cukai RI</p>
                    <p className="text-xs text-gray-750 leading-relaxed font-sans mt-3">
                      Disubmit secara online melalui modul EDI Bea Cukai. NPE dirilis sebagai persetujuan fisik pemuatan kontainer ke kompartemen kapal palka utama setelah lolos screening fiskal dan kepabeanan RI.
                    </p>
                  </div>

                  {/* HS CODE */}
                  <div 
                    onClick={() => toggleTask('learn_hs_code')} 
                    className={`p-4 border rounded-sm transition-all cursor-pointer ${
                      completedTasks.learn_hs_code ? 'bg-emerald-50 border-emerald-500/30' : 'bg-[#F7F4EC]/30 border-[#05190F]/10 hover:border-[#C9A227]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-[#05190F] text-xs uppercase tracking-wider block">6. HS Code Klasifikasi</span>
                      <input type="checkbox" checked={completedTasks.learn_hs_code} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                    <p className="text-[10px] text-[#C9A227] font-mono mt-1 uppercase tracking-widest font-bold">Harmonized System Code</p>
                    <p className="text-xs text-gray-750 leading-relaxed font-sans mt-3">
                      Kode global pabean. Untuk Kopi Hijau Non-Kafein (Arabika/Robusta): <strong>HS 0901.11</strong>. Untuk Kopi Hijau Kafeinisasi (Decaffeinated): <strong>HS 0901.12</strong>. Menentukan tarif bea masuk pabean tujuan.
                    </p>
                  </div>
                </div>

                {/* Phytosanitary Master Section */}
                <div className="bg-[#FAF8F5] border border-[#05190F]/10 p-5 rounded-lg space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#05190F] text-[#C9A227] rounded-sm shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-gray-900 text-sm">Sertifikat Fitosanitari (Phytosanitary Certificate - Barantin)</h4>
                      <p className="text-[10px] font-mono text-emerald-800 uppercase tracking-widest font-bold">Wajib Mutlak Komoditas Tumbuhan Ekspor</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 space-y-2.5 font-sans leading-relaxed">
                    <p>
                      <strong>Fungsi:</strong> Dokumen karantina pertanian yang menjamin kargo biji kopi hijau bebas dari bibit organisme pengganggu tumbuhan karantina (OPTK) dan serangga hidup berbahaya seperti kutu bubuk buah kopi (<i>Hypothenemus hampei</i>).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="p-2.5 bg-white border border-[#05190F]/5 rounded-sm">
                        <span className="font-mono font-bold text-[#05190F] block">1. Pengajuan IQFAST</span>
                        Eksportir mensubmit permohonan pemeriksaan fisik melalui portal elektronik Badan Karantina Indonesia (BARANTIN) minimal 2 hari sebelum stuffing kontainer.
                      </div>
                      <div className="p-2.5 bg-white border border-[#05190F]/5 rounded-sm">
                        <span className="font-mono font-bold text-[#05190F] block">2. Sampling Laboratorium</span>
                        Petugas fungsional karantina mendatangi gudang konsolidasi PT. Nandara untuk mengambil cuplikan biji kopi acak guna dianalisis di bawah mikroskop lab.
                      </div>
                      <div className="p-2.5 bg-white border border-[#05190F]/5 rounded-sm">
                        <span className="font-mono font-bold text-[#05190F] block">3. Fumigasi & Segel</span>
                        Bila lolos, kargo difumigasi selama 24 jam dengan metil bromida (CH3Br) atau sulfuril fluorida, lalu dibuat laporan fumigasi pendamping Fitosanitari.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Country Specific Certifications Explorer */}
              <div className="space-y-4">
                <h4 className="font-serif italic font-bold text-base text-[#05190F] border-b border-gray-150 pb-2">
                  🌍 Regulasi & Sertifikasi Negara Tujuan
                </h4>

                {/* Country Subtabs */}
                <div className="flex bg-stone-100 p-1 rounded-sm gap-1">
                  {[
                    { id: 'usa', label: 'Amerika Serikat' },
                    { id: 'eu', label: 'Eropa (EU)' },
                    { id: 'china', label: 'China' },
                    { id: 'taiwan', label: 'Taiwan' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedDocCountry(tab.id as any)}
                      className={`flex-1 text-center py-1 rounded-sm font-sans text-[11px] font-medium transition-all ${
                        selectedDocCountry === tab.id 
                          ? 'bg-[#05190F] text-[#C9A227] shadow-xs' 
                          : 'text-[#05190F]/70 hover:text-[#05190F]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* USA Content Card */}
                {selectedDocCountry === 'usa' && (
                  <div className="bg-white border border-stone-200 p-4 rounded-sm space-y-4 shadow-sm animate-fade-in">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A227] font-bold">U.S. Custom & Border Protection</span>
                      <h5 className="font-serif font-bold text-[#05190F] text-sm mt-0.5">Sertifikasi Pasar Amerika Serikat (US FDA & ICO)</h5>
                    </div>

                    <div className="text-xs text-gray-700 space-y-3 font-sans leading-relaxed">
                      <div className="p-2.5 bg-amber-50/30 border border-amber-500/10 rounded-sm">
                        <strong className="text-amber-950 font-mono text-[10px] block uppercase tracking-wider">🔒 1. FDA Registration ID</strong>
                        Setiap fasilitas pangan yang mengekspor ke AS wajib teregistrasi di US Food and Drug Administration (FDA). PT. Nandara harus mengajukan FDA Facility Registration Number dan memperbaruinya setiap tahun ganjil.
                      </div>

                      <div className="p-2.5 bg-amber-50/30 border border-amber-500/10 rounded-sm">
                        <strong className="text-amber-950 font-mono text-[10px] block uppercase tracking-wider">⚡ 2. Prior Notice (PN) Filing</strong>
                        Sangat krusial! Prior Notice wajib dilaporkan secara elektronik kepada FDA sebelum kontainer bersandar di pelabuhan pendaratan AS (maksimum 5 hari dan minimum 8 jam sebelum kedatangan kapal laut). Kelemahan PN memicu penahanan kargo seketika.
                      </div>

                      <div className="p-2.5 bg-amber-50/30 border border-amber-500/10 rounded-sm">
                        <strong className="text-amber-950 font-mono text-[10px] block uppercase tracking-wider">☕ 3. ICO Certificate of Origin</strong>
                        US Customs memerlukan sertifikat berlabel International Coffee Organization (ICO) yang dikeluarkan oleh AEKI (Asosiasi Eksportir Kopi Indonesia) atau instansi terpilih guna memantau kuota ekspor global secara historis.
                      </div>
                    </div>
                  </div>
                )}

                {/* EU Content Card */}
                {selectedDocCountry === 'eu' && (
                  <div className="bg-white border border-stone-200 p-4 rounded-sm space-y-4 shadow-sm animate-fade-in">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-800 font-bold">European Commission Portal</span>
                      <h5 className="font-serif font-bold text-[#05190F] text-sm mt-0.5">Sertifikasi Pasar Uni Eropa (EUDR & Geolocation)</h5>
                    </div>

                    <div className="text-xs text-gray-700 space-y-3 font-sans leading-relaxed">
                      <div className="p-2.5 bg-emerald-50/20 border border-emerald-500/15 rounded-sm">
                        <strong className="text-emerald-950 font-mono text-[10px] block uppercase tracking-widest">🌳 1. EUDR Compliance Directive (NEW 2026)</strong>
                        Kewajiban paling krusial terkini! Eksportir wajib membuktikan bahwa biji kopi tidak bersumber dari lahan deforestasi (sejak cutoff tanggal 31 Desember 2020). Wajib menyertakan koordinat titik (bila di bawah 4 Hektar) atau poligon pemetaan lahan kebun petani (bila di atas 4 Hektar) dalam format GeoJSON atau KML.
                      </div>

                      <div className="p-2.5 bg-emerald-50/20 border border-emerald-500/15 rounded-sm">
                        <strong className="text-emerald-950 font-mono text-[10px] block uppercase tracking-widest">📝 2. REX System Self-Certification</strong>
                        Skema Registered Exporter (REX) Uni Eropa. Memperbolehkan eksportir terdaftar untuk mendeklarasikan keaslian barang GSP secara mandiri langsung di atas Commercial Invoice tanpa perlu memohon COO manual terus menerus.
                      </div>

                      <div className="p-2.5 bg-emerald-50/20 border border-emerald-500/15 rounded-sm">
                        <strong className="text-emerald-950 font-mono text-[10px] block uppercase tracking-widest">🔬 3. Ochratoxin-A Level Certification</strong>
                        EU memiliki nilai ambang batas Ochratoxin-A paling ketat di dunia (maksimum 5.0 ppb untuk kopi hijau). Hasil tes kelembaban lab independen harus dilampirkan untuk mengesahkan standar keamanan pangan Uni Eropa.
                      </div>
                    </div>
                  </div>
                )}

                {/* China Content Card */}
                {selectedDocCountry === 'china' && (
                  <div className="bg-white border border-stone-200 p-4 rounded-sm space-y-4 shadow-sm animate-fade-in">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#C9A227] font-bold">China Customs (GACC)</span>
                      <h5 className="font-serif font-bold text-[#05190F] text-sm mt-0.5">Sertifikasi Pasar China (GACC Decree 248/249)</h5>
                    </div>

                    <div className="text-xs text-gray-700 space-y-3 font-sans leading-relaxed">
                      <div className="p-2.5 bg-stone-50 border border-stone-300 rounded-sm">
                        <strong className="text-stone-900 font-mono text-[10px] block uppercase tracking-wider">🇨🇳 1. GACC Single Window Registration</strong>
                        Sesuai ketetapan Decree 248 & 249 dari General Administration of Customs China (GACC). Pabrik pengolahan ekspor wajib memperoleh nomor registrasi GACC sebelum pengapalan kontainer. Nomor ini wajib dicetak tebal di atas karton kemasan luar kargo.
                      </div>

                      <div className="p-2.5 bg-stone-50 border border-stone-300 rounded-sm">
                        <strong className="text-stone-900 font-mono text-[10px] block uppercase tracking-wider">🏷️ 2. Dual-Language Labeling rules</strong>
                        Kemasan luar karung ekspor wajib memuat keterbacaan label dalam kombinasi dwi bahasa Inggris & Mandarin, yang memuat nama produk, berat bersih, wilayah asal budidaya produsen Indonesia, nomor pendaftaran pabean Indonesia, nama importir China, dan masa kadaluarsa.
                      </div>

                      <div className="p-2.5 bg-stone-50 border border-stone-300 rounded-sm">
                        <strong className="text-stone-900 font-mono text-[10px] block uppercase tracking-wider">🔬 3. Pesticide & Heavy Metal Lab Reports</strong>
                        Bea Cukai China secara berkala membongkar kontainer acak untuk menguji kadar logam berat Timbal (Pb) & pestisida organofosfat dilarang. Nandara wajib melampirkan hasil uji bebas cemaran logam berat di pelabuhan bongkar.
                      </div>
                    </div>
                  </div>
                )}

                {/* Taiwan Content Card */}
                {selectedDocCountry === 'taiwan' && (
                  <div className="bg-white border border-stone-200 p-4 rounded-sm space-y-4 shadow-sm animate-fade-in">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-blue-800 font-bold">Taiwan TFDA Portal</span>
                      <h5 className="font-serif font-bold text-[#05190F] text-sm mt-0.5">Sertifikasi Pasar Taiwan (TFDA & Batas Carbendazim)</h5>
                    </div>

                    <div className="text-xs text-gray-700 space-y-3 font-sans leading-relaxed">
                      <div className="p-2.5 bg-blue-50/30 border border-blue-500/10 rounded-sm">
                        <strong className="text-blue-950 font-mono text-[10px] block uppercase tracking-widest">🔬 1. Laporan Pengujian Pestisida Carbendazim</strong>
                        Taiwan (TFDA) memberlakukan pengawasan residu fungisida dan pestisida yang sangat ekstrem. Kadar residu fungisida <strong>Carbendazim</strong> wajib di bawah batas detasemen ketat TFDA (maksimum 0.05 ppm). Lab Sucofindo/SGS Indonesia wajib diutilisasi untuk melepaskan jaminan bebas residu ini.
                      </div>

                      <div className="p-2.5 bg-blue-50/30 border border-blue-500/10 rounded-sm">
                        <strong className="text-blue-950 font-mono text-[10px] block uppercase tracking-widest">🛂 2. TFDA Import Inspection Permit</strong>
                        Importir di Taiwan wajib memohon izin inspeksi pangan kepada Taiwan Food and Drug Administration (TFDA) sebelum kapal tiba di pelabuhan Kaohsiung atau Keelung. Bila pendaftaran produk didapati baru, TFDA akan mengambil sampel kargo sebesar 2kg secara wajib untuk pengujian lab karantina mereka.
                      </div>

                      <div className="p-2.5 bg-blue-50/30 border border-blue-500/10 rounded-sm">
                        <strong className="text-blue-950 font-mono text-[10px] block uppercase tracking-widest">🍉 3. Sertifikat Bebas Mikotoksina (Ochratoxin-A)</strong>
                        Sejalan dengan pengawasan regional, Taiwan membutuhkan pembuktian tingkat aflatoksin dan ochratoxin-A di bawah 5.0 ppb. Pastikan kadar air (moisture level) biji kopi hijau di bawah 12.5% mutlak sebelum pemuatan pelabuhan muat.
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* 7. ROASTING MASTERCLASS */}
        {activeSubTab === 'roasting' && (
          <div className="space-y-6 animate-fade-in" id="roasting-masterclass-view">
            {/* Top Masthead Banner */}
            <div className="bg-[#05190F] border border-[#C9A227]/30 rounded-lg p-6 text-white relative overflow-hidden shadow-luxury">
              <div className="absolute inset-0 bg-[radial-gradient(#C9A227_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#C9A227] font-bold flex items-center gap-1">
                    <Flame className="w-4 h-4 text-[#C9A227] animate-pulse" /> Advanced Penyangraian Komoditas PT. Nandara
                  </span>
                  <h2 className="text-2xl md:text-3xl font-serif italic text-white leading-tight">Roasting Masterclass & Curve Simulator</h2>
                  <p className="text-xs text-gray-300 max-w-2xl font-sans leading-relaxed">
                    Setiap varietas kopi hijau specialty PT. Nandara Nusa Montierra memiliki spesifikasi densitas, kadar air, dan ketahanan suhu yang saksama. Simulator ini dirancang untuk memandu Q-Grader dan Master Roaster global menyusun profil sangrai yang memaksimalkan skor potensi cita rasa biji kopi.
                  </p>
                </div>
                <div className="bg-white/10 p-3 border border-white/15 rounded text-xs font-mono shrink-0 space-y-1">
                  <p className="text-[#C9A227] font-bold">🧪 ROASTER CONSTANTS:</p>
                  <p className="text-[10px] text-gray-300">Drum Type: Single Wall Cast Iron</p>
                  <p className="text-[10px] text-gray-300">Burner: Premix Infrared System</p>
                </div>
              </div>
            </div>

            {/* Selection Options Dashboard and Curve Render */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Selector Form - span 5 */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Control Panel Card */}
                <div className="bg-white border border-[#05190F]/10 p-5 rounded-lg shadow-sm space-y-4">
                  <h4 className="font-serif font-bold text-[#05190F] text-base border-b border-gray-150 pb-2">
                    🎛️ Control Panel Simulator
                  </h4>

                  {/* Product Type Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">1. Pilih Produk Kopi Hijau</label>
                    <select
                      value={roastSelectedProduct}
                      onChange={e => setRoastSelectedProduct(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2.5 rounded text-xs text-[#05190F] font-sans focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227]"
                    >
                      <option value="gayo_g1">Aceh Gayo Grade 1 (Wet Hulled)</option>
                      <option value="gayo_wild">Gayo Wild Natural (Wild Natural)</option>
                      <option value="java_preanger">Java Preanger Reserve (Semi-Washed)</option>
                      <option value="bali_kintamani">Bali Kintamani (Natural Process)</option>
                      <option value="flores_volcanic">Flores Volcanic Fully Washed (Fully Washed)</option>
                      <option value="toraja_reserve">Toraja Reserve Blend (Hybrid)</option>
                      <option value="gayo_lb">Gayo LB Reserve Bourbon (Rare Microlot)</option>
                      <option value="lampung_reserve">Lampung Reserve Robusta (Robusta)</option>
                      <option value="temanggung_fine">Temanggung Fine Robusta (Fine Robusta)</option>
                    </select>
                  </div>

                  {/* Roast Degree Target Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">2. Target Roast Degree (Warna Penyangraian)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['light', 'medium', 'medium_dark', 'dark'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setRoastSelectedLevel(level)}
                          className={`py-2 text-[10px] font-mono tracking-wider uppercase font-bold rounded cursor-pointer border transition-all ${
                            roastSelectedLevel === level
                              ? 'bg-[#05190F] text-[#C9A227] border-[#C9A227]'
                              : 'bg-stone-50 text-gray-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {level.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Bean Density Override Option */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">3. Tentukan Densitas Biji Karakteristik (Custom Density)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['soft', 'medium', 'hard'] as const).map((density) => (
                        <button
                          key={density}
                          type="button"
                          onClick={() => setRoastDensityLevel(density)}
                          className={`py-2 text-[10px] font-mono tracking-wider uppercase font-bold rounded cursor-pointer border transition-all ${
                            roastDensityLevel === density
                              ? 'bg-[#05190F] text-[#C9A227] border-[#C9A227]'
                              : 'bg-stone-50 text-gray-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {density}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9.5px] text-gray-500 leading-normal italic font-sans bg-[#FAF8F5] p-2 rounded border border-gray-150">
                      {roastDensityLevel === 'soft' && `👉 Soft: Sangrai biji lunak (e.g. Robusta dataran rendah). Menghindari scorching dengan offsets kustom Anda: Charge Temp ${softDensityCtOffset}°C & Aliran Udara ${softDensityAirflowOffset}%.`}
                      {roastDensityLevel === 'medium' && "👉 Medium: Nilai termal standar tanpa offset (mengikuti density alami varietas kopi)."}
                      {roastDensityLevel === 'hard' && `👉 Hard: Menembus kelembaban tinggi biji keras (e.g. Lintong/Gayo Arabika >1600m). Mengakselerasi konduksi dengan offsets kustom Anda: Charge Temp +${hardDensityCtOffset}°C & Aliran Udara +${hardDensityAirflowOffset}%.`}
                    </p>

                    {/* DENSITY CALIBRATORS PANEL */}
                    <div className="p-3 bg-stone-50 border border-dashed border-gray-300 rounded space-y-3 pt-2.5">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                        <span className="text-[9.5px] font-mono text-gray-600 font-bold uppercase tracking-wider">🛠️ Calibrate Custom Offsets</span>
                        <span className="text-[8px] font-mono text-[#C9A227] font-bold">Interactive sliders</span>
                      </div>

                      {/* Soft Density Customizers */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono font-bold text-gray-700 block">Configure "SOFT" Profile:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-gray-500">
                              <span>Charge Temp offset:</span>
                              <span className="font-bold text-amber-700">{softDensityCtOffset}°C</span>
                            </div>
                            <input 
                              type="range" min="-25" max="-2" step="1" value={softDensityCtOffset}
                              onChange={(e) => setSoftDensityCtOffset(parseInt(e.target.value))}
                              className="w-full accent-amber-600 h-1 bg-gray-250 rounded cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-gray-500">
                              <span>Airflow Offset:</span>
                              <span className="font-bold text-amber-700">{softDensityAirflowOffset}%</span>
                            </div>
                            <input 
                              type="range" min="-15" max="-1" step="1" value={softDensityAirflowOffset}
                              onChange={(e) => setSoftDensityAirflowOffset(parseInt(e.target.value))}
                              className="w-full accent-amber-600 h-1 bg-gray-250 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hard Density Customizers */}
                      <div className="space-y-2 border-t border-gray-200 pt-2">
                        <span className="text-[9px] font-mono font-bold text-gray-700 block">Configure "HARD" Profile:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-gray-500">
                              <span>Charge Temp offset:</span>
                              <span className="font-bold text-teal-700">+{hardDensityCtOffset}°C</span>
                            </div>
                            <input 
                              type="range" min="2" max="25" step="1" value={hardDensityCtOffset}
                              onChange={(e) => setHardDensityCtOffset(parseInt(e.target.value))}
                              className="w-full accent-teal-600 h-1 bg-gray-250 rounded cursor-pointer"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-mono text-gray-500">
                              <span>Airflow Offset:</span>
                              <span className="font-bold text-teal-700">+{hardDensityAirflowOffset}%</span>
                            </div>
                            <input 
                              type="range" min="1" max="15" step="1" value={hardDensityAirflowOffset}
                              onChange={(e) => setHardDensityAirflowOffset(parseInt(e.target.value))}
                              className="w-full accent-teal-600 h-1 bg-gray-250 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Batch Weight Slider */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-600 uppercase text-[10px] tracking-wider block font-bold">4. Berat Batch (Batch Weight)</span>
                      <span className="font-mono font-bold text-[#05190F]">{roastBatchWeight} Kg</span>
                    </div>
                    <input 
                      type="range" min="5" max="30" step="1" value={roastBatchWeight} 
                      onChange={e => setRoastBatchWeight(parseInt(e.target.value))}
                      className="w-full accent-[#05190F] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                      <span>Min: 5 Kg</span>
                      <span>Max: 30 Kg (Full Load)</span>
                    </div>
                  </div>

                  {/* Adaptive Roaster Recommendations Card */}
                  <div className="p-3 bg-[#FAF8F5] border border-stone-200/60 rounded-sm space-y-2">
                    <span className="font-mono text-[9px] text-[#C9A227] font-bold uppercase tracking-wider block">⚡ Dynamic Roaster RPM & Fan Guide</span>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono leading-tight">
                      <div>
                        <p className="text-gray-500 text-[10px]">• Drum Speed</p>
                        <p className="text-[#05190F] font-bold text-sm mt-0.5">{Math.round(60 - (roastBatchWeight - 5) * 0.7)} RPM</p>
                        <p className="text-[10px] text-gray-405 mt-0.5 font-sans italic">Untuk aliran piringan seragam</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px]">• Recommended Airflow</p>
                        <p className="text-[#05190F] font-bold text-sm mt-0.5">
                          {Math.min(98, Math.max(20, Math.round(55 + (roastBatchWeight - 5) * 1.5) + (roastDensityLevel === 'hard' ? 8 : roastDensityLevel === 'soft' ? -5 : 0)))}% (Suction)
                        </p>
                        <p className="text-[10px] text-gray-450 mt-0.5 font-sans italic">Untuk penyapuan chaff gas</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Physical Green Bean Profile */}
                {(() => {
                  const pId = roastSelectedProduct;
                  const profile = ROAST_PROFILES_MAP[pId] || ROAST_PROFILES_MAP.gayo_g1;
                  return (
                    <div className="bg-[#FAF8F5] p-5 rounded-lg border border-[#05190F]/10 space-y-3 shadow-xs">
                      <h5 className="font-serif italic font-bold text-gray-900 text-sm border-b border-stone-200 pb-1.5">🔬 Karakter Green Bean Fisik</h5>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
                        <div>
                          <p className="text-gray-400 text-[9px] uppercase font-bold">Process Metode</p>
                          <p className="text-[#05190F] font-sans font-bold">{profile.process}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-[9px] uppercase font-bold">Moisture Level</p>
                          <p className="text-[#05190F] font-sans font-bold">{profile.moisture}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 text-[9px] uppercase font-bold">Kerapatan Biji (Density Mark)</p>
                          <p className="text-[#05190F] font-sans font-bold">{profile.density}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Right Column: Roast Curve Interactive Chart & Advice - span 7 */}
              <div className="lg:col-span-7 space-y-6">
                
                {(() => {
                  const pId = roastSelectedProduct;
                  const lvl = roastSelectedLevel;
                  const profile = ROAST_PROFILES_MAP[pId] || ROAST_PROFILES_MAP.gayo_g1;
                  const levelProfile = profile.levels[lvl] || profile.levels.medium;

                  // Temperatures
                  const ctOffset = roastDensityLevel === 'hard' ? hardDensityCtOffset : roastDensityLevel === 'soft' ? softDensityCtOffset : 0;
                  const tpOffset = roastDensityLevel === 'hard' ? Math.round(hardDensityCtOffset * 0.25) : roastDensityLevel === 'soft' ? Math.round(softDensityCtOffset * 0.25) : 0;
                  const ct = levelProfile.chargeTemp + ctOffset;
                  const tp = levelProfile.turningPointTemp + tpOffset;
                  const tpTime = levelProfile.turningPointTime;
                  const de = levelProfile.dryEndTemp;
                  const deTime = levelProfile.dryEndTime;
                  const fc = levelProfile.firstCrackTemp;
                  const fcTime = levelProfile.firstCrackTime;
                  const drop = levelProfile.dropTemp;
                  const dropTime = levelProfile.dropTime;
                  const dtr = levelProfile.dtr;

                  // Normalize temps to SVG Height (0-160px coordinate space, where minT = 60, maxT = 230)
                  const scaleT = (temp: number) => {
                    const minT = 60;
                    const maxT = 230;
                    // Invert for SVG Y (Y axis increases downwards)
                    return 160 - ((temp - minT) / (maxT - minT)) * 140;
                  };

                  // Coordinate points for SVG Path (X: 0-480px, Y: scaled Temp)
                  const xCharge = 15;
                  const yCharge = scaleT(ct);

                  const xTurning = 75;
                  const yTurning = scaleT(tp);

                  const xDryEnd = 180;
                  const yDryEnd = scaleT(de);

                  const xFC = 330;
                  const yFC = scaleT(fc);

                  const xDrop = 445;
                  const yDrop = scaleT(drop);

                  // SVG Curve Line
                  const pathD = `M ${xCharge} ${yCharge} Q ${xTurning - 10} ${yTurning + 40} ${xTurning} ${yTurning} T ${xDryEnd} ${yDryEnd} Q ${(xDryEnd + xFC)/2} ${(yDryEnd + yFC)/2} ${xFC} ${yFC} Q ${(xFC + xDrop)/2} ${(yFC + yDrop)/2 - 5} ${xDrop} ${yDrop}`;

                  return (
                    <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-sm space-y-6">
                      
                      {/* Interactive SVG Chart Card */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline border-b border-stone-150 pb-2">
                          <h4 className="font-serif font-bold text-gray-900 text-base flex items-center gap-1.5">
                            📊 Kurva Penyangraian Dinamis (Roast Profile Curve)
                          </h4>
                          <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase font-bold">
                            Roating Type: Convection
                          </span>
                        </div>

                        {/* Chart Render Canvas */}
                        <div className="p-3 bg-stone-95 border border-stone-200 rounded-sm relative">
                          <svg viewBox="0 0 480 180" className="w-full h-auto overflow-visible font-mono">
                            {/* Grid Lines */}
                            <line x1="15" y1="20" x2="445" y2="20" stroke="#000" strokeWidth="0.5" strokeOpacity="5" strokeDasharray="4" />
                            <line x1="15" y1="90" x2="445" y2="90" stroke="#000" strokeWidth="0.5" strokeOpacity="5" strokeDasharray="4" />
                            <line x1="15" y1="160" x2="445" y2="160" stroke="#000" strokeWidth="1" strokeOpacity="15" />

                            {/* Grid Labels (Y-Axis Temps) */}
                            <text x="5" y="24" className="text-[7.5px] fill-gray-400 text-right">220°C</text>
                            <text x="5" y="94" className="text-[7.5px] fill-gray-400 text-right">140°C</text>
                            <text x="5" y="158" className="text-[7.5px] fill-gray-400 text-right">60°C</text>

                            {/* X-Axis Time Labels */}
                            <text x="15" y="174" className="text-[7.5px] fill-gray-400 text-center">0:00</text>
                            <text x="75" y="174" className="text-[7.5px] fill-gray-400 text-center">1:15</text>
                            <text x="180" y="174" className="text-[7.5px] fill-gray-400 text-center">4:00</text>
                            <text x="330" y="174" className="text-[7.5px] fill-gray-400 text-center">8:30</text>
                            <text x="445" y="174" className="text-[7.5px] fill-gray-400 text-center">10:40</text>

                            {/* Core temperature path */}
                            <path d={pathD} fill="none" stroke="#C9A227" strokeWidth="3" className="stroke-[#05190F]" />

                            {/* Turning Point Line indicator (Vertical) */}
                            <line x1={xTurning} y1={yTurning} x2={xTurning} y2="160" stroke="#000" strokeWidth="0.5" strokeOpacity="10" strokeDasharray="2" />
                            <line x1={xDryEnd} y1={yDryEnd} x2={xDryEnd} y2="160" stroke="#000" strokeWidth="0.5" strokeOpacity="10" strokeDasharray="2" />
                            <line x1={xFC} y1={yFC} x2={xFC} y2="160" stroke="#000" strokeWidth="0.5" strokeOpacity="10" strokeDasharray="2" />
                            <line x1={xDrop} y1={yDrop} x2={xDrop} y2="160" stroke="#000" strokeWidth="0.5" strokeOpacity="10" strokeDasharray="2" />

                            {/* Data Dot Indicators */}
                            {/* 1. Charge Temp */}
                            <circle cx={xCharge} cy={yCharge} r="4" fill="#05190F" stroke="#fff" strokeWidth="1" />
                            <text x={xCharge + 8} y={yCharge - 4} className="text-[8px] font-bold fill-primary">CHARGE {ct}°C</text>

                            {/* 2. Turning Point */}
                            <circle cx={xTurning} cy={yTurning} r="4" fill="#C9A227" stroke="#fff" strokeWidth="1" />
                            <text x={xTurning - 15} y={yTurning - 10} className="text-[8px] font-bold fill-[#C9A227]">TP {tp}°C</text>
                            <text x={xTurning - 15} y={yTurning + 16} className="text-[6.5px] fill-gray-500 font-sans">({tpTime}m)</text>

                            {/* 3. Dry End */}
                            <circle cx={xDryEnd} cy={yDryEnd} r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
                            <text x={xDryEnd - 15} y={yDryEnd - 10} className="text-[8px] font-bold fill-amber-600">DRY END {de}°C</text>
                            <text x={xDryEnd - 15} y={yDryEnd + 16} className="text-[6.5px] fill-gray-500 font-sans">({deTime}m)</text>

                            {/* 4. First Crack */}
                            <circle cx={xFC} cy={yFC} r="4" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                            <text x={xFC - 15} y={yFC - 10} className="text-[8px] font-bold fill-red-600">FC START {fc}°C</text>
                            <text x={xFC - 15} y={yFC + 16} className="text-[6.5px] fill-gray-500 font-sans">({fcTime}m)</text>

                            {/* 5. Drop / Drop Temp */}
                            <circle cx={xDrop} cy={yDrop} r="5" fill="#000" stroke="#fff" strokeWidth="1.5" />
                            <text x={xDrop - 65} y={yDrop - 8} className="text-[8.5px] font-bold fill-[#05190F] uppercase">DROP {drop}°C</text>
                            <text x={xDrop - 40} y={yDrop + 14} className="text-[6.5px] fill-gray-500 font-sans font-bold">({dropTime}m • DTR {dtr})</text>
                          </svg>
                        </div>
                      </div>

                      {/* Active Calibrated Parameter Feedbacks */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#FAF8F5] p-3 border border-gray-200 rounded-lg">
                        <div className="p-2 border-r border-dashed border-gray-200">
                          <p className="text-[9px] font-mono uppercase text-gray-500 font-bold">Active Density calibration:</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-base">
                              {roastDensityLevel === 'hard' && '🟢'}
                              {roastDensityLevel === 'medium' && '⚪'}
                              {roastDensityLevel === 'soft' && '🟠'}
                            </span>
                            <span className={`text-xs font-mono font-bold uppercase ${
                              roastDensityLevel === 'hard' ? 'text-teal-800' : roastDensityLevel === 'soft' ? 'text-amber-800' : 'text-gray-800'
                            }`}>
                              {roastDensityLevel} Density mode
                            </span>
                          </div>
                        </div>

                        <div className="p-2 border-r border-dashed border-gray-200">
                          <p className="text-[9px] font-mono uppercase text-[#05190F] font-bold">Recommended Charge Temperature:</p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-sm font-sans font-black text-gray-900">{ct}°C</span>
                            <span className="text-[9px] font-mono text-gray-500">
                              (Base: {levelProfile.chargeTemp}°C {ctOffset !== 0 && `| Shift: ${ctOffset >= 0 ? '+' : ''}${ctOffset}°C`})
                            </span>
                          </div>
                        </div>

                        <div className="p-2">
                          <p className="text-[9px] font-mono uppercase text-gray-500 font-bold">Dynamic Convection Airflow recommendation:</p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-sm font-sans font-black text-gray-900 font-mono">
                              {roastDensityLevel === 'hard' ? `+${hardDensityAirflowOffset}%` : roastDensityLevel === 'soft' ? `${softDensityAirflowOffset}%` : '0%' }
                            </span>
                            <span className="text-[9px] font-mono text-gray-500">
                              {roastDensityLevel === 'hard' && " (High Draft)"}
                              {roastDensityLevel === 'soft' && " (Low Draw)"}
                              {roastDensityLevel === 'medium' && " (Default Chimney)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Phase Advice Grid */}
                      <div className="space-y-4">
                        <div className="border-b border-stone-200 pb-1 flex justify-between items-center">
                          <h5 className="font-serif italic font-bold text-gray-900 text-sm">💡 Rekomendasi Alur & Parameter Penyangraian</h5>
                          <span className="font-mono text-[9.5px] text-[#C9A227] font-bold uppercase tracking-wider">
                            Varietas: {profile.name}
                          </span>
                        </div>

                        {/* Phase 1, Phase 2, Phase 3 Advice Box */}
                        <div className="space-y-3 text-xs text-gray-700 leading-relaxed font-sans">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
                              <span className="font-mono font-bold text-[10px] text-[#05190F] block border-b border-stone-200 pb-1 mb-1.5 uppercase tracking-wider">🔥 Fase Pengeringan</span>
                              <p className="text-[11px] text-gray-600">{profile.dryingPhaseAdvice}</p>
                            </div>
                            <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
                              <span className="font-mono font-bold text-[10px] text-amber-700 block border-b border-stone-200 pb-1 mb-1.5 uppercase tracking-wider">⏳ Transaksi Maillard</span>
                              <p className="text-[11px] text-gray-600">{profile.maillardAdvice}</p>
                            </div>
                            <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
                              <span className="font-mono font-bold text-[10px] text-red-700 block border-b border-stone-200 pb-1 mb-1.5 uppercase tracking-wider">🎯 Development & Drop</span>
                              <p className="text-[11px] text-gray-600">{profile.developmentAdvice}</p>
                            </div>
                          </div>

                          {/* Profile Description and Flavor Outcome */}
                          <div className="p-4 bg-[#05190F]/5 border-l-3 border-[#C9A227] rounded-r space-y-1.5 text-left">
                            <h6 className="font-serif font-bold text-gray-900 text-xs">Cita Rasa Hasil Penyangraian (Cupping Outcome Profile)</h6>
                            <p className="text-[11px] italic font-medium text-gray-800">"{levelProfile.profileDescription}"</p>
                            <div className="text-[11.5px] flex items-center gap-2 mt-2">
                              <span className="bg-[#05190F] text-[#C9A227] px-2 py-0.5 rounded-sm font-mono text-[9px] font-bold uppercase tracking-wider shrink-0">Flavors</span>
                              <strong className="text-emerald-950 font-serif">{levelProfile.flavorOutcome}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>

            {/* IN-DEPTH ROASTING SCIENCE & BUYER PRESENTATION ENCYCLOPEDIA */}
            <div className="bg-white border border-[#05190F]/10 rounded-lg p-6 shadow-luxury space-y-6 mt-6 text-left" id="roasting-stages-deep-dive">
              <div className="border-b border-gray-150 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#C9A227]" /> Buyer Presentation Guide
                  </h3>
                  <h2 className="text-xl font-serif italic text-[#05190F]">Panduan Presentasi Ilmiah Roasting kepada Buyer Global</h2>
                </div>
                <div className="text-[10px] font-mono text-[#05190F] bg-amber-50 p-1 px-3 border border-amber-200 uppercase rounded-sm font-bold">
                  B2B Masterclass Note
                </div>
              </div>

              <p className="text-xs text-gray-650 font-sans leading-relaxed text-justify">
                Saat melakukan pitching atau cupping bersama roaster global, menyajikan kopi dengan kalimat deskriptif umum ("Kopi ini manis, body tebal, dan wangi") seringkali kurang meyakinkan purchasing manager profesional. Mereka ingin mendengar aspek fungsional-ilmiah serta jaminan stabilitas kurva sangrai. Gunakan modal dialog teknis di bawah ini untuk mengunci kesepakatan dagang (<span className="italic">roast profiling alignment</span>).
              </p>

              {/* Grid 5 Tahapan Utama Sangrai */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  {
                    title: "1. Drying / Yellowing",
                    tempRange: "Suhu Kamar - 150°C (Endotermis)",
                    desc: "Proses transfer energi untuk mengevakuasi kandungan air bebas di dalam struktur seluler.",
                    chemistry: "Transfer energi panas dari besi drum berputar memicu kadar air menguap. Klorofil mulai meluruh dan warna biji melunak dari hijau tua ke kuning jerami (straw phase).",
                    buyerTalk: "Sebutkan ke buyer: 'Karakter kering alami gayo wet-hulled kami kelola dengan pengantaran energi awal konduktif stabil pada Charge Temp terukur agar kelembaban teras biji dievakuasi tanpa risiko mencederai lapisan sel luar.'",
                    color: "bg-[#F7F4EC] border-[#C9A227]/30 text-[#05190F]"
                  },
                  {
                    title: "2. Reaksi Maillard",
                    tempRange: "150°C - 185°C (Transisi)",
                    desc: "Reaksi kimia penggabungan asam amino dengan gula pereduksi membentuk melanoidin.",
                    chemistry: "Melanoidin membentuk warna cokelat khas kopi dan ribuan VOC (Volatile Organic Compounds) aromatik kompleks penentu body serta kompleksitas rasa manis.",
                    buyerTalk: "Sebutkan ke buyer: 'Kami sengaja memperpanjang fase Maillard dalam rentang 158°C - 175°C sekitar 1.5 - 2 menit guna mensintesis senyawa gula kompleks dan ketebalan body tanpa menaikkan astringency asam malat liarnya.'",
                    color: "bg-orange-50/70 border-orange-200 text-orange-950"
                  },
                  {
                    title: "3. First Crack (FC)",
                    tempRange: "194°C - 198°C (Eksotermis)",
                    desc: "Pelepasan energi uap tekanan tinggi yang memecah secara akustik membran selulosa.",
                    chemistry: "Uap air super jenuh terperangkap di pusat biji meledak secara mekanik. Volume biji mengembang hingga 40-60% seketika, dan sisa chaff (kulit ari) terkelupas luruh.",
                    buyerTalk: "Sebutkan ke buyer: 'Laju aliran udara (suction fan) kami maksimalkan 90% sesaat sebelum First Crack pecah guna menyapu gas karbon monoksida dan partikel chaff terbang yang berpotensi memicu smoky defect.'",
                    color: "bg-red-50/60 border-red-200 text-red-955"
                  },
                  {
                    title: "4. Development Phase",
                    tempRange: "Pasca FC - Drop Temp",
                    desc: "Fase krusial penentu keseimbangan akhir kadar keasaman (acidity) dan rasa manis (sweetness).",
                    chemistry: "Karamelisasi sukrosa dan dekomposisi asam organik berlanjut secara intens. Keseimbangan ini sepenuhnya diatur oleh persentase durasi sangrai pasca-FC (DTR/Development Time Ratio).",
                    buyerTalk: "Sebutkan ke buyer: 'Dengan penataan DTR stabil pada rentang 13% s.d 16%, kami mampu mengekspos rasa jeruk segar Bali Kintamani maupun notes jasmine Java Preanger tanpa risiko rasa pangkas (scorched) atau mentah (underdeveloped).'",
                    color: "bg-emerald-50/60 border-emerald-200 text-emerald-955"
                  },
                  {
                    title: "5. Second Crack (SC)",
                    tempRange: "218°C - 224°C (Pirolisis)",
                    desc: "Ledakan sekunder hancurnya membran selulosa bagian dalam pendukung minyak kopi.",
                    chemistry: "Pelepasan gas CO2 secara ekstrem memaksa minyak kopi (lipida esensial) mendesak keluar permukaan (oily sheen). Karbon aktif mulai terbentuk secara dominan.",
                    buyerTalk: "Sebutkan ke buyer: 'Kami menghindari Second Crack sepenuhnya pada arabika specialty kami untuk mencegah flavor arang (ashy). Namun, fine robusta Lampung kami sangrai menyentuh awal Second Crack agar melahirkan bodi crema padat espreso base.'",
                    color: "bg-stone-50 border-stone-300 text-stone-900"
                  }
                ].map((phase, idx) => (
                  <div key={idx} className={`p-4 rounded border transition-all ${phase.color} shadow-xs hover:border-[#C9A227] text-left space-y-2.5`}>
                    <div className="border-b border-[#05190F]/10 pb-1.5 font-sans">
                      <h4 className="font-mono text-xs font-bold uppercase tracking-wide">{phase.title}</h4>
                      <p className="text-[10px] font-mono font-bold mt-0.5 text-gray-500">{phase.tempRange}</p>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-relaxed font-sans mt-2">
                      <p className="text-gray-700 font-medium font-bold">{phase.desc}</p>
                      <p className="text-gray-500 italic bg-white/70 p-2 rounded text-[10.5px] border border-stone-200">
                        <strong className="text-xs not-italic text-[#05190F] block mb-0.5 font-bold">🔬 Kimiawi:</strong> {phase.chemistry}
                      </p>
                      <p className="text-[#05190F] bg-stone-50 p-2 rounded border border-[#05190F]/10 text-[10.5px]">
                        <strong className="text-[#C9A227] block font-mono text-[9px] uppercase tracking-wider mb-0.5 font-bold">🗣️ B2B Pitch Key:</strong>
                        {phase.buyerTalk}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bagian Parameter Sains Tambahan untuk Kepercayaan Buyer */}
              <div className="bg-[#FAF8F5] border border-[#05190F]/10 rounded p-5 space-y-4 text-left">
                <h4 className="font-serif italic font-bold text-[#05190F] text-sm border-b border-[#05190F]/5 pb-2">
                  🛡️ Indikator Kunci & Standar Sains yang Dibidik Buyer Korporasi Global
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-sans">
                  <div className="space-y-1.5">
                    <h5 className="font-mono font-bold text-[10px] text-emerald-955 uppercase font-bold">1. Water Activity (aw)</h5>
                    <p className="text-gray-650 leading-relaxed text-[11.5px]">
                      Bukan sekadar kadar air rata-rata keseluruhan (moisture content), buyer korporat Eropa, Jepang, dan Amerika sangat ketat mengukur aktivitas air bebas (<span className="font-mono font-bold">aw</span>) dengan target ideal <strong>0.50 s.d 0.60 aw</strong>. Angka di atas 0.65 aw memicu risiko tinggi tumbuhnya spora jamur okratoksin A selama perjalanan laut lintas samudera.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h5 className="font-mono font-bold text-[10px] text-amber-955 uppercase font-bold">2. Steady Declining Rate of Rise (RoR)</h5>
                    <p className="text-gray-650 leading-relaxed text-[11.5px]">
                      Kurva sangrai yang konsisten wajib menunjukkan akselerasi laju penyerapan panas (<span className="font-mono font-bold">RoR</span>) yang menurun secara halus tanpa adanya hentakan mendadak. Defek grafis seperti <i>flick</i> (kenaikan suhu tak terkontrol pasca-FC) atau <i>crash</i> (anjloknya energi saat ekspansi uap) merusak stabilitas rasa seduh batch ke batch.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <h5 className="font-mono font-bold text-[10px] text-[#05190F] uppercase font-bold">3. Density Metric Calibration</h5>
                    <p className="text-gray-650 leading-relaxed text-[11.5px]">
                      Mempresentasikan nilai densitas fisik terperinci (misal: <strong>strictly &gt; 710 g/L</strong> untuk strictly hard bean) mematahkan kecurigaan buyer bahwa ekportir lokal tidak mengasuh lab mandiri yang tersertifikasi. Ini memberi jaminan bahwa biji mampu menahan muatan suhu awal yang agresif pada pemanggang industri kapasitas besar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 7. QC & CUPPING PROTOCOL MASTERCLASS */}
        {activeSubTab === 'qc' && (
          <div className="space-y-6 animate-fade-in" id="qc-cupping-view">
            
            {/* Top overview bar */}
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-[#C9A227]" /> Quality Control (QC) & SCA Cupping Hub
                  </h3>
                  <h2 className="text-2xl font-serif italic text-[#05190F]">Kurikulum Lengkap Analisa Cita Rasa & Uji Skor Kopi Specialty</h2>
                </div>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 p-1 px-3 border border-emerald-200 uppercase rounded-sm font-bold">
                  SCA (Specialty Coffee Association) Standard
                </div>
              </div>

              <p className="text-xs text-gray-600 font-sans leading-relaxed max-w-4xl">
                Uji cita rasa (<span className="italic">cupping test</span>) merupakan bahasa universal di industri kopi internasional. Di sini Anda akan menguasai metode penilaian kuantitatif dan kualitatif berdasarkan lembar penilaian standar <strong>SCA (Specialty Coffee Association)</strong> yang diakui di seluruh pelabuhan ekspor dunia untuk memisahkan kopi <i>Commercial</i> dengan kopi <i>Specialty (80+)</i>.
              </p>
            </div>

            {/* Grid for Curriculum Protocol vs Interactive Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* COL 1: Official Protocol Curriculum (SCA Standards) - span 7 */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Core Curriculum Lesson */}
                <div className="bg-white border border-stone-100 p-6 rounded-lg shadow-sm space-y-4">
                  <h3 className="font-serif font-bold text-[#05190F] text-lg flex items-center gap-2">
                    📋 1. Protokol & Parameter Standard Operasional (SCA Cupping Protocol)
                  </h3>
                  <p className="text-xs text-gray-600 font-sans leading-relaxed">
                    Eksportir yang profesional wajib mengikuti protokol ketat berikut agar hasil penilaian cita rasa kargo sama presisinya saat di-<i>cupping</i> ulang oleh Q-Grader atau Green Buyer di luar negeri.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-bg-ivory/40 border border-primary/5 rounded-sm space-y-1.5 text-xs font-mono">
                      <p className="font-bold text-emerald-950 uppercase text-[10px] border-b border-primary/5 pb-1">🧪 Air & Suhu Seduh</p>
                      <ul className="text-gray-600 font-sans text-[11px] list-disc list-inside space-y-0.5">
                        <li>Menggunakan air bersih terfiltrasi bebas bau.</li>
                        <li><strong>TDS Ideal:</strong> 75 - 250 ppm.</li>
                        <li><strong>Suhu Seduh:</strong> 92.2°C – 94.4°C (200°F).</li>
                        <li>Suhu berlebih akan mengekstraksi pahit hangus.</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-bg-ivory/40 border border-primary/5 rounded-sm space-y-1.5 text-xs font-mono">
                      <p className="font-bold text-emerald-950 uppercase text-[10px] border-b border-primary/5 pb-1">☕ Rasio & Grinding</p>
                      <ul className="text-gray-600 font-sans text-[11px] list-disc list-inside space-y-0.5">
                        <li><strong>Rasio:</strong> 8.25 gram kopi per 150ml air.</li>
                        <li><strong>Ukuran Gilingan:</strong> Coarse (Kasar, seperti garam dapur).</li>
                        <li><strong>Keseragaman:</strong> 70-75% lolos ayakan mesh 20.</li>
                        <li>Sajikan dalam 5 gelas identik untuk uji uniformitas.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="font-serif font-bold text-[#05190F] text-sm">Kronologis Evaluasi Sensori (Sensory Timeline)</h4>
                    <div className="border-l-2 border-[#C9A227] pl-4 space-y-3">
                      <div className="text-xs">
                        <strong className="text-emerald-950 font-mono block text-[11px] uppercase tracking-wider">Menit ke-0 s/d Menit ke-15 (Dry & Wet Aroma)</strong>
                        <p className="text-gray-600 font-sans mt-0.5">Smell dry grounds (Fragrance) dalam 15 menit setelah digiling. Setelah air dituang, diamkan terendam tanpa disentuh selama 4 menit untuk membiarkan kerak kopi (<span className="italic">crust</span>) terbentuk sempurna di atas udara basah.</p>
                      </div>
                      <div className="text-xs">
                        <strong className="text-emerald-950 font-mono block text-[11px] uppercase tracking-wider">Menit ke-4 (Break & Skim)</strong>
                        <p className="text-gray-600 font-sans mt-0.5">Lakukan pemecahan kerak (<span className="italic">Break the Crust</span>) secara perlahan sebanyak 3 kali dorongan sendok khusus cupping. Hirup kepulan aroma volatil basah tersebut. Ambil busa yang tersisa di permukaan gelas agar bersih.</p>
                      </div>
                      <div className="text-xs">
                        <strong className="text-emerald-950 font-mono block text-[11px] uppercase tracking-wider">Menit ke-8 s/d Menit ke-10 (Flavor, Aftertaste, Acidity, Body, Balance)</strong>
                        <p className="text-gray-600 font-sans mt-0.5">Bila suhu sup kopi telah mendingin ke kisaran 71°C, mulai hirup sup kopi dengan cara diseruput keras (<span className="italic">slurping</span>). Hal ini mengubah cairan kopi menjadi butiran aerosol halus yang menyelimuti seluruh reseptor sensorik lidah dan rongga hidung posterior. Semburkan kopi dan nilai dimensi sensori rasa.</p>
                      </div>
                      <div className="text-xs">
                        <strong className="text-emerald-950 font-mono block text-[11px] uppercase tracking-wider">Mendingin Ke Suhu Ruang &lt; 37°C (Sweetness, Clean Cup, Uniformity, Overall)</strong>
                        <p className="text-gray-600 font-sans mt-0.5">Ketika cangkir mendingin, cek keseragaman rasa (<span className="italic">Uniformity</span>) kelima gelas. Gelas yang terganggu rasa tanah, jamur, ataupun karat wajib ditandai. Ukur tingkat kemanisan terkaramelisasi (<span className="italic">Sweetness</span>) dan kebersihan sisa rasa (<span className="italic">Clean Cup</span>).</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard quality factors checklists summary inside the QC Curriculum tab */}
                <div className="bg-[#FAF8F5] border border-[#05190F]/10 p-5 rounded-lg space-y-3">
                  <h4 className="font-serif italic font-bold text-sm text-[#05190F]">Indikator Mutu Fisik Komplementer (Export Target)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div 
                      onClick={() => toggleTask('learn_moisture')} 
                      className={`p-3 border rounded bg-white transition-all cursor-pointer ${completedTasks.learn_moisture ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-gold'}`}
                    >
                      <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                        <span className="font-mono text-[10px] font-bold text-[#05190F]">💧 Moisture Level</span>
                        <input type="checkbox" checked={completedTasks.learn_moisture} onChange={() => {}} className="accent-[#05190F]" />
                      </div>
                      <p className="text-[11px] text-gray-650 font-sans mt-1"><strong>Target: 11.0% – 12.5%</strong>. Melebihi batas ini memicu racun Ochratoxin-A jamur, merusak kargo di atas kapal.</p>
                    </div>

                    <div 
                      onClick={() => toggleTask('learn_defect')} 
                      className={`p-3 border rounded bg-white transition-all cursor-pointer ${completedTasks.learn_defect ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-gold'}`}
                    >
                      <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                        <span className="font-mono text-[10px] font-bold text-[#05190F]">🪨 Defect Counts</span>
                        <input type="checkbox" checked={completedTasks.learn_defect} onChange={() => {}} className="accent-[#05190F]" />
                      </div>
                      <p className="text-[11px] text-gray-650 font-sans mt-1"><strong>Grade-1 (Specialty)</strong>: Mutlak 0 Primary Defect & maksimum 5 Secondary Defects dalam 300g sampel.</p>
                    </div>

                    <div 
                      onClick={() => toggleTask('learn_grading')} 
                      className={`p-3 border rounded bg-white transition-all cursor-pointer ${completedTasks.learn_grading ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-gold'}`}
                    >
                      <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                        <span className="font-mono text-[10px] font-bold text-[#05190F]">🏅 Grading Marks</span>
                        <input type="checkbox" checked={completedTasks.learn_grading} onChange={() => {}} className="accent-[#05190F]" />
                      </div>
                      <p className="text-[11px] text-gray-650 font-sans mt-1">Pemisahan mutu kopi hijau premium berdasarkan standard SNI RI 01-2907-2008 & regulasi G-Grade.</p>
                    </div>

                    <div 
                      onClick={() => toggleTask('learn_screen')} 
                      className={`p-3 border rounded bg-white transition-all cursor-pointer ${completedTasks.learn_screen ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-200 hover:border-gold'}`}
                    >
                      <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                        <span className="font-mono text-[10px] font-bold text-[#05190F]">⚪ Screen Sizes</span>
                        <input type="checkbox" checked={completedTasks.learn_screen} onChange={() => {}} className="accent-[#05190F]" />
                      </div>
                      <p className="text-[11px] text-gray-650 font-sans mt-1"><strong>Screen 17/18 (Large)</strong>. Ukuran biji diayak seragam agar kurva sangrai di mesin pemanggang merata.</p>
                    </div>

                  </div>
                </div>

              </div>

              {/* COL 2: Interactive SCA Score Card Simulator - span 5 */}
              <div className="lg:col-span-5 space-y-6" id="interactive-cupping-card">
                
                <div className="bg-[#05190F] border border-[#C9A227]/30 p-5 rounded-lg text-white shadow-luxury space-y-5">
                  <div className="border-b border-[#C9A227]/20 pb-3">
                    <span className="text-[8.5px] font-mono tracking-widest text-[#C9A227] uppercase font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Interactive Q-Grader Tool
                    </span>
                    <h3 className="font-serif italic font-bold text-lg text-white mt-1">SCA Sensory Cup Score Sheet</h3>
                    <p className="text-[10px] text-gray-400 font-sans mt-0.5">Geser parameter rasa di bawah untuk memprediksi nilai sensori biji kopi Anda.</p>
                  </div>

                  {/* Range Sliders Loop */}
                  <div className="space-y-3.5 text-xs font-mono">
                    
                    {/* Aroma */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Fragrance/Aroma (Dry & Wet)</span>
                        <span className="text-[#C9A227] font-bold">{cupAroma.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupAroma} 
                        onChange={e => setCupAroma(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Flavor */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Flavor (Complex Cita Rasa)</span>
                        <span className="text-[#C9A227] font-bold">{cupFlavor.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupFlavor} 
                        onChange={e => setCupFlavor(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Aftertaste */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Aftertaste (Sisa Rasa)</span>
                        <span className="text-[#C9A227] font-bold">{cupAftertaste.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupAftertaste} 
                        onChange={e => setCupAftertaste(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Acidity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Acidity Brightness (Keasaman)</span>
                        <span className="text-[#C9A227] font-bold">{cupAcidity.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupAcidity} 
                        onChange={e => setCupAcidity(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Body */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Body / Mouthfeel (Ketebalan)</span>
                        <span className="text-[#C9A227] font-bold">{cupBody.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupBody} 
                        onChange={e => setCupBody(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Balance */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Balance Harmony (Keseimbangan)</span>
                        <span className="text-[#C9A227] font-bold">{cupBalance.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupBalance} 
                        onChange={e => setCupBalance(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Overall */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-300 text-[10px]">
                        <span>• Overall (Kesan Penyunting)</span>
                        <span className="text-[#C9A227] font-bold">{cupOverall.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="6.0" max="10.0" step="0.25" value={cupOverall} 
                        onChange={e => setCupOverall(parseFloat(e.target.value))}
                        className="w-full accent-[#C9A227] cursor-ew-resize h-1 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                  </div>

                  {/* 5 Cup grids checkmarks */}
                  <div className="space-y-3 pt-2 text-[10px] font-mono leading-none border-t border-white/10">
                    
                    {/* Uniformity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-300">
                        <span>Uniformity (Keseragaman 5 Gelas):</span>
                        <span className="text-[#C9A227] font-bold">{calcUniformity}.00 / 10</span>
                      </div>
                      <div className="flex gap-1">
                        {cupUniformity.map((checked, idx) => (
                          <button 
                            key={idx} type="button"
                            onClick={() => {
                              const next = [...cupUniformity];
                              next[idx] = !next[idx];
                              setCupUniformity(next);
                            }}
                            className={`flex-1 py-1.5 border rounded-sm font-bold transition-all text-center ${checked ? 'bg-[#C9A227] text-[#05190F] border-[#C9A227]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'}`}
                          >
                            Cup {idx+1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clean Cup */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-gray-300">
                        <span>Clean Cup (Kesucian Rasa 5 Gelas):</span>
                        <span className="text-[#C9A227] font-bold">{calcCleanCup}.00 / 10</span>
                      </div>
                      <div className="flex gap-1">
                        {cupCleanCup.map((checked, idx) => (
                          <button 
                            key={idx} type="button"
                            onClick={() => {
                              const next = [...cupCleanCup];
                              next[idx] = !next[idx];
                              setCupCleanCup(next);
                            }}
                            className={`flex-1 py-1.5 border rounded-sm font-bold transition-all text-center ${checked ? 'bg-[#C9A227] text-[#05190F] border-[#C9A227]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'}`}
                          >
                            Cup {idx+1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sweetness */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-gray-300">
                        <span>Sweetness (Kemanisan Karamel):</span>
                        <span className="text-[#C9A227] font-bold">{calcSweetness}.00 / 10</span>
                      </div>
                      <div className="flex gap-1">
                        {cupSweetness.map((checked, idx) => (
                          <button 
                            key={idx} type="button"
                            onClick={() => {
                              const next = [...cupSweetness];
                              next[idx] = !next[idx];
                              setCupSweetness(next);
                            }}
                            className={`flex-1 py-1.5 border rounded-sm font-bold transition-all text-center ${checked ? 'bg-[#C9A227] text-[#05190F] border-[#C9A227]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'}`}
                          >
                            Cup {idx+1}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Defects Multipliers and deductions */}
                  <div className="bg-black/30 p-3.5 rounded border border-white/5 space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between items-center text-gray-350">
                      <span className="font-bold uppercase text-red-400">⚠️ Catatan Defect / Cacat Cita Rasa:</span>
                      {defectDeduction > 0 && (
                        <span className="p-0.5 px-2 bg-red-950 text-red-200 border border-red-800 rounded font-bold animate-pulse">
                          -{defectDeduction.toFixed(2)} Points
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 leading-none">
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-gray-400 block uppercase">Jumlah Cup Terjangkit (0-5):</label>
                        <input 
                          type="number" min="0" max="5" value={defectCups} 
                          onChange={e => setDefectCups(Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full bg-[#05190F] border border-white/10 p-1.5 font-bold rounded-sm text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8.5px] text-gray-400 block uppercase">Jenis Cacat Cita Rasa:</label>
                        <select
                          value={defectType}
                          onChange={e => setDefectType(parseInt(e.target.value) as any)}
                          className="w-full bg-[#05190F] border border-white/10 p-1 font-bold rounded-sm text-white text-[10px]"
                        >
                          <option value="2">2 - Taint (Rasa Mengusik Kecil)</option>
                          <option value="4">4 - Fault (Rasa Busuk/Ubi Rusak Toksik)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Ultimate Calculated Result Box */}
                  <div className="p-4 bg-[#FAF8F5] border-2 border-[#C9A227] text-gray-950 rounded shadow-luxury text-center space-y-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#05190F]/70 font-black block">Estimated Final Cupping Score</span>
                    
                    <div className="text-4xl font-serif italic text-[#05190F] font-black">
                      {finalScaScore.toFixed(2)} <span className="text-xs font-mono text-gray-500 not-italic">/ 100</span>
                    </div>

                    <div className="inline-block px-3 py-1 bg-[#05190F] text-[#C9A227] rounded-full text-[9px] font-mono uppercase tracking-widest font-black leading-none">
                      {finalScaScore >= 90.0 && "Outstanding Specialty (Rare Class)"}
                      {finalScaScore >= 85.0 && finalScaScore < 90.0 && "Excellent Specialty Grade"}
                      {finalScaScore >= 80.0 && finalScaScore < 85.0 && "Very Good Specialty Standard"}
                      {finalScaScore < 80.0 && "Premium Commercial Grade (Below Specialty)"}
                    </div>

                    <p className="text-[10px] font-sans text-gray-650 leading-relaxed pt-2 border-t border-gray-100 italic">
                      {finalScaScore >= 80.0 
                        ? `\"Kopi ini layak diekspor dengan premi harga tinggi (Specialty Class). Pastikan dikemas menggunakan kombinasi vakum pouch dan luar karung goni plus GrainPro liner untuk pertahanan optimal.\"`
                        : `\"Kopi ini masuk kelompok kelas komersial umum. Penawaran harga ekspor harus disesuaikan ke pasar bulk container reguler untuk blending industri roastery kopi instan.\"`}
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* B2B GLOBAL FAQ & NEGOTIATION ACADEMY */}
        {activeSubTab === 'faq' && (
          <div className="space-y-6 animate-fade-in text-left font-sans" id="b2b-export-faq-view">
            {/* Header Block */}
            <div className="p-6 bg-[#05190F] text-white border-b-4 border-[#C9A227] rounded-lg shadow-luxury space-y-3">
              <div className="flex items-center gap-2">
                <Languages className="w-6 h-6 text-[#C9A227]" />
                <span className="font-mono text-[10px] tracking-widest text-[#C9A227] uppercase font-bold">B2B Global Trade & Objection Handling</span>
              </div>
              <h2 className="text-2xl font-serif italic font-black">B2B Multilingual FAQ & Objection Academy</h2>
              <p className="text-xs text-gray-300 max-w-4xl leading-relaxed">
                Sukses negosiasi ekspor berskala kontainer sangat bergantung pada respon sains dan data legalitas presisi. Kuasai modul interaktif ini yang dirancang dalam lima bahasa asing utama untuk mematahkan keraguan buyer terbesar Anda.
              </p>
            </div>

            {/* Language Selector row */}
            <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm space-y-3">
              <label className="block text-[10px] font-mono tracking-wider text-gray-500 uppercase font-black">
                Pilih Bahasa Negosiasi / Negotiation Language Select:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'id', name: 'Indonesia', flag: '🇮🇩' },
                  { id: 'en', name: 'English', flag: '🇬🇧' },
                  { id: 'zh', name: 'Mandarin/华语', flag: '🇨🇳' },
                  { id: 'ja', name: 'Japanese/日本語', flag: '🇯🇵' },
                  { id: 'de', name: 'German/Deutsch', flag: '🇩🇪' }
                ].map((lang) => {
                  const isActive = faqLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setFaqLanguage(lang.id as any);
                        setFaqExpandedIndex(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded border transition-all ${
                        isActive 
                          ? 'bg-[#05190F] text-[#C9A227] border-[#C9A227] shadow-sm' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Cari FAQ kata kunci..."
                  value={faqSearch}
                  onChange={(e) => {
                    setFaqSearch(e.target.value);
                    setFaqExpandedIndex(null);
                  }}
                  className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-md bg-white text-xs text-gray-900 focus:outline-[#05190F]"
                />
              </div>

              {/* Categories selectors */}
              <div className="md:col-span-8 flex flex-wrap gap-1.5 justify-start md:justify-end">
                {[
                  { id: 'buyer_objections', label: 'Keberatan Buyer', icon: ShieldAlert },
                  { id: 'product_knowledge', label: 'Spesifikasi Produk', icon: Coffee },
                  { id: 'roasting', label: 'Materi Roasting', icon: Flame },
                  { id: 'payments', label: 'Ekspor & Logistik', icon: Ship }
                ].map((cat) => {
                  const isActive = faqCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFaqCategory(cat.id as any);
                        setFaqExpandedIndex(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider rounded border transition-all ${
                        isActive 
                          ? 'bg-[#C9A227] text-[#05190F] border-[#C9A227] font-bold' 
                          : 'bg-[#FAF8F5] text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accordion FAQ Body */}
            <div className="bg-white border-2 border-[#05190F]/10 rounded-lg shadow-luxury overflow-hidden divide-y divide-gray-100">
              {(() => {
                const filteredItems = B2B_FAQ_ITEMS.filter(item => {
                  if (item.category !== faqCategory) return false;
                  if (faqSearch.trim()) {
                    const query = faqSearch.toLowerCase();
                    const trans = item.translations[faqLanguage];
                    return trans.question.toLowerCase().includes(query) || trans.answer.toLowerCase().includes(query);
                  }
                  return true;
                });

                if (filteredItems.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-400 space-y-2">
                      <HelpCircle className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="text-xs font-mono">FAQ dengan kata kunci "{faqSearch}" tidak ditemukan.</p>
                      {faqSearch.trim() && (
                        <button
                          onClick={() => setFaqSearch('')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 text-[10px] uppercase font-mono rounded hover:bg-gray-200"
                        >
                          Reset Pencarian
                        </button>
                      )}
                    </div>
                  );
                }

                return filteredItems.map((item, idx) => {
                  const isExpanded = faqExpandedIndex === idx;
                  const content = item.translations[faqLanguage];
                  const isCopied = faqCopiedId === item.id;

                  const handleCopy = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const textToCopy = `Q: ${content.question}\nA: ${content.answer}`;
                    navigator.clipboard.writeText(textToCopy)
                      .then(() => {
                        setFaqCopiedId(item.id);
                        setTimeout(() => setFaqCopiedId(null), 2000);
                      })
                      .catch((err) => {
                        console.error('Failed to copy text: ', err);
                      });
                  };

                  return (
                    <div key={item.id} className="transition-all hover:bg-[#FAF8F5]/30">
                      {/* Accordion Title Header */}
                      <div
                        onClick={() => setFaqExpandedIndex(isExpanded ? null : idx)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 font-mono text-[9px] rounded uppercase font-bold">
                            {item.id}
                          </span>
                          <h3 className="text-xs md:text-sm font-bold text-gray-900 leading-snug">
                            {content.question}
                          </h3>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={handleCopy}
                            className={`p-1.5 rounded border transition-all ${
                              isCopied 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-305' 
                                : 'bg-white text-gray-400 border-gray-200 hover:text-gray-700'
                            }`}
                            title="Salin Tanya-Jawab ke Clipboard"
                          >
                            {isCopied ? <span className="text-[10px] font-mono font-bold text-emerald-700 px-1">✓ Copied</span> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Accordion Answer Content */}
                      {isExpanded && (
                        <div className="p-5 bg-stone-50 border-t border-gray-100 space-y-4 text-left animate-fade-in">
                          <div className="pl-4 border-l-4 border-[#C9A227] py-1 text-xs text-gray-800 font-sans leading-relaxed whitespace-pre-line">
                            {content.answer}
                          </div>

                          {/* B2B Negotiation Insight */}
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 font-sans leading-relaxed space-y-1">
                            <strong className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-amber-800">
                              💡 NEGOTIATOR'S STRATEGIC INSIGHT:
                            </strong>
                            <p>{item.negotiationInsight}</p>
                          </div>

                          {/* Multi-language alignment panel */}
                          <div className="flex flex-wrap gap-2 text-[9px] font-mono text-gray-500 pt-1">
                            <span>Tersedia salinan resmi dalam:</span>
                            {['id', 'en', 'zh', 'ja', 'de'].map((lngID) => (
                              <span 
                                key={lngID}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFaqLanguage(lngID as any);
                                }}
                                className={`px-1.5 py-0.5 border rounded cursor-pointer uppercase ${
                                  faqLanguage === lngID ? 'bg-[#05190F] text-[#C9A227] font-bold border-[#C9A227]' : 'bg-white'
                                }`}
                              >
                                {lngID}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* EXPANDED EXPORT DOCUMENTS MATRIX AS SHOWN IN SELLER CATALOG SPREADS */}
            <div className="bg-white border-2 border-[#05190F]/10 rounded-lg p-6 shadow-luxury space-y-4">
              <div className="border-b border-[#05190F]/10 pb-3">
                <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Export Document & Market Certification Mandate
                </h3>
                <h2 className="text-xl font-serif italic text-[#05190F] font-black">
                  Sertifikasi Negara Tujuan Ekspor & Dokumen Kepabeanan
                </h2>
                <p className="text-xs text-gray-500 font-sans mt-1">
                  Seluruh berkas administrasi karantina, sanitasi, pangan, dan ekspor negara tujuan wajib disiapkan dengan koordinasi dinas pertanian, Balai Karantina Pertanian, serta Bea Cukai setempat.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* AMERIKA SERIKAT */}
                <div className="bg-[#FAF8F5] border border-gray-200 p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇺🇸</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-tight">Amerika Serikat (USA)</h4>
                      <p className="text-[10px] text-gray-500 font-mono">Destination Standard (FDA)</p>
                    </div>
                  </div>
                  <ul className="text-[10.5px] text-gray-600 space-y-1.5 list-disc pl-4 font-sans">
                    <li><strong>FDA Registration</strong>: Pabrik eksportir dan importir wajib terdaftar di Sistem FDA AS.</li>
                    <li><strong>Prior Notice (PN)</strong>: Notifikasi berkas ekspor wajib dikirim ke FDA secara online sebelum kargo tiba.</li>
                    <li><strong>Bioterrorism Act Compliance</strong>: Jaminan pelacakan bahan baku dan keamanan kontainer dari kontaminasi teroris.</li>
                    <li><strong>Phytosanitary Certificate</strong>: Bebas hama & kutu serangga (Karantina Pertanian Indonesia).</li>
                  </ul>
                </div>

                {/* UNI EROPA */}
                <div className="bg-[#FAF8F5] border border-gray-200 p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇪🇺</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-tight">Uni Eropa (Europe)</h4>
                      <p className="text-[10px] text-gray-500 font-mono">EU customs & green norms</p>
                    </div>
                  </div>
                  <ul className="text-[10.5px] text-gray-600 space-y-1.5 list-disc pl-4 font-sans">
                    <li><strong>Certificate of Origin (Form A / EU-CoO)</strong>: Memberikan keringanan tarif bea masuk khusus GSP.</li>
                    <li><strong>Ochratoxin A (OTA) Test</strong>: Uji ambang batas toksin jamur di laboratorium berstandar ISO 17025.</li>
                    <li><strong>Pesticide Residue Limits (MRL)</strong>: Pengujian residu kontaminasi herbisida kimia (harus di bawah ambang batas Uni Eropa).</li>
                    <li><strong>EUDR (Forest Deforestation Act)</strong>: Deklarasi geolokasi kebun bebas deforestasi (wajib mulai akhir 2024).</li>
                  </ul>
                </div>

                {/* CHINA */}
                <div className="bg-[#FAF8F5] border border-gray-200 p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇨🇳</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-tight">China (Tiongkok)</h4>
                      <p className="text-[10px] text-gray-500 font-mono">GACC System Clearance</p>
                    </div>
                  </div>
                  <ul className="text-[10.5px] text-gray-600 space-y-1.5 list-disc pl-4 font-sans">
                    <li><strong>GACC Registration Number (Decree 248)</strong>: Eksportir kopi wajib mendaftarkan fasilitas gudang pengolahan mereka di platform GACC.</li>
                    <li><strong>Certificate of Analysis (CoA)</strong>: Melampirkan uji laboratorium fisik, cemaran logam berat timbal, arsenik, dan residu pestisida.</li>
                    <li><strong>Sanitary / Phytosanitary Certificate</strong>: Dokumen biosekuriti karantina negara ekspor dengan cap resmi basah.</li>
                  </ul>
                </div>

                {/* TAIWAN */}
                <div className="bg-[#FAF8F5] border border-gray-200 p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇹🇼</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-tight">Taiwan</h4>
                      <p className="text-[10px] text-gray-500 font-mono">TFDA & Quarantine Entry</p>
                    </div>
                  </div>
                  <ul className="text-[10.5px] text-gray-600 space-y-1.5 list-disc pl-4 font-sans">
                    <li><strong>Phytosanitary Certificate</strong>: Mutlak diperlukan untuk menghindari karantina atau fumigasi ulang di pelabuhan Kaohsiung.</li>
                    <li><strong>Certificate of Origin (Form K)</strong>: Menyertakan SKA resmi untuk menetapkan asal usul teritorial kopi Indonesia.</li>
                    <li><strong>TFDA Residue Screening</strong>: Pengujian ketat residu pestisida berstandar Taiwan (380+ senyawa kimia aktif).</li>
                  </ul>
                </div>

                {/* JEPANG */}
                <div className="bg-[#FAF8F5] border border-gray-200 p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇯🇵</span>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-tight">Jepang (Japan)</h4>
                      <p className="text-[10px] text-gray-500 font-mono">MHLW Inspection</p>
                    </div>
                  </div>
                  <ul className="text-[10.5px] text-gray-600 space-y-1.5 list-disc pl-4 font-sans">
                    <li><strong>Food Sanitation Law Notice</strong>: Deklarasi ke Kementerian Kesehatan, Tenaga Kerja, dan Kesejahteraan sebelum bongkar.</li>
                    <li><strong>Pesticide Residue Positive List</strong>: Kebijakan daftar positif residu, melarang residu herbisida melebihi 0.01 ppm.</li>
                    <li><strong>Certificate of Analysis (CoA) & CoO</strong>: Dokumen fisik pembuktian asal usul serta hasil lab kadar air kopi di bawah 12%.</li>
                  </ul>
                </div>

                {/* MANDATORI UTAMA */}
                <div className="bg-[#05190F] text-[#C9A227] border-2 border-[#C9A227] p-4 rounded space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#C9A227]" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-tight">Mandatori Kertas Ekspor Utama</h4>
                      <p className="text-[10px] text-gray-300 font-mono">Standard Export Assets</p>
                    </div>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-gray-200 font-sans">
                    Apapun negara tujuannya, pastikan Anda telah memiliki entitas berbadan hukum eksportir resmi (PT atau CV), **Nomor Induk Berusaha (NIB)**, akun kepabeanan bea cukai, dokumen **Bill of Lading (B/L)** dari pelayaran, **Commercial Invoice**, dan **Packing List** yang konsisten secara angka berat bersih dan kotor karung kopi.
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* 8. ANTI-SCAM PROTECTION STRATEGIES */}
        {activeSubTab === 'scams' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-[#E53E3E] font-bold uppercase flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4" /> Security Protocol Level-5
              </h3>
              <h2 className="text-xl font-serif italic text-red-900">Perisai Anti-Penipuan & Proteksi Transaksi (Anti Buyer Scam Guide)</h2>
              <p className="text-xs text-red-700 leading-relaxed font-sans max-w-4xl">
                Dunia ekspor komoditas dihuni oleh pembeli bayangan dan sindikat penipu terorganisir yang menargetkan eksportir pemula. Selalu terapkan taktik proteksi internal penandatanganan kontrak ekspor ini secara militan.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono text-xs">
                
                <div className="bg-white border border-red-100 p-4 rounded-md space-y-3 shadow-xs">
                  <h4 className="font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                    🚨 1. Skema Scam "Sample Harvest"
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-sans text-[11px]">
                    <strong>Skenario:</strong> Komplotan penipu meniru profil perusahaan roastery mewah fiktif, memesan sampel seberat 1 - 2 Kg berulang kali secara cuma-cuma dengan alasan "uji laboratorium cupping berlapis".
                  </p>
                  <p className="text-red-700 font-sans font-semibold text-[11px]">
                    <strong>Solusi Mutlak:</strong> Selalu batasi berat sampel cuma-cuma maksimum 200 - 350 gram saja. Wajibkan pembeli menyuplai kode akun kurir DHL/FedEx mereka sendiri untuk menarik sampel eksportir Anda.
                  </p>
                </div>

                <div className="bg-white border border-red-100 p-4 rounded-md space-y-3 shadow-xs">
                  <h4 className="font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                    🚨 2. Sindikat LC Palsu (Letter of Credit Fraud)
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-sans text-[11px]">
                    <strong>Skenario:</strong> Penipu menolak jalur pembayaran DP (Down Payment) kawat bank Telegraphic Transfer (TT) dan bersikeras memakai Letter of Credit (L/C) namun yang diterbitkan oleh Bank asing non-tradable kelas tiga di negara berisiko tinggi.
                  </p>
                  <p className="text-red-700 font-sans font-semibold text-[11px]">
                    <strong>Solusi Mutlak:</strong> Cek nama bank pembuka LC. Hanya terima LC yang dikonfirmasi (<span className="underline">Confirmed Letter of Credit</span>) oleh Bank Koresponden Devisa teratas di Indonesia (seperti Mandiri, BNI, BRI, BCA).
                  </p>
                </div>

                <div className="bg-white border border-red-100 p-4 rounded-md space-y-3 shadow-xs">
                  <h4 className="font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                    🚨 3. Agen Logistik Rekayasa (Fake Freight Forwarder)
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-sans text-[11px]">
                    <strong>Skenario:</strong> Pada klausul FOB, pembeli meminta untuk memakai agen forwarding logistik tidak terafiliasi tunjukan mereka yang ternyata bersengkongkol. Begitu kargo ditarik, agen merilis kargo tanpa surat Bill of Lading asli kepada buyer walau pembayaran belum lunas.
                  </p>
                  <p className="text-red-700 font-sans font-semibold text-[11px]">
                    <strong>Solusi Mutlak:</strong> Saring agen forwarding rujukan pembeli dan sahkan di Indonesia. Alternatif teraman, tawarkan Klausul CIF di mana Anda yang memegang kendali atas penunjukan kapal pengangkut legal terdaftar resmi.
                  </p>
                </div>

                <div className="bg-white border border-red-100 p-4 rounded-md space-y-3 shadow-xs">
                  <h4 className="font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
                    🚨 4. Modus "Overpayment Refund Scam"
                  </h4>
                  <p className="text-gray-600 leading-relaxed font-sans text-[11px]">
                    <strong>Skenario:</strong> Pembeli mengirim konfirmasi transfer palsu dengan jumlah nominal deposit yang berlebih secara ekstrem dan merekayasa tekanan emosional mendesak agar Anda mengembalikan selisih kelebihan tersebut melalui Western Union/kripto dalam hitungan jam.
                  </p>
                  <p className="text-red-700 font-sans font-semibold text-[11px]">
                    <strong>Solusi Mutlak:</strong> Jangan pernah mengirim unit uang sepeser pun sebelum dana transfer dana TT luar negeri tersebut lolos kliring aman dan tercatat nyata di saldo operasional giro rekening bank valas resmi Anda.
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 9. INTERACTIVE TASK ROADMAP */}
        {activeSubTab === 'tracker' && (
          <div className="space-y-6 animate-fade-in text-xs font-mono">
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-[#C9A227]" /> Interactive Pipeline Sourcing Roadmap
              </h3>
              <h2 className="text-lg font-serif italic text-[#05190F]">Roadmap Integrasi Eksportir & Evaluasi Kinerja (Task Detail Tracking)</h2>
              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                Petakan langkah operasional harian Anda secara berurutan mengikuti siklus deal sirkulasi ekspor kopi di bawah ini. Centang tugas yang selesai untuk menguji kesiapan operasional ekspor Anda:
              </p>

              <div className="space-y-4 pt-4">

                {/* TASK 1 */}
                <div 
                  onClick={() => toggleTask('follow_up')}
                  className={`p-4 border rounded-sm transition-all cursor-pointer flex items-center justify-between ${
                    completedTasks.follow_up ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F7F4EC]/40 border-gray-100 hover:border-gold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 px-2.5 font-bold rounded-sm border ${completedTasks.follow_up ? 'bg-emerald-800 text-white' : 'bg-white text-gray-700'}`}>01</div>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#05190f]">Follow-Up Buyer</h4>
                      <p className="text-[10px] text-gray-500 font-sans">Kirim update penawaran harga kopi, profil kelayakan koperasi, dan foto hijau terkini.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800">Selesai</span>
                    <input type="checkbox" checked={completedTasks.follow_up} onChange={() => {}} className="accent-[#05190F]" />
                  </div>
                </div>

                {/* TASK 2 */}
                <div 
                  onClick={() => toggleTask('send_sample')}
                  className={`p-4 border rounded-sm transition-all cursor-pointer flex items-center justify-between ${
                    completedTasks.send_sample ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F7F4EC]/40 border-gray-100 hover:border-gold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 px-2.5 font-bold rounded-sm border ${completedTasks.send_sample ? 'bg-emerald-800 text-white' : 'bg-white text-gray-700'}`}>02</div>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#05190f]">Kirim Sample Pertama</h4>
                      <p className="text-[10px] text-gray-500 font-sans">Kemas sampel 300 gram dalam kantong hampa udara kedap (vacuum seal) untuk mempertahankan aroma asli buah vulkanis.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800">Selesai</span>
                    <input type="checkbox" checked={completedTasks.send_sample} onChange={() => {}} className="accent-[#05190F]" />
                  </div>
                </div>

                {/* TASK 3 */}
                <div 
                  onClick={() => toggleTask('track_sample')}
                  className={`p-4 border rounded-sm transition-all cursor-pointer flex items-center justify-between ${
                    completedTasks.track_sample ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F7F4EC]/40 border-gray-100 hover:border-gold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 px-2.5 font-bold rounded-sm border ${completedTasks.track_sample ? 'bg-emerald-800 text-white' : 'bg-white text-gray-700'}`}>03</div>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#05190f]">Track Semua Sample</h4>
                      <p className="text-[10px] text-gray-500 font-sans">Pantau proses transit maskapai pengiriman kurir udara secara berkala untuk meyakinkan estimasi pendaratan sampel.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800">Selesai</span>
                    <input type="checkbox" checked={completedTasks.track_sample} onChange={() => {}} className="accent-[#05190F]" />
                  </div>
                </div>

                {/* TASK 4 */}
                <div 
                  onClick={() => toggleTask('request_feedback')}
                  className={`p-4 border rounded-sm transition-all cursor-pointer flex items-center justify-between ${
                    completedTasks.request_feedback ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F7F4EC]/40 border-gray-100 hover:border-gold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 px-2.5 font-bold rounded-sm border ${completedTasks.request_feedback ? 'bg-emerald-800 text-white' : 'bg-white text-gray-700'}`}>04</div>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#05190f]">Minta Feedback Cupping</h4>
                      <p className="text-[10px] text-gray-500 font-sans">Dapatkan catatan skor keasaman (acidity), sensasi manis (sweetness), ketebalan (body), hingga sisa rasa (aftertaste) hasil tim roasting pembeli.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800">Selesai</span>
                    <input type="checkbox" checked={completedTasks.request_feedback} onChange={() => {}} className="accent-[#05190F]" />
                  </div>
                </div>

                {/* TASK 5 */}
                <div 
                  onClick={() => toggleTask('negotiate_small')}
                  className={`p-4 border rounded-sm transition-all cursor-pointer flex items-center justify-between ${
                    completedTasks.negotiate_small ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F7F4EC]/40 border-gray-100 hover:border-gold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 px-2.5 font-bold rounded-sm border ${completedTasks.negotiate_small ? 'bg-emerald-800 text-white' : 'bg-white text-gray-700'}`}>05</div>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#05190f]">Mulai Negosiasi Small/Trial Order</h4>
                      <p className="text-[10px] text-gray-500 font-sans">Tawarkan LCL shipment berkapasitas 10 - 25 goni kopi berkualitas tinggi untuk menguji kelayakan awal rantai suplay kargo.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800">Selesai</span>
                    <input type="checkbox" checked={completedTasks.negotiate_small} onChange={() => {}} className="accent-[#05190F]" />
                  </div>
                </div>

                {/* TASK 6 (Evaluasi total) */}
                <div 
                  onClick={() => toggleTask('total_eval')}
                  className={`p-4 border rounded-sm transition-all cursor-pointer ${
                    completedTasks.total_eval ? 'bg-emerald-50/50 border-emerald-300' : 'bg-[#F7F4EC]/40 border-gray-100 hover:border-gold'
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 px-2.5 font-bold rounded-sm border ${completedTasks.total_eval ? 'bg-emerald-800 text-white' : 'bg-white text-gray-700'}`}>06</div>
                      <h4 className="font-serif font-bold text-xs text-[#05190f]">Evaluasi Total Sourcing Match</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-800">Selesai</span>
                      <input type="checkbox" checked={completedTasks.total_eval} onChange={() => {}} className="accent-[#05190F]" />
                    </div>
                  </div>
                  <div className="pl-10 grid grid-cols-1 sm:grid-cols-4 gap-3 text-[10px] text-[#05190F]/70 pt-1 font-mono uppercase tracking-wider">
                    <div className="p-2.5 bg-white border border-[#05190F]/10 rounded-sm">
                      <span className="text-[8px] text-gray-400 block font-bold leading-none mb-1">Evaluasi 1:</span>
                      <strong>Buyer Potensial</strong>
                    </div>
                    <div className="p-2.5 bg-white border border-[#05190F]/10 rounded-sm">
                      <span className="text-[8px] text-gray-400 block font-bold leading-none mb-1">Evaluasi 2:</span>
                      <strong>Sample Response</strong>
                    </div>
                    <div className="p-2.5 bg-white border border-[#05190F]/10 rounded-sm">
                      <span className="text-[8px] text-gray-400 block font-bold leading-none mb-1">Evaluasi 3:</span>
                      <strong>Market Paling Responsif</strong>
                    </div>
                    <div className="p-2.5 bg-white border border-[#05190F]/10 rounded-sm">
                      <span className="text-[8px] text-gray-400 block font-bold leading-none mb-1">Evaluasi 4:</span>
                      <strong>Kopi Paling Disukai</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 10. B2B SAMPLE FLOW LIFECYCLE & VETTING ANALYZER */}
        {activeSubTab === 'sample_flow' && (
          <div className="space-y-6 animate-fade-in" id="sample-flow-view">
            
            {/* Header Block */}
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-[#C9A227]" /> B2B Sample Sourcing Lifecycle
                  </h3>
                  <h2 className="text-2xl font-serif italic text-[#05190F]">Analisis Alur Kontrol & Vetting Fisik Sampel Ekspor</h2>
                </div>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 p-1 px-3 border border-emerald-200 uppercase rounded-sm font-bold">
                  Anti-Scam & Lead Quality Sieve
                </div>
              </div>
              <p className="text-xs text-gray-600 font-sans leading-relaxed">
                Di perdagangan internasional, sampel adalah pintu gerbang menuju kontrak tahunan ratusan ribu dolar. Namun, pengiriman sampel tanpa filter kualifikasi (<span className="italic">vetting</span>) hanya akan menghabiskan uang, waktu giling, dan biaya kurir udara kilat eksportir Anda. Pelajari alur standard penanganan sampel komersial, disandingkan dengan **Kalkulator Penyaring Impostor** untuk mengidentifikasi buyer asli dengan pemburu sampel gratis (<span className="italic">freebie hunters</span>).
              </p>
            </div>

            {/* Main Grid: interactive flowchart & vetting engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Interactive Flowchart of B2B Samples (span 7) */}
              <div className="lg:col-span-7 bg-white p-6 border border-[#05190F]/10 rounded-lg shadow-sm space-y-6">
                <div>
                  <h4 className="font-serif font-bold text-[#05190F] text-base">Alur Standard Operasional Komersial (SOP Sample Flow)</h4>
                  <p className="text-[11px] text-gray-500 font-sans">Berikut adalah 5 tahap mutlak dalam menutup deal pembeli specialty Green Coffee secara sistematis:</p>
                </div>

                <div className="space-y-4 relative pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#05190F]/10">
                  
                  {/* STEP 1 */}
                  <div className="space-y-1 relative">
                    <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#05190F] text-gold font-mono text-[10px] flex items-center justify-center font-bold">
                      01
                    </span>
                    <h5 className="font-serif font-bold text-xs text-[#05190F]">Qualifying Interest & Domain Vetting (Kualifikasi Admin)</h5>
                    <p className="text-xs text-gray-650 font-sans leading-relaxed">
                      Lakukan analisis profil buyer yang menghubungi Anda. Cek kesesuaian domain website roastery mereka, pastikan nama importir terdaftar dalam database importir kopi internasional (Pencegahan penipu). Diskusikan preferensi varietas dan tingkat kualitas skor SCA yang mereka cari.
                    </p>
                    <div className="p-2 bg-yellow-50/50 border border-yellow-200/50 rounded-sm font-mono text-[9px] text-[#05190F] inline-block mt-1">
                      💡 <strong>Golden Rule:</strong> Jangan pernah mengirim sampel ke akun email generik spt @gmail.com atau @yahoo.com tanpa analisis lanjutan.
                    </div>
                  </div>

                  {/* STEP 2 */}
                  <div className="space-y-1 relative">
                    <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#05190F] text-gold font-mono text-[10px] flex items-center justify-center font-bold">
                      02
                    </span>
                    <h5 className="font-serif font-bold text-xs text-[#05190F]">Preparation & Dry Mill Hand-Picking (Pemilahan di Pabrik Giling)</h5>
                    <p className="text-xs text-gray-650 font-sans leading-relaxed">
                      Ambil 500 gram green bean dari micro-lot yang sesuai. Kalibrasi kadar air secara ketat di kisaran 11.5% - 12.0%. Lakukan <span className="underline">hand-picking</span> lanjutan untuk membuang partikel defect luar sehingga sampel bersih dari cacat fisik primer. Kemas biji kopi menggunakan plastik kedap udara (GrainPro atau vacuum pouch) untuk menahan kelembapan stabil di udara kargo pesawat.
                    </p>
                  </div>

                  {/* STEP 3 */}
                  <div className="space-y-1 relative">
                    <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#05190F] text-gold font-mono text-[10px] flex items-center justify-center font-bold">
                      03
                    </span>
                    <h5 className="font-serif font-bold text-xs text-[#05190F]">Documenting & Airway Waybill Draft (Administrasi Custom)</h5>
                    <p className="text-xs text-gray-650 font-sans leading-relaxed">
                      Terbitkan Proforma Invoice Sampel dan Packing List yang sah. Cantumkan keterangan internasional wajib: <i>"No Commercial Value — Sample for Sensory Analysis Only"</i> dengan nilai pabean rendah (misal USD 10) agar pembeli tidak terbebani pajak bea masuk tinggi di negara tujuan. Lampirkan sertifikat fitosanitari dari balai karantina tanaman komoditas pertanian setempat.
                    </p>
                  </div>

                  {/* STEP 4 */}
                  <div className="space-y-1 relative">
                    <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#05190F] text-gold font-mono text-[10px] flex items-center justify-center font-bold">
                      04
                    </span>
                    <h5 className="font-serif font-bold text-xs text-[#05190F]">Global Express Air Freight (Pengiriman Logistik Kilat)</h5>
                    <p className="text-xs text-gray-650 font-sans leading-relaxed">
                      Kirim paket fisik menggunakan logistik express terpercaya (DHL Express atau FedEx Priority). Tempelkan saku dokumen berisi Proforma Invoice, Certificate of Origin (COO), dan Fitosanitari di bagian luar kotak. Ambil foto kemasan paket dan AWB kertas pengiriman lalu kirimkan nomor pelacakan secara proaktif ke procurement buyer.
                    </p>
                  </div>

                  {/* STEP 5 */}
                  <div className="space-y-1 relative">
                    <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-[#05190F] text-gold font-mono text-[10px] flex items-center justify-center font-bold">
                      05
                    </span>
                    <h5 className="font-serif font-bold text-xs text-[#05190F]">Cupping Feedback Loop & Price Closing (Pecah Telur Kontrak)</h5>
                    <p className="text-xs text-gray-650 font-sans leading-relaxed">
                      Pantau pergerakan paket. Setelah kargo sampel mendarat di roastery pembeli, berikan waktu 5 - 7 hari kerja untuk tim QC mereka menyangrai sampel di mesin roasting kecil (<span className="italic">sample roaster</span>). Kirim formulir umpan balik sensori (gunakan lembar standard SCA Cupping Card kita). Kunci preferensi kecocokan profil rasa biji tersebut untuk menyepakati kontrak kontainer tahunan berjangka!
                    </p>
                  </div>

                </div>
              </div>

              {/* Right Column: Vetting & Anti-Scam Sieve (span 5) */}
              <div className="lg:col-span-5 bg-[#05190F] border border-gold/25 p-6 rounded-lg text-white space-y-6">
                <div className="border-b border-gold/15 pb-3">
                  <h4 className="font-serif italic font-bold text-lg text-white flex items-center gap-1.5 uppercase text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#C9A227]" /> Lead Sieve & Anti-Scam Filter
                  </h4>
                  <p className="text-[10px] text-gray-300 font-sans mt-0.5">Identifikasi keaslian dan keseriusan prospek buyer Anda secara otomatis lewat bobot kuesioner penyaring pabean ini.</p>
                </div>

                {/* Score Dashboard widget */}
                <div className="p-4 bg-black/40 border border-white/5 text-center rounded space-y-1">
                  <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#C9A227] font-bold block">Leads Vetting Confidence Score</span>
                  <div className="text-5xl font-serif font-black text-white italic">
                    {( (qualDomain ? 30 : 0) + (qualCourier ? 30 : 0) + (qualDemand ? 25 : 0) + (qualMaps ? 15 : 0) )} <span className="text-xs font-mono text-gray-400 not-italic">/ 100</span>
                  </div>

                  <div className="inline-block px-3 py-1 mt-1 text-[9px] font-mono font-bold uppercase rounded-full leading-none">
                    { (( (qualDomain ? 30 : 0) + (qualCourier ? 30 : 0) + (qualDemand ? 25 : 0) + (qualMaps ? 15 : 0) )) >= 80 ? (
                      <span className="text-emerald-400 bg-emerald-950/60 p-1 rounded">✓ VIP Importer (Kirim Sampel Gratis!)</span>
                    ) : (( (qualDomain ? 30 : 0) + (qualCourier ? 30 : 0) + (qualDemand ? 25 : 0) + (qualMaps ? 15 : 0) )) >= 50 ? (
                      <span className="text-yellow-400 bg-yellow-950/60 p-1 rounded">⚡ Moderate Lead (Buyer Bayar Ongkir)</span>
                    ) : (
                      <span className="text-red-400 bg-red-950/60 p-1 rounded">🚨 High-Risk (Freebie/Scam Fisher)</span>
                    )}
                  </div>
                </div>

                {/* Checklist options */}
                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Domain check */}
                  <label className="flex items-start gap-3 cursor-pointer p-2.5 hover:bg-white/5 rounded-md transition-all select-none">
                    <input 
                      type="checkbox" checked={qualDomain} 
                      onChange={e => setQualDomain(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#05190F] focus:ring-opacity-0 accent-[#C9A227] cursor-pointer"
                    />
                    <div>
                      <strong className="block font-serif text-white font-bold">1. Memiliki Kepemilikan Corporate Website & Email Resmi (+30)</strong>
                      <span className="text-[10px] text-gray-300 block leading-tight mt-0.5">Email dikirim memakai domain web custom (spt buying@nordicroasters.dk), bukan domain gratisan @gmail, @protonmail, atau @outlook.</span>
                    </div>
                  </label>

                  {/* Courier account check */}
                  <label className="flex items-start gap-3 cursor-pointer p-2.5 hover:bg-white/5 rounded-md transition-all select-none">
                    <input 
                      type="checkbox" checked={qualCourier} 
                      onChange={e => setQualCourier(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#05190F] focus:ring-opacity-0 accent-[#C9A227] cursor-pointer"
                    />
                    <div>
                      <strong className="block font-serif text-white font-bold">2. Bersedia Memberikan Nomor Kurir Akun DHL atau FedEx (+30)</strong>
                      <span className="text-[10px] text-gray-300 block leading-tight mt-0.5">Buyer bersedia menyerahkan 9-digit nomor akun kurir DHL/FedEx korporat mereka untuk menanggung tagihan ongkos kirim udara (<span className="italic">receiver-pays basis</span>).</span>
                    </div>
                  </label>

                  {/* Demand details check */}
                  <label className="flex items-start gap-3 cursor-pointer p-2.5 hover:bg-white/5 rounded-md transition-all select-none">
                    <input 
                      type="checkbox" checked={qualDemand} 
                      onChange={e => setQualDemand(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#05190F] focus:ring-opacity-0 accent-[#C9A227] cursor-pointer"
                    />
                    <div>
                      <strong className="block font-serif text-white font-bold">3. Detail Proyeksi Volume Sourcing & Target Harga Jelas (+25)</strong>
                      <span className="text-[10px] text-gray-300 block leading-tight mt-0.5">Mampu merincikan kuota kargo yang dibutuhkan (cth: "Kita butuh 19 Metric Tons kontrak tahunan dengan target rasa cokelat tembakau, proses semi-washed").</span>
                    </div>
                  </label>

                  {/* Google maps geolocation office check */}
                  <label className="flex items-start gap-3 cursor-pointer p-2.5 hover:bg-white/5 rounded-md transition-all select-none">
                    <input 
                      type="checkbox" checked={qualMaps} 
                      onChange={e => setQualMaps(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#05190F] focus:ring-opacity-0 accent-[#C9A227] cursor-pointer"
                    />
                    <div>
                      <strong className="block font-serif text-white font-bold">4. Alamat Kantor Lolos Geofencing Google Maps (+15)</strong>
                      <span className="text-[10px] text-gray-300 block leading-tight mt-0.5">Saat coordinates dicek di satelit digital, alamat kantor terdeteksi sebagai bangunan fisik industri gudang roastery kopi, gedung pabean komersial, atau kafe roastery aktif.</span>
                    </div>
                  </label>

                </div>

                {/* Verdict advice message */}
                <div className="p-3.5 bg-black/50 border border-white/5 rounded font-mono text-[9px] text-gray-200 leading-relaxed text-justify">
                  { (( (qualDomain ? 30 : 0) + (qualCourier ? 30 : 0) + (qualDemand ? 25 : 0) + (qualMaps ? 15 : 0) )) >= 80 ? (
                    <span><strong>💡 REKOMENDASI VIP:</strong> Pembeli ini tervalidasi sangat serius dan memiliki potensi transaksi besar. Segera kirimkan 500 gram green bean terbaik Anda dibungkus kotak premium plus brosur e-catalog eksklusif. Komunikasikan terus nomor resi DHL secara ramah!</span>
                  ) : (( (qualDomain ? 30 : 0) + (qualCourier ? 30 : 0) + (qualDemand ? 25 : 0) + (qualMaps ? 15 : 0) )) >= 50 ? (
                    <span><strong>💡 REKOMENDASI SEDANG:</strong> Pembeli asli namun level skala usahanya masih uji coba. Mintalah mereka menyuplai airway-bill berbayar atau membagi ongkos udara 50/50 sebagai jaminan keseriusan awal sebelum Anda melepas kargo sampel secara cuma-cuma.</span>
                  ) : (
                    <span><strong>🚨 PERINGATAN SCAM / PENIPUAN:</strong> Probabilitas sangat tinggi bahwa prospek ini adalah "Freebie Hunter" yang mengincar biji kopi gratis demi keperluan konsumsi pribadi atau sindikat spammer. Tolak pengiriman sampel gratis. Mintalah mereka membayar USD 50 via T/T bank lunas sebagai biaya transfer sampel komersial.</span>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 11. B2B COMMERCIAL SAMPLE QUOTATION Invoice FORMULATOR */}
        {activeSubTab === 'sample_quotation' && (
          <div className="space-y-6 animate-fade-in" id="sample-quotation-view">
            
            {/* Header Description panel */}
            <div className="bg-white border border-[#05190F]/10 p-6 rounded-lg shadow-luxury space-y-4">
              <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-[#C9A227]" /> Commercial Proforma Sample Invoice Builder
                  </h3>
                  <h2 className="text-2xl font-serif italic text-[#05190F]">Estimasi Biaya & Format Penawaran Sampel Komersial</h2>
                </div>
                <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 p-1 px-3 border border-emerald-200 uppercase rounded-sm font-bold">
                  B2B Sourcing Ledger Formulator
                </div>
              </div>
              <p className="text-xs text-gray-600 font-sans leading-relaxed">
                Beberapa pembeli tingkat menengah atau asosiasi roaster memerlukan pemesanan "Sampel Komersial" yang lebih besar (seperti 1 goni 30Kg, 60Kg, atau trial pallet 100Kg) sebelum meneken kontrak kontainer penuh. Di bawah ini adalah kalkulator penyusunan **Proforma Invoice Penawaran Sampel** di mana Anda dapat memasukkan data buyer dari CRM, merincikan add-on pabean, mengekstrak dokumen formal, dan **mencetaknya** secara profesional.
              </p>
            </div>

            {/* Formulator main panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input Surcharges (span 5) */}
              <div className="lg:col-span-12 xl:col-span-5 bg-white border border-[#05190F]/10 p-5 rounded-lg space-y-4 shadow-sm text-xs font-mono animate-fade-in">
                <div className="border-[#05190F]/10 pb-2 flex justify-between items-center border-b">
                  <div>
                    <h4 className="font-serif font-bold text-[#05190F] text-sm italic">Quotation Builder Form</h4>
                    <p className="text-[10px] text-gray-500 font-sans">Sandi data komponen harga untuk diformulasikan ke lembar tagihan ekspor.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* CRM Linkage Dropdown */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-[#05190F] uppercase font-bold block">1. Sinkronisasi Data Buyer (Link CRM):</label>
                    <select
                      value={sampleQuoteLeadId}
                      onChange={e => {
                        setSampleQuoteLeadId(e.target.value);
                        // pre-fill country or notes based on chosen lead
                        const matched = leads.find(l => l.id === e.target.value);
                        if (matched) {
                          setSampleQuoteNotes(`Pre-shipment trial batch intended for evaluation by roasting team in ${matched.city}, ${matched.country}. Matches custom profile specifications.`);
                        }
                      }}
                      className="w-full bg-white border border-stone-200 px-3 py-2.5 rounded-sm font-sans focus:ring-1 focus:ring-gold focus:border-gold outline-none text-left"
                    >
                      <option value="">-- Pilih Buyer dari Database CRM Aktif --</option>
                      {leads && leads.length > 0 ? (
                        leads.map(lead => (
                          <option key={lead.id} value={lead.id}>
                            🏢 {lead.companyName} ({lead.country}) score: {lead.leadScore}
                          </option>
                        ))
                      ) : (
                        <option value="walk_in">🏢 General Specialty Roasters Ltd (Germany - Walk-In)</option>
                      )}
                    </select>
                  </div>

                  {/* Coffee Lot type */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-[#05190F] uppercase font-bold block font-bold leading-none mb-1">2. Pilih Origin Kopi Hijau:</label>
                    <select
                      value={sampleQuoteProduct}
                      onChange={e => setSampleQuoteProduct(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-3 py-2.5 rounded-sm font-sans focus:ring-1 focus:ring-gold outline-none"
                    >
                      <option value="Aceh Gayo G1 Giling Basah">Aceh Gayo G1 (Wet Hulled - 1500 masl)</option>
                      <option value="Gayo Wild Natural (Specialty)">Gayo Wild Natural (Modern Specialty)</option>
                      <option value="Java Preanger Reserve (Semi-Washed)">Java Preanger Reserve (Elegant Teas)</option>
                      <option value="Bali Kintamani (Natural Process)">Bali Kintamani (Citrus Zesty)</option>
                      <option value="Flores Volcanic Fully Washed">Flores Volcanic Fully Washed (Bajawa)</option>
                      <option value="Toraja Reserve Double Picked">Toraja Reserve Double Picked (Sulawesi)</option>
                      <option value="Gayo LB Reserve Bourbon">Gayo LB Reserve Bourbon (Rare - 1850 masl)</option>
                      <option value="Lampung Reserve Robusta">Lampung Reserve Robusta (Body Crema)</option>
                      <option value="Temanggung Fine Robusta Clones">Temanggung Fine Robusta (Premium Clean)</option>
                    </select>
                  </div>

                  {/* Quantity and Unit Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] text-[#05190F] font-bold block uppercase leading-none mb-1">Berat Sampel (1Kg - 100Kg):</label>
                      <div className="flex gap-2">
                        <input 
                          type="range" min="1" max="100" value={sampleQuoteQuantity} 
                          onChange={e => setSampleQuoteQuantity(parseInt(e.target.value) || 1)}
                          className="w-2/3 accent-[#05190F] cursor-pointer"
                        />
                        <input 
                          type="number" value={sampleQuoteQuantity}
                          onChange={e => setSampleQuoteQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-1/3 bg-white border border-stone-200 p-1 font-bold text-center rounded-sm font-mono text-xs"
                        />
                        <span className="self-center font-bold text-gray-650">Kgs</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] text-[#05190F] font-bold block uppercase leading-none mb-1">Harga Biji (USD / Kg):</label>
                      <div className="flex gap-1.5">
                        <span className="self-center font-bold text-gray-600 font-mono">$</span>
                        <input 
                          type="number" step="0.10" value={sampleQuotePricePerKg}
                          onChange={e => setSampleQuotePricePerKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                          className="w-full bg-white border border-stone-200 p-1.5 font-mono text-center font-bold rounded-sm text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Courier scale and Incoterms */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[9px] text-[#05190F] block uppercase font-bold leading-none mb-1">Incoterm Syarat:</label>
                      <select
                        value={sampleQuoteIncoterm}
                        onChange={e => setSampleQuoteIncoterm(e.target.value)}
                        className="w-full bg-white border border-stone-200 p-1.5 rounded-sm font-sans text-xs outline-none"
                      >
                        <option value="DAP Air Freight (Delivered-At-Place)">DAP (Courier Door-to-Door)</option>
                        <option value="FOB Belawan (Airport-or-Seaport)">FOB (Free On Board Port)</option>
                        <option value="EXW Sourcing Mill Dry-Station">EXW (Beli di Gudang Mill)</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] text-[#05190F] font-bold block uppercase leading-none mb-1">Ongkir DHL/FedEx (USD):</label>
                      <input 
                        type="number" value={sampleQuoteShipping}
                        onChange={e => setSampleQuoteShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white border border-stone-200 p-1.5 font-mono text-center font-bold rounded-sm text-xs"
                      />
                    </div>
                  </div>

                  {/* Add-on toggles */}
                  <div className="space-y-2 bg-[#FAF8F5] p-3 rounded border border-gray-150 text-left">
                    <span className="text-[9px] uppercase font-bold text-[#05190F] block font-bold mb-1">Tambahan Biaya Ekspor Khusus:</span>
                    
                    {/* Phyto checker */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" checked={sampleQuotePhyto} 
                        onChange={e => setSampleQuotePhyto(e.target.checked)}
                        className="accent-[#05190F]"
                      />
                      <span className="font-sans text-[11px] text-gray-700 font-medium">Include Karantina Fitosanitari RI (+ $16.50 / IDR 250k)</span>
                    </label>

                    {/* Hermetic liner checker */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" checked={sampleQuoteVacuum} 
                        onChange={e => setSampleQuoteVacuum(e.target.checked)}
                        className="accent-[#05190F]"
                      />
                      <span className="font-sans text-[11px] text-gray-700 font-medium font-medium">Include GrainPro liners + Vacuum Pouch (+ $5.00)</span>
                    </label>
                  </div>

                  {/* Custom Note input */}
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] text-[#05190F] font-bold block uppercase">Catatan Ekspor Tambahan:</label>
                    <textarea 
                      rows={2} value={sampleQuoteNotes}
                      placeholder="Masukkan catatan spesifikasi micro-lot..."
                      onChange={e => setSampleQuoteNotes(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-2 text-xs font-sans rounded-sm outline-none leading-relaxed"
                    />
                  </div>

                  {/* Signature Name */}
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] text-[#05190F] font-bold block uppercase">Nama Eksportir Penandatangan:</label>
                    <input 
                      type="text" value={quoterSignatureName}
                      onChange={e => setQuoterSignatureName(e.target.value)}
                      className="w-full bg-white border border-stone-200 p-1.5 font-sans rounded-sm text-xs outline-none font-bold"
                    />
                  </div>

                  {/* Action trigger */}
                  <button 
                    type="button"
                    onClick={() => {
                      const num = `QT-SMP-${(Math.floor(Math.random() * 900000) + 100000)}`;
                      setGeneratedSampleQuoteNumber(num);
                      setShowSampleQuoteReceipt(true);
                    }}
                    className="w-full py-3 bg-[#05190F] hover:bg-neutral-900 text-[#C9A227] hover:text-white border border-[#C9A227]/45 rounded-sm uppercase tracking-widest font-bold font-mono text-[10px] cursor-pointer shadow-luxury transition-all flex items-center justify-center gap-1 font-bold"
                  >
                    Generate Invoice Proforma ➔
                  </button>

                </div>
              </div>

              {/* Right Column: Printable Invoice (span 7) */}
              <div className="lg:col-span-12 xl:col-span-7 bg-white p-4 sm:p-5 border border-[#05190F]/15 rounded-lg space-y-6 flex flex-col justify-between shadow-inner animate-fade-in">
                
                {/* Print Control utility panel */}
                <div className="flex justify-between items-center border-b border-[#05190F]/10 pb-3">
                  <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#05190F] font-bold">📄 Proforma Invoice Live Canvas</span>
                  {showSampleQuoteReceipt && (
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="p-1 px-3 bg-[#05190F] text-[#C9A227] hover:text-white font-mono text-[10px] rounded-sm font-bold flex items-center gap-1.5 cursor-pointer hover:bg-stone-900 border border-gold/40 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / Save PDF (Ctrl+P)
                    </button>
                  )}
                </div>

                {!showSampleQuoteReceipt ? (
                  <div className="flex-grow flex flex-col items-center justify-center py-24 border border-dashed border-[#05190F]/15 rounded bg-[#F7F4EC]/20 text-center text-[#05190F]/45 space-y-3">
                    <Beaker className="w-12 h-12 stroke-1 text-[#C9A227] animate-pulse" />
                    <div className="space-y-1">
                      <h5 className="font-serif font-bold text-xs">Ready to Generate Ledger Sheet</h5>
                      <p className="text-[10px] max-w-sm font-sans mx-auto px-4 leading-normal text-gray-500">Formulasikan harga, pilih buyer dari CRM lalu klik tombol "Generate" untuk merender surat proforma ekspor bersegel resmi.</p>
                    </div>
                  </div>
                ) : (
                  // BREATHTAKING VINTAGE EXPORTER INVOICE CARD
                  <div 
                    id="printable-quotation-sheet"
                    className="p-6 bg-white border border-stone-200 rounded shadow-luxury space-y-6 text-gray-800 relative overflow-hidden select-text"
                  >
                    
                    {/* Watermark Diagonal stamp lines */}
                    <div className="absolute right-6 top-24 transform rotate-12 opacity-[0.03] select-none pointer-events-none">
                      <div className="border-4 border-[#05190F] p-4 font-serif font-extrabold text-[#05190F] text-5xl tracking-widest">
                        NANDARA PREMIUM
                      </div>
                    </div>

                    {/* Exporter Header */}
                    <div className="flex justify-between items-start border-b-2 border-[#05190F] pb-4 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#C9A227]">INDONESIAN DIRECT COFFEE EXPORTER</span>
                        <h3 className="text-xl font-serif text-[#05190F] italic font-black leading-none font-bold">PT. Nandara Nusa Montierra</h3>
                        <p className="text-[9px] text-gray-500 font-sans leading-relaxed">
                          Jl. Kartini 3 No.25, Sawah Besar, Jakarta Pusat, Indonesia — 10720.<br />
                          NIB Reg: 9120104920155 | Exporter ID Code: EX-ID-94101A
                        </p>
                      </div>
                      
                      <div className="text-right space-y-0.5">
                        <span className="p-1 px-1.5 bg-[#05190F] text-gold uppercase tracking-wider font-mono text-[8px] rounded font-bold inline-block">SAMPLE PROFORMA</span>
                        <h4 className="text-xs font-mono font-extrabold text-[#05190F] font-bold">{generatedSampleQuoteNumber}</h4>
                        <p className="text-[9px] text-gray-400 font-sans">Date: {new Date().toISOString().split('T')[0]}</p>
                      </div>
                    </div>

                    {/* Address Grid */}
                    <div className="grid grid-cols-2 gap-6 text-[10px] font-sans pb-3 border-b border-gray-100 text-left">
                      
                      {/* SHIP FROM */}
                      <div className="space-y-1">
                        <span className="font-mono text-[8.5px] uppercase tracking-wider text-gray-400 font-bold block">1. SHIP FROM (ORIGIN DRY-MILL) :</span>
                        <div className="bg-stone-50 p-2.5 rounded border border-stone-100 space-y-0.5">
                          <strong className="text-[#05190F] font-bold">PT. Nandara Nusa Montierra (Belawan Warehouse)</strong>
                          <p className="text-gray-500">Port Belawan Export Terminal, North Sumatra 20411.</p>
                          <p>Contact Desk: export@nandaramontierra.id</p>
                        </div>
                      </div>

                      {/* SHIP TO (Link to CRM) */}
                      <div className="space-y-1">
                        <span className="font-mono text-[8.5px] uppercase tracking-wider text-gray-400 font-bold block">2. SHIP TO (CONSIGNEE BUYER) :</span>
                        <div className="bg-[#FAF8F5] p-2.5 rounded border border-stone-100 space-y-0.5">
                          {leads && leads.find(l => l.id === sampleQuoteLeadId) ? (
                            (() => {
                              const buyer = leads.find(l => l.id === sampleQuoteLeadId)!;
                              return (
                                <>
                                  <strong className="text-[#05190F] font-bold">{buyer.companyName}</strong>
                                  <p className="text-gray-550 leading-tight">{buyer.city}, {buyer.country}.</p>
                                  <p className="text-gray-550">{buyer.email} | {buyer.phone}</p>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <strong className="text-[#05190F] font-bold">General Specialty Roasters LLC</strong>
                              <p className="text-gray-550 leading-tight">Landberger Str Store 40, Munich, Germany.</p>
                              <p className="text-gray-550">buying@specialtyroasters.de | +49 89 54221</p>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Commodities Table */}
                    <div className="font-mono text-[10px]">
                      <div className="grid grid-cols-12 gap-1 bg-[#05190F] p-2 text-white font-bold uppercase rounded-t-sm">
                        <div className="col-span-6 text-gray-200 text-left">Export Item Description (SCA Specialty)</div>
                        <div className="col-span-2 text-center text-gray-200">Qty (Kg)</div>
                        <div className="col-span-2 text-right text-gray-200">Price ($)</div>
                        <div className="col-span-2 text-right text-gold">Total (USD)</div>
                      </div>

                      <div className="grid grid-cols-12 gap-1 p-2 border-b border-gray-100 bg-white items-center text-left">
                        <div className="col-span-6 font-sans">
                          <strong className="text-[#05190F] font-bold">{sampleQuoteProduct}</strong>
                          <p className="text-[9px] text-gray-400 leading-none mt-1 font-mono">HS-Code: 0901.11.00 - Green Coffee Beans Non-Decaffeinated</p>
                        </div>
                        <div className="col-span-2 text-center font-bold">{sampleQuoteQuantity} Kg</div>
                        <div className="col-span-2 text-right font-bold">${sampleQuotePricePerKg.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-bold font-serif text-[#05190F]">${commodityCost.toFixed(2)}</div>
                      </div>

                      {/* Phyto surcharge row */}
                      {sampleQuotePhyto && (
                        <div className="grid grid-cols-12 gap-1 p-2 border-b border-gray-100 bg-gray-50/50 text-[9px] items-center text-gray-650 text-left">
                          <div className="col-span-8 font-sans">• Republic Indonesia Phytosanitary Export Quarantine Authority Surcharge</div>
                          <div className="col-span-2 text-right font-sans">Flat Rate</div>
                          <div className="col-span-2 text-right font-bold font-mono">${phytoCost.toFixed(2)}</div>
                        </div>
                      )}

                      {/* Vacuum Grainpro surcharge row */}
                      {sampleQuoteVacuum && (
                        <div className="grid grid-cols-12 gap-1 p-2 border-b border-gray-100 bg-gray-50/50 text-[9px] items-center text-gray-650 text-left">
                          <div className="col-span-8 font-sans">• GrainPro Hermetic Layer & Co-Extruded High-Barrier Vacuum Bagging</div>
                          <div className="col-span-2 text-right font-sans">Flat Rate</div>
                          <div className="col-span-2 text-right font-bold font-mono">${vacuumCost.toFixed(2)}</div>
                        </div>
                      )}

                      {/* Shipping Freight charge row */}
                      <div className="grid grid-cols-12 gap-1 p-2 border-b-2 border-[#05190F] bg-white items-center text-left">
                        <div className="col-span-8 font-sans font-bold text-gray-655 font-bold">• Global Air Courier Express Surcharge (DHL/FedEx Priority)</div>
                        <div className="col-span-2 text-right font-sans">Prepaid Scale</div>
                        <div className="col-span-2 text-right font-bold">${sampleQuoteShipping.toFixed(2)}</div>
                      </div>

                      {/* Subtotal & Totals Grid */}
                      <div className="grid grid-cols-12 gap-1 pb-2 pt-3 text-[11px] text-left">
                        <div className="col-span-8 font-sans text-gray-500 font-bold self-center leading-normal text-justify pr-8 italic">
                          {sampleQuoteNotes ? `\"{sampleQuoteNotes}\"` : `\"Certified SCA Specialty Sourcing grade green arabica samples. Compliant with moisture standards. Export documentation clearance processed immediately upon fee receipt.\"`}
                        </div>
                        
                        <div className="col-span-4 space-y-1.5 pt-1 border-t border-gray-155">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400 uppercase">Subtotal Cargo:</span>
                            <span className="font-bold">${commodityCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400 uppercase">Customs & Airway:</span>
                            <span className="font-bold">${(phytoCost + vacuumCost + sampleQuoteShipping).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-[#05190F] border-t border-gray-250 pt-1.5 font-bold">
                            <span className="text-emerald-950 uppercase font-bold">TOTAL ({sampleQuoteIncoterm.split(' ')[0]}):</span>
                            <span className="font-serif italic font-extrabold text-[#C9A227] font-black">${sampleQuoteTotal.toFixed(2)}</span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Official stamp & exporter sign-off row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[9px] pt-4 font-mono leading-relaxed border-t border-gray-100 text-left">
                      
                      <div className="space-y-1 text-gray-500 font-sans">
                        <span className="font-bold uppercase text-[#05190F] font-mono block text-[8px] font-bold">☕ BANK WIRE PAYMENT DIRECTIVES</span>
                        <p>Pls settle invoice value to PT. Nandara Nusa central trade desk:</p>
                        <p className="font-mono text-[8.5px]">
                          Beneficiary name: <b>PT. Nandara Nusa Montierra B2B</b><br />
                          Bank Coordinate: <b>Bank Mandiri (Belawan Branch)</b><br />
                          Swift Code/IBAN: <b>BMRIIDJA120 / EX-8410940</b>
                        </p>
                      </div>

                      <div className="text-right flex flex-col items-end justify-between space-y-2 relative">
                        <span className="font-mono uppercase text-[#05190F] text-[8px] font-bold block font-bold leading-none">PT. NANDARA CENTRAL MILL Desk:</span>
                        
                        {/* Interactive Signature Layout */}
                        <div className="flex flex-col items-center justify-center border-b border-stone-300 pb-1 w-48 text-center select-none relative h-10 mt-1">
                          {/* S stamp */}
                          <div className="absolute -left-1 transform -rotate-12 opacity-80 border-2 border-double border-red-500 rounded-full w-12 h-12 flex flex-col items-center justify-center text-center font-bold text-red-500 text-[5px] p-0.5 leading-none">
                            <span>PT. NANDARA</span>
                            <span className="text-[4px] font-bold">APPROVED</span>
                            <span>JAKARTA</span>
                          </div>
                          
                          <p className="font-serif italic text-blue-900 text-xs font-bold font-black transform -rotate-2 select-none select-none font-bold">
                            {quoterSignatureName.split(',')[0]}
                          </p>
                        </div>
                        
                        <p className="font-mono text-gray-500 block leading-none pr-6">{quoterSignatureName}</p>
                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* EMAIL TEMPLATES FOR HIGH RESPONSE OUTREACH PITCHING */}
            <div className="bg-[#FAF8F5] border border-[#05190F]/10 rounded-lg p-6 shadow-luxury space-y-4 animate-fade-in mt-6" id="b2b-pitch-email-generator">
              <div className="border-b border-[#05190F]/10 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#C9A227] animate-pulse" /> Outreach Pitching Engine
                  </h3>
                  <h2 className="text-xl font-serif italic text-[#05190F]">B2B Outreach Email Pitch Templates (High Response Rate)</h2>
                </div>
                <div className="text-[9.5px] font-mono text-amber-850 bg-amber-50 p-1 px-3 border border-amber-200 uppercase rounded-sm font-bold">
                  9-Crop High-Response Outlines
                </div>
              </div>
              
              <p className="text-xs text-gray-650 font-sans leading-relaxed text-justify">
                Menghubungi buyer/roaster global membutuhkan keselarasan taktis. Pilih produk kopi hijau Nandara dan sudut pandang penawaran (angle) di bawah ini. Pitching engine akan menyusun subject dan isi email dingin (cold email) profesional yang disinkronkan dengan data buyer aktif dari CRM Anda di atas untuk memaksimalkan respon cupping panel. Isinya menggunakan copywriting B2B kelas ekspor terbukti.
              </p>

              {/* Selector Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Product spec block */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold block">1. Pilih Produk Kopi Hijau</label>
                  <select
                    value={pitchSelectedProduct}
                    onChange={e => setPitchSelectedProduct(e.target.value)}
                    className="w-full bg-white border border-stone-200 px-3 py-2.5 rounded text-xs text-[#05190F] font-sans focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] outline-none"
                  >
                    <option value="gayo_g1">Aceh Gayo G1 (Giling Basah - 1450 masl)</option>
                    <option value="gayo_wild">Gayo Wild Natural (Specialty Natural - 1500 masl)</option>
                    <option value="java_preanger">Java Preanger Reserve (Semi-Washed - 1600 masl)</option>
                    <option value="bali_kintamani">Bali Kintamani (Citrus Zesty - 1350 masl)</option>
                    <option value="flores_volcanic">Flores Volcanic Fully Washed (Bajawa - 1550 masl)</option>
                    <option value="toraja_reserve">Toraja Reserve Blend (Traditional Hybrid)</option>
                    <option value="gayo_lb">Gayo LB Reserve Bourbon (Rare Microlot - 1850 masl)</option>
                    <option value="lampung_reserve">Lampung Reserve Robusta (Body Crema - 800 masl)</option>
                    <option value="temanggung_fine">Temanggung Fine Robusta (Premium Clean - 1000 masl)</option>
                  </select>
                </div>

                {/* Pitch Angle selector */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold block">2. Tipe Sudut Hubungan (Pitching Angle)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['direct_trade', 'traceability_sensory', 'quick_sample_offer'] as const).map((angle) => (
                      <button
                        key={angle}
                        type="button"
                        onClick={() => setPitchSelectedAngle(angle)}
                        className={`py-2 text-[9.5px] font-mono tracking-tight uppercase font-bold rounded cursor-pointer border transition-all ${
                          pitchSelectedAngle === angle
                            ? 'bg-[#05190F] text-[#C9A227] border-[#C9A227]'
                            : 'bg-white text-gray-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {angle === 'direct_trade' ? 'Direct Trade' : angle === 'traceability_sensory' ? 'Traceability' : 'Sample Kit'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Display of Email */}
              {(() => {
                const PITCH_PRODUCTS_DATA: Record<string, {
                  name: string;
                  process: string;
                  altitude: string;
                  scaScore: string;
                  flavor: string;
                  leadNote: string;
                }> = {
                  gayo_g1: {
                    name: "Aceh Gayo G1 (Giling Basah)",
                    process: "Wet Hulled (Giling Basah)",
                    altitude: "1,200 - 1,450 masl",
                    scaScore: "83.50",
                    flavor: "thick cacao body, sweet cedarwood, complex warm spices, and low acidity",
                    leadNote: "chocolate and sweet cedarwood notes"
                  },
                  gayo_wild: {
                    name: "Gayo Wild Natural",
                    process: "Wild Natural",
                    altitude: "1,300 - 1,500 masl",
                    scaScore: "85.75",
                    flavor: "bright dried strawberry jam, bergamot oil clarity, and a thick brown sugar sweetness",
                    leadNote: "exceptional floral fruit strawberry jam traits"
                  },
                  java_preanger: {
                    name: "Java Preanger Reserve",
                    process: "Semi-Washed",
                    altitude: "1,400 - 1,600 masl",
                    scaScore: "84.25",
                    flavor: "elegant jasmine fragrance, sweet citrus volcanic honey, and a clean caramelized toffee finish",
                    leadNote: "clean sweet floral tea characteristics"
                  },
                  bali_kintamani: {
                    name: "Bali Kintamani Natural",
                    process: "Natural Process",
                    altitude: "1,200 - 1,350 masl",
                    scaScore: "84.50",
                    flavor: "highly dominant sweet orange peel zest, tangy red grapefruit, and a crisp citric acidity",
                    leadNote: "exotic tangy citrus profiles"
                  },
                  flores_volcanic: {
                    name: "Flores Volcanic Fully Washed",
                    process: "Fully Washed",
                    altitude: "1,300 - 1,550 masl",
                    scaScore: "83.75",
                    flavor: "aromatic roasted hazelnut crunch, smooth milk chocolate melt, and a clean green apple acidity",
                    leadNote: "extremely clean nutty chocolate finish"
                  },
                  toraja_reserve: {
                    name: "Toraja Reserve Blend",
                    process: "Hybrid (Washed & Wet Hulled Blend)",
                    altitude: "1,400 - 1,700 masl",
                    scaScore: "84.00",
                    flavor: "complex sweet cacao nibs, subtle black pepper, herbal hints, and a rich caramelized finish",
                    leadNote: "bold body and sweet cardamom spice"
                  },
                  gayo_lb: {
                    name: "Gayo LB Reserve Bourbon",
                    process: "Specialty Semi-Washed (Rare Microlot)",
                    altitude: "1,500 - 1,850 masl",
                    scaScore: "87.50",
                    flavor: "highly expressive white peach syrup, fresh honeysuckle perfume, oil citric bergamot, with a silky black tea mouthfeel",
                    leadNote: "luxurious white peach and honeysuckle"
                  },
                  lampung_reserve: {
                    name: "Lampung Reserve Robusta",
                    process: "Natural Process",
                    altitude: "600 - 800 masl",
                    scaScore: "81.50 (Fine Robusta)",
                    flavor: "unprecedented dark chocolate body, thick toasted hazelnut paste, extreme low acidity, and an exceptional heavy crema potential",
                    leadNote: "potent clean chocolate bar and walnut profiles"
                  },
                  temanggung_fine: {
                    name: "Temanggung Fine Robusta",
                    process: "Premium Clean Natural",
                    altitude: "800 - 1,005 masl",
                    scaScore: "82.50 (Fine Robusta)",
                    flavor: "exceptionally clean sweet malted drink, toasted hazelnut, and smooth black tea finish without muddy notes",
                    leadNote: "clean sweet malted chocolate body"
                  }
                };

                const prod = PITCH_PRODUCTS_DATA[pitchSelectedProduct] || PITCH_PRODUCTS_DATA.gayo_g1;
                const activeLead = leads && leads.find(l => l.id === sampleQuoteLeadId);
                const buyerCompany = activeLead ? activeLead.companyName : 'Specialty Coffee Roasters Ltd';
                const buyerCountry = activeLead ? activeLead.country : 'Germany';
                const senderName = quoterSignatureName ? quoterSignatureName.split(',')[0] : 'Ir. Varriel G.D.';

                let subject = '';
                let body = '';

                if (pitchSelectedAngle === 'direct_trade') {
                  subject = `Direct Sourcing Proposal: Specialty ${prod.name} (Direct Mill to ${buyerCompany})`;
                  body = `Hello ${buyerCompany} Sourcing Team,

I hope this message finds you well during your current green coffee sourcing cycle.

I am writing to you directly from PT. Nandara Nusa Montierra. We operate as an independent direct exporter and dry mill cooperative desk in Indonesia. 

By cooperating directly with family farms and smallholders in high-altitude volcanic terroirs, we bypass the conventional multi-tiered broker intermediaries in regional hubs, allowing us to offer exceptional, fresh estate crops at highly optimized cost structures.

We are writing to list immediate availability on our newest export lot:
• Origin & Grade: ${prod.name} (${prod.process})
• Micro-Lot Elevation: ${prod.altitude}
• Internal Cupping Mark: ${prod.scaScore} SCA Points
• Primary Cupping Notes: ${prod.flavor}
• Internal Quality Specs: Moisture strictly under 12.5%, defect-count below G1 export tolerance, packaged in double-layer hermetic GrainPro liners.

By sourcing directly under FOB Belawan terms, your sourcing operation can secure premium microlots with absolute traceability. Our shipping lines average up to 15-20% in raw margin savings compared to local EU/US broker SPOT pricing.

We would be pleased to express-airmail a 200g physical sample bag directly to your roasting cabinet for your panel’s evaluation next week.

Could you confirm if ${buyerCountry} is the correct destination address for sample deliveries, or is there a preferred laboratory address we should utilize?

Thank you for your time and dedication to fair B2B direct trade.

Warm regards,

${senderName}
B2B Trade Desk
PT. Nandara Nusa Montierra
export@nandaramontierra.id`;
                } else if (pitchSelectedAngle === 'traceability_sensory') {
                  subject = `Micro-lot Sourcing: Score ${prod.scaScore} ${prod.name} (${prod.leadNote})`;
                  body = `Dear ${buyerCompany} Cupping Panel & Sourcing Division,

The sensory evaluation team at PT. Nandara Nusa Montierra has just concluded calibration cuppings on our newly-milled volcanic micro-lots. Based on your ongoing catalog of sourcing high-caliber estate-level single origins, we suspect this specific crop contains the distinctive sweetness and cup structure you seek.

Key Technical Evaluation Specifications:
• Crop Reference: Specialty ${prod.name}
• Micro-Climates: Grown at alpine highland elevations of ${prod.altitude}
• Processing Profile: Traditional ${prod.process}
• Official Cupping Score: Calibrated ${prod.scaScore} SCA
• Flavor Metrics: ${prod.flavor}

This lot does not just deliver a clean cup; it details the specific socio-agricultural narrative of Indonesian highland agriculture. We provide full digital transparency—including complete washing-station moisture tracking telemetry and smallholder interviews accessible via custom QR codes on each 60Kg GrainPro burlap sack.

We are establishing commercial contracts for this lot next month, but we have reserved standard 200g pre-shipment sample boxes for selective roasting partners.

If your roasting team would like to cup this lot, please let us know the optimal mailing coordinate for sample priority.

Sincerely,

${senderName}
Lead Q-Grader & Sourcing Desk
PT. Nandara Nusa Montierra`;
                } else {
                  subject = `Priority Sample: Fresh crop Indonesian ${prod.name} (SCA ${prod.scaScore})`;
                  body = `Hi Sourcing Team at ${buyerCompany},

Short B2B sourcing inquiry from PT. Nandara Nusa Montierra (Specialty Direct Green Coffee Exporter, Jakarta/Medan).

Our mill has just completed the final sorting of our fresh microlot crop: ${prod.name} (SCA score: ${prod.scaScore}). The cup is showing excellent ${prod.flavor}.

We are dispatching express pre-shipment cupping sample boxes (comprising a 200g vacuum-sealed pouch + complete laboratory physical analysis certificate) to active roasting labs in ${buyerCountry} next Wednesday.

Since we are entirely pre-paying the FedEx/DHL courier express fees, there is absolute zero cost or cargo obligation on your end.

Would your team be open to cupping this fresh crop? If so, could you let us know the best physical address and contact phone number to place on the phytosanitary certificate?

Best regards,

${senderName}
PT. Nandara Nusa Montierra
export@nandaramontierra.id`;
                }

                const handleCopyText = (text: string, type: 'subject' | 'body') => {
                  navigator.clipboard.writeText(text);
                  setPitchCopiedStatus(type);
                  setTimeout(() => setPitchCopiedStatus('none'), 2000);
                };

                return (
                  <div className="space-y-4 border border-[#05190F]/10 rounded bg-white p-4 text-left font-mono text-[11px]">
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-150">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">📧 LIVE TEMPLATE OUTPUT ({pitchSelectedAngle.replace('_', ' ').toUpperCase()})</span>
                      <div className="flex gap-2">
                        {activeLead ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2.5 py-0.5 rounded border border-emerald-200 font-sans font-bold">
                            Linked Lead: {buyerCompany} ({activeLead.country})
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[8.5px] font-sans">
                            (Pilih Buyer di Form CRM atas untuk autolink data)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subject Line copy row */}
                    <div className="p-3 bg-stone-50 border border-stone-150 rounded space-y-1 relative">
                      <div className="flex justify-between items-center text-gray-400 text-[9px] uppercase font-bold">
                        <span>Email Subject Line:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(subject, 'subject')}
                          className="text-[#05190F] hover:text-[#C9A227] flex items-center gap-1 cursor-pointer font-bold transition-all text-[9.5px]"
                        >
                          {pitchCopiedStatus === 'subject' ? (
                            <><Check className="w-3 h-3 text-emerald-600" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy Subject</>
                          )}
                        </button>
                      </div>
                      <p className="text-[#05190F] font-bold text-xs font-sans mt-0.5 leading-normal selection:bg-[#C9A227]/30">{subject}</p>
                    </div>

                    {/* Email body copy row */}
                    <div className="p-4 bg-stone-50 border border-stone-150 rounded space-y-2 relative max-h-[300px] overflow-y-auto">
                      <div className="flex justify-between items-center text-gray-400 text-[9px] uppercase font-bold border-b border-stone-200 pb-1.5">
                        <span>Email Body (English Target):</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(body, 'body')}
                          className="text-[#05190F] hover:text-[#C9A227] flex items-center gap-1 cursor-pointer font-bold transition-all text-[9.5px]"
                        >
                          {pitchCopiedStatus === 'body' ? (
                            <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy Email Body</>
                          )}
                        </button>
                      </div>
                      <pre className="text-gray-800 text-[10.5px] leading-relaxed select-all selection:bg-[#C9A227]/30 whitespace-pre-wrap font-sans">{body}</pre>
                    </div>

                    <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-sm flex gap-2 items-start font-sans text-gray-650 text-[10.5px]">
                      <span className="text-amber-600 text-sm">💡</span>
                      <div className="space-y-0.5 leading-normal text-left">
                        <strong className="text-amber-900 font-bold">Mengapa template ini berdaya respon tinggi?</strong>
                        <p>Mengganti pendekatan "menawarkan katalog umum" dengan penyebaran "slot box sampel gratis terbatas (pre-shipped priority)" yang memotong birokrasi dan melompati trading desk multinasional.</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
