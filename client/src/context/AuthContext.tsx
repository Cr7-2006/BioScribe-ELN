import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchUser: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bioscribe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bioscribe_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('bioscribe_token');
      if (savedToken) {
        try {
          const data = await apiRequest<{ user: User }>('/auth/me');
          setUser(data.user);
          localStorage.setItem('bioscribe_user', JSON.stringify(data.user));
        } catch {
          logout();
        }
      } else {
        // Auto-login as Kamalesh (Lead Researcher) for immediate zero-friction demo experience
        try {
          await login('kamalesh@bioscribe.io', 'Password123!');
        } catch {
          try {
            await login('elena.vance@bioscribe.io', 'Password123!');
          } catch {
            // Ignore
          }
        }
      }
      setIsLoading(false);
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

  const login = async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('bioscribe_token', data.token);
      localStorage.setItem('bioscribe_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (role: UserRole) => {
    let email = 'kamalesh@bioscribe.io';
    if (role === 'reviewer') email = 'thameem@bioscribe.io';
    if (role === 'qa_manager') email = 'subbu@bioscribe.io';
    if (role === 'admin') email = 'admin@bioscribe.io';

    await login(email, 'Password123!');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bioscribe_token');
    localStorage.removeItem('bioscribe_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
      localStorage.setItem('bioscribe_user', JSON.stringify(data.user));
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
