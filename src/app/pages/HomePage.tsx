import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Globe,
  Calendar,
  MapPin,
  Edit3,
  Loader2,
  AlertCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { useMemberStore } from "../store/useMemberStore";
import { Navbar } from "../components/Navbar";
import { SpotCard } from "../components/SpotCard";
import { MapView } from "../components/MapView";
import { TravelTimeConnector } from "../components/TravelTimeConnector";
import type { Spot } from "../types/itinerary";
import { DAY_COLORS } from "../types/itinerary";

export default function HomePage() {
  const {
    currentItinerary,
    isLoading,
    error,
    isNetworkError,
    fetchItinerary,
    retryLoad,
  } = useStore();

  const { selectedMember, fetchMembers } = useMemberStore();

  const [activeDay, setActiveDay] = useState(1);
  const [highlightedSpot, setHighlightedSpot] = useState<Spot | null>(null);

  // Load members on mount (so selectedMember is available)
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // When selected member changes, load their personal itinerary
  useEffect(() => {
    if (selectedMember) {
      fetchItinerary(`personal-${selectedMember.id}`);
    }
  }, [selectedMember?.id, fetchItinerary]);

  // Reset active day when itinerary changes
  useEffect(() => {
    if (currentItinerary) setActiveDay(1);
  }, [currentItinerary?.id]);

  const currentDayData = currentItinerary?.days.find((d) => d.day === activeDay);
  const allDays = currentItinerary?.days ?? [];
  const totalSpots = allDays.reduce((acc, d) => acc + d.spots.length, 0);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {currentItinerary?.coverImage ? (
          <img
            src={currentItinerary.coverImage}
            alt={currentItinerary.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 md:px-12 md:pb-8">
          {currentItinerary ? (
            <>
              {/* Member badge */}
              {selectedMember && (
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: selectedMember.avatarColor }}
                  >
                    {selectedMember.name.slice(0, 1)}
                  </div>
                  <span className="text-white/80 text-sm font-medium">
                    {selectedMember.name} 的行程
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-white/80 text-sm mb-1">
                <Globe className="w-3.5 h-3.5" />
                <span>{currentItinerary.destination}</span>
              </div>
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">
                {currentItinerary.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {currentItinerary.totalDays} 天行程
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {totalSpots} 個景點
                </span>
                <Link
                  to="/edit"
                  className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  編輯行程
                </Link>
              </div>
            </>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>載入行程中…</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6 pt-8">
        {isLoading && !currentItinerary && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p>正在載入行程資料…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
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

        {/* No member selected prompt */}
        {!isLoading && !selectedMember && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-blue-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-1">請先選擇成員</h2>
              <p className="text-gray-500 text-sm">點選左上角切換身分，查看個人行程</p>
            </div>
          </div>
        )}

        {currentItinerary && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Spots */}
            <div className="lg:col-span-3 space-y-5">
              {/* Day Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {currentItinerary.days.map((day, idx) => {
                  const color = DAY_COLORS[idx % DAY_COLORS.length];
                  const isActive = activeDay === day.day;
                  return (
                    <button
                      key={day.day}
                      onClick={() => {
                        setActiveDay(day.day);
                        setHighlightedSpot(null);
                      }}
                      className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                        isActive
                          ? "text-white shadow-md border-transparent"
                          : "text-gray-600 bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: color, borderColor: color }
                          : {}
                      }
                    >
                      <span className="font-bold">Day {day.day}</span>
                      {day.date && (
                        <span
                          className={`text-xs mt-0.5 ${
                            isActive ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          {new Date(day.date + "T00:00:00").toLocaleDateString(
                            "zh-TW",
                            { month: "numeric", day: "numeric" }
                          )}
                        </span>
                      )}
                      <span
                        className={`text-xs ${
                          isActive ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {day.spots.length} 站
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Spots for active day */}
              {currentDayData && (
                <div className="space-y-0">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-900">
                      Day {currentDayData.day} 行程
                      {currentDayData.date && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          {new Date(
                            currentDayData.date + "T00:00:00"
                          ).toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            weekday: "long",
                          })}
                        </span>
                      )}
                    </h2>
                    <Link
                      to="/edit"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      編輯 <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {currentDayData.spots.length > 0 ? (
                    currentDayData.spots.map((spot, idx) => (
                      <div key={spot.id}>
                        <SpotCard
                          spot={spot}
                          index={idx}
                          dayColor={DAY_COLORS[(activeDay - 1) % DAY_COLORS.length]}
                          onHighlight={(s) => setHighlightedSpot(s)}
                        />
                        {idx < currentDayData.spots.length - 1 && (
                          <TravelTimeConnector
                            from={spot}
                            to={currentDayData.spots[idx + 1]}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                      <MapPin className="w-8 h-8 mb-2 opacity-40" />
                      <p className="text-sm">這天還沒有安排景點</p>
                      <Link
                        to="/edit"
                        className="mt-3 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        前往編輯頁新增景點
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Map */}
            <div className="lg:col-span-2">
              <div className="sticky top-20">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  行程地圖
                  <span className="text-xs font-normal text-gray-400">
                    (Day {activeDay})
                  </span>
                </h3>
                <div
                  className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                  style={{ height: 400 }}
                >
                  <MapView
                    days={currentDayData ? [currentDayData] : []}
                    highlightedSpot={highlightedSpot}
                    onSpotClick={(s) => setHighlightedSpot(s)}
                    className="w-full h-full"
                  />
                </div>

                {/* All-days mini overview */}
                {allDays.length > 1 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500">
                      全程行程概覽
                    </p>
                    <div
                      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                      style={{ height: 200 }}
                    >
                      <MapView days={allDays} className="w-full h-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
