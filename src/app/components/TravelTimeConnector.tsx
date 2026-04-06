import type { Spot } from "../types/itinerary";

// ─── Haversine 直線距離 ───────────────────────────────────────────────────────

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── 交通方式估算 ──────────────────────────────────────────────────────────────

export function estimateTravel(km: number): {
  emoji: string;
  label: string;
  minutes: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  if (km <= 1.5) {
    const minutes = Math.max(1, Math.round((km * 1.25 / 4.5) * 60));
    return {
      emoji: "🚶",
      label: "步行",
      minutes,
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    };
  } else if (km <= 20) {
    const minutes = Math.round((km * 1.5 / 25) * 60) + 5;
    return {
      emoji: "🚃",
      label: "電車",
      minutes,
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    };
  } else {
    const minutes = Math.round((km * 1.4 / 40) * 60) + 10;
    return {
      emoji: "🚌",
      label: "巴士",
      minutes,
      textColor: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    };
  }
}

// ─── TravelTimeConnector 元件 ─────────────────────────────────────────────────

interface TravelTimeConnectorProps {
  from: Spot;
  to: Spot;
  /** compact=true 時字體較小，用於編輯頁側欄 */
  compact?: boolean;
}

export function TravelTimeConnector({
  from,
  to,
  compact = false,
}: TravelTimeConnectorProps) {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const { emoji, label, minutes, textColor, bgColor, borderColor } =
    estimateTravel(km);
  const distLabel =
    km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  return (
    <div
      className={`flex items-center gap-2 select-none pointer-events-none ${
        compact ? "px-1 py-0.5" : "px-2 py-1"
      }`}
    >
      <div className="flex-1 h-px bg-gray-200" />
      <div
        className={`flex items-center gap-1 rounded-full border font-medium ${bgColor} ${textColor} ${borderColor} ${
          compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
        }`}
      >
        <span>{emoji}</span>
        <span>{label} 約 {minutes} 分</span>
        <span className="text-gray-400 font-normal">· {distLabel}</span>
      </div>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
