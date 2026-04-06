export interface Spot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  notes: string;
  imageUrl?: string;
  type: "attraction" | "restaurant" | "hotel" | "shopping" | "ig" | "transport" | "other";
  order: number;
  placeId?: string;
  arrivalTime?: string;    // "HH:mm"
  departureTime?: string;  // "HH:mm"
  openTime?: string;       // "HH:mm" 開放時間
  closeTime?: string;      // "HH:mm" 關閉時間
}

export interface Day {
  day: number;
  date?: string;
  spots: Spot[];
}

export interface ItineraryMeta {
  id: string;
  name: string;
  description: string;
  destination: string;
  totalDays: number;
  coverImage?: string;
  createdAt: string;
}

export interface Itinerary extends ItineraryMeta {
  days: Day[];
  updatedAt: string;
}

export interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
}

export interface CreateItineraryInput {
  name: string;
  description: string;
  destination: string;
  totalDays: number;
  startDate?: string;
  coverImage?: string;
}

export const DAY_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

export const SPOT_TYPE_LABELS: Record<string, string> = {
  attraction: "景點",
  restaurant: "餐廳",
  hotel: "住宿",
  shopping: "購物",
  ig: "IG 打卡",
  transport: "交通",
  other: "其他",
};

export const SPOT_TYPE_COLORS: Record<string, string> = {
  attraction: "bg-blue-100 text-blue-700",
  restaurant: "bg-orange-100 text-orange-700",
  hotel: "bg-green-100 text-green-700",
  shopping: "bg-purple-100 text-purple-700",
  ig: "bg-pink-100 text-pink-700",
  transport: "bg-sky-100 text-sky-700",
  other: "bg-gray-100 text-gray-700",
};