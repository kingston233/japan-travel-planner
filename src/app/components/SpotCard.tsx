import { useState } from "react";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Navigation,
  Utensils,
  Camera,
  ShoppingBag,
  Hotel,
  Instagram,
  MoreHorizontal,
  Clock,
  Store,
  AlertTriangle,
} from "lucide-react";
import type { Spot } from "../types/itinerary";
import { SPOT_TYPE_LABELS, SPOT_TYPE_COLORS } from "../types/itinerary";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SPOT_ICONS: Record<string, React.ReactNode> = {
  attraction: <Camera className="w-3.5 h-3.5" />,
  restaurant: <Utensils className="w-3.5 h-3.5" />,
  hotel: <Hotel className="w-3.5 h-3.5" />,
  shopping: <ShoppingBag className="w-3.5 h-3.5" />,
  ig: <Instagram className="w-3.5 h-3.5" />,
  other: <MoreHorizontal className="w-3.5 h-3.5" />,
};

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function checkHoursWarning(
  arrival: string | undefined,
  openTime: string | undefined,
  closeTime: string | undefined
): { warn: boolean; msg: string } {
  if (!arrival || !openTime || !closeTime) return { warn: false, msg: "" };
  const open = timeToMin(openTime);
  const close = timeToMin(closeTime);
  if (open >= close) return { warn: false, msg: "" };
  const arr = timeToMin(arrival);
  if (arr < open) return { warn: true, msg: `尚未開放（開放 ${openTime}）` };
  if (arr >= close) return { warn: true, msg: `已休息（關閉 ${closeTime}）` };
  return { warn: false, msg: "" };
}

// ─── SpotCard ─────────────────────────────────────────────────────────────────

interface SpotCardProps {
  spot: Spot;
  index: number;
  dayColor: string;
  onHighlight?: (spot: Spot) => void;
}

export function SpotCard({ spot, index, dayColor, onHighlight }: SpotCardProps) {
  const [expanded, setExpanded] = useState(false);

  const { warn, msg: warnMsg } = checkHoursWarning(
    spot.arrivalTime,
    spot.openTime,
    spot.closeTime
  );
  const hasOpenHours = spot.openTime && spot.closeTime;
  const hasDetails = spot.description || spot.notes;

  const openMaps = () => {
    window.open(
      `https://www.google.com/maps?q=${spot.lat},${spot.lng}&hl=zh-TW`,
      "_blank"
    );
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
        warn ? "border-orange-200" : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Index badge */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
          style={{ backgroundColor: dayColor }}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-center gap-1.5">
              {warn && (
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
                {spot.name}
              </h3>
            </div>
            <span
              className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                SPOT_TYPE_COLORS[spot.type] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {SPOT_ICONS[spot.type]}
              {SPOT_TYPE_LABELS[spot.type] ?? spot.type}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{spot.address}</span>
          </div>

          {/* Info badges row */}
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Arrival / departure time */}
            {(spot.arrivalTime || spot.departureTime) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg">
                <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="text-xs text-blue-600 font-medium">
                  {spot.arrivalTime && (
                    <span>
                      <span className="text-blue-400 font-normal">抵達</span>{" "}
                      {spot.arrivalTime}
                    </span>
                  )}
                  {spot.arrivalTime && spot.departureTime && (
                    <span className="mx-1.5 text-blue-300">→</span>
                  )}
                  {spot.departureTime && (
                    <span>
                      <span className="text-blue-400 font-normal">離開</span>{" "}
                      {spot.departureTime}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Open hours badge */}
            {hasOpenHours && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                  warn
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-green-50"
                }`}
              >
                <Store className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-xs text-green-700 font-medium">
                  {spot.openTime} – {spot.closeTime}
                </span>
              </div>
            )}
          </div>

          {/* Warning message */}
          {warn && (
            <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
              <span className="text-xs text-orange-700 font-medium">
                ⚠ 排程衝突：{warnMsg}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={openMaps}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Google Map 導航
            </button>
            {onHighlight && (
              <button
                onClick={() => onHighlight(spot)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                在地圖上看
              </button>
            )}
            {hasDetails && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 ml-auto text-gray-400 hover:text-gray-600 text-xs transition-colors"
              >
                {expanded ? (
                  <>
                    收合 <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    詳情 <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expandable details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-600">
              {spot.description && (
                <p className="leading-relaxed">{spot.description}</p>
              )}
              {spot.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <span className="text-amber-700 font-medium text-xs">
                    💡 旅遊小提示
                  </span>
                  <p className="mt-1 text-amber-800 text-xs leading-relaxed">
                    {spot.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional image strip */}
      {expanded && spot.imageUrl && (
        <div className="h-32 overflow-hidden">
          <img
            src={spot.imageUrl}
            alt={spot.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
}
