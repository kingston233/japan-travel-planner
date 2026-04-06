import { create } from "zustand";
import { api } from "../lib/api";
import type {
  Itinerary,
  ItineraryMeta,
  Spot,
  CreateItineraryInput,
  Day,
} from "../types/itinerary";

interface Store {
  // State
  itineraries: ItineraryMeta[];
  currentItinerary: Itinerary | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isNetworkError: boolean;

  // Actions
  fetchItineraries: () => Promise<void>;
  fetchItinerary: (id: string) => Promise<void>;
  retryLoad: () => Promise<void>;
  createItinerary: (data: CreateItineraryInput) => Promise<Itinerary>;
  updateItinerary: (id: string, data: Partial<Itinerary>) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
  addSpotToDay: (day: number, spot: Omit<Spot, "id" | "order">) => Promise<void>;
  removeSpotFromDay: (day: number, spotId: string) => Promise<void>;
  updateSpotTime: (day: number, spotId: string, arrivalTime?: string, departureTime?: string) => Promise<void>;
  updateSpotOpenHours: (day: number, spotId: string, openTime?: string, closeTime?: string) => Promise<void>;
  updateDays: (days: Day[]) => Promise<void>;
  igImport: (day: number, igUrl: string) => Promise<void>;
  setCurrentItinerary: (it: Itinerary | null) => void;
  clearError: () => void;
}

export const useStore = create<Store>((set, get) => ({
  itineraries: [],
  currentItinerary: null,
  isLoading: false,
  isSaving: false,
  error: null,
  isNetworkError: false,

  fetchItineraries: async () => {
    set({ isLoading: true, error: null, isNetworkError: false });
    try {
      const list = await api.listItineraries();
      set({ itineraries: list, isLoading: false });
    } catch (e: any) {
      console.error("fetchItineraries:", e);
      const isNetwork = !e?.message?.startsWith("API error");
      set({
        error: isNetwork
          ? "無法連線到伺服器，請稍後再試"
          : e.message,
        isNetworkError: isNetwork,
        isLoading: false,
      });
    }
  },

  fetchItinerary: async (id) => {
    set({ isLoading: true, error: null, isNetworkError: false });
    try {
      const it = await api.getItinerary(id);
      set({ currentItinerary: it, isLoading: false });
    } catch (e: any) {
      console.error("fetchItinerary:", e);
      if (e.message?.includes("404")) {
        // Clear both currentItinerary and itineraries list so the UI
        // triggers a full refresh and picks a fresh valid itinerary
        set({ currentItinerary: null, itineraries: [], isLoading: false });
      } else {
        const isNetwork = !e?.message?.startsWith("API error");
        set({
          error: isNetwork ? "無法連線到伺服器，請稍後再試" : e.message,
          isNetworkError: isNetwork,
          isLoading: false,
        });
      }
    }
  },

  retryLoad: async () => {
    const { fetchItineraries } = get();
    await fetchItineraries();
  },

  createItinerary: async (data) => {
    set({ isSaving: true });
    try {
      const it = await api.createItinerary(data);
      set((s) => ({
        itineraries: [
          ...s.itineraries,
          {
            id: it.id,
            name: it.name,
            description: it.description,
            destination: it.destination,
            totalDays: it.totalDays,
            coverImage: it.coverImage,
            createdAt: it.createdAt,
          },
        ],
        currentItinerary: it,
        isSaving: false,
      }));
      return it;
    } catch (e: any) {
      console.error("createItinerary:", e);
      set({ isSaving: false, error: e.message });
      throw e;
    }
  },

  updateItinerary: async (id, data) => {
    set({ isSaving: true });
    try {
      const updated = await api.updateItinerary(id, data);
      set((s) => ({
        currentItinerary:
          s.currentItinerary?.id === id ? updated : s.currentItinerary,
        itineraries: s.itineraries.map((i) =>
          i.id === id
            ? {
                ...i,
                name: updated.name,
                description: updated.description,
                destination: updated.destination,
                totalDays: updated.totalDays,
                coverImage: updated.coverImage,
              }
            : i
        ),
        isSaving: false,
      }));
    } catch (e: any) {
      console.error("updateItinerary:", e);
      set({ isSaving: false, error: e.message });
      throw e;
    }
  },

  deleteItinerary: async (id) => {
    set({ isSaving: true });
    try {
      await api.deleteItinerary(id);
      set((s) => ({
        itineraries: s.itineraries.filter((i) => i.id !== id),
        currentItinerary:
          s.currentItinerary?.id === id ? null : s.currentItinerary,
        isSaving: false,
      }));
    } catch (e: any) {
      console.error("deleteItinerary:", e);
      set({ isSaving: false, error: e.message });
      throw e;
    }
  },

  addSpotToDay: async (day, spotData) => {
    const { currentItinerary } = get();
    if (!currentItinerary) return;

    const newSpot: Spot = {
      ...spotData,
      id: `spot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      order:
        currentItinerary.days.find((d) => d.day === day)?.spots.length ?? 0,
    };

    const updatedDays = currentItinerary.days.map((d) =>
      d.day === day ? { ...d, spots: [...d.spots, newSpot] } : d
    );

    set({ currentItinerary: { ...currentItinerary, days: updatedDays } });
    set({ isSaving: true });
    try {
      await api.updateItinerary(currentItinerary.id, { days: updatedDays });
    } catch (e: any) {
      console.error("addSpotToDay:", e);
    } finally {
      set({ isSaving: false });
    }
  },

  removeSpotFromDay: async (day, spotId) => {
    const { currentItinerary } = get();
    if (!currentItinerary) return;

    const updatedDays = currentItinerary.days.map((d) =>
      d.day === day
        ? {
            ...d,
            spots: d.spots
              .filter((s) => s.id !== spotId)
              .map((s, i) => ({ ...s, order: i })),
          }
        : d
    );

    set({ currentItinerary: { ...currentItinerary, days: updatedDays } });
    set({ isSaving: true });
    try {
      await api.updateItinerary(currentItinerary.id, { days: updatedDays });
    } catch (e: any) {
      console.error("removeSpotFromDay:", e);
    } finally {
      set({ isSaving: false });
    }
  },

  updateSpotOpenHours: async (day, spotId, openTime, closeTime) => {
    const { currentItinerary } = get();
    if (!currentItinerary) return;
    const updatedDays = currentItinerary.days.map((d) =>
      d.day !== day
        ? d
        : {
            ...d,
            spots: d.spots.map((s) =>
              s.id !== spotId ? s : { ...s, openTime, closeTime }
            ),
          }
    );
    set({ currentItinerary: { ...currentItinerary, days: updatedDays }, isSaving: true });
    try {
      await api.updateItinerary(currentItinerary.id, { days: updatedDays });
    } catch (e: any) {
      console.error("updateSpotOpenHours:", e);
    } finally {
      set({ isSaving: false });
    }
  },

  updateDays: async (days) => {
    const { currentItinerary } = get();
    if (!currentItinerary) return;
    const updated = { ...currentItinerary, days };
    set({ currentItinerary: updated, isSaving: true });
    try {
      await api.updateItinerary(currentItinerary.id, { days });
    } catch (e: any) {
      console.error("updateDays:", e);
    } finally {
      set({ isSaving: false });
    }
  },

  updateSpotTime: async (day, spotId, arrivalTime, departureTime) => {
    const { currentItinerary } = get();
    if (!currentItinerary) return;

    const updatedDays = currentItinerary.days.map((d) =>
      d.day !== day
        ? d
        : {
            ...d,
            spots: d.spots.map((s) =>
              s.id !== spotId
                ? s
                : { ...s, arrivalTime, departureTime }
            ),
          }
    );

    set({ currentItinerary: { ...currentItinerary, days: updatedDays }, isSaving: true });
    try {
      await api.updateItinerary(currentItinerary.id, { days: updatedDays });
    } catch (e: any) {
      console.error("updateSpotTime:", e);
    } finally {
      set({ isSaving: false });
    }
  },

  igImport: async (day, igUrl) => {
    const { currentItinerary } = get();
    if (!currentItinerary) return;
    set({ isSaving: true });
    try {
      const { itinerary } = await api.igImport(
        currentItinerary.id,
        day,
        igUrl
      );
      set({ currentItinerary: itinerary, isSaving: false });
    } catch (e: any) {
      console.error("igImport:", e);
      set({ isSaving: false, error: e.message });
      throw e;
    }
  },

  setCurrentItinerary: (it) => set({ currentItinerary: it }),
  clearError: () => set({ error: null, isNetworkError: false }),
}));