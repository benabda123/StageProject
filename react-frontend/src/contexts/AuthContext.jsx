import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredTokens,
  extractUser,
  extractUserRole,
  getStoredAccessToken,
  getToken,
  getTokenParsed,
  loginWithPassword,
} from '../services/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenParsed, setTokenParsed] = useState(null);

  const syncFromStorage = useCallback(() => {
    const parsed = getTokenParsed();
    const valid = Boolean(getStoredAccessToken() && parsed);
    setIsAuthenticated(valid);
    setTokenParsed(valid ? parsed : null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const token = await getToken();
      if (cancelled) return;

      if (token) {
        syncFromStorage();
      } else {
        clearStoredTokens();
        setIsAuthenticated(false);
        setTokenParsed(null);
      }
      setIsLoading(false);
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, [syncFromStorage]);

  const login = useCallback(async (username, password) => {
    try {
      await loginWithPassword(username, password);
      syncFromStorage();
      return { success: true };
    } catch (err) {
      const code = err.data?.error;
      if (code === 'invalid_grant' || err.status === 401) {
        return { success: false, error: 'Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.' };
      }
      return { success: false, error: 'Connexion impossible. Veuillez réessayer.' };
    }
  }, [syncFromStorage]);

  const logout = useCallback(() => {
    clearStoredTokens();
    setIsAuthenticated(false);
    setTokenParsed(null);
    window.location.href = '/';
  }, []);

  const userRole = useMemo(() => extractUserRole(tokenParsed), [tokenParsed]);
  const user = useMemo(() => extractUser(tokenParsed), [tokenParsed]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      tokenParsed,
      user,
      userRole,
      login,
      logout,
      getAccessToken: () => getStoredAccessToken(),
    }),
    [isAuthenticated, isLoading, tokenParsed, user, userRole, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
