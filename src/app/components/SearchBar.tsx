import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X, MapPin } from "lucide-react";
import type { SearchResult } from "../types/itinerary";

interface SearchBarProps {
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
}

export function SearchBar({
  onSelect,
  placeholder = "搜尋日本景點、餐廳、地址…",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchNominatim = async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("countrycodes", "jp");
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "6");
      url.searchParams.set("accept-language", "zh-TW,ja,en");
      url.searchParams.set("addressdetails", "1");

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "TravelPlannerApp/1.0 (educational use)" },
      });
      const data = await res.json();

      const mapped: SearchResult[] = data.map((item: any) => {
        const namePart =
          item.name ||
          item.address?.amenity ||
          item.address?.tourism ||
          item.address?.road ||
          item.display_name.split(",")[0];

        const addrParts = item.display_name.split(",");
        const shortAddr = addrParts.slice(0, Math.min(3, addrParts.length)).join(",");

        return {
          placeId: String(item.place_id),
          name: namePart,
          address: shortAddr,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || item.class || "other",
        };
      });

      setResults(mapped);
      setShowResults(mapped.length > 0);
    } catch (e) {
      console.error("Nominatim search error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => searchNominatim(value), 600);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 w-4 h-4 text-blue-400 animate-spin pointer-events-none" />
        )}
        {!isSearching && query && (
          <button
            onClick={handleClear}
            className="absolute right-3 w-4 h-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-[1000] max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.placeId}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-none border-gray-100 transition-colors flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">
                  {result.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{result.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
