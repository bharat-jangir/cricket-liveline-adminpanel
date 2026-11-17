import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import axiosInstance from '../lib/axios';
import { clearToken, getToken, setToken, AUTH_EXPIRED_EVENT } from '../lib/auth-token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** true while the stored token is being validated on first load */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Validate any stored token once on startup
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    axiosInstance
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data?.data?.user || null);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Any 401 from the API (expired token) signs the user out
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await axiosInstance.post('/auth/login', { email, password });
    const data = res.data?.data;
    if (!data?.accessToken) throw new Error('Login failed');
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
