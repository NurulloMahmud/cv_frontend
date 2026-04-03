import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, tokenStorage } from '@/services/api';
import type { ApiUser } from '@shared/api';

interface AuthContextType {
  user: ApiUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if we have a stored access token, fetch the profile to restore session
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi.getProfile()
      .then(({ data }) => setUser(data))
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });
    setUser(data.user);
  }, []);

  const register = useCallback(async (firstName: string, email: string, password: string) => {
    const nameParts = firstName.trim().split(' ');
    const first_name = nameParts[0] ?? '';
    const last_name = nameParts.slice(1).join(' ');
    const { data } = await authApi.register({ email, password, first_name, last_name });
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    if (refresh) {
      try { await authApi.logout(refresh); } catch { /* ignore */ }
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
