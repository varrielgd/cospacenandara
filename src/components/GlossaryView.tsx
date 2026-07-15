import React, { useState } from 'react';

type TermCategory = 'Coffee Quality & Roasting' | 'Farm & Processing' | 'Export & Logistics' | 'Business & Buyers' | 'Defects & Tastes';

interface GlossaryTerm {
  term: string;
  category: TermCategory;
  definitionId: string; // The definition in Indonesian/Multi-language compatible
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Coffee Quality & Roasting
  { term: 'Specialty Coffee', category: 'Coffee Quality & Roasting', definitionId: 'Kopi dengan kualitas luar biasa, yang dinil80 poin atau lebih pada skala 100 poin oleh Q Grader bersertifikat. Mengharuskan penanganan pascapanen yang teliti dan menonjolkan karakteristik spesifik dari daerah asalnya (terroir).' },
  { term: 'Cupping', category: 'Coffee Quality & Roasting', definitionId: 'Proses metodis dan standar (biasanya menggunakan skor SCA) untuk mengevaluasi aroma dan profil rasa biji kopi yang diseduh. Cupper menilaspek seperti Fragrance, Flavor, Aftertaste, Acidity, Body, dan Balance.' },
  { term: 'Q Grader', category: 'Coffee Quality & Roasting', definitionId: 'Profesional sertifikasi yang dilatih khusus dan disertifikasi oleh Coffee Quality Institute (CQI) untuk menilkualitas kopi arabika secara objektif berdasarkan standar Specialty Coffee Association (SCA).' },
  { term: 'Acidity (Keasaman)', category: 'Coffee Quality & Roasting', definitionId: 'Sensasi cerah, segar, atau tajam yang dirasakan di lidah, yang menentukan "kecerahan" atau "kegembiraan" dari suatu kopi. Keasaman yang baik disebut "bright" (cerah) dan sangat dihargdalam kopi specialty, bukan berarti asam yang tidak enak.' },
  { term: 'Body (Kekentalan)', category: 'Coffee Quality & Roasting', definitionId: 'Bobot atau ketebalan fisik kopi yang terasa di mulut saat diminum. Bisa digambarkan dari ringan (light), sedang (medium), hingga berat (heavy) dan sirup.' },
  { term: 'Aftertaste (Finish)', category: 'Coffee Quality & Roasting', definitionId: 'Rasa dan sensasi yang tertinggal di palet mulut setelah kopi ditelan. Aftertaste yang panjang dan menyenangkan menunjukkan kopi berkualitas tinggi.' },
  { term: 'Roast Profile', category: 'Coffee Quality & Roasting', definitionId: 'Catatan suhu dan waktu spesifik selama proses penyangraian kopi untuk menonjolkan karakteristik rasa bawaan biji (dari light roast, medium, hingga dark roast).' },
  { term: 'First Crack', category: 'Coffee Quality & Roasting', definitionId: 'Tahap dalam penyangraian ketika biji kopi mengeluarkan bunyi retakan perlahan karena pelepasan uap air dan gas. Ini menandakan transisi menuju tahap perkembangan (development) biji kopi.' },

  // Farm & Processing
  { term: 'Terroir', category: 'Farm & Processing', definitionId: 'Gabungan dari faktor-faktor lingkungan (tanah, topografi, ketinggian, iklim, mikroiklim) yang memberi karakteristik rasa yang unik dan khas pada biji kopi yang ditanam di suatu wilayah geografis tertentu.' },
  { term: 'Washed Process (Full Washed)', category: 'Farm & Processing', definitionId: 'Proses pasca-panen di mana kulit, daging buah (pulp), dan lendir (mucilage) dihilangkan sepenuhnya dengan air dan fermentasi sebelum biji kopi dikeringkan. Menghasilkan rasa kopi yang bersih(clean), asam cerah, dan tipikal rasa origin.' },
  { term: 'Natural Process (Dry Process)', category: 'Farm & Processing', definitionId: 'Proses di mana ceri kopi dijemur dan dikeringkan secara utuh beserta kulit dan daging buahnya sebelum dikupas. Cenderung menghasilkan kopi dengan body yang berat, rasa manis tinggi, dan profil rasa buah atau fermentasi (fruity).' },
  { term: 'Honey Process (Pulped Natural)', category: 'Farm & Processing', definitionId: 'Proses di mana kulit ceri kopi dikupas, tetapi lapisan lendir (mucilage/lendir manis) tetap dibiarkan lalu dijemur. Menghasilkan rasa di antara washed (bersih) dan natural (manis/kental). Terbagi menjadi white, yellow, red, dan black honey tergantung sisa lendirnya.' },
  { term: 'Wet Hulling (Giling Basah)', category: 'Farm & Processing', definitionId: 'Metode pengolahan tradisional asal Indonesia (sering ditemukan di Sumatera). Kopi dikupas dari cangkang tanduknya (parchment) saat tingkat kelembapannya masih tinggi (sekitar 30-40%). Menghasilkan profil rasa earth, wood, spice, dan body yang tebal dengan low acidity.' },
  { term: 'Elevation (Ketinggian Tanam/MASL)', category: 'Farm & Processing', definitionId: 'Ketinggian kebun kopi diukur dari permukaan laut (Meters Above Sea Level). Ketinggian yang lebih tinggi biasanya menghasilkan biji yang lebih padat dan profil rasa yang lebih kompleks karena pematangan buah lebih lambat karena suhu lebih sejuk.' },
  { term: 'Shade-Grown', category: 'Farm & Processing', definitionId: 'Kopi yang ditanam di bawah naungan atau kanopi pohon (seperti pohon alpukat, pisang, dsb). Ini melambatkan proses pematangan ceri sehingga kopi memiliki gula alami yang lebih tinggi, serta ramah lingkungan bagi burung dan satwa liar.' },
  { term: 'Cherry', category: 'Farm & Processing', definitionId: 'Buah dari pohon kopi. Umumnya saat matang akan berwarna merah cerah, walaupun beberapa varietas langka menjadi kuning (Yellow Bourbon) atau pink.' },

  // Defects & Tastes
  { term: 'Defect (Cacat Biji)', category: 'Defects & Tastes', definitionId: 'Ketidaksempurnaan atau kerusakan pada biji kopi mentah (green bean) yang dapat mempengaruhi kualitas rasanya. Dalam skala SCA terbagi atas cacat primer (Primary Defect - sangat berdampak) dan cacat mekanis/sekunder.' },
  { term: 'Quaker', category: 'Defects & Tastes', definitionId: 'Biji kopi yang tidak berkembang sempurna (kurang matang/immature) yang ketika disangrwarnanya menjadi sangat terang dibandingkan biji yang lain. Menghasilkan rasa hambar seperti kertas atau sereal/kacang.' },
  { term: 'Potato Defect (Rasa Kentang)', category: 'Defects & Tastes', definitionId: 'Cacat rasa unik yang umumnya ditemukan di kopi Afrika Timur (Rwanda/Burundi) yang disebabkan oleh bakteri tertentu, menyebabkan aroma kopi seperti kentang mentah yang dikupas.' },
  { term: 'Earthy', category: 'Defects & Tastes', definitionId: 'Aroma atau rasa seperti tanah basah. Sering dikaitkan dengan metode giling basah di Sumatera; bagi sebagian diapresiasi, bagi yang lain (kalau berlebihan) bisa jadi cacat rasa.' },
  { term: 'Fermented (Over-fermented)', category: 'Defects & Tastes', definitionId: 'Rasa seperti buah busuk, cuka, atau masam dari hasil fermentasi pasca-panen yang terlalu lama. Berbeda dari note "winey" yang diinginkan, over-ferment dapat merusak secangkir kopi.' },
  { term: 'Astringent', category: 'Defects & Tastes', definitionId: 'Sensasi mengkerut di lidah, seperti menggigit buah mentah atau meminum teh hijau yang terlalu pekat. Biasanya indikasi ekstraksi berlebih (over-extraction) atau cacat pada buah.' },

  // Export & Logistics
  { term: 'FOB (Free On Board)', category: 'Export & Logistics', definitionId: 'Incoterm (syarat pembayaran dan pengiriman) yang menyatakan bahwa eksportir bertanggung jawab untuk mengurus semua biaya dan risiko dari gudang asal hingga kontainer berhasil naik ke kapal di pelabuhan muat.' },
  { term: 'CIF (Cost, Insurance, and Freight)', category: 'Export & Logistics', definitionId: 'Eksportir menanggung biaya barang, asuransi angkutan, dan biaya angkut hingga kontainer sampdi pelabuhan tujuan yang disepakati oleh pembeli.' },
  { term: 'Bill of Lading (B/L)', category: 'Export & Logistics', definitionId: 'Dokumen penting tanda terima muatan, dikeluarkan oleh perusahaan pelayaran. Menandakan hak milik barang selama perjalanan. Pembeli membutuhkan ini untuk dapat mengambil barang dari pelabuhan setiba di negara tujuan.' },
  { term: 'Phytosanitary Certificate', category: 'Export & Logistics', definitionId: 'Sertifikat resmi dari otoritas Karantina Pertanian dari negara eksportir yang memvalidasi bahwa kopi mentah (green bean) yang dikirim bebas dari hama dan patogen pertanian.' },
  { term: 'Certificate of Origin (COO)', category: 'Export & Logistics', definitionId: 'Dokumen yang membuktikan asal negara tempat barang diproduksi/ditanam. Beberapa bentuk dari dokumen ini (seperti Form D/Form E/Form ICO) dapat memberikan keringanan tarif bea cukkepada pihak pembeli.' },
  { term: 'LCL (Less than Container Load)', category: 'Export & Logistics', definitionId: 'Pengiriman di mana pengirim tidak menggunakan seluruh kapasitas suatu kontainer sehingga digabung dengan barang dari pihak lain. Sering dikenakan kepada mikro eksportir atau importer dalam jumlah kecil.' },
  { term: 'FCL (Full Container Load)', category: 'Export & Logistics', definitionId: 'Pengiriman standar yang mana eksportir menggunakan dan membayar biaya penuh untuk satu kontainer muatan secara eksklusif (Umumnya kontainer 20ft untuk muatan ~19 ton kopi arabika ukuran bag goni).' },
  { term: 'ICUMSA / ICO Mark', category: 'Export & Logistics', definitionId: 'Tanda pengenal resmi atau nomor International Coffee Organization (ICO) yang harus dicetak pada karung goni eksport kopi untuk identifikasi/pelacakan global.' },
  { term: 'GrainPro / Ecotact', category: 'Export & Logistics', definitionId: 'Merk pelapis plastik hermetik (kedap udara dan anti basah) yang umum melapisi bagian dalam atau digunakan sebelum kopi dimasukan kembali ke karung goni untuk menjaga kesegaran selagi pengiriman laut berbulan-bulan.' },

  // Business & Buyers
  { term: 'Direct Trade', category: 'Business & Buyers', definitionId: 'Praktek perdagangan di mana penyangr(roaster) atau importir secara langsung membeli dan menjalin relasi kerja dengan pekebun kopi tanpa melewati ranttengkulak yang panjang. Harga umumnya premium demi imbal balik yang suportif dan transparan.' },
  { term: 'Fair Trade', category: 'Business & Buyers', definitionId: 'Sertifikasi keadilan dagang dunia dengan skema harga dasar minimum yang disyaratkan untuk melindungi petani kopi ketika harga komoditi dunia(C-market price) sedang hancur. Termasuk juga sistem pembagian modal koperasi tambahan untuk petani.' },
  { term: 'Micro-lot / Nano-lot', category: 'Business & Buyers', definitionId: 'Volume produksi kopi dengan kuantitas sangat kecil namun khusus. Dipanen dari blok lahan tertentu dalam kebun dengan penanganan spesial dan kualitas luar biasa, yang biasanya dikemas dalam volume sedikit (bisa 10-50 kg) dan berniljual sangat mahal.' },
  { term: 'Green Buyer', category: 'Business & Buyers', definitionId: 'Jabatan profesi atau entitas yang pekerjaannya memilih dan menil(cupping) profil kopi serta mengatur rantpasok pembelian biji kopi hijau ke dalam suatu tempat roastery atau gudang grosir dari negara pengekspor.' },
  { term: 'Tolling', category: 'Business & Buyers', definitionId: 'Layanan pihak ketiga di mana pemilik kopi melempar beban pengerjaan (misalnya menyangrai, menggiling pabrik basah/kering kopi, sortasi) ke pihak lain dengan membayar fee per kilo.' },
];

export default function GlossaryView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | 'All'>('All');

  const categories: (TermCategory | 'All')[] = ['All', 'Coffee Quality & Roasting', 'Farm & Processing', 'Export & Logistics', 'Business & Buyers', 'Defects & Tastes'];

  const filteredTerms = GLOSSARY_TERMS.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.definitionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-[#F7F4EC]">
      <header className="px-10 py-8 bg-white border-b border-[#E8E1D3] shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-serif text-[#05190F]">Industry Glossary</h1>
            <p className="text-[#C9A227] font-mono text-sm uppercase tracking-wide mt-2">
              Kamus Istilah Kopi, Ekspor, & Bisnis
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              
              <input
                type="text"
                placeholder="Cari istilah atau penjelasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-[#E8E1D3] rounded-sm focus:outline-none focus:border-[#C9A227] w-80 font-sans text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto py-8 px-10">
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <span className="flex items-center gap-2 text-xs font-mono uppercase text-gray-500 mr-2 shrink-0">
               Kategori:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-sm text-xs font-sans whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-[#05190F] text-[#D4AF37] border-[#05190F] font-semibold' 
                    : 'bg-white border-[#E8E1D3] text-gray-600 hover:border-[#C9A227] hover:text-[#C9A227]'
                }`}
              >
                {cat === 'All' ? 'Semua Istilah' : cat}
              </button>
            ))}
          </div>

          {filteredTerms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTerms.map((item, index) => (
                <div key={index} className="bg-white border border-[#E8E1D3] p-6 rounded-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-lg shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-serif text-[#05190F]">{item.term}</h3>
                    <span className="px-2 py-1 bg-[#F7F4EC] text-[#8B7355] text-[10px] font-mono tracking-wider uppercase border border-[#E8E1D3]">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {item.definitionId}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 font-sans">
              
              <p>Istilah tidak ditemukan. Coba kata kunci lain.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
