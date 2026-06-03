import React from 'react';
import { MapPin } from 'lucide-react';

interface OriginTerritory {
  id: string;
  name: string;
  type: string;
  soil: string;
  elevation: string;
  process: string;
  flavorNotes: string;
  availableProducts: string;
  lat: number;
  lng: number;
}

interface IndonesiaMapProps {
  origins: OriginTerritory[];
  activeOrigin: OriginTerritory | null;
  onSelectOrigin: (origin: OriginTerritory) => void;
  isLoadingSheet: boolean;
  onSyncSheetsOrigins: () => void;
  hasSheetsUrl: boolean;
}

// Map geographical bounds
const MIN_LNG = 94.5;
const MAX_LNG = 141.5;
const MIN_LAT = -11.0;
const MAX_LAT = 6.5;

// Project geo coordinates to 0-1000 X and 0-400 Y for SVG viewBox
const projectToSvg = (lng: number, lat: number) => {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 1000;
  // Latitude goes positive upwards, SVG Y goes positive downwards
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * 400;
  return { x, y };
};

// SVG Paths for Islands (projected from actual latitude/longitude arrays)
const SUMATRA_COORDS = [
  [95.2, 5.5], [95.9, 5.7], [96.6, 5.0], [97.5, 4.3], [98.7, 3.5],
  [99.8, 2.8], [101.4, 0.9], [102.6, -1.0], [103.8, -2.2], [104.8, -3.5],
  [105.9, -5.1], [106.1, -5.9], [105.6, -5.9], [105.0, -5.6], [104.5, -5.3],
  [103.8, -4.8], [102.7, -3.8], [101.9, -3.1], [101.0, -2.0], [100.1, -1.1],
  [99.2, -0.3], [98.2, 0.8], [97.3, 1.8], [96.7, 2.6], [96.1, 3.2],
  [95.2, 4.8], [95.2, 5.5]
];

const JAVA_COORDS = [
  [105.2, -6.0], [106.0, -5.9], [106.9, -6.1], [107.8, -6.3], [109.0, -6.9],
  [110.2, -6.8], [111.4, -6.6], [112.5, -6.9], [113.8, -7.8], [114.6, -8.1],
  [114.4, -8.6], [113.5, -8.3], [112.5, -8.2], [111.1, -8.2], [109.9, -7.7],
  [108.5, -7.7], [107.1, -7.4], [105.8, -6.9], [105.1, -6.8], [105.2, -6.0]
];

const KALIMANTAN_COORDS = [
  [108.9, -0.8], [108.9, 0.4], [109.2, 1.5], [109.8, 2.1], [111.0, 3.0],
  [112.5, 4.2], [114.0, 4.5], [115.4, 4.3], [116.8, 4.6], [118.0, 4.1],
  [119.0, 2.2], [118.8, 1.1], [117.8, 0.8], [117.3, -0.4], [116.8, -1.2],
  [116.2, -3.0], [115.6, -4.1], [114.6, -3.5], [113.1, -3.1], [111.5, -2.8],
  [110.1, -2.3], [109.1, -1.7], [108.9, -0.8]
];

const SULAWESI_COORDS = [
  [119.8, -1.0], [119.9, 0.0], [120.8, 0.7], [121.8, 1.0], [123.0, 0.8],
  [124.0, 1.4], [125.1, 1.6], [125.2, 1.2], [124.1, 0.5], [122.9, 0.2],
  [121.8, -0.5], [121.5, -0.9], [122.4, -0.7], [123.3, -0.8], [124.1, -1.1], 
  [124.1, -1.5], [123.0, -1.4], [122.0, -1.2], [121.7, -1.6], [122.5, -2.5], 
  [123.1, -4.0], [123.0, -5.3], [122.4, -5.3], [121.7, -4.0], [121.1, -2.8],
  [120.1, -3.1], [120.4, -4.5], [120.5, -5.6], [119.5, -5.6], [119.4, -4.0],
  [119.3, -2.0], [119.8, -1.0]
];

const PAPUA_COORDS = [
  [130.8, -1.2], [131.5, -0.7], [132.5, -0.8], [134.1, -1.5], [134.5, -2.8],
  [133.5, -2.9], [132.2, -2.0], [134.0, -2.2], [135.5, -2.5], [137.0, -2.3],
  [138.5, -2.4], [140.0, -2.5], [140.7, -2.6], [141.0, -2.6], [141.0, -9.1],
  [140.5, -9.1], [139.0, -8.3], [137.4, -7.0], [136.0, -4.9], [134.8, -4.0],
  [130.8, -1.2]
];

const BALI_COORDS = [[114.5, -8.1], [115.7, -8.1], [115.6, -8.8], [114.4, -8.7], [114.5, -8.1]];
const LOMBOK_COORDS = [[116.0, -8.3], [116.7, -8.3], [116.6, -9.0], [115.9, -8.9], [116.0, -8.3]];
const SUMBAWA_COORDS = [[116.9, -8.4], [118.9, -8.4], [118.5, -9.0], [117.0, -8.9], [116.9, -8.4]];
const FLORES_COORDS = [[119.8, -8.4], [121.5, -8.5], [123.0, -8.2], [122.8, -8.9], [119.9, -8.8], [119.8, -8.4]];
const TIMOR_COORDS = [[123.5, -10.3], [124.5, -9.8], [125.5, -9.1], [127.3, -8.3], [127.0, -8.6], [125.0, -10.1], [124.0, -10.4], [123.5, -10.3]];

const buildSvgPath = (coords: number[][]) => {
  return coords.map((c, i) => {
    const { x, y } = projectToSvg(c[0], c[1]);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') + ' Z';
};

export default function IndonesiaMap({
  origins,
  activeOrigin,
  onSelectOrigin,
  isLoadingSheet,
  onSyncSheetsOrigins,
  hasSheetsUrl,
}: IndonesiaMapProps) {
  // Convert coords list to path data once
  const sumatraPath = buildSvgPath(SUMATRA_COORDS);
  const javaPath = buildSvgPath(JAVA_COORDS);
  const kalimantanPath = buildSvgPath(KALIMANTAN_COORDS);
  const sulawesiPath = buildSvgPath(SULAWESI_COORDS);
  const papuaPath = buildSvgPath(PAPUA_COORDS);
  const baliPath = buildSvgPath(BALI_COORDS);
  const lombokPath = buildSvgPath(LOMBOK_COORDS);
  const sumbawaPath = buildSvgPath(SUMBAWA_COORDS);
  const floresPath = buildSvgPath(FLORES_COORDS);
  const timorPath = buildSvgPath(TIMOR_COORDS);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xs font-mono tracking-widest text-[#C9A227] font-bold uppercase">Terroir Exploration</h3>
          <h2 className="text-lg font-serif italic text-[#05190F]">Geographic Sourcing Origin Map</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasSheetsUrl ? (
            <button
              onClick={onSyncSheetsOrigins}
              disabled={isLoadingSheet}
              className="px-3 py-1.5 bg-white text-[#05190F] border border-[#05190F]/20 rounded-sm hover:border-[#C9A227] font-mono text-[10px] tracking-widest uppercase font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Sync dynamic coffee origins straight from configured Google Sheets"
              id="btn-sync-origins-sheet"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLoadingSheet ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              {isLoadingSheet ? 'Loading Sheet...' : 'Sync Sheets Origins'}
            </button>
          ) : (
            <span className="text-[9px] font-mono p-1 px-2.5 bg-yellow-50 text-amber-800 border border-amber-200 rounded-sm uppercase tracking-wide">
              Sheets Config Pending for Future Origins
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-[#4A5568] leading-relaxed max-w-2xl">
        Select volcanic terroir markers below to analyze custom altitude specifications, export processing methods, precise flavor compositions, and direct product pairings.
      </p>

      {/* Map Board */}
      <div 
        className="relative border border-[#05190F]/10 rounded-lg overflow-hidden bg-[#F7F4EC] select-none shadow-luxury md:aspect-[5/2]" 
        id="indonesia-coffee-origin-map"
      >
        {/* Sea background and grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#05190f_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-10" />
        
        {/* Equator Line */}
        <div className="absolute inset-x-0 top-[28%] border-t border-[#05190F]/15 border-dashed z-0 flex justify-between px-4 text-[8px] font-mono text-[#05190F]/30 uppercase tracking-widest pt-0.5 pointer-events-none">
          <span>Equator 0°</span>
          <span>Indonesian Coffee Belt</span>
        </div>

        {/* Dynamic Map SVG */}
        <svg 
          viewBox="0 0 1000 400" 
          className="w-full h-auto min-h-[220px] md:min-h-0 block relative z-10"
        >
          {/* Main island paths rendered in luxurious Dark Green #05190F */}
          <g fill="#05190F" fillOpacity="0.9" stroke="#C9A227" strokeOpacity="0.25" strokeWidth="1.2" strokeLinejoin="round">
            <path d={sumatraPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={javaPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={kalimantanPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={sulawesiPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={papuaPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            {/* Lesser Sunda Chain & Maluku */}
            <path d={baliPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={lombokPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={sumbawaPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={floresPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
            <path d={timorPath} className="transition-all hover:fill-emerald-950 hover:stroke-[#C9A227] cursor-pointer" />
          </g>
        </svg>

        {/* Overlay Pins on Top (using percentage layout derived from real coordinates) */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {origins.map((org) => {
            const isActive = activeOrigin?.id === org.id;
            // project coordinates
            const { x, y } = projectToSvg(org.lng, org.lat);
            
            // X and Y in percentages
            const xPercent = (x / 1000) * 100;
            const yPercent = (y / 400) * 100;

            const isCustom = !['aceh_gayo', 'mandheling', 'lintong', 'flores_bajawa', 'toraja', 'temanggung', 'lampung'].includes(org.id);

            return (
              <div
                key={org.id}
                className="absolute pointer-events-auto"
                style={{ 
                  left: `${xPercent}%`, 
                  top: `${yPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectOrigin(org)}
                  className="relative group cursor-pointer flex flex-col items-center select-none"
                  id={`pin-${org.id}`}
                >
                  {/* Ripple wave effect around active/inactive pins */}
                  <span className={`absolute -inset-2 rounded-full animate-ping opacity-35 ${
                    isActive ? 'bg-[#C9A227] scale-150' : 'bg-[#05190F] group-hover:bg-[#C9A227]'
                  }`} />

                  {/* Marker Circle */}
                  <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive 
                      ? 'bg-[#C9A227] border-white scale-125 shadow-[0_0_12px_rgba(201,162,39,0.8)]' 
                      : 'bg-[#05190F] border-[#C9A227] group-hover:bg-[#C9A227] group-hover:border-white shadow-md'
                  }`}>
                    <MapPin className={`w-2 h-2 shrink-0 ${isActive ? 'text-[#05190F]' : 'text-[#C9A227] group-hover:text-white'}`} />
                  </div>

                  {/* High Quality Minimalist Tooltip label */}
                  <div className={`mt-1 bg-[#05190F] text-white border border-[#C9A227]/30 p-1 px-2 rounded-sm font-mono text-[8px] tracking-wider uppercase font-semibold text-center leading-none pointer-events-none shadow-md transition-all whitespace-nowrap ${
                    isActive 
                      ? 'opacity-100 scale-100 border-[#C9A227]' 
                      : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0.5'
                  }`}>
                    <span className="flex items-center gap-0.5">
                      {isCustom && <span className="text-[#C9A227]">★</span>}
                      {org.name}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
