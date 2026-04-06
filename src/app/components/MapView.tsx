import { useEffect, useRef } from "react";
import type { Day, Spot } from "../types/itinerary";
import { DAY_COLORS } from "../types/itinerary";

// Leaflet loaded via dynamic import to avoid SSR issues
let leafletLoaded = false;
let L: any = null;

async function ensureLeaflet() {
  if (leafletLoaded && L) return L;
  const mod = await import("leaflet");
  L = mod.default || mod;
  // Inject CSS if not present
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
  leafletLoaded = true;
  return L;
}

function createMarkerIcon(color: string, label: string) {
  if (!L) return undefined;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;background:${color};
      border:2.5px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:12px;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-family:'Noto Sans TC',sans-serif;
    ">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

const JAPAN_CENTER: [number, number] = [36.2048, 138.2529];
const JAPAN_BOUNDS: [[number, number], [number, number]] = [
  [24.0, 122.9],
  [45.5, 153.9],
];

interface MapViewProps {
  days: Day[];
  highlightedSpot?: Spot | null;
  onSpotClick?: (spot: Spot) => void;
  className?: string;
}

export function MapView({
  days,
  highlightedSpot,
  onSpotClick,
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    ensureLeaflet().then((Lf) => {
      if (!containerRef.current || mapRef.current) return;

      const map = Lf.map(containerRef.current, {
        center: JAPAN_CENTER,
        zoom: 6,
        maxBounds: JAPAN_BOUNDS,
        maxBoundsViscosity: 0.85,
        minZoom: 5,
        maxZoom: 18,
      });

      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  // Update markers when days change
  useEffect(() => {
    if (!mapRef.current) {
      // Retry after a short delay if map not ready
      const t = setTimeout(() => {
        updateMarkers();
      }, 500);
      return () => clearTimeout(t);
    }
    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, onSpotClick]);

  function updateMarkers() {
    const map = mapRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds: [number, number][] = [];

    days.forEach((day, dayIdx) => {
      const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
      day.spots.forEach((spot, spotIdx) => {
        const marker = L.marker([spot.lat, spot.lng], {
          icon: createMarkerIcon(color, String(spotIdx + 1)),
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:160px;font-family:'Noto Sans TC',sans-serif;">
            <p style="font-weight:600;margin:0 0 4px;font-size:14px;">${spot.name}</p>
            <p style="color:#666;font-size:12px;margin:0 0 4px;">${spot.address}</p>
            <p style="color:#999;font-size:11px;margin:0 0 6px;">Day ${day.day} · 第 ${spotIdx + 1} 站</p>
            <a href="https://www.google.com/maps?q=${spot.lat},${spot.lng}" target="_blank"
               style="color:#3B82F6;font-size:12px;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
              📍 Google Maps 導航
            </a>
          </div>
        `);

        if (onSpotClick) {
          marker.on("click", () => onSpotClick(spot));
        }

        markersRef.current.push(marker);
        bounds.push([spot.lat, spot.lng]);
      });
    });

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
      } catch {}
    }
  }

  // Highlight spot
  useEffect(() => {
    if (!mapRef.current || !highlightedSpot) return;
    mapRef.current.flyTo([highlightedSpot.lat, highlightedSpot.lng], 15, {
      animate: true,
      duration: 1,
    });
  }, [highlightedSpot]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-xl overflow-hidden ${className}`}
      style={{ minHeight: 320 }}
    />
  );
}
