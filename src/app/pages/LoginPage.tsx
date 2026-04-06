import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, MapPin, Loader2, AlertCircle, Lock, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1724063781332-0221499bd113?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMEphcGFuJTIwbmlnaHQlMjBjaXR5JTIwbGlnaHRzfGVufDF8fHx8MTc3NTQ0ODY0OXww&ixlib=rb-4.1.0&q=80&w=1080";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, loginError, isAuthenticated, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  // Shake animation on error
  useEffect(() => {
    if (loginError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [loginError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch {
      // error is handled in store
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={BG_IMAGE}
          alt="Tokyo night"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-indigo-900/60" />
      </div>

      {/* Floating particles (decorative) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 blur-xl"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              top: `${10 + i * 15}%`,
              left: `${5 + i * 16}%`,
              animation: `float ${4 + i}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">旅遊規劃</h1>
          <p className="text-white/60 text-sm">東京行程 🇯🇵 · 4/23–4/28</p>
        </div>

        {/* Card */}
        <div
          className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-transform ${
            shake ? "animate-[shake_0.5s_ease-in-out]" : ""
          }`}
        >
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">成員登入</h2>
            <p className="text-white/50 text-sm mt-1">輸入帳號密碼以進入行程</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Error message */}
            {loginError && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">
                帳號
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); }}
                  placeholder="輸入帳號"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="輸入密碼"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoggingIn || !username.trim() || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] text-sm mt-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登入中…
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  進入行程
                </>
              )}
            </button>
          </form>

          {/* Card footer */}
          <div className="px-8 pb-6">
            <p className="text-center text-white/30 text-xs">
              預設帳號與密碼均為{" "}
              <span className="text-white/50 font-mono font-bold">26</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          東京深度探索 · 2026
        </p>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
