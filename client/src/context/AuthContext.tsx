import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  switchUser: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getSafeSavedUser(): User | null {
  try {
    const saved = localStorage.getItem('bioscribe_user');
    if (!saved || saved === 'undefined' || saved === 'null') {
      return null;
    }
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object' && parsed.id) {
      return parsed;
    }
    return null;
  } catch {
    localStorage.removeItem('bioscribe_user');
    return null;
  }
}

function getSafeSavedToken(): string | null {
  try {
    const saved = localStorage.getItem('bioscribe_token');
    if (!saved || saved === 'undefined' || saved === 'null') {
      return null;
    }
    return saved;
  } catch {
    localStorage.removeItem('bioscribe_token');
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getSafeSavedUser);
  const [token, setToken] = useState<string | null>(getSafeSavedToken);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = getSafeSavedToken();
        if (savedToken) {
          const data = await apiRequest<{ user: User }>('/auth/me');
          if (data && data.user && data.user.id) {
            setUser(data.user);
            localStorage.setItem('bioscribe_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        }
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    initAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('bioscribe_token', data.token);
        localStorage.setItem('bioscribe_user', JSON.stringify(data.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (_role: UserRole) => {
    logout();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('bioscribe_token');
      localStorage.removeItem('bioscribe_user');
    } catch {
      // ignore
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('bioscribe_user', JSON.stringify(data.user));
      }
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        switchUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
