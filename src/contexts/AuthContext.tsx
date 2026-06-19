'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { isAuthenticated, login as doLogin, logout as doLogout } from '@/lib/auth';

interface AuthContextType {
  authenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  function login(password: string) {
    const ok = doLogin(password);
    if (ok) setAuthenticated(true);
    return ok;
  }

  function logout() {
    doLogout();
    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
