import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Instagram,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Loader2,
  AlertCircle,
  ListOrdered,
  Map,
  Trash2,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useMemberStore } from "../store/useMemberStore";
import { Navbar } from "../components/Navbar";
import { MapView } from "../components/MapView";
import { DayPanel, SortableSpotItem } from "../components/DayPanel";
import { SearchBar } from "../components/SearchBar";
import { IGImportModal } from "../components/IGImportModal";
import { CreateItineraryModal } from "../components/CreateItineraryModal";
import type { Day, Spot, SearchResult } from "../types/itinerary";
import { DAY_COLORS } from "../types/itinerary";

// ─── Add-to-Day modal (inline) ───────────────────────────────────────────────

interface AddSpotModalProps {
  result: SearchResult;
  days: Day[];
  onAdd: (day: number, result: SearchResult, type: string, notes: string) => void;
  onClose: () => void;
}

function AddSpotModal({ result, days, onAdd, onClose }: AddSpotModalProps) {
  const [selectedDay, setSelectedDay] = useState(days[0]?.day ?? 1);
  const [spotType, setSpotType] = useState<string>("attraction");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">加入景點</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{result.name}</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-800">{result.name}</p>
              <p className="text-xs text-gray-500 truncate">{result.address}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              加入哪一天？
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((d, idx) => (
                <button
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 ${
                    selectedDay === d.day
                      ? "text-white border-transparent shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  style={
                    selectedDay === d.day
                      ? { backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }
                      : {}
                  }
                >
                  Day {d.day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              景點類型
            </label>
            <select
              value={spotType}
              onChange={(e) => setSpotType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="attraction">🏛 景點</option>
              <option value="restaurant"> 餐廳</option>
              <option value="shopping">🛍 購物</option>
              <option value="hotel">🏨 住宿</option>
              <option value="other">📌 其他</option>
            </select>
          </div>

          {/* 備註欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備註
              <span className="ml-1.5 text-xs font-normal text-gray-400">（選填）</span>
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：需要預約、推薦必點、注意事項…"
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none bg-amber-50/40 placeholder-gray-400 transition-all"
              />
              <span className="absolute bottom-2 right-2.5 text-[10px] text-gray-300 pointer-events-none">
                {notes.length}/200
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onAdd(selectedDay, result, spotType, notes.trim())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            加入行程
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditPage ─────────────────────────────────────────────────────────────────

export default function EditPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const {
    currentItinerary,
    isLoading,
    error,
    isNetworkError,
    fetchItinerary,
    addSpotToDay,
    removeSpotFromDay,
    updateDays,
    updateSpotTime,
    updateSpotOpenHours,
    deleteItinerary,
    retryLoad,
  } = useStore();

  const { selectedMember, fetchMembers } = useMemberStore();

  // Local DnD state
  const [localDays, setLocalDays] = useState<Day[]>([]);
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [highlightedSpot, setHighlightedSpot] = useState<Spot | null>(null);

  // UI state
  const [showIGModal, setShowIGModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingSearch, setPendingSearch] = useState<SearchResult | null>(null);
  const [activeView, setActiveView] = useState<"schedule" | "map">("schedule");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Load members first
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // When selected member changes, load their personal itinerary
  useEffect(() => {
    if (selectedMember) {
      fetchItinerary(`personal-${selectedMember.id}`);
    }
  }, [selectedMember?.id, fetchItinerary]);

  // Sync localDays with store (initial load / itinerary switch)
  useEffect(() => {
    if (currentItinerary) {
      setLocalDays(currentItinerary.days);
    }
  }, [currentItinerary?.id, currentItinerary?.updatedAt]);

  // ─── DnD Helpers ──────────────────────────────────────────────────────────

  const findDayOfSpotId = useCallback(
    (spotId: string, days: Day[]): number | null => {
      const bareId = spotId.replace("spot-", "");
      for (const d of days) {
        if (d.spots.some((s) => s.id === bareId || `spot-${s.id}` === spotId)) {
          return d.day;
        }
      }
      return null;
    },
    []
  );

  const getOverDayNumber = useCallback(
    (overId: string, days: Day[]): number | null => {
      if (overId.startsWith("day-")) return parseInt(overId.replace("day-", ""));
      return findDayOfSpotId(overId, days);
    },
    [findDayOfSpotId]
  );

  // ─── DnD Handlers ──────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    // Snapshot current itinerary days for this drag session
    if (currentItinerary) setLocalDays(currentItinerary.days);
    const id = String(active.id);
    setActiveSpotId(id);
    const spotId = id.replace("spot-", "");
    // Use currentItinerary.days for lookup (localDays may not be updated yet)
    const sourceDays = currentItinerary?.days ?? localDays;
    for (const d of sourceDays) {
      const s = d.spots.find((s) => s.id === spotId);
      if (s) {
        setActiveSpot(s);
        break;
      }
    }
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceDay = findDayOfSpotId(activeId, localDays);
    const targetDay = getOverDayNumber(overId, localDays);

    if (!sourceDay || !targetDay || sourceDay === targetDay) return;

    // Cross-day optimistic move
    const spotId = activeId.replace("spot-", "");
    setLocalDays((prev) => {
      const srcDay = prev.find((d) => d.day === sourceDay);
      if (!srcDay) return prev;
      const spot = srcDay.spots.find((s) => s.id === spotId);
      if (!spot) return prev;

      const overSpotId = overId.startsWith("day-")
        ? null
        : overId.replace("spot-", "");

      return prev.map((d) => {
        if (d.day === sourceDay) {
          return { ...d, spots: d.spots.filter((s) => s.id !== spotId) };
        }
        if (d.day === targetDay) {
          const insertIdx = overSpotId
            ? Math.max(0, d.spots.findIndex((s) => s.id === overSpotId))
            : d.spots.length;
          const newSpots = [...d.spots];
          newSpots.splice(insertIdx, 0, spot);
          return { ...d, spots: newSpots };
        }
        return d;
      });
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveSpotId(null);
    setActiveSpot(null);

    if (!over || !currentItinerary) {
      if (currentItinerary) setLocalDays(currentItinerary.days);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const spotId = activeId.replace("spot-", "");

    let finalDays = localDays;

    // Same-day reorder (DragOver doesn't handle same-day)
    const currentDayNum = findDayOfSpotId(activeId, localDays);
    if (currentDayNum && !overId.startsWith("day-")) {
      const overDayNum = findDayOfSpotId(overId, localDays);
      if (overDayNum === currentDayNum) {
        const daySpots = localDays.find((d) => d.day === currentDayNum)!.spots;
        const oldIdx = daySpots.findIndex((s) => s.id === spotId);
        const newIdx = daySpots.findIndex(
          (s) => s.id === overId.replace("spot-", "")
        );
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const reordered = arrayMove(daySpots, oldIdx, newIdx);
          finalDays = localDays.map((d) =>
            d.day === currentDayNum ? { ...d, spots: reordered } : d
          );
          setLocalDays(finalDays);
        }
      }
    }

    // Save with updated order indices
    const daysToSave = finalDays.map((d) => ({
      ...d,
      spots: d.spots.map((s, i) => ({ ...s, order: i })),
    }));
    updateDays(daysToSave);
  };

  // ─── Spot Actions ───────────────────────────────────────────────────────────

  const handleAddSpot = async (day: number, result: SearchResult, type: string, notes: string) => {
    await addSpotToDay(day, {
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      description: "",
      notes: notes,
      type: (type as any) || "attraction",
      placeId: result.placeId,
    });
    setPendingSearch(null);
  };

  const handleDeleteItinerary = async () => {
    if (!currentItinerary) return;
    if (
      !confirm(
        `確定要刪除「${currentItinerary.name}」行程嗎？此操作無法復原。`
      )
    )
      return;
    await deleteItinerary(currentItinerary.id);
    navigate("/");
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const activeSpotDay = activeSpot
    ? localDays
        .find((d) => d.spots.some((s) => s.id === activeSpot.id))
        ?.day ?? 0
    : 0;

  // During drag: use localDays for optimistic cross-day preview
  // Otherwise: use authoritative store data so add/remove spot is instant
  const displayDays = activeSpotId
    ? localDays
    : (currentItinerary?.days ?? []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-gray-50"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      <Navbar itineraryName={currentItinerary?.name} />

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-sm">載入行程資料…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="m-4 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          {isNetworkError && (
            <button
              onClick={retryLoad}
              className="text-sm font-medium underline underline-offset-2 whitespace-nowrap"
            >
              重試
            </button>
          )}
        </div>
      )}

      {/* Main Layout */}
      {!isLoading && currentItinerary && (
        <>
          {/* Mobile tab switcher */}
          <div className="lg:hidden flex border-b border-gray-200 bg-white pt-14">
            <button
              onClick={() => setActiveView("schedule")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeView === "schedule"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              行程排程
            </button>
            <button
              onClick={() => setActiveView("map")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeView === "map"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              <Map className="w-4 h-4" />
              地圖檢視
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex lg:pt-14">
            {/* ── Left: Schedule ── */}
            <div
              className={`${
                activeView === "map" ? "hidden lg:flex" : "flex"
              } lg:flex flex-col w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden`}
            >
              {/* Itinerary header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 text-sm truncate">
                      {currentItinerary.name}
                    </h2>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {currentItinerary.destination}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowIGModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">IG 匯入</span>
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">新行程</span>
                    </button>
                  </div>
                </div>

                {/* Member badge - shows whose itinerary is being edited */}
                {selectedMember && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-200 w-fit">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: selectedMember.avatarColor }}
                    >
                      {selectedMember.name.slice(0, 1)}
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {selectedMember.name} 的個人行程
                    </span>
                  </div>
                )}
              </div>

              {/* Search bar */}
              <div className="px-4 py-3 border-b border-gray-100">
                <SearchBar
                  onSelect={(result) => setPendingSearch(result)}
                  placeholder="搜尋日本景點並加入行程…"
                />
              </div>

              {/* Day panels (scrollable) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  {/* displayDays: during drag use localDays (optimistic cross-day preview)
                      otherwise use the authoritative store data */}
                  {displayDays.map((day, idx) => (
                    <DayPanel
                      key={day.day}
                      day={day}
                      dayColor={DAY_COLORS[idx % DAY_COLORS.length]}
                      onRemoveSpot={(spotId) =>
                        removeSpotFromDay(day.day, spotId)
                      }
                      onHighlightSpot={(spot) => {
                        setHighlightedSpot(spot);
                        if (window.innerWidth < 1024) setActiveView("map");
                      }}
                      onAddSpot={() => {
                        document
                          .querySelector<HTMLInputElement>(
                            'input[placeholder*="搜尋"]'
                          )
                          ?.focus();
                      }}
                      onUpdateSpotTime={updateSpotTime}
                      onUpdateSpotOpenHours={updateSpotOpenHours}
                    />
                  ))}

                  {/* Drag overlay */}
                  <DragOverlay>
                    {activeSpot && (
                      <SortableSpotItem
                        spot={activeSpot}
                        index={
                          localDays
                            .find((d) => d.day === activeSpotDay)
                            ?.spots.findIndex((s) => s.id === activeSpot.id) ??
                          0
                        }
                        dayColor={
                          DAY_COLORS[
                            (activeSpotDay - 1) % DAY_COLORS.length
                          ]
                        }
                        dayNumber={activeSpotDay}
                        isDragOverlay
                        onRemove={() => {}}
                        onHighlight={() => {}}
                      />
                    )}
                  </DragOverlay>
                </DndContext>

                {/* Delete itinerary */}
                <div className="pt-2 pb-4">
                  <button
                    onClick={handleDeleteItinerary}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-dashed border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    刪除此行程
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: Map ── */}
            <div
              className={`${
                activeView === "schedule" ? "hidden lg:flex" : "flex"
              } lg:flex flex-1 flex-col overflow-hidden`}
            >
              {/* Map toolbar */}
              <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">地圖總覽</span>
                  <span className="text-xs text-gray-400">
                    · {displayDays.reduce((a, d) => a + d.spots.length, 0)} 個景點
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {DAY_COLORS.slice(0, displayDays.length).map((color, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span>Day {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 relative">
                <div className="absolute inset-0">
                  <MapView
                    days={displayDays}
                    highlightedSpot={highlightedSpot}
                    onSpotClick={(spot) => setHighlightedSpot(spot)}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Highlighted spot info bar */}
              {highlightedSpot && (
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {highlightedSpot.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {highlightedSpot.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`https://www.google.com/maps?q=${highlightedSpot.lat},${highlightedSpot.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      Google Maps
                    </a>
                    <button
                      onClick={() => setHighlightedSpot(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state - no itinerary */}
      {!isLoading && !currentItinerary && !error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-14">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-blue-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              還沒有行程
            </h2>
            <p className="text-gray-500 text-sm">建立你的第一個旅遊行程</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          >
            <PlusCircle className="w-5 h-5" />
            建立新行程
          </button>
        </div>
      )}

      {/* Modals */}
      {showIGModal && <IGImportModal onClose={() => setShowIGModal(false)} />}

      {showCreateModal && (
        <CreateItineraryModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newId) => {
            setShowCreateModal(false);
            navigate(`/edit/${newId}`);
          }}
        />
      )}

      {pendingSearch && currentItinerary && (
        <AddSpotModal
          result={pendingSearch}
          days={currentItinerary.days}
          onAdd={handleAddSpot}
          onClose={() => setPendingSearch(null)}
        />
      )}
    </div>
  );
}