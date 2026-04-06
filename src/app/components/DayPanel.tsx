import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MapPin,
  Trash2,
  Camera,
  Utensils,
  ShoppingBag,
  Hotel,
  Instagram,
  MoreHorizontal,
  Plus,
  Clock,
  Check,
  X,
  Store,
  AlertTriangle,
} from "lucide-react";
import type { Day, Spot } from "../types/itinerary";
import { SPOT_TYPE_LABELS, SPOT_TYPE_COLORS } from "../types/itinerary";
import { TravelTimeConnector } from "./TravelTimeConnector";

// ─── Spot type icon ───────────────────────────────────────────────────────────

const SPOT_ICONS: Record<string, React.ReactNode> = {
  attraction: <Camera className="w-3 h-3" />,
  restaurant: <Utensils className="w-3 h-3" />,
  hotel: <Hotel className="w-3 h-3" />,
  shopping: <ShoppingBag className="w-3 h-3" />,
  ig: <Instagram className="w-3 h-3" />,
  other: <MoreHorizontal className="w-3 h-3" />,
};

// ─── Opening hours helpers ────────────────────────────────────────────────────

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function checkOpenHoursWarning(
  arrivalTime: string | undefined,
  openTime: string | undefined,
  closeTime: string | undefined
): { warn: boolean; msg: string } {
  if (!arrivalTime || !openTime || !closeTime) return { warn: false, msg: "" };
  const open = timeToMin(openTime);
  const close = timeToMin(closeTime);
  if (open >= close) return { warn: false, msg: "" };
  const arr = timeToMin(arrivalTime);
  if (arr < open) return { warn: true, msg: `尚未開放（開放 ${openTime}）` };
  if (arr >= close) return { warn: true, msg: `已休息（關閉 ${closeTime}）` };
  return { warn: false, msg: "" };
}

// ─── TimeEditor (arrival / departure) ────────────────────────────────────────

interface TimeEditorProps {
  arrival: string;
  departure: string;
  onSave: (arrival: string, departure: string) => void;
  onCancel: () => void;
}

function TimeEditor({ arrival, departure, onSave, onCancel }: TimeEditorProps) {
  const [a, setA] = useState(arrival);
  const [d, setD] = useState(departure);

  return (
    <div
      className="flex items-center gap-1.5 mt-1.5 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-200"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
      <div className="flex items-center gap-1 text-xs text-blue-700 font-medium flex-1 min-w-0">
        <span className="text-blue-400 flex-shrink-0">抵達</span>
        <input
          type="time"
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="w-[72px] px-1 py-0.5 bg-white border border-blue-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <span className="text-blue-300 flex-shrink-0">→</span>
        <span className="text-blue-400 flex-shrink-0">離開</span>
        <input
          type="time"
          value={d}
          onChange={(e) => setD(e.target.value)}
          className="w-[72px] px-1 py-0.5 bg-white border border-blue-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSave(a, d)}
          className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          title="儲存"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={onCancel}
          className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
          title="取消"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── OpenHoursEditor ─────────────────────────────────────────────────────────

interface OpenHoursEditorProps {
  openTime: string;
  closeTime: string;
  onSave: (openTime: string, closeTime: string) => void;
  onCancel: () => void;
}

function OpenHoursEditor({
  openTime,
  closeTime,
  onSave,
  onCancel,
}: OpenHoursEditorProps) {
  const [open, setOpen] = useState(openTime);
  const [close, setClose] = useState(closeTime);

  return (
    <div
      className="flex items-center gap-1.5 mt-1.5 px-2 py-1.5 bg-green-50 rounded-lg border border-green-200"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Store className="w-3 h-3 text-green-500 flex-shrink-0" />
      <div className="flex items-center gap-1 text-xs text-green-700 font-medium flex-1 min-w-0">
        <span className="text-green-500 flex-shrink-0">開放</span>
        <input
          type="time"
          value={open}
          onChange={(e) => setOpen(e.target.value)}
          className="w-[72px] px-1 py-0.5 bg-white border border-green-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <span className="text-green-300 flex-shrink-0">–</span>
        <span className="text-green-500 flex-shrink-0">關閉</span>
        <input
          type="time"
          value={close}
          onChange={(e) => setClose(e.target.value)}
          className="w-[72px] px-1 py-0.5 bg-white border border-green-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400"
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onSave(open || "", close || "")}
          className="p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
          title="儲存"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={onCancel}
          className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
          title="取消"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── SortableSpotItem ─────────────────────────────────────────────────────────

interface SortableSpotItemProps {
  spot: Spot;
  index: number;
  dayColor: string;
  dayNumber: number;
  isDragOverlay?: boolean;
  onRemove: () => void;
  onHighlight: () => void;
  onUpdateTime?: (
    day: number,
    spotId: string,
    arrival?: string,
    departure?: string
  ) => void;
  onUpdateOpenHours?: (
    day: number,
    spotId: string,
    openTime?: string,
    closeTime?: string
  ) => void;
}

export function SortableSpotItem({
  spot,
  index,
  dayColor,
  dayNumber,
  isDragOverlay,
  onRemove,
  onHighlight,
  onUpdateTime,
  onUpdateOpenHours,
}: SortableSpotItemProps) {
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [showOpenHoursEdit, setShowOpenHoursEdit] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `spot-${spot.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasTime = spot.arrivalTime || spot.departureTime;
  const hasOpenHours = spot.openTime && spot.closeTime;
  const { warn, msg } = checkOpenHoursWarning(
    spot.arrivalTime,
    spot.openTime,
    spot.closeTime
  );

  const handleSaveTime = (arrival: string, departure: string) => {
    onUpdateTime?.(dayNumber, spot.id, arrival || undefined, departure || undefined);
    setShowTimeEdit(false);
  };

  const handleSaveOpenHours = (openTime: string, closeTime: string) => {
    onUpdateOpenHours?.(
      dayNumber,
      spot.id,
      openTime || undefined,
      closeTime || undefined
    );
    setShowOpenHoursEdit(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white border rounded-lg px-2.5 py-2
        ${isDragging ? "opacity-40 shadow-lg scale-[1.02]" : "opacity-100"}
        ${
          isDragOverlay
            ? "shadow-xl border-blue-300 rotate-1"
            : warn
            ? "border-orange-200 hover:border-orange-300"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
        transition-all cursor-default select-none`}
    >
      {/* Main row */}
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-0.5 rounded"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Order badge */}
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: dayColor }}
        >
          {index + 1}
        </div>

        {/* Spot info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            {warn && (
              <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
            )}
            <p className="text-sm font-medium text-gray-800 truncate">
              {spot.name}
            </p>
          </div>

          {/* Arrival/departure time */}
          {!showTimeEdit && hasTime && (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <Clock className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-500 font-medium">
                {spot.arrivalTime && <span>{spot.arrivalTime}</span>}
                {spot.arrivalTime && spot.departureTime && (
                  <span className="mx-0.5 text-gray-300">→</span>
                )}
                {spot.departureTime && <span>{spot.departureTime}</span>}
              </span>
              {warn && (
                <span className="text-xs text-orange-500 font-normal truncate">
                  ⚠ {msg}
                </span>
              )}
            </div>
          )}

          {/* Open hours badge */}
          {!showOpenHoursEdit && hasOpenHours && (
            <div className="flex items-center gap-1 mt-0.5">
              <Store className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
              <span className="text-xs text-green-600">
                {spot.openTime} – {spot.closeTime}
              </span>
            </div>
          )}

          {/* Address fallback */}
          {!hasTime && !hasOpenHours && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-400 truncate">{spot.address}</p>
            </div>
          )}
        </div>

        {/* Type badge */}
        <span
          className={`hidden sm:flex flex-shrink-0 items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
            SPOT_TYPE_COLORS[spot.type] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {SPOT_ICONS[spot.type]}
          <span className="hidden md:inline">
            {SPOT_TYPE_LABELS[spot.type]}
          </span>
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isDragOverlay && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTimeEdit((v) => !v);
                  setShowOpenHoursEdit(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`p-1 rounded transition-colors ${
                  showTimeEdit
                    ? "text-blue-600 bg-blue-100"
                    : hasTime
                    ? "text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                    : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                }`}
                title="設定抵達／離開時間"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOpenHoursEdit((v) => !v);
                  setShowTimeEdit(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`p-1 rounded transition-colors ${
                  showOpenHoursEdit
                    ? "text-green-600 bg-green-100"
                    : hasOpenHours
                    ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                    : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                }`}
                title="設定營業時間"
              >
                <Store className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={onHighlight}
            className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title="在地圖上標示"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="移除景點"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline time editor */}
      {showTimeEdit && !isDragOverlay && (
        <TimeEditor
          arrival={spot.arrivalTime ?? ""}
          departure={spot.departureTime ?? ""}
          onSave={handleSaveTime}
          onCancel={() => setShowTimeEdit(false)}
        />
      )}

      {/* Inline open hours editor */}
      {showOpenHoursEdit && !isDragOverlay && (
        <OpenHoursEditor
          openTime={spot.openTime ?? ""}
          closeTime={spot.closeTime ?? ""}
          onSave={handleSaveOpenHours}
          onCancel={() => setShowOpenHoursEdit(false)}
        />
      )}
    </div>
  );
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

interface DayPanelProps {
  day: Day;
  dayColor: string;
  onRemoveSpot: (spotId: string) => void;
  onHighlightSpot: (spot: Spot) => void;
  onAddSpot: () => void;
  onUpdateSpotTime?: (
    day: number,
    spotId: string,
    arrival?: string,
    departure?: string
  ) => void;
  onUpdateSpotOpenHours?: (
    day: number,
    spotId: string,
    openTime?: string,
    closeTime?: string
  ) => void;
}

export function DayPanel({
  day,
  dayColor,
  onRemoveSpot,
  onHighlightSpot,
  onAddSpot,
  onUpdateSpotTime,
  onUpdateSpotOpenHours,
}: DayPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.day}` });

  const spotIds = day.spots.map((s) => `spot-${s.id}`);

  const warningCount = day.spots.filter((s) => {
    const { warn } = checkOpenHoursWarning(s.arrivalTime, s.openTime, s.closeTime);
    return warn;
  }).length;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50/50">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: `linear-gradient(90deg, ${dayColor}18, ${dayColor}08)`,
          borderBottom: `2px solid ${dayColor}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: dayColor }}
          >
            {day.day}
          </div>
          <span className="font-semibold text-gray-800 text-sm">
            Day {day.day}
          </span>
          {day.date && (
            <span className="text-xs text-gray-400">
              {new Date(day.date + "T00:00:00").toLocaleDateString("zh-TW", {
                month: "short",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} 個警示
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {day.spots.length} 個景點
        </span>
      </div>

      {/* Droppable spot list */}
      <div
        ref={setNodeRef}
        className={`p-2 min-h-[60px] transition-colors rounded-b-xl ${
          isOver ? "bg-blue-50/60" : ""
        }`}
      >
        <SortableContext items={spotIds} strategy={verticalListSortingStrategy}>
          {day.spots.map((spot, idx) => (
            <div key={spot.id}>
              <SortableSpotItem
                spot={spot}
                index={idx}
                dayColor={dayColor}
                dayNumber={day.day}
                onRemove={() => onRemoveSpot(spot.id)}
                onHighlight={() => onHighlightSpot(spot)}
                onUpdateTime={onUpdateSpotTime}
                onUpdateOpenHours={onUpdateSpotOpenHours}
              />
              {idx < day.spots.length - 1 && (
                <TravelTimeConnector
                  from={spot}
                  to={day.spots[idx + 1]}
                  compact
                />
              )}
            </div>
          ))}
        </SortableContext>

        {day.spots.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-12 text-gray-300 text-xs border-2 border-dashed border-gray-200 rounded-lg">
            拖曳景點到此處
          </div>
        )}
        {isOver && day.spots.length === 0 && (
          <div className="flex items-center justify-center h-12 text-blue-400 text-xs border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
            放開以加入此天
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="px-2 pb-2">
        <button
          onClick={onAddSpot}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-400 hover:text-blue-600 border border-dashed border-gray-200 hover:border-blue-300 rounded-lg transition-all hover:bg-blue-50/30"
        >
          <Plus className="w-3.5 h-3.5" />
          搜尋並新增景點
        </button>
      </div>
    </div>
  );
}
