import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2, MapPin } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isChecking, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isChecking, isAuthenticated, navigate]);

  // Loading state while verifying session
  if (isChecking) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4"
        style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">驗證身分中…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
