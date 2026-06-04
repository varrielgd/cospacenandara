import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, MapPin } from 'lucide-react';

// Fix for Leaflet marker icons in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface OriginTerritory {
  id: string;
  name: string;
  type: string;
  soil: string;
  elevation: string;
  varietals?: string;
  character?: string;
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

export default function IndonesiaMap({
  origins,
  activeOrigin,
  onSelectOrigin,
  isLoadingSheet,
  onSyncSheetsOrigins,
  hasSheetsUrl,
}: IndonesiaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'arabica' | 'robusta'>('all');
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([-2.5, 118], 5);

    // Using Esri World Street Map for better reliability and professional look
    // This avoids the ERR_ABORTED issue common with standard OSM tiles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ'
    }).addTo(mapRef.current);

    // Add custom zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

    // CRITICAL: Force a resize check after the map is initialized to fix gray/missing tiles
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const filteredOrigins = origins.filter(o => {
      if (filter === 'all') return true;
      if (filter === 'arabica') return o.type.toLowerCase().includes('arabica');
      if (filter === 'robusta') return o.type.toLowerCase().includes('robusta');
      return true;
    });

    filteredOrigins.forEach(origin => {
      const isActive = activeOrigin?.id === origin.id;
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="marker-pin ${isActive ? 'active' : ''}">
            <div class="pin-head"></div>
            <div class="pin-label">${origin.name.split(' ')[0]}</div>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker([origin.lat, origin.lng], { icon: customIcon }).bindPopup(`
        <div style="font-family: 'Playfair Display', serif; width: 220px; padding: 5px;">
          <div style="font-size: 16px; font-weight: 700; color: #05190F; margin-bottom: 2px;">${origin.name}</div>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #C9A227; font-weight: bold; margin-bottom: 8px;">${origin.type}</div>
          <div style="font-size: 12px; line-height: 1.4; color: #4A5568; margin-bottom: 10px;">${origin.character || origin.flavorNotes}</div>
          <div style="border-top: 1px solid #edf2f7; pt-8px; font-size: 11px; color: #718096;">
            <b>Altitude:</b> ${origin.elevation}<br>
            <b>Process:</b> ${origin.process}
          </div>
          <button id="view-details-${origin.id}" style="width: 100%; margin-top: 12px; padding: 6px; background: #05190F; color: #D4AF37; border: none; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;">View Detail</button>
        </div>
      `, {
        className: 'custom-luxury-popup'
      });

      marker.on('click', () => {
        onSelectOrigin(origin);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-${origin.id}`);
        if (btn) {
          btn.onclick = () => onSelectOrigin(origin);
        }
      });

      marker.addTo(mapRef.current!);
      markersRef.current[origin.id] = marker;
    });

    // If there's an active origin, open its popup
    if (activeOrigin && markersRef.current[activeOrigin.id]) {
      markersRef.current[activeOrigin.id].openPopup();
      mapRef.current.setView([activeOrigin.lat, activeOrigin.lng], 7, { animate: true });
    }
  }, [filter, origins, activeOrigin]);

  return (
    <div className="bg-[#05190F] rounded-2xl overflow-hidden border border-gold/20 shadow-luxury flex flex-col h-[750px]">
      <style>{`
        .leaflet-container { background: #f8f5f0 !important; }
        .custom-luxury-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          border: 1px solid #D4AF37;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .custom-luxury-popup .leaflet-popup-tip { background: #D4AF37; }
        .leaflet-popup-content { margin: 12px 15px; }

        .custom-div-icon { background: none; border: none; }
        .marker-pin {
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s ease;
        }
        .pin-head {
          width: 14px;
          height: 14px;
          background: #05190F;
          border: 2px solid #D4AF37;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }
        .pin-label {
          margin-top: 4px;
          font-size: 8px;
          font-family: monospace;
          font-weight: bold;
          text-transform: uppercase;
          color: #05190F;
          background: rgba(212, 175, 55, 0.9);
          padding: 1px 4px;
          border-radius: 2px;
          white-space: nowrap;
          pointer-events: none;
        }
        .marker-pin.active .pin-head {
          background: #D4AF37;
          border-color: #fff;
          width: 18px;
          height: 18px;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
        }
        .marker-pin.active .pin-label {
          background: #05190F;
          color: #D4AF37;
          font-size: 9px;
          transform: scale(1.1);
        }
      `}</style>

      {/* Luxury Header */}
      <div className="p-8 text-center bg-[radial-gradient(circle_at_top,#0a2a1a,transparent)] border-b border-gold/10">
        <h2 className="text-3xl font-serif italic text-gold tracking-wider mb-2">Indonesian Coffee Origins</h2>
        <p className="text-xs font-mono text-gold/60 uppercase tracking-[0.3em]">Curated Specialty Collection • Nandara Nusa Montierra</p>
      </div>

      {/* Aesthetic Filter Bar */}
      <div className="flex justify-center gap-4 py-6 bg-primary/50">
        {[
          { id: 'all', label: 'All Origins' },
          { id: 'arabica', label: 'Arabica' },
          { id: 'robusta', label: 'Robusta' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as any)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all duration-500 border ${
              filter === btn.id 
                ? 'bg-gold text-primary border-gold shadow-lg shadow-gold/20 font-bold' 
                : 'bg-transparent text-gold/70 border-gold/30 hover:border-gold hover:text-gold'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Map View */}
      <div ref={mapContainerRef} className="flex-1 w-full relative z-10" />

      {/* Floating Action Bar */}
      <div className="p-4 bg-primary border-t border-gold/10 flex justify-between items-center px-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-mono text-gold/50 uppercase tracking-widest">Live Terroir Intelligence Active</span>
        </div>
        
        {hasSheetsUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); onSyncSheetsOrigins(); }}
            disabled={isLoadingSheet}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-gold/30 rounded-md text-gold hover:bg-gold hover:text-primary transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoadingSheet ? 'animate-spin' : ''} />
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Sync Origin Matrix</span>
          </button>
        )}
      </div>
    </div>
  );
}
