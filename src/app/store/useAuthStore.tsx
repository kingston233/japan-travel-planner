import { create } from "zustand";
import { api } from "../lib/api";

const TOKEN_KEY = "travel:auth:token";

interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  isChecking: boolean;  // initial session check
  isLoggingIn: boolean;
  loginError: string | null;

  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  username: null,
  token: null,
  isChecking: true,
  isLoggingIn: false,
  loginError: null,

  checkAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isChecking: false, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.verifySession(token);
      if (res.valid) {
        set({ isAuthenticated: true, username: res.username ?? null, token, isChecking: false });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        set({ isAuthenticated: false, token: null, isChecking: false });
      }
    } catch {
      // Network error - treat as not authenticated
      localStorage.removeItem(TOKEN_KEY);
      set({ isAuthenticated: false, token: null, isChecking: false });
    }
  },

  login: async (username, password) => {
    set({ isLoggingIn: true, loginError: null });
    try {
      const res = await api.login(username, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      set({
        isAuthenticated: true,
        username: res.username,
        token: res.token,
        isLoggingIn: false,
        loginError: null,
      });
    } catch (e: any) {
      const msg = e?.message?.includes("401")
        ? "帳號或密碼錯誤"
        : e?.message?.includes("400")
        ? "請輸入帳號和密碼"
        : "登入失敗，請稍後再試";
      set({ isLoggingIn: false, loginError: msg });
      throw e;
    }
  },

  logout: async () => {
    const { token } = get();
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // ignore
      }
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ isAuthenticated: false, username: null, token: null });
  },

  clearError: () => set({ loginError: null }),
}));
