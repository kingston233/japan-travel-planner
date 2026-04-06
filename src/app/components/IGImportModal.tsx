import { useState } from "react";
import { X, Instagram, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useStore } from "../store/useStore";

interface IGImportModalProps {
  onClose: () => void;
}

export function IGImportModal({ onClose }: IGImportModalProps) {
  const { currentItinerary, igImport } = useStore();
  const [url, setUrl] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValid = url.trim().length > 5;

  const handleImport = async () => {
    if (!isValid || !currentItinerary) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await igImport(selectedDay, url.trim());
      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e.message || "匯入失敗，請稍後再試");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">匯入 Instagram 貼文</h2>
              <p className="text-xs text-gray-500">自動解析打卡地點並加入行程</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Instagram 貼文連結
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/xxxxx/"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 目前為模擬模式，系統將隨機從預設景點庫中匯入一筆地點
            </p>
          </div>

          {currentItinerary && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                加入哪一天
              </label>
              <div className="flex flex-wrap gap-2">
                {currentItinerary.days.map((d) => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedDay === d.day
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Day {d.day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status messages */}
          {status === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              景點已成功加入 Day {selectedDay}！
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!isValid || status === "loading" || status === "success"}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                解析中…
              </>
            ) : (
              <>
                <Instagram className="w-4 h-4" />
                匯入��文
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}