import { Link, useLocation, useNavigate } from "react-router";
import { MapPin, Edit3, Home, Save, Loader2, LogOut } from "lucide-react";
import { useStore } from "../store/useStore";
import { useAuthStore } from "../store/useAuthStore";
import { MemberSwitcher } from "./MemberSwitcher";

interface NavbarProps {
  itineraryName?: string;
}

export function Navbar({ itineraryName }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSaving } = useStore();
  const { logout } = useAuthStore();
  const isEdit = location.pathname.startsWith("/edit");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: MemberSwitcher + Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <MemberSwitcher />
          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
          <Link
            to="/"
            className="flex items-center gap-1.5 font-bold text-gray-900 hover:text-blue-600 transition-colors flex-shrink-0"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm tracking-tight hidden sm:block">旅遊規劃</span>
          </Link>
        </div>

        {/* Center: itinerary name on edit page */}
        {isEdit && itineraryName && (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0 flex-1 justify-center">
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 flex-shrink-0" />
            ) : (
              <Save className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            )}
            <span className="font-medium truncate max-w-[180px] xl:max-w-[280px]">
              {itineraryName}
            </span>
            {isSaving ? (
              <span className="text-xs text-gray-400 flex-shrink-0">儲存中…</span>
            ) : (
              <span className="text-xs text-green-500 flex-shrink-0">已儲存</span>
            )}
          </div>
        )}

        {/* Right: Nav + Logout */}
        <nav className="flex items-center gap-2 flex-shrink-0">
          {isEdit ? (
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">返回首頁</span>
            </Link>
          ) : (
            <Link
              to="/edit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>編輯行程</span>
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="登出"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}